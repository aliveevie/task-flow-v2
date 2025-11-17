import { baseEmailTemplate, plainTextTemplate } from './base.js';

/**
 * Email Verification Template for TaskFlow
 * Professional design with company branding
 */

export function emailVerificationTemplate({ userName, verificationLink, expiryTime }) {
  const content = `
    <h2>Verify Your Email Address 📧</h2>
    <p>Hi ${userName},</p>
    <p>Thank you for signing up for <strong>TaskFlow</strong>! We're excited to have you on board.</p>
    
    <p>To complete your registration and start managing your projects efficiently, please verify your email address by clicking the button below:</p>
    
    <center>
      <a href="${verificationLink}" class="button" style="display: inline-block; padding: 14px 32px; background: #667eea !important; background-color: #667eea !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">Verify Email Address →</a>
    </center>
    
    <div class="info-box">
      <strong>⏰ Important:</strong><br>
      This verification link will expire in ${expiryTime || '24 hours'} for security reasons.<br>
      Please verify your email before it expires.
    </div>
    
    <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea; font-size: 14px;">${verificationLink}</p>
    
    <div class="divider"></div>
    
    <p><strong>Why verify your email?</strong></p>
    <ul>
      <li>✅ Secure your account</li>
      <li>✅ Receive important notifications</li>
      <li>✅ Reset your password if needed</li>
      <li>✅ Access all TaskFlow features</li>
    </ul>
    
    <div class="divider"></div>
    
    <p style="color: #999; font-size: 14px;">
      <strong>Didn't create an account?</strong><br>
      If you didn't sign up for TaskFlow, you can safely ignore this email. No account will be created.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Verify Your Email - TaskFlow',
    preheader: 'Please verify your email address to complete registration',
    content,
    footerText: 'You received this email because you signed up for TaskFlow'
  });

  const text = plainTextTemplate({
    title: 'Verify Your Email - TaskFlow',
    content: `
Hi ${userName},

Thank you for signing up for TaskFlow! 

To complete your registration, please verify your email address by visiting:

${verificationLink}

This link will expire in ${expiryTime || '24 hours'}.

Why verify?
- Secure your account
- Receive important notifications
- Reset password if needed
- Access all features

If you didn't create an account, you can safely ignore this email.

---
TaskFlow - Streamline your team's workflow
    `
  });

  return { html, text };
}

/**
 * Email Verification Success Template
 */
export function emailVerifiedTemplate({ userName, loginUrl }) {
  const content = `
    <h2>Email Verified Successfully! ✅</h2>
    <p>Hi ${userName},</p>
    <p>Great news! Your email has been successfully verified. Your TaskFlow account is now active and ready to use.</p>
    
    <center>
      <a href="${loginUrl}" class="button" style="display: inline-block; padding: 14px 32px; background: #667eea !important; background-color: #667eea !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">Login to TaskFlow →</a>
    </center>
    
    <p><strong>What's next?</strong></p>
    <ul>
      <li>🚀 Create your first project</li>
      <li>✅ Add tasks and assign team members</li>
      <li>📊 Track progress in real-time</li>
      <li>👥 Collaborate with your team</li>
      <li>🔔 Get instant notifications</li>
    </ul>
    
    <div class="divider"></div>
    
    <p>Need help getting started? Check out our documentation or contact support at support@galaxyitt.com.ng</p>
  `;

  const html = baseEmailTemplate({
    title: 'Welcome to TaskFlow!',
    preheader: 'Your account is now active',
    content,
    footerText: 'Welcome to TaskFlow by Galaxy ITT'
  });

  const text = plainTextTemplate({
    title: 'Welcome to TaskFlow!',
    content: `
Hi ${userName},

Your email has been verified successfully! Your TaskFlow account is active.

Login here: ${loginUrl}

What's next?
- Create your first project
- Add tasks and assign team members
- Track progress in real-time
- Collaborate with your team
- Get instant notifications

Welcome to TaskFlow!
    `
  });

  return { html, text };
}

export default {
  emailVerificationTemplate,
  emailVerifiedTemplate
};

