const formatWeatherData = (city, openWeatherData) => {
  const daily = openWeatherData.daily.map(day => ({
    dt: day.dt,
    temp: {
      day: day.temp.day,
      min: day.temp.min,
      max: day.temp.max
    },
    feelsLike: day.feels_like.day,
    humidity: day.humidity,
    windSpeed: day.wind_speed,
    description: day.weather[0].description,
    icon: day.weather[0].icon
  }));
  return {
    city: city,
    daily: daily
  };
};
module.exports = { formatWeatherData };