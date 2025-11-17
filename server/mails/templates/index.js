import { baseEmailTemplate, plainTextTemplate } from './base.js';

/**
 * Test Email Template
 */
export function testEmailTemplate({ recipientName, testMessage }) {
  const content = `
    <h2>Hello ${recipientName || 'there'}! 👋</h2>
    <p>This is a test email from Swift Work Board to verify that your email configuration is working correctly.</p>
    
    <div class="info-box">
      <strong>Test Message:</strong><br>
      ${testMessage || 'Email system is functioning properly!'}
    </div>
    
    <p>If you received this email, it means:</p>
    <ul>
      <li>✅ Your SMTP server is configured correctly</li>
      <li>✅ Email credentials are valid</li>
      <li>✅ Nodemailer is working properly</li>
      <li>✅ Your email service is ready to use!</li>
    </ul>
    
    <p>You can now use the email service to send notifications, password resets, and other important messages to your users.</p>
    
    <div class="divider"></div>
    
    <p style="color: #999; font-size: 14px;">
      <strong>Note:</strong> This is an automated test email. No action is required.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Test Email - Swift Work Board',
    preheader: 'Testing email configuration',
    content,
    footerText: 'This is a test email to verify email configuration'
  });

  const text = plainTextTemplate({
    title: 'Test Email',
    content: `
Hello ${recipientName || 'there'}!

This is a test email from Swift Work Board to verify that your email configuration is working correctly.

Test Message: ${testMessage || 'Email system is functioning properly!'}

If you received this email, it means:
- Your SMTP server is configured correctly
- Email credentials are valid
- Nodemailer is working properly
- Your email service is ready to use!

This is an automated test email. No action is required.
    `
  });

  return { html, text };
}

/**
 * Welcome Email Template
 */
export function welcomeEmailTemplate({ userName, userEmail, loginUrl }) {
  const content = `
    <h2>Welcome to Swift Work Board! 🎉</h2>
    <p>Hi ${userName},</p>
    <p>We're excited to have you on board! Your account has been successfully created and you're all set to start managing your projects and tasks efficiently.</p>
    
    <div class="info-box">
      <strong>Your Account Details:</strong><br>
      Email: ${userEmail}<br>
      Status: Active ✓
    </div>
    
    <p>Here's what you can do with Swift Work Board:</p>
    <ul>
      <li>📊 Create and manage projects</li>
      <li>✅ Assign and track tasks</li>
      <li>👥 Collaborate with team members</li>
      <li>📈 Monitor progress with real-time updates</li>
      <li>🔔 Receive instant notifications</li>
    </ul>
    
    <center>
      <a href="${loginUrl || '#'}" class="button">Get Started →</a>
    </center>
    
    <div class="divider"></div>
    
    <p>Need help getting started? Check out our documentation or contact our support team.</p>
  `;

  const html = baseEmailTemplate({
    title: 'Welcome to Swift Work Board!',
    preheader: 'Get started with your new account',
    content
  });

  const text = plainTextTemplate({
    title: 'Welcome to Swift Work Board!',
    content: `
Hi ${userName},

We're excited to have you on board! Your account has been successfully created.

Account Details:
Email: ${userEmail}
Status: Active

What you can do:
- Create and manage projects
- Assign and track tasks
- Collaborate with team members
- Monitor progress
- Receive notifications

Get started: ${loginUrl || 'Login to your account'}
    `
  });

  return { html, text };
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmailTemplate({ userName, resetLink, expiryTime }) {
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${userName},</p>
    <p>We received a request to reset the password for your Swift Work Board account. Click the button below to create a new password:</p>
    
    <center>
      <a href="${resetLink}" class="button">Reset Password</a>
    </center>
    
    <div class="info-box">
      <strong>⏰ Important:</strong><br>
      This link will expire in ${expiryTime || '1 hour'} for security reasons.
    </div>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <div class="divider"></div>
    
    <p style="color: #999; font-size: 14px;">
      <strong>Security Tip:</strong> Never share your password or reset link with anyone.
    </p>
  `;

  const html = baseEmailTemplate({
    title: 'Reset Your Password',
    preheader: 'Reset your Swift Work Board password',
    content
  });

  const text = plainTextTemplate({
    title: 'Reset Your Password',
    content: `
Hi ${userName},

We received a request to reset your password.

Reset your password: ${resetLink}

This link will expire in ${expiryTime || '1 hour'}.

If you didn't request this, you can safely ignore this email.
    `
  });

  return { html, text };
}

/**
 * Task Assignment Email Template
 */
export function taskAssignedEmailTemplate({ userName, taskTitle, taskDescription, projectName, dueDate, taskUrl }) {
  const content = `
    <h2>New Task Assigned 📋</h2>
    <p>Hi ${userName},</p>
    <p>You have been assigned a new task in <strong>${projectName}</strong>.</p>
    
    <div class="info-box">
      <strong>Task:</strong> ${taskTitle}<br>
      ${taskDescription ? `<strong>Description:</strong> ${taskDescription}<br>` : ''}
      ${dueDate ? `<strong>Due Date:</strong> ${dueDate}` : ''}
    </div>
    
    <center>
      <a href="${taskUrl || '#'}" class="button">View Task →</a>
    </center>
    
    <p>Make sure to complete the task before the deadline. If you have any questions, feel free to reach out to your project manager.</p>
  `;

  const html = baseEmailTemplate({
    title: 'New Task Assigned',
    preheader: `You have been assigned to: ${taskTitle}`,
    content
  });

  const text = plainTextTemplate({
    title: 'New Task Assigned',
    content: `
Hi ${userName},

You have been assigned a new task in ${projectName}.

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
${dueDate ? `Due Date: ${dueDate}` : ''}

View task: ${taskUrl || 'Check your dashboard'}
    `
  });

  return { html, text };
}

/**
 * Project Invitation Email Template
 */
export function projectInviteEmailTemplate({ userName, projectName, invitedBy, projectDescription, acceptUrl }) {
  const content = `
    <h2>Project Invitation 🎯</h2>
    <p>Hi ${userName},</p>
    <p><strong>${invitedBy}</strong> has invited you to join the project <strong>"${projectName}"</strong>.</p>
    
    ${projectDescription ? `
    <div class="info-box">
      <strong>Project Description:</strong><br>
      ${projectDescription}
    </div>
    ` : ''}
    
    <center>
      <a href="${acceptUrl || '#'}" class="button">Accept Invitation →</a>
    </center>
    
    <p>Click the button above to join the project and start collaborating with your team.</p>
  `;

  const html = baseEmailTemplate({
    title: 'Project Invitation',
    preheader: `You've been invited to join ${projectName}`,
    content
  });

  const text = plainTextTemplate({
    title: 'Project Invitation',
    content: `
Hi ${userName},

${invitedBy} has invited you to join "${projectName}".

${projectDescription ? `Description: ${projectDescription}` : ''}

Accept invitation: ${acceptUrl || 'Check your dashboard'}
    `
  });

  return { html, text };
}

export default {
  testEmailTemplate,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  taskAssignedEmailTemplate,
  projectInviteEmailTemplate
};

