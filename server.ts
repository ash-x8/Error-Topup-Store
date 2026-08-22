import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing with appropriate limits
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure uploads folder exists
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

// 1. Upload receipt endpoint
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

// Helper to format WhatsApp notification text
function formatWhatsAppOrderMessage(orderData: any): string {
  const productLines = (orderData.items || [])
    .map((item: any) => `• ${item.name} x ${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}`)
    .join('\n');

  const paymentDetails = orderData.paymentDetailsSnapshot
    ? `Provider: ${orderData.paymentDetailsSnapshot.provider}\nAccount: ${orderData.paymentDetailsSnapshot.accountNumber}${
        orderData.paymentDetailsSnapshot.accountName ? `\nName: ${orderData.paymentDetailsSnapshot.accountName}` : ''
      }${orderData.paymentDetailsSnapshot.bankName ? `\nBank: ${orderData.paymentDetailsSnapshot.bankName}` : ''}`
    : `Method: ${orderData.paymentMethodName || 'N/A'}`;

  return `🔥 *NEW FREE FIRE ORDER* 🔥

*Order ID:*
${orderData.orderId}

*Customer Name:*
${orderData.customerName}

*Customer WhatsApp:*
${orderData.customerWhatsApp}

*Free Fire Player ID:*
${orderData.playerId}
${orderData.nickname ? `*Nickname:*\n${orderData.nickname}\n` : ''}
*Products:*
${productLines}

*Total:*
Rs. ${orderData.total.toLocaleString()}

*Payment Method:*
${orderData.paymentMethodName}

*Payment Details:*
${paymentDetails}

*Receipt Link:*
${orderData.receiptUrl}

*Order Status:*
${orderData.status || 'Pending Payment Verification'}

*Created:*
${new Date(orderData.createdAt || Date.now()).toLocaleString('en-US', { timeZone: 'Asia/Colombo' })}`;
}

// WhatsApp Cloud API Dispatcher
async function sendWhatsAppNotification(orderData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const storeOwnerNumber = process.env.WHATSAPP_RECIPIENT_NUMBER || process.env.STORE_OWNER_WHATSAPP_NUMBER || '94772472573';

  const messageText = formatWhatsAppOrderMessage(orderData);

  // If WhatsApp API credentials are not set in environment yet, simulate graceful failure logging
  if (!token || !phoneNumberId) {
    console.log('\n--- [WHATSAPP DISPATCH SIMULATION / PREVIEW] ---');
    console.log(`To Store Owner (${storeOwnerNumber}):\n${messageText}`);
    console.log('--- [END WHATSAPP PREVIEW] ---\n');
    return {
      success: false,
      error: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured in environment. Message formatted and stored.',
    };
  }

  try {
    const formattedRecipient = storeOwnerNumber.replace(/\D/g, '');
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedRecipient,
        type: 'text',
        text: {
          preview_url: true,
          body: messageText,
        },
      }),
    });

    const responseData: any = await response.json();
    if (!response.ok) {
      console.error('WhatsApp API Error Response:', responseData);
      return {
        success: false,
        error: responseData?.error?.message || `HTTP ${response.status} from WhatsApp Cloud API`,
      };
    }

    const messageId = responseData?.messages?.[0]?.id;
    return { success: true, messageId };
  } catch (err: any) {
    console.error('WhatsApp dispatch network exception:', err);
    return { success: false, error: err.message || 'WhatsApp network error' };
  }
}

// 2. Server-side WhatsApp Order Dispatch Endpoints (/api/send-whatsapp-order and /api/orders/process-notification)
app.post(['/api/send-whatsapp-order', '/api/orders/process-notification'], async (req, res) => {
  try {
    const { order } = req.body;
    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Valid order data required' });
    }

    const whatsappResult = await sendWhatsAppNotification(order);
    return res.json({
      success: true,
      whatsappStatus: whatsappResult.success ? 'Sent' : 'Failed',
      whatsappMessageId: whatsappResult.messageId,
      whatsappError: whatsappResult.error,
    });
  } catch (error: any) {
    console.error('Error processing order notification:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 3. Retry WhatsApp Notification Endpoint
app.post('/api/orders/retry-whatsapp', async (req, res) => {
  try {
    const { order } = req.body;
    if (!order) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    const result = await sendWhatsAppNotification(order);
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
