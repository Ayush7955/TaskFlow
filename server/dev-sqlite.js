'use strict';
/**
 * dev-sqlite.js — Start TaskFlow server using SQLite instead of MySQL.
 * Usage: node dev-sqlite.js
 * Seeds demo data automatically on first run.
 */

process.env.NODE_ENV = 'development';
process.env.PORT = '5001';

const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const SQLITE_PATH = path.resolve(__dirname, 'dev.sqlite');

// Monkey-patch models/index.js to use SQLite
// We do this by pre-creating a patched sequelize instance and storing it
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: SQLITE_PATH,
  logging: false,
  define: { underscored: true, timestamps: true },
});

// Build db manually (same as models/index.js but SQLite)
const db = { sequelize, Sequelize };
const modelsDir = path.resolve(__dirname, 'src/models');
fs.readdirSync(modelsDir)
  .filter((f) => f !== 'index.js' && f.endsWith('.model.js'))
  .sort()
  .forEach((f) => {
    const modelDef = require(path.join(modelsDir, f));
    const m = modelDef(sequelize, Sequelize.DataTypes);
    db[m.name] = m;
  });
Object.keys(db).forEach((name) => {
  if (db[name] && db[name].associate) db[name].associate(db);
});

// Patch require cache so server uses our SQLite db
require.cache[require.resolve('./src/models')] = {
  id: require.resolve('./src/models'),
  filename: require.resolve('./src/models'),
  loaded: true,
  exports: db,
};

async function bootstrap() {
  // Sync tables (preserve existing data)
  await sequelize.sync();
  console.log('✅ SQLite tables synced');

  // Seed if empty
  const userCount = await db.User.count();
  if (userCount === 0) {
    console.log('⏳ Seeding demo data...');
    const queryInterface = sequelize.getQueryInterface();
    const seedersDir = path.resolve(__dirname, 'src/seeders');
    const files = fs.readdirSync(seedersDir).filter((f) => f.endsWith('.js')).sort();
    for (const file of files) {
      try {
        const seeder = require(path.join(seedersDir, file));
        if (seeder.up) {
          await seeder.up(queryInterface, Sequelize);
          console.log('  ✅', file);
        }
      } catch (err) {
        console.warn('  ⚠️  Seeder skipped:', file, '—', err.message);
      }
    }
  } else {
    console.log(`✅ DB already has ${userCount} users — skipping seed`);
  }

  // Now boot the actual server (which will re-use our patched models from cache)
  require('./src/server');
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
