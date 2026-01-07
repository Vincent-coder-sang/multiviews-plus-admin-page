const { transporter, sender } = require("./brevo.config");
const {  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE } = require("./emailTemplates");

const sendVerificationEmail = async (email, verificationCode) => {
  const recipient = email;
  try {
    const emailContent = VERIFICATION_EMAIL_TEMPLATE.replace(
      "{verificationCode}",
      verificationCode
    );

    const info = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: "Verify Your Email.",
      html: emailContent,
    });

    console.log("Verification email sent ✅", info.messageId);

  } catch (error) {
    
    throw new Error(`Error sending verification email: ${error}`);
  }
};

const sendWelcomeEmail = async (email, name) => {
  const recipient = email;
  const welcomeContent = WELCOME_EMAIL_TEMPLATE.replace("{name}", name);
  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: "Welcome!",
      html: welcomeContent, // Include the actual content or template here
    });

    console.log("Welcome email sent successfully", response);
  } catch (error) {
    console.error(`Error sending welcome email`, error);
    throw new Error(`Error sending welcome email: ${error}`);
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const recipient = email;

  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetLink}", resetLink),
      category: "Password Reset",
    });

    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.error(`Error sending password reset email`, error);
    throw new Error(`Error sending password reset email: ${error}`);
  }
};

const sendResetSuccessEmail = async (email) => {
  const recipient = email;

  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });

    console.log("Password reset success email sent successfully", response);
  } catch (error) {
    console.error(`Error sending password reset success email`, error);
    throw new Error(`Error sending password reset success email: ${error}`);
  }
};

// Updated sendNotificationEmail function with customizable subject and message
const sendNotificationEmail = async (email, subject, message) => {
  const recipient = email;

  try {
    const response = await transporter.sendMail({
      from: sender,
      to: recipient,
      subject: subject,
      html: message,
      category: "Notification",
    });

    console.log("Notification email sent successfully", response);
  } catch (error) {
    console.error(`Error sending notification email`, error);
    throw new Error(`Error sending notification email: ${error}`);
  }
};

module.exports = {
  sendNotificationEmail,
  sendNotificationEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
};
