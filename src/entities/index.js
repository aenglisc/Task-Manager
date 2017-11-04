import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';

import configfile from '../../config/config.json';

export default () => {
  const db = {};

  const basename = path.basename(__filename);
  const config = configfile[process.env.NODE_ENV];
  const sequelize = new Sequelize(config.use_env_variable ?
    process.env[config.use_env_variable] :
    config.database, config.username, config.password, config);

  console.log(process.env[config.use_env_variable] ? process.env[config.use_env_variable] : '?'); // eslint-disable-line
  // console.log(sequelize); // eslint-disable-line

  fs
    .readdirSync(__dirname)
    .filter(file => ((file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')))
    .forEach((file) => {
      const model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};
