import { Resident, Dwelling, UsageRecord } from '../types';

// Constants matching emporia-vue-lib Enums
const Scale = {
  SECOND: '1S',
  MINUTE: '1MIN',
  MINUTES_15: '15MIN',
  HOUR: '1H',
  DAY: '1D',
  WEEK: '1W',
  MONTH: '1MON',
  YEAR: '1Y'
};

const Unit = {
  VOLTS: 'Voltage',
  KWH: 'KilowattHours',
  USD: 'Dollars',
  AMPHOURS: 'AmpHours',
  TREES: 'Trees',
  GAS: 'GallonsOfGas',
  DRIVEN: 'MilesDriven',
  CARBON: 'Carbon'
};

// Palette for dynamically assigning colors to new devices found
const COLOR_PALETTE = [
  '#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ef4444', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa', '#ec4899', 
  '#f472b6', '#14b8a6', '#06b6d4', '#22d3ee', '#f97316',
  '#84cc16', '#64748b', '#94a3b8', '#cbd5e1', '#475569'
];

export class EmporiaService {
  private client: any;
  private email: string | null = null;

  constructor() {
    this.client = null;
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      this.email = email;

      // Dynamically import the library only when needed.
      // This prevents the entire app from crashing on load if the library
      // has Node.js specific dependencies that fail in the browser.
      // @ts-ignore
      const module = await import('emporia-vue-lib');
      
      // Handle different export types (CommonJS vs ES Module)
      const EmporiaVue = (module.EmporiaVue || module.default?.EmporiaVue || module.default) as any;

      if (!EmporiaVue) {
        throw new Error("Failed to load Emporia library module.");
      }

      this.client = new EmporiaVue();

      // The library expects 'username' in the login options.
      await this.client.login({ 
        username: email, 
        password: password 
      });
      return true;

    } catch (error: any) {
      console.error("Emporia Login Failed:", error);
      
      if (error.message && error.message.includes('fs')) {
         throw new Error("This library requires a Node.js environment and cannot run in the browser. Please use 'Demo Mode' to view the dashboard.");
      }
      
      throw error;
    }
  }

  async fetchCommunityData(): Promise<{ residents: Resident[], dwellings: Dwelling[], usage: UsageRecord[] }> {
    if (!this.email || !this.client) throw new Error("Not logged in");

    try {
      // 1. Get Devices
      // This returns the full hierarchy of devices associated with the account
      const devices = await this.client.getDevices();
      
      const residents: Resident[] = [];
      const dwellings: Dwelling[] = [];
      const usageRecords: UsageRecord[] = [];

      // 2. Map Devices to App Structure
      // We assume each top-level device represents a Dwelling/Resident
      devices.forEach((device: any, index: number) => {
        const id = device.deviceGid.toString();
        const name = device.deviceName || `Meter ${id}`;
        
        dwellings.push({
          id: `d-${id}`,
          name: device.locationProperties?.displayName || name,
          type: 'Tiny Home' // Default type
        });

        residents.push({
          id: id,
          name: name,
          dwellingId: `d-${id}`,
          color: COLOR_PALETTE[index % COLOR_PALETTE.length]
        });
      });

      // 3. Fetch Usage for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const usagePromises = residents.map(async (resident) => {
        try {
          // Find the device object corresponding to the resident
          const device = devices.find((d: any) => d.deviceGid.toString() === resident.id);
          
          // We need a channel to get usage. Usually channel 0 is the mains.
          if (!device || !device.channels || device.channels.length === 0) return;
          const channel = device.channels[0];

          // usage is an array of values, startTime is a Date object
          const [usageValues, startTime] = await this.client.getChartUsage(
            channel,
            startDate,
            endDate,
            Scale.DAY,
            Unit.KWH
          );

          if (usageValues && Array.isArray(usageValues)) {
            usageValues.forEach((kwh: number | null, idx: number) => {
              const recordDate = new Date(startTime);
              recordDate.setDate(recordDate.getDate() + idx);
              
              usageRecords.push({
                residentId: resident.id,
                date: recordDate.toISOString().split('T')[0],
                kwh: kwh || 0
              });
            });
          }
        } catch (err) {
          console.warn(`Failed to fetch usage for ${resident.name}`, err);
        }
      });

      await Promise.all(usagePromises);

      return { residents, dwellings, usage: usageRecords };

    } catch (error) {
      console.error("Error fetching Emporia data:", error);
      throw error;
    }
  }
}

export const emporiaService = new EmporiaService();