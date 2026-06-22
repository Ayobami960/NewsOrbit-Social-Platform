const nodemailer = require('nodemailer');
const env = require('../lib/env');

async function tryPort(port, secure) {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { rejectUnauthorized: env.NODE_ENV === 'production' },
    logger: true,
    debug: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  console.log(`\nTrying ${env.SMTP_HOST}:${port} secure=${secure}`);
  try {
    await transport.verify();
    console.log(`Success on port ${port}`);
  } catch (err) {
    console.error(`Error on port ${port}:`, err);
  }
}

(async () => {
  await tryPort(parseInt(env.SMTP_PORT, 10) || 465, env.SMTP_SECURE === true || env.SMTP_SECURE === 'true');
  await tryPort(587, false);
})();
