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

// Function to update points display
function updatePointsDisplay() {
    let pointsElement = document.getElementById("pointsDisplay");
    if (pointsElement) {
        pointsElement.innerText = points;
    } else {
        console.error("Points display element not found in the DOM!");
    }
}

// Ensure points are loaded on page load
document.addEventListener("DOMContentLoaded", updatePointsDisplay);

// Ensure points are loaded on page load
document.addEventListener("DOMContentLoaded", updatePointsDisplay);


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
        showPopup("Please enter a valid task and duration!");
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
function deleteTask(taskId) {
    if (!tasks[taskId]) {
        console.error(`Task ${taskId} not found for deletion!`);
        return;
    }

    // Find the task checkbox and parent <li> element
    let taskCheckbox = document.getElementById(taskId);
    if (!taskCheckbox) {
        console.error(`Task checkbox ${taskId} not found for deletion!`);
        return;
    }
    
    let taskElement = taskCheckbox.closest("li");
    if (taskElement) {
        taskElement.remove(); // Remove from UI
    } else {
        console.error(`Task element for ${taskId} not found for deletion!`);
    }

    // Stop the main task timer if it exists
    if (tasks[taskId].timerInterval) {
        clearInterval(tasks[taskId].timerInterval);
    }

    // Stop the completion timer if it exists
    if (tasks[taskId].completionInterval) {
        clearInterval(tasks[taskId].completionInterval);
    }

    // Remove task from tracking and localStorage
    delete tasks[taskId];
    saveTasksToStorage(); // Update localStorage with new task list

    console.log(`Task ${taskId} deleted successfully.`);
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
// **Doug's Life System (Runs in Background)**
function updateDougState() {
    let now = Date.now();

    console.log("🔄 Checking Doug's State...");
    console.log("💧 Water Amount:", waterAmount);
    console.log("☀️ Sun Amount:", sunAmount);
    console.log("🌱 Soil Enjoyment:", soilEnjoyment);

    // Ensure `sunAmount` doesn't reset incorrectly
    sunAmount = parseInt(localStorage.getItem("sunAmount"));
    if (isNaN(sunAmount)) sunAmount = 0;

    let correctBulb = ["fluorescent", "led", "ultraviolet"].includes(selectedBulb);
    let newGif = "images/Happy_Bud.gif"; // Default (Happy Bud)

    // **Sad Bud Condition (Not enough water, but sunlight & soil are okay)**
    if (waterAmount < 3 && sunAmount >= 3 && soilEnjoyment) {
        newGif = "images/Sad_Bud.gif";
    }
    // **Sad Sprout Condition (Enough water but NOT enough sunlight)**
    else if (waterAmount >= 3 && sunAmount < 3 && soilEnjoyment) {
        newGif = "images/Sad_Sprout.gif";
    }
    // **Sad Bloom Condition (Water & Sunlight okay, but Bad Soil)**
    else if (waterAmount >= 3 && sunAmount >= 3 && !soilEnjoyment) {
        newGif = "images/Sad_Bloom.gif";
    }
    // **Happy Sprout Condition (Good Water, Sunlight, Soil, and a Bulb)**
    else if (waterAmount >= 6 && sunAmount >= 6 && soilEnjoyment && correctBulb) {
        newGif = "images/Happy_Sprout.gif";
    }
    // **Happy Bloom Condition (High Water, Sunlight, Soil, and a Bulb)**
    else if (waterAmount >= 9 && sunAmount >= 9 && soilEnjoyment && correctBulb) {
        newGif = "images/Happy_Bloom.gif";
    }

    // **Update only if Doug’s state has changed**
    if (dougImage.src !== newGif) {
        console.log("🖼️ Updating Doug to:", newGif);
        dougImage.src = newGif + "?" + new Date().getTime(); // Force browser refresh
    } else {
        console.log("✅ Doug's state is already correct, no update needed.");
    }

    // **Save game state**
    localStorage.setItem("waterAmount", waterAmount);
    localStorage.setItem("sunAmount", sunAmount);
    localStorage.setItem("soilEnjoyment", soilEnjoyment);

    // **Update status message**
    if (messageBox) {
        let statusMessage = "Doug is ";
        statusMessage += newGif.includes("Happy") ? "😊 happy! " : "😢 sad. ";

        if (waterAmount < 3) statusMessage += "💧 Needs more water. ";
        if (sunAmount < 3) statusMessage += "☀️ Needs more sunlight. ";
        if (!soilEnjoyment) statusMessage += "🌱 Doesn't like the soil. ";

        messageBox.innerText = statusMessage;
    }
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

    // Adjust sunlight based on bulb quality
    if (bulbType === "ultraviolet") {
        sunAmount += 5; // Best bulb
    } else if (bulbType === "led") {
        sunAmount += 3; // Okay bulb
    } else if (bulbType === "fluorescent") {
        sunAmount += 1; // Worst bulb
    }

    // Save new values
    localStorage.setItem("selectedBulb", selectedBulb);
    localStorage.setItem("sunAmount", sunAmount);

    console.log("💡 Bulb changed to:", bulbType);
    console.log("☀️ New Sun Amount:", sunAmount);

    updateDougState(); // Update Doug immediately
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


document.addEventListener("DOMContentLoaded", function() {
    updatePointsDisplay(); // Load points when the page loads
});

function openShopWindow(imageSrc) {
    let shopWindow = document.getElementById("shopWindow");
    let shopImage = document.getElementById("shopImage");
    
    // Hide all shop contents first
    document.querySelectorAll(".shop-content").forEach(el => el.classList.add("hidden"));

    console.log("Opening Shop:", "images/" + imageSrc); // Debugging Log

    if (shopImage && shopWindow) {
        shopImage.src = "images/" + imageSrc + "?" + new Date().getTime();
        shopWindow.style.display = "block";

        // Show correct shop content
        if (imageSrc.includes("lightbulbs")) {
            document.getElementById("bulbShop").classList.remove("hidden");
        } else if (imageSrc.includes("summon-cloud")) {
            document.getElementById("rainShop").classList.remove("hidden");
        } else if (imageSrc.includes("pot_shop")) {
            document.getElementById("potShop").classList.remove("hidden");
        } else if (imageSrc.includes("dirt-shop")) {
            document.getElementById("dirtShop").classList.remove("hidden");
        }
    } else {
        console.error("Shop window or image not found!");
    }
}


function closeShopWindow() {
    document.getElementById("shopWindow").style.display = "none";
}


// Function to purchase a bulb and display it
function purchaseBulb(bulbType, price) {
    if (points >= price) {
        points -= price; // Deduct points
        localStorage.setItem("points", points);
        updatePointsDisplay(); // Refresh points UI

        let bulbImage = document.getElementById("purchasedBulb");
        if (bulbImage) {
            bulbImage.src = `images/${bulbType}.png`; // Set image source dynamically
            bulbImage.style.display = "block"; // Show the new bulb
        }

        showPopup(`💡 ${bulbType.replace('.png', '')} bulb purchased!`);
    } else {
        showPopup("❌ Not enough points!");
    }
}

// Ensure these buttons trigger the function
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("buyLED").addEventListener("click", function () {
        purchaseBulb("led", 20);
    });

    document.getElementById("buyFluorescent").addEventListener("click", function () {
        purchaseBulb("uv", 50);
    });

    document.getElementById("buyUV").addEventListener("click", function () {
        purchaseBulb("flourescent", 30);
    });
});


// Initial raincloud price
let rainCloudPrice = parseInt(localStorage.getItem("rainCloudPrice")) || 10;

// Function to update the rain button text
function updateRainButton() {
    let rainButton = document.getElementById("summonRainButton");
    if (rainButton) {
        rainButton.innerText = `☁️ ${rainCloudPrice} Pts`;
    }
}

// Function to summon rain
function summonRain() {
    if (points >= rainCloudPrice) {
        points -= rainCloudPrice; // Deduct points
        rainCloudPrice += 10; // Increase price for next purchase
        localStorage.setItem("points", points);
        localStorage.setItem("rainCloudPrice", rainCloudPrice);
        updatePointsDisplay(); // Refresh points UI
        updateRainButton(); // Update button price

        let cloudImage = document.getElementById("rainCloud");
        if (cloudImage) {
            cloudImage.src = "images/cloud.gif"; // Use the cloud GIF
            cloudImage.style.display = "block"; // Show the cloud
            cloudImage.style.animation = "cloudMove 10s linear forwards"; // Apply animation
        }

        // Hide the cloud after 10 seconds
        setTimeout(() => {
            if (cloudImage) {
                cloudImage.style.display = "none"; // Hide cloud
                cloudImage.style.animation = ""; // Reset animation
            }
        }, 10000);

        showPopup(`🌧️ Raincloud summoned! New price: ${rainCloudPrice} points.`);
    } else {
        showPopup("❌ Not enough points!");
    }
}

// Attach event listener for the rain button
document.addEventListener("DOMContentLoaded", function () {
    let rainButton = document.getElementById("summonRainButton");
    if (rainButton) {
        rainButton.addEventListener("click", summonRain);
        updateRainButton(); // Set initial button price
    }
});



// Prices for different pots
const potPrices = {
    "smallPot": 15,
    "mediumPot": 25,
    "largePot": 40
};

// Prices for different dirt types
const dirtPrices = {
    "basicDirt": 10,
    "premiumDirt": 20,
    "organicDirt": 30,
    "sandMix": 15,
    "clayMix": 25,
    "peatMix": 35
};

// Function to Buy a Pot
function buyPot(potType) {
    const cost = potPrices[potType];

    if (points >= cost) {
        points -= cost;
        localStorage.setItem("points", points);

        showPopup(`🪴 You bought a ${potType.replace(/([A-Z])/g, " $1")}! (-${cost} points)`);
        updatePointsDisplay();
    } else {
        showPopup(`❌ Not enough points! ${potType.replace(/([A-Z])/g, " $1")} costs ${cost} points.`);
    }
}

// Function to Buy Dirt
function buyDirt(dirtType) {
    const cost = dirtPrices[dirtType];

    if (points >= cost) {
        points -= cost;
        localStorage.setItem("points", points);

        showPopup(`🌱 You bought ${dirtType.replace(/([A-Z])/g, " $1")}! (-${cost} points)`);
        updatePointsDisplay();
    } else {
        showPopup(`❌ Not enough points! ${dirtType.replace(/([A-Z])/g, " $1")} costs ${cost} points.`);
    }
}


// Function to Update Points Display
function updatePointsDisplay() {
    let pointsElement = document.getElementById("pointsDisplay");
    if (pointsElement) {
        pointsElement.innerText = `Points: ${points}`;
    }
}


// Function to Show a Nice Pop-Up Message
function showPopup(message) {
    let popup = document.createElement("div");
    popup.classList.add("popup-message");
    popup.innerText = message;

    document.body.appendChild(popup);

    // Auto-remove pop-up after 3 seconds
    setTimeout(() => {
        popup.remove();
    }, 3000);
}
