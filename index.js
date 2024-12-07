// @ts-nocheck

// Firebase configuration and initialization
// Contains the configuration details required to connect to Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCBw68I3ro5SC5VPNAWoJcq-vlF2PCW8p8",
    authDomain: "thermometer-davit-72936.firebaseapp.com",
    databaseURL: "https://thermometer-davit-72936-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "thermometer-davit-72936",
    storageBucket: "thermometer-davit-72936.firebasestorage.app",
    messagingSenderId: "1021055248383",
    appId: "1:1021055248383:web:3d79044a7eb97be98669ca",
    measurementId: "G-D16G5XVN28"
};

// Initialize Firebase with the provided configuration
firebase.initializeApp(firebaseConfig);

// Reference to the Firebase Realtime Database
const db = firebase.database();

// Real-time database references for different paths
const currentDataRef = db.ref("/therm/current");  // Reference for current temperature and humidity
const datesRef = db.ref("/therm/dates");          // Reference for recorded data dates
const actDatesRef = db.ref("/therm/actDates");    // Reference for actual dates
let delRef = db.ref("/therm/current");            // Reference for the delay path
let delRef2 = db.ref("/therm/current/delay");     // Reference specifically for the delay value

// Listen for real-time updates to current temperature and humidity
currentDataRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const { temp, hum } = data;
    if (temp !== undefined) {
        updateTemperatureDisplay(temp);  // Update temperature on the webpage
        updateChart(temp, "temperature");  // Update the temperature chart
    }
    if (hum !== undefined) {
        updateHumidityDisplay(hum);  // Update humidity on the webpage
        updateChart(hum, "humidity");  // Update the humidity chart
    }
});

// Update the temperature display on the webpage
function updateTemperatureDisplay(temp) {
    document.getElementById("tempText").innerHTML = `${temp}°C`; // Display temperature
    document.getElementById("curTemp").innerHTML = `${temp}°C`; // Display temperature in another section
    updateMercuryHeight(temp); // Adjust mercury height based on temperature
}

// Update the humidity display on the webpage
function updateHumidityDisplay(hum) {
    document.getElementById("humText").innerHTML = `${hum}%`; // Display humidity
    document.getElementById("curHum").innerHTML = `${hum}%`; // Display humidity in another section
}

// Listen for real-time updates to the delay value
delRef2.on("value", (snapshot) => {
    const delay = snapshot.val();
    document.getElementById("delText").value = delay / 1000;  // Show delay in seconds
    document.getElementById("curDel").innerHTML = delay / 1000 + "s";  // Update delay display
});

// Change the delay value in Firebase through the webpage
function changeDel() {
    const delayInput = document.getElementById("delText").value;
    let newDelay = Math.min(Math.max(parseFloat(delayInput), 3), 10); // Constrain delay between 3 and 10 seconds
    document.getElementById("delText").value = newDelay;
    delRef.update({ delay: newDelay * 1000 }); // Update delay in milliseconds
}

// Restrict input for the delay field to only numeric values
document.getElementById('delText').addEventListener('input', function (event) {
    let filteredValue = '';
    for (let i = 0; i < this.value.length; i++) {
        if (this.value[i] >= '0' && this.value[i] <= '9') {
            filteredValue += this.value[i]; // Allow only numeric characters
        }
    }
    this.value = filteredValue; // Update input with filtered value
});

// Adjust the height and color of the thermometer mercury based on temperature
function updateMercuryHeight(temp) {
    const degreeRange = 33.5; // Range of temperature for full height adjustment
    const tempToPixelCoefficient = 5 / (degreeRange / 10); // Conversion factor
    const heightToZeroDegrees = 50; // Base height for 0°C

    const mercury = document.getElementById("mercury");
    mercury.style.height = `${tempToPixelCoefficient * temp + heightToZeroDegrees}%`; // Set mercury height

    mercury.style.backgroundColor = temp >= 0 ? "red" : "blue"; // Change color for positive or negative temperatures
}

// Stub function for real-time chart updates (to be implemented with a charting library)
function updateChart(value, type) {
    console.log(`Update ${type} chart with value: ${value}`);
}

// Initialize the first temperature chart (Chart 1)
const tempChartCtx = document.getElementById("tempGraph").getContext("2d");
const tempChart = new Chart(tempChartCtx, {
    type: "line",
    data: {
        labels: [], // Labels for the x-axis, will be updated dynamically
        datasets: [{
            label: "First Date", // Label for the dataset
            data: [],  // Array to hold temperature data
            borderColor: "black", // Line color
            backgroundColor: "rgba(0,255,255,1)", // Background fill color
            borderWidth: 1, // Line width
            humidityData: [] // Array for humidity data (for tooltips)
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true } // Ensure y-axis starts at 0
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(tooltipItem) {
                        return tooltipItem[0].label; // Show time label
                    },
                    label: function(tooltipItem) {
                        const tempValue = tooltipItem.raw; // Temperature value
                        const humidityValue = tooltipItem.dataset.humidityData[tooltipItem.dataIndex]; // Humidity value
                        return `Temp: ${tempValue.toFixed(1)}°C ||| Humidity: ${humidityValue.toFixed(1)}%`; // Tooltip text
                    }
                }
            }
        }
    }
});

// Initialize the second temperature chart (Chart 2)
const tempChartCtx2 = document.getElementById("temp2Graph").getContext("2d");
const tempChart2 = new Chart(tempChartCtx2, {
    type: "line",
    data: {
        labels: [], // Labels for the x-axis, will be updated dynamically
        datasets: [{
            label: "Second Date", // Label for the dataset
            data: [],  // Array to hold temperature data
            borderColor: "black", // Line color
            backgroundColor: "rgba(0,255,255,1)", // Background fill color
            borderWidth: 1, // Line width
            humidityData: [] // Array for humidity data (for tooltips)
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true } // Ensure y-axis starts at 0
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(tooltipItem) {
                        return tooltipItem[0].label; // Show time label
                    },
                    label: function(tooltipItem) {
                        const tempValue = tooltipItem.raw; // Temperature value
                        const humidityValue = tooltipItem.dataset.humidityData[tooltipItem.dataIndex]; // Humidity value
                        return `Temperature: ${tempValue.toFixed(1)}°C ||| Humidity: ${humidityValue.toFixed(1)}%`; // Tooltip text
                    }
                }
            }
        }
    }
});

// Update the chart with temperature and humidity data for a given date
function updateGraphForDate(date, chartInstance) {
    const [year, month, day] = date.split("-"); // Split date into year, month, and day
    const averagesRef = db.ref(`/therm/averages/${year}/${month}/${day}`); // Firebase path for averages

    averagesRef.once("value", (snapshot) => {
        const dayData = snapshot.val(); // Get data for the day

        // Initialize arrays for chart labels and data
        const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        const tempDataPoints = Array(24).fill(null); // Default null for missing data
        const humidityDataPoints = Array(24).fill(null); // Default null for missing data

        // Populate arrays with data
        if (dayData) {
            Object.entries(dayData).forEach(([hour, hourData]) => {
                const tempValue = hourData.avgTemp;
                const humidityValue = hourData.avgHum;
                if (tempValue !== undefined) {
                    tempDataPoints[parseInt(hour)] = tempValue;
                }
                if (humidityValue !== undefined) {
                    humidityDataPoints[parseInt(hour)] = humidityValue;
                }
            });
        } else {
            alert(`No data available for ${date}`);
        }

        // Update the chart
        chartInstance.data.labels = hourLabels; // Update x-axis labels
        chartInstance.data.datasets[0].data = tempDataPoints; // Update temperature data
        chartInstance.data.datasets[0].humidityData = humidityDataPoints; // Update humidity data
        chartInstance.update();
    });
}

// Event listener for the first date input field
document.getElementById("dateInput").addEventListener("change", function () {
    const date = this.value; // Format: yyyy-mm-dd
    if (date) {
        // Update min/max values for the selected date in the table
        fetchMinMaxValues(date, "selectedTemp", "selectedHum");

        // Update the graph for the selected date (temperature and humidity)
        updateGraphForDate(date, tempChart, "temperature");
    }
});

// Event listener for the second date input field
document.getElementById("dateInput2").addEventListener("change", function () {
    const date = this.value; // Format: yyyy-mm-dd
    if (date) {
        // Update min/max values for the second selected date in the table
        fetchMinMaxValues(date, "selectedTemp2", "selectedHum2");

        // Update the graph for the second selected date (temperature and humidity)
        updateGraphForDate(date, tempChart2, "temperature");
    }
});

/**
 * Fetches the minimum and maximum temperature and humidity for a given date
 * and updates the specified table cells with the results.
 *
 * @param {string} date - The selected date in yyyy-mm-dd format.
 * @param {string} lowCellId - The ID of the cell for displaying minimum values.
 * @param {string} highCellId - The ID of the cell for displaying maximum values.
 */
function fetchMinMaxValues(date, lowCellId, highCellId) {
    const [year, month, day] = date.split("-"); // Split the date into year, month, and day
    const averagesRef = db.ref(`/therm/averages/${year}/${month}/${day}`); // Firebase reference for the selected date

    // Fetch data from Firebase for the specified date
    averagesRef.once("value", (snapshot) => {
        const dayData = snapshot.val(); // Retrieve the day's data from Firebase
        if (!dayData) {
            // If no data is available for the date, clear the table cells
            document.getElementById(lowCellId).innerText = "--";
            document.getElementById(highCellId).innerText = "--";
            return;
        }

        // Initialize variables to track min/max temperature and humidity
        let minTemp = Infinity, maxTemp = -Infinity;
        let minHum = Infinity, maxHum = -Infinity;

        // Loop through the hourly data to find min/max values
        Object.values(dayData).forEach((hourData) => {
            const { avgTemp, avgHum } = hourData; // Extract temperature and humidity data
            if (avgTemp !== undefined) {
                minTemp = Math.min(minTemp, avgTemp);
                maxTemp = Math.max(maxTemp, avgTemp);
            }
            if (avgHum !== undefined) {
                minHum = Math.min(minHum, avgHum);
                maxHum = Math.max(maxHum, avgHum);
            }
        });

        // Update the table cells with the min/max temperature and humidity
        document.getElementById(lowCellId).innerHTML = `
            <span style="color: cyan;">${minTemp.toFixed(1)}°C</span><br> 
            <span style="color: orange;">${minHum.toFixed(1)}%</span>
        `;
        document.getElementById(highCellId).innerHTML = `
            <span style="color: cyan;">${maxTemp.toFixed(1)}°C</span><br>
            <span style="color: orange;">${maxHum.toFixed(1)}%</span>
        `;
    });
}

/**
 * Plays a random sound effect when called, ensuring no overlap between sounds.
 * Useful for creating interactive or fun effects (e.g., cat reactions).
 */
function catReact() {
    // Get the audio elements
    const sound1 = document.getElementById('catSound1');
    const sound2 = document.getElementById('catSound2');

    // Randomly select one of the two sounds
    const sounds = [sound1, sound2];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];

    // Pause all sounds to avoid overlap and reset them to the start
    sounds.forEach(sound => sound.pause());
    sounds.forEach(sound => sound.currentTime = 0);

    // Play the randomly selected sound
    randomSound.play();
}

/**
 * Enforces a maximum length on the input field's value. 
 * Ensures no more than two characters are entered.
 *
 * @param {HTMLElement} element - The input element being checked.
 */
function enforceMaxLength(element) {
    if (element.value.length > 2) {
        element.value = element.value.slice(0, 2); // Trim the value to two characters
    }
}
