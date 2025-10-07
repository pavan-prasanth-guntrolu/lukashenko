// supabase/functions/send-confirmation-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Gmail SMTP accounts configuration
const SMTP_ACCOUNTS = [
  {
    hostname: "smtp.gmail.com",
    port: 465,
    username: Deno.env.get("SMTP_EMAIL_1"),
    password: Deno.env.get("SMTP_PASSWORD_1"),
  },
  {
    hostname: "smtp.gmail.com",
    port: 465,
    username: Deno.env.get("SMTP_EMAIL_2"),
    password: Deno.env.get("SMTP_PASSWORD_2"),
  },
  {
    hostname: "smtp.gmail.com",
    port: 465,
    username: Deno.env.get("SMTP_EMAIL_3"),
    password: Deno.env.get("SMTP_PASSWORD_3"),
  },
  // Add more accounts as needed
].filter((account) => account.username && account.password); // Filter out undefined accounts

let currentAccountIndex = 0;

// Round-robin account selector
function getNextSMTPAccount() {
  const account = SMTP_ACCOUNTS[currentAccountIndex];
  currentAccountIndex = (currentAccountIndex + 1) % SMTP_ACCOUNTS.length;
  return account;
}

// Email template
function getEmailHTML(fullName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Registration Confirmed!</h1>
      </div>
      <div class="content">
        <p>Hi ${fullName},</p>
        
        <p>Congratulations! Your registration for <strong>Qiskit Fall Fest 2025</strong> at IIIT Srikakulam has been successfully confirmed.</p>
        
        <p>We're excited to have you join us for this incredible quantum computing celebration! 🚀</p>
        
        <p><strong>Next Steps:</strong></p>
        <ul>
          <li>Join our WhatsApp group for updates and announcements</li>
          <li>Mark your calendar for the event</li>
          <li>Get ready to explore the quantum world!</li>
        </ul>
        
        <p>See you at the event!</p>
        
        <p>Best regards,<br>
        <strong>Qiskit Fall Fest 2025 Team</strong><br>
        IIIT Srikakulam</p>
      </div>
      <div class="footer">
        <p>This is an automated confirmation email. Please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fullName, email } = await req.json();

    if (!fullName || !email) {
      return new Response(
        JSON.stringify({ error: "Missing fullName or email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (SMTP_ACCOUNTS.length === 0) {
      throw new Error("No SMTP accounts configured");
    }

    // Get next SMTP account using round-robin
    const smtpAccount = getNextSMTPAccount();

    console.log(`Using SMTP account: ${smtpAccount.username}`);

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to SMTP server
    await client.connectTLS({
      hostname: smtpAccount.hostname,
      port: smtpAccount.port,
      username: smtpAccount.username,
      password: smtpAccount.password,
    });

    // Send email
    await client.send({
      from: smtpAccount.username,
      to: email,
      subject: "✅ Registration Confirmed - Qiskit Fall Fest 2025",
      content: getEmailHTML(fullName),
      html: getEmailHTML(fullName),
    });

    // Close connection
    await client.close();

    console.log(
      `Email sent successfully to ${email} using ${smtpAccount.username}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Confirmation email sent successfully",
        usedAccount: smtpAccount.username,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to send confirmation email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
