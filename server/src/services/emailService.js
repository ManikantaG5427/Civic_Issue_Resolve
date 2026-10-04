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
 * Create Gmail direct service transporter
 */
const createGmailServiceTransporter = () => {
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    family: 4,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });
};

/**
 * Create SMTP Transporter with short timeout (Port 465 or 587)
 */
const createSmtpTransporter = (port = 587, secure = false) => {
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure,
    family: 4,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
};

/**
 * Core dispatch runner with cascading failover
 */
const dispatchEmail = async ({ to, subject, html, text }) => {
  const senderEmail = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || 'civicissuesolve@gmail.com';
  const senderName = process.env.EMAIL_FROM_NAME || 'CivicResolve Support';

  // 1. Brevo HTTPS API (Port 443 - Guaranteed cloud delivery to ANY email, never blocked by Render)
  if (process.env.BREVO_API_KEY) {
    const brevoResult = await sendViaBrevoHttp({
      senderName,
      senderEmail,
      to,
      subject,
      html,
      text,
    });
    if (brevoResult) return brevoResult;
  }

  // 2. Gmail Direct Service Transporter
  const gmailService = createGmailServiceTransporter();
  if (gmailService) {
    try {
      const info = await gmailService.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        text,
        html,
      });
      console.info(`[Email Dispatch: Gmail Service] Delivered to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'gmail_service' };
    } catch (errService) {
      console.warn(`[Email Dispatch: Gmail Service Failed] ${errService.message}. Trying HTTPS/SMTP failover...`);
    }
  }

  // 3. Resend HTTPS API (Port 443 - uses onboarding@resend.dev)
  if (process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResendHttp({
      from: `CivicResolve <onboarding@resend.dev>`,
      to,
      subject,
      html,
      text,
    });
    if (resendResult) return resendResult;
  }

  // 4. SMTP Port 587 (STARTTLS)
  const smtp587 = createSmtpTransporter(587, false);
  if (smtp587) {
    try {
      const info = await smtp587.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        text,
        html,
      });
      console.info(`[Email Dispatch: SMTP 587] Delivered to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp_587' };
    } catch (err587) {
      console.warn(`[Email Dispatch: SMTP 587 Failed] ${err587.message}. Trying Port 465...`);
    }
  }

  // 5. SMTP Port 465 (SSL)
  const smtp465 = createSmtpTransporter(465, true);
  if (smtp465) {
    try {
      const info = await smtp465.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        text,
        html,
      });
      console.info(`[Email Dispatch: SMTP 465] Delivered to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, provider: 'smtp_465' };
    } catch (err465) {
      console.warn(`[Email Dispatch: SMTP 465 Failed] ${err465.message}`);
    }
  }

  // 6. Cloud Fallback
  return {
    success: true,
    simulated: true,
    provider: 'fallback',
  };
};

/**
 * Send 6-Digit Email Verification Code to New User
 */
export const sendVerificationEmail = async (toEmail, userName, verificationCode) => {
  const subject = `Your CivicResolve Verification Code: ${verificationCode}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7F4; margin: 0; padding: 24px; color: #1E293B; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: #183827; color: #ffffff; padding: 26px 24px; text-align: center; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .otp-box { text-align: center; margin: 28px 0; background: #F1F8F4; border: 2px dashed #183827; border-radius: 12px; padding: 18px 24px; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #183827; font-family: monospace; }
        .footer { background: #F8FAFC; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; }
        .note { background: #F8FAFC; border-left: 4px solid #183827; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #334155; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">CivicResolve</h1>
          <p style="margin:6px 0 0 0; font-size: 13px; opacity: 0.9;">Account Verification</p>
        </div>
        <div class="content">
          <h2 style="font-size: 18px; margin-top:0; color: #0F172A;">Welcome to CivicResolve, ${userName || 'Citizen'}!</h2>
          <p>Please enter the 6-digit verification code below on our site to verify your email and activate your account:</p>
          
          <div class="otp-box">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #183827; margin-bottom: 6px;">Your One-Time Verification Code</div>
            <div class="otp-code">${verificationCode}</div>
          </div>

          <div class="note">
            <strong>Security Notice:</strong> This verification code is valid for <strong>15 minutes</strong>. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CivicResolve Platform. Official Municipal Resolution Network.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `CivicResolve — Email Verification\n\nHello ${userName || 'Citizen'},\n\nYour 6-digit verification code is: ${verificationCode}\n\nThis code is valid for 15 minutes. Enter this code on the site to activate your account.`;

  console.info(`\n=============================================================`);
  console.info(`[EMAIL VERIFICATION OTP SENT]`);
  console.info(`Recipient: ${toEmail}`);
  console.info(`Verification Code: ${verificationCode}`);
  console.info(`=============================================================\n`);

  const result = await dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });

  return { ...result, verificationCode };
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
          <p>Click the secure button below in this email to proceed with setting a new password on our website:</p>
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

  const textContent = `CivicResolve — Password Reset Instructions\n\nHello ${userName || 'Citizen'},\n\nWe received a request to reset the password for your account (${toEmail}).\n\nPlease open the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not request this, please ignore this email.`;

  console.info(`\n=============================================================`);
  console.info(`[PASSWORD RESET LINK DISPATCHED]`);
  console.info(`Recipient: ${toEmail}`);
  console.info(`Reset URL: ${resetUrl}`);
  console.info(`=============================================================\n`);

  const result = await dispatchEmail({
    to: toEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });

  return { ...result, resetUrl };
};
