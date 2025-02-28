"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, RefreshCw, Moon, Sun, Star, AlertTriangle } from 'lucide-react'
import { WeatherCard } from "./weather-card"
import { ThemeSelector } from "./theme-selector"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WeatherDetailModal } from "./weather-detail-modal"
import { toast } from "@/components/ui/use-toast"
import { preconnect } from "react-dom"

// API key would normally be stored in environment variables
const API_KEY = "8729e67faf4ce830210b5b3fb2f2c136" // Your OpenWeatherMap API key

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

const LOCAL_STORAGE_KEYS = {
  WEATHER_DATA: 'weatherData',
  FORECAST_DATA: 'forecastData',
  FAVORITES: 'favorites',
  SEARCHED_LOCATIONS: 'searchedLocations',
  WEATHER_ALERTS: 'weatherAlerts',
  USER_TOKEN: 'userToken',
}

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData | null>>({})
  const [forecastData, setForecastData] = useState<Record<string, ForecastData[] | null>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [weatherAlerts, setWeatherAlerts] = useState<Record<string, string>>({})
  const [searchedLocations, setSearchedLocations] = useState<string[]>([])
  const [userToken, setUserToken] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Initialize state from local storage
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDarkMode(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add("dark")
    }

    const storedUserToken = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_TOKEN)
    if (storedUserToken) {
      setUserToken(storedUserToken)
    } else {
      const newUserToken = `user_${Date.now()}`
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_TOKEN, newUserToken)
      setUserToken(newUserToken)
    }

    const storedWeatherData = localStorage.getItem(`${LOCAL_STORAGE_KEYS.WEATHER_DATA}_${storedUserToken}`)
    if (storedWeatherData) {
      setWeatherData(JSON.parse(storedWeatherData))
    }

    const storedForecastData = localStorage.getItem(`${LOCAL_STORAGE_KEYS.FORECAST_DATA}_${storedUserToken}`)
    if (storedForecastData) {
      setForecastData(JSON.parse(storedForecastData))
    }

    const storedFavorites = localStorage.getItem(`${LOCAL_STORAGE_KEYS.FAVORITES}_${storedUserToken}`)
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }

    const storedSearchedLocations = localStorage.getItem(`${LOCAL_STORAGE_KEYS.SEARCHED_LOCATIONS}_${storedUserToken}`)
    if (storedSearchedLocations) {
      setSearchedLocations(JSON.parse(storedSearchedLocations))
    }

    const storedWeatherAlerts = localStorage.getItem(`${LOCAL_STORAGE_KEYS.WEATHER_ALERTS}_${storedUserToken}`)
    if (storedWeatherAlerts) {
      setWeatherAlerts(JSON.parse(storedWeatherAlerts))
    }

    // Fetch weather data for previously searched locations
    if (storedSearchedLocations) {
      JSON.parse(storedSearchedLocations).forEach((location: string) => {
        fetchWeatherData(location)
      })
    }

    // Prompt user to enable location services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          const location = await fetchCityFromCoords(latitude, longitude)
          setSearchQuery(location)
          fetchWeatherData(location)
        },
        (error) => {
          console.error("Error fetching location:", error)
          setError("Please enable location services to see weather data for your current location.")
        }
      )
    } else {
      setError("Geolocation is not supported by this browser.")
    }
  }, [])

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (userToken) {
      localStorage.setItem(`${LOCAL_STORAGE_KEYS.WEATHER_DATA}_${userToken}`, JSON.stringify(weatherData))
      localStorage.setItem(`${LOCAL_STORAGE_KEYS.FORECAST_DATA}_${userToken}`, JSON.stringify(forecastData))
      localStorage.setItem(`${LOCAL_STORAGE_KEYS.FAVORITES}_${userToken}`, JSON.stringify(favorites))
      localStorage.setItem(`${LOCAL_STORAGE_KEYS.SEARCHED_LOCATIONS}_${userToken}`, JSON.stringify(searchedLocations))
      localStorage.setItem(`${LOCAL_STORAGE_KEYS.WEATHER_ALERTS}_${userToken}`, JSON.stringify(weatherAlerts))
    }
  }, [weatherData, forecastData, favorites, searchedLocations, weatherAlerts, userToken])

  // Fetch city name from coordinates
  const fetchCityFromCoords = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
      const data = await response.json()
      return data.city || data.locality || data.principalSubdivision || "Unknown location"
    } catch (error) {
      console.error("Error fetching city name from coordinates:", error)
      return "Unknown location"
    }
  }

  // Fetch search suggestions
  const fetchSearchSuggestions = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`https://api.teleport.org/api/cities/?search=${query}`)
      const data = await response.json()
      const citySuggestions = data._embedded["city:search-results"].map((result: any) => result.matching_full_name)
      setSuggestions(citySuggestions)
    } catch (error) {
      console.error("Error fetching search suggestions:", error)
      setSuggestions([])
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Toggle favorite
  const toggleFavorite = (location: string) => {
    const newFavorites = favorites.includes(location)
      ? favorites.filter(fav => fav !== location)
      : [...favorites, location]
    setFavorites(newFavorites)
  }

  // Remove weather card
  const removeWeatherCard = (location: string) => {
    setWeatherData(prev => {
      const newWeatherData = { ...prev }
      delete newWeatherData[location]
      return newWeatherData
    })
    setForecastData(prev => {
      const newForecastData = { ...prev }
      delete newForecastData[location]
      return newForecastData
    })
    setSearchedLocations(prev => prev.filter(loc => loc !== location))
    setWeatherAlerts(prev => {
      const newWeatherAlerts = { ...prev }
      delete newWeatherAlerts[location]
      return newWeatherAlerts
    })
    setFavorites(prev => prev.filter(fav => fav !== location))
    setWeatherAlerts(prev => {
      const newWeatherAlerts = { ...prev }
      delete newWeatherAlerts[location]
      return newWeatherAlerts
    })
  }

  // Fetch weather data by coordinates
  const fetchWeatherDataByCoords = useCallback(async (latitude: number, longitude: number) => {
    setIsRefreshing(true)
    setError(null)

    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`

      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ])

      if (!weatherResponse.ok || !forecastResponse.ok) {
        throw new Error("Failed to fetch data for your location")
      }

      const weatherData = await weatherResponse.json()
      const forecastData = await forecastResponse.json()

      // Process 5-day forecast (data every 3 hours, so we take every 8th item)
      const processedForecast = forecastData.list.filter((_: any, index: number) => index % 8 === 0)

      setWeatherData(prev => ({ ...prev, "currentLocation": weatherData }))
      setForecastData(prev => ({ ...prev, "currentLocation": processedForecast }))
    } catch (err) {
      setError("Failed to fetch weather data for your location. Please try again.")
      console.error("Error fetching weather data:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Fetch weather data for a location
  const fetchWeatherData = useCallback(async (location: string) => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${API_KEY}`
      
      const [weatherResponse, forecastResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(forecastUrl)
      ])
      
      if (!weatherResponse.ok || !forecastResponse.ok) {
        throw new Error(`Failed to fetch data for ${location}`)
      }
      
      const weatherData = await weatherResponse.json()
      const forecastData = await forecastResponse.json()
      
      // Process 5-day forecast (data every 3 hours, so we take every 8th item)
      const processedForecast = forecastData.list.filter((_: any, index: number) => index % 8 === 0)
      
      setWeatherData(prev => ({ ...prev, [location]: weatherData }))
      setForecastData(prev => ({ ...prev, [location]: processedForecast }))
      
      // Check for extreme weather conditions
      const temp = weatherData.main.temp
      const windSpeed = weatherData.wind.speed
      if (temp > 35) {
        setWeatherAlerts(prev => ({ ...prev, [location]: "Extreme heat warning" }))
      } else if (temp < 10) {
        setWeatherAlerts(prev => ({ ...prev, [location]: "Cold temperature alert" }))
      } else if (windSpeed > 20) {
        setWeatherAlerts(prev => ({ ...prev, [location]: "High wind alert" }))
      } else {
        setWeatherAlerts(prev => {
          const newAlerts = { ...prev }
          delete newAlerts[location]
          return newAlerts
        })
      }
      
      // Add to searched locations if not already present
      if (!searchedLocations.includes(location)) {
        const newSearchedLocations = [location, ...searchedLocations].slice(0, 10) // Keep only the last 10 searches
        setSearchedLocations(newSearchedLocations)
      }
    } catch (err) {
      setError(`Failed to fetch weather data for ${location}. Please try again.`)
      console.error("Error fetching weather data:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [searchedLocations])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setLoading(true)
      fetchWeatherData(searchQuery.trim()).then(() => {
        setLoading(false)
      }).catch(() => {
        setLoading(false)
        setError(`Failed to fetch weather data for ${searchQuery.trim()}. Please try again.`)
      })
    }
  }

  // Handle search query change
  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    fetchSearchSuggestions(query)
  }

  // Refresh all data
  const refreshAllData = () => {
    setIsRefreshing(true)
    Promise.all([...searchedLocations, ...favorites].map(location => fetchWeatherData(location)))
      .then(() => setIsRefreshing(false))
  }

  // Filter locations based on search query and favorites
  const filteredLocations = [...new Set([...searchedLocations, ...favorites])].filter(
    location => location.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (favorites.includes(a) && !favorites.includes(b)) return -1
    if (!favorites.includes(a) && favorites.includes(b)) return 1
    return 0
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Global Weather Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {/* <ThemeSelector /> */}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search cities or countries..."
              className="pl-9"
              value={searchQuery}
              onChange={handleSearchQueryChange}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 rounded-md shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      setSearchQuery(suggestion)
                      setSuggestions([])
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button type="submit" disabled={isRefreshing || loading} className="w-full sm:w-auto">
            {loading ? "Searching..." : "Search"}
          </Button>
          <Button onClick={refreshAllData} disabled={isRefreshing} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
        </form>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {Object.keys(weatherAlerts).length > 0 && (
        <Alert variant="default" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Weather alerts: {Object.entries(weatherAlerts).map(([location, alert]) => (
              <span key={location} className="font-semibold">{location}: {alert}. </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-48" />
            <Skeleton className="w-full h-48" />
          </>
        ) : (
          filteredLocations.map(location => (
            <WeatherCard
              key={location}
              location={location}
              weatherData={weatherData[location]}
              forecastData={forecastData[location]}
              isFavorite={favorites.includes(location)}
              toggleFavorite={() => toggleFavorite(location)}
              weatherAlert={weatherAlerts[location]}
              onClick={() => setSelectedLocation(location)}
              removeCard={() => removeWeatherCard(location)}
              cardStyle="default" // Add the cardStyle property
            />
          ))
        )}
      </div>

      <WeatherDetailModal
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        location={selectedLocation || ""}
        weatherData={weatherData[selectedLocation || ""] || null}
        forecastData={forecastData[selectedLocation || ""] || null}
      />
    </div>
  )
}
