import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Thermometer, Compass, Sunrise, Sunset, ShieldAlert, Activity, Crosshair, CloudCog, Siren, Map as MapIcon, Waves, ActivitySquare, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// 1. CONFIGURAÇÕES GLOBAIS - BASES E RIOS
// ==========================================
const BASES = [
  { id: 'RS-GENERAL', name: 'SITUAÇÃO GERAL DO ESTADO', lat: -30.0, lon: -53.2 },
  { id: 'HYDRO', name: 'BACIAS HIDROGRÁFICAS', lat: -29.8, lon: -51.5 },
  { id: 'SBCO', name: 'CANOAS (HACO)', lat: -29.94, lon: -51.15 },
  { id: 'SBPA', name: 'PORTO ALEGRE', lat: -29.99, lon: -51.17 },
  { id: 'SBSM', name: 'SANTA MARIA', lat: -29.71, lon: -53.69 },
  { id: 'SBCX', name: 'CAXIAS DO SUL', lat: -29.20, lon: -51.19 },
  { id: 'SBPK', name: 'PELOTAS', lat: -31.72, lon: -52.33 },
  { id: 'SBBG', name: 'BAGÉ', lat: -31.33, lon: -54.11 }
];

// Ouro Tático: Links Diretos de Feed RSS (Leitura ultrarrápida, zero CPU)
const INITIAL_RIVERS = [
  { id: 'taquari', name: 'Rio Taquari (Estrela)', cod: '86695000', feedUrl: null, level: null, alert: 15.00, flood: 19.00, lat: -29.50, lon: -51.96 }, // SACE Direto
  { id: 'guaiba', name: 'Guaíba (Cais Mauá)', cod: '87450004', feedUrl: 'https://nivelguaiba.com.br/feed/', level: null, alert: 2.50, flood: 3.00, lat: -30.03, lon: -51.23 },
  { id: 'cai', name: 'Rio Caí (S. S. do Caí)', cod: '87382000', feedUrl: 'https://nivelguaiba.com.br/sao-sebastiao-do-cai/feed/', level: null, alert: 7.00, flood: 10.00, lat: -29.58, lon: -51.37 },
  { id: 'sinos', name: 'Rio dos Sinos (S. Leopoldo)', cod: '87398000', feedUrl: 'https://nivelguaiba.com.br/sao-leopoldo/feed/', level: null, alert: 4.30, flood: 4.50, lat: -29.76, lon: -51.14 },
  { id: 'uruguai', name: 'Rio Uruguai (Uruguaiana)', cod: '77150000', feedUrl: 'https://niveluruguai.com.br/feed/', level: null, alert: 7.50, flood: 8.50, lat: -29.76, lon: -57.08 }
];

// ==========================================
// 2. FUNÇÕES METEOROLÓGICAS 
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun className="text-yellow-400 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" /> : <Moon className="text-blue-300 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className="text-yellow-200 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" /> : <Cloud className="text-slate-300 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  if (code === 3) return <Cloud className="text-slate-400 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className="text-blue-300 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  if (code >= 61 && code <= 65) return <CloudRain className="text-blue-400 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  if (code >= 80 && code <= 82) return <CloudRain className="text-indigo-400 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  if (code >= 95) return <CloudLightning className="text-rose-500 drop-shadow-md w-8 h-8 lg:w-12 lg:h-12" />;
  return <Cloud className="text-slate-500 w-8 h-8 lg:w-12 lg:h-12" />;
};

const getFlightCategory = (visibility, windGust) => {
  if (visibility < 3000 || windGust > 50) return { rule: "VOO RESTRITO", color: "bg-rose-500 text-white border-rose-500", status: "CRÍTICO (TEMPO FECHADO)", dot: "bg-rose-500 shadow-[0_0_8px_#f43f5e]" };
  if (visibility < 5000 || windGust > 35) return { rule: "ATENÇÃO", color: "bg-amber-500 text-black border-amber-500", status: "MARGINAL (VISIB. REDUZIDA)", dot: "bg-amber-500 shadow-[0_0_8px_#f59e0b]" };
  return { rule: "LIBERADO", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50", status: "VISUAL (CÉU LIMPO)", dot: "bg-emerald-500" };
};

const getWindDirection = (degree) => {
  const directions = ["Norte", "Nordeste", "Leste", "Sudeste", "Sul", "Sudoeste", "Oeste", "Noroeste"];
  return directions[Math.round(degree / 45) % 8];
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => { const t = setTimeout(() => { map.invalidateSize(); }, 400); return () => clearTimeout(t); }, [map]);
  return null;
};

const MapAutoTracker = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { 
    map.invalidateSize();
    map.flyTo(center, zoom, { animate: true, duration: 1.5 }); 
  }, [center[0], center[1], zoom, map]);
  return null;
};

// ==========================================
// 3. COMPONENTE REDESENHADO: HIDROLOGIA (LEVE & TÁTICO)
// ==========================================
const HydrologyTerminal = ({ rivers, isSyncing }) => {
  if (isSyncing) {
    return (
      <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-2xl h-full flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin mb-4" />
        <span className="text-cyan-400 font-bold tracking-widest text-xs">SINCRONIZANDO FEEDS DE TELEMETRIA...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-slate-700 shadow-2xl h-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold tracking-widest mb-1">
            <ActivitySquare size={10} /> TELEMETRIA NATIVA (FEEDS RSS/JSON)
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-white">REDE HIDROLÓGICA</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 overflow-y-auto custom-scrollbar pr-1 pb-2">
        {rivers.map(river => {
          const isOffline = typeof river.level !== 'number';
          const isFlood = !isOffline && river.level >= river.flood;
          const isAlert = !isOffline && river.level >= river.alert && !isFlood;
          
          let cardStyle = "bg-slate-900/60 border-slate-700/50";
          let numColor = "text-cyan-400";
          
          if (isFlood) {
            cardStyle = "bg-rose-950/20 border-rose-500/30";
            numColor = "text-rose-400";
          } else if (isAlert) {
            cardStyle = "bg-amber-950/20 border-amber-500/30";
            numColor = "text-amber-400";
          } else if (isOffline) {
            cardStyle = "bg-slate-900/30 border-slate-800";
            numColor = "text-slate-600";
          }

          const pct = Math.min(((!isOffline ? river.level : 0) / (river.flood * 1.2)) * 100, 100);

          return (
            <div key={river.id} className={`p-3 lg:p-4 rounded-xl border ${cardStyle} flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold ${isOffline ? 'text-slate-500' : 'text-slate-200'}`}>{river.name}</span>
                {!isOffline && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest ${river.isFeed ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {river.isFeed ? 'FEED DA COMUNIDADE (SEMA)' : 'DADO OFICIAL (CPRM/ANA)'}
                  </span>
                )}
              </div>
              
              <div className="flex items-end gap-1 mb-2">
                <span className={`text-3xl lg:text-4xl font-black leading-none tracking-tighter ${numColor}`}>
                  {isOffline ? '--' : river.level.toFixed(2)}
                </span>
                <span className={`text-xs font-bold mb-1 ${isOffline ? 'text-slate-600' : 'text-slate-500'}`}>m</span>
              </div>

              <div className="w-full h-1 bg-slate-800/80 rounded-full mt-2 relative overflow-hidden">
                 {!isOffline && <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isFlood ? 'bg-rose-500' : isAlert ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }}></div>}
              </div>
              
              <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-2">
                <span>Alerta: {river.alert}m</span>
                <span>Inundação: {river.flood}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// 4. COMPONENTE: VISÃO GERAL ESTADUAL
// ==========================================
const GeneralOverview = ({ stations, rivers }) => {
  const enchenteRisks = stations.filter(s => s.forecast && s.forecast[0] && s.forecast[0].rain > 30);
  const vendavalRisks = stations.filter(s => s.current && s.current.gusts > 45);
  const nevoeiroRisks = stations.filter(s => s.current && s.current.visibility < 3000);
  const riosEmRisco = rivers.filter(r => typeof r.level === 'number' && r.level >= r.alert);

  const hasAlerts = enchenteRisks.length > 0 || vendavalRisks.length > 0 || nevoeiroRisks.length > 0 || riosEmRisco.length > 0;

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-slate-700 shadow-2xl h-full overflow-y-auto custom-scrollbar">
      <h2 className="text-xl lg:text-2xl font-black text-white flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <Siren className={hasAlerts ? "text-rose-500 animate-pulse" : "text-emerald-500"} />
        SITUAÇÃO TÁTICA DO RS
      </h2>

      {!hasAlerts ? (
        <div className="flex flex-col items-center justify-center py-10 text-emerald-400 bg-emerald-900/10 border border-emerald-900/30 rounded-xl">
          <CheckCircle2 size={48} className="mb-3"/>
          <p className="font-bold text-center">CONDIÇÕES NORMAIS NO ESTADO</p>
          <p className="text-xs text-emerald-500 mt-1">Nenhum alerta crítico para a aviação ou solo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {riosEmRisco.length > 0 && (
            <div className="bg-rose-900/20 border border-rose-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <h3 className="text-rose-500 font-black flex items-center gap-2 mb-3 text-sm tracking-widest"><Waves size={16}/> RISCO DE ENCHENTE / INUNDAÇÃO</h3>
              <div className="grid gap-2">
                {riosEmRisco.map(r => (
                  <div key={r.id} className="flex justify-between items-center text-xs bg-slate-900/80 p-2.5 rounded border border-rose-500/30">
                    <span className="text-slate-200 font-bold">{r.name}</span>
                    <span className={`font-black px-2 py-0.5 rounded ${r.level >= r.flood ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>
                      {r.level.toFixed(2)}m ({r.level >= r.flood ? 'INUNDAÇÃO' : 'ALERTA'})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enchenteRisks.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
              <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2 text-sm"><Droplets size={16}/> RISCO CHUVA FORTE (ACUMULADO)</h3>
              <div className="grid gap-2">
                {enchenteRisks.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-300 font-bold">{s.name}</span>
                    <span className="text-blue-400 font-black">{s.forecast[0].rain} mm/dia</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vendavalRisks.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl">
              <h3 className="text-amber-500 font-bold flex items-center gap-2 mb-2 text-sm"><Wind size={16}/> ALERTA DE VENDAVAL</h3>
              <div className="grid gap-2">
                {vendavalRisks.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-300 font-bold">{s.name}</span>
                    <span className="text-amber-400 font-black">{s.current.gusts} km/h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nevoeiroRisks.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-600 p-4 rounded-xl">
              <h3 className="text-slate-300 font-bold flex items-center gap-2 mb-2 text-sm"><Eye size={16}/> TETO BAIXO / NEVOEIRO</h3>
              <div className="grid gap-2">
                {nevoeiroRisks.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs bg-slate-900/50 p-2 rounded">
                    <span className="text-slate-300 font-bold">{s.name}</span>
                    <span className="text-white font-black">Visib. {s.current.visibility}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 5. COMPONENTE: TERMINAL DO AEROPORTO
// ==========================================
const StationTerminal = ({ data }) => {
  if (!data || !data.current) return <div className="bg-[#0b1120]/90 rounded-2xl flex items-center justify-center h-full"><Loader2 className="animate-spin text-cyan-500" /></div>;
  const flightData = getFlightCategory(data.current.visibility, data.current.gusts);

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-slate-700 shadow-2xl h-full overflow-y-auto custom-scrollbar relative">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full opacity-20 pointer-events-none ${flightData.rule === 'VOO RESTRITO' ? 'bg-rose-500' : flightData.rule === 'ATENÇÃO' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-2 border-b border-slate-700/50 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-1 text-[9px] text-cyan-500 font-bold tracking-widest mb-1"><Crosshair size={10} /> TELEMETRIA AERONÁUTICA</div>
          <h2 className="text-xl lg:text-2xl font-black text-white">{data.name}</h2>
        </div>
        <div className="flex flex-col items-start xl:items-end gap-1">
          <span className={`px-2 py-1 rounded text-[10px] font-bold border ${flightData.color} tracking-widest shadow-lg`}>{flightData.rule}</span>
          <span className="text-[10px] text-slate-400 font-bold">{flightData.status}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-slate-800/50 mb-4">
        <div className="flex items-center gap-3 lg:gap-4">
          {getWeatherIcon(data.current.code, data.current.isDay)}
          <div>
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">{data.current.temp}°</h1>
            <span className="text-[10px] lg:text-xs text-slate-400 font-medium">Sensação: {data.current.feels}°C</span>
          </div>
        </div>
      </div>

      <h3 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Aviação & Atmosfera</h3>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-900/80 p-2 lg:p-3 rounded-lg border border-slate-700/50">
          <div className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase"><Compass size={12} className="inline mr-1"/>Vento</div>
          <div className="text-xs lg:text-sm font-bold text-white mt-1">{data.current.windSpd} km/h</div>
        </div>
        <div className="bg-slate-900/80 p-2 lg:p-3 rounded-lg border border-slate-700/50">
          <div className="text-[9px] lg:text-[10px] text-rose-400 font-bold uppercase"><Wind size={12} className="inline mr-1"/>Rajadas</div>
          <div className="text-xs lg:text-sm font-bold text-rose-400 mt-1">{data.current.gusts} km/h</div>
        </div>
        <div className="bg-slate-900/80 p-2 lg:p-3 rounded-lg border border-slate-700/50">
          <div className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase"><Eye size={12} className="inline mr-1"/>Visibilidade</div>
          <div className="text-xs lg:text-sm font-bold text-white mt-1">{data.current.visibility} m</div>
        </div>
        <div className="bg-slate-900/80 p-2 lg:p-3 rounded-lg border border-slate-700/50">
          <div className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase"><Gauge size={12} className="inline mr-1"/>Pressão</div>
          <div className="text-xs lg:text-sm font-bold text-white mt-1">{data.current.pressure} hPa</div>
        </div>
      </div>

      <div className="mt-4 p-3 lg:p-4 border border-slate-700/50 bg-slate-900/40 rounded-xl">
        <div className="text-[10px] text-cyan-400 font-bold tracking-widest mb-3">PRECIPITAÇÃO (PRÓXIMAS 6 HORAS)</div>
        <div className="flex justify-between items-end gap-1">
          {data.hourly.map((h, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <span className="text-[9px] font-bold text-slate-400 mb-1">{h.time}</span>
              <div className="transform scale-50 -my-2">{getWeatherIcon(h.code, 1)}</div>
              <div className="w-full bg-slate-800 rounded-sm overflow-hidden h-10 lg:h-12 relative flex items-end mt-1">
                <div style={{ height: `${Math.min((h.precip/10)*100, 100)}%` }} className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm"></div>
              </div>
              <span className="text-[9px] font-bold text-cyan-300 mt-1">{h.precip} <span className="text-[7px]">mm</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. MOTOR PRINCIPAL (APP C2)
// ==========================================
export default function App() {
  const [stationsData, setStationsData] = useState([]);
  const [riverData, setRiverData] = useState(INITIAL_RIVERS);
  const [activeId, setActiveId] = useState('RS-GENERAL');
  
  const [radarFrames, setRadarFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [radarHost, setRadarHost] = useState("");
  
  const [globalThreat, setGlobalThreat] = useState({ level: 'GREEN', text: 'INICIALIZANDO SISTEMAS...' });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isHydroSyncing, setIsHydroSyncing] = useState(true); // Trava visual para a aba hidrologia

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const results = await Promise.all(BASES.slice(2).map(async (base) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${base.lat}&longitude=${base.lon}&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,relative_humidity_2m,pressure_msl,cloud_cover&hourly=temperature_2m,weather_code,precipitation,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset&timezone=America%2FSao_Paulo`;
          const res = await fetch(url);
          const json = await res.json();

          let hourlyForecast = [];
          const currentHourIdx = new Date().getHours();
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
            id: base.id, name: base.name, lat: base.lat, lon: base.lon,
            current: {
              temp: Math.round(json.current.temperature_2m || 0), feels: Math.round(json.current.apparent_temperature), isDay: json.current.is_day,
              code: json.current.weather_code, visibility: json.current.visibility || 10000, pressure: Math.round(json.current.pressure_msl),
              windSpd: Math.round(json.current.wind_speed_10m), windDir: json.current.wind_direction_10m,
              gusts: Math.round(json.current.wind_gusts_10m || json.current.wind_speed_10m)
            },
            hourly: hourlyForecast, forecast: daysForecast
          };
        }));
        
        setStationsData(results);
        setIsInitializing(false); // Libera o mapa e os dados de aviação IMEDIATAMENTE

        const maxGust = Math.max(...results.map(r => r.current.gusts));
        const minVis = Math.min(...results.map(r => r.current.visibility));

        if (minVis <= 3000 || maxGust >= 60) setGlobalThreat({ level: 'RED', text: 'ALERTA VERMELHO: VOO RESTRITO NO ESTADO.' });
        else if (minVis <= 5000 || maxGust >= 40) setGlobalThreat({ level: 'YELLOW', text: 'ATENÇÃO: CONDIÇÕES MARGINAIS.' });
        else setGlobalThreat({ level: 'GREEN', text: 'CONDIÇÕES GERAIS FAVORÁVEIS. OPERAÇÕES LIBERADAS.' });
      } catch (error) { setIsInitializing(false); }
    };

    const fetchRadar = async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        setRadarHost(data.host);
        setRadarFrames([...data.radar.past.slice(-5).map(f => ({ ...f, type: 'PAST' })), ...data.radar.nowcast.slice(0, 3).map(f => ({ ...f, type: 'NOWCAST' }))]);
      } catch (error) {}
    };

    // A MÁGICA DEFINITIVA DA HIDROLOGIA: Feeds ultrarrápidos e arsenal de Proxies
    const fetchRivers = async () => {
      setIsHydroSyncing(true); // Liga o loader da aba

      // Arsenal de Invasão de Rede
      const proxies = [
        (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}` // Proxy extra de backup
      ];

      const updatedRivers = await Promise.all(INITIAL_RIVERS.map(async (rio) => {
        let nivelAtual = null;
        let isFeed = false;

        // TÁTICA 1: FEED RSS/XML NATIVO (Zero peso na CPU, carrega em 50ms se online)
        if (rio.feedUrl) {
          for (const proxy of proxies) {
            try {
              const urlBuster = `${rio.feedUrl}${rio.feedUrl.includes('?') ? '&' : '?'}cb=${Date.now()}`;
              const feedReq = await fetch(proxy(urlBuster), { cache: 'no-store' });
              
              if (feedReq.ok) {
                const text = await feedReq.text();
                // Acha a tag <title> do Feed que sempre contêm o valor exato, sem renderizar tela
                const titleRegex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gi;
                const matches = [...text.matchAll(titleRegex)];
                
                for (const m of matches) {
                  const titleStr = m[1];
                  if (titleStr) {
                    const numMatch = titleStr.match(/([0-9]{1,2})[.,]([0-9]{1,2})/);
                    if (numMatch) {
                      const num = parseFloat(`${numMatch[1]}.${numMatch[2]}`);
                      // Filtro anti-ruído (evita datas e cotas fixas)
                      if (num > 0.01 && num < 35 && num !== rio.alert && num !== rio.flood) {
                        nivelAtual = num.toFixed(2);
                        isFeed = true;
                        break; 
                      }
                    }
                  }
                }
              }
            } catch(e) {}
            if (nivelAtual !== null) break; // Se um proxy der certo, para de tentar os outros
          }
        }

        // TÁTICA 2: SACE/CPRM JSON (Se não tiver Feed ou o Feed der pau)
        if (nivelAtual === null) {
          const saceUrl = `https://sace.cprm.gov.br/api/dadosestacao/${rio.cod}`;
          for (const proxy of proxies) {
            try {
              const resSace = await fetch(proxy(saceUrl), { cache: 'no-store' });
              if (resSace.ok) {
                const dataSace = await resSace.json();
                if (Array.isArray(dataSace) && dataSace.length > 0) {
                  for (let i = dataSace.length - 1; i >= 0; i--) {
                    if (dataSace[i].nivel) {
                      nivelAtual = (dataSace[i].nivel / 100).toFixed(2);
                      isFeed = false;
                      break;
                    }
                  }
                }
              }
            } catch(e) {}
            if (nivelAtual !== null) break;
          }
        }

        // TÁTICA 3: ANA GOVERNO (O Último Reduto de Defesa)
        if (nivelAtual === null) {
          const anaUrl = `http://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosTempoReal?codEstacao=${rio.cod}`;
          for (const proxy of proxies) {
            try {
              const resAna = await fetch(proxy(anaUrl), { cache: 'no-store' });
              if (resAna.ok) {
                const xmlText = await resAna.text();
                if (xmlText.includes('<Nivel>')) {
                  const parser = new DOMParser();
                  const xml = parser.parseFromString(xmlText, "text/xml");
                  const niveis = xml.getElementsByTagName("Nivel");
                  for (let i = 0; i < niveis.length; i++) {
                    const val = niveis[i].textContent;
                    if (val && !isNaN(val) && val.trim() !== "") {
                      nivelAtual = (parseFloat(val) / 100).toFixed(2);
                      isFeed = false;
                      break;
                    }
                  }
                }
              }
            } catch(e) {}
            if (nivelAtual !== null) break;
          }
        }

        // FIM DA TRILHA DE SOBREVIVÊNCIA
        return { ...rio, level: nivelAtual ? parseFloat(nivelAtual) : null, isFeed };
      }));
      
      setRiverData(updatedRivers);
      setIsHydroSyncing(false); // DESTRAVA A TELA! Mostra os dados (ou as linhas vazias se deu ruim total)
    };

    fetchWeather(); fetchRadar(); fetchRivers();
    const interval = setInterval(() => { fetchWeather(); fetchRadar(); fetchRivers(); }, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (radarFrames.length === 0) return;
    const loop = setInterval(() => { setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length); }, 1500);
    return () => clearInterval(loop);
  }, [radarFrames]);

  // Loading global inicial
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity size={40} className="text-cyan-400 animate-pulse" />
          <h1 className="text-cyan-400 font-bold tracking-widest animate-pulse">CARREGANDO SISTEMA DE COMANDO RS...</h1>
        </div>
      </div>
    );
  }

  const activeBase = BASES.find(b => b.id === activeId);
  const activeFrameData = radarFrames[activeFrameIndex];
  const statusColors = { RED: "bg-rose-500/10 border-rose-500/40 text-rose-400", YELLOW: "bg-amber-500/10 border-amber-500/40 text-amber-400", GREEN: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" };

  return (
    <div className="min-h-screen bg-[#020617] p-2 md:p-4 text-slate-200 font-sans flex flex-col gap-3 overflow-hidden h-screen" style={{ background: 'radial-gradient(circle at top right, #0f172a, #020617)' }}>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; } .leaflet-container { background-color: #020617 !important; border-radius: 1rem; cursor: crosshair !important; z-index: 10; } .leaflet-container img { max-width: none !important; max-height: none !important; margin: 0 !important; padding: 0 !important; } .dark-base-map { filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(110%) grayscale(40%); } .leaflet-tooltip { background: rgba(15, 23, 42, 0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: white !important; font-weight: bold; border-radius: 4px !important; backdrop-filter: blur(8px); padding: 4px 8px; font-size: 11px; }`}</style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 w-full shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight leading-none flex items-center gap-2">
            <ShieldAlert size={20} className="text-cyan-400"/> COMANDO TÁTICO HACO
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border shadow-lg ${statusColors[globalThreat.level]} w-full md:w-auto justify-center`}>
          <AlertTriangle size={16} className={globalThreat.level === 'RED' ? 'animate-pulse' : ''} />
          <span className="text-xs font-bold uppercase tracking-wider">{globalThreat.text}</span>
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar w-full shrink-0 border-b border-slate-800">
        {BASES.map((base) => {
          const stationData = stationsData.find(s => s.id === base.id);
          const flightData = stationData ? getFlightCategory(stationData.current.visibility, stationData.current.gusts) : null;
          const isSelected = activeId === base.id;
          
          return (
            <button key={base.id} onClick={() => setActiveId(base.id)} className={`flex-shrink-0 flex items-center gap-3 px-3 lg:px-4 py-2 rounded-t-lg transition-all duration-300 border-x border-t ${isSelected ? 'bg-slate-800/80 border-slate-600 shadow-md' : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/50'}`}>
              {base.id === 'HYDRO' ? <Waves size={12} className={isSelected ? "text-blue-400" : "text-slate-500"}/> : flightData ? <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${flightData.dot}`}></div> : <MapIcon size={12} className={isSelected ? "text-cyan-400" : "text-slate-500"}/>}
              <div className="flex flex-col items-start text-left">
                <span className={`text-[10px] lg:text-xs font-bold whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-400'}`}>{base.name}</span>
                {stationData && <span className={`text-[9px] font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}>{stationData.current.temp}°C</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden min-h-0">
        <div className="w-full lg:w-[400px] xl:w-[500px] shrink-0 h-[50%] lg:h-full overflow-hidden">
           {activeId === 'RS-GENERAL' ? <GeneralOverview stations={stationsData} rivers={riverData} /> : activeId === 'HYDRO' ? <HydrologyTerminal rivers={riverData} isSyncing={isHydroSyncing} /> : <StationTerminal data={stationsData.find(s => s.id === activeId)} />}
        </div>

        <div className="flex-1 relative rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-700 p-1.5 bg-slate-900/30 backdrop-blur-sm h-[50%] lg:h-full">
          <div className="absolute top-4 left-4 z-[400] bg-[#020617]/90 p-3 rounded-xl border border-slate-700/50 shadow-2xl pointer-events-none backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">RADAR</span>
              <span className="text-slate-200 text-xs font-bold tracking-widest uppercase hidden sm:block">Meteorológico Real</span>
            </div>
            <div className={`text-lg lg:text-xl font-black tracking-widest border-t border-slate-800 pt-1 leading-none ${activeFrameData?.type === 'NOWCAST' ? 'text-amber-400' : 'text-cyan-400'}`}>
              {activeFrameData ? new Date(activeFrameData.time * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
            </div>
            <div className={`text-[8px] lg:text-[9px] font-bold mt-1.5 ${activeFrameData?.type === 'NOWCAST' ? 'text-amber-500/70' : 'text-cyan-500/70'}`}>
              {activeFrameData?.type === 'NOWCAST' ? "PROJEÇÃO (FUTURO 30 MIN)" : "LEITURA DE SATÉLITE (PASSADO)"}
            </div>
          </div>

          <div className="h-full w-full rounded-xl overflow-hidden bg-[#020617]">
            <MapContainer center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' || activeId === 'HYDRO' ? 7 : 10} maxZoom={12} minZoom={5} zoomControl={true} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <MapResizer />
              <MapAutoTracker center={[activeBase.lat, activeBase.lon]} zoom={activeId === 'RS-GENERAL' || activeId === 'HYDRO' ? 7 : 10} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-base-map" maxZoom={19} />
              {radarHost && radarFrames.map((frame, idx) => (
                <TileLayer key={`${frame.path}-${idx}`} url={`${radarHost}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`} opacity={idx === activeFrameIndex ? 0.85 : 0} maxNativeZoom={6} maxZoom={12} zIndex={10 + idx} />
              ))}
              {activeId === 'HYDRO' ? (
                 riverData.map(r => r.level && (
                   <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={6} color="#3b82f6" fillColor="#60a5fa" fillOpacity={1} zIndexOffset={200}>
                     <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>{r.name}</Tooltip>
                   </CircleMarker>
                 ))
              ) : (
                stationsData.map((base) => {
                  const isTarget = base.id === activeId;
                  return (
                    <React.Fragment key={base.id}>
                      <Circle center={[base.lat, base.lon]} radius={isTarget ? 20000 : 10000} color={isTarget ? '#22d3ee' : '#64748b'} weight={isTarget ? 2 : 1} fill={false} opacity={0.5} dashArray={isTarget ? "none" : "3, 6"} />
                      <CircleMarker center={[base.lat, base.lon]} radius={isTarget ? 6 : 4} color="#000" weight={2} fillColor={isTarget ? '#22d3ee' : '#94a3b8'} fillOpacity={1} zIndexOffset={isTarget ? 200 : 100}>
                        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={isTarget}>{base.id}</Tooltip>
                      </CircleMarker>
                    </React.Fragment>
                  );
                })
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
