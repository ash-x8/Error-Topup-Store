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

// Helper to format HTML & Text for Resend Email Notification
function formatOrderEmail(orderData: any) {
  const items = orderData.items || [];
  const productRowsHtml = items
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #334155;">
        <td style="padding: 12px; font-weight: 600; color: #f8fafc;">${item.name || item.productName || 'Product'}</td>
        <td style="padding: 12px; text-align: center; color: #94a3b8;">x ${item.quantity}</td>
        <td style="padding: 12px; text-align: right; color: #cbd5e1;">Rs. ${(item.price || item.unitPrice || 0).toLocaleString()}</td>
        <td style="padding: 12px; text-align: right; font-weight: 700; color: #fbbf24;">Rs. ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `
    )
    .join('');

  const productRowsText = items
    .map(
      (item: any) =>
        `• ${item.name || item.productName} x ${item.quantity} | Unit: Rs. ${(item.price || item.unitPrice || 0).toLocaleString()} | Subtotal: Rs. ${((item.price || item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}`
    )
    .join('\n');

  const paymentDetails = orderData.paymentDetailsSnapshot
    ? `Provider: ${orderData.paymentDetailsSnapshot.provider || 'N/A'}\nAccount Number: ${orderData.paymentDetailsSnapshot.accountNumber || 'N/A'}${
        orderData.paymentDetailsSnapshot.accountName ? `\nAccount Name: ${orderData.paymentDetailsSnapshot.accountName}` : ''
      }${orderData.paymentDetailsSnapshot.bankName ? `\nBank: ${orderData.paymentDetailsSnapshot.bankName}` : ''}`
    : `Payment Method: ${orderData.paymentMethodName || 'N/A'}`;

  const paymentDetailsHtml = orderData.paymentDetailsSnapshot
    ? `<div style="background: #1e293b; border-radius: 8px; padding: 12px; font-family: monospace; color: #e2e8f0; font-size: 13px;">
        <strong>Provider:</strong> ${orderData.paymentDetailsSnapshot.provider || 'N/A'}<br/>
        <strong>Account Number:</strong> ${orderData.paymentDetailsSnapshot.accountNumber || 'N/A'}<br/>
        ${orderData.paymentDetailsSnapshot.accountName ? `<strong>Account Name:</strong> ${orderData.paymentDetailsSnapshot.accountName}<br/>` : ''}
        ${orderData.paymentDetailsSnapshot.bankName ? `<strong>Bank:</strong> ${orderData.paymentDetailsSnapshot.bankName}<br/>` : ''}
      </div>`
    : `<div style="background: #1e293b; border-radius: 8px; padding: 12px; color: #e2e8f0;">${orderData.paymentMethodName || 'N/A'}</div>`;

  const dateFormatted = new Date(orderData.createdAt || Date.now()).toLocaleString('en-US', {
    timeZone: 'Asia/Colombo',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const isReceiptImage = orderData.receiptUrl && !orderData.receiptUrl.toLowerCase().endsWith('.pdf');

  const textBody = `NEW FREE FIRE TOP-UP ORDER
========================================
Order ID: ${orderData.orderId}
Customer Name: ${orderData.customerName}
Customer WhatsApp: ${orderData.customerWhatsApp}
Free Fire Player ID: ${orderData.playerId}
Free Fire Nickname: ${orderData.nickname || 'N/A'}

PRODUCTS:
${productRowsText}

TOTAL: Rs. ${(orderData.total || 0).toLocaleString()}

PAYMENT METHOD:
${orderData.paymentMethodName || 'N/A'}

PAYMENT DETAILS:
${paymentDetails}

PAYMENT RECEIPT:
${orderData.receiptUrl || 'No receipt URL provided'}

ORDER STATUS:
${orderData.status || 'Pending Payment Verification'}

ORDER DATE:
${dateFormatted}
========================================`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Free Fire Order — ${orderData.orderId}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <div style="max-width: 640px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #ea580c 0%, #d97706 100%); padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
        🔥 New Free Fire Top-Up Order
      </h1>
      <p style="margin: 6px 0 0 0; color: #fef08a; font-weight: 600; font-size: 15px;">
        Order #${orderData.orderId}
      </p>
    </div>

    <div style="padding: 24px;">
      
      <!-- Key Player & Order Specs -->
      <div style="background: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 40%;">Free Fire Player ID:</td>
            <td style="padding: 6px 0; color: #fbbf24; font-weight: 800; font-size: 17px; letter-spacing: 0.5px;">${orderData.playerId}</td>
          </tr>
          ${
            orderData.nickname
              ? `<tr>
            <td style="padding: 6px 0; color: #94a3b8;">Player Nickname:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${orderData.nickname}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Customer Name:</td>
            <td style="padding: 6px 0; color: #f8fafc; font-weight: 600;">${orderData.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Customer WhatsApp:</td>
            <td style="padding: 6px 0; color: #38bdf8; font-weight: 700;">
              <a href="https://wa.me/${String(orderData.customerWhatsApp).replace(/\D/g, '')}" style="color: #38bdf8; text-decoration: none;">
                ${orderData.customerWhatsApp} ↗
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Order Status:</td>
            <td style="padding: 6px 0; color: #fb923c; font-weight: 700;">${orderData.status || 'Pending Payment Verification'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Order Date:</td>
            <td style="padding: 6px 0; color: #cbd5e1; font-size: 13px;">${dateFormatted}</td>
          </tr>
        </table>
      </div>

      <!-- Products Breakdown -->
      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
        Purchased Products
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <thead>
          <tr style="background: #1e293b; color: #94a3b8; text-align: left;">
            <th style="padding: 10px 12px; border-radius: 8px 0 0 0;">Product</th>
            <th style="padding: 10px 12px; text-align: center;">Qty</th>
            <th style="padding: 10px 12px; text-align: right;">Unit Price</th>
            <th style="padding: 10px 12px; text-align: right; border-radius: 0 8px 0 0;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${productRowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 14px 12px; text-align: right; font-size: 16px; font-weight: 700; color: #f8fafc;">Total Amount:</td>
            <td style="padding: 14px 12px; text-align: right; font-size: 20px; font-weight: 800; color: #fbbf24;">Rs. ${(orderData.total || 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Payment Method & Details Snapshot -->
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px;">
        Payment Information (${orderData.paymentMethodName || 'N/A'})
      </h3>
      ${paymentDetailsHtml}

      <!-- Payment Receipt Action CTA -->
      <div style="margin-top: 24px; padding: 20px; background: #1e293b; border-radius: 12px; text-align: center;">
        <h4 style="margin: 0 0 12px 0; color: #f8fafc; font-size: 15px;">Payment Receipt Proof</h4>
        <div style="margin-bottom: 16px;">
          <a href="${orderData.receiptUrl || '#'}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
            📄 View Payment Receipt
          </a>
        </div>
        ${
          isReceiptImage
            ? `<div style="margin-top: 12px;">
            <a href="${orderData.receiptUrl}" target="_blank">
              <img src="${orderData.receiptUrl}" alt="Receipt Proof" style="max-width: 100%; max-height: 280px; border-radius: 8px; border: 1px solid #334155; object-fit: contain;" />
            </a>
          </div>`
            : ''
        }
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #090d16; padding: 16px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b;">
      Free Fire Top-Up Store Automatic Dispatch System • Order Ref: ${orderData.orderId}
    </div>
  </div>
</body>
</html>
  `;

  return { htmlBody, textBody };
}

// Transactional Email Dispatcher via Resend
async function sendOrderEmailNotification(orderData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipientEmail = process.env.ORDER_NOTIFICATION_EMAIL || 'prebathasanka95@gmail.com';
  const fromAddress = process.env.EMAIL_FROM || 'Free Fire Store <onboarding@resend.dev>';

  const { htmlBody, textBody } = formatOrderEmail(orderData);
  const subject = `New Free Fire Order — ${orderData.orderId}`;

  // If RESEND_API_KEY is not configured yet, gracefully simulate/log and return clear status
  if (!apiKey) {
    console.log('\n================== [ORDER EMAIL NOTIFICATION SIMULATION] ==================');
    console.log(`To: ${recipientEmail}`);
    console.log(`From: ${fromAddress}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n${textBody}`);
    console.log('================== [END ORDER EMAIL SIMULATION] ==================\n');
    return {
      success: false,
      error: 'RESEND_API_KEY is not configured in server environment variables. Please add RESEND_API_KEY, ORDER_NOTIFICATION_EMAIL, and EMAIL_FROM.',
    };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromAddress,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
      text: textBody,
    });

    if (result.error) {
      console.error('Resend API Error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Resend API returned an error',
      };
    }

    const messageId = result.data?.id;
    console.log(`✅ Order notification email sent successfully! Message ID: ${messageId}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error('Email dispatch network exception:', err);
    return { success: false, error: err.message || 'Failed to dispatch email' };
  }
}

// 2. Server-side Order Email Dispatch Endpoints (/api/send-order-email and /api/orders/retry-email)
app.post(['/api/send-order-email', '/api/orders/process-notification'], async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Valid order data required' });
    }

    const emailResult = await sendOrderEmailNotification(order);
    return res.json({
      success: emailResult.success,
      emailStatus: emailResult.success ? 'Sent' : 'Failed',
      emailMessageId: emailResult.messageId,
      emailError: emailResult.error,
    });
  } catch (error: any) {
    console.error('Error processing order email notification:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Retry Email Notification Endpoint
app.post(['/api/orders/retry-email', '/api/orders/retry-notification'], async (req, res) => {
  try {
    const { order } = req.body;
    if (!order) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    const result = await sendOrderEmailNotification(order);
    return res.json({
      success: result.success,
      status: result.success ? 'Sent' : 'Failed',
      messageId: result.messageId,
      error: result.error,
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
