# node-csv2mysql
This node.js script can import data from a csv file into a MySQL table.

## Usage
Run "node node-csv2mysql.js" with the required options.

### Example
``node node-csv2mysql.js --host 127.0.0.1 --user root --pw 1234 --db csv2mysql --table csv2mysql --file example.csv``

### Options
|Name|Description|Default value|
|---|---|---|
|host|MySQL host address|127.0.0.1|
|user|MySQL username|root|
|pw|MySQL password||
|db|MySQL database name||
|table|MySQL table name||
|file|Name of csv file to import||