import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, ShieldAlert, Activity, Crosshair, CloudCog } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// BASES OPERACIONAIS (RS)
// ==========================================
const BASES = [
  { id: 'CANOAS (HACO)', name: 'Base Aérea de Canoas', lat: -29.94, lon: -51.15 },
  { id: 'PORTO ALEGRE', name: 'Aeroporto Salgado Filho', lat: -29.99, lon: -51.17 },
  { id: 'SANTA MARIA', name: 'Base Aérea de Santa Maria', lat: -29.71, lon: -53.69 },
  { id: 'CAXIAS DO SUL', name: 'Aeroporto Hugo Cantergiani', lat: -29.20, lon: -51.19 },
  { id: 'PELOTAS', name: 'Aeroporto de Pelotas', lat: -31.72, lon: -52.33 },
  { id: 'BAGÉ', name: 'Aeroporto de Bagé', lat: -31.33, lon: -54.11 }
];

// ==========================================
// FUNÇÕES METEOROLÓGICAS TRADUZIDAS
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

// TRADUÇÃO DE JARGÃO DE AVIAÇÃO PARA TERMOS DIDÁTICOS
const getFlightCategory = (visibility, windGust) => {
  if (visibility < 3000 || windGust > 50) return { 
    rule: "VOO RESTRITO", color: "bg-rose-500 text-white border-rose-500", status: "TEMPO FECHADO (CRÍTICO)", dot: "bg-rose-500 shadow-[0_0_10px_#f43f5e]" 
  };
  if (visibility < 5000 || windGust > 35) return { 
    rule: "ATENÇÃO", color: "bg-amber-500 text-black border-amber-500", status: "VISIBILIDADE REDUZIDA", dot: "bg-amber-500 shadow-[0_0_10px_#f59e0b]" 
  };
  return { 
    rule: "LIBERADO", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50", status: "BOA VISIBILIDADE", dot: "bg-emerald-500" 
  };
};

const getWindDirection = (degree) => {
  const directions = ["Norte (N)", "Nordeste (NE)", "Leste (L)", "Sudeste (SE)", "Sul (S)", "Sudoeste (SO)", "Oeste (O)", "Noroeste (NO)"];
  return directions[Math.round(degree / 45) % 8];
};

// ==========================================
// COMPONENTE: ZOOM AUTOMÁTICO CORRIGIDO
// ==========================================
const MapAutoTracker = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    // Nível 10 de zoom para mergulhar bem perto da cidade selecionada
    map.flyTo(center, 10, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
};

export default function App() {
  const [stationsData, setStationsData] = useState([]);
  const [activeStationId, setActiveStationId] = useState('CANOAS (HACO)'); 
  
  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [radarHost, setRadarHost] = useState("");
  
  const [globalThreat, setGlobalThreat] = useState({ level: 'GREEN', text: 'INICIALIZANDO...' });

  useEffect(() => {
    const fetchWeatherForBase = async (base) => {
      // API ultra completa
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${base.lat}&longitude=${base.lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,relative_humidity_2m,pressure_msl,cloud_cover&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=America%2FSao_Paulo`;
      const res = await fetch(url);
      const json = await res.json();

      const formatTime = (isoString) => new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Cálculo Ponto de Orvalho
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
        id: base.id,
        name: base.name,
        lat: base.lat,
        lon: base.lon,
        current: {
          temp: Math.round(temp),
          feels: Math.round(json.current.apparent_temperature),
          isDay: json.current.is_day,
          code: json.current.weather_code,
          visibility: json.current.visibility || 10000,
          pressure: Math.round(json.current.pressure_msl),
          windSpd: Math.round(json.current.wind_speed_10m),
          windDir: json.current.wind_direction_10m,
          gusts: Math.round(json.current.wind_gusts_10m),
          humidity: rh,
          clouds: json.current.cloud_cover,
          dewPoint: dewPoint
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

    const loadAll = async () => {
      const promises = BASES.map(base => fetchWeatherForBase(base));
      const results = await Promise.all(promises);
      setStationsData(results);

      const maxGust = Math.max(...results.map(r => r.current.gusts));
      const minVis = Math.min(...results.map(r => r.current.visibility));

      if (minVis <= 3000 || maxGust >= 60) {
        setGlobalThreat({ level: 'RED', text: 'ALERTA: VOO SUSPENSO NA REGIÃO. VISIBILIDADE CRÍTICA OU VENTOS FORTES.' });
      } else if (minVis <= 5000 || maxGust >= 40) {
        setGlobalThreat({ level: 'YELLOW', text: 'ATENÇÃO: CONDIÇÕES MARGINAIS DETECTADAS PARA EVAM. AVALIAR RISCOS.' });
      } else {
        setGlobalThreat({ level: 'GREEN', text: 'CONDIÇÕES GERAIS FAVORÁVEIS. OPERAÇÕES TERRESTRES E AÉREAS LIBERADAS.' });
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

  if (stationsData.length === 0) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity size={40} className="text-cyan-400 animate-pulse" />
          <h1 className="text-cyan-400 font-mono tracking-widest animate-pulse">SISTEMA SDSOP CARREGANDO DADOS...</h1>
        </div>
      </div>
    );
  }

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
      
      {/* Scrollbar Customizada para a barra lateral do painel */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }

        .leaflet-container { background-color: #020617 !important; border-radius: 1rem; cursor: crosshair !important; }
        .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; }
        .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) grayscale(40%); }
        .leaflet-tooltip { background: rgba(15, 23, 42, 0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; border-radius: 4px !important; backdrop-filter: blur(8px); padding: 4px 8px; font-size: 11px; }
      `}</style>

      {/* CABEÇALHO GERAL DO SISTEMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full">
        <div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight leading-none flex items-center gap-2">
            <ShieldAlert size={20} className="text-cyan-400"/> GESTÃO METEOROLÓGICA RS
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg ${statusColors[globalThreat.level]} w-full md:w-auto justify-center`}>
          <AlertTriangle size={16} className={globalThreat.level === 'RED' ? 'animate-pulse' : ''} />
          <span className="text-xs font-bold uppercase tracking-wider">{globalThreat.text}</span>
        </div>
      </div>
      
      {/* BARRA DE SELEÇÃO DE CIDADES */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar w-full border-b border-slate-800">
        {stationsData.map((station) => {
          const flightData = getFlightCategory(station.current.visibility, station.current.gusts);
          const isSelected = activeStationId === station.id;
          
          return (
            <button 
              key={station.id}
              onClick={() => setActiveStationId(station.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-t-lg transition-all duration-300 border-x border-t ${
                isSelected ? 'bg-slate-800/80 border-slate-600 shadow-md' : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/50'
              }`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${flightData.dot}`}></div>
              <div className="flex flex-col items-start text-left">
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{station.id}</span>
                <span className={`text-[10px] font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}>{station.current.temp}°C</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ÁREA PRINCIPAL (PAINEL ESQUERDO + MAPA DIREITO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 h-[700px] overflow-hidden">
        
        {/* COLUNA ESQUERDA: DADOS DA CIDADE SELECIONADA (COM SCROLL) */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 h-full pb-10">
          
          <div className="bg-[#0b1120]/80 backdrop-blur-2xl rounded-2xl p-5 border border-cyan-900/50 shadow-[0_0_20px_rgba(8,145,178,0.1)] relative">
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[70px] rounded-full opacity-20 pointer-events-none ${activeFlightData.rule === 'VOO RESTRITO' ? 'bg-rose-500' : activeFlightData.rule === 'ATENÇÃO' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>

            {/* Cabeçalho do Alvo */}
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-1 text-[10px] text-cyan-500 font-bold tracking-widest mb-1">
                  <Crosshair size={12} /> ALVO LOCALIZADO
                </div>
                <h2 className="text-2xl font-black text-white">{activeData.name}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-400">
                  <span className="flex items-center gap-1"><Sunrise size={14} className="text-amber-400"/> Nascer: {activeData.daily.sunrise}</span>
                  <span className="flex items-center gap-1"><Sunset size={14} className="text-orange-500"/> Pôr: {activeData.daily.sunset}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${activeFlightData.color} tracking-widest shadow-lg`}>
                  {activeFlightData.rule}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{activeFlightData.status}</span>
              </div>
            </div>

            {/* Temperatura Principal */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800/50 mb-4">
              <div className="transform scale-[2] drop-shadow-md ml-2">
                {getWeatherIcon(activeData.current.code, activeData.current.isDay)}
              </div>
              <div className="ml-4">
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none">{activeData.current.temp}°</h1>
                <span className="text-xs text-slate-400 font-medium ml-1">Sensação Térmica: {activeData.current.feels}°C</span>
              </div>
            </div>

            {/* GRID 1: Aviação / Condições Críticas */}
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">Condições de Voo & Visibilidade</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><Compass size={12} className="inline mr-1"/>Vento Constante</div>
                <div className="text-sm font-bold text-white">{activeData.current.windSpd} km/h</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-rose-400 font-bold uppercase"><Wind size={12} className="inline mr-1"/>Rajadas (GUST)</div>
                <div className="text-sm font-bold text-rose-400">{activeData.current.gusts} km/h</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><Eye size={12} className="inline mr-1"/>Visibilidade</div>
                <div className="text-sm font-bold text-white">{activeData.current.visibility} metros</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><Gauge size={12} className="inline mr-1"/>Pressão Atm.</div>
                <div className="text-sm font-bold text-white">{activeData.current.pressure} hPa</div>
              </div>
            </div>

            {/* GRID 2: Defesa Civil / Saúde (MAIS DADOS ADICIONADOS) */}
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase">Dados de Saúde e Solo</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><Droplets size={12} className="inline mr-1"/>Umidade Relativa</div>
                <div className="text-sm font-bold text-blue-300">{activeData.current.humidity}%</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><Thermometer size={12} className="inline mr-1"/>Pto. de Orvalho</div>
                <div className="text-sm font-bold text-blue-300">{activeData.current.dewPoint}°C</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><CloudCog size={12} className="inline mr-1"/>Nuvens (Teto)</div>
                <div className="text-sm font-bold text-white">{activeData.current.clouds}% coberto</div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                <div className="text-[10px] text-slate-400 font-bold uppercase"><Sun className="inline w-3 h-3 mr-1 text-yellow-400"/>Índice UV Máx</div>
                <div className="text-sm font-bold text-yellow-400">{activeData.daily.uv}</div>
              </div>
            </div>

            {/* PREVISÃO DE 6 HORAS (CHUVA) */}
            <div className="mt-4 p-4 border border-slate-700/50 bg-slate-900/40 rounded-xl">
              <div className="text-[10px] text-cyan-400 font-bold tracking-widest mb-3">RISCO DE CHUVA - PRÓXIMAS 6 HORAS</div>
              <div className="flex justify-between items-end gap-2">
                {activeData.hourly.map((h, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-[10px] font-bold text-slate-400 mb-2">{h.time}</span>
                    <div className="transform scale-75 mb-2">{getWeatherIcon(h.code, 1)}</div>
                    <div className="w-full bg-slate-800 rounded-sm overflow-hidden h-14 relative flex items-end">
                      <div style={{ height: `${Math.min((h.precip/10)*100, 100)}%` }} className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm"></div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300 mt-2">{h.precip} mm</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PREVISÃO DE 5 DIAS (DEFESA CIVIL) */}
            <div className="mt-4 p-4 border border-slate-700/50 bg-slate-900/40 rounded-xl">
              <div className="text-[10px] text-amber-400 font-bold tracking-widest mb-3 flex items-center gap-2"><ShieldAlert size={14}/> DEFESA CIVIL - PRÓXIMOS 5 DIAS</div>
              <div className="grid grid-cols-5 gap-2">
                {activeData.forecast.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                    <span className={`text-[10px] font-black tracking-wider ${idx === 0 ? 'text-amber-400' : 'text-slate-300'}`}>{day.dayName}</span>
                    <div className="transform scale-75">{getWeatherIcon(day.code, 1)}</div>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">{day.min}° a {day.max}°</span>
                    <span className={`text-[10px] font-bold w-full text-center py-0.5 rounded ${day.rain > 15 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                      {day.rain > 0 ? `${day.rain.toFixed(1)} mm` : 'Sem chuva'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* COLUNA DIREITA: MAPA COM CONTROLE DE ZOOM MANUAL */}
        <div className="lg:col-span-7 relative rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-700 p-1.5 bg-slate-900/30 backdrop-blur-sm h-full">
          
          <div className="absolute top-4 left-4 z-[400] bg-[#020617]/90 p-3 rounded-xl border border-slate-700/50 shadow-2xl pointer-events-none backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">RADAR</span>
              <span className="text-slate-200 text-xs font-bold tracking-widest uppercase">Meteorológico Regional</span>
            </div>
            <div className="text-xl font-black tracking-widest border-t border-slate-800 pt-1 leading-none text-cyan-400">
              {activeFrameData ? new Date(activeFrameData.time * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </div>
            <div className={`text-[9px] font-bold mt-1.5 ${activeFrameData?.type === 'NOWCAST' ? 'text-amber-500' : 'text-cyan-500'}`}>
              {activeFrameData?.type === 'NOWCAST' ? "PROJEÇÃO (NOWCAST 30MIN)" : "TEMPO REAL (PASSADO)"}
            </div>
          </div>

          <div className="h-full w-full rounded-xl overflow-hidden bg-[#020617]">
            <MapContainer 
              center={[activeData.lat, activeData.lon]} 
              zoom={10} 
              maxZoom={12} 
              minZoom={5}
              zoomControl={true} // BOTÕES DE ZOOM ATIVADOS (+) e (-)
              scrollWheelZoom={true} // Permite dar zoom pelo mouse/touchpad
              style={{ height: '100%', width: '100%' }}
            >
              <MapResizer />
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

              {stationsData.map((base) => {
                const isTarget = base.id === activeStationId;
                return (
                  <React.Fragment key={base.id}>
                    {/* Desenha um anel em volta de todas as cidades, mas destaca a cidade clicada */}
                    <Circle center={[base.lat, base.lon]} radius={isTarget ? 20000 : 10000} color={isTarget ? '#22d3ee' : '#64748b'} weight={isTarget ? 2 : 1} fill={false} opacity={0.5} dashArray={isTarget ? "none" : "3, 6"} />
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
