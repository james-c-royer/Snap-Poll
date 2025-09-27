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

    buttonsDiv.appendChild(input);
    joinbtn.disabled = true;
  }
});