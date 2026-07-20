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
// COMPONENTE: TERMINAL ESTAÇÃO
// ==========================================
const StationTerminal = ({ data }) => {
  if (!data) return <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 animate-pulse h-[650px]"></div>;

  const flightData = getFlightCategory(data.current.visibility, data.current.gusts);

  return (
    <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-slate-700/50 flex flex-col gap-4 relative overflow-hidden">
      
      {/* Luzes de Status de Fundo */}
      <div className={`absolute top-0 right-0 w-48 h-48 blur-[100px] rounded-full opacity-20 pointer-events-none ${flightData.rule === 'IFR' ? 'bg-rose-500' : flightData.rule === 'MVFR' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>

      {/* 1. CABEÇALHO */}
      <div className="flex justify-between items-start border-b border-slate-700/50 pb-3 z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            {data.city}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${flightData.color} tracking-widest`}>
              {flightData.rule}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{flightData.status}</span>
          </div>
        </div>
        
        {/* Janela Operacional */}
        <div className="flex gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
          <div className="flex flex-col items-center">
            <Sunrise size={12} className="text-amber-400 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-300">{data.daily.sunrise}</span>
          </div>
          <div className="w-px h-6 bg-slate-700 mt-1"></div>
          <div className="flex flex-col items-center">
            <Sunset size={12} className="text-orange-500 mb-0.5" />
            <span className="text-[9px] font-bold text-slate-300">{data.daily.sunset}</span>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRIA (AVIAÇÃO) */}
      <div className="flex flex-col xl:flex-row gap-4 z-10 items-center">
        <div className="flex items-center gap-3 min-w-[150px]">
          <div className="transform scale-[2] ml-2">
            {getWeatherIcon(data.current.code, data.current.isDay)}
          </div>
          <div className="ml-3">
            <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
              {data.current.temp}°
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <Thermometer size={10} className="text-slate-400" />
              <span className="text-[10px] text-slate-300 font-medium">Sens: {data.current.feels}°</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><Compass size={12}/> VNT</div>
            <span className="text-xs font-bold text-slate-100">{getWindDirection(data.current.windDir)} {data.current.windSpd}</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold"><Wind size={12}/> RAJ</div>
            <span className="text-xs font-bold text-white">{data.current.gusts} kt</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><Eye size={12}/> VIS</div>
            <span className="text-xs font-bold text-slate-100">{data.current.visibility} m</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/30 flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold"><Gauge size={12}/> QNH</div>
            <span className="text-xs font-bold text-slate-100">{data.current.pressure}</span>
          </div>
        </div>
      </div>

      {/* 3. RADAR 6 HORAS */}
      <div className="mt-1 z-10">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <PlaneTakeoff size={10} className="text-blue-400" /> Janela EVAM (6H)
        </h3>
        <div className="grid grid-cols-6 gap-1.5 bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 shadow-inner">
          {data.hourly.map((hour, idx) => {
            const rainHeight = Math.min((hour.precip / 15) * 100, 100);
            return (
              <div key={idx} className="flex flex-col items-center justify-between h-28 relative">
                <span className="text-[10px] text-slate-300 font-bold">{hour.time}</span>
                <div className="transform scale-90 drop-shadow-md my-auto">{getWeatherIcon(hour.code, 1)}</div>
                
                <div className="w-full flex flex-col items-center mt-auto">
                  <div className="w-full bg-slate-800/80 h-8 relative rounded flex items-end overflow-hidden border border-slate-700/50">
                    <div style={{ height: `${rainHeight}%` }} className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-1000"></div>
                  </div>
                  <span className="text-[9px] font-bold text-cyan-300 mt-1">
                    {hour.precip > 0 ? `${hour.precip.toFixed(1)}` : '0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. DEFESA CIVIL: 5 DIAS */}
      <div className="mt-1 z-10">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <ShieldAlert size={10} className="text-amber-400" /> Defesa Civil (Solo)
        </h3>
        <div className="grid grid-cols-5 gap-1.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/50 shadow-inner">
          {data.forecast.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 py-1">
              <span className={`text-[9px] font-black tracking-wider ${idx === 0 ? 'text-amber-400' : 'text-slate-400'}`}>{day.dayName}</span>
              <div className="transform scale-75">{getWeatherIcon(day.code, 1)}</div>
              <span className="text-[10px] font-bold text-slate-300">{day.min}°/{day.max}°</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${day.rain > 15 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
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
      // 1. Busca Clima para TODAS as 6 Bases
      const promises = BASES.map(base => fetchWeatherForBase(base));
      const results = await Promise.all(promises);
      setStationsData(results);

      // 2. Inteligência Tática sobre toda a FIR
      const maxGust = Math.max(...results.map(r => r.current.gusts));
      const minVis = Math.min(...results.map(r => r.current.visibility));
      const maxRain = Math.max(...results.map(r => r.forecast[0].rain)); 

      if (minVis <= 3000 || maxGust >= 60) {
        setFlightStatus({ level: 'RED', text: 'IFR GERAL: Condições Críticas na FIR Sul.' });
      } else if (minVis <= 5000 || maxGust >= 40) {
        setFlightStatus({ level: 'YELLOW', text: 'MVFR: Teto Marginal. Atenção ao EVAM.' });
      } else {
        setFlightStatus({ level: 'GREEN', text: 'VFR: Corredores Visuais Liberados.' });
      }

      if (maxRain > 50) {
        setCivilStatus({ level: 'RED', text: 'ALERTA DC: Risco Hidrológico Extremo.' });
      } else if (maxRain > 20) {
        setCivilStatus({ level: 'YELLOW', text: 'ATENÇÃO DC: Saturação de solo detectada.' });
      } else {
        setCivilStatus({ level: 'GREEN', text: 'SOLO OK: Condição Terrestre Normal.' });
      }

      // 3. Busca Dados do Radar (INCLUINDO NOWCAST / PREVISÃO)
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        
        setRadarHost(data.host);
        
        // Pega as últimas 5 fotos do passado + as próximas 3 de projeção (Nowcast)
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

  // LOOP DE ANIMAÇÃO DO RADAR (Roda a cada 1.5 segundos)
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

  // Formata o relógio do radar com base no frame ativo
  const activeFrameData = radarFrames[activeFrameIndex];
  let radarTimeLabel = "--:--";
  let isProjection = false;
  
  if (activeFrameData) {
    const d = new Date(activeFrameData.time * 1000);
    radarTimeLabel = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    isProjection = activeFrameData.type === 'NOWCAST';
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-6 text-slate-200 font-sans flex flex-col gap-6"
         style={{ background: 'radial-gradient(circle at top center, #0f172a, #020617)' }}>
      
      <style>{`
        .leaflet-container { background-color: #020617 !important; border-radius: 1.5rem; cursor: crosshair !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) grayscale(40%); }
        .leaflet-tooltip { background: rgba(15, 23, 42, 0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; border-radius: 6px !important; backdrop-filter: blur(8px); padding: 4px 8px; font-size: 10px; }
        .leaflet-tooltip-right::before { border-right-color: rgba(15, 23, 42, 0.95) !important; }
        .leaflet-tooltip-left::before { border-left-color: rgba(15, 23, 42, 0.95) !important; }
      `}</style>

      {/* CABEÇALHO C2 */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 max-w-full mx-auto w-full border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 tracking-tight">
            C.O.C. ESTADUAL (RS)
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-bold tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-blue-500"/> COMANDO: SDSOP / HACO CANOAS
          </p>
        </div>
        
        {/* MATRIZ DE AMEAÇA DUPLA (DECEA + DC) */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-md shadow-lg ${statusColors[flightStatus.level]}`}>
            <PlaneTakeoff size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{flightStatus.text}</span>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border backdrop-blur-md shadow-lg ${statusColors[civilStatus.level]}`}>
            <ShieldAlert size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{civilStatus.text}</span>
          </div>
        </div>
      </div>
      
      {/* 
        GRID DE TERMINAIS (REDE DE BASES) 
        Ajustado para caber 2 por linha em telas normais, e 3 em telas Ultra-Wide
      */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 max-w-full mx-auto w-full">
        {stationsData.map((data, idx) => (
          <StationTerminal key={idx} data={data} />
        ))}
      </div>

      {/* TELA DO RADAR TÁTICO (ANIMADO E HÍBRIDO) */}
      <div className="w-full max-w-full mx-auto relative rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 p-2 bg-slate-900/50 backdrop-blur-sm mt-2">
        
        {/* HUD DO RADAR */}
        <div className="absolute top-6 left-6 z-[400] bg-[#020617]/90 p-4 rounded-2xl border border-slate-700/50 shadow-2xl pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse">AUTO</span>
            <span className="text-slate-200 text-[10px] font-bold tracking-widest uppercase">Radar de Varredura</span>
          </div>
          
          {/* DISPLAY DE TEMPO E PREVISÃO */}
          <div className={`text-xl font-black tracking-widest border-t border-slate-800 pt-2 ${isProjection ? 'text-amber-400' : 'text-cyan-400'}`}>
            {radarTimeLabel}
          </div>
          <div className={`text-[9px] font-bold mt-1 ${isProjection ? 'text-amber-500/70' : 'text-cyan-500/70'}`}>
            {isProjection ? "PROJEÇÃO DE ROTA (NOWCAST)" : "LEITURA DE SATÉLITE (REAL)"}
          </div>
        </div>

        <div className="h-[700px] w-full rounded-3xl overflow-hidden bg-[#020617]">
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

            {/* MAPA BASE BLINDADO */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
              className="dark-base-map"
              maxZoom={19}
            />
            
            {/* 
              O MOTOR DE ANIMAÇÃO:
              Renderizamos TODOS os frames de chuva de uma vez, mas deixamos apenas o 
              frame "Ativo" com opacidade visível. Isso mata o lag de carregamento.
            */}
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

            {/* PINOS DE TODAS AS 6 BASES DO RS */}
            {BASES.map((base, idx) => (
              <React.Fragment key={base.id}>
                <Circle center={[base.lat, base.lon]} radius={15000} color={base.id === 'SBCO' ? '#38bdf8' : '#64748b'} weight={1} fill={false} opacity={0.3} dashArray="2, 6" />
                <CircleMarker center={[base.lat, base.lon]} radius={4} color="#000" weight={2} fillColor={base.id === 'SBCO' ? '#38bdf8' : '#94a3b8'} fillOpacity={1} zIndexOffset={100}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>{base.id}</Tooltip>
                </CircleMarker>
              </React.Fragment>
            ))}

          </MapContainer>
        </div>
      </div>
      
    </div>
  );
}
