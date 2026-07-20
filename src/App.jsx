import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind, Droplets } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ==========================================
// FUNÇÕES AUXILIARES E ÍCONES
// ==========================================
const getWeatherIcon = (code, isDay = 1) => {
  if (code === 0) return isDay ? <Sun className="text-yellow-400" /> : <Moon className="text-blue-200" />;
  if (code === 1 || code === 2) return isDay ? <CloudSun className="text-yellow-200" /> : <Cloud className="text-gray-300" />;
  if (code === 3) return <Cloud className="text-gray-400" />;
  if (code >= 51 && code <= 55) return <CloudDrizzle className="text-blue-300" />;
  if (code >= 61 && code <= 65) return <CloudRain className="text-blue-400" />;
  if (code >= 80 && code <= 82) return <CloudRain className="text-blue-500" />;
  if (code >= 95) return <CloudLightning className="text-red-400" />;
  return <Cloud className="text-gray-500" />;
};

const getTempColor = (code) => {
  if (code >= 95) return "text-red-500";
  if (code >= 65 || code === 82) return "text-green-400";
  return "text-yellow-400";
};

const getDayName = (dateString, index) => {
  if (index === 0) return "HOJE";
  const date = new Date(dateString + "T12:00:00");
  return ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][date.getDay()];
};

// ==========================================
// COMPONENTE: FORÇAR RENDERIZAÇÃO DO MAPA
// ==========================================
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timeout);
  }, [map]);
  return null;
};

// ==========================================
// COMPONENTE: CARD DA CIDADE
// ==========================================
const WeatherCard = ({ data }) => {
  if (!data) return <div className="p-6 bg-white/5 rounded-2xl animate-pulse h-[500px]"></div>;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-200 tracking-wider">📍 {data.city.toUpperCase()}</h2>
        <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full text-blue-200">
          UV Máx: {data.daily.uv}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="transform scale-[2] ml-2">
          {getWeatherIcon(data.current.code, data.current.isDay)}
        </div>
        <div className="ml-4">
          <h1 className={`text-6xl font-bold tracking-tighter ${getTempColor(data.current.code)}`}>
            {data.current.temp}°
          </h1>
          <p className="text-gray-300 text-sm mt-1 font-medium">Sensação {data.current.feels}°</p>
        </div>
        <div className="ml-auto flex flex-col gap-3 text-xs text-gray-400 bg-black/20 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Wind size={16} className="text-gray-300" /> {data.current.windSpd} km/h
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-300" /> {data.current.humidity}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mt-2 pt-6 border-t border-white/10">
        {data.hourly.map((hour, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">{hour.time}</span>
            <div className="transform scale-125">{getWeatherIcon(hour.code, 1)}</div>
            <span className={`text-sm font-bold ${getTempColor(hour.code)}`}>{hour.temp}°</span>
            {hour.precip > 0 ? (
              <span className="text-[10px] font-bold text-blue-400 bg-blue-900/30 px-1 rounded">{hour.precip.toFixed(1)}mm</span>
            ) : (
              <span className="text-[10px] text-gray-500">---</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2 mt-2 pt-6 border-t border-white/10">
        {data.forecast.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 bg-black/20 p-2 rounded-xl">
            <span className={`text-[10px] font-bold ${idx === 0 ? 'text-white' : 'text-gray-400'}`}>
              {day.dayName}
            </span>
            <div className="transform scale-110">{getWeatherIcon(day.code, 1)}</div>
            <span className="text-xs font-bold text-gray-200 mt-1">{day.min}°/{day.max}°</span>
            {day.rain > 0.1 ? (
              <span className="text-[10px] font-bold text-blue-400">{day.rain.toFixed(1)}mm</span>
            ) : (
              <span className="text-[10px] text-gray-500">---</span>
            )}
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

  useEffect(() => {
    const fetchWeather = async (lat, lon, city) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max&timezone=America%2FSao_Paulo`;
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

      let daysForecast = [];
      for (let i = 0; i < 5; i++) {
        daysForecast.push({
          dayName: getDayName(json.daily.time[i], i),
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
          humidity: json.current.relative_humidity_2m,
          windSpd: Math.round(json.current.wind_speed_10m)
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
    };

    loadAll();
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  const hacoCoords = [-29.92, -51.18];
  const bageCoords = [-31.33, -54.11];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-8">
      
      <style>{`
        .leaflet-container {
          background-color: #0f172a !important; 
        }
        .leaflet-container img {
          max-width: none !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Modo noturno absoluto no mapa base */
        .dark-base-map {
          filter: invert(100%) hue-rotate(180deg) brightness(85%) contrast(85%) grayscale(20%);
        }
        .leaflet-tooltip {
          background: rgba(0, 0, 0, 0.7) !important;
          border: 1px solid rgba(255,255,255,0.2) !important;
          color: white !important;
          font-weight: bold;
          box-shadow: none !important;
        }
      `}</style>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Painel Operacional HACO</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WeatherCard data={weatherData.bage} />
        <WeatherCard data={weatherData.canoas} />
      </div>

      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 shadow-2xl border border-white/10 overflow-hidden relative mt-4">
        
        <div className="absolute top-4 left-4 z-[400] bg-black/80 p-3 rounded-lg border border-white/10 shadow-lg pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded">LIVE</span>
            <span className="text-white text-xs font-bold tracking-widest">RADAR TÁTICO NEXRAD</span>
          </div>
          <div className="text-[#30D158] text-[10px] font-mono mt-2">OP: HACO CTR</div>
          <div className="text-[#30D158] text-[10px] font-mono">RNG: 300KM MAX</div>
          <div className="text-[#30D158] text-[10px] font-mono mt-1 pt-1 border-t border-[#30D158]/30">
            VARREDURA: {radar.time || "--:--"}
          </div>
        </div>

        <div className="h-[550px] w-full rounded-xl overflow-hidden bg-[#0f172a]">
          <MapContainer 
            key={radar.path ? `map-${radar.path}` : "map-loading"}
            center={[-30.627, -52.646]} 
            zoom={6} 
            maxZoom={12} 
            minZoom={5}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <MapResizer />

            {/* MAPA BASE DAS RUAS (Funciona perfeitamente em qualquer zoom) */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap'
              className="dark-base-map"
              maxZoom={19}
            />
            
            {/* 
              CAMADA DO RADAR DE CHUVA (A BALA DE PRATA)
              maxNativeZoom={6}: Avisa ao Leaflet que a API de chuva não tem imagens acima do zoom 6.
              maxZoom={18}: Permite que o usuário dê zoom até 18, esticando a imagem 6.
            */}
            {radar.path && (
              <TileLayer
                url={`${radar.host}${radar.path}/256/{z}/{x}/{y}/6/1_1.png`}
                opacity={0.65}
                maxNativeZoom={6} 
                maxZoom={18}
                zIndex={10}
              />
            )}

            {/* CROSSHAIR & ANÉIS TÁTICOS */}
            <Polyline positions={[[-25.0, -51.18], [-35.0, -51.18]]} color="#30D158" weight={1} opacity={0.4} />
            <Polyline positions={[[-29.92, -58.0], [-29.92, -45.0]]} color="#30D158" weight={1} opacity={0.4} />

            <Circle center={hacoCoords} radius={100000} color="#30D158" weight={1} fill={false} dashArray="4, 4" opacity={0.6} />
            <Circle center={hacoCoords} radius={200000} color="#30D158" weight={1} fill={false} dashArray="4, 4" opacity={0.6} />
            <Circle center={hacoCoords} radius={300000} color="#30D158" weight={1} fill={false} dashArray="4, 4" opacity={0.6} />

            <CircleMarker center={hacoCoords} radius={6} color="#000" weight={2} fillColor="#30D158" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="right" offset={[10, 0]} opacity={1} permanent>
                CANOAS (HACO)
              </Tooltip>
            </CircleMarker>

            <CircleMarker center={bageCoords} radius={6} color="#000" weight={2} fillColor="#FFD60A" fillOpacity={1} zIndexOffset={100}>
              <Tooltip direction="left" offset={[-10, 0]} opacity={1} permanent>
                BAGÉ
              </Tooltip>
            </CircleMarker>

          </MapContainer>
        </div>
      </div>
      
    </div>
  );
}
