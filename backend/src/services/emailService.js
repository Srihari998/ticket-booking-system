const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (!transporter && config.smtp.host && config.smtp.user) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password
      }
    });
  }
  return transporter;
};

const sendBookingConfirmation = async ({
  to,
  toEmail,
  recipientName,
  userName,
  bookingReference,
  eventTitle,
  venueName,
  eventDate,
  startTime,
  totalAmount,
  seats = [],
  qrDataUrl
}) => {
  const recipient = to || toEmail;
  const name = recipientName || userName || 'Valued Customer';
  const seatsList = seats.map((s) => `${s.rowLabel || s.row_label || ''}${s.seatNumber || s.seat_number || ''} (${s.categoryName || s.category_name || ''})`).join(', ');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5; margin-bottom: 4px;">Ticket Confirmation</h2>
      <p style="color: #666; margin-top: 0;">Hi ${name}, your ticket is confirmed!</p>
      
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Booking Reference</p>
        <h3 style="margin: 4px 0 12px 0; color: #1e293b; letter-spacing: 1px;">${bookingReference}</h3>
        
        <p style="margin: 4px 0;"><strong>Event:</strong> ${eventTitle}</p>
        <p style="margin: 4px 0;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date(eventDate).toLocaleDateString()} at ${startTime}</p>
        <p style="margin: 4px 0;"><strong>Seats:</strong> ${seatsList}</p>
        <p style="margin: 4px 0; font-size: 16px; color: #059669;"><strong>Total Amount Paid:</strong> ₹${parseFloat(totalAmount).toFixed(0)}</p>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <p style="font-size: 13px; color: #64748b; margin-bottom: 8px;">Show this QR code at the entrance for admission</p>
        <img src="${qrDataUrl}" alt="Booking QR Code" style="width: 180px; height: 180px; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; background: white;" />
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">Thank you for booking with TicketEase.</p>
    </div>
  `;

  const transport = getTransporter();

  if (transport) {
    try {
      await transport.sendMail({
        from: config.smtp.from,
        to: recipient,
        subject: `Booking Confirmation - ${bookingReference}`,
        html: htmlContent
      });
      return true;
    } catch (err) {
      return false;
    }
  } else {
    console.log('================ EMAIL PAYLOAD (MOCK / LOCAL) ================');
    console.log(`To: ${recipient}`);
    console.log(`Subject: Booking Confirmation - ${bookingReference}`);
    console.log(`Event: ${eventTitle} | Venue: ${venueName} | Date: ${eventDate} ${startTime}`);
    console.log(`Seats: ${seatsList}`);
    console.log(`Total: ₹${parseFloat(totalAmount).toFixed(0)}`);
    console.log(`QR Reference: ${bookingReference}`);
    console.log('==============================================================');
    return true;
  }
};

const sendWaitlistOffer = async ({
  to,
  toEmail,
  recipientName,
  userName,
  eventTitle,
  categoryName,
  quantity,
  offerUrl,
  expiresAt
}) => {
  const recipient = to || toEmail;
  const name = recipientName || userName || 'Valued Customer';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4F46E5;">Good News! A Seat is Available</h2>
      <p>Hi ${name},</p>
      <p>A seat has opened up for <strong>${eventTitle}</strong> in the <strong>${categoryName}</strong> category (${quantity} ticket(s)).</p>
      <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 12px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-weight: bold;">This offer expires in 10 minutes (at ${new Date(expiresAt).toLocaleTimeString()}).</p>
      </div>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${offerUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Claim Your Ticket Now</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8;">If you do not claim this offer before the timer expires, the ticket will be offered to the next person in line.</p>
    </div>
  `;

  const transport = getTransporter();

  if (transport) {
    try {
      await transport.sendMail({
        from: config.smtp.from,
        to: recipient,
        subject: `Waitlist Offer: ${eventTitle}`,
        html: htmlContent
      });
      return true;
    } catch (err) {
      return false;
    }
  } else {
    console.log('============= WAITLIST OFFER EMAIL (MOCK / LOCAL) =============');
    console.log(`To: ${recipient}`);
    console.log(`Subject: Waitlist Offer: ${eventTitle}`);
    console.log(`Category: ${categoryName} (${quantity} seats)`);
    console.log(`Offer URL: ${offerUrl}`);
    console.log(`Expires At: ${new Date(expiresAt).toLocaleTimeString()}`);
    console.log('==============================================================');
    return true;
  }
};

module.exports = {
  sendBookingConfirmation,
  sendWaitlistOffer,
  sendBookingConfirmationEmail: sendBookingConfirmation,
  sendWaitlistOfferEmail: sendWaitlistOffer
};
