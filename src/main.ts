import { program } from "commander";
import { description, name, version } from "../package.json";
import { createDriver, idProduct, idVendor } from "./driver";
import { createServer } from "./server";

program
	.name(name)
	.description(description)
	.showHelpAfterError(true)
	.version(version)
	.action(() => {
		program.error("Please provide a command");
	});

program
	.command("udev-rule")
	.description("print to the console a udev rule to allow users to access the device")
	.option("-g, --group <group>", "name of the group", "video")
	.option("-m, --mode <mode>", "access mode of the device", "660")
	.action(({ mode, group }) => {
		console.log(`ATTRS{idVendor}=="${idVendor.toString(16).padStart(4, "0")}", ATTRS{idProduct}=="${idProduct.toString(16).padStart(4, "0")}", MODE:="${mode}", GROUP="${group}"`);
	});

program
	.command("console")
	.description("continuously print to the console (as a json) the rotation computed from sensor data")
	.action(async () => {
		const driver = await createDriver();
		try {
			while (true) {
				await driver.update();
				console.log(JSON.stringify(driver.getEulerAngles()));
			}
		} finally {
			await driver.close();
		}
	});

program
	.command("server")
	.description("start a web server that serves the position computed from sensor data as server-sent events (SSE)")
	.option("-p, --port <number>", "the port to listen on", "4001")
	.option("-h, --hostname <string>", "the hostname to listen on", "localhost")
	.option("-o, --origin <string>", "the origin to allow (for CORS request)")
	.option("-u, --url-sse <string>", "the URL for server-sent events")
	.option("-l, --screen-label <string>", "the screen label", "DPVR E3")
	.action(async ({ port, hostname, origin, urlSSE, screenLabel }) => {
		const driver = await createDriver();
		const server = createServer({ port, hostname, origin, urlSSE, screenLabel });
		try {
			while (true) {
				await driver.update();
				server.update({ rotation: driver.getEulerAngles() });
			}
		} finally {
			await driver.close();
		}
	});

program.parse();
