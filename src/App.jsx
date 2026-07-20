import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert, Activity } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// BASES OPERACIONAIS (AEROPORTOS RS)
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
// FUNÇÕES METEOROLÓGICAS E DE AVIAÇÃO
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
  if (visibility < 3000 || windGust > 50) return { rule: "IFR", color: "bg-rose-500/20 text-rose-400 border-rose-500/50", status: "CRÍTICO" };
  if (visibility < 5000 || windGust > 35) return { rule: "MVFR", color: "bg-blue-500/20 text-blue-400 border-blue-500/50", status: "MARGINAL" };
  return { rule: "VFR", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50", status: "VISUAL" };
};

const getWindDirection = (degree) => {
  const directions = ["↑S", "↗SW", "→W", "↘NW", "↓N", "↙NE", "←E", "↖SE"];
  return directions[Math.round(degree / 45) % 8];
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => { map.invalidateSize(); }, 400);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
};

// ==========================================
// COMPONENTE: TERMINAL ESTAÇÃO (ALTA DENSIDADE)
// ==========================================
const StationTerminal = ({ data }) => {
  if (!data) return <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 animate-pulse h-[350px]"></div>;

  const flightData = getFlightCategory(data.current.visibility, data.current.gusts);

  return (
    <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-2xl p-3.5 shadow-2xl border border-slate-700/50 flex flex-col gap-3 relative overflow-hidden">
      
      {/* Luzes de Status de Fundo Reduzidas */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full opacity-20 pointer-events-none ${flightData.rule === 'IFR' ? 'bg-rose-500' : flightData.rule === 'MVFR' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

      {/* 1. CABEÇALHO COMPACTO */}
      <div className="flex justify-between items-center border-b border-slate-700/50 pb-2 z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-slate-100 tracking-tight whitespace-nowrap">
            {data.city}
          </h2>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${flightData.color} tracking-widest`}>
            {flightData.rule}
          </span>
        </div>
        
        {/* Janela Operacional Ultra-Compacta */}
        <div className="flex gap-2 bg-slate-900/50 px-2 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1">
            <Sunrise size={10} className="text-amber-400" />
            <span className="text-[9px] font-bold text-slate-300">{data.daily.sunrise}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sunset size={10} className="text-orange-500" />
            <span className="text-[9px] font-bold text-slate-300">{data.daily.sunset}</span>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRIA PRINCIPAL (COMPRIMIDA) */}
      <div className="flex justify-between items-center z-10 gap-2">
        {/* Bloco Temp */}
        <div className="flex items-center gap-2">
          <div className="transform scale-[1.3] drop-shadow-md">
            {getWeatherIcon(data.current.code, data.current.isDay)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
              {data.current.temp}°
            </h1>
            <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">FL: {data.current.feels}°</span>
          </div>
        </div>
        
        {/* Grid de Dados */}
        <div className="grid grid-cols-2 gap-1.5 w-full max-w-[180px]">
          <div className="bg-slate-900/60 px-1.5 py-1 rounded flex justify-between items-center border border-slate-800">
            <span className="text-[8px] text-slate-400 font-bold"><Compass size={9} className="inline mr-0.5"/>WND</span>
            <span className="text-[9px] font-bold text-slate-100">{getWindDirection(data.current.windDir)} {data.current.windSpd}</span>
          </div>
          <div className="bg-slate-900/60 px-1.5 py-1 rounded flex justify-between items-center border border-slate-800">
            <span className="text-[8px] text-rose-400 font-bold"><Wind size={9} className="inline mr-0.5"/>GUST</span>
            <span className="text-[9px] font-bold text-white">{data.current.gusts}</span>
          </div>
          <div className="bg-slate-900/60 px-1.5 py-1 rounded flex justify-between items-center border border-slate-800">
            <span className="text-[8px] text-slate-400 font-bold"><Eye size={9} className="inline mr-0.5"/>VIS</span>
            <span className="text-[9px] font-bold text-slate-100">{data.current.visibility}m</span>
          </div>
          <div className="bg-slate-900/60 px-1.5 py-1 rounded flex justify-between items-center border border-slate-800">
            <span className="text-[8px] text-slate-400 font-bold"><Gauge size={9} className="inline mr-0.5"/>QNH</span>
            <span className="text-[9px] font-bold text-slate-100">{data.current.pressure}</span>
          </div>
        </div>
      </div>

      {/* 3. RADAR 6 HORAS (BARRA ULTRA FINA) */}
      <div className="mt-1 z-10">
        <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
          <PlaneTakeoff size={8} className="text-blue-400" /> Janela 6H (Precipitação)
        </h3>
        <div className="grid grid-cols-6 gap-1 bg-slate-900/40 p-1.5 rounded-lg border border-slate-800">
          {data.hourly.map((hour, idx) => {
            const rainWidth = Math.min((hour.precip / 10) * 100, 100);
            return (
              <div key={idx} className="flex flex-col items-center justify-between h-14 relative">
                <span className="text-[8px] text-slate-400 font-bold leading-none">{hour.time}</span>
                <div className="transform scale-75 my-auto">{getWeatherIcon(hour.code, 1)}</div>
                
                <div className="w-full px-1">
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-0.5">
                    <div style={{ width: `${rainWidth}%` }} className="h-full bg-cyan-400"></div>
                  </div>
                  <div className="text-[7px] font-bold text-cyan-300 text-center leading-none">
                    {hour.precip > 0 ? `${hour.precip.toFixed(1)}` : '0'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DEFESA CIVIL: 5 DIAS (COMPACTO HORIZONTAL) */}
      <div className="z-10">
        <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
          <ShieldAlert size={8} className="text-amber-400" /> Acumulado Solo (5 Dias)
        </h3>
        <div className="grid grid-cols-5 gap-1 bg-slate-900/40 p-1.5 rounded-lg border border-slate-800">
          {data.forecast.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <span className={`text-[8px] font-black tracking-wider ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{day.dayName}</span>
              <div className="transform scale-50 -my-1">{getWeatherIcon(day.code, 1)}</div>
              <span className="text-[8px] font-bold text-slate-300 leading-none">{day.min}°/{day.max}°</span>
              <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${day.rain > 15 ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}>
                {day.rain > 0 ? `${day.rain.toFixed(1)}mm` : '0mm'}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// ==========================================
// APP PRINCIPAL (CENTRAL C2)
// ==========================================
export default function App() {
  const [stationsData, setStationsData] = useState([]);
  
  // Motor de Animação do Radar
  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [radarHost, setRadarHost] = useState("");
  
  const [flightStatus, setFlightStatus] = useState({ level: 'GREEN', text: 'Sincronizando Aviação...' });
  const [civilStatus, setCivilStatus] = useState({ level: 'GREEN', text: 'Sincronizando Solo...' });

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
        city: base.name,
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
      const maxRain = Math.max(...results.map(r => r.forecast[0].rain)); 

      if (minVis <= 3000 || maxGust >= 60) {
        setFlightStatus({ level: 'RED', text: 'IFR: CONDIÇÕES CRÍTICAS NA FIR' });
      } else if (minVis <= 5000 || maxGust >= 40) {
        setFlightStatus({ level: 'YELLOW', text: 'MVFR: TETO MARGINAL P/ EVAM' });
      } else {
        setFlightStatus({ level: 'GREEN', text: 'VFR: CORREDORES VISUAIS ABERTOS' });
      }

      if (maxRain > 50) {
        setCivilStatus({ level: 'RED', text: 'ALERTA: RISCO HIDROLÓGICO EXTREMO' });
      } else if (maxRain > 20) {
        setCivilStatus({ level: 'YELLOW', text: 'ATENÇÃO: SOLO SATURADO' });
      } else {
        setCivilStatus({ level: 'GREEN', text: 'SOLO OK: CONDIÇÃO NORMAL' });
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

  useEffect(() => {
    if (radarFrames.length === 0) return;
    const loop = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 1500);
    return () => clearInterval(loop);
  }, [radarFrames]);

  const statusColors = {
    RED: "bg-rose-500/10 border-rose-500/40 text-rose-400",
    YELLOW: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    GREEN: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
  };

  const activeFrameData = radarFrames[activeFrameIndex];
  let radarTimeLabel = "--:--";
  let isProjection = false;
  
  if (activeFrameData) {
    const d = new Date(activeFrameData.time * 1000);
    radarTimeLabel = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    isProjection = activeFrameData.type === 'NOWCAST';
  }

  return (
    <div className="min-h-screen bg-[#020617] p-3 md:p-4 text-slate-200 font-sans flex flex-col gap-4"
         style={{ background: 'radial-gradient(circle at top center, #0f172a, #020617)' }}>
      
      <style>{`
        .leaflet-container { background-color: #020617 !important; border-radius: 1rem; cursor: crosshair !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) grayscale(40%); }
        .leaflet-tooltip { background: rgba(15, 23, 42, 0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; border-radius: 4px !important; backdrop-filter: blur(8px); padding: 2px 6px; font-size: 9px; }
        .leaflet-tooltip-right::before { border-right-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-left::before { border-left-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-top::before { border-top-color: rgba(15, 23, 42, 0.95) !important; }
      `}</style>

      {/* CABEÇALHO COMPACTO (15 polegadas) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 tracking-tight leading-none">
            C.O.C. ESTADUAL (RS)
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-widest flex items-center gap-1">
            <Activity size={10} className="text-blue-500"/> SDSOP / HACO
          </p>
        </div>
        
        <div className="flex flex-row gap-2 w-full md:w-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-lg ${statusColors[flightStatus.level]} flex-1 md:flex-none justify-center`}>
            <PlaneTakeoff size={14} />
            <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{flightStatus.text}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-lg ${statusColors[civilStatus.level]} flex-1 md:flex-none justify-center`}>
            <ShieldAlert size={14} />
            <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">{civilStatus.text}</span>
          </div>
        </div>
      </div>
      
      {/* GRID DE TERMINAIS ADAPTADO PARA LAPTOP (3 COLUNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
        {stationsData.map((data, idx) => (
          <StationTerminal key={idx} data={data} />
        ))}
      </div>

      {/* TELA DO RADAR TÁTICO OTIMIZADA */}
      <div className="w-full relative rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-800 p-1.5 bg-slate-900/50 backdrop-blur-sm mt-1">
        
        {/* HUD DO RADAR */}
        <div className="absolute top-4 left-4 z-[400] bg-[#020617]/90 p-2.5 rounded-xl border border-slate-700/50 shadow-2xl pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded animate-pulse">AUTO</span>
            <span className="text-slate-200 text-[9px] font-bold tracking-widest uppercase">Nexrad</span>
          </div>
          <div className={`text-lg font-black tracking-widest border-t border-slate-800 pt-1 leading-none ${isProjection ? 'text-amber-400' : 'text-cyan-400'}`}>
            {radarTimeLabel}
          </div>
          <div className={`text-[8px] font-bold mt-1 ${isProjection ? 'text-amber-500/70' : 'text-cyan-500/70'}`}>
            {isProjection ? "PROJEÇÃO (NOWCAST)" : "LEITURA REAL"}
          </div>
        </div>

        {/* Altura reduzida para caber no notebook (550px) */}
        <div className="h-[550px] w-full rounded-xl overflow-hidden bg-[#020617]">
          <MapContainer 
            center={[-30.1, -52.5]} 
            zoom={7} 
            maxZoom={12} 
            minZoom={5}
            zoomControl={false}
            boxZoom={false} 
            style={{ height: '100%', width: '100%' }}
          >
            <MapResizer />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
              className="dark-base-map"
              maxZoom={19}
            />
            
            {radarHost && radarFrames.map((frame, idx) => (
              <TileLayer
                key={`${frame.path}-${idx}`}
                url={`${radarHost}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`}
                opacity={idx === activeFrameIndex ? 0.85 : 0}
                maxNativeZoom={6} 
                maxZoom={12}
                zIndex={10 + idx}
              />
            ))}

            {BASES.map((base) => (
              <React.Fragment key={base.id}>
                <Circle center={[base.lat, base.lon]} radius={15000} color={base.id === 'SBCO' ? '#38bdf8' : '#64748b'} weight={1} fill={false} opacity={0.3} dashArray="2, 6" />
                <CircleMarker center={[base.lat, base.lon]} radius={4} color="#000" weight={2} fillColor={base.id === 'SBCO' ? '#38bdf8' : '#94a3b8'} fillOpacity={1} zIndexOffset={100}>
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>{base.id}</Tooltip>
                </CircleMarker>
              </React.Fragment>
            ))}

          </MapContainer>
        </div>
      </div>
      
    </div>
  );
}
