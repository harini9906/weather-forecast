
import { useState, useEffect } from 'react'
import './App.css'

function getWeather(code) {
  if (code === 0) return ['☀️', 'Clear Sky']
  if ([1, 2].includes(code)) return ['🌤️', 'Partly Cloudy']
  if (code === 3) return ['☁️', 'Overcast']
  if ([45, 48].includes(code)) return ['🌫️', 'Foggy']
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return ['🌧️', 'Rainy']
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return ['❄️', 'Snowy']
  if ([95, 96, 99].includes(code)) return ['⛈️', 'Thunderstorm']
  return ['🌡️', 'Weather']
}

function App() {
  const [city, setCity] = useState('Chennai')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchWeather(searchCity = city) {
    if (!searchCity.trim()) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=en&format=json`
      )

      if (!geoResponse.ok) throw new Error('Location search failed')

      const geoData = await geoResponse.json()

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found. Try another city.')
      }

      const place = geoData.results[0]

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      )

      if (!weatherResponse.ok) throw new Error('Weather data unavailable')

      const data = await weatherResponse.json()

      setWeather({
        ...data.current,
        name: place.name,
        country: place.country || '',
      })

      const days = data.daily.time.map((date, index) => ({
        date,
        code: data.daily.weather_code[index],
        max: data.daily.temperature_2m_max[index],
        min: data.daily.temperature_2m_min[index],
      }))

      setForecast(days)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    searchWeather('Chennai')
  }, [])

  function formatDay(date, index) {
    if (index === 0) return 'Today'
    return new Date(date + 'T12:00:00').toLocaleDateString(
      'en-US',
      { weekday: 'short' }
    )
  }

  return (
    <div className="app">
      <div className="weather-container">

        <header className="header">
          <h2>🌤️ WeatherCast</h2>
          <span>Live Weather Updates</span>
        </header>

        <section className="search-box">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') searchWeather()
            }}
          />
          <button onClick={() => searchWeather()}>
            Search
          </button>
        </section>

        {loading && (
          <p className="message">Loading weather details...</p>
        )}

        {error && (
          <p className="error">{error}</p>
        )}

        {weather && !loading && (
          <>
            <section className="main-weather">
              <p className="location">
                📍 {weather.name}, {weather.country}
              </p>

              <div className="weather-icon">
                {getWeather(weather.weather_code)[0]}
              </div>

              <h1>{Math.round(weather.temperature_2m)}°C</h1>

              <h3>{getWeather(weather.weather_code)[1]}</h3>

              <p className="feels">
                Feels like {Math.round(weather.apparent_temperature)}°C
              </p>
            </section>

            <section className="details">
              <div className="detail-card">
                <span>💧</span>
                <p>Humidity</p>
                <h3>{weather.relative_humidity_2m}%</h3>
              </div>

              <div className="detail-card">
                <span>💨</span>
                <p>Wind Speed</p>
                <h3>{weather.wind_speed_10m} km/h</h3>
              </div>

              <div className="detail-card">
                <span>🌧️</span>
                <p>Precipitation</p>
                <h3>{weather.precipitation} mm</h3>
              </div>
            </section>

            <section className="forecast">
              <h2>5-Day Forecast</h2>

              <div className="forecast-list">
                {forecast.map((day, index) => (
                  <div className="forecast-card" key={day.date}>
                    <p>{formatDay(day.date, index)}</p>
                    <span>{getWeather(day.code)[0]}</span>
                    <h3>{Math.round(day.max)}°</h3>
                    <p className="min-temp">
                      {Math.round(day.min)}°C
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <footer>
          WeatherCast © 2026 | Powered by Open-Meteo
        </footer>

      </div>
    </div>
  )
}

export default App
