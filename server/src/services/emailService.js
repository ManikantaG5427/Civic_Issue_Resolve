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

/**
 * Send Instant Security & Activity Audit Alert to Super Admin
 */
export const sendSuperAdminAlertEmail = async ({
  eventType = 'system',
  title = 'CivicResolve System Activity Alert',
  message = '',
  actorName = 'System User',
  actorEmail = '',
  actorRole = 'user',
  details = {},
  linkUrl = '',
  timestamp = new Date(),
}) => {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'gundrothumanikantad@gmail.com';
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  });

  // Theme color mapping based on event category
  const badgeThemes = {
    user_login: { bg: '#ECFDF5', border: '#10B981', text: '#065F46', icon: '', label: 'USER LOGIN ACTIVITY' },
    user_register: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', icon: '', label: 'NEW ACCOUNT REGISTERED' },
    staff_request: { bg: '#FAF5FF', border: '#A855F7', text: '#6B21A8', icon: '', label: 'STAFF ROLE REQUEST' },
    issue_created: { bg: '#FFF7ED', border: '#F97316', text: '#9A3412', icon: '', label: 'CIVIC ISSUE REPORTED' },
    issue_resolved: { bg: '#F0FDF4', border: '#22C55E', text: '#15803D', icon: '', label: 'RESOLUTION CONFIRMED' },
    role_approved: { bg: '#EEF2FF', border: '#6366F1', text: '#3730A3', icon: '', label: 'STAFF ROLE APPROVED' },
    role_rejected: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', icon: '', label: 'STAFF ROLE REJECTED' },
    assignment: { bg: '#FEFCE8', border: '#EAB308', text: '#854D0E', icon: '', label: 'WORKER DISPATCHED' },
    admin_action: { bg: '#F8FAFC', border: '#64748B', text: '#334155', icon: '', label: 'ADMINISTRATIVE ACTION' },
    security_alert: { bg: '#FFF1F2', border: '#F43F5E', text: '#881337', icon: '', label: 'SECURITY ALERT' },
  };

  const currentTheme = badgeThemes[eventType] || {
    bg: '#F8FAFC',
    border: '#183827',
    text: '#183827',
    icon: '',
    label: 'SYSTEM AUDIT & ACTIVITY',
  };

  // Build detail table rows
  const detailRowsHtml = Object.entries(details)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(
      ([key, val]) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; font-weight: 600; color: #64748B; font-size: 13px; width: 38%;">${key}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-size: 13px; font-weight: 500;">${val}</td>
      </tr>
    `
    )
    .join('');

  const actionButtonHtml = linkUrl
    ? `
      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="${linkUrl}" style="display: inline-block; background-color: #183827; color: #ffffff !important; text-decoration: none; padding: 12px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; letter-spacing: 0.3px;" target="_blank">
          Open in Super Admin Portal &rarr;
        </a>
      </div>
    `
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #1E293B; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: #183827; color: #ffffff; padding: 22px 26px; display: flex; align-items: center; justify-content: space-between; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 14px; }
        .content { padding: 28px 26px; }
        .table-wrap { background: #FAFAFA; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin: 20px 0; }
        .footer { background: #F8FAFC; padding: 18px 24px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px; color: #ffffff;">CivicResolve Sentinel</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85; color: #E2E8F0;">Super Admin Real-Time Surveillance & Audit</p>
          </div>
        </div>
        <div class="content">
          <div class="badge" style="background-color: ${currentTheme.bg}; color: ${currentTheme.text}; border: 1px solid ${currentTheme.border};">
            ${currentTheme.icon} ${currentTheme.label}
          </div>

          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 10px 0; color: #0F172A; line-height: 1.4;">
            ${title}
          </h2>

          <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 18px 0;">
            ${message}
          </p>

          <div class="table-wrap">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; font-weight: 600; color: #64748B; font-size: 13px; width: 38%;">Actor / User</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-size: 13px; font-weight: 700;">${actorName} ${actorEmail ? `(${actorEmail})` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; font-weight: 600; color: #64748B; font-size: 13px;">User Role</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-size: 13px; text-transform: capitalize; font-weight: 600;">${actorRole.replace('_', ' ')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; font-weight: 600; color: #64748B; font-size: 13px;">Timestamp (IST)</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #F1F5F9; color: #0F172A; font-size: 13px;">${formattedTime}</td>
              </tr>
              ${detailRowsHtml}
            </table>
          </div>

          ${actionButtonHtml}
        </div>
        <div class="footer">
          <strong>CivicResolve Municipal Sentinel Security Network</strong><br>
          Automated real-time telemetry delivered to Super Administrator (${superAdminEmail}).
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `[CIVICRESOLVE SUPER ADMIN ALERT] ${currentTheme.label}\n\n${title}\n${message}\n\nActor: ${actorName} (${actorEmail})\nRole: ${actorRole}\nTime: ${formattedTime}\n\n${Object.entries(details).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nPortal: ${linkUrl || 'https://civicissueresolve-client.vercel.app/dashboard'}`;

  console.info(`[SUPER ADMIN ALERT DISPATCH] Event: ${eventType} | To: ${superAdminEmail} | ${title}`);

  // Non-blocking dispatch
  return dispatchEmail({
    to: superAdminEmail,
    subject: `[CivicResolve Alert] ${title}`,
    html: htmlContent,
    text: textContent,
  });
};

