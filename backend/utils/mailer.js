const https = require("https");
const nodemailer = require("nodemailer");

function buildHtml({ donorName, amount, campaignTitle, paymentId }) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #fffbeb; border: 1px solid #f59e0b; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #D35400, #E67E22); padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">🙏 Hare Krishna, ${donorName}!</h1>
        <p style="color: #fff; opacity: 0.8; margin: 6px 0 0; font-size: 13px;">Thank you for your generous donation</p>
      </div>
      <div style="padding: 20px;">
        <p style="color: #5D6D7E; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          We are grateful for your kind contribution to <strong style="color: #7B241C;">${campaignTitle}</strong>.
          Your support helps us continue our mission of serving the community. Thank you for being a part of this journey.
        </p>
        <div style="background: #fff; border: 1px solid #E8DCCF; border-radius: 8px; padding: 14px; margin: 0 0 16px;">
          <p style="color: #7B241C; font-weight: bold; font-size: 14px; margin: 0 0 10px;">Donation Details</p>
          <p style="margin: 0; padding: 5px 0; font-size: 13px; color: #5D6D7E; border-bottom: 1px solid #f0e8dd;"><strong>Donor:</strong> ${donorName}</p>
          <p style="margin: 0; padding: 5px 0; font-size: 13px; color: #5D6D7E; border-bottom: 1px solid #f0e8dd;"><strong>Amount:</strong> <span style="color: #D35400; font-size: 16px; font-weight: bold;">₹${amount.toLocaleString("en-IN")}</span></p>
          <p style="margin: 0; padding: 5px 0; font-size: 13px; color: #5D6D7E; border-bottom: 1px solid #f0e8dd;"><strong>Campaign:</strong> ${campaignTitle}</p>
          <p style="margin: 0; padding: 5px 0; font-size: 11px; color: #5D6D7E; border-bottom: 1px solid #f0e8dd; word-break: break-all;"><strong>Payment ID:</strong> ${paymentId}</p>
          <p style="margin: 0; padding: 5px 0; font-size: 13px; color: #5D6D7E;"><strong>Date:</strong> ${date}</p>
        </div>
        <p style="color: #7B241C; font-style: italic; font-size: 12px; text-align: center; margin: 0; line-height: 1.5;">
          "If you simply give some contribution to spreading this Krishna consciousness movement, you get a permanent credit."
          <br/><strong>— Srila Prabhupada</strong>
        </p>
      </div>
      <div style="background: #7B241C; padding: 12px; text-align: center; color: #FADBD8; font-size: 11px;">
        <p style="margin: 0;">Inspire MANIT · Bhopal, MP</p>
        <p style="margin: 3px 0 0;">📞 +91 76929 32955 · ✉️ inspiremanit@gmail.com</p>
      </div>
    </div>
  `;
}

// Send via Resend using Node https module
function sendViaResend({ donorName, donorEmail, amount, campaignTitle, paymentId }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: "Inspire MANIT <onboarding@resend.dev>",
      to: donorEmail,
      subject: `🙏 Hare Krishna! Donation Receipt – ₹${amount.toLocaleString("en-IN")}`,
      html: buildHtml({ donorName, amount, campaignTitle, paymentId }),
    });

    const req = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const parsed = JSON.parse(data);
          if (parsed.id) {
            console.log(`Receipt sent via Resend to ${donorEmail}`);
            resolve();
          } else {
            reject(new Error(data));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// Send via Gmail SMTP
async function sendViaSmtp({ donorName, donorEmail, amount, campaignTitle, paymentId }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({
    from: `"Inspire MANIT" <${process.env.EMAIL_USER}>`,
    to: donorEmail,
    subject: `🙏 Hare Krishna! Donation Receipt – ₹${amount.toLocaleString("en-IN")}`,
    html: buildHtml({ donorName, amount, campaignTitle, paymentId }),
  });
  console.log(`Receipt sent via SMTP to ${donorEmail}`);
}

// Main — tries SMTP first, falls back to Resend
async function sendDonationReceipt(params) {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendViaSmtp(params);
    } else if (process.env.RESEND_API_KEY) {
      await sendViaResend(params);
    } else {
      console.log("No email provider configured, skipping receipt.");
    }
  } catch (err) {
    console.error("Email failed:", err.message);
  }
}

module.exports = { sendDonationReceipt };
