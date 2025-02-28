"use client"

import { useState } from "react"
import { Droplets, Wind, Sunrise, Sunset, CloudRain, Cloud, Sun, CloudLightning, Thermometer, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface WeatherData {
  id: number
  name: string
  main: {
    temp: number
    humidity: number
    feels_like: number
    pressure: number
  }
  wind: {
    speed: number
    deg: number
  }
  sys: {
    sunrise: number
    sunset: number
  }
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }[]
  rain?: {
    "1h"?: number
  }
  uvi?: number
  air_quality_index?: number
}

interface DistrictCardProps {
  district: string
  weatherData: WeatherData | null
  isFavorite: boolean
  onFavoriteToggle: () => void
  onClick: () => void
}

export function DistrictCard({ district, weatherData, isFavorite, onFavoriteToggle, onClick }: DistrictCardProps) {
  const [isCelsius, setIsCelsius] = useState(true)

  if (!weatherData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle>{district}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px]">
            <p className="text-muted-foreground text-center mb-2">Data unavailable for {district}</p>
            <p className="text-xs text-muted-foreground text-center">Check console for error details</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Convert temperature
  const tempCelsius = weatherData.main.temp
  const tempFahrenheit = (tempCelsius * 9) / 5 + 32
  const displayTemp = isCelsius ? tempCelsius.toFixed(1) : tempFahrenheit.toFixed(1)
  const tempUnit = isCelsius ? "°C" : "°F"

  // Format time from unix timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get wind direction
  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  // Get UV index risk level
  const getUVRiskLevel = (uvi: number | undefined) => {
    if (!uvi) return { level: "Unknown", color: "bg-gray-400" }
    if (uvi < 3) return { level: "Low", color: "bg-green-400" }
    if (uvi < 6) return { level: "Moderate", color: "bg-yellow-400" }
    if (uvi < 8) return { level: "High", color: "bg-orange-400" }
    if (uvi < 11) return { level: "Very High", color: "bg-red-400" }
    return { level: "Extreme", color: "bg-purple-400" }
  }

  // Get precipitation probability (estimated from rain data if available)
  const getPrecipitation = () => {
    if (weatherData.rain && weatherData.rain["1h"]) {
      return `${weatherData.rain["1h"]} mm`
    }
    return "N/A"
  }

  // Get weather condition for animation
  const getWeatherCondition = () => {
    if (!weatherData.weather || weatherData.weather.length === 0) return "clear"

    const condition = weatherData.weather[0].main.toLowerCase()
    if (condition.includes("rain") || condition.includes("drizzle")) return "rain"
    if (condition.includes("cloud")) return "cloudy"
    if (condition.includes("thunder") || condition.includes("storm")) return "storm"
    return "clear"
  }

  const weatherCondition = getWeatherCondition()
  const uvRisk = getUVRiskLevel(weatherData.uvi)

  return (
    <Card
      className="h-full overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex justify-between items-center">
          <span>{district}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setIsCelsius(!isCelsius)
              }}
              className="h-8 px-2"
            >
              <Thermometer className="h-4 w-4 mr-1" />
              {isCelsius ? "°C" : "°F"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onFavoriteToggle()
              }}
              className="h-8 px-2"
            >
              <Star className={`h-4 w-4 ${isFavorite ? "text-yellow-400 fill-yellow-400" : ""}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4 relative">
          {/* Weather animation container */}
          <div className="w-24 h-24 relative mb-2">
            {weatherCondition === "rain" && (
              <div className="weather-animation rain">
                <CloudRain className="h-16 w-16 text-blue-400" />
                <div className="raindrops">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="raindrop bg-blue-400"
                      style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${0.5 + Math.random()}s`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}
            {weatherCondition === "cloudy" && (
              <div className="weather-animation cloudy">
                <Cloud className="h-16 w-16 text-gray-400 animate-cloud" />
              </div>
            )}
            {weatherCondition === "clear" && (
              <div className="weather-animation clear">
                <Sun className="h-16 w-16 text-yellow-400 animate-sun" />
              </div>
            )}
            {weatherCondition === "storm" && (
              <div className="weather-animation storm">
                <CloudLightning className="h-16 w-16 text-purple-400" />
                <div className="lightning"></div>
              </div>
            )}
          </div>

          <h2 className="text-4xl font-bold">
            {displayTemp}
            {tempUnit}
          </h2>
          <p className="text-muted-foreground capitalize">{weatherData.weather[0]?.description || "Unknown"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Droplets className="h-4 w-4 mr-2 text-blue-500" />
            <span>Humidity: {weatherData.main.humidity}%</span>
          </div>

          <div className="flex items-center">
            <Wind className="h-4 w-4 mr-2 text-cyan-500" />
            <span>
              {(weatherData.wind.speed * 3.6).toFixed(1)} km/h {getWindDirection(weatherData.wind.deg)}
            </span>
          </div>

          <div className="flex items-center">
            <Sunrise className="h-4 w-4 mr-2 text-orange-400" />
            <span>{formatTime(weatherData.sys.sunrise)}</span>
          </div>

          <div className="flex items-center">
            <Sunset className="h-4 w-4 mr-2 text-red-400" />
            <span>{formatTime(weatherData.sys.sunset)}</span>
          </div>

          {/* <div className="flex items-center col-span-2">
            <span className="mr-2">UV Index:</span>
            <Badge className={uvRisk.color}>
              {weatherData.uvi || "N/A"} ({uvRisk.level})
            </Badge>
          </div>

          <div className="flex items-center col-span-2">
            <span className="mr-2">Precipitation:</span>
            <span>{getPrecipitation()}</span>
          </div> */}

          {weatherData.air_quality_index && (
            <div className="flex items-center col-span-2">
              <span className="mr-2">Air Quality:</span>
              <span>{weatherData.air_quality_index}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

