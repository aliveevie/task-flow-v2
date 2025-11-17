import { baseEmailTemplate, plainTextTemplate } from './base.js';

/**
 * Project Invitation Email Template
 */
export function projectInvitationEmailTemplate({ inviteeName, projectName, inviterName, message, acceptLink, rejectLink, expiryTime }) {
  const content = `
    <h2>Project Invitation 🎯</h2>
    <p>Hi${inviteeName ? ` ${inviteeName}` : ''},</p>
    <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on TaskFlow.</p>
    
    ${message ? `
    <div class="info-box">
      <strong>Personal Message:</strong><br>
      ${message}
    </div>
    ` : ''}
    
    <p><strong>What is TaskFlow?</strong></p>
    <p>TaskFlow is a professional project management platform that helps teams collaborate, manage tasks, and track progress efficiently.</p>
    
    <center>
      <table cellpadding="10" cellspacing="0" border="0">
        <tr>
          <td>
            <a href="${acceptLink}" style="display: inline-block; padding: 14px 32px; background: #10b981 !important; background-color: #10b981 !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">✓ Accept Invitation</a>
          </td>
          <td width="20"></td>
          <td>
            <a href="${rejectLink}" style="display: inline-block; padding: 14px 32px; background: #ef4444 !important; background-color: #ef4444 !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">✗ Decline</a>
          </td>
        </tr>
      </table>
    </center>
    
    <div class="info-box">
      <strong>⏰ Important:</strong><br>
      This invitation will expire in ${expiryTime || '7 days'}.<br>
      Please respond before it expires.
    </div>
    
    <p><strong>What happens next?</strong></p>
    <ul>
      <li>✅ If you accept: You'll join the project and can start collaborating</li>
      <li>❌ If you decline: The admin will be notified</li>
    </ul>
    
    <div class="divider"></div>
    
    <p style="color: #999; font-size: 14px;">
      <strong>Note:</strong> If you don't have a TaskFlow account, you'll be able to create one after accepting.
    </p>
  `;

  const html = baseEmailTemplate({
    title: `Project Invitation: ${projectName}`,
    preheader: `${inviterName} invited you to join ${projectName}`,
    content,
    footerText: `You received this because ${inviterName} invited you to join a project on TaskFlow`
  });

  const text = plainTextTemplate({
    title: `Project Invitation: ${projectName}`,
    content: `
Hi${inviteeName ? ` ${inviteeName}` : ''},

${inviterName} has invited you to join the project "${projectName}" on TaskFlow.

${message ? `Personal Message: ${message}\n` : ''}

Accept invitation: ${acceptLink}
Decline invitation: ${rejectLink}

This invitation expires in ${expiryTime || '7 days'}.

What is TaskFlow?
TaskFlow is a professional project management platform for team collaboration.
    `
  });

  return { html, text };
}

/**
 * Invitation Accepted - Notify Admin
 */
export function invitationAcceptedEmailTemplate({ adminName, userName, userEmail, projectName, projectUrl }) {
  const content = `
    <h2>Invitation Accepted! ✅</h2>
    <p>Hi ${adminName},</p>
    <p>Great news! <strong>${userName}</strong> has accepted your invitation to join the project <strong>"${projectName}"</strong>.</p>
    
    <div class="info-box">
      <strong>New Team Member:</strong><br>
      Name: ${userName}<br>
      Email: ${userEmail}
    </div>
    
    <center>
      <a href="${projectUrl}" style="display: inline-block; padding: 14px 32px; background: #667eea !important; background-color: #667eea !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">View Project →</a>
    </center>
    
    <p><strong>What's next?</strong></p>
    <ul>
      <li>🎯 Assign tasks to ${userName}</li>
      <li>💬 Start collaborating on the project</li>
      <li>📊 Track progress together</li>
    </ul>
  `;

  const html = baseEmailTemplate({
    title: 'Invitation Accepted!',
    preheader: `${userName} joined your project`,
    content
  });

  const text = plainTextTemplate({
    title: 'Invitation Accepted!',
    content: `
Hi ${adminName},

${userName} has accepted your invitation to join "${projectName}".

New Team Member:
Name: ${userName}
Email: ${userEmail}

View project: ${projectUrl}
    `
  });

  return { html, text };
}

/**
 * Invitation Rejected - Notify Admin
 */
export function invitationRejectedEmailTemplate({ adminName, userEmail, projectName, projectUrl }) {
  const content = `
    <h2>Invitation Declined</h2>
    <p>Hi ${adminName},</p>
    <p><strong>${userEmail}</strong> has declined your invitation to join the project <strong>"${projectName}"</strong>.</p>
    
    <center>
      <a href="${projectUrl}" style="display: inline-block; padding: 14px 32px; background: #667eea !important; background-color: #667eea !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">View Project →</a>
    </center>
    
    <p>You can invite other team members or try inviting them again later.</p>
  `;

  const html = baseEmailTemplate({
    title: 'Invitation Declined',
    preheader: `${userEmail} declined your project invitation`,
    content
  });

  const text = plainTextTemplate({
    title: 'Invitation Declined',
    content: `
Hi ${adminName},

${userEmail} has declined your invitation to join "${projectName}".

View project: ${projectUrl}
    `
  });

  return { html, text };
}

/**
 * Welcome to Project Email
 */
export function welcomeToProjectEmailTemplate({ userName, projectName, inviterName, projectUrl, dashboardUrl }) {
  const content = `
    <h2>Welcome to ${projectName}! 🎉</h2>
    <p>Hi ${userName},</p>
    <p>You've successfully joined the project <strong>"${projectName}"</strong> invited by <strong>${inviterName}</strong>!</p>
    
    <center>
      <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: #667eea !important; background-color: #667eea !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0;">Go to Dashboard →</a>
    </center>
    
    <p><strong>What you can do now:</strong></p>
    <ul>
      <li>📋 View assigned tasks</li>
      <li>✅ Update task status</li>
      <li>💬 Collaborate with team members</li>
      <li>📊 Track project progress</li>
    </ul>
    
    <div class="divider"></div>
    
    <p>If you need help getting started, feel free to reach out to ${inviterName} or check our documentation.</p>
  `;

  const html = baseEmailTemplate({
    title: `Welcome to ${projectName}!`,
    preheader: `You're now part of ${projectName}`,
    content
  });

  const text = plainTextTemplate({
    title: `Welcome to ${projectName}!`,
    content: `
Hi ${userName},

You've successfully joined "${projectName}" invited by ${inviterName}!

Go to dashboard: ${dashboardUrl}

What you can do:
- View assigned tasks
- Update task status
- Collaborate with team
- Track progress
    `
  });

  return { html, text };
}

/**
 * Leave Request Email to Admin
 */
export function leaveRequestEmailTemplate({ adminName, userName, projectName, reason, approveLink, rejectLink }) {
  const content = `
    <h2>Leave Request</h2>
    <p>Hi ${adminName},</p>
    <p><strong>${userName}</strong> has requested to leave the project <strong>"${projectName}"</strong>.</p>
    
    ${reason ? `
    <div class="info-box">
      <strong>Reason:</strong><br>
      ${reason}
    </div>
    ` : ''}
    
    <center>
      <table cellpadding="10" cellspacing="0" border="0">
        <tr>
          <td>
            <a href="${approveLink}" style="display: inline-block; padding: 14px 32px; background: #10b981 !important; background-color: #10b981 !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">✓ Approve</a>
          </td>
          <td width="20"></td>
          <td>
            <a href="${rejectLink}" style="display: inline-block; padding: 14px 32px; background: #ef4444 !important; background-color: #ef4444 !important; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">✗ Reject</a>
          </td>
        </tr>
      </table>
    </center>
  `;

  const html = baseEmailTemplate({
    title: 'Leave Request',
    preheader: `${userName} wants to leave ${projectName}`,
    content
  });

  const text = plainTextTemplate({
    title: 'Leave Request',
    content: `
Hi ${adminName},

${userName} has requested to leave "${projectName}".

${reason ? `Reason: ${reason}\n` : ''}

Approve: ${approveLink}
Reject: ${rejectLink}
    `
  });

  return { html, text };
}

export default {
  projectInvitationEmailTemplate,
  invitationAcceptedEmailTemplate,
  invitationRejectedEmailTemplate,
  welcomeToProjectEmailTemplate,
  leaveRequestEmailTemplate
};

