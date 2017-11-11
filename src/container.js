import dotenv from 'dotenv';

import getModels from './models';
import connect from './db';
import buildFormObj from './lib/formObjectBuilder';
import logger from './lib/logger';

import auth from './middlewares/authorisation';

dotenv.config();

const models = getModels(connect);

export default {
  auth,
  buildFormObj,
  logger,
  ...models,
};
