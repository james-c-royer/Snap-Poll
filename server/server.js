const express = require("express");
const Pool = require('pg').Pool
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'))
app.use(bodyParser.json());

// Complete the code to add the database connection
const pool = new Pool({
    user: process.env.DB_user,
    host: process.env.DB_host,
    database: process.env.DB_type,
    password: process.env.DB_password,
    port: 5432
})

/* default powershell for unconfigured DB:
TO SET
$env:DB_user='postgres';
$env:DB_host='postgres';
$env:DB_database='Snap_Poll'; (this depends on if you created the DB like this)
$env:DB_password='postgres';

TO VIEW
$env:DB_(user/host/database/password)
*/


app.listen(80, () => {
    console.log(`Listening on port ${port}`);
});
