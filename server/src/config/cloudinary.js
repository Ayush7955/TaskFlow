'use strict';

const { v2: cloudinary } = require('cloudinary');
const { cloudinary: cfg } = require('./env');

cloudinary.config({
  cloud_name: cfg.cloudName,
  api_key: cfg.apiKey,
  api_secret: cfg.apiSecret,
  secure: true,
});

module.exports = cloudinary;
