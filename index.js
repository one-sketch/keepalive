let waterAmount = 0;
let sunAmount = 0;
let soilEnjoyment = true;

let tasks = {}; // Store tasks and their timers
let points = 0;


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


// Toggle Task Window
function toggleTaskWindow() {
    let taskWindow = document.getElementById("taskWindow");
    taskWindow.style.display = (taskWindow.style.display === "block") ? "none" : "block";
}

// Add Task
function addTask() {
    let taskInput = document.getElementById("newTask");
    let taskText = taskInput.value.trim();
    
    if (taskText === "") return; // Prevent empty tasks

    let taskId = "task-" + Date.now(); // Unique ID for task

    // Create Task Element
    let li = document.createElement("li");
    li.classList.add("a_task");
    li.innerHTML = `
        ${taskText} 
        <input type="checkbox" id="${taskId}" onclick="completeTask('${taskId}')">
        <span class="timer" id="timer-${taskId}">30:00</span>
    `;

    document.getElementById("taskList").appendChild(li);
    
    // Start Timer
    tasks[taskId] = {
        startTime: Date.now(),
        timerInterval: startTimer(taskId)
    };

    taskInput.value = ""; // Clear input field
}

// Start 30-Minute Timer
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

// Complete Task & Award Points
function completeTask(taskId) {
    let checkBox = document.getElementById(taskId);
    if (checkBox.checked) {
        let taskTime = Date.now() - tasks[taskId].startTime;
        let timeLeft = 30 * 60 * 1000 - taskTime; // Convert to milliseconds

        if (timeLeft > 0) {
            points += 10; // Base points for completing on time
            waterAmount += 1; // Increase water
            sunAmount += 1; // Increase sun exposure

            if (soilEnjoyment) {
                points += 5; // Bonus points if soilEnjoyment is true
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

// 24-Hour Clock Function
function updateClock() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    let timeString = `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    document.getElementById("clock").innerText = "Current Time: " + timeString;
}

setInterval(updateClock, 1000); // Update clock every second
