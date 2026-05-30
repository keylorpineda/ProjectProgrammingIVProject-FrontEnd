/* eslint-env node */
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "test",
        "docs",
        "chore",
        "perf",
        "style",
        "ci",
        "revert",
      ],
    ],
    "subject-case": [0, "always", "lower-case"],
    "subject-max-length": [2, "always", 200],
    "header-max-length": [2, "always", 200],
    "body-max-line-length": [1, "always", 200],
  },
};
