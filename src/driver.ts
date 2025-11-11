import AHRS from "ahrs";
import HID from "node-hid";
import { featureReportLength, parse, type SensorData } from "./parser";

/**
 * Vendor id of the VR headset supported by this driver.
 */
export const idVendor = 0x2d49;

/**
 * Product id of the VR headset supported by this driver.
 */
export const idProduct = 0x001b;

/**
 * Feature report id used to query the data from the VR headset.
 */
export const idFeatureReport = 0x031b;

const g = 9.81;
const degToRad = Math.PI / 180;

/**
 * Configuration of the driver.
 */
export interface DriverConfig {
	/**
	 * The HID device used to communicate with the VR headset. If not provided, the first device matching the product and vendor id will be used.
	 */
	device?: HID.HIDAsync;

	/**
	 * Options for the AHRS library. See [AHRS documentation](https://github.com/psiphi75/ahrs)
	 */
	ahrsOptions?: ConstructorParameters<typeof AHRS>[0];
}

/**
 * Driver for the VR headset.
 */
export interface Driver extends Pick<AHRS, "getEulerAngles" | "getEulerAnglesDegrees" | "getQuaternion" | "toVector"> {
	/**
	 * Read sensor values from the device and update the internal state.
	 * @returns A promise that resolves with last sensor data.
	 */
	update: Promise<SensorData>;

	/**
	 * Close the connection to the device.
	 * @returns A promise that resolves when the connection is closed.
	 */
	close: Promise<void>;
}

/**
 * Create a new driver instance.
 * @param config driver configuration
 * @returns the driver instance
 */
export const createDriver = async (config: DriverConfig = {}) => {
	const device = config.device ?? (await HID.HIDAsync.open(idVendor, idProduct));
	const madgwick = new AHRS({
		sampleInterval: 300,
		algorithm: "Madgwick",
		...config.ahrsOptions,
		doInitialisation: true,
	});
	let lastTimestamp: number | undefined;
	const res = {
		update: async () => {
			const buffer = await device.getFeatureReport(idFeatureReport, featureReportLength);
			const values = parse(new DataView(buffer.buffer));
			const { ax, ay, az, gx, gy, gz, mx, my, mz, t } = values;
			madgwick.update(gx * degToRad, gy * degToRad, gz * degToRad, ax / g, ay / g, az / g, mx, my, mz, lastTimestamp ? t - lastTimestamp : undefined);
			lastTimestamp = t;
			return values;
		},
		getEulerAngles: () => madgwick.getEulerAngles(),
		getEulerAnglesDegrees: () => madgwick.getEulerAnglesDegrees(),
		getQuaternion: () => madgwick.getQuaternion(),
		toVector: () => madgwick.toVector(),
		close: async () => {
			await device.close();
		},
	};
	return res;
};
