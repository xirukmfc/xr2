const { createApp } = require('./dist/platform');
const { version } = require('./package.json');

module.exports = createApp({ version });
