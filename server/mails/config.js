import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Configuration for Swift Work Board
 * Professional email service setup with error handling
 * Configured for galaxyitt.com.ng custom domain
 */

// Email configuration for custom domain (galaxyitt.com.ng)
const emailConfig = {
  host: process.env.SMTP_HOST || 'mail.galaxyitt.com.ng', // Custom SMTP server
  port: parseInt(process.env.SMTP_PORT) || 465, // SSL port (use 587 for TLS)
  secure: process.env.SMTP_SECURE === 'true' || true, // Use SSL (true for port 465, false for port 587)
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates if needed
  }
};

// Common SMTP configurations:
// For cPanel/WHM hosting (like galaxyitt.com.ng):
// - host: mail.galaxyitt.com.ng or mail.yourdomain.com
// - port: 465 (SSL) or 587 (TLS)
// - secure: true for 465, false for 587

// For Gmail (if needed):
// - host: smtp.gmail.com
// - port: 587
// - secure: false

// For Outlook/Office365:
// - host: smtp.office365.com
// - port: 587
// - secure: false

/**
 * Create and configure email transporter
 * @returns {Object} Nodemailer transporter
 */
export function createEmailTransporter() {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection configuration
    transporter.verify(function (error, success) {
      if (error) {
        console.error('❌ Email server connection failed:', error.message);
        console.log('💡 Please check your EMAIL and EMAIL_PASSWORD in .env');
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    throw error;
  }
}

/**
 * Default sender information
 */
export const defaultSender = {
  name: 'Galaxy Information Technology and Telecommunication Limited',
  email: process.env.EMAIL || 'no-reply@galaxyitt.com.ng'
};

/**
 * Email template configuration
 */
export const emailTemplates = {
  welcome: {
    subject: 'Welcome to Swift Work Board! 🎉',
    preheader: 'Get started with your new account'
  },
  passwordReset: {
    subject: 'Reset Your Password - Swift Work Board',
    preheader: 'We received a request to reset your password'
  },
  emailVerification: {
    subject: 'Verify Your Email - Swift Work Board',
    preheader: 'Please verify your email address'
  },
  taskAssigned: {
    subject: 'New Task Assigned - Swift Work Board',
    preheader: 'You have been assigned a new task'
  },
  projectInvite: {
    subject: 'Project Invitation - Swift Work Board',
    preheader: 'You have been invited to join a project'
  },
  taskDue: {
    subject: 'Task Due Soon - Swift Work Board',
    preheader: 'Reminder: Your task is due soon'
  },
  test: {
    subject: 'Test Email - Swift Work Board',
    preheader: 'This is a test email from Swift Work Board'
  }
};

export default {
  createEmailTransporter,
  defaultSender,
  emailTemplates
};

