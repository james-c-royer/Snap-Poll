document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const playerId = params.get("player_id");

    if (!sessionId || !playerId) {
        console.error("Missing session_id or player_id in URL");
        return;
    }

    async function checkState() {
        try {
            const res = await fetch(`/api/sessions/${sessionId}/state`);
            if (!res.ok) return;

            const data = await res.json();

            // When host starts the game, state becomes "responding"
            if (data.state === "responding") {

                // Redirect player to response page
                window.location.href =
                    `/player_responding.html?session_id=${sessionId}&player_id=${playerId}`;
            }
            if (data.state === "results") {
                window.location.href =
                    `/response_screen.html?session_id=${sessionId}`;
            }

        } catch (err) {
            console.error("Error checking state:", err);
        }
    }

    // Check for updated state every 3 seconds
    setInterval(checkState, 3000);
});

