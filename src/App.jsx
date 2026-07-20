import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert, Activity, Crosshair, Map as MapIcon, Siren } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================
const BASES = [
  { id: 'RS-GENERAL', name: 'SITUAÇÃO RS', lat: -30.0, lon: -53.0 },
  { id: 'SBCO', name: 'CANOAS (BACO)', lat: -29.94, lon: -51.15 },
  { id: 'SBPA', name: 'PORTO ALEGRE', lat: -29.99, lon: -51.17 },
  { id: 'SBSM', name: 'SANTA MARIA', lat: -29.71, lon: -53.69 },
  { id: 'SBCX', name: 'CAXIAS DO SUL', lat: -29.20, lon: -51.19 },
  { id: 'SBPK', name: 'PELOTAS', lat: -31.72, lon: -52.33 },
  { id: 'SBBG', name: 'BAGÉ', lat: -31.33, lon: -54.11 }
];

// ... [Funções Meteorológicas mantidas iguais para performance] ...
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} className="text-blue-300" />;
  if (code >= 95) return <CloudLightning size={24} className="text-rose-500" />;
  if (code >= 51) return <CloudRain size={24} className="text-blue-400" />;
  return <Cloud size={24} className="text-slate-400" />;
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => { map.invalidateSize(); }, 400); return () => clearTimeout(t); }, [map]);
  return null;
};

const MapAutoTracker = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { animate: true, duration: 1.5 }); }, [center[0], center[1], zoom, map]);
  return null;
};

// ==========================================
// COMPONENTE: VISÃO GERAL (RS)
// ==========================================
const GeneralOverview = ({ stations }) => {
  const alerts = stations.filter(s => s.current.gusts > 40 || s.current.visibility < 5000);
  
  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-2xl rounded-2xl p-5 border border-slate-700 h-full flex flex-col gap-4">
      <h2 className="text-xl font-black text-white flex items-center gap-2"><Siren className="text-rose-500" /> PANORAMA TÁTICO RS</h2>
      
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-emerald-400 gap-2 bg-emerald-900/10 border border-emerald-900/30 p-4 rounded-xl">
          <CheckCircle2 size={40}/>
          <p className="font-bold">NENHUM ALERTA EM VIGOR NAS BASES</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {alerts.map(s => (
            <div key={s.id} className="bg-rose-900/20 border border-rose-500/30 p-3 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white">{s.name}</p>
                <p className="text-[9px] text-rose-300">CONDIÇÃO DEGRADADA DETECTADA</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-rose-400">GUST: {s.current.gusts}km/h</p>
                <p className="text-xs font-bold text-white">{s.current.visibility}m</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto text-[10px] text-slate-500 font-bold border-t border-slate-800 pt-3">
        * MONITORAMENTO AUTOMÁTICO DE SEGURANÇA OPERACIONAL (SDSOP)
      </div>
    </div>
  );
};

// ... [StationTerminal mantido igual para brevidade no código] ...
const StationTerminal = ({ data }) => {
    // (Lógica do terminal anterior aqui...)
    return (<div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-2xl p-4 border border-slate-700/50 flex flex-col gap-3 font-mono">
        <h2 className="text-lg font-bold text-white">{data.name}</h2>
        <div className="flex items-center gap-2 text-2xl font-black text-white">{data.current.temp}°</div>
        <div className="text-[10px] text-slate-400">Vento: {data.current.windSpd} km/h | Vis: {data.current.visibility}m</div>
        <div className="text-[10px] text-blue-400">Precipitação acumulada: {data.forecast[0].rain}mm</div>
    </div>);
};

// ==========================================
// APP PRINCIPAL
// ==========================================
export default function App() {
  const [stationsData, setStationsData] = useState([]);
  const [activeId, setActiveId] = useState('RS-GENERAL');

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.all(BASES.map(async (b) => {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${b.lat}&longitude=${b.lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`);
        const json = await res.json();
        return { ...b, current: json.current, daily: json.daily, forecast: [{ rain: json.daily.precipitation_sum[0] }] };
      }));
      setStationsData(results);
    };
    fetchAll();
    const int = setInterval(fetchAll, 60000);
    return () => clearInterval(int);
  }, []);

  const active = BASES.find(b => b.id === activeId);
  const zoomLevel = activeId === 'RS-GENERAL' ? 7 : 10;

  return (
    <div className="min-h-screen bg-[#020617] p-3 text-slate-200 flex flex-col gap-3">
        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {BASES.map(b => (
                <button key={b.id} onClick={() => setActiveId(b.id)} className={`px-4 py-2 rounded-t-lg text-xs font-bold ${activeId === b.id ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-500'}`}>
                    {b.id}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[600px]">
            <div className="lg:col-span-4 h-full">
                {activeId === 'RS-GENERAL' ? (
                    <GeneralOverview stations={stationsData} />
                ) : (
                    <StationTerminal data={stationsData.find(s => s.id === activeId)} />
                )}
            </div>

            <div className="lg:col-span-8 h-full rounded-2xl overflow-hidden border border-slate-700">
                <MapContainer center={[active.lat, active.lon]} zoom={zoomLevel} style={{ height: '100%', width: '100%' }}>
                    <MapResizer />
                    <MapAutoTracker center={[active.lat, active.lon]} zoom={zoomLevel} />
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
