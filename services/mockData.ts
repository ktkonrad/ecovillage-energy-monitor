import { Dwelling, Resident, UsageRecord } from '../types';

export const DWELLINGS: Dwelling[] = [
  { id: 'd1', name: 'Sunrise Yurt', type: 'Yurt' },
  { id: 'd2', name: 'Creekside Cabin', type: 'Cabin' },
  { id: 'd3', name: 'The Barn', type: 'Main House' },
  { id: 'd4', name: 'Oak Treehouse', type: 'Tiny Home' },
  { id: 'd5', name: 'Garden Studio', type: 'Tiny Home' },
  { id: 'd6', name: 'North Earthship', type: 'Earthship' },
  { id: 'd7', name: 'South Earthship', type: 'Earthship' },
  { id: 'd8', name: 'Hilltop Dome', type: 'Yurt' },
  { id: 'd9', name: 'Meadow Cottage', type: 'Cabin' },
  { id: 'd10', name: 'Forest A-Frame', type: 'Cabin' },
  { id: 'd11', name: 'Solar Shed', type: 'Tiny Home' },
  { id: 'd12', name: 'Community Hub', type: 'Main House' },
];

export const RESIDENTS: Resident[] = [
  { id: 'r1', name: 'Kyle (You)', dwellingId: 'd1', color: '#10b981' }, // Emerald
  { id: 'r2', name: 'Sarah', dwellingId: 'd1', color: '#34d399' },
  { id: 'r3', name: 'Marcus', dwellingId: 'd2', color: '#f59e0b' }, // Amber
  { id: 'r4', name: 'Elena', dwellingId: 'd2', color: '#fbbf24' },
  { id: 'r5', name: 'The Communes', dwellingId: 'd3', color: '#ef4444' }, // Red (Group)
  { id: 'r6', name: 'Liam', dwellingId: 'd4', color: '#3b82f6' }, // Blue
  { id: 'r7', name: 'Noah', dwellingId: 'd5', color: '#6366f1' }, // Indigo
  { id: 'r8', name: 'Emma', dwellingId: 'd6', color: '#8b5cf6' }, // Violet
  { id: 'r9', name: 'Oliver', dwellingId: 'd6', color: '#a78bfa' },
  { id: 'r10', name: 'James', dwellingId: 'd7', color: '#ec4899' }, // Pink
  { id: 'r11', name: 'Sophia', dwellingId: 'd7', color: '#f472b6' },
  { id: 'r12', name: 'William', dwellingId: 'd8', color: '#14b8a6' }, // Teal
  { id: 'r13', name: 'Lucas', dwellingId: 'd9', color: '#06b6d4' }, // Cyan
  { id: 'r14', name: 'Mia', dwellingId: 'd9', color: '#22d3ee' },
  { id: 'r15', name: 'Benjamin', dwellingId: 'd10', color: '#f97316' }, // Orange
  { id: 'r16', name: 'Elijah', dwellingId: 'd11', color: '#84cc16' }, // Lime
  { id: 'r17', name: 'Community Kitchen', dwellingId: 'd12', color: '#64748b' }, // Slate
  { id: 'r18', name: 'Guest Room 1', dwellingId: 'd12', color: '#94a3b8' },
  { id: 'r19', name: 'Guest Room 2', dwellingId: 'd12', color: '#cbd5e1' },
  { id: 'r20', name: 'Workshop', dwellingId: 'd12', color: '#475569' },
];

// Helper to generate random usage based on dwelling type
const getBaseUsage = (dwellingType: string): number => {
  switch (dwellingType) {
    case 'Main House': return 15;
    case 'Cabin': return 8;
    case 'Earthship': return 4; // Very efficient
    case 'Yurt': return 5;
    case 'Tiny Home': return 3;
    default: return 5;
  }
};

export const generateMockData = (days = 60): UsageRecord[] => {
  const records: UsageRecord[] = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate weather factor (sine wave + noise)
    const seasonalFactor = 1 + Math.sin(i / 10) * 0.2; 

    RESIDENTS.forEach(resident => {
      const dwelling = DWELLINGS.find(d => d.id === resident.dwellingId);
      const base = getBaseUsage(dwelling?.type || 'Tiny Home');
      
      // Random daily variance
      const noise = Math.random() * 2 - 1; // -1 to 1
      let kwh = (base + noise) * seasonalFactor;
      
      // Random spikes (e.g., laundry day)
      if (Math.random() > 0.85) kwh += 3;

      records.push({
        residentId: resident.id,
        date: dateStr,
        kwh: Math.max(0.5, parseFloat(kwh.toFixed(2))), // Ensure positive
      });
    });
  }
  return records;
};