// Simple email sender using fetch
export const sendEmail = async (to, subject, body) => {
  try {
    // Use EmailJS service
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_ximpul',
        template_id: 'template_ximpul',
        user_id: 'user_ximpul',
        template_params: {
          to_email: to,
          subject: subject,
          message: body,
          from_name: 'Ximpul Shop',
          reply_to: 'ximpulshop@gmail.com'
        }
      })
    });
    
    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};