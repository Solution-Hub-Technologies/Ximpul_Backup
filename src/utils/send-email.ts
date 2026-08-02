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
  try {
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

    // Direct Lambda fallback if /api/send-email returns 404 (e.g. running locally via Vite dev server)
    if ((!response.ok || response.status === 404)) {
      const lambdaUrl = import.meta.env.VITE_LAMBDA_API_URL || (import.meta.env as any).LAMBDA_API_URL || 'https://fnpxbv3ywy27twncwnqx4odnje0ztrtj.lambda-url.ap-southeast-1.on.aws/';
      const lambdaSecret = import.meta.env.VITE_LAMBDA_SECRET || (import.meta.env as any).LAMBDA_SECRET || 'sohub-mailer-secret-2026';
      if (lambdaUrl) {
        console.log('Falling back to direct Lambda endpoint...');
        response = await fetch(lambdaUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          }),
        });
        result = await response.json().catch(() => null);
      }
    }

    if (!response.ok || !result?.success) {
      console.error('Failed to send email:', result);
      return {
        success: false,
        error: result?.error || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in sendEmail utility:', error);
    return {
      success: false,
      error: error?.message || 'Network error sending email',
    };
  }
};
