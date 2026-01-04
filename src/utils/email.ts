import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendStatusUpdateEmail = async (
    to: string,
    studentName: string,
    jobTitle: string,
    companyName: string,
    status: string
) => {
    try {
        const statusMessages: Record<string, string> = {
            SHORTLISTED: `Congratulations! You have been shortlisted for the ${jobTitle} position at ${companyName}.`,
            REJECTED: `Thank you for your interest in the ${jobTitle} position at ${companyName}. Unfortunately, we will not be moving forward with your application at this time.`,
            HIRED: `Wonderful news! You have been hired for the ${jobTitle} position at ${companyName}. Welcome aboard!`,
            APPLIED: `Your application for the ${jobTitle} position at ${companyName} has been received.`,
        };

        const message = statusMessages[status] || `Your application status for ${jobTitle} at ${companyName} has been updated to ${status}.`;

        const mailOptions = {
            from: `"Placement Portal" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Application Status Update: ${jobTitle} at ${companyName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #2563eb;">Placement Portal Update</h2>
          <p>Hi <strong>${studentName}</strong>,</p>
          <p>${message}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 5px;">
            <p style="margin: 0;"><strong>Job:</strong> ${jobTitle}</p>
            <p style="margin: 5px 0 0 0;"><strong>Company:</strong> ${companyName}</p>
            <p style="margin: 5px 0 0 0;"><strong>New Status:</strong> <span style="color: #2563eb; font-weight: bold;">${status}</span></p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
            This is an automated message from the Placement Portal. Please do not reply to this email.
          </p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to} for status ${status}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // We don't throw here to avoid failing the status update if email fails
    }
};
