document.addEventListener("DOMContentLoaded", () => {
  const buttonsDiv = document.querySelector(".buttons")
  const joinbtn = document.getElementById("join-btn")

  joinbtn.addEventListener("click", joinCode);

  function joinCode() {
    //create a new input element
    const input = document.createElement("input");
    //assign the input the following values
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = "4";
    input.id = "join-code";
    input.pattern = "\d*"; // this tells it to only validate digits
    input.placeholder = "Enter your 4-digit code";

    const submit = document.createElement("button")
    submit.id = "subBtn";
    submit.textContent = "Submit code and username"
    submit.className = "btn btn-primary btn-lg"

    buttonsDiv.appendChild(input);
    buttonsDiv.appendChild(submit);


    joinbtn.disabled = true;

    subBtn.addEventListener("click", () => {
      const nextPage = "/player-waiting-room/index.html";

      window.location.href = nextPage;
    })
  }
});