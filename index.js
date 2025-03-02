// Load from local storage or set default values
let lastWatered = parseInt(localStorage.getItem("lastWatered")) || Date.now();
let lastSoilCheck = parseInt(localStorage.getItem("lastSoilCheck")) || Date.now();
let gameStart = parseInt(localStorage.getItem("gameStart")) || Date.now();
let selectedBulb = localStorage.getItem("selectedBulb") || "fluorescent"; // Default bulb type

// Environmental Variables (Backend-Only)
let waterAmount = parseInt(localStorage.getItem("waterAmount")) || 0;
let sunAmount = parseInt(localStorage.getItem("sunAmount")) || 0;
let soilEnjoyment = localStorage.getItem("soilEnjoyment") !== "false"; // Defaults to true

// Time Configurations
const waterInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const soilCheckInterval = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
const gameCheckInterval = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

// Elements
const dougImage = document.getElementById("dougImage");
const messageBox = document.getElementById("statusMessage");

let tasks = {}; // Store tasks and their timers
let points = 0;

// **Start Game**
function startGame() {
    window.location.href = 'game.html'; 
}

// **Open/Close Task Window**
function toggleTaskWindow() {
    let taskWindow = document.getElementById("taskWindow");
    taskWindow.style.display = (taskWindow.style.display === "block") ? "none" : "block";
}

// **Shop System**
function openShop(imageSrc) {
    let shopWindow = document.getElementById("shopWindow");
    let shopImage = document.getElementById("shopImage");

    console.log("Loading image:", "images/" + imageSrc);
    
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

// **Task System**
function addTask() {
    let taskInput = document.getElementById("newTask");
    let taskText = taskInput.value.trim();
    
    if (taskText === "") return; // Prevent empty tasks

    let taskId = "task-" + Date.now(); // Unique ID for task

    let li = document.createElement("li");
    li.classList.add("a_task");
    li.innerHTML = `
        ${taskText} 
        <input type="checkbox" id="${taskId}" onclick="completeTask('${taskId}')">
        <span class="timer" id="timer-${taskId}">30:00</span>
    `;

    document.getElementById("taskList").appendChild(li);
    
    tasks[taskId] = {
        startTime: Date.now(),
        timerInterval: startTimer(taskId)
    };

    taskInput.value = ""; // Clear input field
}

// **30-Minute Timer for Task Completion**
function startTimer(taskId) {
    let timeLeft = 30 * 60; // 30 minutes in seconds
    let timerDisplay = document.getElementById(`timer-${taskId}`);

    return setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(tasks[taskId].timerInterval);
            timerDisplay.innerText = "EXPIRED";
        } else {
            let minutes = Math.floor(timeLeft / 60);
            let seconds = timeLeft % 60;
            timerDisplay.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
            timeLeft--;
        }
    }, 1000);
}

// **Complete Task & Award Points**
function completeTask(taskId) {
    let checkBox = document.getElementById(taskId);
    if (checkBox.checked) {
        let taskTime = Date.now() - tasks[taskId].startTime;
        let timeLeft = 30 * 60 * 1000 - taskTime; // Convert to milliseconds

        if (timeLeft > 0) {
            points += 10; // Base points
            waterAmount += 1;
            sunAmount += 1;

            if (soilEnjoyment) {
                points += 5; // Bonus points
                alert(`Task completed on time! +10 points (+5 soil bonus). Total: ${points}`);
            } else {
                alert(`Task completed on time! +10 points. Total: ${points}`);
            }
        } else {
            alert("Time expired! No points awarded.");
        }

        clearInterval(tasks[taskId].timerInterval); // Stop the timer
        delete tasks[taskId]; // Remove task from tracking
    }
}

// **24-Hour Clock**
function updateClock() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    let timeString = `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    document.getElementById("clock").innerText = "Current Time: " + timeString;
}
setInterval(updateClock, 1000); // Update clock every second

// **Doug’s Life System (Runs in Background)**
function updateDougState() {
    let now = Date.now();

    console.log("Checking Doug's State...");
    console.log("Water Amount:", waterAmount);
    console.log("Sun Amount:", sunAmount);
    console.log("Soil Enjoyment:", soilEnjoyment);

    let correctBulb = (selectedBulb === "fluorescent" || selectedBulb === "led" || selectedBulb === "ultraviolet");
    let newGif = "images/Happy_Bud.gif"; // Default (Happy Bud)

    // **Sad Bud Condition (Water < 3, Sunlight ≥ 3, Soil Good)**
    if (waterAmount < 3 && sunAmount >= 3 && soilEnjoyment) {
        newGif = "images/Sad_Bud.gif";
    }
    // **Sad Sprout Condition (Water ≥ 3 but Sun < 3)**
    else if (waterAmount >= 3 && sunAmount < 3 && soilEnjoyment) {
        newGif = "images/Sad_Sprout.gif";
    }
    // **Sad Bloom Condition (Water & Sunlight okay, but Bad Soil)**
    else if (waterAmount >= 3 && sunAmount >= 3 && !soilEnjoyment) {
        newGif = "images/Sad_Bloom.gif";
    }
    // **Happy Sprout Condition**
    else if (waterAmount >= 6 && sunAmount >= 6 && soilEnjoyment && correctBulb) {
        newGif = "images/Happy_Sprout.gif";
    }
    // **Happy Bloom Condition**
    else if (waterAmount >= 9 && sunAmount >= 9 && soilEnjoyment && correctBulb) {
        newGif = "images/Happy_Bloom.gif";
    }

    console.log("Updating Doug to:", newGif);
    dougImage.src = newGif + "?" + new Date().getTime();
}

    // Save game state
    localStorage.setItem("waterAmount", waterAmount);
    localStorage.setItem("sunAmount", sunAmount);
    localStorage.setItem("soilEnjoyment", soilEnjoyment);



// **Trigger Watering**
function waterDoug() {
    lastWatered = Date.now();
    waterAmount += 1;
    localStorage.setItem("lastWatered", lastWatered);
    localStorage.setItem("waterAmount", waterAmount);
}

// **Trigger Soil Check**
function checkSoil() {
    lastSoilCheck = Date.now();
    soilEnjoyment = Math.random() > 0.2; // 80% chance soil is good
    localStorage.setItem("lastSoilCheck", lastSoilCheck);
    localStorage.setItem("soilEnjoyment", soilEnjoyment);
}

// **Change Light Bulb**
function changeBulb(bulbType) {
    selectedBulb = bulbType;
    sunAmount += 1;
    localStorage.setItem("selectedBulb", selectedBulb);
    localStorage.setItem("sunAmount", sunAmount);
}

// **Game Loop**
setInterval(updateDougState, 60 * 1000);


function openShopWindow(imageSrc) {
    let shopWindow = document.getElementById("shopWindow");
    let shopImage = document.getElementById("shopImage");

    console.log("Opening Shop:", "images/" + imageSrc);

    if (shopImage && shopWindow) {
        shopImage.src = "images/" + imageSrc;
        shopWindow.style.display = "block"; // Show the shop window
    } else {
        console.error("Shop window or image not found!");
    }
}

function closeShopWindow() {
    document.getElementById("shopWindow").style.display = "none";
}
