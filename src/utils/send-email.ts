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
    const response = await fetch('/api/send-email', {
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

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      console.error('Failed to send email via /api/send-email:', result);
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
