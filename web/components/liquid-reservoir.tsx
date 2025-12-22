"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LiquidReservoirProps {
  value?: number
  maxValue?: number
  className?: string
}

export function LiquidReservoir({
  value = 75,
  maxValue = 100,
  className,
}: LiquidReservoirProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100)
  
  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* Glass Container - Tube shape */}
      <div className="relative w-full h-full rounded-t-full rounded-b-full overflow-hidden border-2 border-white/20 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm shadow-2xl">
        {/* Light reflection on glass */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none z-10" />
        
        {/* Gold Liquid */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
          style={{
            height: `${percentage}%`,
          }}
        >
          {/* Base gold gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-600 via-yellow-400 to-yellow-300" />
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/80 via-yellow-400/60 to-yellow-300/40 blur-sm" />
          
          {/* Inner shine */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-200/30 to-yellow-100/50" />
          
          {/* Surface ripple effect */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-yellow-200/60 via-yellow-300/40 to-transparent">
            <SurfaceRipple />
          </div>
          
          {/* Shimmer animation */}
          <ShimmerEffect />
          
          {/* Light refraction lines */}
          <RefractionLines />
        </div>
        
        {/* Surface reflection */}
        <div
          className="absolute left-0 right-0 bg-gradient-to-b from-white/50 via-white/30 to-transparent pointer-events-none z-5 transition-all duration-1000 rounded-full"
          style={{
            top: `${100 - percentage}%`,
            height: "10px",
          }}
        />
      </div>
      
      {/* Optional: Value display */}
      {value !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <span className="text-amber-200/90 font-bold text-xl drop-shadow-lg">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Surface Ripple Component
function SurfaceRipple() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute w-full h-full opacity-30"
          style={{
            animation: `ripple ${2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent blur-[2px]" />
        </div>
      ))}
    </div>
  )
}

// Shimmer Effect Component
function ShimmerEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(
            105deg,
            transparent 40%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 60%
          )`,
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />
    </div>
  )
}

// Refraction Lines Component
function RefractionLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 bg-gradient-to-b from-white/40 via-white/20 to-transparent opacity-20"
          style={{
            left: `${20 + i * 15}%`,
            height: "100%",
            animation: `refract ${4 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
            transform: `rotate(${5 - i * 2}deg)`,
          }}
        />
      ))}
    </div>
  )
}

