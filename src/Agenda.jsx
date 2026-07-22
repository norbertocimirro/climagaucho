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
// 3. COMPONENTES DE DADOS (AGORA EM BARRA LATERAL)
// ==========================================
const HydrologyTerminal = ({ rivers, isSyncing }) => {
  if (isSyncing) {
    return (
      <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-2xl h-full flex flex-col items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin mb-4" />
        <span className="text-cyan-400 font-bold tracking-widest text-xs">PROCESSANDO DADOS HIDROLÓGICOS...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0b1120]/90 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-slate-700 shadow-2xl h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold tracking-widest mb-1">
            <ActivitySquare size={10} /> TELEMETRIA: FEED DIRETO
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-white">REDE HIDROLÓGICA</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar pr-2 pb-2">
        {rivers.map(river => {
          const isOffline = typeof river.level !== 'number';
          const isFlood = !isOffline && river.level >= river.flood;
          const isAlert = !isOffline && river.level >= river.alert && !isFlood;
          
          let cardStyle = "bg-slate-900/60 border-slate-700/50";
          let numColor = "text-cyan-400";
          
          if (isFlood) {
            cardStyle = "bg-rose-950/20 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
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
            <div key={river.id} className={`p-4 rounded-xl border ${cardStyle} flex flex-col justify-between`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`text-sm font-bold ${isOffline ? 'text-slate-500' : 'text-slate-200'}`}>{river.name}</span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span className={`text-4xl font-black leading-none tracking-tighter ${numColor}`}>
                  {isOffline ? '--' : river.level.toFixed(2)}
                </span>
                <span className={`text-xs font-bold mb-1 ${isOffline ? 'text-slate-600' : 'text-slate-500'}`}>m</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full mt-2 relative overflow-hidden">
                 {!isOffline && <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isFlood ? 'bg-rose-500' : isAlert ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }}></div>}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
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
              <h3 className="text-rose-500 font-black flex items-center gap-2 mb-3 text-sm tracking-widest"><Waves size={16}/> RISCO DE EN
