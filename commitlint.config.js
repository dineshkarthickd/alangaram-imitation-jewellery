export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Formatting, missing semi colons, etc
        'refactor', // Code refactoring
        'test',     // Adding missing tests
        'chore',    // Maintenance
      ],
    ],
  },
};
