document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const playerId = params.get("player_id"); // host id

  const lobbyCodeContainer = document.getElementById("lobby-code");
  const playersContainer = document.querySelector(".players");

  async function loadLobbyElements() {

    // 1. Populate the join code:
    const lobby_code_data = await fetch(`/api/sessions/${sessionId}/join_code`);
    const lobby_code = await lobby_code_data.json();
    lobbyCodeContainer.textContent = lobby_code.join_code;

    // 2. Populate the players
    const getPlayers = await fetch(`/api/sessions/${sessionId}/players`)
    const players = await getPlayers.json();

    // need to clear it first so that we aren't adding multiple of the same players
    // every time that loadLobbyElements is called
    playersContainer.innerHTML = "";
    // create the element
    players.forEach((player, i) => {
      const el = document.createElement("p");
      el.className = "players-text";
      el.innerText = `${i + 1}: ${player.name}`;
      playersContainer.appendChild(el);
    })
  }

  loadLobbyElements();
  // run the loadLobby function every 5 seconds to get updated players in the lobby
  setInterval(loadLobbyElements, 5000);

  /* Next, we need to determine the behavior of start game. When Start game is clicked:
     1. Host needs to be sent to host_waiting_room for their specific session_id
     2. Players need to be sent to players_responding for their session_id
  */
  const startGameButton = document.getElementById("start-game-button");
  startGameButton.addEventListener("click", startGame);

  async function startGame() {
    // sets the current_prompt and changes the state to responding
    let res = await fetch(`/api/sessions/${sessionId}/set_current_prompt`, {
      method: "POST"
    });

    const data = await res.json();

    // update the game_started bool to stop more players from joining
    res = await fetch(`/api/sessions/${sessionId}/start`, {
      method: "POST"
    })


    // host starts round 1 by retrieving the next prompt
    window.location.href = `/host_waiting_room.html?session_id=${sessionId}&player_id=${playerId}`;
  }
});
