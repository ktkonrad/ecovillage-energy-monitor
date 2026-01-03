export interface Resident {
  id: string;
  name: string;
  dwellingId: string;
  color: string;
}

export interface Dwelling {
  id: string;
  name: string;
  type: 'Tiny Home' | 'Yurt' | 'Cabin' | 'Main House' | 'Earthship';
}

export interface DailyUsage {
  date: string; // ISO Date string YYYY-MM-DD
  [residentId: string]: number | string; // Dynamic keys for resident usage
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  [residentId: string]: number | string;
}

export interface UsageRecord {
  residentId: string;
  date: string;
  kwh: number;
}