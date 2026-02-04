import { useState, useEffect, useRef } from 'react';
import { getWeather } from '../services/api';
import type { WeatherData, DailyWeather } from '../types/weather';
import '../App.css';
export const WeatherCard = () => {
  const [city, setCity] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fetchInitialWeather = async () => {
      setLoading(true);
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geoData = await geoRes.json();
        const detectedCity = geoData.city || 'Kyiv';
        setCity(detectedCity);
        const data = await getWeather(detectedCity);
        setWeatherData(data);
      } catch (err) {
        console.error('Геолокація не спрацювала:', err);
        setCity('Kyiv');
        const data = await getWeather('Kyiv');
        setWeatherData(data);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialWeather();
  }, []);
  const performSearch = async (searchCity: string) => {
    if (!searchCity.trim()) return;
    setLoading(true);
    setError(null);
    setWeatherData(null);
    setSelectedDayIndex(0);
    try {
      const data = await getWeather(searchCity);
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Сталася помилка');
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = () => performSearch(city);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 200;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };
  const getTemp = (temp: number) => {
    if (unit === 'C') return Math.round(temp);
    return Math.round(temp * 1.8 + 32);
  };
  const formatDay = (dt: number, index: number) => {
    if (index === 0) return 'Сьогодні';
    const date = new Date(dt * 1000);
    return new Intl.DateTimeFormat('uk-UA', { weekday: 'short' }).format(date);
  };
  const formatTime = (dt: number) => {
    const date = new Date(dt * 1000);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };
  const isSameDate = (dt1: number, dt2: number) => {
    const d1 = new Date(dt1 * 1000);
    const d2 = new Date(dt2 * 1000);
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
  };
  const currentDisplay: DailyWeather | null = weatherData?.daily[selectedDayIndex] || null;
  const hourlyForSelectedDay = weatherData?.hourly.filter(hour => 
    currentDisplay && isSameDate(hour.dt, currentDisplay.dt)
  ) || [];
  return (
    <div className="weather-card">
      <header className="card-header">
        <h1>🌤 SkyTracker</h1>
        <div className="unit-toggle">
          <button 
            className={unit === 'C' ? 'active' : ''} 
            onClick={() => setUnit('C')}>°C
          </button>
          <span className="divider">|</span>
          <button 
            className={unit === 'F' ? 'active' : ''} 
            onClick={() => setUnit('F')}>°F
          </button>
        </div>
      </header>
      <div className="search-box">
        <input
          type="text"
          placeholder="Введіть місто..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? '...' : 'Знайти'}
        </button>
      </div>
      {error && <div className="error-message">⚠️ {error}</div>}
      {loading && !weatherData && (
        <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
          Визначаємо локацію... 🌍
        </div>
      )}
      {weatherData && currentDisplay && !loading && (
        <>
          <div className="weather-info">
            <h2>{weatherData.city}</h2>
            <p className="date-label">
              {new Date(currentDisplay.dt * 1000).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
            </p>
            <div className="temp-display">
              <img 
                src={`https://openweathermap.org/img/wn/${currentDisplay.icon}@4x.png`} 
                alt={currentDisplay.description}
                className="weather-icon"
              />
              <span className="temp">{getTemp(currentDisplay.temp.day)}°{unit}</span>
              <p className="desc">{currentDisplay.description}</p>
            </div>
            <div className="details">
              <div className="detail-item">
                <span>🌡 Відчувається:</span>
                <strong>{getTemp(currentDisplay.feelsLike)}°{unit}</strong>
              </div>
              <div className="detail-item">
                <span>💧 Вологість:</span>
                <strong>{currentDisplay.humidity}%</strong>
              </div>
              <div className="detail-item">
                <span>💨 Вітер:</span>
                <strong>{currentDisplay.windSpeed} м/с</strong>
              </div>
            </div>
            {hourlyForSelectedDay.length > 0 ? (
              <div className="hourly-container">
                <button className="scroll-btn" onClick={() => scroll('left')}>‹</button>
                <div className="hourly-forecast" ref={scrollRef}>
                  {hourlyForSelectedDay.map((hour) => (
                    <div key={hour.dt} className="hour-item">
                      <span className="hour-time">{formatTime(hour.dt)}</span>
                      <img 
                        src={`https://openweathermap.org/img/wn/${hour.icon}.png`} 
                        alt="icon" 
                        className="hour-icon"
                      />
                      <span className="hour-temp">{getTemp(hour.temp)}°</span>
                    </div>
                  ))}
                </div>
                <button className="scroll-btn" onClick={() => scroll('right')}>›</button>
              </div>
            ) : (
              <div className="hourly-forecast" style={{ justifyContent: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                Немає погодинних даних для цього дня
              </div>
            )}
          </div>
          <div className="daily-forecast">
            {weatherData.daily.slice(0, 5).map((day, index) => (
              <div 
                key={day.dt}
                className={`day-item ${index === selectedDayIndex ? 'active' : ''}`}
                onClick={() => setSelectedDayIndex(index)}
              >
                <span className="day-name">{formatDay(day.dt, index)}</span>
                <img 
                  src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                  alt="icon" 
                  width="30"
                />
                <span className="day-temp">
                  {getTemp(day.temp.max)}°
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};