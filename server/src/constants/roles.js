const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

const ROLE_RANK = {
  owner: 3,
  admin: 2,
  member: 1,
};

const isAtLeast = (role, minRole) => (ROLE_RANK[role] || 0) >= (ROLE_RANK[minRole] || 0);

module.exports = { ROLES, ROLE_RANK, isAtLeast };

