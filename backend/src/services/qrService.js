const QRCode = require('qrcode');

const generateQRCodeDataURL = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 240,
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    throw error;
  }
};

module.exports = {
  generateQRCodeDataURL
};
