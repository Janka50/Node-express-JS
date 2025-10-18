const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require ('moment');
const { timeStamp } = require('console');

const filepath=path.join(__dirname, 'data.txt');

fs.readFile(filepath,'utf-8', (err , data ) => {
    if (err) {
        console.error(chalk.red('error reading file:'), err.message)
        return ;
    }
    console.log(chalk.blue('current file content \n') , data);

const timeStamp = moment().format ('YYYY-MM-DD, HH-mm-ss');
const logEntry =`Updated at \n: ${timeStamp}`;

fs.appendFile(filepath, logEntry, (err) => {
    if (err) {
        console.error(chalk.red('Error appending to file \n:'), err.message);
    }
    console.log(chalk.green(`File appended Successsfully at ${timeStamp} \n:`));
});
});
