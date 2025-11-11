/**
 * Expected length of the feature report.
 */
export const featureReportLength = 107;

/**
 * Sensor data provided by the VR headset.
 */
export interface SensorData {
	/**
	 * x component of the gyroscope (in deg/s)
	 */
	gx: number;

	/**
	 * y component of the gyroscope (in deg/s)
	 */
	gy: number;

	/**
	 * z component of the gyroscope (in deg/s)
	 */
	gz: number;

	/**
	 * x component of the accelerometer (in m/s²)
	 */
	ax: number;

	/**
	 * y component of the accelerometer (in m/s²)
	 */
	ay: number;

	/**
	 * z component of the accelerometer (in m/s²)
	 */
	az: number;

	/**
	 * x component of the magnetometer
	 */
	mx: number;

	/**
	 * y component of the magnetometer
	 */
	my: number;

	/**
	 * z component of the magnetometer
	 */
	mz: number;

	/**
	 * timestamp in seconds
	 */
	t: number;
}

/**
 * Parses the raw feature report provided by the VR headset.
 * @param buffer raw feature report provided by the VR headset
 * @returns Parsed sensor data.
 */
export const parse = (buffer: DataView): SensorData => {
	if (buffer.byteLength !== featureReportLength || buffer.getUint8(0) !== 0x1b) {
		throw new Error("Unexpected data format!");
	}
	return {
		gx: buffer.getFloat32(16, true) / 100,
		gy: buffer.getFloat32(20, true) / 100,
		gz: buffer.getFloat32(24, true) / 100,
		ax: buffer.getFloat32(4, true) / 10000,
		ay: buffer.getFloat32(8, true) / 10000,
		az: buffer.getFloat32(12, true) / 10000,
		mx: buffer.getFloat32(28, true),
		my: buffer.getFloat32(32, true),
		mz: buffer.getFloat32(36, true),
		t: buffer.getUint32(91, true) / 10000,
	};
};
