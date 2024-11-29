// @ts-nocheck
// Firebase configuration and initialization
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

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// Real-time data references
const currentDataRef = db.ref("/therm/current");
const datesRef = db.ref("/therm/dates");
const actDatesRef = db.ref("/therm/actDates");
let delRef = db.ref("/therm/current");
let delRef2 = db.ref("/therm/current/delay");

// Real-time listeners for temperature and humidity
currentDataRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const { temp, hum } = data;
    if (temp !== undefined) {
        updateTemperatureDisplay(temp);
        updateChart(temp, "temperature");
    }
    if (hum !== undefined) {
        updateHumidityDisplay(hum);
        updateChart(hum, "humidity");
    }
});

// Update temperature display
function updateTemperatureDisplay(temp) {
    document.getElementById("tempText").innerHTML = `${temp}°C`;
    document.getElementById("curTemp").innerHTML = `${temp}°C`;
    updateMercuryHeight(temp);
}

// Update humidity display
function updateHumidityDisplay(hum) {
    document.getElementById("humText").innerHTML = `${hum}%`;
    document.getElementById("curHum").innerHTML = `${hum}%`;
}

delRef2.on("value", (snapshot) => {
    const delay = snapshot.val();
    document.getElementById("delText").value = delay / 1000;
    document.getElementById("curDel").innerHTML = delay / 1000 + "s";
});

// Change delay in Firebase through the website
function changeDel() {
    if (document.getElementById("delText").value >= 3 && document.getElementById("delText").value <= 10) {
        delRef.update({ delay: parseFloat(document.getElementById("delText").value * 1000) });
    } else if (document.getElementById("delText").value < 3) {
        document.getElementById("delText").value = 3;
        delRef.update({ delay: parseFloat(document.getElementById("delText").value * 1000) });
    } else {
        document.getElementById("delText").value = 10;
        delRef.update({ delay: parseFloat(document.getElementById("delText").value * 1000) });
    }
}

document.getElementById('delText').addEventListener('input', function (event) {
    let filteredValue = '';
    for (let i = 0; i < this.value.length; i++) {
        if (this.value[i] >= '0' && this.value[i] <= '9') {
            filteredValue += this.value[i];
        }
    }
    this.value = filteredValue;
});

// Mercury height for temperature
function updateMercuryHeight(temp) {
    const degreeRange = 33.5;
    const tempToPixelCoefficient = 5 / (degreeRange / 10);
    const heightToZeroDegrees = 50;

    const mercury = document.getElementById("mercury");
    mercury.style.height = `${tempToPixelCoefficient * temp + heightToZeroDegrees}%`;

    mercury.style.backgroundColor = temp >= 0 ? "red" : "blue";
}

// Real-time chart updates (use your charting library here)
function updateChart(value, type) {
    console.log(`Update ${type} chart with value: ${value}`);
}

// Initialize the first temperature chart (Chart 1)
const tempChartCtx = document.getElementById("tempGraph").getContext("2d");
const tempChart = new Chart(tempChartCtx, {
    type: "line",
    data: {
        labels: [], // Initially empty, will be updated dynamically
        datasets: [{
            label: "First Date",
            data: [],  // This will hold the temperature data
            borderColor: "black", // Line color for temperature
            backgroundColor: "rgba(0,255,255,1)", // Background color for chart
            borderWidth: 1,
            humidityData: [] // An array to hold humidity data for tooltips
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true } // Ensuring the y-axis starts from zero
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(tooltipItem) {
                        return tooltipItem[0].label; // Shows the time label (hour)
                    },
                    label: function(tooltipItem) {
                        const tempValue = tooltipItem.raw; // Temperature value
                        const humidityValue = tooltipItem.dataset.humidityData[tooltipItem.dataIndex]; // Corresponding humidity value
                        return `Temp: ${tempValue.toFixed(1)}°C ||| Humidity: ${humidityValue.toFixed(1)}%`; // Display both temperature and humidity
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
        labels: [], // Initially empty, will be updated dynamically
        datasets: [{
            label: "Second Date",
            data: [],  // This will hold the temperature data
            borderColor: "black", // Line color for temperature
            backgroundColor: "rgba(0,255,255,1)", // Background color for chart
            borderWidth: 1,
            humidityData: [] // An array to hold humidity data for tooltips
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true } // Ensuring the y-axis starts from zero
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(tooltipItem) {
                        return tooltipItem[0].label; // Shows the time label (hour)
                    },
                    label: function(tooltipItem) {
                        const tempValue = tooltipItem.raw; // Temperature value
                        const humidityValue = tooltipItem.dataset.humidityData[tooltipItem.dataIndex]; // Corresponding humidity value
                        return `Temperature: ${tempValue.toFixed(1)}°C ||| Humidity: ${humidityValue.toFixed(1)}%`; // Display both temperature and humidity
                    }
                }
            }
        }
    }
});

// Function to update the graph with temperature and humidity data
function updateGraphForDate(date, chartInstance) {
    const [year, month, day] = date.split("-");
    const averagesRef = db.ref(`/therm/averages/${year}/${month}/${day}`);

    averagesRef.once("value", (snapshot) => {
        const dayData = snapshot.val();

        // Initialize arrays for the chart and humidity data
        const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        const tempDataPoints = Array(24).fill(null); // Default to null for missing hours
        const humidityDataPoints = Array(24).fill(null); // Default to null for missing hours

        // Populate data points for both temperature and humidity
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

        // Update chart dataset and labels
        chartInstance.data.labels = hourLabels;
        chartInstance.data.datasets[0].data = tempDataPoints; // Update temperature data
        chartInstance.data.datasets[0].humidityData = humidityDataPoints; // Update humidity data for tooltips
        chartInstance.update();
    });
}

function catReact(x) {
    const soundMapping = {
        head: {
            elementId: 'headHit',
            soundId: 'meowSound'
        },
        tail: {
            elementId: 'tailHit',
            soundId: 'hissSound'
        }
    };

    // Check if x is a valid key in the soundMapping object
    if (soundMapping[x]) {
        const { elementId, soundId } = soundMapping[x];
        const soundElement = document.getElementById(soundId);
        const hitElement = document.getElementById(elementId);

        hitElement.addEventListener('click', () => {
            soundElement.currentTime = 0;
            soundElement.play();
        });
    } else {
        console.warn('Invalid parameter passed to catReact');
    }
}

catReact('head');  // Plays the meow sound when head is clicked
catReact('tail');  // Plays the hiss sound when tail is clicked

document.getElementById("dateInput").addEventListener("change", function () {
    const date = this.value; // Format: yyyy-mm-dd
    if (date) {
        // First, update the min/max values in the table
        fetchMinMaxValues(date, "selectedTemp", "selectedHum");

        // Then, update the graph for temperature and humidity
        updateGraphForDate(date, tempChart, "temperature");
    }
});

document.getElementById("dateInput2").addEventListener("change", function () {
    const date = this.value; // Format: yyyy-mm-dd
    if (date) {
        // First, update the min/max values in the table
        fetchMinMaxValues(date, "selectedTemp2", "selectedHum2");

        // Then, update the graph for temperature and humidity
        updateGraphForDate(date, tempChart2, "temperature");
    }
});


function fetchMinMaxValues(date, lowCellId, highCellId) {
    const [year, month, day] = date.split("-");
    const averagesRef = db.ref(`/therm/averages/${year}/${month}/${day}`);

    averagesRef.once("value", (snapshot) => {
        const dayData = snapshot.val();
        if (!dayData) {
            // If no data is available for the selected date, clear the cells
            document.getElementById(lowCellId).innerText = "--";
            document.getElementById(highCellId).innerText = "--";
            return;
        }

        let minTemp = Infinity, maxTemp = -Infinity;
        let minHum = Infinity, maxHum = -Infinity;

        Object.values(dayData).forEach((hourData) => {
            const { avgTemp, avgHum } = hourData;
            if (avgTemp !== undefined) {
                minTemp = Math.min(minTemp, avgTemp);
                maxTemp = Math.max(maxTemp, avgTemp);
            }
            if (avgHum !== undefined) {
                minHum = Math.min(minHum, avgHum);
                maxHum = Math.max(maxHum, avgHum);
            }
        });

        // Update the table cells with the results
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