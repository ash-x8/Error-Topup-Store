import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { Resend } from 'resend';

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing with appropriate limits
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads folder exists for local receipt storage fallback
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded receipts statically
app.use('/uploads', express.static(uploadsDir));

// Multer storage for payment receipts
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP and PDF receipt files are supported'));
    }
  },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 1. Upload receipt endpoint (fallback if Cloudinary direct unsigned upload is not used)
app.post('/api/upload-receipt', upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No receipt file provided' });
    }

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    return res.json({
      success: true,
      url: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('Receipt upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process receipt' });
  }
});

// Primary Administrator Notification Email configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || 'eshannewacc76@gmail.com';
const EMAIL_FROM = process.env.EMAIL_FROM || 'ERROR TOPUP STORE <onboarding@resend.dev>';
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;

// Validation helper for email addresses
function isValidEmail(email?: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Format Sri Lanka timestamp (Asia/Colombo)
function formatOrderDate(isoString?: string): string {
  try {
    return new Date(isoString || Date.now()).toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      dateStyle: 'full',
      timeStyle: 'medium',
    });
  } catch {
    return new Date().toISOString();
  }
}

// Universal Gaming Email HTML Wrapper
function wrapInGamingTemplate(title: string, subtitle: string, contentHtml: string, orderId?: string, actionBtn?: { text: string; url: string; color?: string }): string {
  const currentYear = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ERROR TOPUP STORE</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #ea580c 0%, #d97706 50%, #b45309 100%); padding: 24px 20px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;">
        🔥 ERROR TOPUP STORE
      </h1>
      <p style="margin: 6px 0 0 0; color: #fef08a; font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">
        ${subtitle}
      </p>
      ${orderId ? `<div style="margin-top: 8px; display: inline-block; background: rgba(0, 0, 0, 0.35); padding: 4px 12px; border-radius: 9999px; font-family: monospace; font-size: 13px; color: #ffffff; font-weight: bold;">Order Ref: #${orderId}</div>` : ''}
    </div>

    <!-- Body Content Area -->
    <div style="padding: 24px 20px;">
      ${contentHtml}

      <!-- CTA Button if provided -->
      ${
        actionBtn
          ? `<div style="margin: 28px 0 10px 0; text-align: center;">
          <a href="${actionBtn.url}" target="_blank" style="display: inline-block; background: ${actionBtn.color || 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'}; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
            ${actionBtn.text}
          </a>
        </div>`
          : ''
      }
    </div>

    <!-- Footer -->
    <div style="background: #090d16; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; line-height: 1.6;">
      <strong style="color: #cbd5e1;">ERROR TOPUP STORE</strong> — Sri Lanka's Trusted Gaming Reload Platform<br/>
      Official WhatsApp Support: <a href="https://wa.me/94772472573" style="color: #38bdf8; text-decoration: none;">0772472573</a><br/>
      <span style="color: #475569; font-size: 11px;">Automated notification — please do not reply directly to this email.</span><br/>
      <span style="color: #334155; font-size: 10px;">© ${currentYear} ERROR TOPUP STORE. All rights reserved.</span>
    </div>

  </div>
</body>
</html>
  `;
}

// 1. Template: Admin New Order Notification
function buildAdminNewOrderEmail(orderData: any, baseUrl: string) {
  const items = orderData.items || [];
  const productRowsHtml = items
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px; font-weight: 600; color: #f8fafc;">${item.name || item.productName || 'Package'}</td>
        <td style="padding: 10px; text-align: center; color: #94a3b8;">x ${item.quantity}</td>
        <td style="padding: 10px; text-align: right; color: #cbd5e1;">Rs. ${(item.price || item.unitPrice || 0).toLocaleString()}</td>
        <td style="padding: 10px; text-align: right; font-weight: 700; color: #fbbf24;">Rs. ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  const productRowsText = items
    .map((item: any) => `• ${item.name || item.productName} x ${item.quantity} (Rs. ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()})`)
    .join('\n');

  const paymentDetails = orderData.paymentDetailsSnapshot
    ? `Provider: ${orderData.paymentDetailsSnapshot.provider || 'N/A'}
Account Number: ${orderData.paymentDetailsSnapshot.accountNumber || 'N/A'}${orderData.paymentDetailsSnapshot.accountName ? `\nAccount Name: ${orderData.paymentDetailsSnapshot.accountName}` : ''}${orderData.paymentDetailsSnapshot.bankName ? `\nBank: ${orderData.paymentDetailsSnapshot.bankName}` : ''}`
    : `Payment Method: ${orderData.paymentMethodName || 'N/A'}`;

  const dateFormatted = formatOrderDate(orderData.createdAt);
  const adminUrl = `${baseUrl}/admin`;

  const contentHtml = `
    <!-- Top Summary Alert Box -->
    <div style="background: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 40%;">Player ID (UID):</td>
          <td style="padding: 6px 0; color: #fbbf24; font-weight: 900; font-size: 18px; letter-spacing: 0.5px; font-family: monospace;">${orderData.playerId}</td>
        </tr>
        ${orderData.nickname ? `
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Nickname:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${orderData.nickname}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Customer Name:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${orderData.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">WhatsApp:</td>
          <td style="padding: 6px 0; color: #38bdf8; font-weight: 700;">
            <a href="https://wa.me/${String(orderData.customerWhatsApp).replace(/\D/g, '')}" style="color: #38bdf8; text-decoration: none;">
              ${orderData.customerWhatsApp} ↗
            </a>
          </td>
        </tr>
        ${orderData.customerEmail ? `
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Customer Email:</td>
          <td style="padding: 6px 0; color: #a5b4fc; font-weight: 600;">${orderData.customerEmail}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Order Status:</td>
          <td style="padding: 6px 0; color: #fb923c; font-weight: 800; text-transform: uppercase;">${orderData.status || 'PENDING'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Order Date:</td>
          <td style="padding: 6px 0; color: #cbd5e1; font-size: 13px;">${dateFormatted}</td>
        </tr>
      </table>
    </div>

    <!-- Products Breakdown -->
    <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
      Order Items Breakdown
    </h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
      <thead>
        <tr style="background: #1e293b; color: #94a3b8; text-align: left;">
          <th style="padding: 10px; border-radius: 8px 0 0 0;">Product / Package</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Unit Price</th>
          <th style="padding: 10px; text-align: right; border-radius: 0 8px 0 0;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${productRowsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 12px 10px; text-align: right; font-size: 15px; font-weight: 700; color: #f8fafc;">Total Amount:</td>
          <td style="padding: 12px 10px; text-align: right; font-size: 18px; font-weight: 900; color: #fbbf24;">Rs. ${(orderData.total || 0).toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Payment Snapshot -->
    <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
      Payment Method: ${orderData.paymentMethodName || 'N/A'}
    </h3>
    <div style="background: #1e293b; border-radius: 8px; padding: 14px; color: #cbd5e1; font-size: 13px; line-height: 1.5; font-family: monospace;">
      ${orderData.paymentDetailsSnapshot ? `
        <strong>Provider:</strong> ${orderData.paymentDetailsSnapshot.provider || 'N/A'}<br/>
        <strong>Account:</strong> ${orderData.paymentDetailsSnapshot.accountNumber || 'N/A'}<br/>
        ${orderData.paymentDetailsSnapshot.accountName ? `<strong>Account Name:</strong> ${orderData.paymentDetailsSnapshot.accountName}<br/>` : ''}
        ${orderData.paymentDetailsSnapshot.bankName ? `<strong>Bank:</strong> ${orderData.paymentDetailsSnapshot.bankName}<br/>` : ''}
      ` : (orderData.paymentMethodName || 'N/A')}
    </div>

    <!-- Receipt Preview if attached -->
    ${orderData.receiptUrl ? `
    <div style="margin-top: 20px; padding: 16px; background: #1e293b; border-radius: 12px; text-align: center;">
      <h4 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 14px;">Attached Payment Slip</h4>
      <a href="${orderData.receiptUrl}" target="_blank" style="display: inline-block; background: #334155; color: #38bdf8; text-decoration: none; font-weight: 700; font-size: 13px; padding: 8px 18px; border-radius: 6px; border: 1px solid #475569;">
        📄 Open Payment Receipt
      </a>
      ${!orderData.receiptUrl.toLowerCase().endsWith('.pdf') ? `
      <div style="margin-top: 12px;">
        <img src="${orderData.receiptUrl}" alt="Receipt" style="max-width: 100%; max-height: 240px; border-radius: 8px; border: 1px solid #334155; object-fit: contain;" />
      </div>` : ''}
    </div>` : '<div style="margin-top: 14px; font-size: 12px; color: #94a3b8; font-style: italic;">No payment slip uploaded with this order.</div>'}
  `;

  const textBody = `ERROR TOPUP STORE — NEW ORDER RECEIVED
==================================================
Order ID: #${orderData.orderId}
Player ID (UID): ${orderData.playerId}
Nickname: ${orderData.nickname || 'N/A'}
Customer Name: ${orderData.customerName}
Customer WhatsApp: ${orderData.customerWhatsApp}
Customer Email: ${orderData.customerEmail || 'Not provided'}

PRODUCTS:
${productRowsText}

TOTAL AMOUNT: Rs. ${(orderData.total || 0).toLocaleString()}
PAYMENT METHOD: ${orderData.paymentMethodName || 'N/A'}
PAYMENT DETAILS:
${paymentDetails}
PAYMENT PROOF: ${orderData.receiptUrl || 'No receipt URL'}
STATUS: ${orderData.status || 'PENDING'}
ORDER TIME: ${dateFormatted}

ADMIN DASHBOARD: ${adminUrl}
==================================================
Automated notification — please do not reply.`;

  const subject = `New Order Received — ERROR TOPUP STORE #${orderData.orderId}`;
  const htmlBody = wrapInGamingTemplate(
    subject,
    `New Order Received #${orderData.orderId}`,
    contentHtml,
    orderData.orderId,
    { text: 'View Order in Admin Dashboard', url: adminUrl, color: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)' }
  );

  return { subject, htmlBody, textBody };
}

// 2. Template: Admin Payment Proof Received
function buildAdminPaymentProofEmail(orderData: any, baseUrl: string) {
  const adminUrl = `${baseUrl}/admin`;
  const dateFormatted = formatOrderDate(orderData.updatedAt || orderData.createdAt);

  const contentHtml = `
    <div style="background: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #34d399; font-weight: 800;">
        ⚡ Customer Submitted Payment Proof
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 40%;">Order ID:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 800; font-family: monospace;">#${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Player ID (UID):</td>
          <td style="padding: 6px 0; color: #fbbf24; font-weight: 800; font-family: monospace;">${orderData.playerId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Amount:</td>
          <td style="padding: 6px 0; color: #34d399; font-weight: 800;">Rs. ${(orderData.total || 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Payment Method:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${orderData.paymentMethodName || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Customer:</td>
          <td style="padding: 6px 0; color: #f8fafc;">${orderData.customerName} (${orderData.customerWhatsApp})</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Submitted At:</td>
          <td style="padding: 6px 0; color: #cbd5e1; font-size: 13px;">${dateFormatted}</td>
        </tr>
      </table>
    </div>

    <!-- Receipt View Box -->
    <div style="padding: 20px; background: #1e293b; border-radius: 12px; text-align: center; margin-bottom: 20px;">
      <h4 style="margin: 0 0 12px 0; color: #f8fafc; font-size: 14px;">Payment Verification Slip</h4>
      ${orderData.receiptUrl ? `
      <a href="${orderData.receiptUrl}" target="_blank" style="display: inline-block; background: #10b981; color: #022c22; text-decoration: none; font-weight: 800; font-size: 14px; padding: 10px 24px; border-radius: 8px; margin-bottom: 12px;">
        📄 Inspect Full Payment Slip
      </a>
      ${!orderData.receiptUrl.toLowerCase().endsWith('.pdf') ? `
      <div style="margin-top: 10px;">
        <img src="${orderData.receiptUrl}" alt="Slip Preview" style="max-width: 100%; max-height: 280px; border-radius: 8px; border: 1px solid #334155; object-fit: contain;" />
      </div>` : ''}` : '<p style="color: #94a3b8; font-style: italic;">No slip URL attached.</p>'}
    </div>
  `;

  const textBody = `PAYMENT PROOF RECEIVED — ORDER #${orderData.orderId}
==================================================
Order ID: #${orderData.orderId}
Player ID: ${orderData.playerId}
Amount: Rs. ${(orderData.total || 0).toLocaleString()}
Payment Method: ${orderData.paymentMethodName || 'N/A'}
Customer: ${orderData.customerName} (${orderData.customerWhatsApp})
Slip URL: ${orderData.receiptUrl || 'N/A'}

Admin Review Link: ${adminUrl}
==================================================`;

  const subject = `Payment Proof Received — Order #${orderData.orderId}`;
  const htmlBody = wrapInGamingTemplate(
    subject,
    `Payment Proof Received #${orderData.orderId}`,
    contentHtml,
    orderData.orderId,
    { text: 'Review Payment & Approve Order', url: adminUrl, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
  );

  return { subject, htmlBody, textBody };
}

// 3. Template: Customer Order Confirmation
function buildCustomerOrderConfirmationEmail(orderData: any, baseUrl: string) {
  const items = orderData.items || [];
  const trackingUrl = `${baseUrl}/?orderId=${orderData.orderId}`;
  const dateFormatted = formatOrderDate(orderData.createdAt);

  const productRowsHtml = items
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 10px; font-weight: 600; color: #f8fafc;">${item.name || item.productName || 'Package'}</td>
        <td style="padding: 10px; text-align: center; color: #94a3b8;">x ${item.quantity}</td>
        <td style="padding: 10px; text-align: right; font-weight: 700; color: #fbbf24;">Rs. ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  const contentHtml = `
    <div style="margin-bottom: 20px; text-align: center;">
      <h2 style="margin: 0 0 6px 0; color: #ffffff; font-size: 18px; font-weight: 800;">
        Thank You for Your Order, ${orderData.customerName}! 🎮
      </h2>
      <p style="margin: 0; color: #94a3b8; font-size: 14px;">
        We have received your top-up request. Our dispatch system is verifying your payment slip.
      </p>
    </div>

    <!-- Order Specs Card -->
    <div style="background: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #38bdf8;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 40%;">Order ID:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 800; font-family: monospace;">#${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Free Fire Player ID:</td>
          <td style="padding: 6px 0; color: #fbbf24; font-weight: 900; font-size: 17px; font-family: monospace;">${orderData.playerId}</td>
        </tr>
        ${orderData.nickname ? `
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Player Nickname:</td>
          <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${orderData.nickname}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Payment Method:</td>
          <td style="padding: 6px 0; color: #f8fafc;">${orderData.paymentMethodName || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Current Status:</td>
          <td style="padding: 6px 0; color: #38bdf8; font-weight: 800;">${orderData.status || 'Pending Payment Verification'}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Order Date:</td>
          <td style="padding: 6px 0; color: #cbd5e1; font-size: 13px;">${dateFormatted}</td>
        </tr>
      </table>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
      <thead>
        <tr style="background: #1e293b; color: #94a3b8; text-align: left;">
          <th style="padding: 10px; border-radius: 8px 0 0 0;">Product Package</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right; border-radius: 0 8px 0 0;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${productRowsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px 10px; text-align: right; font-size: 14px; font-weight: 700; color: #f8fafc;">Total Paid:</td>
          <td style="padding: 12px 10px; text-align: right; font-size: 18px; font-weight: 900; color: #fbbf24;">Rs. ${(orderData.total || 0).toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background: #1e293b/60; border: 1px dashed #334155; border-radius: 10px; padding: 14px; text-align: center; color: #94a3b8; font-size: 12px;">
      ⏱️ <strong>Typical Delivery:</strong> Most top-ups land in your Free Fire inbox within <strong>5 to 15 minutes</strong> after slip verification.
    </div>
  `;

  const textBody = `ERROR TOPUP STORE — ORDER CONFIRMATION
==================================================
Dear ${orderData.customerName},

Thank you for choosing ERROR TOPUP STORE!
We have received your top-up order #${orderData.orderId}.

Order ID: #${orderData.orderId}
Player ID (UID): ${orderData.playerId}
Total Paid: Rs. ${(orderData.total || 0).toLocaleString()}
Payment Method: ${orderData.paymentMethodName || 'N/A'}
Status: ${orderData.status || 'Pending Payment Verification'}

Track Your Live Order Status Here:
${trackingUrl}

Need Help? WhatsApp Support: 0772472573
==================================================`;

  const subject = `Order Confirmation — ERROR TOPUP STORE #${orderData.orderId}`;
  const htmlBody = wrapInGamingTemplate(
    subject,
    `Order Confirmation #${orderData.orderId}`,
    contentHtml,
    orderData.orderId,
    { text: '🔍 Track Your Order Live', url: trackingUrl, color: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }
  );

  return { subject, htmlBody, textBody };
}

// 4. Template: Customer Order Status Update
function buildCustomerStatusEmail(orderData: any, newStatus: string, baseUrl: string) {
  const trackingUrl = `${baseUrl}/?orderId=${orderData.orderId}`;
  const normalized = String(newStatus || '').toUpperCase().replace(/\s+/g, '_');

  let subject = `Order Update — #${orderData.orderId}`;
  let statusBadgeColor = '#38bdf8';
  let statusTitle = `Order Status: ${newStatus}`;
  let statusDesc = 'Your top-up order status has been updated.';

  if (normalized.includes('COMPLETED')) {
    subject = `Order Completed — #${orderData.orderId}`;
    statusBadgeColor = '#10b981';
    statusTitle = '🎉 Diamonds & Passes Dispatched!';
    statusDesc = 'Your top-up has been successfully credited directly to your Free Fire Player ID. Open your Free Fire game to enjoy!';
  } else if (normalized.includes('PROCESS')) {
    subject = `Order Processing — #${orderData.orderId}`;
    statusBadgeColor = '#38bdf8';
    statusTitle = '⚡ Order is Currently Processing';
    statusDesc = 'Your payment has been verified. Our automated top-up queue is dispatching your package now.';
  } else if (normalized.includes('FAIL') || normalized.includes('REJECT')) {
    subject = `Order Failed — #${orderData.orderId}`;
    statusBadgeColor = '#ef4444';
    statusTitle = '⚠️ Top-Up Could Not Be Completed';
    statusDesc = orderData.adminNote
      ? `Reason: ${orderData.adminNote}`
      : 'Please contact our WhatsApp support agent with your Order ID to resolve payment verification or UID details.';
  } else if (normalized.includes('CANCEL')) {
    subject = `Order Cancelled — #${orderData.orderId}`;
    statusBadgeColor = '#64748b';
    statusTitle = 'Order Cancelled';
    statusDesc = orderData.adminNote || 'This order has been cancelled by the store administrator.';
  } else if (normalized.includes('REFUND')) {
    subject = `Refund Processed — #${orderData.orderId}`;
    statusBadgeColor = '#a855f7';
    statusTitle = '💸 Refund Processed';
    statusDesc = orderData.adminNote || 'Your refund has been issued to your original payment method.';
  } else if (normalized.includes('REVIEW')) {
    subject = `Payment Under Review — #${orderData.orderId}`;
    statusBadgeColor = '#f59e0b';
    statusTitle = '🔍 Payment Under Review';
    statusDesc = 'Our finance team is currently reviewing your payment slip. We will dispatch your diamonds shortly.';
  }

  const contentHtml = `
    <!-- Status Highlight Box -->
    <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 5px solid ${statusBadgeColor};">
      <div style="color: ${statusBadgeColor}; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 6px;">
        ${statusTitle}
      </div>
      <p style="margin: 0 0 14px 0; color: #e2e8f0; font-size: 14px; line-height: 1.5;">
        ${statusDesc}
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; border-top: 1px solid #334155; padding-top: 10px;">
        <tr>
          <td style="padding: 6px 0; color: #94a3b8; width: 40%;">Order ID:</td>
          <td style="padding: 6px 0; color: #ffffff; font-weight: 800; font-family: monospace;">#${orderData.orderId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Player ID (UID):</td>
          <td style="padding: 6px 0; color: #fbbf24; font-weight: 900; font-family: monospace;">${orderData.playerId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #94a3b8;">Total Amount:</td>
          <td style="padding: 6px 0; color: #cbd5e1; font-weight: 700;">Rs. ${(orderData.total || 0).toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- Live Help CTA -->
    <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 10px; padding: 14px; text-align: center; color: #94a3b8; font-size: 12px;">
      Need immediate assistance? Chat with us on WhatsApp: 
      <a href="https://wa.me/94772472573?text=Order%20Status%20Query%20${orderData.orderId}" style="color: #38bdf8; font-weight: bold; text-decoration: none;">0772472573 ↗</a>
    </div>
  `;

  const textBody = `ERROR TOPUP STORE — ${subject.toUpperCase()}
==================================================
Dear ${orderData.customerName || 'Customer'},

${statusTitle}
${statusDesc}

Order ID: #${orderData.orderId}
Player ID (UID): ${orderData.playerId}
Total: Rs. ${(orderData.total || 0).toLocaleString()}
Status: ${newStatus}

Live Order Tracker: ${trackingUrl}
WhatsApp Support: 0772472573
==================================================`;

  const htmlBody = wrapInGamingTemplate(
    subject,
    subject,
    contentHtml,
    orderData.orderId,
    { text: 'Check Live Order Status', url: trackingUrl, color: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }
  );

  return { subject, htmlBody, textBody };
}

// Low-level Email Sender via Resend API with Simulation Fallback
async function executeEmailDispatch(
  recipient: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; messageId?: string; error?: string; simulated?: boolean }> {
  if (!isValidEmail(recipient)) {
    return { success: false, error: `Invalid recipient email address: "${recipient}"` };
  }

  // If RESEND_API_KEY is not configured in container env, log simulated message safely
  if (!RESEND_API_KEY) {
    console.log('\n================== [TRANSACTIONAL EMAIL NOTIFICATION (SIMULATED)] ==================');
    console.log(`To: ${recipient}`);
    console.log(`From: ${EMAIL_FROM}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${textBody}`);
    console.log('================== [END EMAIL SIMULATION] ==================\n');
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      error: 'Simulated dispatch. Set RESEND_API_KEY or EMAIL_API_KEY to send real emails via provider.',
    };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: recipient,
      subject: subject,
      html: htmlBody,
      text: textBody,
    });

    if (result.error) {
      console.error(`[Email Error] Failed to send to ${recipient}:`, result.error);
      return {
        success: false,
        error: result.error.message || 'Email provider rejected the request',
      };
    }

    const messageId = result.data?.id;
    console.log(`✅ [Email Success] Dispatched to ${recipient} (Message ID: ${messageId})`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error(`[Email Exception] Network/SDK failure sending to ${recipient}:`, err);
    return { success: false, error: err.message || 'Network exception during email dispatch' };
  }
}

// Helper to deduce base host URL
function getBaseUrl(req: express.Request): string {
  const host = req.get('host') || `localhost:${PORT}`;
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}`;
}

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// 1. Process New Order Notifications (Admin Alert & Customer Confirmation)
app.post(['/api/send-order-email', '/api/orders/process-notification', '/api/orders/new-order-notification'], async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Valid order data is required' });
    }

    const baseUrl = getBaseUrl(req);
    const results: any = {
      adminNotification: { sent: false },
      customerNotification: { sent: false, skipped: false },
    };

    // A. Notify Admin (eshannewacc76@gmail.com)
    const adminEmailContent = buildAdminNewOrderEmail(order, baseUrl);
    const adminResult = await executeEmailDispatch(
      ADMIN_EMAIL,
      adminEmailContent.subject,
      adminEmailContent.htmlBody,
      adminEmailContent.textBody
    );

    results.adminNotification = {
      recipient: ADMIN_EMAIL,
      sent: adminResult.success,
      simulated: adminResult.simulated,
      messageId: adminResult.messageId,
      error: adminResult.error,
    };

    // B. If Customer provided a valid email address, send Order Confirmation
    if (isValidEmail(order.customerEmail)) {
      const custEmailContent = buildCustomerOrderConfirmationEmail(order, baseUrl);
      const custResult = await executeEmailDispatch(
        order.customerEmail!.trim(),
        custEmailContent.subject,
        custEmailContent.htmlBody,
        custEmailContent.textBody
      );

      results.customerNotification = {
        recipient: order.customerEmail,
        sent: custResult.success,
        simulated: custResult.simulated,
        messageId: custResult.messageId,
        error: custResult.error,
      };
    } else {
      results.customerNotification = {
        skipped: true,
        reason: 'No valid customer email address was provided with order',
      };
    }

    return res.json({
      success: adminResult.success,
      status: adminResult.success ? 'Sent' : 'Failed',
      results,
    });
  } catch (error: any) {
    console.error('Order notification controller error:', error);
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
});

// 2. Payment Proof Upload Notification (Admin Alert)
app.post(['/api/orders/payment-proof-email', '/api/orders/notify-payment-proof'], async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Valid order data is required' });
    }

    const baseUrl = getBaseUrl(req);
    const emailContent = buildAdminPaymentProofEmail(order, baseUrl);
    const result = await executeEmailDispatch(
      ADMIN_EMAIL,
      emailContent.subject,
      emailContent.htmlBody,
      emailContent.textBody
    );

    return res.json({
      success: result.success,
      recipient: ADMIN_EMAIL,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. Order Status Update Email to Customer (with duplicate protection)
app.post(['/api/orders/status-email', '/api/orders/notify-status-change'], async (req, res) => {
  try {
    const { order, newStatus, previousStatus } = req.body;
    if (!order || !order.orderId || !newStatus) {
      return res.status(400).json({ error: 'Order and newStatus are required' });
    }

    // Duplicate protection: Skip if status did not actually change
    if (previousStatus && previousStatus === newStatus) {
      return res.json({
        success: true,
        skipped: true,
        message: 'Status unchanged. Duplicate notification suppressed.',
      });
    }

    const baseUrl = getBaseUrl(req);
    const results: any = {};

    // Customer Notification
    if (isValidEmail(order.customerEmail)) {
      const emailContent = buildCustomerStatusEmail(order, newStatus, baseUrl);
      const custResult = await executeEmailDispatch(
        order.customerEmail!.trim(),
        emailContent.subject,
        emailContent.htmlBody,
        emailContent.textBody
      );

      results.customer = {
        recipient: order.customerEmail,
        sent: custResult.success,
        messageId: custResult.messageId,
        error: custResult.error,
      };
    } else {
      results.customer = {
        skipped: true,
        reason: 'No customer email address on order record',
      };
    }

    // If status is FAILED, CANCELLED, or REFUNDED, also dispatch a notification alert to ADMIN_EMAIL
    const normalizedStatus = String(newStatus).toUpperCase();
    if (normalizedStatus.includes('FAILED') || normalizedStatus.includes('CANCELLED') || normalizedStatus.includes('REFUND')) {
      const alertSubject = `Admin Alert: Order #${order.orderId} status changed to ${newStatus}`;
      const alertHtml = `
        <div style="background: #1e293b; padding: 18px; border-radius: 10px; border-left: 4px solid #ef4444;">
          <h3 style="color: #f87171; margin: 0 0 10px 0;">Order #${order.orderId} marked as ${newStatus}</h3>
          <p style="color: #cbd5e1; font-size: 14px;"><strong>Player ID:</strong> ${order.playerId}</p>
          <p style="color: #cbd5e1; font-size: 14px;"><strong>Customer:</strong> ${order.customerName} (${order.customerWhatsApp})</p>
          <p style="color: #cbd5e1; font-size: 14px;"><strong>Amount:</strong> Rs. ${(order.total || 0).toLocaleString()}</p>
          ${order.adminNote ? `<p style="color: #cbd5e1; font-size: 14px;"><strong>Admin Note:</strong> ${order.adminNote}</p>` : ''}
        </div>
      `;
      const alertText = `Admin Alert: Order #${order.orderId} marked as ${newStatus}\nPlayer ID: ${order.playerId}\nCustomer: ${order.customerName} (${order.customerWhatsApp})\nAmount: Rs. ${(order.total || 0).toLocaleString()}\nNote: ${order.adminNote || 'None'}`;
      
      const adminAlertResult = await executeEmailDispatch(
        ADMIN_EMAIL,
        alertSubject,
        wrapInGamingTemplate(alertSubject, `Alert: Status -> ${newStatus}`, alertHtml, order.orderId),
        alertText
      );
      results.adminAlert = adminAlertResult;
    }

    return res.json({ success: true, results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. Retry / Resend Email Notification Controller (for Admin Dashboard)
app.post(['/api/orders/retry-email', '/api/orders/retry-notification'], async (req, res) => {
  try {
    const { order, target } = req.body; // target: 'admin' | 'customer' | 'both'
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    const baseUrl = getBaseUrl(req);
    const targetType = target || 'both';
    let adminSuccess = false;
    let custSuccess = false;
    let lastError = '';

    if (targetType === 'admin' || targetType === 'both') {
      const adminEmailContent = buildAdminNewOrderEmail(order, baseUrl);
      const resAdmin = await executeEmailDispatch(
        ADMIN_EMAIL,
        adminEmailContent.subject,
        adminEmailContent.htmlBody,
        adminEmailContent.textBody
      );
      adminSuccess = resAdmin.success;
      if (!resAdmin.success) lastError = resAdmin.error || 'Admin dispatch failed';
    }

    if ((targetType === 'customer' || targetType === 'both') && isValidEmail(order.customerEmail)) {
      const custContent = buildCustomerOrderConfirmationEmail(order, baseUrl);
      const resCust = await executeEmailDispatch(
        order.customerEmail!.trim(),
        custContent.subject,
        custContent.htmlBody,
        custContent.textBody
      );
      custSuccess = resCust.success;
      if (!resCust.success) lastError = resCust.error || 'Customer dispatch failed';
    }

    return res.json({
      success: adminSuccess || custSuccess,
      status: (adminSuccess || custSuccess) ? 'Sent' : 'Failed',
      adminStatus: adminSuccess ? 'Sent' : 'Failed',
      customerStatus: isValidEmail(order.customerEmail) ? (custSuccess ? 'Sent' : 'Failed') : 'Skipped',
      error: lastError || undefined,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Free Fire Store Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
