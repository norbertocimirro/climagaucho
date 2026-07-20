import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, ThermometerSun } from 'lucide-react';
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

const TargetTelemetry = () => {
  const [pos, setPos] = useState({ lat: 0, lng: 0 });
  useMapEvents({
    mousemove(e) { setPos(e.latlng); }
  });
  return (
    <div className="absolute bottom-4 right-4 z-[400] bg-black/90 p-2 border border-[#30D158]/50 text-[#30D158] font-mono text-[10px] shadow-[0_0_10px_rgba(48,209,88,0.2)] pointer-events-none">
      <div className="text-white/50 mb-1 border-b border-[#30D158]/30 pb-1">RADAR TELEMETRY</div>
      <div>LAT: {pos.lat.toFixed(4)}°</div>
      <div>LON: {pos.lng.toFixed(4)}°</div>
    </div>
  );
};

// ==========================================
// COMPONENTE: TERMINAL DA CIDADE (COM GRÁFICOS)
// ==========================================
const TerminalCard = ({ data }) => {
  if (!data) return <div className="p-6 bg-[#0a0a0a] border border-gray-800 animate-pulse h-[600px]"></div>;

  // Cálculos para os gráficos de barra (Normalização)
  const maxGust6h = Math.max(...data.hourly.map(h => h.gust), 1);
  const maxRain5d = Math.max(...data.forecast.map(d => d.rain), 1);

  return (
    <div className="bg-[#050505] p-5 border border-gray-800 relative overflow-hidden flex flex-col gap-4 font-mono">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-gray-700 pb-2 z-10">
        <div>
          <div className="text-[10px] text-gray-500 mb-1">STATION ID</div>
          <h2 className="text-2xl font-bold text-white tracking-widest">{data.city.toUpperCase()}</h2>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-500 mb-1">UV MÁX</div>
          <span className="text-sm font-bold text-yellow-500">{data.daily.uv}</span>
        </div>
      </div>

      {/* DADOS METAR (AVIAÇÃO) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between z-10 py-2 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-sm">
            {getWeatherIcon(data.current.code, data.current.isDay)}
          </div>
          <div>
            <h1 className={`text-6xl font-bold ${getTempColor(data.current.code)} tracking-tighter`}>{data.current.temp}°</h1>
            <p className="text-gray-500 text-[10px] mt-1">SENS. TÉRMICA: {data.current.feels}°</p>
          </div>
        </div>
        
        {/* Painel METAR Estendido */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 bg-black p-3 border border-gray-800 w-full md:w-auto">
          <div className="flex justify-between gap-3"><span className="text-gray-600">WND</span><span className="text-white">{data.current.windSpd} KM/H</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-600">GUST</span><span className="text-red-400">{data.current.gusts} KM/H</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-600">VIS</span><span className="text-white">{data.current.visibility} M</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-600">CLD</span><span className="text-white">{data.current.clouds}%</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-600">QNH</span><span className="text-white">{data.current.pressure} HPA</span></div>
          <div className="flex justify-between gap-3"><span className="text-gray-600">DEW</span><span className="text-blue-300">{data.current.dewPoint}°</span></div>
        </div>
      </div>

      {/* MÓDULO 1: PILOTO (6H TREND & WIND GUST CHART) */}
      <div className="mt-2 z-10 border border-gray-800 bg-black/50 p-3">
        <div className="text-[10px] text-[#30D158] border-b border-gray-800 pb-1 mb-2 font-bold tracking-widest">AVIAÇÃO: JANELA 6H (RAJADAS)</div>
        <div className="grid grid-cols-6 gap-2">
          {data.hourly.map((hour, idx) => {
            const barHeight = Math.max((hour.gust / 80) * 100, 5); // 80km/h como teto visual do gráfico
            const isDanger = hour.gust > 40;
            return (
              <div key={idx} className="flex flex-col items-center justify-end h-32 gap-1">
                <span className="text-[9px] text-gray-500 mb-auto">{hour.time}</span>
                <div className="transform scale-75 my-1">{getWeatherIcon(hour.code, 1)}</div>
                <span className={`text-[10px] font-bold ${getTempColor(hour.code)}`}>{hour.temp}°</span>
                
                {/* Gráfico de Barras CSS */}
                <div className="w-full bg-gray-900 h-10 relative mt-1 flex items-end justify-center rounded-t-sm">
                  <div 
                    style={{ height: `${Math.min(barHeight, 100)}%` }} 
                    className={`w-3/4 ${isDanger ? 'bg-red-500' : 'bg-blue-400'} transition-all duration-1000`}
                  ></div>
                </div>
                <span className={`text-[8px] ${isDanger ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{hour.gust}kt</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MÓDULO 2: DEFESA CIVIL (5-DAY OUTLOOK & RAIN CHART) */}
      <div className="mt-2 z-10 border border-gray-800 bg-black/50 p-3">
        <div className="text-[10px] text-yellow-500 border-b border-gray-800 pb-1 mb-2 font-bold tracking-widest">DEFESA CIVIL: ACUMULADO 5 DIAS</div>
        <div className="grid grid-cols-5 gap-2">
          {data.forecast.map((day, idx) => {
            const rainHeight = Math.max((day.rain / maxRain5d) * 100, 2); 
            const isHeavyRain = day.rain > 25;
            return (
              <div key={idx} className="flex flex-col items-center justify-end h-36 gap-1">
                <span className={`text-[10px] font-bold ${idx === 0 ? 'text-white' : 'text-gray-500'}`}>{day.dayName}</span>
                <div className="transform scale-90 my-1">{getWeatherIcon(day.code, 1)}</div>
                <span className="text-[9px] text-gray-400">{day.min}°/{day.max}°</span>
                
                {/* Gráfico de Barras CSS Hidrológico */}
                <div className="w-full bg-gray-900 h-12 relative mt-1 flex items-end justify-center rounded-t-sm border-b border-blue-900/50">
                  <div 
                    style={{ height: `${rainHeight}%` }} 
                    className={`w-4/5 ${isHeavyRain ? 'bg-blue-500' : 'bg-blue-800'} transition-all duration-1000`}
                  ></div>
                </div>
                <span className={`text-[9px] ${isHeavyRain ? 'text-blue-400 font-bold' : 'text-gray-600'}`}>
                  {day.rain > 0 ? `${day.rain.toFixed(1)}mm` : '0mm'}
                </span>
              </div>
            );
          })}
        </div>
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
  const [threatLevel, setThreatLevel] = useState({ level: 'GREEN', text: 'SINCRONIZANDO DADOS...' });

  useEffect(() => {
    const fetchWeather = async (lat, lon, city) => {
      // API 100% Completa (Adicionado Dew Point / Ponto de Orvalho)
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility,cloud_cover,pressure_msl,relative_humidity_2m&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=America%2FSao_Paulo`;
      const res = await fetch(url);
      const json = await res.json();

      // Cálculo simplificado do Ponto de Orvalho baseado na Umidade Relativa e Temp
      const temp = json.current.temperature_2m;
      const rh = json.current.relative_humidity_2m;
      const dewPoint = Math.round(temp - ((100 - rh) / 5));

      const currentHourIdx = new Date().getHours();
      let hourlyForecast = [];
      for (let i = 1; i <= 6; i++) {
        let idx = currentHourIdx + i;
        if (idx < json.hourly.time.length) {
          hourlyForecast.push({
            time: json.hourly.time[idx].split("T")[1],
            temp: Math.round(json.hourly.temperature_2m[idx]),
            code: json.hourly.weather_code[idx],
            precip: json.hourly.precipitation[idx],
            gust: Math.round(json.hourly.wind_gusts_10m[idx])
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
          temp: Math.round(temp),
          feels: Math.round(json.current.apparent_temperature),
          isDay: json.current.is_day,
          code: json.current.weather_code,
          visibility: json.current.visibility || 10000,
          pressure: Math.round(json.current.pressure_msl),
          windSpd: Math.round(json.current.wind_speed_10m),
          gusts: Math.round(json.current.wind_gusts_10m),
          clouds: json.current.cloud_cover,
          precip: json.current.precipitation,
          dewPoint: dewPoint
        },
        daily: {
          max: Math.round(json.daily.temperature_2m_max[0]),
          min: Math.round(json.daily.temperature_2m_min[0]),
          uv: Math.round(json.daily.uv_index_max[0])
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

      // INTELIGÊNCIA CRÍTICA: PILOTO + DEFESA CIVIL
      const maxGust = Math.max(bage.current.gusts, canoas.current.gusts);
      const worstCode = Math.max(bage.current.code, canoas.current.code);
      const minVis = Math.min(bage.current.visibility, canoas.current.visibility);
      const rainAccumulated = canoas.forecast[0].rain + bage.forecast[0].rain; // Soma da chuva de hoje nas duas bases
      
      if (minVis <= 3000 || maxGust >= 60 || worstCode >= 95) {
        setThreatLevel({ level: 'RED', text: 'NO-GO VFR. Risco EVAM Alto. Defesa Civil: Alerta de Desastre Natural' });
      } else if (minVis <= 5000 || maxGust >= 40 || worstCode >= 51 || rainAccumulated > 40) {
        setThreatLevel({ level: 'YELLOW', text: 'STANDBY. Condições marginais VFR. Defesa Civil: Monitorar saturação do solo' });
      } else {
        setThreatLevel({ level: 'GREEN', text: 'VMC TOTAL. Envelope Liberado. Defesa Civil: Risco Hidrológico Baixo' });
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  const hacoCoords = [-29.92, -51.18];
  const bageCoords = [-31.33, -54.11];

  const threatColors = {
    RED: "bg-red-900 border-red-500 text-red-200",
    YELLOW: "bg-yellow-900 border-yellow-500 text-yellow-200",
    GREEN: "bg-green-900/30 border-green-500/50 text-green-400"
  };

  const ThreatIcon = threatLevel.level === 'GREEN' ? CheckCircle2 : AlertTriangle;

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-6 font-mono text-gray-200 selection:bg-[#30D158] selection:text-black flex flex-col gap-4">
      
      <style>{`
        body { background-color: #050505; }
        .leaflet-container { background-color: #050505 !important; cursor: crosshair !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(80%) contrast(120%) grayscale(50%); }
        .leaflet-tooltip { background: #000 !important; border: 1px solid #30D158 !important; color: #30D158 !important; font-family: monospace; font-size: 10px; font-weight: bold; border-radius: 0 !important; box-shadow: none !important; }
        .leaflet-tooltip-right::before { border-right-color: #30D158 !important; }
        .leaflet-tooltip-left::before { border-left-color: #30D158 !important; }
      `}</style>

      {/* CABEÇALHO DE COMANDO JOINT (FAB + DC) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-[0.2em]">C.O.C. METEOROLÓGICO HACO</h1>
          <p className="text-xs text-[#30D158] mt-1 tracking-widest">AVIAÇÃO DE RESGATE & CONTROLE DE DESASTRES</p>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 border ${threatColors[threatLevel.level]}`}>
          <ThreatIcon size={20} className="animate-pulse" />
          <span className="text-xs font-bold tracking-widest">{threatLevel.text}</span>
        </div>
      </div>
      
      {/* MÓDULOS DE ESTAÇÃO (COM GRÁFICOS) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TerminalCard data={weatherData.bage} />
        <TerminalCard data={weatherData.canoas} />
      </div>

      {/* TELA DO RADAR (LIMPA E TÁTICA) */}
      <div className="border border-gray-800 relative bg-[#050505] mt-2">
        
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

        <div className="h-[600px] w-full bg-[#050505]">
          <MapContainer 
            key={radar.path ? `map-${radar.path}` : "map-loading"}
            center={[-30.627, -52.646]} 
            zoom={6} 
            maxZoom={12} 
            minZoom={5}
            style={{ height: '100%', width: '100%', background: '#050505' }}
            zoomControl={false}
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
