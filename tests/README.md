# Summit HQ Checks

`npm test` opens Summit HQ in a headless browser against a pretend sign-in and a pretend save
relay (`harness.js`), with sample data (`sample-ros.json`), and runs the checks in `run.js`.
Nothing real is read or changed.

They run on GitHub after every upload (`.github/workflows/checks.yml`). To run one check by
name: `node tests/run.js "past summits"`.

When you add a feature, add a check for it to `run.js`.
