import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    // Используем Ethereal email для development
    // В production используй SendGrid, Mailgun, AWS SES и т.д.
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Создаем транспортер в зависимости от окружения
      if (process.env.EMAIL_SERVICE === 'mailgun' && process.env.MAILGUN_DOMAIN) {
        // Mailgun configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          auth: {
            user: process.env.MAILGUN_USER,
            pass: process.env.MAILGUN_PASS
          }
        });
        console.log('📧 Email service: Mailgun configured');
      } else if (process.env.SENDGRID_API_KEY) {
        // SendGrid configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        console.log('📧 Email service: SendGrid configured');
      } else if (process.env.SMTP_HOST) {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('📧 Email service: Generic SMTP configured');
      } else {
        // Ethereal for testing (development)
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('📧 Email service: Ethereal (test) configured');
        console.log('   Preview URL will be available in response');
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.transporter = null;
    }
  }

  async sendVerificationEmail(email, verificationCode, verificationLink) {
    if (!this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sairyne.com',
      to: email,
      subject: '🎵 Sairyne - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #06B6D4; text-align: center;">Welcome to Sairyne 🎵</h1>
          
          <p>Hi there!</p>
          
          <p>Thank you for signing up for Sairyne Alpha. To complete your registration, please verify your email address.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code:</p>
            <p style="font-size: 32px; font-weight: bold; color: #06B6D4; letter-spacing: 5px; margin: 10px 0;">${verificationCode}</p>
          </div>
          
          <p>Or click the link below to verify instantly:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="background: #06B6D4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email
            </a>
          </p>
          
          <p style="font-size: 12px; color: #999;">This link expires in 24 hours.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            If you didn't sign up for Sairyne, please ignore this email.
          </p>
          
          <p style="text-align: center; font-size: 12px; color: #999;">
            © 2025 Sairyne Tech. All rights reserved.
          </p>
        </div>
      `,
      text: `
Verification code: ${verificationCode}

Verify here: ${verificationLink}

This link expires in 24 hours.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      // Log preview URL for Ethereal (testing)
      if (process.env.NODE_ENV !== 'production' && info.response.includes('Ethereal')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('📧 Email preview:', previewUrl);
        return { success: true, previewUrl };
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      throw error;
    }
  }

  async sendWelcomeEmail(email, nick, apiKey) {
    if (!this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@sairyne.com',
      to: email,
      subject: '🎉 Your Sairyne Account is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #06B6D4; text-align: center;">Account Created Successfully! 🎉</h1>
          
          <p>Hi ${nick},</p>
          
          <p>Your Sairyne account is now active and ready to use.</p>
          
          <h2 style="color: #333; margin-top: 30px;">Your Credentials:</h2>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; font-family: 'Courier New', monospace;">
            <p><strong>Username:</strong> ${nick}</p>
            <p><strong>API Key:</strong> ${apiKey}</p>
          </div>
          
          <p style="color: #d97706; font-weight: bold;">⚠️ Keep your API Key safe. Do not share it with anyone.</p>
          
          <h2 style="color: #333; margin-top: 30px;">Next Steps:</h2>
          <ol>
            <li>Download the Sairyne plugin for your DAW</li>
            <li>Log in with your username and API Key</li>
            <li>Start creating better tracks faster!</li>
          </ol>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://sairyne.com/download" style="background: #06B6D4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Plugin
            </a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            Questions? Contact us at support@sairyne.com
          </p>
          
          <p style="text-align: center; font-size: 12px; color: #999;">
            © 2025 Sairyne Tech. All rights reserved.
          </p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      throw error;
    }
  }
}

const emailService = new EmailService();

export default emailService;

