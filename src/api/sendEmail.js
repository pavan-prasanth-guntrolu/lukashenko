import nodemailer from "nodemailer";

let currentAccountIndex = 0;

const SMTP_ACCOUNTS = [
  { email: process.env.SMTP_EMAIL_1, pass: process.env.SMTP_PASS_1 },
].filter((acc) => acc.email && acc.pass);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  const { fullName, email } = req.body;
  if (!fullName || !email)
    return res.status(400).json({ message: "Missing fields" });

  try {
    // const account = SMTP_ACCOUNTS[currentAccountIndex];
    // currentAccountIndex = (currentAccountIndex + 1) % SMTP_ACCOUNTS.length;
    const account = SMTP_ACCOUNTS[0];
    const remail = "s210894@rguktsklm.ac.in";
    const apppwd = "gctbjrtfryacgtga";
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: remail, pass: apppwd },
    });

    await transporter.sendMail({
      from: remail,
      to: email,
      subject: "✅ Registration Confirmed: Qiskit Fall Fest 2025",
      html: `<p>Hello ${fullName},</p>
             <p>Your registration for <strong>Qiskit Fall Fest 2025</strong> is confirmed! 🎉</p>
             <p>See you there!</p>`,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("SMTP ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to send email" });
  }
}
