import React, { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Sun, Wind } from 'lucide-react';

// Mapeamento de códigos WMO para Ícones Lucide
const getWeatherIcon = (code, isDay) => {
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

const WeatherCard = ({ data }) => {
  if (!data) return <div className="p-6 bg-white/5 rounded-2xl animate-pulse h-64"></div>;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 flex flex-col gap-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-200 tracking-wider">📍 {data.city.toUpperCase()}</h2>
        <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
          ↓{data.daily.min}° ↑{data.daily.max}°
        </span>
      </div>

      {/* Clima Atual */}
      <div className="flex items-center gap-6">
        <div className="transform scale-150">
          {getWeatherIcon(data.current.code, data.current.isDay)}
        </div>
        <div>
          <h1 className={`text-5xl font-bold ${getTempColor(data.current.code)}`}>
            {data.current.temp}°
          </h1>
          <p className="text-gray-300 text-sm mt-1">Sensação {data.current.feels}°</p>
        </div>
        <div className="ml-auto flex flex-col gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Wind size={14} /> {data.current.windSpd} km/h
          </div>
          <div>💧 Umidade: {data.current.humidity}%</div>
        </div>
      </div>

      {/* Linha do Tempo (Próximas 6 horas) */}
      <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t border-white/10">
        {data.hourly.map((hour, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">{hour.time}</span>
            {getWeatherIcon(hour.code, 1)}
            <span className={`text-sm font-bold ${getTempColor(hour.code)}`}>{hour.temp}°</span>
            {hour.precip > 0 ? (
              <span className="text-[10px] font-bold text-blue-400">{hour.precip.toFixed(1)}mm</span>
            ) : (
              <span className="text-[10px] text-gray-500">---</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [weatherData, setWeatherData] = useState({ bage: null, canoas: null });

  useEffect(() => {
    const fetchWeather = async (lat, lon, city) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo`;
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
          humidity: json.current.relative_humidity_2m,
          windSpd: Math.round(json.current.wind_speed_10m)
        },
        daily: {
          max: Math.round(json.daily.temperature_2m_max[0]),
          min: Math.round(json.daily.temperature_2m_min[0])
        },
        hourly: hourlyForecast
      };
    };

    const loadAll = async () => {
      const bage = await fetchWeather(-31.33, -54.11, "Bagé");
      const canoas = await fetchWeather(-29.92, -51.18, "Canoas");
      setWeatherData({ bage, canoas });
    };

    loadAll();
    
    // Atualiza a cada 15 minutos na web
    const interval = setInterval(loadAll, 1000 * 60 * 15);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-white mb-2">Painel Operacional Meteorológico</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WeatherCard data={weatherData.bage} />
        <WeatherCard data={weatherData.canoas} />
      </div>
    </div>
  );
}
