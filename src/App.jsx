import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert, Activity, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// BASES OPERACIONAIS DA FIR (RS)
// ==========================================
const BASES = [
  { id: 'SBCO', name: 'CANOAS (BACO)', lat: -29.94, lon: -51.15 },
  { id: 'SBPA', name: 'PORTO ALEGRE', lat: -29.99, lon: -51.17 },
  { id: 'SBSM', name: 'SANTA MARIA', lat: -29.71, lon: -53.69 },
  { id: 'SBCX', name: 'CAXIAS DO SUL', lat: -29.20, lon: -51.19 },
  { id: 'SBPK', name: 'PELOTAS', lat: -31.72, lon: -52.33 },
  { id: 'SBBG', name: 'BAGÉ', lat: -31.33, lon: -54.11 }
];

// ==========================================
// FUNÇÕES METEOROLÓGICAS
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun className="text-yellow-400 drop-shadow-md" /> : <Moon className="text-blue-300 drop-shadow-md" />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className="text-yellow-200 drop-shadow-md" /> : <Cloud className="text-slate-300 drop-shadow-md" />;
  if (code === 3) return <Cloud className="text-slate-400 drop-shadow-md" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className="text-blue-300 drop-shadow-md" />;
  if (code >= 61 && code <= 65) return <CloudRain className="text-blue-400 drop-shadow-md" />;
  if (code >= 80 && code <= 82) return <CloudRain className="text-indigo-400 drop-shadow-md" />;
  if (code >= 95) return <CloudLightning className="text-rose-500 drop-shadow-md" />;
  return <Cloud className="text-slate-500" />;
};

const getFlightCategory = (visibility, windGust) => {
  if (visibility < 3000 || windGust > 50) return { rule: "IFR", color: "bg-rose-500 text-white border-rose-500", status: "CRÍTICO", dot: "bg-rose-500 shadow-[0_0_10px_#f43f5e]" };
  if (visibility < 5000 || windGust > 35) return { rule: "MVFR", color: "bg-amber-500 text-black border-amber-500", status: "MARGINAL", dot: "bg-amber-500 shadow-[0_0_10px_#f59e0b]" };
  return { rule: "VFR", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50", status: "VISUAL", dot: "bg-emerald-500" };
};

const getWindDirection = (degree) => {
  const directions = ["↑S", "↗SW", "→W", "↘NW", "↓N", "↙NE", "←E", "↖SE"];
  return directions[Math.round(degree / 45) % 8];
};

// Componente Mágico que faz o Mapa "Voar" para a base clicada
const MapAutoTracker = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo(center, 8, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
};

// ==========================================
// APP PRINCIPAL (SISTEMA INTERATIVO C2)
// ==========================================
export default function App() {
  const [stationsData, setStationsData] = useState([]);
  const [activeStationId, setActiveStationId] = useState('SBCO'); // HACO é o alvo padrão
  
  // Radar Animado
  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [radarHost, setRadarHost] = useState("");
  
  // Status Global
  const [globalThreat, setGlobalThreat] = useState({ level: 'GREEN', text: 'INICIALIZANDO...' });

  useEffect(() => {
    const fetchWeatherForBase = async (base) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${base.lat}&longitude=${base.lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,relative_humidity_2m,pressure_msl&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=America%2FSao_Paulo`;
      const res = await fetch(url);
      const json = await res.json();

      const formatTime = (isoString) => new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const currentHourIdx = new Date().getHours();
      let hourlyForecast = [];
      for (let i = 1; i <= 6; i++) {
        let idx = currentHourIdx + i;
        if (idx < json.hourly.time.length) {
          hourlyForecast.push({
            time: json.hourly.time[idx].split("T")[1],
            temp: Math.round(json.hourly.temperature_2m[idx]),
            code: json.hourly.weather_code[idx],
            precip: json.hourly.precipitation[idx]
          });
        }
      }

      let daysForecast = [];
      for (let i = 0; i < 5; i++) {
        const dateObj = new Date(json.daily.time[i] + "T12:00:00");
        const dayName = i === 0 ? "HOJE" : ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][dateObj.getDay()];
        daysForecast.push({
          dayName: dayName,
          code: json.daily.weather_code[i],
          min: Math.round(json.daily.temperature_2m_min[i]),
          max: Math.round(json.daily.temperature_2m_max[i]),
          rain: json.daily.precipitation_sum[i]
        });
      }

      return {
        id: base.id,
        name: base.name,
        lat: base.lat,
        lon: base.lon,
        current: {
          temp: Math.round(json.current.temperature_2m),
          feels: Math.round(json.current.apparent_temperature),
          isDay: json.current.is_day,
          code: json.current.weather_code,
          visibility: json.current.visibility || 10000,
          pressure: Math.round(json.current.pressure_msl),
          windSpd: Math.round(json.current.wind_speed_10m),
          windDir: json.current.wind_direction_10m,
          gusts: Math.round(json.current.wind_gusts_10m)
        },
        daily: {
          max: Math.round(json.daily.temperature_2m_max[0]),
          min: Math.round(json.daily.temperature_2m_min[0]),
          sunrise: formatTime(json.daily.sunrise[0]),
          sunset: formatTime(json.daily.sunset[0])
        },
        hourly: hourlyForecast,
        forecast: daysForecast
      };
    };

    const loadAll = async () => {
      const promises = BASES.map(base => fetchWeatherForBase(base));
      const results = await Promise.all(promises);
      setStationsData(results);

      const maxGust = Math.max(...results.map(r => r.current.gusts));
      const minVis = Math.min(...results.map(r => r.current.visibility));

      if (minVis <= 3000 || maxGust >= 60) {
        setGlobalThreat({ level: 'RED', text: 'DEFCON 3: ROTAS IFR DETECTADAS NA FIR. VOO VISUAL SUSPENSO.' });
      } else if (minVis <= 5000 || maxGust >= 40) {
        setGlobalThreat({ level: 'YELLOW', text: 'DEFCON 4: CONDIÇÕES MARGINAIS DETECTADAS. AVALIAR TETO.' });
      } else {
        setGlobalThreat({ level: 'GREEN', text: 'DEFCON 5: CONDIÇÕES VMC EM TODAS AS BASES. OPERAÇÃO NORMAL.' });
      }

      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        setRadarHost(data.host);
        
        const pastFrames = data.radar.past.slice(-5).map(f => ({ ...f, type: 'PAST' }));
        const nowcastFrames = data.radar.nowcast.slice(0, 3).map(f => ({ ...f, type: 'NOWCAST' }));
        setRadarFrames([...pastFrames, ...nowcastFrames]);
      } catch (error) {
        console.error("Erro no Radar", error);
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  // Loop do Radar
  useEffect(() => {
    if (radarFrames.length === 0) return;
    const loop = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 1500);
    return () => clearInterval(loop);
  }, [radarFrames]);

  // TELA DE CARREGAMENTO (Evita tela preta)
  if (stationsData.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity size={40} className="text-cyan-400 animate-pulse" />
          <h1 className="text-cyan-400 font-mono tracking-widest animate-pulse">INICIALIZANDO SISTEMA SDSOP...</h1>
        </div>
      </div>
    );
  }

  // Define o alvo ativo e as cores globais
  const activeData = stationsData.find(s => s.id === activeStationId);
  const activeFlightData = getFlightCategory(activeData.current.visibility, activeData.current.gusts);
  const activeFrameData = radarFrames[activeFrameIndex];
  
  const statusColors = {
    RED: "bg-rose-500/10 border-rose-500/40 text-rose-400",
    YELLOW: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    GREEN: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
  };

  return (
    <div className="min-h-screen bg-[#020617] p-3 md:p-5 text-slate-200 font-sans flex flex-col gap-4 overflow-hidden"
         style={{ background: 'radial-gradient(circle at top right, #0f172a, #020617)' }}>
      
      <style>{`
        .leaflet-container { background-color: #020617 !important; border-radius: 1rem; cursor: crosshair !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) grayscale(40%); }
        .leaflet-tooltip { background: rgba(15, 23, 42, 0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; border-radius: 4px !important; backdrop-filter: blur(8px); padding: 2px 6px; font-size: 10px; }
      `}</style>

      {/* 1. CABEÇALHO C2 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight leading-none flex items-center gap-2">
            <ShieldAlert size={20} className="text-cyan-400"/> COMANDO CONJUNTO RS
          </h1>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg border shadow-lg ${statusColors[globalThreat.level]} w-full md:w-auto justify-center`}>
          <AlertTriangle size={14} className={globalThreat.level === 'RED' ? 'animate-pulse' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{globalThreat.text}</span>
        </div>
      </div>
      
      {/* 2. PAINEL DE BOTÕES TÁTICOS (SWITCHBOARD) */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar w-full border-b border-slate-800">
        {stationsData.map((station) => {
          const flightData = getFlightCategory(station.current.visibility, station.current.gusts);
          const isSelected = activeStationId === station.id;
          const isDanger = flightData.rule === 'IFR' || flightData.rule === 'MVFR';
          
          return (
            <button 
              key={station.id}
              onClick={() => setActiveStationId(station.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-t-lg transition-all duration-300 border-x border-t ${
                isSelected 
                  ? 'bg-slate-800/80 border-slate-600 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]' 
                  : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${flightData.dot} ${isDanger ? 'animate-pulse' : ''}`}></div>
              <div className="flex flex-col items-start text-left">
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{station.id}</span>
                <span className={`text-[9px] font-bold tracking-widest ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}>{station.current.temp}°</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. ÁREA PRINCIPAL DIVIDIDA (ALVO FIXADO + RADAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* COLUNA ESQUERDA: TERMINAL DO ALVO SELECIONADO */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          
          <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-2xl p-5 border border-cyan-900/50 shadow-[0_0_20px_rgba(8,145,178,0.1)] relative overflow-hidden flex-1">
            {/* Efeito Visual do Alvo Ativo */}
            <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full opacity-20 pointer-events-none ${activeFlightData.rule === 'IFR' ? 'bg-rose-500' : activeFlightData.rule === 'MVFR' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>

            {/* Cabeçalho do Alvo */}
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-3">
              <div>
                <div className="flex items-center gap-1 text-[9px] text-cyan-500 font-bold tracking-widest mb-1">
                  <Crosshair size={10} /> TARGET LOCKED
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{activeData.name}</h2>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${activeFlightData.color} tracking-widest shadow-lg`}>
                {activeFlightData.rule}
              </span>
            </div>

            {/* Dados Principais */}
            <div className="flex items-center gap-4 py-4">
              <div className="transform scale-[2] drop-shadow-md">
                {getWeatherIcon(activeData.current.code, activeData.current.isDay)}
              </div>
              <div>
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none">{activeData.current.temp}°</h1>
                <span className="text-[10px] text-slate-400 font-medium ml-1">SENS: {activeData.current.feels}°</span>
              </div>
            </div>

            {/* Grid Tático */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-500 font-bold mb-1"><Compass size={10} className="inline mr-1"/>VENTO</div>
                <div className="text-sm font-bold text-white">{getWindDirection(activeData.current.windDir)} {activeData.current.windSpd}</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-rose-500 font-bold mb-1"><Wind size={10} className="inline mr-1"/>RAJADA</div>
                <div className="text-sm font-bold text-rose-400">{activeData.current.gusts} kt</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-500 font-bold mb-1"><Eye size={10} className="inline mr-1"/>VISIBILIDADE</div>
                <div className="text-sm font-bold text-white">{activeData.current.visibility} m</div>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/50">
                <div className="text-[9px] text-slate-500 font-bold mb-1"><Gauge size={10} className="inline mr-1"/>QNH (PRESSÃO)</div>
                <div className="text-sm font-bold text-white">{activeData.current.pressure}</div>
              </div>
            </div>

            {/* Gráfico Linear de Chuva (6h) */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="text-[9px] text-cyan-400 font-bold tracking-widest mb-2">PRECIPITAÇÃO (6 HORAS)</div>
              <div className="flex justify-between items-end gap-1">
                {activeData.hourly.map((h, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-[8px] text-slate-400 mb-1">{h.time}</span>
                    <div className="w-full bg-slate-800 rounded-sm overflow-hidden h-12 relative flex items-end">
                      <div style={{ height: `${Math.min((h.precip/10)*100, 100)}%` }} className="w-full bg-cyan-400"></div>
                    </div>
                    <span className="text-[8px] font-bold text-cyan-300 mt-1">{h.precip}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: MAPA COM AUTO-TRACKING */}
        <div className="lg:col-span-8 relative rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-700 p-1.5 bg-slate-900/30 backdrop-blur-sm h-[550px] lg:h-auto min-h-[500px]">
          
          <div className="absolute top-4 left-4 z-[400] bg-[#020617]/90 p-3 rounded-xl border border-slate-700/50 shadow-2xl pointer-events-none backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">AUTO</span>
              <span className="text-slate-200 text-[10px] font-bold tracking-widest uppercase">Radar de Varredura</span>
            </div>
            <div className="text-lg font-black tracking-widest border-t border-slate-800 pt-1 leading-none text-cyan-400">
              {activeFrameData ? new Date(activeFrameData.time * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </div>
          </div>

          <div className="h-full w-full rounded-xl overflow-hidden bg-[#020617]">
            <MapContainer 
              center={[activeData.lat, activeData.lon]} 
              zoom={8} 
              maxZoom={12} 
              minZoom={5}
              zoomControl={false}
              boxZoom={false} 
              style={{ height: '100%', width: '100%' }}
            >
              {/* COMPONENTE MÁGICO: Faz o mapa "voar" para a base ativa */}
              <MapAutoTracker center={[activeData.lat, activeData.lon]} />

              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-base-map" maxZoom={19} />
              
              {radarHost && radarFrames.map((frame, idx) => (
                <TileLayer
                  key={`${frame.path}-${idx}`}
                  url={`${radarHost}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`}
                  opacity={idx === activeFrameIndex ? 0.85 : 0}
                  maxNativeZoom={6} maxZoom={12} zIndex={10 + idx}
                />
              ))}

              {/* RENDERIZA OS PINOS DE TODAS AS BASES */}
              {stationsData.map((base) => {
                const isTarget = base.id === activeStationId;
                return (
                  <React.Fragment key={base.id}>
                    <Circle center={[base.lat, base.lon]} radius={isTarget ? 30000 : 10000} color={isTarget ? '#22d3ee' : '#64748b'} weight={isTarget ? 2 : 1} fill={false} opacity={0.5} dashArray={isTarget ? "none" : "3, 6"} />
                    <CircleMarker center={[base.lat, base.lon]} radius={isTarget ? 6 : 4} color="#000" weight={2} fillColor={isTarget ? '#22d3ee' : '#94a3b8'} fillOpacity={1} zIndexOffset={isTarget ? 200 : 100}>
                      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={isTarget}>{base.id}</Tooltip>
                    </CircleMarker>
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
      
    </div>
  );
}
