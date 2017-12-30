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

### CSV syntax
The delimiter must be a comma.

Insert values into a relational table using the following syntax in the first row to specify table and column names:

``[RelationX|csv2mysql_id|relation_id]``

In this example the table name would be "relationx" and the column names "csv2mysql_id" (referring to the id of the newly inserted row) and "relation_id" (referring to the id of the related row).

To insert multiple values seperate the values with a "-".

See example.csv for more.