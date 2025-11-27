document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const playerId = params.get("player_id"); // host id

  const lobbyCodeContainer = document.getElementById("lobby-code");
  const playersContainer = document.querySelector(".players");

  async function loadLobbyElements() {
    const lobby_code_data = await fetch(`/api/sessions/${sessionId}/join_code`);

    const lobby_code = await lobby_code_data.json();
    lobbyCodeContainer.textContent = lobby_code.join_code;
  }

  loadLobbyElements();
  // run the loadLobby function every 5 seconds to get updated players in the lobby
  setInterval(loadLobbyElements, 5000);
});
