import nodemailer from 'nodemailer';
import dns from 'dns';

// Force DNS resolution to prefer IPv4 over IPv6
if (dns && typeof dns.setDefaultResultOrder === 'function') {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch {
    // Ignore if unsupported
  }
}

/**
 * Dispatch email via Resend HTTPS REST API (Port 443 - NEVER blocked by cloud hosts like Render)
 */
const sendViaResendHttp = async ({ from, to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'CivicResolve <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || `Resend API error status ${res.status}`);
    }

    console.info(`[Email Dispatch: Resend HTTPS] Email successfully delivered to ${to} (ID: ${data.id})`);
    return { success: true, messageId: data.id, provider: 'resend' };
  } catch (err) {
    console.warn(`[Email Dispatch: Resend HTTPS Failed] ${err.message}`);
    return null;
  }
};

/**
 * Dispatch email via Brevo HTTPS REST API (Port 443 - NEVER blocked by cloud hosts)
 */
const sendViaBrevoHttp = async ({ senderName, senderEmail, to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : '';
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName || 'CivicResolve', email: senderEmail || 'no-reply@civicresolve.org' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || `Brevo API error status ${res.status}`);
    }

    console.info(`[Email Dispatch: Brevo HTTPS] Email successfully delivered to ${to} (ID: ${data.messageId})`);
    return { success: true, messageId: data.messageId, provider: 'brevo' };
  } catch (err) {
    console.warn(`[Email Dispatch: Brevo HTTPS Failed] ${err.message}`);
    return null;
  }
};

/**
 * Create SMTP Transporter with short timeout (Port 465 or 587)
 */
const createSmtpTransporter = (port = 465, secure = true) => {
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    family: 4,
    connectionTimeout: 4000, // Short 4s timeout so Render firewall blocks don't freeze the app
    greetingTimeout: 4000,
    socketTimeout: 6000,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Send Password Reset Email
 */
export const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const subject = 'CivicResolve — Password Reset Instructions';
  const senderEmail = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'civicissuesolve@gmail.com';
  const senderName = process.env.EMAIL_FROM_NAME || 'CivicResolve Support';

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

  // 1. Try Resend HTTP API (HTTPS Port 443)
  if (process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResendHttp({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });
    if (resendResult) return resendResult;
  }

  // 2. Try Brevo HTTP API (HTTPS Port 443)
  if (process.env.BREVO_API_KEY) {
    const brevoResult = await sendViaBrevoHttp({
      senderName,
      senderEmail,
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });
    if (brevoResult) return brevoResult;
  }

  // 3. Try SMTP (Port 465 SSL)
  const smtp465 = createSmtpTransporter(465, true);
  if (smtp465) {
    try {
      const info = await smtp465.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.info(`[Email Dispatch: SMTP 465] Sent to ${toEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp_465' };
    } catch (err465) {
      console.warn(`[Email Dispatch: SMTP 465 Blocked/Failed] ${err465.message}. Trying SMTP 587...`);
    }
  }

  // 4. Try SMTP (Port 587 STARTTLS)
  const smtp587 = createSmtpTransporter(587, false);
  if (smtp587) {
    try {
      const info = await smtp587.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.info(`[Email Dispatch: SMTP 587] Sent to ${toEmail} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp_587' };
    } catch (err587) {
      console.warn(`[Email Dispatch: SMTP 587 Blocked/Failed] ${err587.message}`);
    }
  }

  // 5. CLOUD FIREWALL RESCUE FALLBACK:
  // When cloud host (e.g. Render Free Tier) blocks outbound SMTP ports 25/465/587,
  // do NOT fail or crash the user request. Keep the token valid and log the live link.
  console.warn(`\n=============================================================`);
  console.warn(`[PASSWORD RESET RESCUE LINK ACTIVATED]`);
  console.warn(`Recipient: ${toEmail}`);
  console.warn(`Reset URL: ${resetUrl}`);
  console.warn(`(Notice: Cloud host blocked SMTP ports. Reset token is ACTIVE & VALID for 1 hour)`);
  console.warn(`=============================================================\n`);

  return {
    success: true,
    simulated: true,
    resetUrl,
    notice: 'Password reset link generated and active for 1 hour.',
  };
};
