var fs = require('fs');
var csv = require('csv-parse');
var mysql = require('mysql');

var chalk = require('chalk');
var log = console.log;

var argv = require('minimist')(process.argv.slice(2));

var host = argv.host !== undefined ? argv.host : '127.0.0.1';
var user = argv.user !== undefined ? argv.user : 'root';
var pw = argv.pw !== undefined ? argv.pw : '';
var db = argv.db !== undefined ? argv.db : '';
var table = argv.table !== undefined ? argv.table : '';
var file = argv.file !== undefined ? argv.file : '';

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

var connection = mysql.createConnection({
    host: host,
    user: user,
    password: pw,
    database: db
});
connection.connect();

var parser = csv({delimiter: ','}, function(err, data) {
    var insertQuery = 'INSERT INTO ' + table + ' SET ?';

    var fields = data.shift();

    for (var j = 0; j < data.length; j++) {
        var newEntry = {};

        var relationTableAndCols = [];

        for (var k = 0; k < fields.length; k++) {
            var isRelation = fields[k].match(/\[(.*?)\]/);
            if (isRelation && isRelation.length >= 2) {
                var relationData = isRelation[1].split('|');
                if (relationData && relationData.length === 3) {
                    relationTableAndCols[k] = {
                        table: relationData[0],
                        column_x: relationData[1],
                        column_y: relationData[2]
                    };

                    continue;
                }
            }

            newEntry[fields[k].toLowerCase()] = data[j][k];
        }

        const dataIndex = j;

        var query = connection.query(insertQuery, newEntry, function (err, result) {
            if (err) {
                throw err;
            }

            var insertId = result.insertId;

            for (var l = 0; l < relationTableAndCols.length; l++) {
                if (relationTableAndCols[l] !== undefined) {
                    var relData = relationTableAndCols[l];
                    var relValue = data[dataIndex][l].split('-');

                    if (relValue.length > 0) {
                        for (var m = 0; m < relValue.length; m++) {
                            var relEntry = {};
                            relEntry[relData.column_x] = insertId;
                            relEntry[relData.column_y] = relValue[m];

                            var relQuery = 'INSERT INTO ' + relData.table.toLowerCase() + ' SET ?';

                            var query = connection.query(relQuery, relEntry, function (err, result) {
                                if (err) {
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

fs.createReadStream(__dirname + '/' + file).pipe(parser);