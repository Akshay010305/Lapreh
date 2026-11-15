const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateVerificationCode,
  buildVerificationEmail,
  sendVerificationEmail,
} = require('../src/utils/emailAuth');

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

test('sendVerificationEmail uses the Resend API when configured', async () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
  };
  const originalFetch = global.fetch;
  let request;

  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.MAIL_FROM = 'Lapreh <no-reply@example.com>';
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true };
  };

  try {
    await sendVerificationEmail({ to: 'ava@example.com', name: 'Ava', code: '123456' });
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(request.options.headers.Authorization, 'Bearer test-api-key');
    assert.equal(JSON.parse(request.options.body).to, 'ava@example.com');
    assert.match(JSON.parse(request.options.body).text, /123456/);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
