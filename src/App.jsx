import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert, Activity, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// BASES OPERACIONAIS (RS)
// ==========================================
const BASES = [
  { id: 'RS-GENERAL', name: 'VISÃO GERAL DO ESTADO', lat: -30.0, lon: -53.0 },
  { id: 'SBCO', name: 'CANOAS (BACO)', lat: -29.94, lon: -51.15 },
  { id: 'SBPA', name: 'PORTO ALEGRE', lat: -29.99, lon: -51.17 },
  { id: 'SBSM', name: 'SANTA MARIA', lat: -29.71, lon: -53.69 },
  { id: 'SBCX', name: 'CAXIAS DO SUL', lat: -29.20, lon: -51.19 },
  { id: 'SBPK', name: 'PELOTAS', lat: -31.72, lon: -52.33 },
  { id: 'SBBG', name: 'BAGÉ', lat: -31.33, lon: -54.11 }
];

// ==========================================
// COMPONENTES DE SUPORTE
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-300" />;
  if (code >= 95) return <CloudLightning size={20} className="text-rose-500" />;
  if (code >= 51) return <CloudRain size={20} className="text-blue-400" />;
  return <Cloud size={20} className="text-slate-400" />;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => { map.invalidateSize(); }, 400); return () => clearTimeout(t); }, [map]);
  return null;
};

const MapAutoTracker = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { animate: true, duration: 1.5 }); }, [center, zoom, map]);
  return null;
};

// ==========================================
// COMPONENTE: TERMINAL DETALHADO (VERSÃO COMPLETA)
// ==========================================
const StationTerminal = ({ data }) => {
  if (!data) return <div className="p-6 bg-slate-900/50 rounded-2xl animate-pulse h-[600px]"></div>;

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700 h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
        <h2 className="text-xl font-black text-white">{data.name}</h2>
        <span className="text-[10px] font-bold text-cyan-400 border border-cyan-400 px-2 py-0.5 rounded">DADOS ATUAIS</span>
      </div>
      
      {/* Telemetria de Voo */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
          <p className="text-slate-500 font-bold">TEMPERATURA</p>
          <p className="text-lg font-black text-white">{data.current.temp}°C</p>
        </div>
        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
          <p className="text-slate-500 font-bold">VISIBILIDADE</p>
          <p className="text-lg font-black text-white">{data.current.visibility}m</p>
        </div>
        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
          <p className="text-slate-500 font-bold">RAJADA VENTO</p>
          <p className="text-lg font-black text-rose-400">{data.current.gusts} km/h</p>
        </div>
        <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
          <p className="text-slate-500 font-bold">PRESSÃO (QNH)</p>
          <p className="text-lg font-black text-white">{data.current.pressure} hPa</p>
        </div>
      </div>

      {/* Previsão 6h (Radar Chuva) */}
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-2">Precipitação por hora (mm)</h3>
      <div className="grid grid-cols-6 gap-1 mb-4">
        {data.hourly.map((h, i) => (
          <div key={i} className="flex flex-col items-center bg-slate-900 p-1 rounded">
            <span className="text-[8px] text-slate-400">{h.time}</span>
            <div className="text-cyan-400 font-bold text-[10px]">{h.precip}mm</div>
          </div>
        ))}
      </div>

      {/* Previsão 5 dias */}
      <h3 className="text-[10px] font-black text-slate-500 uppercase mb-2">Previsão 5 Dias</h3>
      <div className="space-y-1">
        {data.forecast.map((d, i) => (
          <div key={i} className="flex justify-between bg-slate-900 p-2 rounded text-[10px] items-center">
            <span className="font-bold">{d.dayName}</span>
            <span>{d.min}° / {d.max}°</span>
            <span className="text-blue-400 font-bold">{d.rain}mm</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// APP PRINCIPAL
// ==========================================
export default function App() {
  const [stationsData, setStationsData] = useState([]);
  const [activeId, setActiveId] = useState('RS-GENERAL');
  const [radar, setRadar] = useState({ host: "", path: "", time: "", frames: [] });

  useEffect(() => {
    const loadAll = async () => {
      // 1. Clima
      const results = await Promise.all(BASES.filter(b => b.id !== 'RS-GENERAL').map(async (b) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility,pressure_msl&hourly=temperature_2m,precipitation&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`;
        const res = await fetch(url);
        const json = await res.json();
        return { ...b, current: { ...json.current, pressure: json.current.pressure_msl }, daily: { max: json.daily.temperature_2m_max[0], min: json.daily.temperature_2m_min[0] }, hourly: json.hourly.time.slice(0,6).map((t,i) => ({ time: t.split('T')[1], precip: json.hourly.precipitation[i] })), forecast: json.daily.time.map((t,i) => ({ dayName: 'D'+i, rain: json.daily.precipitation_sum[i], min: json.daily.temperature_2m_min[i], max: json.daily.temperature_2m_max[i] })) };
      }));
      setStationsData(results);
    };
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeBase = BASES.find(b => b.id === activeId);

  return (
    <div className="min-h-screen bg-[#020617] p-2 text-slate-200 flex flex-col gap-2 font-sans">
        {/* TABS DE COMANDO */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-800 custom-scrollbar">
            {BASES.map(b => (
                <button key={b.id} onClick={() => setActiveId(b.id)} className={`px-3 py-1.5 rounded-t text-[10px] font-bold ${activeId === b.id ? 'bg-slate-800 text-cyan-400' : 'bg-slate-900 text-slate-500'}`}>
                    {b.id}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-[calc(100vh-80px)]">
            {/* PAINEL DE DADOS */}
            <div className="lg:col-span-3 h-full overflow-hidden">
                {activeId === 'RS-GENERAL' ? (
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 h-full">
                        <h2 className="text-sm font-black mb-4 flex items-center gap-2"><ShieldAlert className="text-amber-500"/> VISÃO ESTATUAL</h2>
                        <div className="text-[11px] text-slate-400">Monitorando {BASES.length - 1} pontos críticos no RS. Selecione uma base para telemetria detalhada.</div>
                    </div>
                ) : (
                    <StationTerminal data={stationsData.find(s => s.id === activeId)} />
                )}
            </div>

            {/* MAPA TÁTICO */}
            <div className="lg:col-span-9 h-full rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                <MapContainer center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' ? 7 : 10} style={{ height: '100%', width: '100%' }}>
                    <MapResizer />
                    <MapAutoTracker center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' ? 7 : 10} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-base-map" />
                    {stationsData.map(s => (
                        <CircleMarker key={s.id} center={[s.lat, s.lon]} radius={6} color="#38bdf8" fillColor="#38bdf8" fillOpacity={1}>
                            <Tooltip>{s.id}</Tooltip>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </div>
    </div>
  );
}
