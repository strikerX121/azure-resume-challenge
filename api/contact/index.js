// Azure Static Web Apps API — Contact Form Handler
// TODO: Replace the console.log with real email sending via SendGrid or Azure Communication Services

module.exports = async function (context, req) {
  context.log('Contact form submission received');

  if (req.method !== 'POST') {
    context.res = { status: 405, body: { error: 'Method not allowed' } };
    return;
  }

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    context.res = {
      status: 400,
      body: { error: 'Missing required fields: name, email, message' },
    };
    return;
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    context.res = { status: 400, body: { error: 'Invalid email address' } };
    return;
  }

  // TODO: Send email via SendGrid or Azure Communication Services
  // Example SendGrid integration:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: 'antonio@antoniocumberbatch.com',
  //   from: 'noreply@antoniocumberbatch.com',
  //   subject: `[Contact] ${subject} — from ${name}`,
  //   text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
  // });

  context.log(`Contact form: ${name} <${email}> — ${subject}`);

  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { success: true, message: 'Message received. I will reply within 48 hours.' },
  };
};
