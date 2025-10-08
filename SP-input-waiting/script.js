document.addEventListener('DOMContentLoaded', () => {
    // USERNAME INPUT
    const usernameSubmission = document.getElementById('username-submission');
    const usernameInput = document.getElementById('username-input');

    // WAITING ROOM
    const waitingRoom = document.getElementById('waiting-room');
    const displayUsername = document.getElementById('display-username');

    usernameSubmission.addEventListener('submit', function(event) {
        // USERNAME INPUT
        event.preventDefault();
        const username = usernameInput.value;
        alert('Username submitted: ' + username);
        console.log('Username submitted:', username);
        usernameInput.value = '';

        // WAITING ROOM
        usernameSubmission.style.display = 'none';
        displayUsername.textContent = 'Username: ' + username;
        waitingRoom.style.display = 'block';
        console.log(username + " has entered the waiting room.");
        event.preventDefault();
    });
});
