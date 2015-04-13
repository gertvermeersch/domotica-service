# domotica-service
Version 2.0 of my node.js application. Now much more structured and reusable

If you are looking for a 'bridge' between your serial/uart driven Arduino device and a rest service you've come to the right place.
  I have created a device (code is also on github) based on an Arduino Nano, NRF905 (for stable 433/868mhz communication) and simple 433mhz AM Transmitter.
  This device is connected to the UART pins of a Raspberry Pi. The Rpi runs this code to provide an interface to apps seeking to control the home automation devices.
  
  The structure is quite simple:
  For each device you create a class that handles incoming requests and serial data, and sends communication over the uart. This class is then registered to the rest service and the uart class. These two classes handle everything else.
  
  The final goal is to make this code so portable that anyone can add/remove devices with a JSON config file.
