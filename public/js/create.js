document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("subBtn");
  const playerCount = document.getElementById("player-count");
  const promptCount = document.getElementById("prompt-count");
  const listGroup = document.querySelector(".list-group.list-group-flush")

  // function to be called to validate the number of prompts and
  function validateInputs() {
    const numPrompts = parseInt(promptCount.value, 10);
    const numPlayers = parseInt(playerCount.value, 10);

    return (
      // we want 
      !isNaN(numPrompts) && numPrompts >= 1 && numPrompts <= 9 &&
      !isNaN(numPlayers) && numPlayers >= 1 && numPlayers <= 9
    );
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
    let num = parseInt(promptCount.value, 10);
    
    // Create inputs for prompts
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
        btn.addEventListener("click", function () {
          const targetURL = "lobby/index.html";
          window.location.href = targetURL;
        });
        li.appendChild(btn);
        listGroup.appendChild(li);
      }
    }
  }

  
});