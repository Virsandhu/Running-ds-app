import React, { useEffect } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { RunnableRoad } from '../../data/runnableRoads';

interface RunnableRoadsOverlayProps {
  roads: RunnableRoad[];
  selectedRoadId: string | null;
  onSelectRoad: (road: RunnableRoad) => void;
  showHighlight?: boolean;
}

export const RunnableRoadsOverlay: React.FC<RunnableRoadsOverlayProps> = ({
  roads,
  selectedRoadId,
  onSelectRoad,
  showHighlight = true,
}) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || !showHighlight || roads.length === 0) return;

    // Track created polylines to clean them up on unmount or updates
    const createdPolylines: google.maps.Polyline[] = [];

    roads.forEach((road) => {
      const isSelected = selectedRoadId === road.id;

      // 1. Soft greyish underlay/halo for crisp visibility against both satellite and vector tiles
      const underlayPolyline = new mapsLib.Polyline({
        path: road.path,
        strokeColor: isSelected ? '#FC5200' : '#E2E8F0',
        strokeOpacity: isSelected ? 0.4 : 0.45,
        strokeWeight: isSelected ? 8 : 6.5,
        map,
        clickable: false,
        zIndex: isSelected ? 15 : 5,
      });
      createdPolylines.push(underlayPolyline);

      // 2. Primary slight greyish highlight ribbon
      // Slate-400 / Slate-500 with 0.55 opacity for the requested "slight greyish highlight"
      const mainPolyline = new mapsLib.Polyline({
        path: road.path,
        strokeColor: isSelected ? '#FC5200' : '#64748B',
        strokeOpacity: isSelected ? 0.95 : 0.55,
        strokeWeight: isSelected ? 5.5 : 4.0,
        map,
        clickable: true,
        zIndex: isSelected ? 20 : 10,
      });

      const clickListener = mainPolyline.addListener('click', () => {
        onSelectRoad(road);
      });

      createdPolylines.push(mainPolyline);

      // Store listener cleanup
      (mainPolyline as unknown as { _listener?: google.maps.MapsEventListener })._listener = clickListener;
    });

    return () => {
      createdPolylines.forEach((pl) => {
        const listener = (pl as unknown as { _listener?: google.maps.MapsEventListener })._listener;
        if (listener) listener.remove();
        pl.setMap(null);
      });
    };
  }, [map, mapsLib, roads, selectedRoadId, showHighlight, onSelectRoad]);

  return null;
};
