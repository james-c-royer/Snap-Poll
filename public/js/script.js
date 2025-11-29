document.addEventListener("DOMContentLoaded", () => {
  const buttonsDiv = document.querySelector(".buttons")
  const joinbtn = document.getElementById("join-btn")

  joinbtn.addEventListener("click", joinElements);

  function joinElements() {
    //create a new input element
    const input = document.createElement("input");
    //assign the input the following values
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = "4";
    input.id = "join-code";
    input.pattern = "\d*"; // this tells it to only validate digits
    input.placeholder = "Enter your 4-digit code";

    // Player name input
    const nameInput = document.createElement("input");
    // new element
    nameInput.type = "text";
    nameInput.id = "username-input";
    nameInput.placeholder = "Enter your name";
    nameInput.className = "form-control mb-2";
    nameInput.maxLength = "10";

    // create a submission button
    const submit = document.createElement("button")
    submit.id = "subBtn";
    submit.textContent = "Submit code and username"
    submit.className = "btn btn-primary btn-lg"

    buttonsDiv.appendChild(input);
    buttonsDiv.appendChild(nameInput)
    buttonsDiv.appendChild(submit);


    joinbtn.disabled = true;

    subBtn.addEventListener("click", joinLobby)
  }

  // handles all events that precede joining a lobby:
  // 1. validating join code
  // 2. inserting the player
  // 3. redirecting screen to lobby
  async function joinLobby() {
    // First, we need to get the join code input by the player:
    const codeInput = document.getElementById("join-code");
    const codeStr = codeInput.value.trim();
    const joinCode = parseInt(codeStr, 10);

    if (!codeStr) {
      alert("Please enter a lobby code.");
      return;
    } else if (isNaN(joinCode)) {
      alert("Lobby code must be a number.");
      return;
    }

    // then, check if the join code is valid:
    const check_session = await fetch(`/api/sessions/${joinCode}`)
    const session = await check_session.json();

    if (!session) {
      alert("No session exists with that join code!")
      return;
    }

    // if it is we can create a new player
    else {

      try {
        let name = document.getElementById("player-name").value.trim();

        const add_player = await fetch(`/api/create_player`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ join_code: joinCode, name })
        });

        if (!add_player.ok) {
          alert("Could not join session. Check your join code.");
          return;
        }

        const data = await add_player.json();
        // Assumes { session_id, player_id }
        console.log("Joined session:", data);

        const nextPage =
          `/waiting_room.html?session_id=${data.session_id}&player_id=${data.player_id}`;

        window.location.href = nextPage;

      } catch (err) {
        console.error("Join failed", err);
        alert("An error occurred while joining the game.");
      }
    }
  }

});