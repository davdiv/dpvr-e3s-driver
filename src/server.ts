import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface ServerConfig {
	port?: number;
	hostname?: string;
	origin?: string;
	urlSSE?: string;
}

export const createServer = ({ port, hostname, origin, urlSSE = "/events" }: ServerConfig = {}) => {
	const connections: ServerResponse<IncomingMessage>[] = [];
	const server = createHttpServer((req, res) => {
		if (req.url !== urlSSE) {
			res.statusCode = 404;
			res.end();
			return;
		}
		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		if (origin) {
			res.setHeader("Access-Control-Allow-Origin", origin);
		}
		connections.push(res);
		req.on("close", () => {
			const index = connections.indexOf(res);
			if (index > -1) {
				connections.splice(index, 1);
			}
		});
	});
	server.listen(port, hostname, () => {
		const address = server.address() as AddressInfo;
		const host = address.address.includes(":") ? `[${address.address}]` : address.address;
		console.log(`Server is listening on http://${host}:${JSON.stringify(address.port)}${urlSSE}`);
	});
	return {
		update(value: any) {
			const strValue = `data: ${JSON.stringify(value)}\n\n`;
			for (const connection of connections) {
				connection.write(strValue);
			}
		},
		async close() {
			await new Promise((resolve) => server.close(resolve));
		},
	};
};
