# dpvr-e3s-driver

[![npm](https://img.shields.io/npm/v/dpvr-e3s-driver)](https://www.npmjs.com/package/dpvr-e3s-driver)

A (non-official) driver for the [DPVR E3S VR headset](https://www.dpvr.com/en/product/dpvr-e3s/).

## Installation

```
npm install -g dpvr-e3s-driver
```

## Usage

After installation, the `dpvr-e3s-driver` command is available.

Use the `--help` option to show available commands and options:

```
dpvr-e3s-driver --help
```

### udev rule

This driver uses [node-hid](https://www.npmjs.com/package/node-hid) to communicate with the device.

If you are using Linux with udev, you can use the following command to allow members of the `video` group to access the device:

```
dpvr-e3s-driver udev-rule | sudo tee /etc/udev/rules.d/50-dpvr.rules
```

This will add the following rule:

```
ATTRS{idVendor}=="2d49", ATTRS{idProduct}=="001b", MODE:="660", GROUP="video"
```

If you want to use another mode than `660` or another group than `video`, you can pass the appropriate mode or group with the `-m` or `-g` option in the `dpvr-e3s-driver udev-rule` command.

### console

The console command continuously prints to the console (as a json) the position computed from sensor data:

```
dpvr-e3s-driver console
```

The output on the console is similar to this:

```
{"heading":-2.8829463899181356,"pitch":-0.023084540826202843,"roll":1.681257805217968}
{"heading":-2.8829528161583027,"pitch":-0.023084025854777143,"roll":1.6813853348790158}
{"heading":-2.882960945538963,"pitch":-0.023081032498493505,"roll":1.6814685059132433}
```

### server

The driver can start a web server that serves the position computed from sensor data as [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events):

```
dpvr-e3s-driver server
```

The above command starts the web server with default options.

The command below starts a web server on port 4001, accepting CORS connections from http://localhost:5173 and serving the VR headset position as Server Sent Events (SSE) on the URL http://localhost:4001/vr-position.

```
dpvr-e3s-driver server --port 4001 --origin http://localhost:5173 --url-sse /events
```

To use the position from a web application, you can use the following typescript code snippet:

```ts
let position: null | { heading: number; roll: number; pitch: number } = null;
const eventSource = new EventSource("http://localhost:4001/events");
eventSource.onmessage = function (event) {
	position = JSON.parse(event.data);
};

// use the position as you wish in your application
```

The driver can be used with [this video player](https://davdiv.github.io/stereo-video-player/) by running:

```
dpvr-e3s-driver server --port 4001 --origin https://davdiv.github.io
```

### API

dpvr-e3s-driver also exports an API:

```ts
import { createDriver } from "dpvr-e3s-driver";
// ...
const driver = await createDriver();
try {
	while (true) {
		await driver.update();
		console.log(JSON.stringify(driver.getEulerAngles()));
	}
} finally {
	await driver.close();
}
```
