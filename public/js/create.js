document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("subBtn");
  const playerCount = document.getElementById("player-count");
  const promptCount = document.getElementById("promptCount");
  const listGroup = document.querySelector(".list-group.list-group-flush")

  // function to be called to validate the number of prompts and
  function validateInputs() {
    const numPrompts = parseInt(promptCount.value, 10);
    const numPlayers = parseInt(playerCount.value, 10);

    if (numPlayers > 8 || numPlayers < 2) {
      return false;
    } else if (numPrompts > 8 || numPrompts < 1) {
      return false;
    } else {
      return true;
    }
  }

  submitBtn.addEventListener("click", createPrompts);


  function createPrompts() {

    // validate the inputs first
    if (!validateInputs()) {
      alert("Player count must be between 2-8 and prompt count must be 1-9.");
      return;
    } else {
      // Disable the first button so users can't re-trigger
      submitBtn.disabled = true;
    }


    // get the total number of prompts that need to be created
    const num = parseInt(promptCount.value, 10);

    // Create inputs for prompts
    for (let i = 1; i <= num; i++) {
      let li = document.createElement("li");
      li.classList.add("list-group-item");

      const promptInput = document.createElement("input");
      promptInput.type = "text";
      promptInput.maxLength = 100;

      promptInput.classList.add("prompt-input");

      // We will be sending the prompts to the DB so they need unique IDs
      promptInput.id = `prompt-${i}`
      promptInput.placeholder = `Prompt ${i}`;

      li.appendChild(promptInput);
      listGroup.appendChild(li);

      // create start button if we're at the final element
      if (i === num) {
        li = document.createElement("li");
        li.classList.add("list-group-item");

        const btn = document.createElement("button");
        btn.type = "submit";
        btn.id = "finalizeBtn"
        btn.classList.add("btn", "btn-warning");
        btn.textContent = "Finalize prompt"
        btn.addEventListener("click", createSession);
        li.appendChild(btn);
        listGroup.appendChild(li);
      }
    }
  }
  async function createSession() {
    // numbers that we will send to the backend
    const numPrompts = parseInt(promptCount.value, 10);
    const playerLimit = parseInt(playerCount.value, 10);

    // error check that prompts were filled out
    const promptInputs = document.querySelectorAll('input[id^="prompt-"]'); // select all input prompts
    let sesh_prompts = [];

    // store the prompts inside prompts array
    promptInputs.forEach(input => {
      sesh_prompts.push(input.value.trim()); // trim cuts off extra spaces on the end
    })

    // make sure the prompts aren't empty
    for (i = 0; i < sesh_prompts.length; i++) {
      if (sesh_prompts[i].length === 0) {
        alert("Fill out all prompts before continuing.");
        return;
      }
    }

    try {

      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          player_limit: playerLimit,
          prompts: sesh_prompts
        })
      });

      // failure message
      if (!res.ok) {
        alert("Unable to create session");
        return;
      }

      const data = await res.json();
      /* data is the what is generated in the app.post (from res.json) function. It will look something like:
      {
      session_id: x,
      player_id: y,
      join_code: xxxx
      }
      */

      // debugging for myself
      console.log(data);

      // once we have that data, we can send the player to the their custom create lobby screen
      window.location.href =
        `/lobby_created.html?session_id=${data.session_id}&player_id=${data.player_id}`;

    } catch (err) {
      console.error(err);
      alert("Error creating session");
    }
  }
});