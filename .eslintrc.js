module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Treat warnings as warnings, not errors
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    // Allow unused imports in development
    'no-unused-vars': 'warn'
  },
  // Don't fail build on warnings
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn'
      }
    }
  ]
};
