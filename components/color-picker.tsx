"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Palette, Check, RotateCcw } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  disabled?: boolean
  className?: string
}

const PRESET_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8BBD9",
  "#A8E6CF",
  "#FFD3A5",
  "#C7CEEA",
  "#FFAAA5",
  "#50C878",
  "#FFA726",
  "#7986CB",
  "#E57373",
  "#81C784",
]

export function ColorPicker({ value, onChange, label = "Color", disabled = false, className }: ColorPickerProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [tempColor, setTempColor] = useState(value)
  const [hexInput, setHexInput] = useState(value)
  const colorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempColor(value)
    setHexInput(value)
  }, [value])

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor)
    setHexInput(newColor)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setHexInput(inputValue)

    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(inputValue)) {
      setTempColor(inputValue)
    }
  }

  const handleApply = () => {
    onChange(tempColor)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempColor(value)
    setHexInput(value)
    setIsOpen(false)
  }

  const handlePresetColorClick = (color: string) => {
    setTempColor(color)
    setHexInput(color)
  }

  const generateRandomColor = () => {
    const randomColor = `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`
    handleColorChange(randomColor)
  }

  const resetToDefault = () => {
    const defaultColor = "#FF6B6B"
    handleColorChange(defaultColor)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">{label}</Label>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-border" style={{ backgroundColor: value }} />
              <span>{value.toUpperCase()}</span>
              <Palette className="ml-auto h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={cn("w-80 p-0", theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200")}
          align="start"
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selector de Color</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateRandomColor}
                  className="h-8 w-8 p-0"
                  title="Color aleatorio"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Color Preview */}
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-lg border-2 shadow-sm transition-colors"
                style={{
                  backgroundColor: tempColor,
                  borderColor: theme === "dark" ? "#374151" : "#d1d5db",
                }}
              />
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor="hex-input" className="text-xs text-muted-foreground">
                    Código Hex
                  </Label>
                  <Input
                    id="hex-input"
                    value={hexInput}
                    onChange={handleHexInputChange}
                    placeholder="#FF6B6B"
                    className="h-8 text-sm font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Native Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Selector del Sistema</Label>
              <div className="relative">
                <input
                  ref={colorInputRef}
                  type="color"
                  value={tempColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className={cn(
                    "w-full h-10 rounded-md border-2 cursor-pointer",
                    "transition-all duration-200 hover:scale-105",
                    theme === "dark" ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white",
                  )}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                  }}
                />
              </div>
            </div>

            {/* Preset Colors */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Colores Predefinidos</Label>
              <div className="grid grid-cols-10 gap-1">
                {PRESET_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetColorClick(color)}
                    className={cn(
                      "w-6 h-6 rounded border-2 transition-all duration-200",
                      "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1",
                      tempColor === color
                        ? "ring-2 ring-primary ring-offset-1 scale-110"
                        : theme === "dark"
                          ? "border-gray-600 hover:border-gray-400"
                          : "border-gray-300 hover:border-gray-500",
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {tempColor === color && <Check className="w-3 h-3 text-white drop-shadow-sm mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 bg-transparent">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleApply} className="h-8">
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
