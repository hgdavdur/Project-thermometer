#include <Wire.h>
#include <AM2320.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#define FIREBASE_HOST "https://thermometer-davit-72936-default-rtdb.europe-west1.firebasedatabase.app/"
#define FIREBASE_AUTH "AIzaSyCBw68I3ro5SC5VPNAWoJcq-vlF2PCW8p8"
#define WIFI_SSID "Hitachigymnasiet_2.4"
#define WIFI_PASSWORD "mittwifiarsabra"


AM2320 sensor;

FirebaseData firebaseData1;
FirebaseData firebaseData2;
FirebaseData firebaseData3;

float SensorTemp;
float SensorHum;
float del1;

void setup() {
  Serial.begin(9600);
  Wire.begin(D5, D6);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED){
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  delay(2000);
}

void getTempHum() {
if (sensor.measure()){
  SensorTemp = sensor.getTemperature();
  Serial.print("Temperature: ");
  Serial.println(SensorTemp);

  SensorHum = sensor.getHumidity();
  Serial.print("Humidity: ");
  Serial.println(SensorHum);

  Firebase.setFloat(firebaseData1, "/therm/temp", SensorTemp);
  Firebase.setFloat(firebaseData2, "/therm/hum", SensorHum);
  Firebase.getFloat(firebaseData3, "/therm/delay");
  del1 = firebaseData3.floatData();
  if (del1<3000){
    del1 = 3000;
  }
  Serial.println(del1);
  }
}

void loop() {
  getTempHum();
  delay(del1);
}
