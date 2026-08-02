export interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
  from_name?: string;
  cc?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
}

export const sendEmail = async (params: SendEmailParams): Promise<{ success: boolean; error?: string }> => {
  const lambdaUrl = import.meta.env.VITE_LAMBDA_API_URL || (import.meta.env as any).LAMBDA_API_URL;
  const lambdaSecret = import.meta.env.VITE_LAMBDA_SECRET || (import.meta.env as any).LAMBDA_SECRET;

  const payload = {
    name: params.from_name || 'Ximpul Shop',
    email: 'ximpulshop@gmail.com',
    to: params.to,
    subject: params.subject,
    message: params.message,
    source: 'Ximpul Flow',
    secretKey: lambdaSecret,
    htmlTemplate: params.message,
    cc: params.cc,
    attachments: params.attachments,
  };

  try {
    // 1. Try Vercel /api/send-email endpoint first
    let response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        message: params.message,
        from_name: params.from_name || 'Ximpul Shop',
        cc: params.cc,
        attachments: params.attachments,
      }),
    });

    let result = await response.json().catch(() => null);

    if (response.ok && result?.success) {
      console.log('✅ Email sent via /api/send-email');
      return { success: true };
    }

    console.warn('⚠️ /api/send-email endpoint failed or returned non-JSON. Falling back directly to AWS Lambda Function URL...', result);

    // 2. Direct AWS Lambda fallback
    response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    result = await response.json().catch(() => null);

    if (response.ok && result?.success) {
      console.log('✅ Email sent directly via AWS Lambda Function URL');
      return { success: true };
    }

    console.error('❌ Direct AWS Lambda email also failed:', result);
    return {
      success: false,
      error: result?.error || result?.message || 'Failed to send email',
    };
  } catch (error: any) {
    console.error('Error in sendEmail utility:', error);

    try {
      const fbResponse = await fetch(lambdaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const fbResult = await fbResponse.json().catch(() => null);
      if (fbResponse.ok && fbResult?.success) {
        return { success: true };
      }
    } catch (fbErr) {
      console.error('Fallback Lambda call error:', fbErr);
    }

    return {
      success: false,
      error: error?.message || 'Network error sending email',
    };
  }
};
