document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("subBtn");
  const playerCount = document.getElementById("player-count");
  const promptCount = document.getElementById("prompt-count");
  const listGroup = document.querySelector(".list-group.list-group-flush")

  submitBtn.addEventListener("click", createPrompts);

  function createPrompts() {
    // get the total number of prompts that need to be created
    let num = parseInt(promptCount.value, 10);

    // validate that int is within the acceptable range. Should probably also check for NaN issues eventually 
    if (num > 9 || num < 1 || isNaN(num)) {
      alert("Please enter a number 1-9 for your prompt count")
      return;
    }
    else {
      submitBtn.disabled = true
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
        btn.id = "subBtn"
        btn.classList.add("btn", "btn-warning");
        btn.textContent = "Finalize prompt"

        li.appendChild(btn);
        listGroup.appendChild(li);
      }
    }
  }
});