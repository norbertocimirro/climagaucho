import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// FUNÇÕES AUXILIARES DE CLIMA
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun className="text-yellow-400" /> : <Moon className="text-blue-300" />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className="text-yellow-200" /> : <Cloud className="text-gray-400" />;
  if (code === 3) return <Cloud className="text-gray-500" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className="text-blue-400" />;
  if (code >= 61 && code <= 65) return <CloudRain className="text-blue-500" />;
  if (code >= 80 && code <= 82) return <CloudRain className="text-blue-600" />;
  if (code >= 95) return <CloudLightning className="text-red-500" />;
  return <Cloud className="text-gray-600" />;
};

const getTempColor = (code) => {
  if (code >= 95) return "text-red-500";
  if (code >= 65 || code === 82) return "text-blue-400";
  return "text-[#30D158]";
};

// ==========================================
// COMPONENTES DO MAPA (TÁTICOS)
// ==========================================
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => { map.invalidateSize(); }, 400);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
};

// Captura a Latitude e Longitude do mouse em tempo real
const TargetTelemetry = () => {
  const [pos, setPos] = useState({ lat: 0, lng: 0 });
  useMapEvents({
    mousemove(e) { setPos(e.latlng); }
  });
  return (
    <div className="absolute bottom-4 right-4 z-[400] bg-black/90 p-2 border border-[#30D158]/50 text-[#30D158] font-mono text-[10px] shadow-[0_0_10px_rgba(48,209,88,0.2)] pointer-events-none">
      <div className="text-white/50 mb-1 border-b border-[#30D158]/30 pb-1">TGT TELEMETRY</div>
      <div>LAT: {pos.lat.toFixed(4)}°</div>
      <div>LON: {pos.lng.toFixed(4)}°</div>
    </div>
  );
};

// ==========================================
// COMPONENTE: TERMINAL DA CIDADE
// ==========================================
const TerminalCard = ({ data }) => {
  if (!data) return <div className="p-6 bg-[#0a0a0a] border border-gray-800 animate-pulse h-[400px]"></div>;

  return (
    <div className="bg-[#050505] p-5 border border-gray-800 relative overflow-hidden flex flex-col gap-4 font-mono">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-gray-700 pb-2 z-10">
        <div>
          <div className="text-[10px] text-gray-500 mb-1">STATION ID</div>
          <h2 className="text-xl font-bold text-white tracking-widest">{data.city.toUpperCase()}</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 mb-1">T/MAX - T/MIN</div>
          <span className="text-sm font-bold text-gray-300">{data.daily.max}° / {data.daily.min}°</span>
        </div>
      </div>

      {/* DADOS METAR/ATUAIS */}
      <div className="flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-900 border border-gray-700">
            {getWeatherIcon(data.current.code, data.current.isDay)}
          </div>
          <div>
            <h1 className={`text-5xl font-bold ${getTempColor(data.current.code)}`}>{data.current.temp}°</h1>
            <p className="text-gray-500 text-[10px] mt-1">FL Tº {data.current.feels}°</p>
          </div>
        </div>
        
        {/* Painel de Aviação */}
        <div className="flex flex-col gap-2 text-[10px] text-gray-400 bg-black p-3 border border-gray-800 min-w-[120px]">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-gray-500"><Wind size={12}/> WND</span>
            <span className="text-white">{data.current.windSpd} KM/H</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-gray-500"><Eye size={12}/> VIS</span>
            <span className="text-white">{data.current.visibility} M</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-gray-500"><Gauge size={12}/> QNH</span>
            <span className="text-white">{data.current.pressure} HPA</span>
          </div>
        </div>
      </div>

      {/* PREVISÃO DE CURTO PRAZO (HORAS) */}
      <div className="text-[10px] text-gray-500 mt-2 z-10">SHORT-TERM FORECAST (6H)</div>
      <div className="grid grid-cols-6 gap-1 z-10">
        {data.hourly.map((hour, idx) => (
          <div key={idx} className="flex flex-col items-center bg-gray-900/50 border border-gray-800 p-2">
            <span className="text-[9px] text-gray-400">{hour.time}</span>
            <div className="my-2 transform scale-75">{getWeatherIcon(hour.code, 1)}</div>
            <span className={`text-xs font-bold ${getTempColor(hour.code)}`}>{hour.temp}°</span>
            <span className="text-[9px] text-blue-400 mt-1">{hour.precip > 0 ? `${hour.precip}mm` : '---'}</span>
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
  const [weatherData, setWeatherData] = useState({ bage: null, canoas: null });
  const [radar, setRadar] = useState({ host: "", path: "", time: "" });
  const [threatLevel, setThreatLevel] = useState({ level: 'GREEN', text: 'MONITORAMENTO NORMAL' });

  useEffect(() => {
    const fetchWeather = async (lat, lon, city) => {
      // API Expandida: visibility, pressure_msl
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,visibility,pressure_msl&hourly=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`;
      const res = await fetch(url);
      const json = await res.json();

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
          precip: json.current.precipitation
        },
        daily: {
          max: Math.round(json.daily.temperature_2m_max[0]),
          min: Math.round(json.daily.temperature_2m_min[0])
        },
        hourly: hourlyForecast
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

      // LÓGICA DE DEFESA CIVIL (THREAT LEVEL)
      const maxWind = Math.max(bage.current.windSpd, canoas.current.windSpd);
      const worstCode = Math.max(bage.current.code, canoas.current.code);
      
      if (maxWind > 45 || worstCode >= 80) {
        setThreatLevel({ level: 'RED', text: 'ALERTA SEVERO: RISCO OPERACIONAL' });
      } else if (maxWind > 30 || worstCode >= 51) {
        setThreatLevel({ level: 'YELLOW', text: 'ATENÇÃO: CONDIÇÕES DEGRADADAS' });
      } else {
        setThreatLevel({ level: 'GREEN', text: 'CONDIÇÕES NORMAIS DE VOO/OPERAÇÃO' });
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  const hacoCoords = [-29.92, -51.18];
  const bageCoords = [-31.33, -54.11];

  // Cores do Banner de Alerta
  const threatColors = {
    RED: "bg-red-900 border-red-500 text-red-200",
    YELLOW: "bg-yellow-900 border-yellow-500 text-yellow-200",
    GREEN: "bg-green-900/30 border-green-500/50 text-green-400"
  };

  const ThreatIcon = threatLevel.level === 'GREEN' ? CheckCircle2 : AlertTriangle;

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-6 font-mono text-gray-200 selection:bg-[#30D158] selection:text-black flex flex-col gap-4">
      
      {/* ESTILOS DE SISTEMA & ANIMAÇÃO DO RADAR */}
      <style>{`
        body { background-color: #050505; }
        .leaflet-container { background-color: #050505 !important; cursor: crosshair !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(120%) grayscale(50%); }
        .leaflet-tooltip { background: #000 !important; border: 1px solid #30D158 !important; color: #30D158 !important; font-family: monospace; font-size: 10px; font-weight: bold; border-radius: 0 !important; box-shadow: none !important; }
        .leaflet-tooltip-right::before { border-right-color: #30D158 !important; }
        .leaflet-tooltip-left::before { border-left-color: #30D158 !important; }
        
        /* ANIMAÇÃO DA VARREDURA DO RADAR */
        @keyframes scanline {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(500px); opacity: 0; }
        }
        .scanner-beam {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: #30D158; box-shadow: 0 0 15px 2px #30D158;
          animation: scanline 4s linear infinite;
          z-index: 401; pointer-events: none;
        }
      `}</style>

      {/* CABEÇALHO COMANDOS / DEFESA CIVIL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-[0.2em]">SISTEMA SDSOP / HACO</h1>
          <p className="text-xs text-gray-500 mt-1 tracking-widest">MONITORAMENTO METEOROLÓGICO TÁTICO</p>
        </div>
        
        {/* BANNER DE AMEAÇA DINÂMICO */}
        <div className={`flex items-center gap-3 px-4 py-2 border ${threatColors[threatLevel.level]} animate-pulse`}>
          <ThreatIcon size={18} />
          <span className="text-xs font-bold tracking-widest">{threatLevel.text}</span>
        </div>
      </div>
      
      {/* MÓDULOS DE ESTAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TerminalCard data={weatherData.bage} />
        <TerminalCard data={weatherData.canoas} />
      </div>

      {/* TELA DO RADAR TÁTICO */}
      <div className="border border-gray-800 relative bg-[#050505] mt-2">
        
        {/* SCANNER ANIMADO */}
        <div className="scanner-beam"></div>

        {/* HUD SOBREPOSTO */}
        <div className="absolute top-4 left-4 z-[400] bg-black/90 p-3 border border-[#30D158]/50 shadow-[0_0_10px_rgba(48,209,88,0.1)] pointer-events-none">
          <div className="flex items-center gap-2 mb-2 border-b border-[#30D158]/30 pb-2">
            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5">REC</span>
            <span className="text-[#30D158] text-[10px] font-bold tracking-widest">NEXRAD SURFACE RADAR</span>
          </div>
          <div className="text-white text-[10px]">CTRL: HACO / SDSOP</div>
          <div className="text-white text-[10px]">RNG: 100/200/300 KM</div>
          <div className="text-[#30D158] text-[10px] mt-2 font-bold animate-pulse">
            UPDT: {radar.time || "SYNC..."}
          </div>
        </div>

        <div className="h-[500px] w-full bg-[#050505]">
          <MapContainer 
            key={radar.path ? `map-${radar.path}` : "map-loading"}
            center={[-30.627, -52.646]} 
            zoom={6} 
            maxZoom={12} 
            minZoom={5}
            style={{ height: '100%', width: '100%', background: '#050505' }}
            zoomControl={false} // Esconde botões de zoom para visual mais limpo
          >
            <MapResizer />
            <TargetTelemetry />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
              className="dark-base-map"
              maxZoom={19}
            />
            
            {radar.path && (
              <TileLayer
                url={`${radar.host}${radar.path}/256/{z}/{x}/{y}/6/1_1.png`}
                opacity={0.8}
                maxNativeZoom={6} 
                maxZoom={12}
                zIndex={10}
              />
            )}

            {/* EIXOS TÁTICOS COMPLETOS */}
            <Polyline positions={[[-10.0, -51.18], [-40.0, -51.18]]} color="#30D158" weight={1} opacity={0.3} dashArray="2, 6" />
            <Polyline positions={[[-29.92, -70.0], [-29.92, -30.0]]} color="#30D158" weight={1} opacity={0.3} dashArray="2, 6" />

            <Circle center={hacoCoords} radius={100000} color="#30D158" weight={1} fill={false} opacity={0.4} />
            <Circle center={hacoCoords} radius={200000} color="#30D158" weight={1} fill={false} opacity={0.4} />
            <Circle center={hacoCoords} radius={300000} color="#30D158" weight={1} fill={false} opacity={0.4} />

            <CircleMarker center={hacoCoords} radius={4} color="#30D158" weight={2} fillColor="#000" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="right" offset={[10, 0]} opacity={1} permanent>HACO</Tooltip>
            </CircleMarker>

            <CircleMarker center={bageCoords} radius={4} color="#30D158" weight={2} fillColor="#000" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="left" offset={[-10, 0]} opacity={1} permanent>BAGÉ</Tooltip>
            </CircleMarker>

          </MapContainer>
        </div>
      </div>
      
    </div>
  );
}
