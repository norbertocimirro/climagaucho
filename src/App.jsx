import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// FUNÇÕES AUXILIARES DE CLIMA
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun className="text-yellow-400 drop-shadow-md" /> : <Moon className="text-blue-200 drop-shadow-md" />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className="text-yellow-200 drop-shadow-md" /> : <Cloud className="text-gray-300 drop-shadow-md" />;
  if (code === 3) return <Cloud className="text-gray-400 drop-shadow-md" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className="text-blue-300 drop-shadow-md" />;
  if (code >= 61 && code <= 65) return <CloudRain className="text-blue-400 drop-shadow-md" />;
  if (code >= 80 && code <= 82) return <CloudRain className="text-blue-500 drop-shadow-md" />;
  if (code >= 95) return <CloudLightning className="text-red-400 drop-shadow-md" />;
  return <Cloud className="text-gray-500" />;
};

const getTempColor = (code) => {
  if (code >= 95) return "text-red-400";
  if (code >= 65 || code === 82) return "text-blue-400";
  return "text-white";
};

// ==========================================
// COMPONENTES DO MAPA
// ==========================================
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => { map.invalidateSize(); }, 400);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
};

// ==========================================
// COMPONENTE: CARD DA CIDADE (DIDÁTICO & PREMIUM)
// ==========================================
const WeatherCard = ({ data }) => {
  if (!data) return <div className="p-6 bg-white/5 rounded-3xl animate-pulse h-[600px]"></div>;

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6">
      
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">{data.city}</h2>
          <p className="text-sm text-gray-300 font-medium mt-1">Mín {data.daily.min}° • Máx {data.daily.max}°</p>
        </div>
        <div className="bg-black/30 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Índice UV</span>
          <span className="text-lg font-bold text-yellow-400">{data.daily.uv}</span>
        </div>
      </div>

      {/* CLIMA ATUAL & MÉTRICAS DIDÁTICAS */}
      <div className="flex flex-col xl:flex-row gap-6 items-center">
        {/* Bloco de Temperatura */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <div className="transform scale-[2.5] ml-4 drop-shadow-2xl">
            {getWeatherIcon(data.current.code, data.current.isDay)}
          </div>
          <div className="ml-6">
            <h1 className={`text-6xl font-bold tracking-tighter ${getTempColor(data.current.code)} drop-shadow-lg`}>
              {data.current.temp}°
            </h1>
            <p className="text-gray-300 text-sm mt-1 font-medium bg-black/20 px-2 py-1 rounded-lg inline-block">
              Sensação: {data.current.feels}°
            </p>
          </div>
        </div>
        
        {/* Grid de Métricas (Fácil leitura) */}
        <div className="grid grid-cols-2 gap-3 w-full bg-black/20 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Wind size={12}/> Vento</span>
            <span className="text-sm font-bold text-white">{data.current.windSpd} km/h</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-red-400 uppercase font-bold flex items-center gap-1"><Wind size={12}/> Rajadas</span>
            <span className="text-sm font-bold text-white">{data.current.gusts} km/h</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Eye size={12}/> Visibilidade</span>
            <span className="text-sm font-bold text-white">{data.current.visibility} m</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Gauge size={12}/> Pressão</span>
            <span className="text-sm font-bold text-white">{data.current.pressure} hPa</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Droplets size={12}/> Umidade</span>
            <span className="text-sm font-bold text-white">{data.current.clouds}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Thermometer size={12}/> Pt. Orvalho</span>
            <span className="text-sm font-bold text-blue-300">{data.current.dewPoint}°</span>
          </div>
        </div>
      </div>

      {/* PREVISÃO 6 HORAS COM CHUVA EM MM */}
      <div className="mt-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Próximas 6 Horas</h3>
        <div className="grid grid-cols-6 gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
          {data.hourly.map((hour, idx) => {
            // Calcula a altura da barrinha de chuva (máx 15mm para o teto do gráfico)
            const rainHeight = Math.min((hour.precip / 15) * 100, 100);
            return (
              <div key={idx} className="flex flex-col items-center justify-between h-32">
                <span className="text-xs text-gray-300 font-medium">{hour.time}</span>
                <div className="transform scale-110 drop-shadow-md">{getWeatherIcon(hour.code, 1)}</div>
                <span className={`text-sm font-bold ${getTempColor(hour.code)}`}>{hour.temp}°</span>
                
                {/* Visualização de Chuva Didática */}
                <div className="flex flex-col items-center mt-auto w-full">
                  <div className="w-full bg-black/40 h-8 relative rounded-md flex items-end overflow-hidden border border-white/5">
                    <div style={{ height: `${rainHeight}%` }} className="w-full bg-blue-500/80 transition-all duration-1000"></div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-300 mt-1 flex items-center gap-0.5">
                    <Droplets size={8} /> {hour.precip > 0 ? `${hour.precip.toFixed(1)}` : '0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PREVISÃO 5 DIAS */}
      <div className="mt-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Próximos 5 Dias</h3>
        <div className="grid grid-cols-5 gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
          {data.forecast.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <span className={`text-[11px] font-bold ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>{day.dayName}</span>
              <div className="transform scale-110 drop-shadow-md">{getWeatherIcon(day.code, 1)}</div>
              <span className="text-xs font-bold text-gray-200">{day.min}°/{day.max}°</span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded-full mt-1">
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
// APP PRINCIPAL
// ==========================================
export default function App() {
  const [weatherData, setWeatherData] = useState({ bage: null, canoas: null });
  const [radar, setRadar] = useState({ host: "", path: "", time: "" });
  const [threatLevel, setThreatLevel] = useState({ level: 'GREEN', text: 'Analisando condições operacionais...' });

  useEffect(() => {
    const fetchWeather = async (lat, lon, city) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,visibility,relative_humidity_2m,pressure_msl&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=America%2FSao_Paulo`;
      const res = await fetch(url);
      const json = await res.json();

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
          temp: Math.round(temp),
          feels: Math.round(json.current.apparent_temperature),
          isDay: json.current.is_day,
          code: json.current.weather_code,
          visibility: json.current.visibility || 10000,
          pressure: Math.round(json.current.pressure_msl),
          windSpd: Math.round(json.current.wind_speed_10m),
          gusts: Math.round(json.current.wind_gusts_10m),
          clouds: rh, 
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

      // INTELIGÊNCIA OPERACIONAL (Fácil de entender)
      const maxGust = Math.max(bage.current.gusts, canoas.current.gusts);
      const worstCode = Math.max(bage.current.code, canoas.current.code);
      const minVis = Math.min(bage.current.visibility, canoas.current.visibility);
      const rainAccumulated = canoas.forecast[0].rain + bage.forecast[0].rain; 
      
      if (minVis <= 3000 || maxGust >= 60 || worstCode >= 95) {
        setThreatLevel({ level: 'RED', text: 'ALERTA: Condições severas. Risco operacional altíssimo para resgates ou operações externas.' });
      } else if (minVis <= 5000 || maxGust >= 40 || worstCode >= 51 || rainAccumulated > 40) {
        setThreatLevel({ level: 'YELLOW', text: 'ATENÇÃO: Condições meteorológicas marginais. Exige avaliação cautelosa da equipe.' });
      } else {
        setThreatLevel({ level: 'GREEN', text: 'OPERAÇÃO NORMAL: Condições favoráveis de voo (VMC) e solo limpo.' });
      }
    };

    loadAll();
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  const hacoCoords = [-29.92, -51.18];
  const bageCoords = [-31.33, -54.11];

  // Cores do Banner Premium
  const threatColors = {
    RED: "bg-red-500/20 border-red-500/50 text-red-200",
    YELLOW: "bg-yellow-500/20 border-yellow-500/50 text-yellow-200",
    GREEN: "bg-green-500/20 border-green-500/50 text-green-300"
  };

  const ThreatIcon = threatLevel.level === 'GREEN' ? CheckCircle2 : AlertTriangle;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 text-gray-200 font-sans flex flex-col gap-6"
         style={{ background: 'radial-gradient(circle at top right, #1e293b, #0f172a, #020617)' }}>
      
      <style>{`
        /* Reset do Leaflet e Fim do Quadrado Cinza */
        .leaflet-container { background-color: #0f172a !important; font-family: ui-sans-serif, system-ui, sans-serif !important; border-radius: 1.5rem; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        /* Máscara de Mapa Escuro Premium */
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%) grayscale(20%); }
        /* Estilo da Caixinha do Mapa */
        .leaflet-tooltip { background: rgba(15, 23, 42, 0.9) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5) !important; border-radius: 8px !important; backdrop-filter: blur(4px); }
        .leaflet-tooltip-right::before { border-right-color: rgba(15, 23, 42, 0.9) !important; }
        .leaflet-tooltip-left::before { border-left-color: rgba(15, 23, 42, 0.9) !important; }
      `}</style>

      {/* CABEÇALHO PREMIUM */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 max-w-[1400px] mx-auto w-full">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
            Dashboard HACO
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Saúde Operacional & Monitoramento Climático</p>
        </div>
        
        {/* BANNER DE STATUS DIDÁTICO */}
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${threatColors[threatLevel.level]} max-w-xl`}>
          <div className="bg-black/20 p-2 rounded-full">
            <ThreatIcon size={24} />
          </div>
          <span className="text-sm font-medium leading-tight">{threatLevel.text}</span>
        </div>
      </div>
      
      {/* GRID DOS CARDS DE ESTAÇÃO */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1400px] mx-auto w-full">
        <WeatherCard data={weatherData.bage} />
        <WeatherCard data={weatherData.canoas} />
      </div>

      {/* TELA DO RADAR (CLEAN E MODERNA) */}
      <div className="w-full max-w-[1400px] mx-auto relative rounded-3xl shadow-2xl border border-white/10 p-2 bg-white/5 backdrop-blur-sm mt-4">
        
        {/* Overlay Simples do Radar */}
        <div className="absolute top-6 left-6 z-[400] bg-slate-900/90 p-4 rounded-2xl border border-white/10 shadow-xl pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg animate-pulse">AO VIVO</span>
            <span className="text-white text-sm font-bold">Radar Meteorológico</span>
          </div>
          <div className="text-slate-300 text-xs mt-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Última varredura: {radar.time || "--:--"}
          </div>
        </div>

        {/* 
          MAPA CORRIGIDO: 
          boxZoom={false} desativa o atalho "Shift+Drag" que criava o quadrado cinza!
        */}
        <div className="h-[600px] w-full rounded-3xl overflow-hidden bg-slate-900">
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

            {/* Círculos de marcação sutis */}
            <Circle center={hacoCoords} radius={100000} color="#60a5fa" weight={1} fill={false} opacity={0.3} dashArray="5, 10" />
            
            <CircleMarker center={hacoCoords} radius={6} color="#000" weight={2} fillColor="#3b82f6" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="right" offset={[12, 0]} opacity={1} permanent>Canoas (HACO)</Tooltip>
            </CircleMarker>

            <CircleMarker center={bageCoords} radius={6} color="#000" weight={2} fillColor="#f59e0b" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="left" offset={[-12, 0]} opacity={1} permanent>Bagé</Tooltip>
            </CircleMarker>

          </MapContainer>
        </div>
      </div>
      
    </div>
  );
}
