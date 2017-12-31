const fs = require('fs');
const csv = require('csv-parse');
const mysql = require('mysql');

const prompt = require('prompt');
const promptProperties = [
    {
      name: 'password',
      description: 'Enter your MySQL password',
      hidden: true
    }
];

const chalk = require('chalk');
const log = console.log;

const argv = require('minimist')(process.argv.slice(2));

const host = argv.host !== undefined ? argv.host : '127.0.0.1';
const user = argv.user !== undefined ? argv.user : 'root';
const db = argv.db !== undefined ? argv.db : '';
const table = argv.table !== undefined ? argv.table : '';
const file = argv.file !== undefined ? argv.file : '';
const delimiter = argv.delimiter !== undefined ? argv.delimiter : ',';

if (!db) {
    log(chalk.bold.red('Error: ') + chalk.red('Please define db!'));
    return;
}

if (!table) {
    log(chalk.bold.red('Error: ') + chalk.red('Please define table!'));
    return;
}

if (!file) {
    log(chalk.bold.red('Error: ') + chalk.red('Please define file!'));
    return;
}

prompt.start();
prompt.get(promptProperties, function (err, result) {
    if (err) {
        log(chalk.bold.red('Error: ') + chalk.red('Password input failed!'));
        throw err; 
    }

    const pw = result.password;

    let connection = mysql.createConnection({
        host: host,
        user: user,
        password: pw,
        database: db
    });

    let parser = csv({delimiter: delimiter}, function(err, data) {
        let insertQuery = 'INSERT INTO ' + table + ' SET ?';

        let fields = data.shift();

        for (let i = 0; i < data.length; i++) {
            let newEntry = {};

            let relationTableAndCols = [];

            for (let j = 0; j < fields.length; j++) {
                let isRelation = fields[j].match(/\[(.*?)\]/);
                if (isRelation && isRelation.length >= 2) {
                    let relationData = isRelation[1].split('|');
                    if (relationData && relationData.length === 3) {
                        relationTableAndCols[j] = {
                            table: relationData[0],
                            column_x: relationData[1],
                            column_y: relationData[2]
                        };

                        continue;
                    }
                }

                newEntry[fields[j].toLowerCase()] = data[i][j];
            }

            const dataIndex = i;

            let query = connection.query(insertQuery, newEntry, function (err, result) {
                if (err) {
                    log(chalk.bold.red('Error: ') + chalk.red(err.sqlMessage));
                    throw err;
                }

                let insertId = result.insertId;

                for (let k = 0; k < relationTableAndCols.length; k++) {
                    if (relationTableAndCols[k] !== undefined) {
                        let relData = relationTableAndCols[k];
                        let relValue = data[dataIndex][k].split('-');

                        if (relValue.length > 0) {
                            for (let l = 0; l < relValue.length; l++) {
                                let relEntry = {};
                                relEntry[relData.column_x] = insertId;
                                relEntry[relData.column_y] = relValue[l];

                                let relQuery = 'INSERT INTO ' + relData.table.toLowerCase() + ' SET ?';

                                let query = connection.query(relQuery, relEntry, function (err, result) {
                                    if (err) {
                                        log(chalk.bold.red('Error: ') + chalk.red(err.sqlMessage));
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

    fs.access(__dirname + '/' + file, fs.constants.R_OK, (err) => {
        if (err) {
            log(chalk.bold.red('Error: ') + chalk.red('No access to file!'));
            return;
        }    

        connection.connect(function(err) {
            if (err) {
                log(chalk.bold.red('Error: ') + chalk.red('Could not connect to database!'));
                return;
            }

            fs.createReadStream(__dirname + '/' + file).pipe(parser);
        });
    });
});