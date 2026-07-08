const fs = require('fs');
const path = '/app/dist/routes/concepts.js';
let s = fs.readFileSync(path, 'utf8');

const marker = 'exports.default = conceptRoutes;';
const markerCount = s.split(marker).length - 1;
if (markerCount !== 1) { console.error('MARKER_MISMATCH', markerCount); process.exit(1); }
const mi = s.indexOf(marker);
const before = s.slice(0, mi);
const closeIdx = before.lastIndexOf('\n}');
if (closeIdx === -1) { console.error('CLOSE_NOT_FOUND'); process.exit(1); }
const insertPos = closeIdx + 1; // position right at '}'
const check = s.slice(insertPos, insertPos + 3);
if (check[0] !== '}') { console.error('UNEXPECTED_CHAR', JSON.stringify(check)); process.exit(1); }

const newRoute = `    fastify.post('/concepts/suggestions/reorder-batch', auth, async (req, reply) => {
        const { ids } = req.body || {};
        if (!Array.isArray(ids) || ids.length < 2) {
            return reply.status(400).send({ error: 'ids array with at least 2 items required' });
        }
        const rows = await fastify.prisma.concept_suggestions.findMany({ where: { id: { in: ids } } });
        if (rows.length !== ids.length) {
            return reply.status(404).send({ error: 'Some suggestions not found' });
        }
        const byId = {};
        rows.forEach((r) => { byId[r.id] = r; });
        const first = byId[ids[0]];
        for (const id of ids) {
            const r = byId[id];
            if (r.channel_id !== first.channel_id || r.status !== first.status) {
                return reply.status(400).send({ error: 'All items must share the same channel and status' });
            }
        }
        const timestamps = ids.map((id) => byId[id].created_at).sort((a, b) => a.getTime() - b.getTime());
        const updates = ids.map((id, i) => fastify.prisma.concept_suggestions.update({ where: { id }, data: { created_at: timestamps[i] } }));
        await fastify.prisma.$transaction(updates);
        return { success: true };
    });
`;

s = s.slice(0, insertPos) + newRoute + s.slice(insertPos);
fs.writeFileSync(path, s);
console.log('concepts.js patched OK');
