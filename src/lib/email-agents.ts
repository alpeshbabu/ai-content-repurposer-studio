import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface TeamInvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  teamName: string;
  inviterName: string;
  invitationToken: string;
  expiresAt: Date;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
  provider?: string;
}

// Email template components
function getEmailTemplate(data: TeamInvitationEmailData) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const invitationUrl = `${baseUrl}/team/invite/${data.invitationToken}`;
  
  const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #ffffff;
            padding: 40px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .team-info {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
        }
        .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .cta-button:hover {
            background: #2563eb;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e5e7eb;
            border-top: none;
            font-size: 14px;
            color: #6b7280;
        }
        .expiry-warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 12px;
            border-radius: 6px;
            margin: 20px 0;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 You're Invited to Join a Team!</h1>
    </div>
    
    <div class="content">
        <p>Hi${data.recipientName ? ` ${data.recipientName}` : ''},</p>
        
        <p><strong>${data.inviterName}</strong> has invited you to join their team on <strong>AI Content Repurposer Studio</strong>!</p>
        
        <div class="team-info">
            <h3 style="margin-top: 0;">Team Details</h3>
            <p><strong>Team Name:</strong> ${data.teamName}</p>
            <p><strong>Invited by:</strong> ${data.inviterName}</p>
            <p><strong>Your Email:</strong> ${data.recipientEmail}</p>
        </div>
        
        <p>As a team member, you'll be able to:</p>
        <ul>
            <li>Collaborate on content repurposing projects</li>
            <li>Share and access team resources</li>
            <li>Work together on content strategies</li>
            <li>Access team analytics and insights</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation & Join Team</a>
        </div>
        
        <div class="expiry-warning">
            ⏰ <strong>Important:</strong> This invitation expires on ${expiryDate}. Make sure to accept it before then!
        </div>
        
        <p>If you have any questions, feel free to reach out to ${data.inviterName} or contact our support team.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p><small>If the button above doesn't work, you can copy and paste this link into your browser:</small></p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${invitationUrl}</p>
    </div>
    
    <div class="footer">
        <p>This invitation was sent by AI Content Repurposer Studio</p>
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
</body>
</html>`;

  const textContent = `
You're Invited to Join a Team!

Hi${data.recipientName ? ` ${data.recipientName}` : ''},

${data.inviterName} has invited you to join their team "${data.teamName}" on AI Content Repurposer Studio!

As a team member, you'll be able to:
- Collaborate on content repurposing projects
- Share and access team resources
- Work together on content strategies
- Access team analytics and insights

To accept this invitation, click here: ${invitationUrl}

Important: This invitation expires on ${expiryDate}.

If you have any questions, feel free to reach out to ${data.inviterName} or contact our support team.

---
This invitation was sent by AI Content Repurposer Studio
If you didn't expect this invitation, you can safely ignore this email.
`;

  return { htmlContent, textContent, invitationUrl };
}

// Resend Email Agent (Recommended)
async function sendWithResend(data: TeamInvitationEmailData): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: 'Resend API key not configured', provider: 'resend' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { htmlContent, textContent } = getEmailTemplate(data);

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'AI Content Repurposer Studio <noreply@yourdomain.com>',
      to: data.recipientEmail,
      subject: `🎉 You're invited to join ${data.teamName} on AI Content Repurposer Studio`,
      html: htmlContent,
      text: textContent,
    });

    if (result.error) {
      return { success: false, error: result.error.message, provider: 'resend' };
    }

    return { success: true, messageId: result.data?.id, provider: 'resend' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'resend'
    };
  }
}

// SendGrid Email Agent
async function sendWithSendGrid(data: TeamInvitationEmailData): Promise<EmailResult> {
  if (!process.env.SENDGRID_API_KEY) {
    return { success: false, message: 'SendGrid API key not configured', provider: 'sendgrid' };
  }

  try {
    // Dynamic import to avoid errors if SendGrid isn't installed
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);

    const { htmlContent, textContent } = getEmailTemplate(data);

    const msg = {
      to: data.recipientEmail,
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      subject: `🎉 You're invited to join ${data.teamName} on AI Content Repurposer Studio`,
      text: textContent,
      html: htmlContent,
    };

    const result = await sgMail.default.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'], provider: 'sendgrid' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'sendgrid'
    };
  }
}

// Mailgun Email Agent
async function sendWithMailgun(data: TeamInvitationEmailData): Promise<EmailResult> {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    return { success: false, message: 'Mailgun configuration not complete', provider: 'mailgun' };
  }

  try {
    // Dynamic import to avoid errors if Mailgun isn't installed
    const formData = await import('form-data');
    const Mailgun = await import('mailgun.js');
    
    const mailgun = new Mailgun.default(formData.default);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    const { htmlContent, textContent } = getEmailTemplate(data);

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: process.env.EMAIL_FROM || `AI Content Repurposer Studio <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: data.recipientEmail,
      subject: `🎉 You're invited to join ${data.teamName} on AI Content Repurposer Studio`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true, messageId: result.id, provider: 'mailgun' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'mailgun'
    };
  }
}

// AWS SES Email Agent
async function sendWithAWSSES(data: TeamInvitationEmailData): Promise<EmailResult> {
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return { success: false, message: 'AWS SES configuration not complete', provider: 'aws-ses' };
  }

  try {
    // Dynamic import to avoid errors if AWS SDK isn't installed
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');

    const sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const { htmlContent, textContent } = getEmailTemplate(data);

    const command = new SendEmailCommand({
      Source: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      Destination: {
        ToAddresses: [data.recipientEmail],
      },
      Message: {
        Subject: {
          Data: `🎉 You're invited to join ${data.teamName} on AI Content Repurposer Studio`,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: textContent,
            Charset: 'UTF-8',
          },
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const result = await sesClient.send(command);
    return { success: true, messageId: result.MessageId, provider: 'aws-ses' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'aws-ses'
    };
  }
}

// SMTP Fallback (existing implementation)
async function sendWithSMTP(data: TeamInvitationEmailData): Promise<EmailResult> {
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_FROM) {
    return { success: false, message: 'SMTP configuration not available', provider: 'smtp' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const { htmlContent, textContent } = getEmailTemplate(data);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.recipientEmail,
      subject: `🎉 You're invited to join ${data.teamName} on AI Content Repurposer Studio`,
      text: textContent,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'smtp'
    };
  }
}

// Main email sending function with fallback strategy
export async function sendTeamInvitationEmail(data: TeamInvitationEmailData): Promise<EmailResult> {
  const emailAgents = [
    { name: 'Resend', fn: sendWithResend, condition: () => !!process.env.RESEND_API_KEY },
    { name: 'SendGrid', fn: sendWithSendGrid, condition: () => !!process.env.SENDGRID_API_KEY },
    { name: 'Mailgun', fn: sendWithMailgun, condition: () => !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) },
    { name: 'AWS SES', fn: sendWithAWSSES, condition: () => !!(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID) },
    { name: 'SMTP', fn: sendWithSMTP, condition: () => !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER) },
  ];

  // Try each configured email agent in order
  for (const agent of emailAgents) {
    if (agent.condition()) {
      console.log(`Attempting to send email via ${agent.name}...`);
      const result = await agent.fn(data);
      
      if (result.success) {
        console.log(`✅ Email sent successfully via ${agent.name}:`, result.messageId);
        return result;
      } else {
        console.warn(`❌ ${agent.name} failed:`, result.error || result.message);
        // Continue to next agent
      }
    }
  }

  // If all agents failed
  return {
    success: false,
    message: 'No email agents configured or all failed',
    error: 'Please configure at least one email service (Resend, SendGrid, Mailgun, AWS SES, or SMTP)'
  };
} 