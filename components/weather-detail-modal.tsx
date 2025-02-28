import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Droplets, Wind, Sunrise, Sunset, CloudRain, Cloud, Sun, CloudLightning } from "lucide-react"

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
    country: string
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

interface ForecastData {
  dt: number
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  weather: {
    main: string
    description: string
    icon: string
  }[]
  wind: {
    speed: number
    deg: number
  }
}

interface WeatherDetailModalProps {
  isOpen: boolean
  onClose: () => void
  location: string
  weatherData: WeatherData | null
  forecastData: ForecastData[] | null
}

export function WeatherDetailModal({ isOpen, onClose, location, weatherData, forecastData }: WeatherDetailModalProps) {
  if (!weatherData) return null

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })
  }

  const getWindDirection = (degrees: number) => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  const getUVRiskLevel = (uvi: number | undefined) => {
    if (!uvi) return { level: "Unknown", color: "bg-gray-400" }
    if (uvi < 3) return { level: "Low", color: "bg-green-400" }
    if (uvi < 6) return { level: "Moderate", color: "bg-yellow-400" }
    if (uvi < 8) return { level: "High", color: "bg-orange-400" }
    if (uvi < 11) return { level: "Very High", color: "bg-red-400" }
    return { level: "Extreme", color: "bg-purple-400" }
  }

  const getPrecipitation = () => {
    if (weatherData.rain && weatherData.rain["1h"]) {
      return `${weatherData.rain["1h"]} mm`
    }
    return "N/A"
  }

  const getWeatherIcon = (condition: string) => {
    if (condition.includes("rain") || condition.includes("drizzle"))
      return <CloudRain className="h-8 w-8 text-blue-400" />
    if (condition.includes("cloud")) return <Cloud className="h-8 w-8 text-gray-400" />
    if (condition.includes("thunder") || condition.includes("storm"))
      return <CloudLightning className="h-8 w-8 text-purple-400" />
    return <Sun className="h-8 w-8 text-yellow-400" />
  }

  const uvRisk = getUVRiskLevel(weatherData.uvi)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {weatherData.name}, {weatherData.sys.country} Weather
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Weather</TabsTrigger>
            <TabsTrigger value="forecast">5-Day Forecast</TabsTrigger>
          </TabsList>
          <TabsContent value="current">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getWeatherIcon(weatherData.weather[0]?.main)}
                  <div>
                    <h3 className="text-4xl font-bold">{weatherData.main.temp.toFixed(1)}°C</h3>
                    <p className="text-muted-foreground capitalize">{weatherData.weather[0]?.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Feels like</p>
                  <p className="text-2xl font-semibold">{weatherData.main.feels_like.toFixed(1)}°C</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="flex items-center p-4">
                    <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Humidity</p>
                      <p className="text-2xl font-bold">{weatherData.main.humidity}%</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-4">
                    <Wind className="h-5 w-5 mr-2 text-cyan-500" />
                    <div>
                      <p className="text-sm font-medium">Wind</p>
                      <p className="text-2xl font-bold">
                        {(weatherData.wind.speed * 3.6).toFixed(1)} km/h {getWindDirection(weatherData.wind.deg)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-4">
                    <Sunrise className="h-5 w-5 mr-2 text-orange-400" />
                    <div>
                      <p className="text-sm font-medium">Sunrise</p>
                      <p className="text-2xl font-bold">{formatTime(weatherData.sys.sunrise)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center p-4">
                    <Sunset className="h-5 w-5 mr-2 text-red-400" />
                    <div>
                      <p className="text-sm font-medium">Sunset</p>
                      <p className="text-2xl font-bold">{formatTime(weatherData.sys.sunset)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* <div>
                  <p className="text-sm font-medium mb-1">UV Index</p>
                  <Badge className={`${uvRisk.color} text-white`}>
                    {weatherData.uvi || "N/A"} ({uvRisk.level})
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Precipitation (1h)</p>
                  <p className="text-lg font-semibold">{getPrecipitation()}</p>
                </div> */}
                <div>
                  <p className="text-sm font-medium mb-1">Pressure</p>
                  <p className="text-lg font-semibold">{weatherData.main.pressure} hPa</p>
                </div>
                {weatherData.air_quality_index && (
                  <div>
                    <p className="text-sm font-medium mb-1">Air Quality Index</p>
                    <p className="text-lg font-semibold">{weatherData.air_quality_index}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="forecast">
  {forecastData ? (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 max-h-[500px] overflow-y-auto">
      {forecastData.map((day, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">{formatDate(day.dt)}</h4>
            <div className="flex items-center justify-between mb-2">
              {getWeatherIcon(day.weather[0].main)}
              <span className="text-2xl font-bold">{day.main.temp.toFixed(1)}°C</span>
            </div>
            <p className="text-sm text-muted-foreground capitalize mb-2">{day.weather[0].description}</p>
            <div className="text-sm">
              <p>Humidity: {day.main.humidity}%</p>
              <p>Wind: {(day.wind.speed * 3.6).toFixed(1)} km/h</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ) : (
    <p>Forecast data not available</p>
  )}
</TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

