const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';

// Ensure exactly 32 bytes for key, 16 bytes for IV
// padEnd fills with zeros if too short, slice cuts if too long
const KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32),
  'utf8'
);
const IV = Buffer.from(
  (process.env.ENCRYPTION_IV || '').padEnd(16, '0').slice(0, 16),
  'utf8'
);

const encrypt = (text) => {
  try {
    const cipher    = crypto.createCipheriv(ALGORITHM, KEY, IV);
    let encrypted   = cipher.update(String(text), 'utf8', 'hex');
    encrypted      += cipher.final('hex');
    return encrypted;
  } catch (err) {
    console.error('Encrypt error:', err.message);
    return String(text); // fallback
  }
};

const decrypt = (encryptedText) => {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    let decrypted  = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted     += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decrypt error:', err.message);
    return encryptedText; // fallback
  }
};

const encryptBuffer = (buffer) => {
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
    return Buffer.concat([cipher.update(buffer), cipher.final()]);
  } catch (err) {
    console.error('EncryptBuffer error:', err.message);
    return buffer;
  }
};

const decryptBuffer = (encryptedBuffer) => {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  } catch (err) {
    console.error('DecryptBuffer error:', err.message);
    return encryptedBuffer;
  }
};

module.exports = { encrypt, decrypt, encryptBuffer, decryptBuffer };