module.exports = {
  
  extends: [
    '@eslint/js/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  
  
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn', 
    '@typescript-eslint/ban-ts-comment': 'warn',
    'no-prototype-builtins': 'warn',
    'prefer-const': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  }
};