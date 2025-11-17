import { createEmailTransporter, defaultSender } from './config.js';
import * as templates from './templates/index.js';
import * as verificationTemplates from './templates/verification.js';
import * as invitationTemplates from './templates/invitations.js';

/**
 * Professional Email Service for Swift Work Board
 * Handles all email operations with proper error handling and logging
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.isReady = false;
  }

  /**
   * Initialize email service
   */
  async initialize() {
    try {
      this.transporter = createEmailTransporter();
      this.isReady = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isReady = false;
      return false;
    }
  }

  /**
   * Send email with proper error handling
   */
  async sendEmail({ to, subject, html, text, from, attachments = [], embedLogo = true }) {
    if (!this.isReady || !this.transporter) {
      throw new Error('Email service is not initialized');
    }

    try {
      // Add logo as inline attachment
      const emailAttachments = [...attachments];
      
      if (embedLogo) {
        emailAttachments.push({
          filename: 'logo.png',
          path: process.cwd() + '/../public/galaxyitt_logo.png',
          cid: 'companylogo' // same cid value as in the html img src
        });
      }

      const mailOptions = {
        from: from || `${defaultSender.name} <${defaultSender.email}>`,
        to,
        subject,
        html,
        text,
        attachments: emailAttachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Message ID: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        info
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(recipientEmail, recipientName, testMessage) {
    const { html, text } = templates.testEmailTemplate({
      recipientName,
      testMessage
    });

    return await this.sendEmail({
      to: recipientEmail,
      subject: 'Test Email - Swift Work Board',
      html,
      text
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail({ to, userName, userEmail, loginUrl }) {
    const { html, text } = templates.welcomeEmailTemplate({
      userName,
      userEmail,
      loginUrl
    });

    return await this.sendEmail({
      to,
      subject: 'Welcome to Swift Work Board! 🎉',
      html,
      text
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail({ to, userName, resetLink, expiryTime }) {
    const { html, text } = templates.passwordResetEmailTemplate({
      userName,
      resetLink,
      expiryTime
    });

    return await this.sendEmail({
      to,
      subject: 'Reset Your Password - Swift Work Board',
      html,
      text
    });
  }

  /**
   * Send task assignment email
   */
  async sendTaskAssignedEmail({ to, userName, taskTitle, taskDescription, projectName, dueDate, taskUrl }) {
    const { html, text } = templates.taskAssignedEmailTemplate({
      userName,
      taskTitle,
      taskDescription,
      projectName,
      dueDate,
      taskUrl
    });

    return await this.sendEmail({
      to,
      subject: `New Task Assigned: ${taskTitle}`,
      html,
      text
    });
  }

  /**
   * Send project invitation email
   */
  async sendProjectInviteEmail({ to, userName, projectName, invitedBy, projectDescription, acceptUrl }) {
    const { html, text } = templates.projectInviteEmailTemplate({
      userName,
      projectName,
      invitedBy,
      projectDescription,
      acceptUrl
    });

    return await this.sendEmail({
      to,
      subject: `Project Invitation: ${projectName}`,
      html,
      text
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail({ to, userName, verificationLink, expiryTime }) {
    const { html, text } = verificationTemplates.emailVerificationTemplate({
      userName,
      verificationLink,
      expiryTime
    });

    return await this.sendEmail({
      to,
      subject: 'Verify Your Email - TaskFlow',
      html,
      text
    });
  }

  /**
   * Send email verified success email
   */
  async sendEmailVerifiedEmail({ to, userName, loginUrl }) {
    const { html, text } = verificationTemplates.emailVerifiedTemplate({
      userName,
      loginUrl
    });

    return await this.sendEmail({
      to,
      subject: 'Welcome to TaskFlow! Your Account is Active',
      html,
      text
    });
  }

  /**
   * Send project invitation email
   */
  async sendProjectInvitationEmail({ to, inviteeName, projectName, inviterName, message, acceptLink, rejectLink, expiryTime }) {
    const { html, text } = invitationTemplates.projectInvitationEmailTemplate({
      inviteeName,
      projectName,
      inviterName,
      message,
      acceptLink,
      rejectLink,
      expiryTime
    });

    return await this.sendEmail({
      to,
      subject: `Project Invitation: ${projectName}`,
      html,
      text
    });
  }

  /**
   * Send invitation accepted notification to admin
   */
  async sendInvitationAcceptedEmail({ to, adminName, userName, userEmail, projectName, projectUrl }) {
    const { html, text } = invitationTemplates.invitationAcceptedEmailTemplate({
      adminName,
      userName,
      userEmail,
      projectName,
      projectUrl
    });

    return await this.sendEmail({
      to,
      subject: `${userName} Accepted Your Invitation!`,
      html,
      text
    });
  }

  /**
   * Send invitation rejected notification to admin
   */
  async sendInvitationRejectedEmail({ to, adminName, userEmail, projectName, projectUrl }) {
    const { html, text } = invitationTemplates.invitationRejectedEmailTemplate({
      adminName,
      userEmail,
      projectName,
      projectUrl
    });

    return await this.sendEmail({
      to,
      subject: `Invitation Declined for ${projectName}`,
      html,
      text
    });
  }

  /**
   * Send welcome to project email
   */
  async sendWelcomeToProjectEmail({ to, userName, projectName, inviterName, projectUrl, dashboardUrl }) {
    const { html, text } = invitationTemplates.welcomeToProjectEmailTemplate({
      userName,
      projectName,
      inviterName,
      projectUrl,
      dashboardUrl
    });

    return await this.sendEmail({
      to,
      subject: `Welcome to ${projectName}!`,
      html,
      text
    });
  }

  /**
   * Send leave request email to admin
   */
  async sendLeaveRequestEmail({ to, adminName, userName, projectName, reason, approveLink, rejectLink }) {
    const { html, text } = invitationTemplates.leaveRequestEmailTemplate({
      adminName,
      userName,
      projectName,
      reason,
      approveLink,
      rejectLink
    });

    return await this.sendEmail({
      to,
      subject: `Leave Request from ${userName} - ${projectName}`,
      html,
      text
    });
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(emails) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await this.sendEmail(email);
        results.push({ ...result, email: email.to });
      } catch (error) {
        results.push({
          success: false,
          email: email.to,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isReady: this.isReady,
      transporter: this.transporter ? 'Connected' : 'Not connected',
      email: process.env.EMAIL || 'Not configured'
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

// Export service instance
export default emailService;

