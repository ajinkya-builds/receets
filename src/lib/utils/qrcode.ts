import QRCode from 'qrcode';

/**
 * Generate a QR code for a merchant location
 * @param merchantId The merchant ID
 * @param locationId The location ID
 * @param action The action to perform (purchase or return)
 * @returns Promise<string> - Base64 encoded QR code image
 */
export async function generateQRCode(
  merchantId: string,
  locationId: string,
  action: 'purchase' | 'return' = 'purchase'
): Promise<string> {
  // Create a URL or data object that will be encoded in the QR code
  const data = JSON.stringify({
    merchantId,
    locationId,
    action,
    timestamp: Date.now(), // For uniqueness
  });
  
  try {
    // Generate QR code as base64 encoded image
    const qrCodeImage = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    return qrCodeImage;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse a QR code data into usable format
 * @param qrData The QR code data string
 * @returns Object containing parsed QR code data
 */
export function parseQRCode(qrData: string): {
  merchantId: string;
  locationId: string;
  action: 'purchase' | 'return';
  timestamp: number;
} {
  try {
    return JSON.parse(qrData);
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    throw new Error('Invalid QR code data');
  }
} 