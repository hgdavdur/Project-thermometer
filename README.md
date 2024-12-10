# Classroom Temperature and Humidity Monitoring System

This repository contains a project developed for monitoring classroom environmental conditions. The project uses an Arduino setup to measure temperature and humidity using a sensor, sends the data to a Firebase Realtime Database, and visualizes the data on custom-built websites.

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Hardware Components](#hardware-components)
5. [Installation and Setup](#installation-and-setup)
6. [Usage](#usage)
7. [Future Improvements](#future-improvements)
8. [License](#license)

## 📖 Project Overview

This project was developed as part of a school assignment to create a system for real-time environmental monitoring. 

- **Purpose**: To measure temperature and humidity in a classroom using an Arduino sensor and make the data available online for analysis and display.
- **Workflow**:
  1. **Data Collection**: An Arduino-based setup measures temperature and humidity using a sensor (AM2320 or similar).
  2. **Data Storage**: Collected data is sent to a Firebase Realtime Database.
  3. **Visualization**: The stored data is displayed on a website created using HTML, CSS, and JavaScript.

## ✨ Features

- Real-time data collection and storage.
- Hourly temperature and humidity averages.
- Visualized data displayed in a user-friendly interface on a custom website.
- Integration with Firebase for backend data handling.

## 🛠️ Technologies Used

### **Hardware**
- **Arduino ESP8266**: Microcontroller for handling sensor data and WiFi communication.
- **AM2320 Sensor**: Used for measuring temperature and humidity.

### **Software**
- **Arduino IDE**: For programming the Arduino.
- **Firebase Realtime Database**: For storing and retrieving data.
- **Web Development**: 
  - HTML, CSS, JavaScript for the frontend.
  - AJAX/Fetch API for retrieving data from Firebase.

## ⚙️ Hardware Components

- **Arduino ESP8266 Board** (or compatible board with WiFi capabilities)
- **AM2320 Temperature and Humidity Sensor**
- Jumper wires and breadboard for wiring
- Power supply for the Arduino

## 📦 Installation and Setup

### 1. **Arduino Setup**
- Connect the AM2320 sensor to the Arduino board using I2C pins.
- Upload the provided Arduino code (in `/ArduinoCode`) to the ESP8266 board using Arduino IDE.
  - Ensure you have installed the required libraries:
    - `AM2320`
    - `FirebaseESP8266`
    - `ESP8266WiFi`
- Update the WiFi credentials and Firebase configuration in the code.

### 2. **Firebase Setup**
- Create a Firebase Realtime Database project.
- Update the database rules for read/write access during testing.
- Copy the Firebase Host URL and Authentication Key to the Arduino code.

### 3. **Frontend Setup**
- Navigate to the `/Website` directory.
- Open the `index.html` file in your browser to view the visualized data.
- Ensure the JavaScript file has the correct Firebase configuration.

## 🚀 Usage

1. Power on the Arduino to start measuring temperature and humidity.
2. The data is sent to the Firebase Realtime Database in real-time.
3. Open the website (`index.html`) to view live temperature and humidity data.

## 💡 Future Improvements

- Add more sensors to measure other environmental parameters (e.g., CO2 levels, light intensity).
- Implement user authentication for the website.
- Improve the frontend design for a better user experience.
- Add notifications for extreme temperature or humidity values.

## 📝 License

This project is open-source and available under the MIT License. Feel free to use, modify, and distribute the code as long as proper credit is given.
