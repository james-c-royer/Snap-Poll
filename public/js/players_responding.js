document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const playerId = params.get("player_id");

    const promptBox = document.getElementById("prompt");
    const submitButton = document.getElementById("submitButton");
    const responseInput = document.getElementById("response-input");

    let hasSubmitted = false;

    if (!sessionId || !playerId) {
        console.error("Missing session_id or player_id in URL");
        return;
    }

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

            // If player has submitted and state changed to 'results', redirect to response screen
            if (hasSubmitted && data.state === 'results') {
                window.location.href =
                    `/response_screen.html?session_id=${sessionId}&player_id=${playerId}`;
            }

        } catch (err) {
            console.error("Error loading prompt", err);
        }
    }

    // Load prompt immediately
    loadPrompt();
    // Poll every 3 sec so players see updated prompt if rounds progress
    setInterval(loadPrompt, 3000);


    // Submitting a response: 
    submitButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const response = responseInput.value.trim();
        if (!response) {
            alert("Please enter a response.");
            return;
        }

        try {
            const res = await fetch(`/api/sessions/${sessionId}/respond/${playerId}`, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ response })
            });

            if (!res.ok) {
                console.error("Failed to submit response", res.status);
                alert("Could not submit response.");
                return;
            }

            // Mark as submitted
            hasSubmitted = true;

            // Disable button and indicate success
            submitButton.disabled = true;
            submitButton.textContent = "Submitted!";

            // Disable input so they can't retype
            responseInput.disabled = true;

            // Start polling for state change to 'results'
            // (already handled by loadPrompt interval)

        } catch (err) {
            console.error("Error submitting response", err);
            alert("An error occurred while submitting your response.");
        }
    });

});