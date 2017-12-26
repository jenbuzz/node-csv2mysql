var fs = require('fs');
var csv = require('csv-parse');
var mysql = require('mysql');

var argv = require('minimist')(process.argv.slice(2));

var host = argv.host !== undefined ? argv.host : '127.0.0.1';
var user = argv.user !== undefined ? argv.user : 'root';
var pw = argv.pw !== undefined ? argv.pw : '';
var db = argv.db !== undefined ? argv.db : '';
var table = argv.table !== undefined ? argv.table : '';
var file = argv.file !== undefined ? argv.file : '';

if (!db) {
    console.error('Please define db!');
    return;
}

if (!table) {
    console.error('Please define table!');
    return;
}

if (!file) {
    console.error('Please define file!');
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

        for (var k = 0; k < fields.length; k++) {
            newEntry[fields[k].toLowerCase()] = data[j][k];
        }

        connection.query(insertQuery, newEntry, function (err, result) {
            if (err) {
                throw err;
            }
        });
    }
    
    connection.end();
});

fs.createReadStream(__dirname + '/' + file).pipe(parser);
