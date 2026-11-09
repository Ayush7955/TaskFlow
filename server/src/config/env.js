const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(5000),
  API_PREFIX: Joi.string().default('/api/v1'),
  CLIENT_URL: Joi.string().default('http://localhost:5173'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_POOL_MAX: Joi.number().default(10),
  DB_LOGGING: Joi.boolean().default(false),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(12),

  UPLOAD_PROVIDER: Joi.string().valid('cloudinary', 's3').default('cloudinary'),
  MAX_UPLOAD_MB: Joi.number().default(10),
  ALLOWED_MIME: Joi.string().default('image/png,image/jpeg,image/webp'),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').default(''),
  CLOUDINARY_API_KEY: Joi.string().allow('').default(''),
  CLOUDINARY_API_SECRET: Joi.string().allow('').default(''),
  AWS_REGION: Joi.string().allow('').default(''),
  AWS_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  AWS_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  S3_BUCKET: Joi.string().allow('').default(''),

  SMTP_HOST: Joi.string().default('sandbox.smtp.mailtrap.io'),
  SMTP_PORT: Joi.number().default(2525),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().default('TaskFlow <no-reply@taskflow.dev>'),

  FIREBASE_PROJECT_ID: Joi.string().allow('').default(''),
  FIREBASE_CLIENT_EMAIL: Joi.string().allow('').default(''),
  FIREBASE_PRIVATE_KEY: Joi.string().allow('').default(''),
  FIREBASE_DATABASE_URL: Joi.string().allow('').default(''),

  RL_GLOBAL_WINDOW_MS: Joi.number().default(900000),
  RL_GLOBAL_MAX: Joi.number().default(300),
  RL_AUTH_WINDOW_MS: Joi.number().default(900000),
  RL_AUTH_MAX: Joi.number().default(10),
  RL_UPLOAD_WINDOW_MS: Joi.number().default(60000),
  RL_UPLOAD_MAX: Joi.number().default(20),

  CRON_DUE_REMINDER: Joi.string().default('*/15 * * * *'),
  CRON_OVERDUE_SCAN: Joi.string().default('0 * * * *'),
  DUE_REMINDER_HOURS_BEFORE: Joi.number().default(24),
}).unknown(true);

const { error, value: env } = schema.validate(process.env, { allowUnknown: true, stripUnknown: false });

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  clientUrl: env.CLIENT_URL,
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  db: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    name: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    poolMax: env.DB_POOL_MAX,
    logging: env.DB_LOGGING,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },
  bcryptRounds: env.BCRYPT_ROUNDS,
  upload: {
    provider: env.UPLOAD_PROVIDER,
    maxMb: env.MAX_UPLOAD_MB,
    allowedMime: env.ALLOWED_MIME.split(',').map((m) => m.trim()),
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
  s3: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  },
  mail: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.MAIL_FROM,
  },
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY,
    databaseUrl: env.FIREBASE_DATABASE_URL,
  },
  rateLimit: {
    globalWindowMs: env.RL_GLOBAL_WINDOW_MS,
    globalMax: env.RL_GLOBAL_MAX,
    authWindowMs: env.RL_AUTH_WINDOW_MS,
    authMax: env.RL_AUTH_MAX,
    uploadWindowMs: env.RL_UPLOAD_WINDOW_MS,
    uploadMax: env.RL_UPLOAD_MAX,
  },
  jobs: {
    dueDateReminderCron: env.CRON_DUE_REMINDER,
    overdueScanCron: env.CRON_OVERDUE_SCAN,
    dueReminderHoursBefore: env.DUE_REMINDER_HOURS_BEFORE,
  },
};

