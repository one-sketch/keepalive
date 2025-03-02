let waterAmount = 0;
let sunAmount = 0;
let soilEnjoyment = true;

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

    // Debugging: Check image path in Console
    console.log("Loading image:", "images/" + imageSrc);

    // Ensure the shop window is set up correctly
    if (shopImage && shopWindow) {
        shopImage.src = "images/" + imageSrc;
        shopWindow.style.display = "block"; // Show the shop window
    } else {
        console.error("Shop window or image not found!");
    }
}

function closeShop() {
    document.getElementById("shopWindow").style.display = "none";
}
