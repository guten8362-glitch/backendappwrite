import { Client, Messaging, ID } from 'node-appwrite';
import { Resend } from 'resend';

/**
 * Appwrite Serverless Function for Notification Service
 * Triggered by client-side createExecution() calls.
 * Uses node-appwrite Server SDK with API Key for secure dispatch
 * and Resend.com for booking confirmation emails.
 */
export default async ({ req, res, log, error }) => {
  log('Notification Function triggered');

  // Initialize Appwrite Server SDK using runtime environment variables
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_FUNCTION_API_KEY || '');

  const messaging = new Messaging(client);

  try {
    let payload = {};
    if (typeof req.bodyRaw === 'string' && req.bodyRaw) {
      payload = JSON.parse(req.bodyRaw);
    } else if (typeof req.body === 'string' && req.body) {
      payload = JSON.parse(req.body);
    } else if (typeof req.body === 'object' && req.body !== null) {
      payload = req.body;
    }

    const { action, users, email, recipientEmail, title, body, subject, content, data, icon, bookingDetails } = payload;

    if (action === 'push') {
      if (!users || !users.length) {
        return res.json({ success: false, message: 'No target users specified for push notification' }, 400);
      }

      log(`Sending Push Notification: "${title}" to users: ${users.join(', ')}`);

      const message = await messaging.createPush(
        ID.unique(),
        title || 'Notification',
        body || '',
        [], // topics
        users, // target users array
        [], // targets
        data || {},
        icon || '',
        false // sound
      );

      return res.json({ success: true, action: 'push', messageId: message.$id });
    }

    // Booking Confirmation Email Handler via Resend.com
    if (action === 'booking_confirmation_email' || action === 'send_booking_email') {
      const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
      if (!resendApiKey) {
        log('Warning: RESEND_API_KEY not configured in environment. Skipping email dispatch.');
        return res.json({ success: false, message: 'RESEND_API_KEY environment variable missing' }, 200);
      }

      const targetEmail = recipientEmail || email || (bookingDetails && bookingDetails.userEmail);
      const userName = (bookingDetails && bookingDetails.userName) || payload.userName || 'Valued User';
      const bookingId = (bookingDetails && bookingDetails.bookingId) || payload.bookingId || 'N/A';
      const auditoriumName = (bookingDetails && bookingDetails.auditoriumName) || payload.auditoriumName || 'Auditorium';
      const bookingDate = (bookingDetails && bookingDetails.date) || payload.date || 'N/A';
      const bookingTime = (bookingDetails && bookingDetails.time) || payload.time || 'N/A';

      if (!targetEmail) {
        return res.json({ success: false, message: 'Recipient email address missing' }, 400);
      }

      log(`Sending Resend Confirmation Email to: ${targetEmail}`);

      try {
        const resend = new Resend(resendApiKey);
        const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; color: #ffffff; padding: 32px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; color: #94a3b8; font-size: 13px; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .badge { display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; }
    .card { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .card-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-b: 1px solid #cbd5e1; padding-bottom: 8px; }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
    .detail-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; font-weight: 500; }
    .value { color: #0f172a; font-weight: 700; text-align: right; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Central Auditorium Booking</h1>
      <p>College Booking System</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      <div class="badge">✓ Auditorium Booking Confirmed ✅</div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
        Your auditorium booking has been successfully confirmed. Below are your official booking details:
      </p>

      <div class="card">
        <div class="card-title">Booking Confirmation Details</div>
        <div class="detail-row"><span class="label">Booking ID:</span><span class="value">${bookingId}</span></div>
        <div class="detail-row"><span class="label">Auditorium Name:</span><span class="value">${auditoriumName}</span></div>
        <div class="detail-row"><span class="label">Date:</span><span class="value">${bookingDate}</span></div>
        <div class="detail-row"><span class="label">Time:</span><span class="value">${bookingTime}</span></div>
        <div class="detail-row"><span class="label">Booked By:</span><span class="value">${userName}</span></div>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
        Thank you for using our College Auditorium Booking System.
      </p>
    </div>
    <div class="footer">
      This is an automated confirmation email. Please retain this email for your records.
    </div>
  </div>
</body>
</html>
        `;

        const resendData = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Central Hall Booking <onboarding@resend.dev>',
          to: [targetEmail],
          subject: 'Auditorium Booking Confirmed ✅',
          html: htmlTemplate,
        });

        log(`Resend Email Sent Successfully: ${JSON.stringify(resendData)}`);
        return res.json({ success: true, action: 'email', resendData });
      } catch (resendErr) {
        error(`Email sending failed: ${resendErr.message || resendErr}`);
        return res.json({ success: false, error: resendErr.message }, 500);
      }
    }

    if (action === 'email') {
      if (!users || !users.length) {
        return res.json({ success: false, message: 'No target users specified for email notification' }, 400);
      }

      log(`Sending Email Notification: "${subject}" to users: ${users.join(', ')}`);

      const message = await messaging.createEmail(
        ID.unique(),
        subject || 'Notification',
        content || '',
        [], // topics
        users, // target users array
        [], // targets
        [] // cc/bcc
      );

      return res.json({ success: true, action: 'email', messageId: message.$id });
    }

    return res.json({ success: false, message: 'Invalid or missing action in payload' }, 400);
  } catch (err) {
    error(`Error executing Notification Function: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
