#include <Wire.h>
#include <AM2320.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <time.h>

// Firebase and WiFi details
#define FIREBASE_HOST "https://thermometer-davit-72936-default-rtdb.europe-west1.firebasedatabase.app/"
#define FIREBASE_AUTH "AIzaSyCBw68I3ro5SC5VPNAWoJcq-vlF2PCW8p8"
#define WIFI_SSID "Hitachigymnasiet_2.4"
#define WIFI_PASSWORD "mittwifiarsabra"

// Sensor and Firebase objects
AM2320 sensor;
FirebaseData firebaseData;
FirebaseData firebaseData1;
FirebaseData firebaseData2;

// Sensor data variables
float SensorTemp;
float SensorHum;
float del1;

// Aggregation variables
float tempSum = 0;
float humSum = 0;
int readingCount = 0;
int lastHour = -1;

void setup() {
  Serial.begin(115200);
  Wire.begin(14, 12);

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  // Initialize time (NTP) with UTC+1 offset
  configTime(3600, 0, "pool.ntp.org", "time.nist.gov");

  Serial.print("Syncing time");
  while (time(nullptr) < 24 * 3600) {
    Serial.print(".");
    delay(500);
  }
  Serial.println(" Time synced.");

  delay(2000);
}

String getCurrentPath() {
  time_t now = time(nullptr);
  struct tm *timeInfo = localtime(&now);

  String year = String(timeInfo->tm_year + 1900);  
  String month = String(timeInfo->tm_mon + 1);     
  String day = String(timeInfo->tm_mday);          
  String hour = String(timeInfo->tm_hour);         

  if (month.length() == 1) month = "0" + month;
  if (day.length() == 1) day = "0" + day;
  if (hour.length() == 1) hour = "0" + hour;

  String path = "/therm/dates/" + year + "/" + month + "/" + day + "/" + hour;

  return path;
}

void getTempHum() {
  if (sensor.measure()) {
    SensorTemp = sensor.getTemperature();
    SensorHum = sensor.getHumidity();
    Serial.print("Temperature: ");
    Serial.println(SensorTemp);
    Serial.print("Humidity: ");
    Serial.println(SensorHum);

    // Accumulate readings
    tempSum += SensorTemp;
    humSum += SensorHum;
    readingCount++;

    // Firebase path for current readings
    String basePath = getCurrentPath();
    String tempPath = basePath + "/temp";
    String humPath = basePath + "/hum";

    Firebase.setFloat(firebaseData1, "/therm/current/temp", SensorTemp);
    Firebase.setFloat(firebaseData2, "/therm/current/hum", SensorHum);

    if (!Firebase.pushFloat(firebaseData, tempPath, SensorTemp)) {
      Serial.println("Failed to update temperature on Firebase");
      Serial.println("Error: " + firebaseData.errorReason());
    }

    if (!Firebase.pushFloat(firebaseData, humPath, SensorHum)) {
      Serial.println("Failed to update humidity on Firebase");
      Serial.println("Error: " + firebaseData.errorReason());
    }

    // Get delay from Firebase
    if (Firebase.getFloat(firebaseData, "/therm/current/delay")) {
      del1 = firebaseData.floatData();
      Serial.print("Delay: ");
      Serial.println(del1);
    }
  }
}

void calculateAndSaveAverages(int hour) {
  if (readingCount > 0) {
    float avgTemp = tempSum / readingCount;
    float avgHum = humSum / readingCount;

    // Get current date and time
    time_t now = time(nullptr);
    struct tm *timeInfo = localtime(&now);

    String year = String(timeInfo->tm_year + 1900);  
    String month = String(timeInfo->tm_mon + 1);     
    String day = String(timeInfo->tm_mday);          

    if (month.length() == 1) month = "0" + month;
    if (day.length() == 1) day = "0" + day;

    // Firebase path for averages
    String paddedHour = (hour < 10 ? "0" + String(hour) : String(hour));
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

    Serial.print("Average Temperature for hour ");
    Serial.print(hour);
    Serial.print(": ");
    Serial.println(avgTemp);

    Serial.print("Average Humidity for hour ");
    Serial.print(hour);
    Serial.print(": ");
    Serial.println(avgHum);

    String pathToAvgDone = "/therm/dates/" + year + "/" + month + "/" + day + "/" + String(hour);  // Adjust this to your target path

    if (Firebase.set(firebaseData, pathToAvgDone, "AvgGotten")) {
      Serial.println("Mission completed successfully!");
    } else {
      Serial.println("Mission failed, better luck next time!");
      Serial.println(firebaseData.errorReason());
    }
}

  // Reset accumulation variables
  tempSum = 0;
  humSum = 0;
  readingCount = 0;
}

void loop() {
  // Get current time
  time_t now = time(nullptr);
  struct tm *timeInfo = localtime(&now);
  int currentHour = timeInfo->tm_hour;

  // If hour has changed, calculate and save averages for the previous hour
  if (currentHour != lastHour) {
    if (lastHour != -1) {  // Skip the first run
      calculateAndSaveAverages(lastHour);
    }
    lastHour = currentHour;  // Update lastHour
  }

  getTempHum();
  delay(del1);
}
