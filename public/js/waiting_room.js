document.addEventListener('DOMContentLoaded', () => {
    // WAITING ROOM
    const waitingRoom = document.getElementById('waiting-room');
    
    waitingRoom.addEventListener('submit', function(event) {
        waitingRoom.style.display = 'block';
        event.preventDefault();
    });
});
