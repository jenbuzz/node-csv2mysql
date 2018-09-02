# node-csv2mysql
This Node.js script can import data from a csv file into a MySQL table.

## Usage
Run "node csv2mysql.js" with the required options.

Enter your MySQL password in the prompt that appears after starting the script.

### Example
``$ node csv2mysql.js --host 127.0.0.1 --user root --db csv2mysql --table csv2mysql --file example.csv``

### Options
|Name|Description|Default value|
|---|---|---|
|host|MySQL host address|127.0.0.1|
|user|MySQL username|root|
|db|MySQL database name||
|table|MySQL table name||
|file|Name of csv file to import||
|delimiter|CSV data delimiter|,|

### CSV syntax
First row defines the column names in MySQL. All names from the CSV-file will be lowercased. The following rows are the values to be inserted. By default all values should be seperated by a comma - otherwise set the delimiter something else in the arguments.

```
FieldX,FieldY,FieldZ
testx1,testy1,testz1
```

Insert values into a relational table using the following syntax in the first row to specify table and column names:

``[relationx|csv2mysql_id|relation_id]``

In this example the table name would be "relationx" and the column names "csv2mysql_id" (referring to the id of the newly inserted row) and "relation_id" (referring to the id of the related row).

To insert multiple values seperate the values with a "-".

See [example.csv](https://raw.githubusercontent.com/jenbuzz/node-csv2mysql/master/example.csv) for more information on the format.
