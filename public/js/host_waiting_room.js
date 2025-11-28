document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const playerId = params.get("player_id");

    const promptBox = document.getElementById("prompt-box");
    const waitingEl = document.getElementById("waiting");

    if (!sessionId) {
        console.error("Missing session_id in URL");
        return;
    }


    // Retrieve the current prompt and put in its text
    async function loadPrompt() {

        try {
            const res = await fetch(`/api/sessions/${sessionId}/prompt_text`);
            if (!res.ok) {
                console.error("Failed to fetch session state");
                return;
            }

            const data = await res.json();

            if (data.current_prompt && promptBox) {
                promptBox.textContent = data.current_prompt;
            }

        } catch (err) {
            console.error("Error loading prompt:", err);
        }
    }

    // Then we need to see if all the responses have been retrieved and move the players to the next screen if they have
    async function pollResponses() {

        try {
            // 1. Load response counts
            const res = await fetch(`/api/sessions/${sessionId}/count_responses`);
            if (!res.ok) {
                console.error("Failed to fetch response counts");
                return;
            }

            const data = await res.json();
            console.log
            const answered = parseInt(data.answered, 10);
            const total = parseInt(data.total, 10);

            if (waitingEl) {
                waitingEl.textContent = `Responses received: ${answered} / ${total}`;
            }

            if (answered === total && total > 0) {
                waitingEl.textContent = "All responses received.";
            }

            // 2. Check the session state and move to reponse screen if all the responses are received
            const stateRes = await fetch(`/api/sessions/${sessionId}/state`);
            const stateData = await stateRes.json();

            if (stateData.state === "results") {
                // we need to include player ID in the query because only the host should be
                // able to see the next screen page
                window.location.href =
                    `/response_screen.html?session_id=${sessionId}&player_id=${playerId}`;
            }

        } catch (err) {
            console.error("Error checking responses:", err);
        }
    }


    // Initial load:
    loadPrompt();
    pollResponses();

    // Poll every 5 sec
    setInterval(loadPrompt, 5000);
    setInterval(pollResponses, 5000);
});
