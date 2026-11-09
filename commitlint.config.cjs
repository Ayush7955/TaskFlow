module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat','fix','docs','style','refactor','perf','test','build','ci','chore','revert']],
    'scope-enum': [1, 'always', ['auth','workspace','board','list','card','rank','rbac','gql','socket','upload','mail','firebase','security','ci','db','client','dashboard']],
    'subject-max-length': [2, 'always', 72],
  },
};

