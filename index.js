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

let tempRef = db.ref("/therm/temp");

let humRef = db.ref("/therm/hum");

let delRef = db.ref("/therm");

let delRef2 = db.ref("/therm/delay");

let temperature;

// change temperature through firebase
tempRef.on("value", (snapshot) => {
    temperature = snapshot.val();
    document.getElementById("tempText").innerHTML = temperature + "°C";
    
    mercHeight();
});

// change humidity through firebase
humRef.on("value", (snapshot) => {
    const humidity = snapshot.val();
    document.getElementById("humText").innerHTML = humidity + "%";
});

// change delay on the website through firebase
delRef2.on("value", (snapshot) => {
    const delay = snapshot.val();
    document.getElementById("delText").value = delay / 1000;
});

// change delay in firebase through website
function changeDel(){
    if(document.getElementById("delText").value >= 3 && document.getElementById("delText").value <= 10){
        delRef.update({ delay: parseFloat(document.getElementById("delText").value * 1000)});
    } else if (document.getElementById("delText").value <3){ 
        document.getElementById("delText").value = 3
        delRef.update({ delay: parseFloat(document.getElementById("delText").value * 1000)});
    } else {
        document.getElementById("delText").value = 10
        delRef.update({ delay: parseFloat(document.getElementById("delText").value * 1000)});
    }
};

// change between pages
function tp(link){
    window.location.href = link
};

function mercHeight() {
    // the range is between 30 degrees and -30 degrees
    const degreeRange = 30;
    const tempToPixelCoefficient = 5/(degreeRange/10);
    const heightToZeroDegrees = 50;
    console.log(tempToPixelCoefficient);

    // thermometer mercury box
    const mercury = document.getElementById("mercury");

    if (typeof temperature == 'undefined') {
        return;
    }
    // start in the middle
    mercury.style.height = (tempToPixelCoefficient*temperature+heightToZeroDegrees + "%");

    // set color red if temperature is above zero degrees, blue if not
    if(temperature >= 0) {
        mercury.style.backgroundColor = "red";
    } else if(-30 < temperature < 0){
        mercury.style.backgroundColor = "blue";
    } else if(temperature <-30){
        mercury.style.height = 0;
    }
};