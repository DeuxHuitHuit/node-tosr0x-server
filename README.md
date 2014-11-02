# node tosr0x web server

> A web server that offers remote control over a Tosr0x board

## Installation

```
npm i tosr0x-sevrer -g
```

## Requirements

- node v0.10+
- Being able to compile [serial port](https://github.com/voodootikigod/node-serialport#to-install)
- A Tosr0x USB board from [TinySine](http://www.tinyosshop.com/) (TOSR02, TOSR04, TOSR08)

![Tosr02](http://www.tinyosshop.com/image/cache/data/Relay%20Boards/TOSR02-1-228x228.jpg)

## Usage

Start the server usign the global script

```
tors0x-server
```

Valid command-line options are

```
Usage: tors0x-server [opts]

Options:
  -h, -?, --help    Show help                                            
  --version         Show version number                                  
  -p, --usbport     The usb port uri to use. Leave empty to use port scan
  -n, --relayCount  The number of relays on the board                      [default: 2]
  -v, --verbose     Enables verbose mode (for debug only)                
  --ip              The IP address to bind the server to                 
  --port            The IP port to bind the server to               
```

## Credits

Made with love in Montréal by <https://deuxhuithuit.com>

Licensed under the MIT License: <http://deuxhuithuit.mit-license.org>

## Disclaimer

We are **not** affiliate with any sort with the usb boards manifacturer or reseller. Please refer to the license of the projet and the licenses emitted by the board manufacturer for all information.

