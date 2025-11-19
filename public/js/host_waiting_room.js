document.addEventListener('DOMContentLoaded', () => {
    const mockResponses = [
        "All Responses Received"
    ];

    const responsesEl = document.getElementById('responses');
    let i = 0;

    function addMockResponse() {
        if (i < mockResponses.length) {
            const li = document.createElement('li');
            li.textContent = mockResponses[i];
            responsesEl.appendChild(li);
            i++;
            setTimeout(addMockResponse, 2000);
        } else {
            document.getElementById('waiting').textContent = 'All responses received.';
        }
    }

    setTimeout(addMockResponse, 2000);
});
