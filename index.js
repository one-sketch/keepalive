// Load from local storage or set default values
let lastWatered = parseInt(localStorage.getItem("lastWatered")) || Date.now();
let lastSoilCheck = parseInt(localStorage.getItem("lastSoilCheck")) || Date.now();
let gameStart = parseInt(localStorage.getItem("gameStart")) || Date.now();
let selectedBulb = localStorage.getItem("selectedBulb") || "fluorescent"; 

// Environmental Variables
let waterAmount = isNaN(parseInt(localStorage.getItem("waterAmount"))) ? 0 : parseInt(localStorage.getItem("waterAmount"));
let sunAmount = isNaN(parseInt(localStorage.getItem("sunAmount"))) ? 0 : parseInt(localStorage.getItem("sunAmount"));
let soilEnjoyment = localStorage.getItem("soilEnjoyment") !== "false"; 


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


function startGame() {
    // Clear all saved data to ensure fresh start
    localStorage.clear();

    // Set default values after clearing
    localStorage.setItem("waterAmount", 0);
    localStorage.setItem("sunAmount", 0);
    localStorage.setItem("soilEnjoyment", "true"); // Stored as string
    localStorage.setItem("points", 0);
    localStorage.setItem("selectedBulb", "fluorescent");
    localStorage.setItem("dirtType", "Sandy Soil"); // Default soil type
    localStorage.setItem("rainCloudPrice", 10); // Reset rain price

    console.log("🔄 Game Reset: Doug's state is fresh!");

    // Reload the page to apply changes
    window.location.reload();
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


function completeTask(taskId) {
    let checkBox = document.getElementById(taskId);
    if (!checkBox) {
        console.error(`Checkbox for task ${taskId} not found!`);
        return;
    }

    // Prevent awarding points if already completed
    if (!tasks[taskId] || tasks[taskId].completed) {
        console.log(`Task ${taskId} is already completed or not found.`);
        return;
    }

    let now = Date.now();
    let isWithinTime = false;

    // If completionStartTime exists, check if within 30-minute window
    if (tasks[taskId].completionStartTime) {
        let timeElapsed = now - tasks[taskId].completionStartTime;
        isWithinTime = timeElapsed <= (30 * 60 * 1000); // 30 minutes in ms
    } else {
        let timeElapsed = now - tasks[taskId].startTime;
        isWithinTime = timeElapsed <= (tasks[taskId].duration * 1000);
    }

    // Award points only if completed in time
    if (isWithinTime) {
        let taskDurationMinutes = tasks[taskId].duration / 60;
        let earnedPoints = taskDurationMinutes >= 60 ? 20 : 10; // 20 points for 60 mins, else 10
        points += earnedPoints;

        showPopup(`✅ Task completed on time! +${earnedPoints} points. Total: ${points}`);
        localStorage.setItem("points", points);
        updatePointsDisplay(); // Refresh UI
    } else {
        showPopup("⏳ Time expired! No points awarded.");
    }

    // Mark task as completed
    tasks[taskId].completed = true;

    // Stop any running timers
    if (tasks[taskId].timerInterval) {
        clearInterval(tasks[taskId].timerInterval);
        tasks[taskId].timerInterval = null;
    }

    if (tasks[taskId].completionInterval) {
        clearInterval(tasks[taskId].completionInterval);
        tasks[taskId].completionInterval = null;
    }

    // Update UI
    let timerDisplay = document.getElementById(`timer-${taskId}`);
    if (timerDisplay) {
        timerDisplay.innerText = "✅ COMPLETED";
        timerDisplay.style.color = "green"; // Make it clear
    }

    // Disable checkbox after completion
    checkBox.disabled = true;

    // Save updated points and tasks
    saveTasksToStorage();
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

localStorage.setItem("waterAmount", 0);
localStorage.setItem("sunAmount", 0);
updateDougState();




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

function updateDougState() {
    console.log("🔄 Checking Doug's State...");
    console.log("💧 Water Amount:", waterAmount);
    console.log("☀️ Sun Amount:", sunAmount);
    console.log("🌱 Soil Enjoyment:", soilEnjoyment);

    // Ensure stored values are correct
    waterAmount = parseInt(localStorage.getItem("waterAmount")) || 0;
    sunAmount = parseInt(localStorage.getItem("sunAmount")) || 0;
    soilEnjoyment = localStorage.getItem("soilEnjoyment") === "true"; // Convert string to boolean
    selectedBulb = localStorage.getItem("selectedBulb") || "fluorescent";

    let correctBulb = ["fluorescent", "led", "ultraviolet"].includes(selectedBulb);
    let growthStage = "Bud"; // Default stage
    let emotion = "Neutral"; // Default mood

    // 🌱 **Determine Growth Stage**
    if (waterAmount >= 9 && sunAmount >= 9) {
        growthStage = "Bloom";
    } else if (waterAmount >= 6 && sunAmount >= 6) {
        growthStage = "Sprout";
    } else {
        growthStage = "Bud";
    }

    // 😀 **Determine Emotion**
    if (waterAmount >= 9 && sunAmount >= 9 && soilEnjoyment && correctBulb) {
        emotion = "Happy";
    } else if (waterAmount >= 3 && sunAmount >= 3 && soilEnjoyment) {
        emotion = "Neutral";
    } else {
        emotion = "Sad";
    }

    // 🖼️ **Select GIF File**
    let newGif = `images/${emotion}_${growthStage}.gif`;

    // 🏗️ **Update Doug’s Image Only if Needed**
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

    // **Update Status Message**
    if (messageBox) {
        let statusMessage = `Doug is a ${growthStage} and feeling ${emotion.toLowerCase()}.`;

        if (waterAmount < 3) statusMessage += " 💧 Needs more water.";
        if (sunAmount < 3) statusMessage += " ☀️ Needs more sunlight.";
        if (!soilEnjoyment) statusMessage += " 🌱 Doesn't like the soil.";

        messageBox.innerText = statusMessage;
    }
}


// **Trigger Watering**
function waterDoug() {
    waterAmount = parseInt(localStorage.getItem("waterAmount")) || 0;
    waterAmount += 1; // Increase water count
    localStorage.setItem("waterAmount", waterAmount); // Save new value
    console.log("💧 Doug was watered! New Water Amount:", waterAmount);
    updateDougState(); // Refresh Doug's condition
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
    localStorage.setItem("selectedBulb", selectedBulb);

    // Adjust sunlight based on bulb type
    sunAmount = parseInt(localStorage.getItem("sunAmount")) || 0;
    if (bulbType === "ultraviolet") sunAmount += 5; // Best bulb
    else if (bulbType === "led") sunAmount += 3; // Middle bulb
    else if (bulbType === "fluorescent") sunAmount += 1; // Worst bulb

    localStorage.setItem("sunAmount", sunAmount);
    console.log("☀️ Sunlight updated with " + bulbType + ": " + sunAmount);
    updateDougState();
}


// **Game Loop**
setInterval(updateDougState, 300000);

// Initialize when document is ready
document.addEventListener("DOMContentLoaded", function() {

    document.addEventListener("DOMContentLoaded", function () {
        waterAmount = parseInt(localStorage.getItem("waterAmount")) || 0;
        sunAmount = parseInt(localStorage.getItem("sunAmount")) || 0;
        soilEnjoyment = localStorage.getItem("soilEnjoyment") === "true"; // Convert string to boolean
        points = parseInt(localStorage.getItem("points")) || 0;
        selectedBulb = localStorage.getItem("selectedBulb") || "fluorescent";
        dirtType = localStorage.getItem("dirtType") || "Sandy Soil";
        rainCloudPrice = parseInt(localStorage.getItem("rainCloudPrice")) || 10;
    
        updateDougState(); // Ensure Doug updates properly
        updatePointsDisplay();
        updateRainButton();
    
        console.log("🔄 Loaded Game State:", {
            waterAmount,
            sunAmount,
            soilEnjoyment,
            points,
            selectedBulb,
            dirtType,
            rainCloudPrice
        });
    });
    
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

function summonRain() {
    if (points >= rainCloudPrice) {
        console.log(`🌧️ Summoning rain at price: ${rainCloudPrice}`);
        
        points -= rainCloudPrice; // Deduct points
        rainCloudPrice += 5; // Increase price by 5

        // Save values correctly
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

// Ensure button initializes with correct price
document.addEventListener("DOMContentLoaded", function () {
    let rainButton = document.getElementById("summonRainButton");
    if (rainButton) {
        rainButton.addEventListener("click", summonRain);
        updateRainButton(); // Set initial button price
    }
});

function updateRainButton() {
    let rainButton = document.getElementById("summonRainButton");
    if (rainButton) {
        rainButton.innerText = `☁️ ${rainCloudPrice} Pts`;
        console.log(`🔄 Rain Button Updated: ${rainCloudPrice} Pts`);
    }
}



const potPrices = {
    "terracota_pot": 15,
    "white_plastic_cup": 25,
    "fancy_pot": 45
};

function buyPot(potType) {
    const cost = potPrices[potType];

    if (points >= cost) {
        points -= cost; // Deduct points
        localStorage.setItem("points", points);
        updatePointsDisplay(); // Refresh points UI

        // Ensure pots are purchased in the correct order
        localStorage.setItem("purchasedPot", potType);
        showPurchasedPot(); // Show the correct pot image

        // **Only update the background once on first purchase**
        let deskImage = document.querySelector(".desk");
        let backgroundChanged = localStorage.getItem("deskBackgroundChanged");

        if (deskImage && !backgroundChanged) {
            deskImage.src = "images/desk_no_mug.png"; // Update background
            localStorage.setItem("deskBackground", "images/desk_no_mug.png");
            localStorage.setItem("deskBackgroundChanged", "true"); // Prevents multiple updates
        }

        showPopup(`🪴 You purchased a ${potType.replace(/_/g, " ")}!`);
    } else {
        showPopup("❌ Not enough points!");
    }
}

// Function to display the purchased pot
function showPurchasedPot() {
    let potImage = document.getElementById("purchasedPot");
    let purchasedPot = localStorage.getItem("purchasedPot");

    if (potImage && purchasedPot) {
        potImage.src = `images/${purchasedPot}.png`;
        potImage.style.display = "block"; // Make sure it's visible
    }
}

// Ensure the pot stays visible & background stays changed on reload
document.addEventListener("DOMContentLoaded", function () {
    showPurchasedPot(); // Load the correct pot
    updatePointsDisplay(); // Update points UI

    // Ensure background remains updated if a pot was bought
    let savedDesk = localStorage.getItem("deskBackground");
    let deskImage = document.querySelector(".desk");
    if (savedDesk && deskImage) {
        deskImage.src = savedDesk; // Ensure desk stays updated
    }
});




const dirtPrices = {
    "Sandy Soil": 10,
    "Clay Soil": 20,
    "Rich Soil": 30,
    "Peaty Soil": 15,
    "Loamy Soil": 25,
    "Chalky Soil": 35
};

// Function to buy soil
function buySoil(dirtType) {
    let dirtPrice = dirtPrices[dirtType];

    if (points >= dirtPrice) {
        points -= dirtPrice; // Deduct points
        soilEnjoyment = true; // Soil is now good
        localStorage.setItem("soilEnjoyment", true);
        localStorage.setItem("dirtType", dirtType);
        localStorage.setItem("points", points);
        updatePointsDisplay();
        updateDougState();

        showPopup(`You bought ${dirtType}! Doug is happy with his new soil.`);
    } else {
        showPopup("Not enough points to buy this soil.");
    }
}

// Function to check current soil type
function checkSoil() {
    let dirtType = localStorage.getItem("dirtType") || "Basic Soil"; // Default if none purchased
    let soilStatus = soilEnjoyment ? "enjoys" : "doesn't like";

    console.log(`Doug is currently in ${dirtType}. He ${soilStatus} the soil.`);

    showPopup(`Doug is in ${dirtType}. ${soilEnjoyment ? "He likes it!" : "He needs new soil!"}`);
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
document.addEventListener("DOMContentLoaded", function () {
    let shutter = document.querySelector(".shutterTransition");
    let doug = document.getElementById("dougImage");
    let pointsBox = document.getElementById("pointsDisplay");

    // Hide Doug and Points Box Initially
    doug.classList.add("hidden-during-transition");
    pointsBox.classList.add("hidden-during-transition");

    // Wait 1 second, then fade out the transition
    setTimeout(() => {
        shutter.classList.add("active");

        // Show Doug and Points Box after transition ends
        setTimeout(() => {
            shutter.remove();
            doug.classList.add("show");
            pointsBox.classList.add("show");
        }, 1000);
    }, 1000); // Delay before fade-out starts
});
document.addEventListener("DOMContentLoaded", function() {
    updateDougState();
});