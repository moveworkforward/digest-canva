import * as nodemailer from "nodemailer";

const EMAIL_CONFIG = {
    host: "smtp.sendgrid.net",
    port: 465,
    auth: {
        user: "apikey",
        pass: process.env.EMAIL_API_KEY,
    },
};

const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL;

export const sendEmail = async (params: { to: string, subject: string, html: string, attachments?: any }) => {
    const { to, subject, html, attachments } = params;
    const transporter = nodemailer.createTransport(EMAIL_CONFIG);

    const mailOptions = {
        from: SMTP_FROM_EMAIL,
        to,
        subject,
        html,
        attachments,
    };

    await transporter.sendMail(mailOptions);
};