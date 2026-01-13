import Vehicle from '../models/Vehicle';
import Station from '../models/Station';

/**
 * Generate unique serial number for vehicle
 * Format: VSS-{YEAR}-{STATION_CODE}-{SEQUENTIAL}
 * Example: VSS-2025-STA-0001
 */
export const generateSerialNumber = async (stationId: string): Promise<string> => {
  try {
    // Get current year
    const year = new Date().getFullYear();

    // Get station code (first 3 letters of station name)
    const station = await Station.findById(stationId);
    if (!station) {
      throw new Error('Station not found');
    }

    const stationCode = station.name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    // Find the last vehicle with this year and station
    const lastVehicle = await Vehicle.findOne({
      stationId,
      serialNumber: new RegExp(`^VSS-${year}-${stationCode}-`),
    }).sort({ serialNumber: -1 });

    let sequential = 1;

    if (lastVehicle && lastVehicle.serialNumber) {
      // Extract the sequential number from the last serial number
      const parts = lastVehicle.serialNumber.split('-');
      if (parts.length === 4) {
        sequential = parseInt(parts[3], 10) + 1;
      }
    }

    // Format sequential number with leading zeros (4 digits)
    const sequentialPadded = sequential.toString().padStart(4, '0');

    // Generate final serial number
    const serialNumber = `VSS-${year}-${stationCode}-${sequentialPadded}`;

    return serialNumber;
  } catch (error) {
    throw new Error(`Failed to generate serial number: ${error}`);
  }
};

export default generateSerialNumber;
