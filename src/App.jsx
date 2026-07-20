import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert, Activity, Crosshair, ServerCrash, Siren, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// CONFIGURAÇÕES GLOBAIS - C2 RS
// ==========================================
const BASES = [
  { id: 'RS-GENERAL', name: 'PANORAMA ESTADUAL RS', lat: -30.0, lon: -53.2 },
  { id: 'SBCO', name: 'CANOAS (BACO)', lat: -29.94, lon: -51.15 },
  { id: 'SBPA', name: 'PORTO ALEGRE', lat: -29.99, lon: -51.17 },
  { id: 'SBSM', name: 'SANTA MARIA', lat: -29.71, lon: -53.69 },
  { id: 'SBCX', name: 'CAXIAS DO SUL', lat: -29.20, lon: -51.19 },
  { id: 'SBPK', name: 'PELOTAS', lat: -31.72, lon: -52.33 },
  { id: 'SBBG', name: 'BAGÉ', lat: -31.33, lon: -54.11 }
];

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-blue-300" />;
  if (code >= 95) return <CloudLightning size={24} className="text-rose-500" />;
  if (code >= 51) return <CloudRain size={24} className="text-blue-400" />;
  return <Cloud size={24} className="text-slate-400" />;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 400); }, [map]);
  return null;
};

const MapAutoTracker = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { animate: true, duration: 1.5 }); }, [center, zoom, map]);
  return null;
};

// ==========================================
// COMPONENTE: TERMINAL DETALHADO
// ==========================================
const StationTerminal = ({ data }) => {
  if (!data) return <div className="bg-slate-900 p-6 rounded-2xl animate-pulse h-[600px]"></div>;

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-2xl h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-black text-white">{data.name}</h2>
        <span className="text-[10px] font-bold text-cyan-400 border border-cyan-400 px-2 py-1 rounded">DADOS AO VIVO</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[10px] text-slate-500 font-bold">TEMP</p><p className="text-2xl font-black text-white">{data.current.temperature_2m}°C</p></div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[10px] text-slate-500 font-bold">VISIBILIDADE</p><p className="text-2xl font-black text-white">{data.current.visibility}m</p></div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[10px] text-slate-500 font-bold">RAJADA VENTO</p><p className="text-2xl font-black text-rose-400">{data.current.wind_gusts_10m} km/h</p></div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><p className="text-[10px] text-slate-500 font-bold">PRESSÃO</p><p className="text-2xl font-black text-white">{data.current.pressure_msl} hPa</p></div>
      </div>

      <h3 className="text-[11px] font-black text-slate-500 uppercase mb-3">Precipitação por hora (mm)</h3>
      <div className="grid grid-cols-6 gap-2 mb-6">
        {data.hourly.map((h, i) => (
          <div key={i} className="flex flex-col items-center bg-slate-900 p-2 rounded">
            <span className="text-[9px] text-slate-400">{h.time}</span>
            <div className="text-cyan-400 font-bold text-sm">{h.precip}mm</div>
          </div>
        ))}
      </div>

      <h3 className="text-[11px] font-black text-slate-500 uppercase mb-3">Previsão 5 Dias</h3>
      <div className="space-y-2">
        {data.forecast.map((d, i) => (
          <div key={i} className="flex justify-between bg-slate-900 p-3 rounded text-sm items-center">
            <span className="font-bold">{d.dayName}</span>
            <span className="text-slate-400">{d.min}° / {d.max}°</span>
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
  const [data, setData] = useState([]);
  const [activeId, setActiveId] = useState('RS-GENERAL');
  const [radar, setRadar] = useState({ host: "", frames: [], idx: 0 });

  useEffect(() => {
    const loadAll = async () => {
      const results = await Promise.all(BASES.slice(1).map(async (b) => {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility,pressure_msl&hourly=precipitation,temperature_2m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`);
        const j = await res.json();
        return { ...b, current: j.current, hourly: j.hourly.time.slice(0,6).map((t,i) => ({ time: t.split('T')[1], precip: j.hourly.precipitation[i] })), forecast: j.daily.time.map((t,i) => ({ dayName: 'DIA '+ (i+1), rain: j.daily.precipitation_sum[i], min: j.daily.temperature_2m_min[i], max: j.daily.temperature_2m_max[i] })) };
      }));
      setData(results);

      const rRes = await fetch("https://api.rainviewer.com/public/weather-maps.json");
      const rData = await rRes.json();
      setRadar({ host: rData.host, frames: [...rData.radar.past, ...rData.radar.nowcast], idx: 0 });
    };
    loadAll();
  }, []);

  const activeBase = BASES.find(b => b.id === activeId);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-2 flex flex-col gap-2 font-sans">
      <div className="flex gap-1 overflow-x-auto bg-slate-950 p-2 border-b border-slate-800">
        {BASES.map(b => (
          <button key={b.id} onClick={() => setActiveId(b.id)} className={`px-4 py-2 rounded text-[10px] font-black uppercase ${activeId === b.id ? 'bg-cyan-900' : 'bg-slate-900'}`}>
            {b.name}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 h-[calc(100vh-80px)] overflow-hidden">
        <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar">
           {activeId === 'RS-GENERAL' ? (
             <div className="bg-slate-900 p-6 rounded-2xl h-full border border-slate-700">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Siren className="text-rose-500"/> VISÃO ESTATUAL</h2>
                <div className="space-y-4 text-sm text-slate-400">
                  <p>Central de monitoramento operando com integração direta aos sensores meteorológicos regionais.</p>
                  <div className="bg-rose-900/20 p-4 rounded border border-rose-800 text-rose-300">
                    <p className="font-bold mb-1">ALERTAS EM VIGOR:</p>
                    <p className="text-[10px]">Monitorando saturação de solo em toda a rede de aeródromos.</p>
                  </div>
                </div>
             </div>
           ) : (
             <StationTerminal data={data.find(s => s.id === activeId)} />
           )}
        </div>

        <div className="lg:col-span-8 h-full rounded-2xl overflow-hidden border border-slate-700">
            <MapContainer center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' ? 7 : 10} style={{ height: '100%', width: '100%' }}>
                <MapResizer />
                <MapAutoTracker center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' ? 7 : 10} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-base-map" />
                {data.map(s => <CircleMarker key={s.id} center={[s.lat, s.lon]} radius={8} color="#06b6d4" />)}
            </MapContainer>
        </div>
      </div>
    </div>
  );
}
