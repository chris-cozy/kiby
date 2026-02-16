module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverageFrom: [
    "src/domain/**/*.js",
    "src/services/**/*.js",
    "src/utils/**/*.js",
    "!src/**/index.js",
  ],
};
