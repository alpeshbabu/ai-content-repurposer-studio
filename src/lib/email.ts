import nodemailer from 'nodemailer';

interface TeamInvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  teamName: string;
  inviterName: string;
  invitationToken: string;
  expiresAt: Date;
}

export async function sendTeamInvitationEmail(data: TeamInvitationEmailData) {
  // Check if email configuration is available
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_FROM) {
    console.warn('Email configuration not available, skipping email send');
    return { success: false, message: 'Email configuration not available' };
  }

  try {
    // Create transporter using the same configuration as NextAuth
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Create invitation URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/team/invite/${data.invitationToken}`;

    // Format expiry date
    const expiryDate = data.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Email HTML template
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

    // Plain text version
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

    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.recipientEmail,
      subject: `🎉 You're invited to join ${data.teamName} on AI Content Repurposer Studio`,
      text: textContent,
      html: htmlContent,
    });

    console.log('Team invitation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Failed to send team invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 