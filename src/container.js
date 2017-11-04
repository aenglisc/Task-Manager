import dotenv from 'dotenv';

import connectdb from './entities';
import logger from './lib/logger';

dotenv.config();

export default { logger, ...connectdb() };
