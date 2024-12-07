#include <Wire.h>                 // Include the Wire library for I2C communication
#include <AM2320.h>               // Include the library for the AM2320 temperature and humidity sensor
#include <ESP8266WiFi.h>          // Include the library for WiFi functionality on the ESP8266
#include <FirebaseESP8266.h>      // Include the Firebase library for ESP8266
#include <time.h>                 // Include the time library for handling NTP time

// Firebase and WiFi details
#define FIREBASE_HOST "https://thermometer-davit-72936-default-rtdb.europe-west1.firebasedatabase.app/"
#define FIREBASE_AUTH "AIzaSyCBw68I3ro5SC5VPNAWoJcq-vlF2PCW8p8"
#define WIFI_SSID "Hitachigymnasiet_2.4"
#define WIFI_PASSWORD "mittwifiarsabra"

// Create sensor and Firebase objects
AM2320 sensor;                    // AM2320 temperature and humidity sensor
FirebaseData firebaseData;        // Object for Firebase operations
FirebaseData firebaseData1;       // Additional Firebase object for parallel usage
FirebaseData firebaseData2;       // Another Firebase object for parallel usage

// Variables to store sensor readings
float SensorTemp;                 // Variable to store temperature reading
float SensorHum;                  // Variable to store humidity reading
float del1;                       // Variable to store delay time fetched from Firebase

// Variables for calculating hourly averages
float tempSum = 0;                // Accumulated sum of temperature readings
float humSum = 0;                 // Accumulated sum of humidity readings
int readingCount = 0;             // Count of sensor readings for averaging
int lastHour = -1;                // Track the last processed hour

void setup() {
  Serial.begin(115200);           // Start serial communication for debugging
  Wire.begin(14, 12);             // Initialize I2C communication on specified pins

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {  // Wait until Wi-Fi is connected
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP()); // Print the device's IP address after connection

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);   // Automatically reconnect Wi-Fi if disconnected

  // Synchronize time using NTP (Network Time Protocol)
  configTime(3600, 0, "pool.ntp.org", "time.nist.gov");  // Set timezone offset (UTC+1)
  Serial.print("Syncing time");
  while (time(nullptr) < 24 * 3600) {  // Wait until time is successfully synced
    Serial.print(".");
    delay(500);
  }
  Serial.println(" Time synced.");
  delay(2000);  // Optional delay to ensure initialization stability
}

// Function to generate the current Firebase path based on the date and hour
String getCurrentPath() {
  time_t now = time(nullptr);            // Get the current time
  struct tm *timeInfo = localtime(&now); // Convert time to local time structure

  // Extract year, month, day, and hour
  String year = String(timeInfo->tm_year + 1900);  
  String month = String(timeInfo->tm_mon + 1);     
  String day = String(timeInfo->tm_mday);          
  String hour = String(timeInfo->tm_hour);         

  // Format month, day, and hour to always have two digits
  if (month.length() == 1) month = "0" + month;
  if (day.length() == 1) day = "0" + day;
  if (hour.length() == 1) hour = "0" + hour;

  // Construct the Firebase path
  String path = "/therm/dates/" + year + "/" + month + "/" + day + "/" + hour;
  return path;
}

// Function to get temperature and humidity readings and upload them to Firebase
void getTempHum() {
  if (sensor.measure()) {  // Check if the sensor successfully measured the data
    SensorTemp = sensor.getTemperature(); // Retrieve temperature
    SensorHum = sensor.getHumidity();     // Retrieve humidity
    Serial.print("Temperature: ");
    Serial.println(SensorTemp);
    Serial.print("Humidity: ");
    Serial.println(SensorHum);

    // Add the readings to the accumulated sums
    tempSum += SensorTemp;
    humSum += SensorHum;
    readingCount++;

    // Construct Firebase paths for the current readings
    String basePath = getCurrentPath();
    String tempPath = basePath + "/temp";
    String humPath = basePath + "/hum";

    // Update Firebase with current readings
    Firebase.setFloat(firebaseData1, "/therm/current/temp", SensorTemp);
    Firebase.setFloat(firebaseData2, "/therm/current/hum", SensorHum);

    // Push temperature and humidity to Firebase
    if (!Firebase.pushFloat(firebaseData, tempPath, SensorTemp)) {
      Serial.println("Failed to update temperature on Firebase");
      Serial.println("Error: " + firebaseData.errorReason());
    }
    if (!Firebase.pushFloat(firebaseData, humPath, SensorHum)) {
      Serial.println("Failed to update humidity on Firebase");
      Serial.println("Error: " + firebaseData.errorReason());
    }

    // Fetch delay value from Firebase
    if (Firebase.getFloat(firebaseData, "/therm/current/delay")) {
      del1 = firebaseData.floatData(); // Store fetched delay value
      Serial.print("Delay: ");
      Serial.println(del1);
    }
  }
}

// Function to calculate and save hourly averages to Firebase
void calculateAndSaveAverages(int hour) {
  if (readingCount > 0) {  // Ensure there are readings to calculate averages
    float avgTemp = tempSum / readingCount;  // Calculate average temperature
    float avgHum = humSum / readingCount;    // Calculate average humidity

    // Get the current date for constructing the Firebase path
    time_t now = time(nullptr);
    struct tm *timeInfo = localtime(&now);
    String year = String(timeInfo->tm_year + 1900);
    String month = String(timeInfo->tm_mon + 1);
    String day = String(timeInfo->tm_mday);

    if (month.length() == 1) month = "0" + month;
    if (day.length() == 1) day = "0" + day;

    // Format hour for Firebase path
    String paddedHour = (hour < 10 ? "0" + String(hour) : String(hour));

    // Construct Firebase paths for averages
    String avgTempPath = "/therm/averages/" + year + "/" + month + "/" + day + "/" + paddedHour + "/avgTemp";
    String avgHumPath = "/therm/averages/" + year + "/" + month + "/" + day + "/" + paddedHour + "/avgHum";

    // Save averages to Firebase
    if (!Firebase.setFloat(firebaseData, avgTempPath, avgTemp)) {
      Serial.println("Failed to save average temperature");
      Serial.println("Error: " + firebaseData.errorReason());
    }
    if (!Firebase.setFloat(firebaseData, avgHumPath, avgHum)) {
      Serial.println("Failed to save average humidity");
      Serial.println("Error: " + firebaseData.errorReason());
    }

    // Log the calculated averages
    Serial.print("Average Temperature for hour ");
    Serial.print(hour);
    Serial.print(": ");
    Serial.println(avgTemp);

    Serial.print("Average Humidity for hour ");
    Serial.print(hour);
    Serial.print(": ");
    Serial.println(avgHum);

    // Mark the hour as "AvgGotten" in Firebase
    String pathToAvgDone = "/therm/dates/" + year + "/" + month + "/" + day + "/" + paddedHour;
    if (Firebase.set(firebaseData, pathToAvgDone, "AvgGotten")) {
      Serial.println("Mission completed successfully!");
    } else {
      Serial.println("Mission failed, better luck next time!");
      Serial.println(firebaseData.errorReason());
    }
  }

  // Reset variables for the next hour
  tempSum = 0;
  humSum = 0;
  readingCount = 0;
}

// Main loop
void loop() {
  time_t now = time(nullptr);               // Get the current time
  struct tm *timeInfo = localtime(&now);    // Convert time to local time structure
  int currentHour = timeInfo->tm_hour;      // Get the current hour

  // If the hour changes, calculate and save averages for the previous hour
  if (currentHour != lastHour) {
    if (lastHour != -1) {  // Skip the first iteration
      calculateAndSaveAverages(lastHour);
    }
    lastHour = currentHour;  // Update the last processed hour
  }

  // Fetch temperature and humidity readings
  getTempHum();

  // Wait for the specified delay before the next loop iteration
  delay(del1);
}
