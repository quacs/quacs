/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // Keep general navigation tests on the expanded desktop layout.
  // Responsive specs set their own viewport widths.
  viewportWidth: 1280,
  fixturesFolder: "tests/e2e/fixtures",
  screenshotsFolder: "tests/e2e/screenshots",
  videosFolder: "tests/e2e/videos",
  e2e: {
    specPattern: "tests/e2e/specs/**/*.js",
    supportFile: "tests/e2e/support/index.js",
  },
});
