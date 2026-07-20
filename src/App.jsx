import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, PlaneTakeoff, ShieldAlert } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  if (visibility < 3000 || windGust > 50) return { rule: "IFR", color: "bg-rose-500/20 text-rose-400 border-rose-500/50", status: "CRÍTICO (INSTRUMENTOS)" };
  if (visibility < 5000 || windGust > 35) return { rule: "MVFR", color: "bg-blue-500/20 text-blue-400 border-blue-500/50", status: "MARGINAL (ATENÇÃO)" };
  return { rule: "VFR", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50", status: "VISUAL (OPERACIONAL)" };
};

const getWindDirection = (degree) => {
  const directions = ["↑ S", "↗ SW", "→ W", "↘ NW", "↓ N", "↙ NE", "← E", "↖ SE"];
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
// COMPONENTE: TERMINAL ESTAÇÃO (SDSOP)
// ==========================================
const StationTerminal = ({ data }) => {
  if (!data) return <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 animate-pulse h-[650px]"></div>;

  const flightData = getFlightCategory(data.current.visibility, data.current.gusts);

  return (
    <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-slate-700/50 flex flex-col gap-5 relative overflow-hidden">
      
      {/* Luzes de Status de Fundo */}
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full opacity-20 pointer-events-none ${flightData.rule === 'IFR' ? 'bg-rose-500' : flightData.rule === 'MVFR' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

      {/* 1. CABEÇALHO DA ESTAÇÃO */}
      <div className="flex justify-between items-start border-b border-slate-700/50 pb-4 z-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            {data.city.toUpperCase()}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${flightData.color} tracking-widest`}>
              STATUS: {flightData.rule}
            </span>
            <span className="text-xs text-slate-400 font-medium">{flightData.status}</span>
          </div>
        </div>
        
        {/* Janela Operacional (Luz Solar) */}
        <div className="flex gap-4 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
          <div className="flex flex-col items-center">
            <Sunrise size={14} className="text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-300">{data.daily.sunrise}</span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="flex flex-col items-center">
            <Sunset size={14} className="text-orange-500 mb-1" />
            <span className="text-[10px] font-bold text-slate-300">{data.daily.sunset}</span>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRIA PRINCIPAL (AVIAÇÃO) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 z-10">
        
        {/* Temperatura e Condição */}
        <div className="col-span-5 flex items-center gap-4">
          <div className="transform scale-[2.2] ml-4">
            {getWeatherIcon(data.current.code, data.current.isDay)}
          </div>
          <div className="ml-4">
            <h1 className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
              {data.current.temp}°
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Thermometer size={12} className="text-slate-400" />
              <span className="text-xs text-slate-300 font-medium">Sensação: {data.current.feels}°</span>
            </div>
          </div>
        </div>
        
        {/* Instrumentos de Voo */}
        <div className="col-span-7 grid grid-cols-2 gap-3">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase"><Compass size={14}/> Vento</div>
            <span className="text-sm font-bold text-slate-100">{getWindDirection(data.current.windDir)} {data.current.windSpd} km/h</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold uppercase"><Wind size={14}/> Rajadas</div>
            <span className="text-sm font-bold text-white">{data.current.gusts} km/h</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase"><Eye size={14}/> Visibilidade</div>
            <span className="text-sm font-bold text-slate-100">{data.current.visibility} m</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase"><Gauge size={14}/> Pressão (QNH)</div>
            <span className="text-sm font-bold text-slate-100">{data.current.pressure} hPa</span>
          </div>
        </div>
      </div>

      {/* 3. RADAR DE 6 HORAS (PRECIPITAÇÃO IMEDIATA) */}
      <div className="mt-2 z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <PlaneTakeoff size={12} className="text-blue-400" /> Janela EVAM / Resgate (6 Horas)
        </h3>
        <div className="grid grid-cols-6 gap-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
          {data.hourly.map((hour, idx) => {
            const rainHeight = Math.min((hour.precip / 15) * 100, 100);
            return (
              <div key={idx} className="flex flex-col items-center justify-between h-32 relative group">
                <span className="text-xs text-slate-300 font-bold">{hour.time}</span>
                <div className="transform scale-110 drop-shadow-md my-auto">{getWeatherIcon(hour.code, 1)}</div>
                
                {/* Visualização de Volume de Chuva */}
                <div className="w-full flex flex-col items-center mt-auto">
                  <div className="w-full bg-slate-800/80 h-10 relative rounded-md flex items-end overflow-hidden border border-slate-700/50">
                    <div style={{ height: `${rainHeight}%` }} className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-1000 shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-300 mt-1.5">
                    {hour.precip > 0 ? `${hour.precip.toFixed(1)} mm` : '0 mm'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DEFESA CIVIL: TENDÊNCIA DE 5 DIAS */}
      <div className="mt-1 z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <ShieldAlert size={12} className="text-amber-400" /> Defesa Civil: Acumulado Hidrológico
        </h3>
        <div className="grid grid-cols-5 gap-2 bg-slate-900/40 p-3 rounded-2xl border border-slate-700/50 shadow-inner">
          {data.forecast.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5 py-1">
              <span className={`text-[10px] font-black tracking-widest ${idx === 0 ? 'text-amber-400' : 'text-slate-400'}`}>{day.dayName}</span>
              <div className="transform scale-90">{getWeatherIcon(day.code, 1)}</div>
              <span className="text-[11px] font-bold text-slate-300 mt-1">{day.min}° / {day.max}°</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border ${day.rain > 15 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {day.rain > 0 ? `${day.rain.toFixed(1)} mm` : '0 mm'}
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
  const [weatherData, setWeatherData] = useState({ bage: null, canoas: null });
  const [radar, setRadar] = useState({ host: "", path: "", time: "" });
  
  // Status Dividido: Aviação e Terrestre
  const [flightStatus, setFlightStatus] = useState({ level: 'GREEN', text: 'Sincronizando Aviação...' });
  const [civilStatus, setCivilStatus] = useState({ level: 'GREEN', text: 'Sincronizando Solo...' });

  useEffect(() => {
    const fetchWeather = async (lat, lon, city) => {
      // API Master: Incluindo Sunrise, Sunset e Direção do Vento
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,relative_humidity_2m,pressure_msl&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=America%2FSao_Paulo`;
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
        city,
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
          uv: Math.round(json.daily.uv_index_max[0]),
          sunrise: formatTime(json.daily.sunrise[0]),
          sunset: formatTime(json.daily.sunset[0])
        },
        hourly: hourlyForecast,
        forecast: daysForecast
      };
    };

    const fetchRadar = async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        const past = data.radar.past;
        const last = past[past.length - 1]; 
        const dateObj = new Date(last.time * 1000);
        const timeStr = dateObj.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
        setRadar({ host: data.host, path: last.path, time: timeStr });
      } catch (error) {
        console.error("Erro no Radar", error);
      }
    };

    const loadAll = async () => {
      const bage = await fetchWeather(-31.33, -54.11, "Bagé");
      const canoas = await fetchWeather(-29.92, -51.18, "Canoas");
      setWeatherData({ bage, canoas });
      await fetchRadar();

      // INTELIGÊNCIA SEPARADA: AVIAÇÃO VS TERRESTRE
      const maxGust = Math.max(bage.current.gusts, canoas.current.gusts);
      const minVis = Math.min(bage.current.visibility, canoas.current.visibility);
      const rainAccumulated = canoas.forecast[0].rain + bage.forecast[0].rain; 
      
      // Avaliação de Voo (Teto, Visibilidade, Vento)
      if (minVis <= 3000 || maxGust >= 60) {
        setFlightStatus({ level: 'RED', text: 'IFR: Voo Visual Suspenso. Teto/Visibilidade Críticos.' });
      } else if (minVis <= 5000 || maxGust >= 40) {
        setFlightStatus({ level: 'YELLOW', text: 'MVFR: Condições Marginais. Requer aprovação de comando.' });
      } else {
        setFlightStatus({ level: 'GREEN', text: 'VFR: Voo Visual Liberado. Envelope Seguro.' });
      }

      // Avaliação Defesa Civil (Acúmulo de Água)
      if (rainAccumulated > 50) {
        setCivilStatus({ level: 'RED', text: 'ALERTA TERRESTRE: Risco alto de alagamentos e saturação de solo.' });
      } else if (rainAccumulated > 20) {
        setCivilStatus({ level: 'YELLOW', text: 'ATENÇÃO TERRESTRE: Monitoramento hidrológico ativado na rota.' });
      } else {
        setCivilStatus({ level: 'GREEN', text: 'SOLO ESTÁVEL: Risco Hidrológico Operacional Baixo.' });
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  const hacoCoords = [-29.92, -51.18];
  const bageCoords = [-31.33, -54.11];

  const statusColors = {
    RED: "bg-rose-500/10 border-rose-500/40 text-rose-400",
    YELLOW: "bg-amber-500/10 border-amber-500/40 text-amber-400",
    GREEN: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
  };

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-slate-200 font-sans flex flex-col gap-8"
         style={{ background: 'radial-gradient(circle at top center, #0f172a, #020617)' }}>
      
      <style>{`
        .leaflet-container { background-color: #020617 !important; border-radius: 1.5rem; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) grayscale(40%); }
        .leaflet-tooltip { background: rgba(15, 23, 42, 0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; border-radius: 8px !important; backdrop-filter: blur(8px); }
        .leaflet-tooltip-right::before { border-right-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-left::before { border-left-color: rgba(15, 23, 42, 0.95) !important; }
      `}</style>

      {/* CABEÇALHO C2 PREMIUM */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 max-w-[1500px] mx-auto w-full border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 tracking-tight">
            C.O.C. METEOROLÓGICO
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-bold tracking-widest flex items-center gap-2">
            <ShieldAlert size={14} className="text-blue-500"/> SDSOP / HACO CANOAS
          </p>
        </div>
        
        {/* MATRIZ DE AMEAÇA DUPLA (DECEA + DC) */}
        <div className="flex flex-col gap-2 w-full xl:w-auto">
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border backdrop-blur-md shadow-lg ${statusColors[flightStatus.level]}`}>
            <PlaneTakeoff size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{flightStatus.text}</span>
          </div>
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border backdrop-blur-md shadow-lg ${statusColors[civilStatus.level]}`}>
            <Droplets size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{civilStatus.text}</span>
          </div>
        </div>
      </div>
      
      {/* GRID DOS CARDS TÁTICOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1500px] mx-auto w-full">
        <StationTerminal data={weatherData.bage} />
        <StationTerminal data={weatherData.canoas} />
      </div>

      {/* RADAR TÁTICO HÍBRIDO (LIMPO E EFICIENTE) */}
      <div className="w-full max-w-[1500px] mx-auto relative rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 p-2 bg-slate-900/50 backdrop-blur-sm mt-4">
        
        <div className="absolute top-6 left-6 z-[400] bg-[#020617]/90 p-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-rose-500 text-white text-xs font-black px-2 py-1 rounded shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse">LIVE</span>
            <span className="text-slate-200 text-sm font-bold tracking-widest uppercase">Radar Nexrad OPN</span>
          </div>
          <div className="text-cyan-400 text-xs font-bold flex items-center gap-2 border-t border-slate-800 pt-2">
            Última varredura satélite: {radar.time || "--:--"}
          </div>
        </div>

        <div className="h-[650px] w-full rounded-3xl overflow-hidden bg-[#020617]">
          <MapContainer 
            key={radar.path ? `map-${radar.path}` : "map-loading"}
            center={[-30.627, -52.646]} 
            zoom={6} 
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
            
            {radar.path && (
              <TileLayer
                url={`${radar.host}${radar.path}/256/{z}/{x}/{y}/6/1_1.png`}
                opacity={0.85}
                maxNativeZoom={6} 
                maxZoom={12}
                zIndex={10}
              />
            )}

            <Circle center={hacoCoords} radius={100000} color="#38bdf8" weight={1} fill={false} opacity={0.2} dashArray="5, 10" />
            <Circle center={hacoCoords} radius={200000} color="#38bdf8" weight={1} fill={false} opacity={0.2} dashArray="5, 10" />
            
            <CircleMarker center={hacoCoords} radius={6} color="#000" weight={2} fillColor="#38bdf8" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="right" offset={[12, 0]} opacity={1} permanent>HACO (CANOAS)</Tooltip>
            </CircleMarker>

            <CircleMarker center={bageCoords} radius={6} color="#000" weight={2} fillColor="#f59e0b" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="left" offset={[-12, 0]} opacity={1} permanent>BASE BAGÉ</Tooltip>
            </CircleMarker>

          </MapContainer>
        </div>
      </div>
      
    </div>
  );
}
