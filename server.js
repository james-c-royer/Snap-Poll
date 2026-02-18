const express = require("express");
const Pool = require('pg').Pool
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'))
app.use(bodyParser.json());

const pool = new Pool({
    user: process.env.DB_user,
    host: process.env.DB_host,
    database: process.env.DB_database,
    password: process.env.DB_password,
    port: 5432
})

app.listen(80, () => {
    console.log(`Listening via port ${port}`);
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
        [session_id, "Host"]
    );

    // send the response back to the front-end (this)
    res.json({
        session_id,
        player_id: host.rows[0].player_id,
        join_code: joinCode
    });
});


/* used to get the join code for lobby_created. Some explanation:
:session_id is a route parameter. When you call this, you will call:
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


// -----------------------------------------
// ------------ JOINING A LOBBY ------------
// -----------------------------------------

// 1. used in script.js: how do we join a lobby? First we see if a lobby exists:
app.get("/api/sessions/:join_code", async (req, res) => {
    const sql = "SELECT session_id FROM sessions WHERE join_code =$1"
    const result = await pool.query(sql, [req.params.join_code]);
    res.json(result.rows[0] || null) // returns null if no lobby exists
})

// 2. if it does exists, we need to create them:
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

// 3. Check that the game has not already started
app.get("/api/sessions/:session_id/game_started", async (req, res) => {
    const sql = `
        SELECT game_started
        FROM sessions
        WHERE session_id = $1`;

    const result = await pool.query(sql, [req.params.session_id]);
    res.json(result.rows[0])
})

// 4. We also need to check, when joining, that the extra player will not make us exceed the lobby 
app.get("/api/sessions/:session_id/player_limit", async (req, res) => {
    const sql = `
        SELECT 
            player_limit,
            (SELECT COUNT(*) FROM players WHERE session_id = $1) AS current_players
        FROM sessions
        WHERE session_id = $1`;
    const results = await pool.query(sql, [req.params.session_id]);
    res.json(results.rows[0]);
});

// 5. Then, in lobby_created, we need to populate the players:
app.get(`/api/sessions/:session_id/players`, async (req, res) => {
    const sql = "SELECT player_id, name FROM players WHERE session_id = $1 ORDER BY player_id";
    const result = await pool.query(sql, [req.params.session_id])
    res.json(result.rows);
})


// -----------------------------------------
// ------------ STARTING A GAME ------------
// -----------------------------------------

// 1. Set the text of the current prompt and move the state to "responding":
app.post("/api/sessions/:session_id/set_current_prompt", async (req, res) => {
    const session_id = req.params.session_id;

    try {
        // 1. Get current prompt index for the session
        const indexSql = `
            SELECT current_prompt_index
            FROM sessions
            WHERE session_id = $1
        `;
        const indexResult = await pool.query(indexSql, [session_id]);

        if (indexResult.rows.length === 0) {
            return res.status(404).json({ error: "Session not found" });
        }

        const currentIndex = indexResult.rows[0].current_prompt_index;

        // 2. Retrieve prompt with matching index
        const promptSql = `
            SELECT prompt_text
            FROM prompts
            WHERE session_id = $1 AND prompt_index = $2
        `;
        const promptResult = await pool.query(promptSql, [session_id, currentIndex]);
        const promptText = promptResult.rows[0].prompt_text;

        // 3. Update session to store the new current prompt
        const updateSql = `
            UPDATE sessions
            SET current_prompt = $1,
                state = 'responding'
            WHERE session_id = $2
        `;
        await pool.query(updateSql, [promptText, session_id]);

        // 4. Return the prompt
        res.json({
            done: false,
            prompt: promptText,
            index: currentIndex
        });

    } catch (err) {
        console.error("Error setting current prompt:", err);
        // HTTP Code is the correct code for server-side error. Had to look it up lol
        res.status(500).json({ error: "Internal server error" });
    }
});

// 2. get the current state to move the players from waiting_room to player_responding
app.get("/api/sessions/:session_id/state", async (req, res) => {
    try {
        const sql = `
      SELECT state
      FROM sessions
      WHERE session_id = $1
    `;
        const result = await pool.query(sql, [req.params.session_id]);

        // We need to error check for if a state is deleted. here, if nothing is found, 
        // we can return a custom "deleted" state that isn't actually in the DB
        if (result.rows.length === 0) {
            return res.json({ state: "deleted" });
        }

        res.json({ state: result.rows[0].state });

    } catch (err) {
        console.error("Error loading state:", err);
        res.json({ state: null });
    }
});


// 3. Change game_started to false so that players can't join once already started
app.post("/api/sessions/:session_id/start", async (req, res) => {
    try {
        const sql = `
        UPDATE sessions
        SET game_started = true
        WHERE session_id = $1`;
        const result = await pool.query(sql, [req.params.session_id]);  // ← Fixed
        res.json({ ok: true });
    } catch (err) {
        console.error("Error changing start status:", err);
        res.status(500).json({ ok: false, error: "Failed to change game start" });
    }
});

// -----------------------------------------
// -------- WAITING ROOM FUNCTIONS ---------
// -----------------------------------------

// 1. Retrieve the current prompt
app.get("/api/sessions/:session_id/prompt_text", async (req, res) => {
    const sql = `
        SELECT current_prompt
        FROM sessions
        WHERE session_id = $1`;
    const result = await pool.query(sql, [req.params.session_id])
    res.json(result.rows[0])
})

//2. Poll to see if all responses have been received:
app.get("/api/sessions/:session_id/count_responses", async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) FILTER (WHERE response IS NOT NULL AND is_host = false) AS answered,
                COUNT(*) FILTER (WHERE is_host = false) AS total
            FROM players
            WHERE session_id = $1
        `;
        const result = await pool.query(sql, [req.params.session_id]);
        const answeredNum = Number(result.rows[0].answered);
        const totalNum = Number(result.rows[0].total);

        console.log(`Answered: ${answeredNum}, Total: ${totalNum}`);

        // We update state because it is the trigger to move to the response screen
        if (answeredNum === totalNum && totalNum > 0) {
            await pool.query(
                "UPDATE sessions SET state='results' WHERE session_id=$1",
                [req.params.session_id]
            );
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error("Error in /count_responses:", err);
        res.status(500).json({ error: "internal error" });
    }
});

// 3. POSTing replies from users:
app.post("/api/sessions/:session_id/respond/:player_id", async (req, res) => {
    const { response } = req.body;

    const sql = `
        UPDATE players
        SET response=$1
        WHERE player_id=$2 AND session_id=$3
    `;
    await pool.query(sql, [response, req.params.player_id, req.params.session_id]);

    res.json({ ok: true });
});


// -----------------------------------------
// ------- RESPONSE SCREEN FUNCTIONS -------
// -----------------------------------------

// 1. Retreive all the responses:
app.get("/api/sessions/:session_id/all_responses", async (req, res) => {
    try {
        const sql = `
        SELECT name, response
        FROM players
        WHERE session_id = $1
            AND is_host = false
            AND response IS NOT NULL
        ORDER BY player_id ASC`;
        const results = await pool.query(sql, [req.params.session_id])

        res.json(results.rows)
    }
    catch (err) {
        console.error("Error loading responses:", err);
        res.status(500).json({ error: "Failed to load responses" });
    }
})

// 2. Check if a player is the host:
app.get("/api/sessions/:player_id/check_host", async (req, res) => {
    const sql = `
        SELECT is_host
        FROM players
        WHERE player_id = $1`;

    const results = await pool.query(sql, [req.params.player_id])
    // if we get a hit:
    if (results.rows.length > 0) {
        res.json({ is_host: results.rows[0].is_host })
    } else {
        res.json({ is_host: false });
    }
})


// 3. Get the total prompt count for the session and the current index
app.get("/api/sessions/:sid/prompt_info", async (req, res) => {
    const promptCountRes = await pool.query(
        "SELECT COUNT(*) AS total FROM prompts WHERE session_id=$1",
        [req.params.sid]
    );

    const sessionRes = await pool.query(
        "SELECT current_prompt_index FROM sessions WHERE session_id=$1",
        [req.params.sid]
    );

    res.json({
        total: Number(promptCountRes.rows[0].total),
        index: Number(sessionRes.rows[0].current_prompt_index)
    });
});

// 3 Clear all the responses and set them to null:
app.post("/api/sessions/:session_id/clear_responses", async (req, res) => {
    try {
        const sessionId = req.params.session_id;
        const sql = `
            UPDATE players
            SET response = NULL
            WHERE session_id = $1
        `;

        await pool.query(sql, [sessionId]);

        res.json({ ok: true });
    } catch (err) {
        console.error("Error clearing responses:", err);
        res.status(500).json({ ok: false, error: "Failed to clear responses" });
    }
});



// 4. Advance the current_prompt_index 
app.post("/api/sessions/:session_id/advance_prompt", async (req, res) => {
    // 1. advance the index
    let updateSql = `
        UPDATE sessions
        SET current_prompt_index = current_prompt_index + 1
        WHERE session_id = $1
        RETURNING current_prompt_index
    `;
    const updated = await pool.query(updateSql, [req.params.session_id]);
    const newIndex = updated.rows[0].current_prompt_index;

    res.json({
        new_index: newIndex,
    });
});

// 5. Modify the session state:
app.post("/api/sessions/:session_id/modify_state", async (req, res) => {
    try {
        const state = req.body.state;

        let sql = `
        UPDATE sessions
        SET state = $1
        WHERE session_id = $2;
    `;
        const updated = await pool.query(sql, [state, req.params.session_id]);

        res.json({ ok: true });
    } catch (err) {
        console.error("Error POSTing state:", err);
        res.json({ ok: false });
    }
});


// -----------------------------------------
// ------------ ENDING THE GAME ------------
// -----------------------------------------

// 1. Clear the data, for the given session, when the lobby is over:
app.post("/api/sessions/:session_id/clear_all", async (req, res) => {
    try {
        // ON DELETE CASCADE will ennsure that the data gets removed from players and prompts as well
        const sql = `
      DELETE FROM sessions
      WHERE session_id = $1
      RETURNING session_id
    `;

        const result = await pool.query(sql, [req.params.session_id]);

        // make sure session exists
        if (result.rowCount === 0) {
            return res.status(404).json({ ok: false, error: "Session not found" });
        }

        res.json({
            ok: true,
            deleted_session: result.rows[0].session_id
        });

    } catch (err) {
        console.error("Error clearing session data:", err);
        res.status(500).json({ ok: false, error: "Server error clearing data" });
    }
});
