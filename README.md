# TaskFlow — SaaS Kanban Task Manager

Production-grade multi-tenant SaaS task manager (Trello/Linear style) built with Node.js, Express, MySQL, React, and Socket.io.

## Stack
- **Backend:** Node.js 20, Express 4, MySQL 8, Sequelize 6, Apollo Server 4, Socket.io 4
- **Frontend:** React 18, Vite, TanStack Query, Zustand, @dnd-kit, Tailwind CSS
- **Auth:** JWT (access + refresh rotation), bcrypt
- **Real-time:** Socket.io rooms per board
- **Uploads:** Cloudinary / AWS S3
- **Email:** Nodemailer + Handlebars templates
- **Push:** Firebase FCM + Realtime DB presence
- **CI/CD:** GitHub Actions + Docker

## Quick Start
```bash
cp server/.env.example server/.env   # fill in values
cd server && npm install
npm run db:create && npm run db:migrate && npm run db:seed
npm run dev
```

See `docs/` for full architecture, API, RBAC matrix, and ER diagram.

