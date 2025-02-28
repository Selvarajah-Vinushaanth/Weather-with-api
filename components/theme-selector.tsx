"use client"

import { useState } from "react"
import { Palette } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Theme definitions
const THEMES = [
  {
    name: "Default",
    colors: {
      primary: "hsl(222.2 47.4% 11.2%)",
      background: "hsl(0 0% 100%)",
      muted: "hsl(210 40% 96.1%)",
      accent: "hsl(210 40% 96.1%)",
    },
  },
  {
    name: "Ocean Blue",
    colors: {
      primary: "hsl(201 100% 36%)",
      background: "hsl(204 100% 97%)",
      muted: "hsl(204 100% 94%)",
      accent: "hsl(201 100% 92%)",
    },
  },
  {
    name: "Sunset Orange",
    colors: {
      primary: "hsl(20 100% 50%)",
      background: "hsl(48 100% 97%)",
      muted: "hsl(48 100% 94%)",
      accent: "hsl(20 100% 92%)",
    },
  },
  {
    name: "Forest Green",
    colors: {
      primary: "hsl(142 76% 36%)",
      background: "hsl(120 100% 97%)",
      muted: "hsl(120 100% 94%)",
      accent: "hsl(142 76% 92%)",
    },
  },
  {
    name: "Purple Twilight",
    colors: {
      primary: "hsl(262 83% 58%)",
      background: "hsl(260 100% 97%)",
      muted: "hsl(260 100% 94%)",
      accent: "hsl(262 83% 92%)",
    },
  },
  {
    name: "Classic Grayscale",
    colors: {
      primary: "hsl(0 0% 20%)",
      background: "hsl(0 0% 100%)",
      muted: "hsl(0 0% 96%)",
      accent: "hsl(0 0% 92%)",
    },
  },
]

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState("Default")

  const applyTheme = (theme: (typeof THEMES)[0]) => {
    // Apply theme colors to CSS variables
    const root = document.documentElement

    root.style.setProperty("--primary", theme.colors.primary)
    root.style.setProperty("--background", theme.colors.background)
    root.style.setProperty("--muted", theme.colors.muted)
    root.style.setProperty("--accent", theme.colors.accent)

    setCurrentTheme(theme.name)
  }

  const handleCustomTheme = () => {
    // Create a color input element
    const input = document.createElement("input")
    input.type = "color"
    input.value = "#3b82f6" // Default blue

    // When the color is selected
    input.addEventListener("change", (e) => {
      const color = (e.target as HTMLInputElement).value
      const hsl = hexToHSL(color)

      // Create a custom theme based on the selected color
      const customTheme = {
        name: "Custom",
        colors: {
          primary: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`,
          background: `hsl(${hsl.h} ${hsl.s}% 97%)`,
          muted: `hsl(${hsl.h} ${hsl.s}% 94%)`,
          accent: `hsl(${hsl.h} ${hsl.s}% 92%)`,
        },
      }

      applyTheme(customTheme)
    })

    input.click()
  }

  // Helper function to convert hex to HSL
  const hexToHSL = (hex: string) => {
    // Remove the # if present
    hex = hex.replace(/^#/, "")

    // Parse the hex values
    const r = Number.parseInt(hex.substring(0, 2), 16) / 255
    const g = Number.parseInt(hex.substring(2, 4), 16) / 255
    const b = Number.parseInt(hex.substring(4, 6), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }

      h *= 60
    }

    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Select theme">
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((theme) => (
          <DropdownMenuItem key={theme.name} onClick={() => applyTheme(theme)} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
            <span>{theme.name}</span>
            {currentTheme === theme.name && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={handleCustomTheme}>
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mr-2" />
          Custom Color
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

