import Sequelize from 'sequelize';
import dotenv from 'dotenv';
import configfile from './config.json';

dotenv.config();

const env = process.env.NODE_ENV;
const config = configfile[env];

export default new Sequelize(config);
