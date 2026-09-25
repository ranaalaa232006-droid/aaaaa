const nodemailer = require('nodemailer'); // Import Nodemailer to send emails
const pug = require('pug'); // Import Pug to render email templates
const htmltotext = require ('html-to-text')
class Email {
  constructor(user, url) { // Create the Email class and receive the user and URL
    this.to = user.email; // Set the recipient email address
    this.firstName = user.name.split(' ')[0]; // Get the user's first name
    this.url = url; // Store the URL that will be included in the email
    this.from = `Natours <${process.env.EMAIL_FROM}>`; // Set the sender email address
  }

  newTransport() { // Create the email transporter
  if (process.env.NODE_ENV === 'production') { // If the app is running in production
    return nodemailer.createTransport({
      service: 'SendGrid', // Use SendGrid as the email service
      auth: {
        user: process.env.SENDGRID_USERNAME, // SendGrid username
        pass: process.env.SENDGRID_PASSWORD // SendGrid password/API key
      }
    });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Email service host for development
    port: process.env.EMAIL_PORT, // Email service port for development
    auth: {
      user: process.env.EMAIL_USERNAME, // Email username
      pass: process.env.EMAIL_PASSWORD // Email password
    }
  });
}

  async send(template, subject) { // Send an email using a specific template and subject
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, { // Render the Pug email template
      firstName: this.firstName, // Pass the user's first name to the template
      url: this.url, // Pass the URL to the template
      subject // Pass the email subject to the template
    });

    const mailOptions = { // Create the email options
      from: this.from, // Sender
      to: this.to, // Recipient
      subject, // Email subject
      html, // Email content
      text : htmltotext.fromString(html)
    };

    await this.newTransport().sendMail(mailOptions); // Send the email
  }
  async sendWelcome() {
    await this.send('welcome', 'welcome to the natours family ');
  }

  async passwordReset() {
    await this.send('passwordReset', 'Your password reset token (valid for 10 minutes)');
  }
}

module.exports = Email; // Export the Email class