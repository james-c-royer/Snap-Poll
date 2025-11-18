CREATE TABLE session (
    session_id    SERIAL PRIMARY KEY,
    player_limit  INT NOT NULL,
    join_code     INT UNIQUE NOT NULL
);

CREATE TABLE player (
    player_id SERIAL PRIMARY KEY,
    player_index INT NOT NULL CHECK (player_index BETWEEN 1 AND 9),
    session_id INT NOT NULL REFERENCES session(session_id) ON DELETE CASCADE,
    UNIQUE (player_index, session_id)
);

CREATE TABLE host (
    host_id INT PRIMARY KEY REFERENCES player(player_id) ON DELETE CASCADE,
    session_id INT UNIQUE NOT NULL REFERENCES session(session_id) ON DELETE CASCADE
);

CREATE TABLE prompt (
    prompt_id SERIAL PRIMARY KEY,
    prompt_index INT NOT NULL CHECK (prompt_index BETWEEN 1 AND 9),
    prompt_content VARCHAR(500) NOT NULL,
    session_id INT NOT NULL REFERENCES session(session_id) ON DELETE CASCADE,
    UNIQUE (prompt_id, prompt_index)
);

CREATE TABLE response (
    response_id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES player(player_id) ON DELETE CASCADE,
    response_content VARCHAR(500),
    prompt_id INT NOT NULL REFERENCES prompt(prompt_id) ON DELETE CASCADE,
	-- note that session_id here is redundant, but I am explicitly keeping it for ease of use
    session_id INT NOT NULL REFERENCES session(session_id) ON DELETE CASCADE,
    UNIQUE (player_id, prompt_id)
);