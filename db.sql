CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    join_code INT UNIQUE NOT NULL,
    player_limit INT NOT NULL,
    state VARCHAR(20) DEFAULT 'waiting',   -- waiting, responding, results
    current_prompt VARCHAR(500),                   -- holds the active prompt text
    current_prompt_index INT DEFAULT 0     -- for multi-round progression
);


CREATE TABLE players (
    player_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(session_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_host BOOLEAN DEFAULT false,                  -- TRUE for the host player
    response VARCHAR(2500)                          -- stores the player’s answer
);

CREATE TABLE prompts (
    prompt_id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(session_id) ON DELETE CASCADE,
    prompt_text VARCHAR(2500) NOT NULL,
    prompt_index INT NOT NULL
);


/* Drop table statements if needed:
DROP TABLE prompts;
DROP TABLE players;
DROP TABLE sessions;
*/

/* Delete all rows from each table:
TRUNCATE TABLE sessions, players, prompts CASCADE;
*/