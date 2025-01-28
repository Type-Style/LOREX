const config = {
  ignores: [
    "dist",
    "jest.config.js",
    "httpdocs",
    "webpack.config.js",
    "src/client",
    "scripts",
    "init",
    "jest.testData.config.js",
  ],
  languageOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: "tsconfig.json",
    },
  },
  plugins: {
    jest: require("eslint-plugin-jest"),
    "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
  },
  rules: {
    "jest/no-conditional-expect": "off",
  },
  linterOptions: {
    env: {
      node: true,
      "jest/globals": true,
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
  ],
};