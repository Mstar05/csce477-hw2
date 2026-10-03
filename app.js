const form = document.querySelector('#login-form');
const message = document.querySelector('#message');
const submitted = document.querySelector('#submitted');
function validateForm(email, password) {
  if (!email.trim() || !password.trim()) return 'Email and password cannot be empty.';
  if (!email.includes('@')) return 'Email must contain @.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password must be at most 128 characters.';
  return null;
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  // Never interpret submitted input as HTML.
  submitted.textContent = `Last submitted email: ${email}`;
  const error = validateForm(email, password);
  if (error) { message.textContent = error; return; }
  const button = form.querySelector('button'); button.disabled = true;
  message.textContent = 'Checking credentials…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    message.textContent = `HTTP ${response.status}: ${result.message}`;
  } catch { message.textContent = 'Cannot reach the server. Make sure npm start is running.'; }
  finally { button.disabled = false; form.elements.password.value = ''; }
});
