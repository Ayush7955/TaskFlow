const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = { sequelize, Sequelize };

// Auto-load all *.model.js files
const modelsDir = __dirname;
fs.readdirSync(modelsDir)
  .filter((file) => file !== 'index.js' && file.endsWith('.model.js'))
  .sort()
  .forEach((file) => {
    // eslint-disable-next-line global-require
    const modelDefiner = require(path.join(modelsDir, file));
    const model = modelDefiner(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Run associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;

