import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Moon, Wind, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert, Activity, Crosshair, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// CONFIGURAÇÕES GLOBAIS - C2 RS
// ==========================================
const BASES = [
  { id: 'RS-GENERAL', name: 'SITUAÇÃO RS', lat: -30.0, lon: -53.2 },
  { id: 'SBCO', name: 'CANOAS (BACO)', lat: -29.94, lon: -51.15 },
  { id: 'SBPA', name: 'PORTO ALEGRE', lat: -29.99, lon: -51.17 },
  { id: 'SBSM', name: 'SANTA MARIA', lat: -29.71, lon: -53.69 },
  { id: 'SBCX', name: 'CAXIAS DO SUL', lat: -29.20, lon: -51.19 },
  { id: 'SBPK', name: 'PELOTAS', lat: -31.72, lon: -52.33 },
  { id: 'SBBG', name: 'BAGÉ', lat: -31.33, lon: -54.11 }
];

// Funções de suporte mantidas para consistência dos dados
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-300" />;
  if (code >= 95) return <CloudRain size={20} className="text-rose-500" />;
  if (code >= 51) return <CloudRain size={20} className="text-blue-400" />;
  return <Cloud size={20} className="text-slate-400" />;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 400); }, [map]);
  return null;
};

// ==========================================
// COMPONENTE PRINCIPAL DO DASHBOARD
// ==========================================
export default function App() {
  const [activeId, setActiveId] = useState('RS-GENERAL');
  const [data, setData] = useState([]);
  const [radar, setRadar] = useState({ host: "", frames: [], idx: 0 });

  useEffect(() => {
    // Carrega clima das 6 bases
    const loadData = async () => {
        const results = await Promise.all(BASES.slice(1).map(async (b) => {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility,pressure_msl,relative_humidity_2m&hourly=precipitation,temperature_2m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`);
            const j = await res.json();
            return { ...b, current: j.current, hourly: j.hourly, daily: j.daily };
        }));
        setData(results);
    };
    loadData();
  }, []);

  const activeBase = BASES.find(b => b.id === activeId);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans">
      {/* Barra de Navegação Tática */}
      <div className="flex p-2 gap-1 overflow-x-auto bg-slate-950 border-b border-slate-800">
        {BASES.map(b => (
          <button key={b.id} onClick={() => setActiveId(b.id)} 
            className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${activeId === b.id ? 'bg-cyan-900 text-white' : 'bg-slate-900 text-slate-500'}`}>
            {b.name}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 h-[calc(100vh-60px)]">
        
        {/* Painel Esquerdo: Dados Detalhados */}
        <div className="lg:col-span-4 overflow-y-auto custom-scrollbar space-y-3">
          {activeId !== 'RS-GENERAL' && data.find(s => s.id === activeId) ? (
             <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-xl">
               <h2 className="text-lg font-black text-cyan-400 mb-4">{BASES.find(b => b.id === activeId).name}</h2>
               {/* Grade de telemetria completa */}
               <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-800 p-3 rounded"><p className="text-[9px] text-slate-400">TEMP</p><p className="text-xl font-bold">{data.find(s => s.id === activeId).current.temperature_2m}°C</p></div>
                 <div className="bg-slate-800 p-3 rounded"><p className="text-[9px] text-slate-400">RAJADA</p><p className="text-xl font-bold text-rose-400">{data.find(s => s.id === activeId).current.wind_gusts_10m} km/h</p></div>
                 <div className="bg-slate-800 p-3 rounded"><p className="text-[9px] text-slate-400">VISIBILIDADE</p><p className="text-xl font-bold">{data.find(s => s.id === activeId).current.visibility} m</p></div>
                 <div className="bg-slate-900 p-3 rounded border border-cyan-500"><p className="text-[9px] text-cyan-500 font-bold">RISCO DC</p><p className="text-xs font-bold text-white">Nível Monitorado</p></div>
               </div>
             </div>
          ) : (
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 h-full">
              <h2 className="text-lg font-bold flex items-center gap-2"><ShieldAlert className="text-amber-500"/> VISÃO ESTATUAL RS</h2>
              <p className="text-xs text-slate-400 mt-4">Sistema de monitoramento C2 operando em tempo real. Selecione um aeródromo para telemetria de precisão.</p>
            </div>
          )}
        </div>

        {/* Painel Direito: Mapa */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-slate-700">
           <MapContainer center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' ? 7 : 10} style={{ height: '100%', width: '100%' }}>
            <MapResizer />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-base-map" />
            {BASES.slice(1).map(b => (
                <CircleMarker key={b.id} center={[b.lat, b.lon]} radius={6} color="#06b6d4" />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
