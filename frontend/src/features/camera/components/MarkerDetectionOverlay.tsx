import React from 'react';
import type { DetectedMarker } from '../types';

interface MarkerDetectionOverlayProps {
  markers: DetectedMarker[];
  videoWidth: number;
  videoHeight: number;
  className?: string;
}

export const MarkerDetectionOverlay: React.FC<MarkerDetectionOverlayProps> = ({
  markers,
  videoWidth,
  videoHeight,
  className = '',
}) => {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: videoWidth, height: videoHeight }}
    >
      {markers.map((marker, index) => (
        <div key={`${marker.id}-${marker.timestamp}-${index}`}>
          {/* マーカーID表示 */}
          <div
            className="absolute bg-green-500 text-white px-2 py-1 rounded text-sm font-bold shadow-lg"
            style={{
              left: `${(marker.position.x + videoWidth / 2)}px`,
              top: `${(marker.position.y + videoHeight / 2)}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            ID: {marker.id}
          </div>
          
          {/* 検出信頼度バー */}
          <div
            className="absolute bg-black bg-opacity-50 rounded p-1"
            style={{
              left: `${(marker.position.x + videoWidth / 2)}px`,
              top: `${(marker.position.y + videoHeight / 2) + 25}px`,
              transform: 'translate(-50%, 0)',
            }}
          >
            <div className="text-white text-xs mb-1">
              信頼度: {(marker.confidence * 100).toFixed(1)}%
            </div>
            <div className="w-16 h-2 bg-gray-300 rounded">
              <div
                className="h-full bg-green-400 rounded"
                style={{ width: `${marker.confidence * 100}%` }}
              />
            </div>
          </div>

          {/* マーカーの境界を示す円 */}
          <div
            className="absolute border-2 border-green-400 rounded-full animate-pulse"
            style={{
              left: `${(marker.position.x + videoWidth / 2)}px`,
              top: `${(marker.position.y + videoHeight / 2)}px`,
              width: '60px',
              height: '60px',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      ))}
      
      {/* 検出状況サマリー */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded text-sm">
        <div>検出中: {markers.length}個</div>
        {markers.map(marker => (
          <div key={marker.id} className="text-xs">
            ID{marker.id}: {(marker.confidence * 100).toFixed(0)}%
          </div>
        ))}
      </div>
    </div>
  );
};
