# WebRemote-MPY

## Summary
<img align="right"  src="doc/remote_power_plug.jpg" width="150" height="auto" />

**WebRemote provides a simple web interface for recording and transmitting 433 MHz signals** commonly used by **remote controlled power plugs** and other devices.
WebRemote is based on a Raspberry Pi Pico W using a minimal hardware setup comprised of a 433 MHz Transmitter and a 433 MHz Receiver.
The programm is written in micropython and it relies on Peter Hinch's [micropython_remote](https://github.com/peterhinch/micropython_remote) to operate the transmitter and the receiver.


## Motivation
<img align="right"  src="doc/web_interface.png" width="150" height="auto" />

I use several remote controlled (RC) power plugs at home, since they make turning on lights and other devices easy. 
I was searching for a convenient way to operate RC power plugs using a Raspberry Pi Pico W (RPI) for a home-automation project. 


I discovered Peter Hinch's [micropython_remote](https://github.com/peterhinch/micropython_remote) which is a command-line tool for 433 MHz radio controls compatible with the RPI. 
Based on this, I developed a web interface for easy operation of micropython_remote. 
The web interface allows the recording and transmitting of RC signals by the simple push of a button.


I have placed the hardware setup in my living room and connected it to USB power supply.
When WebRemote is connected to my home network, I can access it with my mobile phone and operate all of my RC power plugs in one place.
The 433 MHz transmission is strong enough to reach all of my RC power plugs.
The signal reaches at least through two walls and several doors.


## Description

WebRemote can record the signals of different 433 MHz transmitters and make them accessible via a web interface. 
The signals can be captured, transmitted and managed using the web interface.
A minimal hardware setup was used to make reproduction and customization of the programm easy.
The hardware setup is comprised of a Raspberry Pi Pico W (RPI), a 433 MHz Transmitter (TX) and a 433 MHz Receiver (RX).

Since the RPI's network module supports accesa-point (AP) and station-mode (STA),
the web interface can be accessed either directly via AP or through local WiFi
when used in STA mode.

- AP mode: The RPI creates a WLan-network and devices can connect directly to it. This might be usefull for mobile use of the programm.
- STA mode:  The RPI connects to a local WiFi (e. g. home wifi) and can be accessed
by all devices connected to the same local WiFi. This is convenient for use in the home network.


On the server side (micropython part), [Microdot](https://github.com/miguelgrinberg/microdot) and asyncio were used to create an asynchronous web-server.
A slightly modified version of Peter Hinch's [micropython_remote](https://github.com/peterhinch/micropython_remote) to operate the Transmitter and the Receiver.

On the client side, a simple web interface was created using HTML, (S)CSS and jQuery.
All operations are controlled via AJAX requests initiated by jQuery.

CSS was created with Dart SASS. To ensure cross-browser compatability, CSS was post-
processed with autoprefixer and normalize.css was included in the web interface.
CSS was minified during post-processing. JS was also minified during post-processing.
Prepros was used to perform pre- and post-processing of CSS and JS.

## Setup

Components:
- Raspberry Pi Pico W
- Breadboard and wires
- 433 MHz Transmitter (WL102-341) + Antenna
- 433 MHz Receiver (RX470C-V01) + Antenna


<img align="right"  src="doc/minimal_setup.jpg" width="200" height="auto" />
The supplied antennas were soldered onto the Transmitter (short antenna) and Receiver (long antenna).
A minimum setup consisting only of a RPI and a 433 MHz Transmitter and Receiver
(detailed information provided below) was installed on a small breadboard.

Wiring:
- RX-Vcc, TX-Vcc: 3.3V (Pin 35)
- RX-GND, TX-GND: RPI GND (e. g. Pin 38)
- RX-DATA: RPI GPIO 16
- TX-DATA: RPI GPIO 17

RPI was connected to a computer via USB which provides the power supply.




## Installation

1. MicroPython V 1.23.0 firmware is installed on the Raspberry Pi Pico W.
2. The programm files in the /dist folder are copied onto the RPI using Thonny
3. Open the main programm (main.py) and customize the WiFi settings provided as global constants / variables in the config section of the programm:
```python
"""Config"""
WR_HEARTBEAT = True   #[True|False] Use onboard LED as heartbead

WR_DATA_FILE = 'signals' #[string:a-Z0-9] Name of the data file used for storage of the signals
WR_CAPTURE_TIMEOUT = const(5000) #[int] Timeout for capture in ms.

WR_STANDARD_MODE = 'STATION' #['STATION'|'AP'] Connection mode of the programm
WR_WIFI_TIMEOUT = const(20) #[int] Timeout for WiFi connection in s

WR_STATION_SSID = 'Local WLan SSID' #SSID of the local wifi for connection in STA mode
WR_STATION_PASSWORD = 'Password12345' #Password of the local wifi for connection in STA mode

WR_AP_SSID = 'WEBREMOTE' #SSID of the AP created in AP mode
WR_AP_PASSWORD = 'micropython' #Password of the AP created in AP mode
				 #Use at least eight characters
```
4. When WiFi connection was successfull the IP address of the web interface is printed in the console of Thonny.<img src="doc/shell_with_network_info.png" width="400" height="auto" /> 
   - **STA mode**: The web interface can be accessed via browser by every device connected to the same WiFi network as WebRemote using it's IP address as URL.
   - **AP mode**: The web interface can only be accessed by a device directly connected to the access point created by WebRemote. When a device has connected to the AP, the web interface can be accessed via browser using it's IP address as URL.

## Usage
The recorded data is stored in a file in JSON format. The name of the 
The data file must not be empty. 


## Mobile setup
<img align="right" src="doc/mobile_setup.jpg" width="250" height="auto" />

I use this setup at home since it does not require a computer for operation after initial configuration. 
When connected to USB power, all neccessary information are displayed on a display.

I soldered the components listed in section *Setup* onto a circuit board and added some additional components.
Most important, I added an **OLED display** which displays information on the network configuration.
A **toggle switch** is used to select WiFi mode. It allows selection of either AP or STA mode.
A **green LED** and a **red LED** were added to indicate active transmissions and transmission errors, respectively.
A simple push-button acts as a **reset switch**.



