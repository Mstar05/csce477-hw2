import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await derive(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return { salt, hash: hash.toString('hex') };
}
export async function verifyPassword(password, record) {
  const actual = await hashPassword(password, record.salt);
  return timingSafeEqual(Buffer.from(actual.hash, 'hex'), Buffer.from(record.hash, 'hex'));
}
export function validateLogin(body) {
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') return 'Email and password are required.';
  const email = body.email.trim();
  if (!email || !body.password.trim()) return 'Email and password are required.';
  // A deliberately simple format policy, not a complete RFC email parser.
  if (email.length > 254 || !/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email)) return 'Enter a valid email address.';
  if (body.password.length < 8 || body.password.length > 128) return 'Password must be 8–128 characters.';
  return null;
}
