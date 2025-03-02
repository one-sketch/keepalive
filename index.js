function startGame() {
    window.location.href = 'game.html'; 
}

function toggleTaskWindow() {
    let taskWindow = document.getElementById("taskWindow");
    taskWindow.style.display = (taskWindow.style.display === "block") ? "none" : "block";
}

function openShop(imageSrc) {
    let shopWindow = document.getElementById("shopWindow");
    let shopImage = document.getElementById("shopImage");
    
    shopImage.src = "images/" + imageSrc; // Set the shop image
    shopWindow.style.display = "block"; // Show the shop window
}

function closeShop() {
    document.getElementById("shopWindow").style.display = "none";
}
