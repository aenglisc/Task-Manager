import crypto from 'crypto';

export default text => crypto
  .createHmac('sha512', process.env.CRYPTO)
  .update(text)
  .digest('hex');
