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

  const lambdaUrl = process.env.LAMBDA_API_URL || process.env.VITE_LAMBDA_API_URL || '';
  const lambdaSecret = process.env.LAMBDA_SECRET || '';
  let adminEmail = (process.env.ADMIN_EMAIL || 'razinahmed60@gmail.com').trim();
  if (adminEmail.includes('razinahmed45')) {
    adminEmail = 'razinahmed60@gmail.com';
  }

  if (!lambdaUrl || !lambdaSecret) {
    console.error('Email configuration error: LAMBDA_API_URL or LAMBDA_SECRET missing');
    return res.status(500).json({ success: false, error: 'Email service is not configured on server' });
  }

  let { to, subject, message, from_name = 'Ximpul Shop', cc, attachments } = req.body || {};

  // Force legacy email replacement to razinahmed60@gmail.com
  if (to && typeof to === 'string') {
    to = to.replace(/razinahmed45@gmail\.com/gi, 'razinahmed60@gmail.com')
           .replace(/solutionhubtechnologies@gmail\.com/gi, 'razinahmed60@gmail.com');
  }

  if (!to || !subject || !message) {
    return res.status(400).json({ success: false, error: 'Recipient (to), subject, and message are required' });
  }

  try {
    const payload: any = {
      name: from_name,
      email: adminEmail,
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
