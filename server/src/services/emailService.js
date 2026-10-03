import nodemailer from 'nodemailer';

/**
 * Cached Transporter Instance
 * Reuses the transporter connection to avoid repeated setup overhead
 */
let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) {
    return null;
  }

  if (user.endsWith('@gmail.com') || process.env.SMTP_SERVICE === 'gmail') {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
};



/**
 * Send Password Reset Email with responsive HTML template
 */
export const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const subject = 'CivicResolve — Password Reset Instructions';
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7F4; margin: 0; padding: 24px; color: #1E293B; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: #183827; color: #ffffff; padding: 28px 24px; text-align: center; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .btn-wrapper { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background-color: #183827; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.2px; }
        .footer { background: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
        .note { background: #F1F5F9; border-left: 4px solid #183827; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #334155; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">CivicResolve</h1>
          <p style="margin:6px 0 0 0; font-size: 13px; opacity: 0.9;">Civic Issue Resolution Platform</p>
        </div>
        <div class="content">
          <h2 style="font-size: 18px; margin-top:0; color: #0F172A;">Hello ${userName || 'Citizen'},</h2>
          <p>We received a request to reset the password for your registered account (<strong>${toEmail}</strong>).</p>
          <p>Click the secure button below to set a new password:</p>
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
          </div>
          <div class="note">
            <strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your password remains unchanged.
          </div>
          <p style="font-size: 12px; color: #94A3B8; word-break: break-all; margin-top: 24px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #183827; font-weight: 500;">${resetUrl}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CivicResolve Platform. Official Municipal Resolution Network.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `CivicResolve — Password Reset Instructions\n\nHello ${userName || 'Citizen'},\n\nWe received a request to reset the password for your account (${toEmail}).\n\nPlease visit the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not request this, please ignore this email.`;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Dev Email Simulation] -> To: ${toEmail} | Subject: ${subject} | URL: ${resetUrl}`);
    return { success: true, simulated: true };
  }

  try {
    const sender = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER.trim();
    const senderName = process.env.EMAIL_FROM_NAME || 'CivicResolve Support';

    const info = await transporter.sendMail({
      from: `"${senderName}" <${sender}>`,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.info(`[Email Dispatch] Password reset email successfully sent to: ${toEmail} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Dispatch Error] Failed to send email to ${toEmail}:`, error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

