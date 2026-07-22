import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, CheckCircle2, Compass, ShieldAlert, Activity, Crosshair, Siren, Map as MapIcon, Waves, ActivitySquare, Loader2 } from 'lucide-react';

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

const INITIAL_RIVERS = [
  { id: 'taquari', name: 'Rio Taquari (Lajeado)', cod: '86695000', feedItemUrl: 'https://nivelguaiba.com.br/lajeado', level: null, alert: 15.00, flood: 19.00 },
  { id: 'guaiba', name: 'Guaíba (Cais Mauá)', cod: '87450004', feedItemUrl: 'https://nivelguaiba.com.br/', level: null, alert: 2.50, flood: 3.00 },
  { id: 'cai', name: 'Rio Caí (S. S. do Caí)', cod: '87382000', feedItemUrl: 'https://nivelguaiba.com.br/saosebastiaodocai', level: null, alert: 7.00, flood: 10.00 },
  { id: 'sinos', name: 'Rio dos Sinos (S. Leopoldo)', cod: '87398000', feedItemUrl: 'https://nivelguaiba.com.br/saoleopoldo', level: null, alert: 4.30, flood: 4.50 },
  { id: 'uruguai', name: 'Rio Uruguai (Uruguaiana)', cod: '77150000', feedItemUrl: 'https://niveluruguai.com.br/', level: null, alert: 7.50, flood: 8.50 }
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

// ==========================================
// 3. COMPONENTES DE DADOS (BARRA LATERAL)
// ==========================================
const HydrologyTerminal = ({ rivers, isSyncing }) => {
  if (isSyncing) {
    return (
      <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-2xl h-full flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin mb-4" />
        <span className="text-cyan-400 font-bold tracking-widest text-xs">PROCESSANDO DADOS...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 lg:p-5 border border-slate-700 shadow-2xl h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold tracking-widest mb-1">
            <ActivitySquare size={10} /> TELEMETRIA: FEED JSON DIRETO
          </div>
          <h2 className="text-xl font-black text-white">REDE HIDROLÓGICA</h2>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-2 h-full">
        {rivers.map(river => {
          const isOffline = typeof river.level !== 'number';
          const isFlood = !isOffline && river.level >= river.flood;
          const isAlert = !isOffline && river.level >= river.alert && !isFlood;
          
          let cardStyle = "bg-slate-900/60 border-slate-700/50";
          let numColor = "text-cyan-400";
          
          if (isFlood) {
            cardStyle = "bg-rose-950/20 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
            numColor = "text-rose-400";
          } else if (isAlert) {
            cardStyle = "bg-amber-950/20 border-amber-500/30";
            numColor = "text-amber-400";
          } else if (isOffline) {
            cardStyle = "bg-slate-900/30 border-slate-800 border-dashed";
            numColor = "text-slate-600";
          }

          const pct = Math.min(((!isOffline ? river.level : 0) / (river.flood * 1.2)) * 100, 100);

          return (
            <div key={river.id} className={`p-3 rounded-xl border ${cardStyle} flex flex-col justify-between shrink-0`}>
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold ${isOffline ? 'text-slate-500' : 'text-slate-200'}`}>{river.name}</span>
                {!isOffline && (
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest ${river.isFeed ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                    {river.isFeed ? 'FEED SEMA / PRATICAGEM' : 'SACE / ANA OFICIAL'}
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-3xl font-black leading-none tracking-tighter ${numColor}`}>
                  {isOffline ? '--' : river.level.toFixed(2)}
                </span>
                <span className={`text-[10px] font-bold mb-1 ${isOffline ? 'text-slate-600' : 'text-slate-500'}`}>m</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-2 relative overflow-hidden">
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
        SITUAÇÃO DO RS
      </h2>

      {!hasAlerts ? (
        <div className="flex flex-col items-center justify-center py-10 text-emerald-400 bg-emerald-900/10 border border-emerald-900/30 rounded-xl">
          <CheckCircle2 size={48} className="mb-3"/>
          <p className="font-bold text-center">CONDIÇÕES NORMAIS NO ESTADO</p>
          <p className="text-xs text-emerald-500 mt-1">Nenhum alerta crítico detetado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {riosEmRisco.length > 0 && (
            <div className="bg-rose-900/20 border border-rose-500/50 p-4 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <h3 className="text-rose-500 font-black flex items-center gap-2 mb-3 text-sm tracking-widest"><Waves size={16}/> RISCO DE ENCHENTE</h3>
              <div className="grid gap-2">
                {riosEmRisco.map(r => (
                  <div key={r.id} className="flex justify-between items-center text-xs bg-slate-900/80 p-2.5 rounded border border-rose-500/30">
                    <span className="text-slate-200 font-bold">{r.name}</span>
                    <span className={`font-black px-2 py-0.5 rounded ${r.level >= r.flood ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>
                      {r.level.toFixed(2)}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {enchenteRisks.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
              <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-2 text-sm"><Droplets size={16}/> RISCO CHUVA FORTE</h3>
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
        </div>
      )}
    </div>
  );
};

const StationTerminal = ({ data }) => {
  if (!data || !data.current) return <div className="bg-[#0b1120]/90 rounded-2xl flex items-center justify-center h-full"><Loader2 className="animate-spin text-cyan-500" /></div>;
  const flightData = getFlightCategory(data.current.visibility, data.current.gusts);

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 border border-slate-700 shadow-2xl h-full flex flex-col relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full opacity-20 pointer-events-none ${flightData.rule === 'VOO RESTRITO' ? 'bg-rose-500' : flightData.rule === 'ATENÇÃO' ? 'bg-amber-500' : 'bg-cyan-500'}`}></div>

      <div className="flex flex-col justify-between items-start gap-1 border-b border-slate-700/50 pb-2 mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-1 text-[9px] text-cyan-500 font-bold tracking-widest mb-1"><Crosshair size={10} /> DADOS CLIMÁTICOS</div>
          <h2 className="text-lg font-black text-white">{data.name}</h2>
        </div>
        <div className="flex flex-col items-start gap-1 w-full mt-1">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border w-max ${flightData.color} tracking-widest shadow-lg`}>{flightData.rule}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
        <div className="flex items-center gap-4 pb-3 border-b border-slate-800/50 mb-3">
          {getWeatherIcon(data.current.code, data.current.isDay)}
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none">{data.current.temp}°</h1>
            <span className="text-[10px] text-slate-400 font-medium">Sensação: {data.current.feels}°C</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
            <div className="text-[9px] text-slate-400 font-bold uppercase"><Compass size={12} className="inline mr-1"/>Vento</div>
            <div className="text-xs font-bold text-white mt-1">{data.current.windSpd} km/h</div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
            <div className="text-[9px] text-rose-400 font-bold uppercase"><Wind size={12} className="inline mr-1"/>Rajadas</div>
            <div className="text-xs font-bold text-rose-400 mt-1">{data.current.gusts} km/h</div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
            <div className="text-[9px] text-slate-400 font-bold uppercase"><Eye size={12} className="inline mr-1"/>Visib.</div>
            <div className="text-xs font-bold text-white mt-1">{data.current.visibility} m</div>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/50">
            <div className="text-[9px] text-slate-400 font-bold uppercase"><Gauge size={12} className="inline mr-1"/>Pressão</div>
            <div className="text-xs font-bold text-white mt-1">{data.current.pressure} hPa</div>
          </div>
        </div>

        <div className="mb-4 p-3 border border-slate-700/50 bg-slate-900/40 rounded-xl">
          <div className="text-[9px] text-cyan-400 font-bold tracking-widest mb-3">PRECIPITAÇÃO (6 HORAS)</div>
          <div className="flex justify-between items-end gap-1">
            {data.hourly.map((h, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-slate-400 mb-1">{h.time}</span>
                <div className="transform scale-50 -my-2">{getWeatherIcon(h.code, 1)}</div>
                <div className="w-full bg-slate-800 rounded-sm overflow-hidden h-10 relative flex items-end mt-1">
                  <div style={{ height: `${Math.min((h.precip/10)*100, 100)}%` }} className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm"></div>
                </div>
                <span className="text-[9px] font-bold text-cyan-300 mt-1">{h.precip} <span className="text-[7px]">mm</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border border-slate-700/50 bg-slate-900/40 rounded-xl">
          <div className="text-[9px] text-amber-400 font-bold tracking-widest mb-3 flex items-center gap-2">
            <ShieldAlert size={12}/> PREVISÃO (7 DIAS)
          </div>
          <div className="flex flex-col gap-1.5">
            {data.forecast.map((day, idx) => (
              <div key={idx} className="flex justify-between items-center p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className={`text-[10px] font-black tracking-wider w-10 ${idx === 0 ? 'text-amber-400' : 'text-slate-300'}`}>{day.dayName}</span>
                <div className="transform scale-50 -my-2">{getWeatherIcon(day.code, 1)}</div>
                <span className="text-[10px] font-bold text-slate-400">{day.max}° <span className="text-slate-600">/ {day.min}°</span></span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${day.rain > 15 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : day.rain > 0 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-800 text-slate-500 border-transparent'}`}>
                  {day.rain > 0 ? `${day.rain.toFixed(1)} mm` : '0 mm'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MOTOR PRINCIPAL (APP COM AGENDA)
// ==========================================
export default function Agenda() {
  const [stationsData, setStationsData] = useState([]);
  const [riverData, setRiverData] = useState(INITIAL_RIVERS);
  const [activeId, setActiveId] = useState('RS-GENERAL');
  
  const [globalThreat, setGlobalThreat] = useState({ level: 'GREEN', text: 'INICIALIZANDO SISTEMAS...' });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isHydroSyncing, setIsHydroSyncing] = useState(true);

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
          for (let i = 0; i < 7; i++) {
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
            hourly: hourlyForecast,
            forecast: daysForecast
          };
        }));
        
        setStationsData(results);
        setIsInitializing(false);

        const maxGust = Math.max(...results.map(r => r.current.gusts));
        const minVis = Math.min(...results.map(r => r.current.visibility));

        if (minVis <= 3000 || maxGust >= 60) setGlobalThreat({ level: 'RED', text: 'ALERTA VERMELHO NO ESTADO.' });
        else if (minVis <= 5000 || maxGust >= 40) setGlobalThreat({ level: 'YELLOW', text: 'ATENÇÃO: CONDIÇÕES MARGINAIS.' });
        else setGlobalThreat({ level: 'GREEN', text: 'CONDIÇÕES GERAIS FAVORÁVEIS.' });
      } catch (error) { setIsInitializing(false); }
    };

    // A MESMA FUNÇÃO DO APP.JSX ORIGINAL
    const fetchRivers = async () => {
      setIsHydroSyncing(true);
      
      try {
        const getFeedItems = async (url) => {
          const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
          ];
          for (const p of proxies) {
            try {
              const res = await fetch(p, { cache: 'no-store' });
              if (res.ok) {
                const text = await res.text();
                let data;
                try { data = JSON.parse(text); } catch (e) { continue; }
                
                if (data.items) return data.items;
                if (data.contents) {
                   const innerData = JSON.parse(data.contents);
                   if (innerData.items) return innerData.items;
                }
              }
            } catch(e) {}
          }
          return [];
        };

        const cacheBuster = `?cb=${Date.now()}`;
        const itemsGuaiba = await getFeedItems('https://nivelguaiba.com.br/feed' + cacheBuster);
        const itemsUruguai = await getFeedItems('https://niveluruguai.com.br/feed' + cacheBuster);
        const allFeedItems = [...itemsGuaiba, ...itemsUruguai];

        const updatedRivers = await Promise.all(INITIAL_RIVERS.map(async (rio) => {
          let nivelAtual = null;
          let isFeed = false;

          if (rio.feedItemUrl && allFeedItems.length > 0) {
            const item = allFeedItems.find(i => i.url === rio.feedItemUrl);
            
            if (item) {
              let match = null;
              if (item.title) match = item.title.match(/([0-9]+[.,][0-9]+)\s*m/i);
              if (!match && item.content_text) match = item.content_text.match(/([0-9]+[.,][0-9]+)\s*m/i);

              if (match && match[1]) {
                nivelAtual = parseFloat(match[1].replace(',', '.'));
                isFeed = true;
              }
            }
          }

          if (nivelAtual === null) {
            try {
              const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://sace.cprm.gov.br/api/dadosestacao/' + rio.cod)}`);
              if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                  for (let i = data.length - 1; i >= 0; i--) {
                    if (data[i].nivel) {
                      nivelAtual = data[i].nivel / 100;
                      isFeed = false;
                      break;
                    }
                  }
                }
              }
            } catch(e) {}
          }

          if (nivelAtual === null) {
            try {
              const url = `https://api.allorigins.win/get?url=${encodeURIComponent('http://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosTempoReal?codEstacao=' + rio.cod)}`;
              const res = await fetch(url, { cache: 'no-store' });
              if (res.ok) {
                const data = await res.json();
                if (data.contents && data.contents.includes('<Nivel>')) {
                  const match = data.contents.match(/<Nivel>([0-9]+)<\/Nivel>/);
                  if (match && match[1]) {
                    nivelAtual = parseFloat(match[1]) / 100;
                    isFeed = false;
                  }
                }
              }
            } catch(e) {}
          }

          return { ...rio, level: nivelAtual !== null ? parseFloat(nivelAtual) : null, isFeed };
        }));
        
        setRiverData(updatedRivers);
      } catch (error) {
        console.error("Falha tática na hidrologia:", error);
      } finally {
        setIsHydroSyncing(false);
      }
    };

    fetchWeather(); fetchRivers();
    const interval = setInterval(() => { fetchWeather(); fetchRivers(); }, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity size={40} className="text-cyan-400 animate-pulse" />
          <h1 className="text-cyan-400 font-bold tracking-widest animate-pulse">A CARREGAR DADOS...</h1>
        </div>
      </div>
    );
  }

  const statusColors = { RED: "bg-rose-500/10 border-rose-500/40 text-rose-400", YELLOW: "bg-amber-500/10 border-amber-500/40 text-amber-400", GREEN: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" };

  return (
    <div className="min-h-screen bg-[#020617] p-2 md:p-3 text-slate-200 font-sans flex flex-col gap-2 overflow-hidden h-screen" style={{ background: 'radial-gradient(circle at top right, #0f172a, #020617)' }}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; } 
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
      `}</style>

      {/* CABEÇALHO */}
      <div className="flex justify-between items-center w-full shrink-0 px-2">
        <div>
          <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tight leading-none flex items-center gap-2">
            <ShieldAlert size={18} className="text-cyan-400"/> DASHBOARD CLIMÁTICO & AGENDA
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-lg ${statusColors[globalThreat.level]}`}>
          <AlertTriangle size={14} className={globalThreat.level === 'RED' ? 'animate-pulse' : ''} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{globalThreat.text}</span>
        </div>
      </div>
      
      {/* SELETOR DE ESTAÇÕES (ABAS) */}
      <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar w-full shrink-0 border-b border-slate-800 px-2">
        {BASES.map((base) => {
          const stationData = stationsData.find(s => s.id === base.id);
          const flightData = stationData ? getFlightCategory(stationData.current.visibility, stationData.current.gusts) : null;
          const isSelected = activeId === base.id;
          
          return (
            <button key={base.id} onClick={() => setActiveId(base.id)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all duration-300 border-x border-t ${isSelected ? 'bg-slate-800/80 border-slate-600 shadow-md' : 'bg-slate-900/30 border-slate-800/50 hover:bg-slate-800/50'}`}>
              {base.id === 'HYDRO' ? <Waves size={10} className={isSelected ? "text-blue-400" : "text-slate-500"}/> : flightData ? <div className={`w-2 h-2 rounded-full shrink-0 ${flightData.dot}`}></div> : <MapIcon size={10} className={isSelected ? "text-cyan-400" : "text-slate-500"}/>}
              <div className="flex flex-col items-start text-left">
                <span className={`text-[9px] lg:text-[10px] font-bold whitespace-nowrap ${isSelected ? 'text-white' : 'text-slate-400'}`}>{base.name}</span>
                {stationData && <span className={`text-[8px] font-bold ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`}>{stationData.current.temp}°C</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* ÁREA PRINCIPAL: BARRA LATERAL ESQUERDA + CALENDÁRIO DIREITA */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden min-h-0">
        
        {/* BARRA LATERAL COM OS DADOS */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 h-[45%] lg:h-full overflow-hidden">
           {activeId === 'RS-GENERAL' ? <GeneralOverview stations={stationsData} rivers={riverData} /> : 
            activeId === 'HYDRO' ? <HydrologyTerminal rivers={riverData} isSyncing={isHydroSyncing} /> : 
            <StationTerminal data={stationsData.find(s => s.id === activeId)} />}
        </div>

        {/* ÁREA DA AGENDA (GOOGLE CALENDAR) */}
        <div className="flex-1 relative rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-700 bg-white overflow-hidden h-[55%] lg:h-full">
          <iframe 
            src="https://calendar.google.com/calendar/embed?src=sdsophaco@gmail.com&ctz=America/Sao_Paulo&mode=WEEK&showTitle=0&showPrint=0&showTabs=1&showCalendars=0&showTz=0" 
            style={{ border: 0 }} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no"
            title="Agenda Google Calendar"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
