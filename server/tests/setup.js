// Global test setup
// Tests run against a test database (p16_taskmanager_test)
// Make sure DB is migrated before running tests:
//   NODE_ENV=test npm run db:create && NODE_ENV=test npm run db:migrate

afterAll(async () => {
  // Close DB connection after all tests
  try {
    const { sequelize } = require('../src/models');
    await sequelize.close();
  } catch {
    // ignore
  }
});

