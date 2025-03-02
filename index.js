function startGame() {
    window.location.href = 'game.html'; 
}

function toggleTaskWindow() {
    let taskWindow = document.getElementById("taskWindow");
    taskWindow.style.display = (taskWindow.style.display === "block") ? "none" : "block";
}
