const express = require("express");
const Pool = require('pg').Pool
const bodyParser = require("body-parser");

const app = express();

app.use(express.static('public'))
app.use(bodyParser.json());

// Complete the code to add the database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'R3minds-meOfMy',
    port: 5432
})

app.get("/api/testimonials", (req, res) => {

    // Complete the code to retrieve the data and send to front end
    const sql = "SELECT * FROM testimonials";
    // results is an object that contains rows, rowCount, fileds (metadata about columns) and command (SELECT/INSERT/etc)
    pool.query(sql, (error, results) => {
        if (error) throw error;
        // send the rows as json package
        res.status(200).json(results.rows)
    })
});

app.post("/api/testimonials", (req, res) => {

    const testimonial = req.body;

    // Complete the code to save the data into the database
    const sql = "INSERT INTO testimonials (author, message) VALUES ($1, $2)";
    const data = [testimonial.author, testimonial.message];
    pool.query(sql, data, (error, results) => {
        if (error) throw error;
        res.status(200).json(results.rows);
    })
});

app.listen(80, () => {
    console.log("Listening on port 80");
});
