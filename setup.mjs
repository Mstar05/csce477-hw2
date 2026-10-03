import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { hashPassword } from './security.mjs';
mkdirSync(new URL('./data/', import.meta.url), { recursive: true });
const db = new DatabaseSync(new URL('./data/users.sqlite', import.meta.url));
db.exec('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL)');
const email = 'student@example.com';
if (db.prepare('SELECT email FROM users WHERE email = ?').get(email)) {
  console.log('Demo account already exists. See README for resetting your local demo database.');
} else {
  const password = randomBytes(18).toString('base64url');
  const { salt, hash } = await hashPassword(password);
  db.prepare('INSERT INTO users (email, salt, hash) VALUES (?, ?, ?)').run(email, salt, hash);
  console.log(`Local demo email: ${email}\nLocal demo password (save privately): ${password}`);
}
db.close();
