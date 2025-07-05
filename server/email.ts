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
