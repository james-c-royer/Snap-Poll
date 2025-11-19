document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("subBtn");
  const playerCount = document.getElementById("player-count");
  const promptCount = document.getElementById("prompt-count");
  const listGroup = document.querySelector(".list-group.list-group-flush")

  submitBtn.addEventListener("click", createPrompts);

  function validateInputs() {
    let num = parseInt(promptCount.value, 10);
    let numOfPlayers = parseInt(playerCount.value, 10)

    if (num > 9 || num < 1 || isNaN(num)) {
      return false;
    }

    if (numOfPlayers > 9 || numOfPlayers < 2 || isNaN(numOfPlayers)) {
      return false;
    }

    return true;
  }

  function createPrompts() {
    // get the total number of prompts that need to be created
    let num = parseInt(promptCount.value, 10);

    // validate that int is within the acceptable range. Should probably also check for NaN issues eventually 
    if (!validateInputs()) {
      alert("Please enter a number 1-8 for your prompt count and a number 2-8 for your player count")
      return;
    }
    else {
      submitBtn.disabled = true;
      playerCount.disabled = true;
      promptCount.disabled = true;
    }

    for (let i = 1; i <= num; i++) {
      let li = document.createElement("li");
      li.classList.add("list-group-item");

      const promptInput = document.createElement("input");
      promptInput.type = "text";
      promptInput.maxLength = 100;
      promptInput.classList.add("prompt-input");
      promptInput.placeholder = `Prompt ${i}`;

      li.appendChild(promptInput);
      listGroup.appendChild(li);

      if (i === num) {
        li = document.createElement("li");
        li.classList.add("list-group-item");

        const btn = document.createElement("button");
        btn.type = "submit";
        btn.id = "finalizeBtn"
        btn.classList.add("btn", "btn-warning");
        btn.textContent = "Finalize prompt"
        btn.addEventListener("click", createGameEvents());
        li.appendChild(btn);
        listGroup.appendChild(li);
      }
    }
  }

  function createGameEvents() {
    const express = require("express");
    const app = express();
    const Pool = require('pg').Pool
    // we need to do several things when we click create game:
    // 1. We need to send the player limit to the DB and the session_id and join_code will be created automatically
    const code = generateUniqueJoinCode();
    app.post("/api/create", (req, res) => {
      let pool = new Pool({
        player_limit: parseInt(playerCount.value, 10),
        join_code: code // this a 4 digit number (at least 1000)
      })
    }
    )
  }

  async function generateUniqueJoinCode() {
    let code;
    let exists = true;


    while (exists) {
      // we create a random 4 digit number
      code = Math.floor(1000 + Math.random() * 9000)

      // then we check if that code exists in the DB already:
      // the query (returns a 1 for each row that matches the where condition)
      const sql = "SELECT 1 FROM sessions WHERE join_code = $1";
      // result will be an object containing the rows where the join code is our random code 
      const result = await pool.query(sql, [code]);

      //if there are more than 0 rows, this will be true (so the loop runs again)
      exists = result.rows.length > 0;
    }

    return code;

  }
});