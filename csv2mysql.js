const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const mysql = require('mysql');
const prompt = require('prompt');
const chalk = require('chalk');
const parsearg = require('minimist');

const promptProperties = [{
    name: 'password',
    description: 'Enter your MySQL password',
    hidden: true
}];

// Logging
const {log} = console;
const errorMsg = chalk.bold.red('Error: ');

// Arguments

const argv = parsearg(process.argv.slice(2));
const host = argv.host === undefined ? '127.0.0.1' : argv.host;
const user = argv.user === undefined ? 'root' : argv.user;
const database = argv.db === undefined ? '' : argv.db;
const table = argv.table === undefined ? '' : argv.table;
const file = argv.file === undefined ? '' : argv.file;
const delimiter = argv.delimiter === undefined ? ',' : argv.delimiter;

if (!database) {
    throwMissingArgument('db');
}

if (!table) {
    throwMissingArgument('table');
}

if (!file) {
    throwMissingArgument('file');
}

function throwMissingArgument (type) {
    log(errorMsg + chalk.red('Please define ' + type));
    throw new Error('Missing argument');
}

prompt.start();
prompt.get(promptProperties, (err, result) => {
    if (err) {
        log(errorMsg + chalk.red('Password input failed!'));
        throw err;
    }

    const {password} = result;

    // Setup MySQL connection
    const connection = mysql.createConnection({
        host,
        user,
        password,
        database
    });

    // Start parsing the csv file
    const parser = csv({delimiter}, (err, data) => {
        if (err) {
            log(errorMsg + chalk.red('File parsing failed'));
            throw err;
        }

        const insertQuery = 'INSERT INTO ' + table + ' SET ?';

        // Getting the first row containing the table column names
        const fields = data.shift();

        for (let i = 0; i < data.length; i++) {
            const newEntry = {};

            const relationTableAndCols = [];

            for (let j = 0; j < fields.length; j++) {
                // Checking if the column is for a relationship
                const isRelation = fields[j].match(/\[(.*?)\]/);
                if (isRelation && isRelation.length >= 2) {
                    const relationData = isRelation[1].split('|');
                    if (relationData && relationData.length === 3) {
                        relationTableAndCols[j] = {
                            table: relationData[0],
                            columnX: relationData[1],
                            columnY: relationData[2]
                        };

                        continue;
                    }
                }

                // Adding data to be inserted to a new entry object
                newEntry[fields[j].toLowerCase()] = data[i][j];
            }

            const dataIndex = i;

            // Insert the data
            const query = connection.query(insertQuery, newEntry, (err, result) => {
                if (err) {
                    log(errorMsg + chalk.red(err.sqlMessage));
                    throw err;
                }

                const {insertId} = result;

                // Add relationship data if any specified
                for (let k = 0; k < relationTableAndCols.length; k++) {
                    if (relationTableAndCols[k] !== undefined) {
                        const relData = relationTableAndCols[k];
                        const relValue = data[dataIndex][k].split('-');

                        if (relValue.length > 0) {
                            for (let l = 0; l < relValue.length; l++) {
                                const relEntry = {};
                                relEntry[relData.columnX] = insertId;
                                relEntry[relData.columnY] = relValue[l];

                                const relQuery = 'INSERT INTO ' + relData.table.toLowerCase() + ' SET ?';

                                const query = connection.query(relQuery, relEntry, err => {
                                    if (err) {
                                        log(errorMsg + chalk.red(err.sqlMessage));
                                        throw err;
                                    }
                                });
                                log(chalk.green(query.sql));
                            }
                        }
                    }
                }
            });
            log(chalk.green(query.sql));
        }
    });

    // Check for valid file source
    fs.access(path.join(__dirname, file), fs.constants.R_OK, err => {
        if (err) {
            log(errorMsg + chalk.red('No access to file!'));
            return;
        }

        // Connect to database
        connection.connect(err => {
            if (err) {
                log(errorMsg + chalk.red('Could not connect to database!'));
                return;
            }

            // Start reading file content
            fs.createReadStream(path.join(__dirname, file)).pipe(parser);
        });
    });
});
