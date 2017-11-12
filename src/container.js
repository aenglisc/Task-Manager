import dotenv from 'dotenv';

import getModels from './models';
import connect from './db';
import buildFormObj from './lib/formObjectBuilder';
import logger from './lib/logger';

import auth from './middlewares/authorisation';
import exists from './middlewares/exists';

dotenv.config();

const models = getModels(connect);

export default {
  auth,
  exists,
  buildFormObj,
  logger,
  ...models,
};
