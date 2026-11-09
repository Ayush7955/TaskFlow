'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check idempotency
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM boards WHERE name = 'Product Roadmap' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing.length > 0) {
      console.log('[seeder] Demo boards already exist — skipping');
      return;
    }

    const workspaces = await queryInterface.sequelize.query(
      `SELECT id, slug FROM workspaces WHERE slug IN ('acme-corp','startup-lab')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const acme = workspaces.find((w) => w.slug === 'acme-corp');
    const startup = workspaces.find((w) => w.slug === 'startup-lab');

    const alice = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'alice@taskflow.dev' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const bob = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'bob@taskflow.dev' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const aliceId = alice[0]?.id;
    const bobId = bob[0]?.id;

    if (!acme || !aliceId) {
      console.log('[seeder] Required workspaces/users not found');
      return;
    }

    const now = new Date();

    const boards = [
      {
        public_id: 'cccccccc-0001-4000-c000-000000000001',
        workspace_id: acme.id,
        name: 'Product Roadmap',
        description: 'Quarterly product planning and feature tracking.',
        cover_image_url: null,
        background_color: '#f5f5f5',
        visibility: 'workspace',
        status: 'active',
        created_by: aliceId,
        version: 0,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        public_id: 'cccccccc-0002-4000-c000-000000000002',
        workspace_id: acme.id,
        name: 'Sprint Board',
        description: 'Active sprint board for engineering team.',
        cover_image_url: null,
        background_color: '#f5f5f5',
        visibility: 'workspace',
        status: 'active',
        created_by: bobId || aliceId,
        version: 0,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
      {
        public_id: 'cccccccc-0003-4000-c000-000000000003',
        workspace_id: acme.id,
        name: 'Bug Tracker',
        description: 'Track and prioritize reported bugs.',
        cover_image_url: null,
        background_color: '#f5f5f5',
        visibility: 'workspace',
        status: 'active',
        created_by: aliceId,
        version: 0,
        deleted_at: null,
        created_at: now,
        updated_at: now,
      },
      ...(startup
        ? [
            {
              public_id: 'cccccccc-0004-4000-c000-000000000004',
              workspace_id: startup.id,
              name: 'MVP Launch',
              description: 'Build and ship the MVP.',
              cover_image_url: null,
              background_color: '#f5f5f5',
              visibility: 'workspace',
              status: 'active',
              created_by: bobId || aliceId,
              version: 0,
              deleted_at: null,
              created_at: now,
              updated_at: now,
            },
            {
              public_id: 'cccccccc-0005-4000-c000-000000000005',
              workspace_id: startup.id,
              name: 'Marketing',
              description: 'Go-to-market strategy tasks.',
              cover_image_url: null,
              background_color: '#f5f5f5',
              visibility: 'workspace',
              status: 'active',
              created_by: bobId || aliceId,
              version: 0,
              deleted_at: null,
              created_at: now,
              updated_at: now,
            },
          ]
        : []),
    ];

    await queryInterface.bulkInsert('boards', boards, {});
    console.log(`[seeder] Inserted ${boards.length} demo boards`);

    // Create lists for each board
    const boardRows = await queryInterface.sequelize.query(
      `SELECT id, name FROM boards WHERE name IN ('Product Roadmap','Sprint Board','Bug Tracker','MVP Launch','Marketing')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const listTemplates = [
      { name: 'Backlog', position: 1000.0 },
      { name: 'In Progress', position: 2000.0 },
      { name: 'In Review', position: 3000.0 },
      { name: 'Done', position: 4000.0 },
    ];

    const lists = [];
    for (const board of boardRows) {
      for (const tmpl of listTemplates) {
        lists.push({
          public_id: require('crypto').randomUUID(),
          board_id: board.id,
          name: tmpl.name,
          position: tmpl.position,
          color: null,
          is_archived: false,
          deleted_at: null,
          created_at: now,
          updated_at: now,
        });
      }
    }

    await queryInterface.bulkInsert('lists', lists, {});
    console.log(`[seeder] Inserted ${lists.length} lists`);

    // Create labels for Acme boards
    const acmeBoards = boardRows.filter((b) =>
      ['Product Roadmap', 'Sprint Board', 'Bug Tracker'].includes(b.name)
    );

    const labelDefs = [
      { name: 'Feature', color: '#6366f1' },
      { name: 'Bug', color: '#ef4444' },
      { name: 'Enhancement', color: '#10b981' },
      { name: 'Documentation', color: '#f59e0b' },
      { name: 'High Priority', color: '#dc2626' },
      { name: 'Low Priority', color: '#6b7280' },
    ];

    const labels = [];
    for (const board of acmeBoards) {
      for (const def of labelDefs) {
        labels.push({
          public_id: require('crypto').randomUUID(),
          board_id: board.id,
          name: def.name,
          color: def.color,
          created_at: now,
          updated_at: now,
        });
      }
    }

    await queryInterface.bulkInsert('labels', labels, {});
    console.log(`[seeder] Inserted ${labels.length} labels`);
  },

  async down(queryInterface, Sequelize) {
    const boards = await queryInterface.sequelize.query(
      `SELECT id FROM boards WHERE name IN ('Product Roadmap','Sprint Board','Bug Tracker','MVP Launch','Marketing')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const boardIds = boards.map((b) => b.id);
    if (boardIds.length > 0) {
      await queryInterface.bulkDelete('labels', { board_id: boardIds });
      const lists = await queryInterface.sequelize.query(
        `SELECT id FROM lists WHERE board_id IN (${boardIds.join(',')})`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      const listIds = lists.map((l) => l.id);
      if (listIds.length > 0) {
        await queryInterface.bulkDelete('lists', { id: listIds });
      }
      await queryInterface.bulkDelete('boards', { id: boardIds });
    }
    console.log('[seeder] Removed demo boards, lists, labels');
  },
};
