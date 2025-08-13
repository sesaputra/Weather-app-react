import React, { useEffect, useRef, useState } from 'react';
import './Weather.css';
import search_icon from '../assets/search.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import rain_icon from '../assets/rain.png';
import snow_icon from '../assets/snow.png';
import wind_icon from '../assets/wind.png';
import humidity_icon from '../assets/humidity.png';

// Mapping icon OpenWeatherMap ke asset lokal
const allIcons = {
  "01d": clear_icon, "01n": clear_icon, // clear sky
  "02d": cloud_icon, "02n": cloud_icon, // few clouds
  "03d": cloud_icon, "03n": cloud_icon, // scattered clouds
  "04d": cloud_icon, "04n": cloud_icon, // broken clouds <-- Dipetakan ke cloud_icon
  "09d": drizzle_icon, "09n": drizzle_icon, // shower rain
  "10d": rain_icon, "10n": rain_icon, // rain
  "11d": rain_icon, "11n": rain_icon, // thunderstorm
  "13d": snow_icon, "13n": snow_icon, // snow
  "50d": cloud_icon, "50n": cloud_icon // mist/fog
};

const Weather = () => {
  const inputRef = useRef();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const search = async (city) => {
    if (!city) {
      alert("Please enter a city name");
      return;
    }

    setIsTransitioning(true);
    setLoading(true);
    setError(null);
    setWeatherData(null);

    setTimeout(async () => {
      try {
        const apiKey = import.meta.env.VITE_APP_ID;
        const [resCurrent, resForecast] = await Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}&lang=id`),
          fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}&lang=id`)
        ]);

        const [dataCurrent, dataForecast] = await Promise.all([
          resCurrent.json(),
          resForecast.json()
        ]);

        if (dataCurrent.cod === "404" || dataForecast.cod === "404") {
          throw new Error("Kota tidak ditemukan.");
        }

        // Debug icon code
        console.log("Current icon code:", dataCurrent.weather[0].icon);
        console.log("Forecast icon codes:", dataForecast.list.map(item => item.weather[0].icon));

        // Filter ramalan jam 12:00:00
        const dailyForecast = dataForecast.list.filter(item => item.dt_txt.includes("12:00:00"));

        setWeatherData({
          current: {
            humidity: dataCurrent.main.humidity,
            windSpeed: (dataCurrent.wind.speed * 3.6).toFixed(1), // m/s → km/h
            temp: Math.floor(dataCurrent.main.temp),
            feelsLike: Math.floor(dataCurrent.main.feels_like),
            status: dataCurrent.weather[0].description,
            icon: allIcons[dataCurrent.weather[0].icon] || cloud_icon, // fallback cloud
          },
          location: `${dataCurrent.name}, ${dataCurrent.sys.country}`,
          forecast: dailyForecast.slice(0, 5).map(day => ({
            date: new Date(day.dt_txt).toLocaleDateString("id-ID", {
              weekday: "short", day: "numeric"
            }),
            temp: Math.floor(day.main.temp),
            status: day.weather[0].description,
            icon: allIcons[day.weather[0].icon] || cloud_icon,
          }))
        });
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Terjadi kesalahan saat mengambil data.");
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    }, 500);
  };

  useEffect(() => {
    search("Tibubiyu");
  }, []);

  return (
    <div className='weather-app'>
      <div className="search-bar">
        <input
          ref={inputRef}
          type="text"
          placeholder='Cari kota...'
          onKeyDown={(e) => e.key === 'Enter' && search(inputRef.current.value)}
        />
        <img src={search_icon} alt="search icon" onClick={() => search(inputRef.current.value)} />
      </div>

      <div className={`weather-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
        {loading && <div className="loading-spinner"><div className="spinner"></div></div>}
        {error && <p className="message error">{error}</p>}
        
        {!loading && !error && weatherData && (
          <>
            <div className='weather-main'>
              <img src={weatherData.current.icon} alt="weather icon" className='weather-icon' />
              <p className='temperature'>{weatherData.current.temp}°C</p>
              <p className='location'>{weatherData.location}</p>
              <p className='status'>{weatherData.current.status}</p>
            </div>

            <div className="weather-details">
              <div className="col">
                <img src={humidity_icon} alt="humidity icon" />
                <div><p>{weatherData.current.humidity}%</p><span>Kelembaban</span></div>
              </div>
              <div className="col">
                <img src={wind_icon} alt="wind icon" />
                <div><p>{weatherData.current.windSpeed} km/h</p><span>Kecepatan Angin</span></div>
              </div>
            </div>
            <div className="feels-like">
              <p>Terasa seperti: {weatherData.current.feelsLike}°C</p>
            </div>

            <hr />

            <div className="forecast-section">
              <h4>Ramalan 5 Hari</h4>
              <div className="forecast-list">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="forecast-item">
                    <p className="forecast-day">{day.date}</p>
                    <img src={day.icon} alt="forecast icon" className='forecast-icon' />
                    <p className="forecast-temp">{day.temp}°C</p>
                    <p className="forecast-status">{day.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Weather;
