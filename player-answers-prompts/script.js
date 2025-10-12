document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.getElementById('submitButton');
    const responseInput = document.getElementById('response-input');

    submitButton.addEventListener('click', function (event) {
        event.preventDefault();
        const response = responseInput.value;
        console.log('Response submitted:', response);
        responseInput.value = '';

        const newLoc = "../response-screen.html";
        window.location.href = newLoc;
    });
});