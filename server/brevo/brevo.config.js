const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 465,
  secure: true,
  auth: {
    user: "816128003@smtp-brevo.com",
    pass: "f7CNjxmBInyRJPaZ",
  },
});

const sender = "kiplangatsang08@gmail.com";

module.exports = {
  sender,
  transporter,
};
