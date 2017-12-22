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
    var insertQuery = 'INSERT INTO ' + table + ' ';

    var fields = data.shift();

    insertQuery += '(';
    for (var i = 0; i < fields.length; i++) {
        insertQuery += fields[i].toLowerCase();

        if (i<fields.length-1) {
            insertQuery += ','
        }
    }
    insertQuery += ') ';

    insertQuery += 'VALUES ';
    for (var j = 0; j < data.length; j++) {
        insertQuery += '(';

        for (var k = 0; k < fields.length; k++) {
            insertQuery += connection.escape(data[j][k]);

            if (k<fields.length-1) {
                insertQuery += ','
            }
        }

        insertQuery += ')';

        if (j<data.length-1) {
            insertQuery += ','
        }
    }

    connection.query(insertQuery, function (err, result) {
        if (err) {
            throw err;
        }

        connection.end();
    });
});

fs.createReadStream(__dirname + '/' + file).pipe(parser);
