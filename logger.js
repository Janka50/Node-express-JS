// logger.js - FINAL VERSION
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');

const filepath = path.join(__dirname, 'data.txt');

fs.access(filepath, fs.constants.F_OK, (err) => {
  if (err) {
    fs.writeFile(filepath, 'Initial content\n2', (err) => {
      if (err) return console.error(chalk.red('Failed to create file:', err.message));
      console.log(chalk.yellow('Created data.txt'));
      readAndLog();
    });
  } else {
    readAndLog();
  }
});

function readAndLog() {
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if (err) return console.error(chalk.red('Error reading file:', err.message));

    console.log(chalk.blue('Current file content:\n'), data);

    const timestamp = moment().format('YYYY-MM-DD, HH:mm:ss');
    const logEntry = `Updated at: ${timestamp}\n`;

    fs.appendFile(filepath, logEntry, (err) => {
      if (err) return console.error(chalk.red('Error appending:', err.message));
      console.log(chalk.green(`File appended successfully at ${timestamp}`));
    });
  });
}