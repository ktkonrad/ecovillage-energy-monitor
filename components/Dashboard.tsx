import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { Download, Zap, Users, Home, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { Resident, UsageRecord, Dwelling } from '../types';
import { analyzeCommunityEnergy } from '../services/geminiService';

interface DashboardProps {
  data: UsageRecord[];
  residents: Resident[];
  dwellings: Dwelling[];
}

export const Dashboard: React.FC<DashboardProps> = ({ data, residents, dwellings }) => {
  const [selectedDwelling, setSelectedDwelling] = useState<string>('all');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- Data Transformation ---

  // 1. Filter data based on selection
  const filteredResidents = useMemo(() => {
    return selectedDwelling === 'all' 
      ? residents 
      : residents.filter(r => r.dwellingId === selectedDwelling);
  }, [selectedDwelling, residents]);

  const filteredData = useMemo(() => {
    const residentIds = filteredResidents.map(r => r.id);
    return data.filter(d => residentIds.includes(d.residentId));
  }, [data, filteredResidents]);

  // 2. Prepare Daily Series for Line Chart
  const dailySeries = useMemo(() => {
    const grouped: Record<string, any> = {};
    filteredData.forEach(rec => {
      if (!grouped[rec.date]) grouped[rec.date] = { date: rec.date };
      grouped[rec.date][rec.residentId] = rec.kwh;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // 3. Prepare Total by Resident for Bar/Pie Chart
  const totalsByResident = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredData.forEach(rec => {
      totals[rec.residentId] = (totals[rec.residentId] || 0) + rec.kwh;
    });
    return Object.entries(totals)
      .map(([id, total]) => ({
        id,
        name: residents.find(r => r.id === id)?.name || id,
        value: parseFloat(total.toFixed(1)),
        color: residents.find(r => r.id === id)?.color || '#ccc'
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, residents]);

  // --- Handlers ---

  const handleExport = () => {
    const headers = ['Date', 'Resident', 'Dwelling', 'kWh'];
    const rows = filteredData.map(rec => {
      const resident = residents.find(r => r.id === rec.residentId);
      const dwelling = dwellings.find(d => d.id === resident?.dwellingId);
      return [rec.date, resident?.name, dwelling?.name, rec.kwh].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "eco_village_usage.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeCommunityEnergy(data, residents); 
    setAiInsight(result);
    setIsAnalyzing(false);
  };

  const totalConsumption = totalsByResident.reduce((sum, item) => sum + item.value, 0).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">Total Consumption</p>
            <p className="text-2xl font-bold text-stone-800">{totalConsumption} kWh</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">Active Meters</p>
            <p className="text-2xl font-bold text-stone-800">{filteredResidents.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-stone-500 font-medium">Highest User</p>
            <p className="text-2xl font-bold text-stone-800">{totalsByResident[0]?.name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Controls & AI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <select 
              className="w-full appearance-none bg-stone-50 border border-stone-300 text-stone-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-emerald-500"
              value={selectedDwelling}
              onChange={(e) => setSelectedDwelling(e.target.value)}
            >
              <option value="all">All Locations</option>
              {dwellings.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-700">
              <Home className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 w-full md:w-auto">
          <button 
            onClick={handleAiAnalysis}
            disabled={isAnalyzing}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Thinking...' : 'AI Insights'}</span>
          </button>
          
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* AI Insights Result Panel */}
      {aiInsight && (
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-6 rounded-xl border border-violet-100 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-violet-900 mb-2">Community Energy Analysis</h3>
              <div className="prose prose-sm prose-violet text-stone-700 whitespace-pre-line">
                {aiInsight}
              </div>
            </div>
            <button onClick={() => setAiInsight(null)} className="text-stone-400 hover:text-stone-600">×</button>
          </div>
        </div>
      )}

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-semibold text-stone-800 mb-6">Daily Usage Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#78716c'}} 
                  tickFormatter={(val) => val.slice(5)} // Show MM-DD
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{fontSize: 12, fill: '#78716c'}} 
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft', fill: '#78716c' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                {filteredResidents.map((resident) => (
                  <Line 
                    key={resident.id}
                    type="monotone" 
                    dataKey={resident.id} 
                    name={resident.name}
                    stroke={resident.color} 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
          <h3 className="text-lg font-semibold text-stone-800 mb-6">Total Consumption by Resident</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={totalsByResident} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e5e5" />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  tick={{fontSize: 12, fill: '#78716c'}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{fill: '#f5f5f4'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {totalsByResident.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-stone-800">Community Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 text-stone-500 font-medium">
              <tr>
                <th className="px-6 py-3">Resident</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3 text-right">Total Usage (30d)</th>
                <th className="px-6 py-3 text-right">Daily Avg</th>
                <th className="px-6 py-3 text-center">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {totalsByResident.map((item) => {
                const resident = residents.find(r => r.id === item.id);
                const dwelling = dwellings.find(d => d.id === resident?.dwellingId);
                const dailyAvg = (item.value / 30).toFixed(1);
                
                // Simple efficiency heuristic
                let efficiencyBadge = <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">Efficient</span>;
                if (parseFloat(dailyAvg) > 10) efficiencyBadge = <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">High</span>;
                else if (parseFloat(dailyAvg) > 6) efficiencyBadge = <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">Moderate</span>;

                return (
                  <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-stone-800 flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span>{item.name}</span>
                    </td>
                    <td className="px-6 py-3 text-stone-600">{dwelling?.name} <span className="text-stone-400 text-xs">({dwelling?.type})</span></td>
                    <td className="px-6 py-3 text-right font-medium">{item.value.toFixed(1)} kWh</td>
                    <td className="px-6 py-3 text-right text-stone-600">{dailyAvg} kWh</td>
                    <td className="px-6 py-3 text-center">{efficiencyBadge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};