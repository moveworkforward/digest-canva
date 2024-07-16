import * as nodemailer from "nodemailer";

const EMAIL_CONFIG = {
    host: "smtp.sendgrid.net",
    port: 465,
    auth: {
        user: "apikey",
        pass: "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",
    },
};

const SMTP_FROM_EMAIL = "natalia@moveworkforward.com"; 

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