import nodemailer from "nodemailer";

// Keep track of current SMTP index for round-robin
let currentAccountIndex = 0;

const SMTP_ACCOUNTS = [
  { email: process.env.SMTP_EMAIL_1, pass: process.env.SMTP_PASS_1 },
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { fullName, email } = req.body;

  try {
    const account = SMTP_ACCOUNTS[currentAccountIndex];
    currentAccountIndex = (currentAccountIndex + 1) % SMTP_ACCOUNTS.length;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: account.email,
        pass: account.pass,
      },
    });

    const mailOptions = {
      from: account.email,
      to: email,
      subject: "Registration Confirmed: Qiskit Fall Fest 2025",
      html: `<p>Hello ${fullName},</p>
             <p>Your registration for <strong>Qiskit Fall Fest 2025</strong> at IIIT Srikakulam is confirmed! 🎉</p>
             <p>See you there!</p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send email" });
  }
}
