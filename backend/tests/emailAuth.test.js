const test = require('node:test');
const assert = require('node:assert/strict');
const { google } = require('googleapis');

const {
  buildGmailRawMessage,
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

test('buildGmailRawMessage encodes a MIME message as base64url', async () => {
  const raw = await buildGmailRawMessage({
    from: 'sender@gmail.com',
    to: 'ava@example.com',
    subject: 'Verify your account',
    text: 'Code: 123456',
    html: '<p>Code: 123456</p>',
  });
  const message = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

  assert.match(raw, /^[A-Za-z0-9_-]+$/);
  assert.match(message, /From: sender@gmail\.com/);
  assert.match(message, /To: ava@example\.com/);
  assert.match(message, /123456/);
});

test('sendVerificationEmail uses the Resend API when configured', async () => {
  const originalEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAIL_FROM: process.env.MAIL_FROM,
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    GMAIL_USER: process.env.GMAIL_USER,
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

test('sendVerificationEmail uses Gmail API when configured', async () => {
  const envKeys = [
    'RESEND_API_KEY',
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_USER',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
  ];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const originalOAuth2 = google.auth.OAuth2;
  const originalGmail = google.gmail;
  let request;

  delete process.env.RESEND_API_KEY;
  process.env.GMAIL_CLIENT_ID = 'client-id';
  process.env.GMAIL_CLIENT_SECRET = 'client-secret';
  process.env.GMAIL_REFRESH_TOKEN = 'refresh-token';
  process.env.GMAIL_USER = 'sender@gmail.com';
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;

  google.auth.OAuth2 = class {
    setCredentials(credentials) {
      assert.equal(credentials.refresh_token, 'refresh-token');
    }
  };
  google.gmail = ({ version, auth }) => {
    assert.equal(version, 'v1');
    assert.ok(auth);
    return {
      users: {
        messages: {
          send: async (options) => {
            request = options;
          },
        },
      },
    };
  };

  try {
    await sendVerificationEmail({ to: 'ava@example.com', name: 'Ava', code: '123456' });
    assert.equal(request.userId, 'me');
    const message = Buffer.from(request.requestBody.raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    assert.match(message, /From: sender@gmail\.com/);
    assert.match(message, /To: ava@example\.com/);
    assert.match(message, /123456/);
  } finally {
    google.auth.OAuth2 = originalOAuth2;
    google.gmail = originalGmail;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
