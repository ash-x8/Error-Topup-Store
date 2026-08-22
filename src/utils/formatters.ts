export function formatLKR(amount: number, symbol: string = 'Rs.'): string {
  return `${symbol} ${Math.round(amount).toLocaleString('en-US')}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `ETS-${year}${month}${day}-${randomDigits}`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function normalizeWhatsAppNumber(phone?: string): string {
  if (!phone) return '94772472573';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    cleaned = '94' + cleaned;
  }
  return cleaned || '94772472573';
}

export function generateOrderWhatsAppMessage(order: any): string {
  const itemsText = (order.items || [])
    .map((item: any) => `▪ ${item.productName || item.name} (x${item.quantity || 1}) - Rs. ${(item.unitPrice || item.price || 0) * (item.quantity || 1)}`)
    .join('\n');

  const lines = [
    `🔥 *NEW TOP-UP ORDER - ERROR TOPUP STORE* 🔥`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📌 *Order ID:* #${order.orderId}`,
    `🎮 *Free Fire UID (Player ID):* ${order.playerId}`,
    order.nickname ? `👤 *In-game Nickname:* ${order.nickname}` : null,
    `👤 *Customer Name:* ${order.customerName}`,
    `📞 *Customer WhatsApp:* ${order.customerWhatsApp}`,
    order.customerEmail ? `✉️ *Email:* ${order.customerEmail}` : null,
    ``,
    `📦 *Ordered Items:*`,
    itemsText,
    ``,
    `💰 *Total Amount:* Rs. ${Number(order.total || 0).toLocaleString()}`,
    `💳 *Payment Method:* ${order.paymentMethodName || 'Direct Payment'}`,
    order.paymentDetailsSnapshot?.accountNumber
      ? `🏦 *Sent To:* ${order.paymentDetailsSnapshot.provider || ''} (${order.paymentDetailsSnapshot.accountNumber})`
      : null,
    ``,
    `🧾 *Uploaded Payment Slip (Image Proof):*`,
    order.receiptUrl ? order.receiptUrl : '⚠️ No receipt uploaded',
    `━━━━━━━━━━━━━━━━━━━━`,
    `⚡ කරුණාකර මෙම Payment Slip එක පරික්ෂා කර Top-up එක Free Fire UID (${order.playerId}) එකට ලබා දෙන්න. Thank you!`,
  ].filter((line) => line !== null);

  return lines.join('\n');
}

export function generateOrderWhatsAppUrl(order: any, contactPhone?: string): string {
  const targetNumber = normalizeWhatsAppNumber(
    contactPhone || order.paymentDetailsSnapshot?.accountNumber || '0772472573'
  );
  const message = generateOrderWhatsAppMessage(order);
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(message)}`;
}
