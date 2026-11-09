require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const dbName = process.env.DB_NAME || 'p16_taskmanager';

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'changeme',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: 'mysql',
  dialectOptions: {
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
};

module.exports = {
  development: { ...base, database: dbName },
  test: { ...base, database: `${dbName}_test`, logging: false },
  production: { ...base, database: dbName, logging: false },
};

