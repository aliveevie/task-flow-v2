/**
 * Base Email Template
 * Professional HTML email template with responsive design
 */

export function baseEmailTemplate({ title, preheader, content, footerText }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f6f9fc;
            line-height: 1.6;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
        }
        .content h2 {
            color: #1a1a1a;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        .content p {
            font-size: 16px;
            color: #555555;
            margin: 16px 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: #667eea !important;
            background-color: #667eea !important;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .button:hover {
            background: #5568d3 !important;
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #999999;
            font-size: 14px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 24px 0;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .content h2 {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">
        ${preheader}
    </div>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f6f9fc; padding: 20px 0;">
        <tr>
            <td align="center">
                <table class="email-container" cellpadding="0" cellspacing="0" border="0" width="600">
                    <!-- Header -->
                    <tr>
                        <td class="header">
                            <div class="logo">
                                <img src="cid:companylogo" alt="Galaxy ITT Logo" style="width: 80px; height: 80px; object-fit: contain;" />
                            </div>
                            <h1>TaskFlow</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">by Galaxy Information Technology and Telecommunication Limited</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td class="content">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="footer">
                            <p>${footerText || 'This email was sent from TaskFlow by Galaxy Information Technology and Telecommunication Limited'}</p>
                            <p>
                                <a href="https://galaxyitt.com.ng">Visit Our Website</a> | 
                                <a href="mailto:support@galaxyitt.com.ng">Contact Support</a>
                            </p>
                            <p style="margin-top: 20px;">
                                © ${new Date().getFullYear()} TaskFlow by Galaxy Information Technology and Telecommunication Limited. All rights reserved.
                            </p>
                            <p style="font-size: 12px; color: #aaa;">
                                Galaxy Information Technology and Telecommunication Limited<br>
                                Nigeria<br>
                                Email: support@galaxyitt.com.ng | Web: galaxyitt.com.ng
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text version generator
 */
export function plainTextTemplate({ title, content }) {
  return `
TASKFLOW
by Galaxy Information Technology and Telecommunication Limited
================================================================

${title}

${content}

---
This email was sent from TaskFlow by Galaxy Information Technology and Telecommunication Limited
© ${new Date().getFullYear()} TaskFlow by Galaxy Information Technology and Telecommunication Limited. All rights reserved.

Galaxy Information Technology and Telecommunication Limited
Nigeria
Email: support@galaxyitt.com.ng | Web: galaxyitt.com.ng
  `.trim();
}

export default { baseEmailTemplate, plainTextTemplate };

