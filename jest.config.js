module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/setupEnv.js"],
  collectCoverageFrom: [
    "src/domain/**/*.js",
    "src/services/**/*.js",
    "src/utils/**/*.js",
    "!src/**/index.js",
  ],
};
