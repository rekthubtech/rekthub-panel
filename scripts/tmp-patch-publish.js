const fs = require('fs');
const path = '/app/dist/workers/publishWorker.js';
let s = fs.readFileSync(path, 'utf8');

const uploadAnchor = 'const { videoId } = await (0, youtube_1.uploadVideo)(encryptedToken, {';
const uploadCount = s.split(uploadAnchor).length - 1;
if (uploadCount !== 1) { console.error('UPLOAD_ANCHOR_MISMATCH', uploadCount); process.exit(1); }

const descAnchor = "description: item.description ?? '',";
const descCount = s.split(descAnchor).length - 1;
if (descCount !== 1) { console.error('DESC_ANCHOR_MISMATCH', descCount); process.exit(1); }

const tagsCompute = "const __hashtagMatches = (item.description || '').match(/#[\\w]+/g) || [];\n\t\t\tconst __videoTags = __hashtagMatches.map((h) => h.slice(1)).slice(0, 20);\n\t\t\t";
s = s.replace(uploadAnchor, tagsCompute + uploadAnchor);

s = s.replace(descAnchor, descAnchor + '\n\t\t\t\ttags: __videoTags,');

fs.writeFileSync(path, s);
console.log('publishWorker.js patched OK');
