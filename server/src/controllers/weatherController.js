const axios = require('axios');
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 1800 });
function mapWeatherCodeToIcon(code) {
  switch (true) {
    case code === 0: return '01d'; // Ясно
    case code === 1: return '02d'; // Переважно ясно
    case code === 2: return '03d'; // Мінлива хмарність
    case code === 3: return '04d'; // Похмуро
    case [45, 48].includes(code): return '50d'; // Туман
    case [51, 53, 55, 56, 57].includes(code): return '09d'; // Мряка
    case [61, 63, 65, 66, 67].includes(code): return '10d'; // Дощ
    case [71, 73, 75, 77].includes(code): return '13d'; // Сніг
    case [80, 81, 82].includes(code): return '09d'; // Злива
    case [85, 86].includes(code): return '13d'; // Снігопад
    case [95, 96, 99].includes(code): return '11d'; // Гроза
    default: return '03d';
  }
}
function getWeatherDescription(code) {
  const codes = {
    0: 'Ясно',
    1: 'Переважно ясно', 2: 'Мінлива хмарність', 3: 'Похмуро',
    45: 'Туман', 48: 'Туман з інеєм',
    51: 'Мряка', 53: 'Помірна мряка', 55: 'Щільна мряка',
    61: 'Слабкий дощ', 63: 'Дощ', 65: 'Сильний дощ',
    71: 'Слабкий сніг', 73: 'Сніг', 75: 'Сильний сніг',
    95: 'Гроза', 96: 'Гроза з градом'
  };
  return codes[code] || 'Невідомо';
}
const getWeather = async (req, res) => {
  try {
    const { city } = req.query;
    const cachedData = myCache.get(city.toLowerCase());
    if (cachedData) return res.json(cachedData);
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=uk&format=json`;
    const geoResponse = await axios.get(geoUrl);
    if (!geoResponse.data.results?.length) return res.status(404).json({ error: 'Місто не знайдено' });
    const { latitude, longitude, name } = geoResponse.data.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max&hourly=temperature_2m,weather_code,relative_humidity_2m&timezone=auto`;
    const weatherResponse = await axios.get(weatherUrl);
    const data = weatherResponse.data;
    const now = new Date();
    let startIndex = data.hourly.time.findIndex(t => new Date(t).getTime() >= now.getTime());
    if (startIndex === -1) startIndex = 0;
    const allHourlyData = data.hourly.time.slice(startIndex).map((time, i) => {
      const actualIndex = startIndex + i;
      return {
        dt: new Date(time).getTime() / 1000,
        temp: Math.round(data.hourly.temperature_2m[actualIndex]),
        icon: mapWeatherCodeToIcon(data.hourly.weather_code[actualIndex])
      };
    });
    const dailyForecast = data.daily.time.map((time, index) => {
        let humidity;
        if (index === 0) humidity = data.current.relative_humidity_2m;
        else humidity = data.hourly.relative_humidity_2m[index * 24 + 12] || 60;

        return {
            dt: new Date(time).getTime() / 1000,
            temp: {
                day: Math.round(data.daily.temperature_2m_max[index]),
                min: Math.round(data.daily.temperature_2m_min[index]),
                max: Math.round(data.daily.temperature_2m_max[index])
            },
            feelsLike: index === 0 ? Math.round(data.current.apparent_temperature) : Math.round(data.daily.temperature_2m_max[index]),
            humidity: humidity,
            windSpeed: data.daily.wind_speed_10m_max[index],
            description: getWeatherDescription(data.daily.weather_code[index]),
            icon: mapWeatherCodeToIcon(data.daily.weather_code[index])
        };
    });
    const responseData = {
      city: name,
      hourly: allHourlyData,
      daily: dailyForecast.slice(0, 5)
    };
    myCache.set(city.toLowerCase(), responseData);
    res.json(responseData);
  } catch (error) {
     console.error(error);
     res.status(500).json({error: 'Server Error'});
  }
};
module.exports = { getWeather };