import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const lambdaUrl = process.env.LAMBDA_API_URL || process.env.VITE_LAMBDA_API_URL || 'https://sohub.com.bd/api/send-email';
  const lambdaSecret = process.env.LAMBDA_SECRET || process.env.VITE_LAMBDA_SECRET || 'sohub-mailer-secret-2026';
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'ximpulshop@gmail.com').trim();

  if (!lambdaUrl || !lambdaSecret) {
    console.error('Email configuration error: LAMBDA_API_URL or LAMBDA_SECRET missing');
    return res.status(500).json({ success: false, error: 'Email service is not configured on server' });
  }

  let { to, subject, message, from_name = 'Ximpul Shop', cc, attachments } = req.body || {};

  if (!to || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Recipient (to), subject, and message are required' });
  }

  // If sending admin notification, route recipient (to) to configured Vercel ADMIN_EMAIL env var
  const isAdminNotification = 
    to === 'admin' || 
    to === 'ximpulshop@gmail.com' || 
    to === 'solutionhubtechnologies@gmail.com' ||
    (subject && (subject.toLowerCase().includes('new order') || subject.toLowerCase().includes('order alert')));

  if (isAdminNotification) {
    to = configuredAdminEmail;
  }

  try {
    const payload: any = {
      name: from_name,
      email: configuredAdminEmail,
      to: to,
      subject: subject,
      source: 'Ximpul Flow',
      secretKey: lambdaSecret,
      htmlTemplate: message,
    };

    if (cc) {
      payload.cc = cc;
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments;
    }

    console.log(`Sending email to ${to} via AWS Lambda...`);

    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      console.error('Lambda email failed:', result || response.statusText);
      return res.status(502).json({
        success: false,
        error: result?.error || result?.message || 'Could not send email via AWS Lambda',
      });
    }

    console.log(`Email sent successfully to ${to}`);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error in send-email API handler:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
