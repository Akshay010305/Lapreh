const test = require('node:test');
const assert = require('node:assert/strict');

const { generateVerificationCode, buildVerificationEmail } = require('../src/utils/emailAuth');

test('generateVerificationCode returns a 6-digit string', () => {
  const code = generateVerificationCode();
  assert.match(code, /^\d{6}$/);
});

test('buildVerificationEmail includes the code and a friendly message', () => {
  const email = buildVerificationEmail('Ava', '123456', 10);
  assert.match(email.subject, /verify/i);
  assert.match(email.text, /123456/);
  assert.match(email.html, /123456/);
  assert.match(email.text, /Ava/);
});
