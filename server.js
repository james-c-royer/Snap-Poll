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
    database: process.env.DB_database,
    password: process.env.DB_password,
    port: 5432
})

app.listen(80, () => {
    console.log(`Listening on port ${port}`);
});

/* default powershell for unconfigured DB:
TO SET
$env:DB_user='postgres';
$env:DB_host='localhost';
$env:DB_database='postgres';
$env:DB_password='postgres';

TO VIEW
$env:DB_(user/host/database/password)
*/


// this is called in create.js
app.post("/api/sessions/create", async (req, res) => {
    // logging the JSON that was received for error checking
    console.log("Create body:", req.body);

    // "data" from createSession() function
    const { player_limit, prompts } = req.body;

    // validate that we received our data
    if (!player_limit || !prompts) {
        return res.status(400).json({ error: "Missing required data" });
    }

    // Generate join code
    const joinCode = Math.floor(1000 + Math.random() * 9000);
    // this could technically create two identical join codes...

    // Create session with joinCode and player_limit (session_id auto generated)
    const sql = `
        INSERT INTO sessions (join_code, player_limit)
        VALUES ($1, $2)
        RETURNING session_id
    `;

    // run the SQL statement with the selected values:

    /* when you set something to be equal in node.js to a pool.query, it becomes a json object with certain values. Depiction below:

    result =
    {
    command: "INSERT" (determined by the SQL statement)
    rowCount: x (how many rows are inserted -- 1 here)
    oid: null (not sure what this is)
    rows: [{val returned by sql statement}],
    fields: [{
        // this is metadata about the returned columns
    }]
    
    }
    */
    const result = await pool.query(sql, [joinCode, player_limit]);
    // retrieves the session idea of the row that was inserted
    const session_id = result.rows[0].session_id;

    // Insert prompts into prompts table with prompt_index
    for (let i = 0; i < prompts.length; i++) {
        await pool.query(
            "INSERT INTO prompts (session_id, prompt_text, prompt_index) VALUES ($1, $2, $3)",
            [session_id, prompts[i], i]
        );
    }

    // Create the host player

    // host is just a player with the host role
    const host = await pool.query(
        "INSERT INTO players (session_id, name, is_host) VALUES ($1, $2, true) RETURNING player_id",
        [session_id, true]
    );

    // send the response back to the front-end (this)
    res.json({
        session_id,
        player_id: host.rows[0].player_id,
        join_code: joinCode
    });
});


/* used to get the join code for lobby_created. Some explanation:
:sid is a route parameter. When you call this, you will call:
    1.  declare "const params = new URLSearchParams(window.location.search)"
            -- this is the query string for the lobby (such as ?session_id=1&player_id=1)
    2. declare "const lobby_sessionID = params.get("session_id")""
            -- this is the stringified int after "session_id="

    3. declare "const lobby_join_code = await fetch(`/api/sessions/${sessionID}`)"
        -- the call to this function
    4. join_code_container.innerHTML = join_code.join_code
        -- sets the innerHTML to the join code
*/
app.get("/api/sessions/:session_id/join_code", async (req, res) => {
    const sql = "SELECT join_code FROM sessions WHERE session_id =$1"
    // req.params.session_id is essential lobby_sessionID -> it is the url of what called it
    const result = await pool.query(sql, [req.params.session_id]);
    res.json(result.rows[0])
});


// ----------------------------------------------------------------------------
// --------------------------- JOINING A LOBBY --------------------------------
// ----------------------------------------------------------------------------

// used in script.js: how do we join a lobby? First we see if a lobby exists:
app.get("/api/sessions/:join_code", async (req, res) => {
    const sql = "SELECT session_id FROM sessions WHERE join_code =$1"
    const result = await pool.query(sql, [req.params.join_code]);
    res.json(result.rows[0] || null) // returns null if no lobby exists
})

// if it does exists, we need to create them:
app.post(`/api/create_player`, async (req, res) => {
    const { join_code, name } = req.body;

    // get the session ID using the join code 
    let sesh_find = "SELECT session_id FROM sessions WHERE join_code =$1";
    const sesh_result = await pool.query(sesh_find, [join_code]);
    const sesh_id = sesh_result.rows[0].session_id;

    // then insert it into the players table
    const sql = "INSERT INTO players (session_id, name) VALUES ($1,$2) RETURNING player_id";
    const result = await pool.query(sql, [sesh_id, name]);

    // return the new player and sesion info
    res.json({
        session_id: sesh_id,
        player_id: result.rows[0].player_id
    });
})