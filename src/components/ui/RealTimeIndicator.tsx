import React from 'react'
import { MdWifi, MdWifiOff } from 'react-icons/md'
import { HiRefresh } from 'react-icons/hi'

interface RealTimeIndicatorProps {
  isConnected: boolean
  lastUpdate?: Date
  className?: string
}

export default function RealTimeIndicator({ 
  isConnected, 
  lastUpdate, 
  className = '' 
}: RealTimeIndicatorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isConnected ? (
        <>
          <MdWifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">Temps réel</span>
        </>
      ) : (
        <>
          <MdWifiOff className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">Hors ligne</span>
        </>
      )}
      
      {lastUpdate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <HiRefresh className="h-3 w-3" />
          <span>MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}</span>
        </div>
      )}
    </div>
  )
}