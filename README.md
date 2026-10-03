# Juice Login Lab

A small HTML/CSS/JavaScript login page inspired by OWASP Juice Shop, with a Node.js server and SQLite credential verification. This is a separate educational application, not a modification of Juice Shop.

## Requirements and running

Install **Node.js 24.x** from https://nodejs.org/en/download. No third-party npm packages are needed. Open a terminal in this directory (the one containing package.json):

```sh
node --version
npm run setup
npm start
```

Setup creates a local `data/users.sqlite` database and prints a random password for `student@example.com`. Save that password privately. Visit **http://127.0.0.1:3001**. Keep the server terminal open; Ctrl+C stops it. Do not double-click index.html or use GitHub Pages: the server is required.

To reset a forgotten demo password, stop the server, delete only this project's `data/users.sqlite`, and run setup again. This removes the local demo account. Never use real passwords in this lab.

## Implementation

- `public/index.html`: labeled email/password inputs and login button.
- `public/app.js`: rejects empty values, checks email contains `@`, checks password length, and calls the API. `novalidate` makes these JavaScript checks visible rather than using the browser's validation popups.
- `security.mjs`: independent server validation and salted scrypt password hashing (N=131072, r=8, p=1; 64-byte derived key). Scrypt is used instead of bcrypt; both are password-hashing approaches, and OWASP recommends scrypt when Argon2id is unavailable.
- `server.mjs`: POST `/api/login`, parameterized SQLite lookup, generic failure messages, safe static file allowlist, CSP, bounded request size, and one concurrent password comparison.
- `setup.mjs`: generates a demo credential and stores only its salt and derived hash.

Passwords are never inserted into SQL or echoed to the page. The submitted email is rendered using `textContent`, which treats it as text. Client checks improve usability; the server is the trust boundary. The server uses a stricter, intentionally limited email format policy, not a full international email validator.

## Tests

```sh
npm test
```

The test creates an in-memory database and temporary loopback server. It checks missing/incorrectly typed values, malformed email, short passwords, wrong/nonexistent credentials, successful verification, and delivery of the page. Manual attack steps are in the separately supplied assignment guide; automated tests do not certify comprehensive security.

## Scope and limitations

This demonstrates credential checking, not a production authentication system: it creates no session, authorization layer, registration endpoint, account recovery, MFA, persistent brute-force rate limit, or HTTPS deployment. It binds to loopback only. The single-comparison limit prevents parallel hashing in this lab; it is not a complete rate-limiting solution. Eight characters meets the assignment; production password policies need a separate design. Do not deploy it publicly as an authentication service.

The public repository should contain source code only. `.gitignore` excludes data, secrets, and logs. GitHub browser uploads do not enforce `.gitignore`: manually exclude the data folder.

## References

- https://github.com/juice-shop/juice-shop
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- https://nodejs.org/docs/latest-v24.x/api/sqlite.html
