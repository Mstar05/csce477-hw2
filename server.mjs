import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { hashPassword, verifyPassword, validateLogin } from './security.mjs';
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
].map(([route, [file, type]]) => [route, { data: readFileSync(new URL(`./public/${file}`, import.meta.url)), type }]));
export async function createApp(db) {
  const lookup = db.prepare('SELECT salt, hash FROM users WHERE email = ?');
  const dummy = await hashPassword('unused-dummy-comparison');
  let checking = false; // Bound expensive hashing to one concurrent request for this small local lab.
  return http.createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, message) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ message })); };
    if (req.method === 'GET' && assets.has(req.url)) {
      const asset = assets.get(req.url); res.writeHead(200, { 'Content-Type': asset.type }); return res.end(asset.data);
    }
    if (req.url !== '/api/login' || req.method !== 'POST') return send(404, 'Not found.');
    if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return send(415, 'Use application/json.');
    try {
      let size = 0; const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8192) { send(413, 'Request too large.'); return; }
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return send(400, 'Invalid JSON.'); }
      const error = validateLogin(body);
      if (error) return send(400, error);
      if (checking) return send(429, 'Another login is being checked. Try again shortly.');
      checking = true;
      try {
        const record = lookup.get(body.email.trim().toLowerCase());
        const valid = await verifyPassword(body.password, record ?? dummy);
        if (!record || !valid) return send(401, 'Invalid email or password.');
        return send(200, 'Credentials verified. This lab does not create a session.');
      } finally { checking = false; }
    } catch { if (!res.headersSent) send(500, 'Unable to process request.'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const db = new DatabaseSync(new URL('./data/users.sqlite', import.meta.url), { readOnly: true });
    const app = await createApp(db);
    app.listen(3001, '127.0.0.1', () => console.log('Open http://127.0.0.1:3001'));
    app.on('error', error => { console.error(error.message); process.exitCode = 1; });
  } catch { console.error('Run npm run setup first. Node.js 24 is required.'); process.exitCode = 1; }
}
