'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get user IDs
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('alice@taskflow.dev', 'bob@taskflow.dev') ORDER BY email`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const userRows = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('alice@taskflow.dev', 'bob@taskflow.dev')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const alice = userRows.find((u) => u.email === 'alice@taskflow.dev');
    const bob = userRows.find((u) => u.email === 'bob@taskflow.dev');

    if (!alice) {
      console.log('[seeder] Demo users not found — run user seeder first');
      return;
    }

    // Check idempotency
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM workspaces WHERE slug = 'acme-corp' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing.length > 0) {
      console.log('[seeder] Demo workspaces already exist — skipping');
      return;
    }

    const now = new Date();
    const workspaces = [
      {
        public_id: 'bbbbbbbb-0001-4000-b000-000000000001',
        name: 'Acme Corp',
        slug: 'acme-corp',
        description: 'Main workspace for Acme Corporation product team.',
        logo_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=acme',
        plan: 'pro',
        owner_id: alice.id,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        public_id: 'bbbbbbbb-0002-4000-b000-000000000002',
        name: 'Startup Lab',
        slug: 'startup-lab',
        description: 'Experimental projects and R&D workspace.',
        logo_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=startup',
        plan: 'free',
        owner_id: bob ? bob.id : alice.id,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('workspaces', workspaces, {});
    console.log(`[seeder] Inserted ${workspaces.length} demo workspaces`);

    // Get all user IDs for membership
    const allUsers = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('alice@taskflow.dev','bob@taskflow.dev','carol@taskflow.dev','dave@taskflow.dev','eve@taskflow.dev')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const aliceUser = allUsers.find((u) => u.email === 'alice@taskflow.dev');
    const bobUser = allUsers.find((u) => u.email === 'bob@taskflow.dev');
    const carolUser = allUsers.find((u) => u.email === 'carol@taskflow.dev');
    const daveUser = allUsers.find((u) => u.email === 'dave@taskflow.dev');
    const eveUser = allUsers.find((u) => u.email === 'eve@taskflow.dev');

    const ws = await queryInterface.sequelize.query(
      `SELECT id, slug FROM workspaces WHERE slug IN ('acme-corp','startup-lab')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const acme = ws.find((w) => w.slug === 'acme-corp');
    const startup = ws.find((w) => w.slug === 'startup-lab');

    const members = [];

    if (acme) {
      if (aliceUser) members.push({ workspace_id: acme.id, user_id: aliceUser.id, role: 'owner', joined_at: now, created_at: now, updated_at: now });
      if (bobUser) members.push({ workspace_id: acme.id, user_id: bobUser.id, role: 'admin', joined_at: now, created_at: now, updated_at: now });
      if (carolUser) members.push({ workspace_id: acme.id, user_id: carolUser.id, role: 'member', joined_at: now, created_at: now, updated_at: now });
      if (daveUser) members.push({ workspace_id: acme.id, user_id: daveUser.id, role: 'member', joined_at: now, created_at: now, updated_at: now });
      if (eveUser) members.push({ workspace_id: acme.id, user_id: eveUser.id, role: 'member', joined_at: now, created_at: now, updated_at: now });
    }

    if (startup) {
      if (bobUser) members.push({ workspace_id: startup.id, user_id: bobUser.id, role: 'owner', joined_at: now, created_at: now, updated_at: now });
      if (aliceUser) members.push({ workspace_id: startup.id, user_id: aliceUser.id, role: 'admin', joined_at: now, created_at: now, updated_at: now });
      if (carolUser) members.push({ workspace_id: startup.id, user_id: carolUser.id, role: 'member', joined_at: now, created_at: now, updated_at: now });
    }

    if (members.length > 0) {
      await queryInterface.bulkInsert('workspace_members', members, {});
      console.log(`[seeder] Inserted ${members.length} workspace memberships`);
    }
  },

  async down(queryInterface, Sequelize) {
    const ws = await queryInterface.sequelize.query(
      `SELECT id FROM workspaces WHERE slug IN ('acme-corp','startup-lab')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const wsIds = ws.map((w) => w.id);
    if (wsIds.length > 0) {
      await queryInterface.bulkDelete('workspace_members', { workspace_id: wsIds });
      await queryInterface.bulkDelete('workspaces', { id: wsIds });
    }
    console.log('[seeder] Removed demo workspaces and members');
  },
};
