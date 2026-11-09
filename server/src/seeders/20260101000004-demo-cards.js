'use strict';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const cardTemplates = [
  {
    listName: 'Backlog',
    cards: [
      { title: 'User authentication flow redesign', priority: 'high', desc: 'Redesign login, signup, and password reset screens for better UX.' },
      { title: 'Add dark mode support', priority: 'medium', desc: 'Implement system-aware dark mode across all UI components.' },
      { title: 'Improve onboarding tour', priority: 'medium', desc: 'Create interactive product tour for new users using intro.js.' },
      { title: 'Export reports as PDF', priority: 'low', desc: 'Allow users to export board analytics as PDF reports.' },
      { title: 'Multi-language support (i18n)', priority: 'low', desc: 'Add i18n support for English, Spanish, French, German.' },
    ],
  },
  {
    listName: 'In Progress',
    cards: [
      { title: 'Implement drag-and-drop for cards', priority: 'high', desc: 'Use @dnd-kit to enable smooth drag-and-drop between lists.' },
      { title: 'Real-time collaboration with WebSockets', priority: 'urgent', desc: 'Integrate Socket.io for live board updates.' },
      { title: 'Card due date reminders', priority: 'medium', desc: 'Send email + push notifications 24h before due date.' },
    ],
  },
  {
    listName: 'In Review',
    cards: [
      { title: 'REST API rate limiting', priority: 'high', desc: 'Add per-IP and per-user rate limiting using express-rate-limit.' },
      { title: 'GraphQL schema v1', priority: 'medium', desc: 'Define and implement full GraphQL schema with DataLoaders.' },
    ],
  },
  {
    listName: 'Done',
    cards: [
      { title: 'Project scaffolding', priority: 'medium', desc: 'Set up monorepo with server + client, ESLint, Prettier, Husky.' },
      { title: 'Database schema design', priority: 'high', desc: 'Design all 18 tables with proper FK constraints and indexes.' },
      { title: 'JWT auth with refresh rotation', priority: 'high', desc: 'Implement secure JWT auth with token rotation and reuse detection.' },
      { title: 'CI/CD pipeline with GitHub Actions', priority: 'medium', desc: 'Configure automated tests, build, and deployment.' },
    ],
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check idempotency
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM cards WHERE title = 'User authentication flow redesign' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (existing.length > 0) {
      console.log('[seeder] Demo cards already exist — skipping');
      return;
    }

    const users = await queryInterface.sequelize.query(
      `SELECT id, email FROM users WHERE email IN ('alice@taskflow.dev','bob@taskflow.dev','carol@taskflow.dev','dave@taskflow.dev','eve@taskflow.dev')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (users.length === 0) {
      console.log('[seeder] No users found');
      return;
    }

    const boards = await queryInterface.sequelize.query(
      `SELECT id, name FROM boards`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    if (boards.length === 0) {
      console.log('[seeder] No boards found');
      return;
    }

    const lists = await queryInterface.sequelize.query(
      `SELECT id, board_id, name FROM lists`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const now = new Date();
    const alice = users.find((u) => u.email === 'alice@taskflow.dev');
    const bob = users.find((u) => u.email === 'bob@taskflow.dev');
    const carol = users.find((u) => u.email === 'carol@taskflow.dev');
    const dave = users.find((u) => u.email === 'dave@taskflow.dev');
    const eve = users.find((u) => u.email === 'eve@taskflow.dev');
    const userPool = [alice, bob, carol, dave, eve].filter(Boolean);

    const cards = [];
    const cardMembersData = [];
    const checklistsData = [];
    const checklistItemsData = [];

    for (const board of boards) {
      for (const tmpl of cardTemplates) {
        const list = lists.find(
          (l) => l.board_id === board.id && l.name === tmpl.listName
        );
        if (!list) continue;

        tmpl.cards.forEach((cardDef, idx) => {
          const dueDate = new Date(now);
          dueDate.setDate(dueDate.getDate() + (idx + 1) * 3);

          const createdBy = userPool[idx % userPool.length].id;
          const isComplete = tmpl.listName === 'Done';

          cards.push({
            public_id: require('crypto').randomUUID(),
            list_id: list.id,
            board_id: board.id,
            title: cardDef.title,
            description: cardDef.desc,
            position: (idx + 1) * 1000.0,
            priority: cardDef.priority,
            due_date: tmpl.listName !== 'Done' ? dueDate : null,
            start_date: null,
            is_complete: isComplete,
            is_archived: false,
            created_by: createdBy,
            cover_attachment_id: null,
            estimated_hours: Math.floor(Math.random() * 8) + 1,
            actual_hours: isComplete ? Math.floor(Math.random() * 8) + 1 : null,
            deleted_at: null,
            created_at: now,
            updated_at: now,
          });
        });
      }
    }

    await queryInterface.bulkInsert('cards', cards, {});
    console.log(`[seeder] Inserted ${cards.length} demo cards`);

    // Assign members to cards
    const insertedCards = await queryInterface.sequelize.query(
      `SELECT id FROM cards ORDER BY created_at LIMIT ${cards.length}`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (let i = 0; i < insertedCards.length; i++) {
      const card = insertedCards[i];
      // Assign 1-2 users per card
      const assignee1 = userPool[i % userPool.length];
      cardMembersData.push({
        card_id: card.id,
        user_id: assignee1.id,
        created_at: now,
        updated_at: now,
      });
    }

    if (cardMembersData.length > 0) {
      await queryInterface.bulkInsert('card_members', cardMembersData, {});
      console.log(`[seeder] Inserted ${cardMembersData.length} card members`);
    }

    // Add checklists to first 10 cards
    const firstCards = insertedCards.slice(0, 10);
    for (const card of firstCards) {
      const checklistId = require('crypto').randomUUID();
      checklistsData.push({
        public_id: checklistId,
        card_id: card.id,
        title: 'Acceptance Criteria',
        position: 1000.0,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('checklists', checklistsData, {});
    console.log(`[seeder] Inserted ${checklistsData.length} checklists`);

    const insertedChecklists = await queryInterface.sequelize.query(
      `SELECT id FROM checklists ORDER BY created_at LIMIT ${checklistsData.length}`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const checklistItemTemplates = [
      'Write unit tests',
      'Update documentation',
      'Get design approval',
      'Code review completed',
      'QA sign-off',
    ];

    for (const checklist of insertedChecklists) {
      checklistItemTemplates.forEach((content, idx) => {
        checklistItemsData.push({
          public_id: require('crypto').randomUUID(),
          checklist_id: checklist.id,
          content,
          is_checked: idx < 2,
          assignee_id: null,
          due_date: null,
          position: (idx + 1) * 1000.0,
          created_at: now,
          updated_at: now,
        });
      });
    }

    await queryInterface.bulkInsert('checklist_items', checklistItemsData, {});
    console.log(`[seeder] Inserted ${checklistItemsData.length} checklist items`);

    // Add comments to first 15 cards
    const commentCards = insertedCards.slice(0, 15);
    const comments = [];
    for (const card of commentCards) {
      const author = userPool[Math.floor(Math.random() * userPool.length)];
      comments.push({
        public_id: require('crypto').randomUUID(),
        card_id: card.id,
        user_id: author.id,
        content: 'This looks good — moving forward with the implementation.',
        is_edited: false,
        parent_id: null,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('comments', comments, {});
    console.log(`[seeder] Inserted ${comments.length} comments`);
  },

  async down(queryInterface, Sequelize) {
    // Delete in reverse dependency order
    await queryInterface.sequelize.query(`DELETE FROM comments WHERE card_id IN (SELECT id FROM cards)`);
    await queryInterface.sequelize.query(`DELETE FROM checklist_items WHERE checklist_id IN (SELECT id FROM checklists)`);
    await queryInterface.sequelize.query(`DELETE FROM checklists`);
    await queryInterface.sequelize.query(`DELETE FROM card_members`);
    await queryInterface.sequelize.query(`DELETE FROM cards`);
    console.log('[seeder] Removed demo cards, checklists, comments');
  },
};

