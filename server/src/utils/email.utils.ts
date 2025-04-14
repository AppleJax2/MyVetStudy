import nodemailer from 'nodemailer';
import AppError from './appError';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Utility to send emails using Nodemailer
 * @param options Email sending options
 * @returns Promise indicating email sending success
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    // Default from address if not provided
    const from = options.from || `"MyVetStudy" <${process.env.EMAIL_FROM || 'noreply@myvetstudy.com'}>`;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Verify connection
    await transporter.verify();
    
    // Define mail options
    const mailOptions = {
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML as fallback text
      html: options.html,
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    
    // If in development, log the error but don't throw
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sending error (development mode):', error);
      console.log('Email would have been sent with:', options);
      return; // Just return without throwing in dev
    }
    
    throw new AppError('Failed to send email', 500);
  }
};

/**
 * Send a test email to verify email configuration
 * @param recipient Email address to send test to
 * @returns Promise indicating email sending success
 */
export const sendTestEmail = async (recipient: string): Promise<void> => {
  await sendEmail({
    to: recipient,
    subject: 'MyVetStudy Email Test',
    html: `
      <h1>Email Configuration Test</h1>
      <p>If you're receiving this email, your MyVetStudy email configuration is working correctly.</p>
      <p>Time sent: ${new Date().toLocaleString()}</p>
    `,
  });
}; 