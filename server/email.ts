import { MailService } from '@sendgrid/mail';

}

const mailService = new MailService();
}

const FROM_EMAIL = 'info@mindvault.app';
const APP_NAME = 'MindVault';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using SendGrid
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
      return false;
    }

    await mailService.send({
      to: params.to,
      from: FROM_EMAIL,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
}

/**
 */
  email: string,
  username: string
): Promise<boolean> {
  
  
  const text = `
    Hello ${username},
    
    
    ${resetUrl}
    
    This link is valid for 1 hour.
    
    
    Thanks,
    The ${APP_NAME} Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hello ${username},</p>
      <div style="text-align: center; margin: 20px 0;">
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link is valid for 1 hour.</p>
      <p>Thanks,<br />The ${APP_NAME} Team</p>
    </div>
  `;
  
  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}