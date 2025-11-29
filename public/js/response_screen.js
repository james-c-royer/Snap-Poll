document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const playerId = params.get("player_id");
  const responsesContainer = document.getElementById('responses');
  const promptBox = document.getElementById('prompt');

  // populate the promptBox, uses same technique as in players_responding
  async function loadPrompt() {
    try {
      // load the prompt so the can respond to it
      const res = await fetch(`/api/sessions/${sessionId}/prompt_text`);
      if (!res.ok) {
        console.error("Failed to load prompt", res.status);
        return;
      }

      const data = await res.json();

      // Ensure prompt shows
      if (promptBox && data.current_prompt) {
        promptBox.textContent = data.current_prompt;
      }

    } catch (err) {
      console.error("Error loading prompt", err);
    }
  }

  // Get all the responses and create cards for them
  async function getResponses() {


    const res = await fetch(`/api/sessions/${sessionId}/all_responses`)
    const data = await res.json(); // this is an array of name, and response

    // clear it so when we call set reponses it doesn't enter them multiple times
    responsesContainer.innerHTML = "";


    data.forEach((response, index) => {
      const card = document.createElement('div');
      card.className = 'response-card';

      const nameEl = document.createElement('div');
      nameEl.className = 'player-name';
      nameEl.textContent = response.name;

      const responseEl = document.createElement('div');
      responseEl.className = 'response-text';
      responseEl.textContent = response.response;

      card.appendChild(nameEl);
      card.appendChild(responseEl);
      responsesContainer.appendChild(card);

      if (index === data.length - 1) {
        createNextButton();
      }
    })
  }



  // We need to check if the player is a host and give them the "Next" button if they are
  async function createNextButton() {
    const res = await fetch(`/api/sessions/${playerId}/check_host`)
    const data = await res.json();

    if (data.is_host === false || !data.is_host) {
      return;
    } else {
      const nextButton = document.createElement("button");
      nextButton.className = "btn btn-warning btn-lg";
      nextButton.id = "next-button";
      nextButton.textContent = "Next Prompt";

      responsesContainer.appendChild(nextButton);

      nextButton.addEventListener("click", async () => {
        // 1. first, grab the prompt count and the prompt count and the prompt index
        const infoRes = await fetch(`/api/sessions/${sessionId}/prompt_info`);
        const info = await infoRes.json();

        // 2. if we ARE on the next prompt, go to the end screen and change state to completed
        if (info.index >= info.total - 1) {
          const change_state = await fetch(`/api/sessions/${sessionId}/modify_state`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              state: "completed"
            })
          })

          window.location.href = `/end_screen.html?session_id=${sessionId}&player_id=${playerId}`;
          return;
        }

        // 3. if we are NOT, then we need to advance the prompt index
        const advance_prompt = await fetch(`/api/sessions/${sessionId}/advance_prompt`, {
          method: "POST"
        });

        // 4. Change the response of all the players to null
        const clear_responses = await fetch(`/api/sessions/${sessionId}/clear_responses`, {
          method: "POST"
        })

        // 5. Set the new prompt:
        const new_prompt = await fetch(`/api/sessions/${sessionId}/set_current_prompt`, {
          method: "POST"
        })

        // 6. Change the state to "responding"
        const change_state = await fetch(`/api/sessions/${sessionId}/modify_state`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            state: "responding"
          })
        })

        // 7. Send the host to host_waiting_room
        window.location.href = `/host_waiting_room.html?session_id=${sessionId}&player_id=${playerId}`;
      })
    }
  }

  async function checkState() {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/state`);
      if (!res.ok) return;

      const data = await res.json();

      // When host moves to the next prompt, state becomes "responding"
      if (data.state === "responding") {

        // Redirect player to response page
        window.location.href = `/player_responding.html?session_id=${sessionId}&player_id=${playerId}`;
      } else if (data.state === "completed") {
        window.location.href = `/end_screen.html?session_id=${sessionId}&player_id=${playerId}`;
      }

    } catch (err) {
      console.error("Error checking state:", err);
    }
  }
  loadPrompt();
  getResponses();
  setInterval(checkState, 3000);
})