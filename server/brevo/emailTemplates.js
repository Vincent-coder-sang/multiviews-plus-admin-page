const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email | Monster Tipster</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
      padding: 30px 20px;
      color: #ffffff;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .logo span {
      color: #ffd700;
    }
    .content {
      padding: 30px;
      text-align: center;
      line-height: 1.6;
    }
    .verification-code {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #6e48aa;
      background-color: #f3e5ff;
      padding: 20px 40px;
      border-radius: 8px;
      display: inline-block;
      margin: 25px 0;
      box-shadow: 0 4px 6px rgba(110, 72, 170, 0.1);
    }
    .cta-text {
      font-size: 18px;
      margin: 20px 0;
      color: #444;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #eee;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      margin: 0 10px;
      text-decoration: none;
    }
    .highlight {
      color: #6e48aa;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MONSTER<span> TIPSTER</span></div>
      <h2>Verify Your Email</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p class="cta-text">Welcome to <span class="highlight">Monster Tipster</span>! Please verify your email address to activate your account.</p>
      
      <div class="verification-code">{verificationCode}</div>
      
      <p>Enter this verification code in our app or on the website to complete your registration.</p>
      <p>This code will expire in <span class="highlight">1 hour</span> for security reasons.</p>
      <p>If you didn't create an account with us, please ignore this email.</p>
    </div>
    <div class="footer">
    
      <p>© ${new Date().getFullYear()} Monster Tipster. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful | Monster Tipster</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
      padding: 30px 20px;
      color: #ffffff;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .logo span {
      color: #ffd700;
    }
    .content {
      padding: 30px;
      text-align: center;
      line-height: 1.6;
    }
    .success-icon {
      width: 80px;
      height: 80px;
      background: #e8f5e9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 20px auto;
      color: #4CAF50;
      font-size: 40px;
      box-shadow: 0 4px 6px rgba(76, 175, 80, 0.1);
    }
    .security-tips {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
      text-align: left;
    }
    .security-tips h3 {
      color: #6e48aa;
      margin-top: 0;
    }
    .security-tips ul {
      padding-left: 20px;
    }
    .security-tips li {
      margin-bottom: 8px;
    }
    .highlight {
      color: #6e48aa;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MONSTER<span>TIPSTER</span></div>
      <h2>Password Reset Successful</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your Monster Tipster password has been successfully updated.</p>
      
      <div class="success-icon">✓</div>
      
      <div class="security-tips">
        <h3>Security Recommendations</h3>
        <ul>
          <li>Use a unique password that you don't use elsewhere</li>
          <li>Change your password every few months</li>
      
          <li>Never share your password with anyone</li>
        </ul>
      </div>
      
      <p>If you didn't request this change, please <span class="highlight">contact our support team immediately</span>.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Monster Tipster. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password | Monster Tipster</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
      padding: 30px 20px;
      color: #ffffff;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .logo span {
      color: #ffd700;
    }
    .content {
      padding: 30px;
      text-align: center;
      line-height: 1.6;
    }
    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      margin: 25px 0;
      box-shadow: 0 4px 15px rgba(110, 72, 170, 0.3);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .reset-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(110, 72, 170, 0.4);
    }
    .expiry-notice {
      background: #fff8e1;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      color: #e65100;
    }
    .highlight {
      color: #6e48aa;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MONSTER<span>TIPSTER</span></div>
      <h2>Reset Your Password</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your <span class="highlight">Monster Tipster</span> account password.</p>
      
      <a href="{resetLink}" class="reset-button">Reset Password Now</a>
      
      <div class="expiry-notice">
        <p>This link will expire in <span class="highlight">1 hour</span> for security reasons.</p>
      </div>
      
      <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Monster Tipster. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const WELCOME_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Monster Tipster</title>
  <style>
    body {
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
      padding: 30px 20px;
      color: #ffffff;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }
    .logo span {
      color: #ffd700;
    }
    .content {
      padding: 30px;
      text-align: center;
      line-height: 1.6;
    }
    .welcome-image {
      width: 150px;
      height: auto;
      margin: 20px 0;
    }
    .cta-section {
      background: #f3e5ff;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6e48aa 0%, #9d50bb 100%);
      color: white;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 30px;
      font-weight: bold;
      margin-top: 15px;
      box-shadow: 0 4px 15px rgba(110, 72, 170, 0.3);
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 15px;
      margin: 25px 0;
    }
    .feature {
      flex: 1;
      min-width: 120px;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .feature-icon {
      font-size: 24px;
      color: #6e48aa;
      margin-bottom: 10px;
    }
    .highlight {
      color: #6e48aa;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #eee;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      margin: 0 10px;
      text-decoration: none;
      color: #6e48aa;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">MONSTER<span>TIPSTER</span></div>
      <h2>Welcome, {name}!</h2>
    </div>
    <div class="content">
      
      <p>We're thrilled to have you join the <span class="highlight">Monster Tipster</span> community!</p>
      
      <div class="cta-section">
        <p>Get started by exploring our premium tips and predictions</p>
        <a href="https://monster-tipster.onrender.com/auth/login" class="cta-button">Start Exploring</a>
      </div>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🏆</div>
          <h3>Expert Tips</h3>
          <p>Daily predictions from our experts</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <h3>Stats Analysis</h3>
          <p>Detailed statistics for every match</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🔒</div>
          <h3>VIP Access</h3>
          <p>Exclusive content for members</p>
        </div>
      </div>
      
    </div>
    <div class="footer">
    
      <p>© ${new Date().getFullYear()} Monster Tipster. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE
};