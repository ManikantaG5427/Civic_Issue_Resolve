import nodemailer from 'nodemailer';

/**
 * Configure email transporter
 * Uses SMTP settings or Gmail service if provided in .env
 */
const createTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (process.env.SMTP_USER.endsWith('@gmail.com') || process.env.SMTP_SERVICE === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS, // 16-character Google App Password
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development fallback notice
  return null;
};

/**
 * Send Password Reset Email with responsive HTML template
 */
export const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const subject = 'CivicResolve — Password Reset Instructions';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7F4; margin: 0; padding: 20px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: #183827; color: #ffffff; padding: 24px; text-align: center; }
        .content { padding: 32px 24px; color: #1E293B; line-height: 1.6; }
        .btn { display: inline-block; background: #183827; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; margin: 20px 0; }
        .footer { background: #F8FAFC; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 20px; font-weight: 800;">CivicResolve</h1>
          <p style="margin:4px 0 0 0; font-size: 12px; opacity: 0.9;">Civic Issue Resolution Platform</p>
        </div>
        <div class="content">
          <h2 style="font-size: 18px; margin-top:0;">Hello ${userName || 'Citizen'},</h2>
          <p>We received a request to reset the password for your CivicResolve account. Click the secure link below to set a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="btn" target="_blank">Reset My Password</a>
          </div>
          <p style="font-size: 13px; color: #64748B;">This link is valid for <strong>1 hour</strong>. If you did not request this password reset, please ignore this email.</p>
          <p style="font-size: 12px; color: #94A3B8; word-break: break-all;">Direct Link: <br><a href="${resetUrl}" style="color: #183827;">${resetUrl}</a></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CivicResolve Platform. Official Municipal Resolution Network.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = await createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'CivicResolve Support'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.info(`[Email Dispatch] Password reset email sent to: ${toEmail}`);
    } else {
      console.info(`[Dev Email Simulation] -> To: ${toEmail} | Subject: ${subject} | URL: ${resetUrl}`);
    }
    return true;
  } catch (error) {
    console.error(`[Email Dispatch Error] Failed to send email to ${toEmail}:`, error.message);
    return false;
  }
};
