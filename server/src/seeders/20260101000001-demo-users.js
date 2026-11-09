'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const SALT_ROUNDS = 10;

const users = [
  {
    public_id: 'aaaaaaaa-0001-4000-a000-000000000001',
    name: 'Alice Owner',
    email: 'alice@taskflow.dev',
    password: 'Password123!',
    role: 'user',
    is_verified: true,
    is_active: true,
    token_version: 0,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  },
  {
    public_id: 'aaaaaaaa-0002-4000-a000-000000000002',
    name: 'Bob Admin',
    email: 'bob@taskflow.dev',
    password: 'Password123!',
    role: 'user',
    is_verified: true,
    is_active: true,
    token_version: 0,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
  },
  {
    public_id: 'aaaaaaaa-0003-4000-a000-000000000003',
    name: 'Carol Member',
    email: 'carol@taskflow.dev',
    password: 'Password123!',
    role: 'user',
    is_verified: true,
    is_active: true,
    token_version: 0,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
  },
  {
    public_id: 'aaaaaaaa-0004-4000-a000-000000000004',
    name: 'Dave Member',
    email: 'dave@taskflow.dev',
    password: 'Password123!',
    role: 'user',
    is_verified: true,
    is_active: true,
    token_version: 0,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
  },
  {
    public_id: 'aaaaaaaa-0005-4000-a000-000000000005',
    name: 'Eve Member',
    email: 'eve@taskflow.dev',
    password: 'Password123!',
    role: 'user',
    is_verified: true,
    is_active: true,
    token_version: 0,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: skip if any seeded email already exists
    const existing = await queryInterface.rawSelect(
      'users',
      { where: { email: 'alice@taskflow.dev' } },
      ['id']
    );
    if (existing) {
      console.log('[seeder] Demo users already exist — skipping');
      return;
    }

    const now = new Date();
    const rows = await Promise.all(
      users.map(async (u) => {
        const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
        return {
          public_id: u.public_id,
          name: u.name,
          email: u.email,
          password_hash: hash,
          role: u.role,
          is_verified: u.is_verified,
          is_active: u.is_active,
          token_version: u.token_version,
          avatar_url: u.avatar_url,
          verification_token: null,
          reset_password_token: null,
          reset_password_expires: null,
          created_at: now,
          updated_at: now,
        };
      })
    );

    await queryInterface.bulkInsert('users', rows, {});
    console.log(`[seeder] Inserted ${rows.length} demo users`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: users.map((u) => u.email),
    });
    console.log('[seeder] Removed demo users');
  },
};

