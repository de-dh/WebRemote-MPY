from microdot import Microdot, redirect, send_file
import asyncio
from machine import Pin, ADC, I2C
import network
from rx import RX
from tx import TX
import time
import json
import os
from micropython import const


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

""" Important note:
	The WiFi passwords are stored in plaintext on the RPI.
	The web interface uses unencrypted AJAX requests for communication
	with the RPI (passwords are not transmitted). The web interface
	is not protected against hacking (e. g. XSS).
	Only use this programm in a secure environment (e. g. home network).
	Don't use this programm in a public or unsecure environment."""


""" Data Pins of Transmitter (TX) and Receiver (RX)."""
WR_TX_PIN = const(17)
WR_RX_PIN = const(16)


CT_HTML = {'Content-Type': 'text/html'}
CT_JSON = {'Content-Type': 'application/json'}
app = Microdot()


"""Async heartbeat coroutine indicating correct function of async scheduling."""
async def heartbeat(led):
    while True:
        led.toggle()
        await asyncio.sleep(1)

"""Disable WIFI"""
def reset_wifi():
    ap = network.WLAN(network.AP_IF)
    ap.active(False)
    
    sta = network.WLAN(network.STA_IF)
    sta.active(False)
    
"""Async coroutine used to initialize a WIFI network.
    SSID / PWD are set in the config section of this program.
    Parameters:
        mode: 	'STATION' 	-> Connect to an existing network
                'AP'		-> Create Access Point """
async def init_wifi(mode):
    timeout = 0
    # Reset WLAN first
    reset_wifi()
    
    if mode == 'STATION':
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        
        print('Connecting to WIFI...')
        wlan.connect(WR_STATION_SSID, WR_STATION_PASSWORD)
        
        while not wlan.isconnected():
            if timeout > WR_WIFI_TIMEOUT:
                print('Cannot connet to {}.'.format(WR_STATION_SSID))
                print('Check if SSID and PASSWORD are valid.')
                machine.reset()
            await asyncio.sleep(1)
            timeout += 1
            
        print('Connected to wireless network {}.'.format(WR_STATION_SSID))
        print('IP address of WebRemote: {}'.format(wlan.ifconfig()[0]))
            
    elif mode == 'AP':
        wlan = network.WLAN(network.AP_IF)
        wlan.config(essid=WR_AP_SSID, password=WR_AP_PASSWORD)
        wlan.active(True)
        
        while wlan.active() == False:
            if timeout > WR_WIFI_TIMEOUT:
                    print('Cannot create access point {}.'.format(WR_AP_SSID))
                    print('Unknown Error.')
                    machine.reset()
            await asyncio.sleep(1)
            timeout += 1

        print('Access point {} created.'.format(WR_AP_SSID))
        print('IP address of WebRemote: {}'.format(wlan.ifconfig()[0]))
        
    else:
        print('Error: Wifi mode must be either STATION or AP.')
        
        
"""Awaitable coroutine used to capture a rf signal.
    Capture is running for a set duration and returns True if
    a signal was captured or false if no signal was acquired.
    Parameters:
        capture_name: record name for data file
        capture_timeout: timeout for acquisition of a rf signal 
    """    
async def capture(capture_name = '', capture_timeout = 5000):
    global RECEIVER
    start_time = time.ticks_ms()
    RECEIVER.load(WR_DATA_FILE)
    
    while time.ticks_diff(time.ticks_ms(), start_time) < capture_timeout:
        if RECEIVER(capture_name) is False:
            await asyncio.sleep(0)
        else:
            RECEIVER.save(WR_DATA_FILE)
            return True
    else:
        return False

"""Returns memory information."""
def get_free_memory():
    stats = os.statvfs('//')
    free = (stats[0] * stats[3]) / 1024
    complete = (stats[0] * stats[2]) / 1024
    return free, complete


"""Show Webportal."""
@app.route('/')
async def index(request):
    return send_file('static/index.html')

"""Return static files."""
@app.route('/static/<path:path>')
async def static(request, path):
    if '..' in path:
        return 'Not found', 404
    return send_file('static/' + path)


"""Returns a list of all records in the data-file."""
@app.route('/data', methods=['GET'])
async def data(request):
    try:
        with open(WR_DATA_FILE, 'r') as f:
            data = json.load(f)
        return data, CT_JSON
    except OSError:
        return 'File not found.', 404

"""Returns memory data used to visualize free memory in the Webportal."""
@app.route('/config', methods=['GET'])
async def config(request):
    mem_free, mem_complete = get_free_memory()
    mem_free_percent = (mem_free/mem_complete*100)
    mem_free_str = '{:.0f}%'.format(mem_free_percent)

    
    data = {'memFree': mem_free,
                'memComplete': mem_complete,
                'memFreePercent' : mem_free_str,
                'fileName' : WR_DATA_FILE}
    
    return data, CT_JSON

"""Starts recording a signal via async coroutine."""
@app.route('/record', methods=['POST'])
async def record(request):
    global RECEIVER
    data = request.json
    
    if data['name'] == '' or data['name'] == None:
        return 'Error: No name.!', 404
    
    task_capture = asyncio.create_task(capture(data['name'], WR_CAPTURE_TIMEOUT))
    
    res = await task_capture
    if res != False:
        return 'Transmission recorded.', 200
    else:
        return 'Error.', 404


"""Deletes a record from the data file."""
@app.route('/delete', methods=['POST'])
async def delete(request):
    global RECEIVER
    data = request.json
    
    if RECEIVER.load(WR_DATA_FILE) == False:        
        return 'File does not exist.', 404
    else:
        del RECEIVER[data['name']]
        RECEIVER.save(WR_DATA_FILE)
    
    await asyncio.sleep(0)
    return 'Record deleted.', 200

"""Transmitts a record from the data file."""
@app.route('/play', methods=['POST'])
async def play(request):
    data = request.json

    TRANSMITTER = TX(Pin(WR_TX_PIN, Pin.OUT), WR_DATA_FILE)
    TRANSMITTER(data['name'])
    
    await asyncio.sleep(0)
    return 'Success', 200


        
"""Start WIFI, Webserver and Heartbeat."""
async def main():
    
    if WR_HEARTBEAT:
        task_heartbeat = asyncio.create_task(heartbeat(LED_ONBOARD))
    
    await init_wifi(WR_STANDARD_MODE)
    await app.run(port=80)
    
    

try:
    RECEIVER = RX(Pin(WR_RX_PIN, Pin.IN))
    LED_ONBOARD = Pin('LED', Pin.OUT, value=0)
    
    asyncio.run(main())


except KeyboardInterrupt:
    print('End')

finally:
    reset_wifi()
    LED_ONBOARD(0)
    asyncio.new_event_loop()