let waterAmount = 0;
let sunAmount = 0;
let soilEnjoyment = true;

function startGame() {
    window.location.href = 'game.html'; 
}

function toggleTaskWindow() {
    let taskWindow = document.getElementById("taskWindow");

    console.log("Book clicked. Toggling Task Window.");

    taskWindow.style.display = (taskWindow.style.display === "block") ? "none" : "block";
}

function openShop(imageSrc) {
    let shopWindow = document.getElementById("shopWindow");
    let shopImage = document.getElementById("shopImage");

    // Debugging: Check image path
    console.log("Loading image:", "images/" + imageSrc);

    // Set the shop image source
    shopImage.src = "images/" + imageSrc;
    shopWindow.style.display = "block"; // Show the shop window
}

function closeShop() {
    document.getElementById("shopWindow").style.display = "none";
}
