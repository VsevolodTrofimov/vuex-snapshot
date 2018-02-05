module.exports = {
  "moduleFileExtensions": [
    "js",
    "json",
    "vue"
  ],
  "transform": {
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
  },
  "collectCoverage": true,
  "collectCoverageFrom": [
    "src/**/*.js",
    "index.js"
  ],
  coverageReporters: ["lcov", "json"],
  "mapCoverage": true
}
