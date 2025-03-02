// Load from local storage or set default values
let lastWatered = parseInt(localStorage.getItem("lastWatered")) || Date.now();
let lastSoilCheck = parseInt(localStorage.getItem("lastSoilCheck")) || Date.now();
let gameStart = parseInt(localStorage.getItem("gameStart")) || Date.now();
let selectedBulb = localStorage.getItem("selectedBulb") || "fluorescent"; 

// Environmental Variables
let waterAmount = isNaN(parseInt(localStorage.getItem("waterAmount"))) ? 0 : parseInt(localStorage.getItem("waterAmount"));
let sunAmount = isNaN(parseInt(localStorage.getItem("sunAmount"))) ? 0 : parseInt(localStorage.getItem("sunAmount"));
let soilEnjoyment = localStorage.getItem("soilEnjoyment") !== "false"; 

// Time Configurations
const waterInterval = 6 * 60 * 60 * 1000; 
const soilCheckInterval = 2 * 24 * 60 * 60 * 1000; 
const gameCheckInterval = 3 * 24 * 60 * 60 * 1000; 

// Select Image Element
const dougImage = document.getElementById("dougImage");
if (!dougImage) console.error("Error: dougImage not found in the DOM!");

const messageBox = document.getElementById("statusMessage");

// Points tracking
let points = parseInt(localStorage.getItem("points")) || 0;

// **Start Game**
function startGame() {
    window.location.href = 'game.html'; 
}

// **Open/Close Task Window**
function toggleTaskWindow() {
    let taskWindow = document.getElementById("taskWindow");
    if (taskWindow) {
        taskWindow.style.display = (taskWindow.style.display === "block") ? "none" : "block";
    } else {
        console.error("Task window not found in the DOM!");
    }
}

// **Shop System - Consolidated functions**
function openShopWindow(imageSrc) {
    let shopWindow = document.getElementById("shopWindow");
    let shopImage = document.getElementById("shopImage");

    console.log("Opening Shop:", "images/" + imageSrc); // Debugging Log

    if (shopImage && shopWindow) {
        shopImage.src = "images/" + imageSrc + "?" + new Date().getTime(); // Force image refresh
        shopWindow.style.display = "block"; // Show the shop window
    } else {
        console.error("Shop window or image not found!");
    }
}

// Ensure this function exists
function closeShopWindow() {
    document.getElementById("shopWindow").style.display = "none";
}

let tasks = {}; // Store tasks and their timers

// Function to add a new task
function addTask() {
    let taskInput = document.getElementById("newTask");
    let durationInput = document.getElementById("taskDuration");
    
    if (!taskInput || !durationInput) {
        console.error("Task input elements not found!");
        return;
    }
    
    let taskText = taskInput.value.trim();
    let duration = parseInt(durationInput.value, 10);

    if (taskText === "" || isNaN(duration) || duration <= 0) {
        alert("Please enter a valid task and duration!");
        return;
    }

    let taskId = "task-" + Date.now(); // Unique ID for task

    // Create Task Element in UI first - IMPORTANT: Create UI before starting timers
    let taskList = document.getElementById("taskList");
    if (!taskList) {
        console.error("Task list element not found!");
        return;
    }
    
    let li = document.createElement("li");
    li.classList.add("a_task");
    li.innerHTML = `
        ${taskText} 
        <span class="timer" id="timer-${taskId}">${duration}:00</span>
        <button onclick="deleteTask('${taskId}')">🗑️</button>
        <input type="checkbox" id="${taskId}" onclick="completeTask('${taskId}')">
    `;
    taskList.appendChild(li);

    // Now create task object AFTER UI elements exist
    tasks[taskId] = {
        text: taskText,
        duration: duration * 60, // Convert minutes to seconds
        startTime: Date.now(),
        completed: false,
        timerInterval: null, 
        completionInterval: null
    };

    console.log("Task added:", tasks[taskId]);

    // Now start the timer (DOM elements are guaranteed to exist)
    tasks[taskId].timerInterval = startTaskTimer(taskId);

    // Clear input fields
    taskInput.value = "";
    durationInput.value = "";
    
    // Save tasks to localStorage
    saveTasksToStorage();
}

// Save tasks to localStorage
function saveTasksToStorage() {
    // Create a simplified version of tasks without intervals (can't be serialized)
    const tasksToSave = {};
    for (const id in tasks) {
        tasksToSave[id] = {
            text: tasks[id].text,
            duration: tasks[id].duration,
            startTime: tasks[id].startTime,
            completed: tasks[id].completed
        };
    }
    localStorage.setItem("tasks", JSON.stringify(tasksToSave));
    localStorage.setItem("points", points);
}

// Load tasks from localStorage
function loadTasksFromStorage() {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        for (const id in parsedTasks) {
            // Recreate task UI and restart timers
            const task = parsedTasks[id];
            const taskList = document.getElementById("taskList");
            
            if (taskList) {
                let li = document.createElement("li");
                li.classList.add("a_task");
                
                // Calculate time left based on saved start time
                const elapsed = (Date.now() - task.startTime) / 1000; // in seconds
                const timeLeft = Math.max(0, task.duration - elapsed);
                const minutes = Math.floor(timeLeft / 60);
                const seconds = Math.floor(timeLeft % 60);
                
                li.innerHTML = `
                    ${task.text} 
                    <span class="timer" id="timer-${id}">${minutes}:${seconds < 10 ? "0" : ""}${seconds}</span>
                    <button onclick="deleteTask('${id}')">🗑️</button>
                    <input type="checkbox" id="${id}" onclick="completeTask('${id}')" ${task.completed ? 'checked' : ''}>
                `;
                taskList.appendChild(li);
                
                // Recreate task object
                tasks[id] = {
                    ...task,
                    timerInterval: null,
                    completionInterval: null
                };
                
                // Only restart timer if not completed and time remains
                if (!task.completed && timeLeft > 0) {
                    tasks[id].timerInterval = startTaskTimer(id);
                } else if (!task.completed) {
                    // If time is up but not completed, start completion window
                    startCompletionWindow(id);
                }
            }
        }
    }
}

// Start User-defined Task Timer
function startTaskTimer(taskId) {
    if (!tasks[taskId]) {
        console.error(`Error: Task ${taskId} not found in tasks object.`);
        return null;
    }

    let timeLeft = tasks[taskId].duration;
    let timerDisplay = document.getElementById(`timer-${taskId}`);
    
    if (!timerDisplay) {
        console.error(`Timer display element for task ${taskId} not found!`);
        return null;
    }

    console.log(`Starting timer for task: ${taskId}, Duration: ${timeLeft} seconds`);

    // Update display immediately once
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    // Set up the interval
    let interval = setInterval(() => {
        timeLeft--;
        
        // Check if timer should finish
        if (timeLeft <= 0) {
            clearInterval(interval);
            console.log(`Task ${taskId} timer completed, starting 30-minute window`);
            startCompletionWindow(taskId);
            return;
        }
        
        // Update display
        minutes = Math.floor(timeLeft / 60);
        seconds = timeLeft % 60;
        timerDisplay.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }, 1000);

    return interval;
}

// Start 30-Minute Completion Window
function startCompletionWindow(taskId) {
    if (!tasks[taskId]) {
        console.error(`Error: Task ${taskId} not found for completion window.`);
        return;
    }
    
    let timerDisplay = document.getElementById(`timer-${taskId}`);
    if (!timerDisplay) {
        console.error(`Timer display element for task ${taskId} not found!`);
        return;
    }
    
    let timeLeft = 30 * 60; // 30 minutes in seconds
    tasks[taskId].completionStartTime = Date.now();
    
    // Update display immediately once
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.innerText = `Complete in: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    // Set up the interval
    let completionInterval = setInterval(() => {
        timeLeft--;
        
        // Check if timer should finish
        if (timeLeft <= 0) {
            clearInterval(completionInterval);
            timerDisplay.innerText = "EXPIRED";
            return;
        }
        
        // Update display
        minutes = Math.floor(timeLeft / 60);
        seconds = timeLeft % 60;
        timerDisplay.innerText = `Complete in: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }, 1000);

    tasks[taskId].completionInterval = completionInterval;
}

// Complete Task & Award Points
function completeTask(taskId) {
    let checkBox = document.getElementById(taskId);
    if (!checkBox) {
        console.error(`Checkbox for task ${taskId} not found!`);
        return;
    }
    
    // Only proceed if checkbox is checked and task exists and isn't already completed
    if (!checkBox.checked || !tasks[taskId] || tasks[taskId].completed) {
        return;
    }
    
    // Task is being completed
    console.log(`Completing task ${taskId}`);
    
    // Stop the main task timer if it's still running
    if (tasks[taskId].timerInterval) {
        clearInterval(tasks[taskId].timerInterval);
        tasks[taskId].timerInterval = null;
    }
    
    // Determine if task is completed within time window
    let now = Date.now();
    let isWithinTime = false;
    
    // If completionStartTime exists, use that to check 30-minute window
    if (tasks[taskId].completionStartTime) {
        let timeElapsed = now - tasks[taskId].completionStartTime;
        isWithinTime = timeElapsed <= (30 * 60 * 1000); // 30 minutes in ms
    } else {
        // If no completion window started yet, check if within original task duration
        let timeElapsed = now - tasks[taskId].startTime;
        isWithinTime = timeElapsed <= (tasks[taskId].duration * 1000);
    }
    
    // Award points if completed in time
    if (isWithinTime) {
        points += 10;
        alert(`Task completed on time! +10 points. Total: ${points}`);
    } else {
        alert("Time expired! No points awarded.");
    }
    
    // Mark task as completed
    tasks[taskId].completed = true;
    
    // Clear completion interval if it exists
    if (tasks[taskId].completionInterval) {
        clearInterval(tasks[taskId].completionInterval);
        tasks[taskId].completionInterval = null;
    }
    
    // Update UI
    let timerDisplay = document.getElementById(`timer-${taskId}`);
    if (timerDisplay) {
        timerDisplay.innerText = "COMPLETED";
    }
    
    // Save updated points and tasks
    saveTasksToStorage();
}

// Delete Task
function deleteTask(taskId) {
    if (!tasks[taskId]) {
        console.error(`Task ${taskId} not found for deletion!`);
        return;
    }
    
    // Find the task element in the DOM
    let taskCheckbox = document.getElementById(taskId);
    if (!taskCheckbox) {
        console.error(`Task checkbox ${taskId} not found for deletion!`);
        return;
    }
    
    // Find the parent li element and remove it
    let taskElement = taskCheckbox.closest('li');
    if (taskElement) {
        taskElement.remove();
    } else {
        console.error(`Task element for ${taskId} not found for deletion!`);
    }
    
    // Clear intervals if they exist
    if (tasks[taskId].timerInterval) {
        clearInterval(tasks[taskId].timerInterval);
    }
    if (tasks[taskId].completionInterval) {
        clearInterval(tasks[taskId].completionInterval);
    }
    
    delete tasks[taskId]; // Remove from tracking
    saveTasksToStorage(); // Update storage
}

// **24-Hour Clock**
function updateClock() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    let timeString = `${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    const clockElement = document.getElementById("clock");
    if (clockElement) {
        clockElement.innerText = "Current Time: " + timeString;
    }
}
setInterval(updateClock, 1000); // Update clock every second

// **Doug's Life System (Runs in Background)**
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
    if (dougImage) {
        dougImage.src = newGif + "?" + new Date().getTime();
    }
    
    // Save game state - This was outside the function in the original code
    localStorage.setItem("waterAmount", waterAmount);
    localStorage.setItem("sunAmount", sunAmount);
    localStorage.setItem("soilEnjoyment", soilEnjoyment);
    
    // Update status message if available
    if (messageBox) {
        let statusMessage = "Doug is ";
        if (newGif.includes("Happy")) {
            statusMessage += "happy! ";
        } else {
            statusMessage += "sad. ";
        }
        
        if (waterAmount < 3) {
            statusMessage += "Doug needs more water. ";
        }
        if (sunAmount < 3) {
            statusMessage += "Doug needs more sunlight. ";
        }
        if (!soilEnjoyment) {
            statusMessage += "Doug doesn't like the soil. ";
        }
        
        messageBox.innerText = statusMessage;
    }
}

// **Trigger Watering**
function waterDoug() {
    lastWatered = Date.now();
    waterAmount += 1;
    localStorage.setItem("lastWatered", lastWatered);
    localStorage.setItem("waterAmount", waterAmount);
    
    console.log("Doug has been watered! Water amount:", waterAmount);
    updateDougState(); // Immediately update Doug's state
}

// **Trigger Soil Check**
function checkSoil() {
    lastSoilCheck = Date.now();
    soilEnjoyment = Math.random() > 0.2; // 80% chance soil is good
    localStorage.setItem("lastSoilCheck", lastSoilCheck);
    localStorage.setItem("soilEnjoyment", soilEnjoyment);
    
    console.log("Soil checked! Doug " + (soilEnjoyment ? "enjoys" : "doesn't like") + " the soil.");
    updateDougState(); // Immediately update Doug's state
}

// **Change Light Bulb**
function changeBulb(bulbType) {
    selectedBulb = bulbType;
    sunAmount += 1;
    localStorage.setItem("selectedBulb", selectedBulb);
    localStorage.setItem("sunAmount", sunAmount);
    
    console.log("Bulb changed to:", bulbType, "Sun amount:", sunAmount);
    updateDougState(); // Immediately update Doug's state
}

// **Game Loop**
setInterval(updateDougState, 60 * 1000);

// Initialize when document is ready
document.addEventListener("DOMContentLoaded", function() {
    // Load initial state
    updateClock();
    updateDougState();
    loadTasksFromStorage();
    
    // Set up event listener for the add task button
    const addTaskButton = document.getElementById("addTaskButton");
    if (addTaskButton) {
        addTaskButton.addEventListener("click", addTask);
    }
    
    // Also allow adding tasks with Enter key in the duration input
    const taskDurationInput = document.getElementById("taskDuration");
    if (taskDurationInput) {
        taskDurationInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                addTask();
            }
        });
    }
    
    console.log("Game initialized with:");
    console.log("- Water:", waterAmount);
    console.log("- Sun:", sunAmount);
    console.log("- Soil:", soilEnjoyment ? "Good" : "Bad");
    console.log("- Bulb:", selectedBulb);
    console.log("- Points:", points);
});