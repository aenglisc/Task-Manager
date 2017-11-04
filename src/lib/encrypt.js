import crypto from 'crypto';

export default text => crypto
  .createHmac('sha512', 'canttouchthis')
  .update(text)
  .digest('hex');
