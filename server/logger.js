/* eslint-disable no-console */

const chalk = require('chalk');
const ip = require('ip');

const divider = chalk.gray('\n-----------------------------------');

const logger = {

  // Called whenever there's an error on the server we want to print
  error: (err) => {
    console.log(chalk.red(err));
  },

  // Called when express.js app starts on given port w/o errors
  appStarted: (port) => {
    console.log(`Server started ${chalk.green('✓')}`);

    console.log(`
${chalk.bold('Access URLs:')}${divider}
localhost: ${chalk.magenta(`http://localhost:${port}`)}
      LAN: ${chalk.magenta(`http://${ip.address()}:${port}`)}
${divider}
${chalk.blue(`Press ${chalk.italic('CTRL-C')} to stop`)}
    `);
  },
};

module.exports = logger;
