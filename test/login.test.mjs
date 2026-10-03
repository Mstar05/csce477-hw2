import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword, validateLogin } from '../security.mjs';
import { createApp } from '../server.mjs';
test('server validates independently and verifies hashed credentials', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE users (email TEXT PRIMARY KEY, salt TEXT, hash TEXT)');
  const record = await hashPassword('TestPassword123!');
  assert.notEqual(record.hash, 'TestPassword123!');
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('student@example.com', record.salt, record.hash);
  const app = await createApp(db);
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${app.address().port}`;
  async function login(body) { return fetch(url + '/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); }
  try {
    assert.equal((await fetch(url)).status, 200);
    for (const body of [{}, {email:42,password:'TestPassword123!'}, {email:'student.example.com',password:'TestPassword123!'}, {email:'student@example.com',password:'short'}]) assert.equal((await login(body)).status,400);
    assert.equal((await login({email:'student@example.com',password:'WrongPassword123!'})).status,401);
    assert.equal((await login({email:'missing@example.com',password:'TestPassword123!'})).status,401);
    assert.equal((await login({email:'student@example.com',password:'TestPassword123!'})).status,200);
    assert.equal(validateLogin({email:'student@example.com',password:'TestPassword123!'}),null);
  } finally { await new Promise(resolve => app.close(resolve)); db.close(); }
});
