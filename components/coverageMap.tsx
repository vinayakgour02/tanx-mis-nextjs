"use client";

import { MapContainer, GeoJSON, Marker, useMap } from "react-leaflet";
import L, { LatLngBoundsExpression, Layer } from "leaflet";
import { Feature, Geometry } from "geojson";
import { useState, useEffect } from "react";

// Fit bounds helper
function FitBounds({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    if (data) {
      const geojsonLayer = L.geoJSON(data);
      map.fitBounds(geojsonLayer.getBounds() as LatLngBoundsExpression);
    }
  }, [data, map]);
  return null;
}

export default function CoverageMap() {
  const [statesData, setStatesData] = useState<any>(null);
  const [districtsData, setDistrictsData] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [labels, setLabels] = useState<{ lat: number; lng: number; name: string; count?: number }[]>([]);
  const [stateProjectCounts, setStateProjectCounts] = useState<Record<string, number>>({});
  const [districtProjectCounts, setDistrictProjectCounts] = useState<Record<string, number>>({});

  // Load states
  useEffect(() => {
    fetch("/states.geojson")
      .then((res) => res.json())
      .then((data) => setStatesData(data))
      .catch((error) => console.error("Error loading states data:", error));
  }, []);

  // Load districts
  useEffect(() => {
    fetch("/dists11.geojson")
      .then((res) => res.json())
      .then((data) => setDistrictsData(data))
      .catch((error) => console.error("Error loading districts data:", error));
  }, []);

  // Load project counts
  useEffect(() => {
    fetch("/api/intervention-areas/project-counts")
      .then((res) => res.json())
      .then((data) => {
        // Create maps for quick lookup
        const stateCounts: Record<string, number> = {};
        data.states.forEach((state: any) => {
          stateCounts[state.name] = state.projectCount;
        });
        setStateProjectCounts(stateCounts);

        const districtCounts: Record<string, number> = {};
        data.districts.forEach((district: any) => {
          districtCounts[district.name] = district.projectCount;
        });
        setDistrictProjectCounts(districtCounts);
      })
      .catch((error) => console.error("Error loading project counts:", error));
  }, []);

  // Style
  const stateStyle = (feature: Feature<Geometry, any> | undefined) => {
    const stateName = feature?.properties?.["ST_NM"];
    const projectCount = stateName ? stateProjectCounts[stateName] || 0 : 0;
    
    // Color intensity based on project count
    let fillColor = "#e5e7eb"; // Default gray
    if (projectCount > 0) {
      // Create a color scale from light blue to dark blue
      const intensity = Math.min(projectCount / 10, 1); // Cap at 10 projects for max intensity
      const blueValue = Math.floor(59 + (132 - 59) * intensity); // 59 (dark) to 132 (light)
      fillColor = `rgb(59, ${blueValue}, 246)`;
    }
    
    return {
      fillColor,
      weight: 1,
      color: "#9ca3af",
      fillOpacity: projectCount > 0 ? 0.7 : 0.3,
    };
  };

  const districtStyle = (feature: Feature<Geometry, any> | undefined) => {
    const districtName = feature?.properties?.["DISTRICT"];
    const projectCount = districtName ? districtProjectCounts[districtName] || 0 : 0;
    
    // Color intensity based on project count
    let fillColor = "#e5e7eb"; // Default gray
    if (projectCount > 0) {
      // Create a color scale from light yellow to dark orange
      const intensity = Math.min(projectCount / 5, 1); // Cap at 5 projects for max intensity
      const greenValue = Math.floor(191 - (191 - 120) * intensity); // 191 (light) to 120 (dark)
      const blueValue = Math.floor(34 + (246 - 34) * (1 - intensity)); // 34 (dark) to 246 (light)
      fillColor = `rgb(251, ${greenValue}, ${blueValue})`;
    }
    
    return {
      fillColor,
      weight: 0.5,
      color: "#9ca3af",
      fillOpacity: projectCount > 0 ? 0.6 : 0.3,
    };
  };

  // State handlers
  const onEachState = (feature: Feature<Geometry, any>, layer: Layer) => {
    const name = feature.properties?.["ST_NM"];
    const projectCount = name ? stateProjectCounts[name] || 0 : 0;

    if (projectCount > 0) {
      const center = (layer as any).getBounds().getCenter();
      setLabels((prev) => [...prev, { lat: center.lat, lng: center.lng, name, count: projectCount }]);
    }

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#3b82f6',
          fillOpacity: 0.9,
        });
        
        if (projectCount > 0) {
          const center = layer.getBounds().getCenter();
          // Show tooltip on hover
          layer.bindTooltip(`${name}: ${projectCount} project${projectCount !== 1 ? 's' : ''}`, {
            permanent: false,
            direction: 'center',
            className: 'bg-white px-2 py-1 rounded shadow-lg font-medium'
          }).openTooltip();
        }
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(stateStyle(feature)); // Reset to original style
        layer.closeTooltip();
      },
      click: () => {
        setSelectedState(name);
        setLabels([]); // clear when switching to districts
      },
    });
  };

  // District handlers
  const onEachDistrict = (feature: Feature<Geometry, any>, layer: Layer) => {
    const name = feature.properties?.["DISTRICT"];
    const projectCount = name ? districtProjectCounts[name] || 0 : 0;

    if (projectCount > 0) {
      const center = (layer as any).getBounds().getCenter();
      setLabels((prev) => [...prev, { lat: center.lat, lng: center.lng, name, count: projectCount }]);
    }

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#f59e0b',
          fillOpacity: 0.8,
        });
        
        if (projectCount > 0) {
          // Show tooltip on hover
          layer.bindTooltip(`${name}: ${projectCount} project${projectCount !== 1 ? 's' : ''}`, {
            permanent: false,
            direction: 'center',
            className: 'bg-white px-2 py-1 rounded shadow-lg font-medium'
          }).openTooltip();
        }
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle(districtStyle(feature)); // Reset to original style
        layer.closeTooltip();
      },
      click: () => {
        // You can add more detailed information here
        console.log(`Clicked on district: ${name}`);
      },
    });
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-gray-200">
      {selectedState && (
        <button
          onClick={() => {
            setSelectedState(null);
            setLabels([]); // clear when going back to states
          }}
          className="absolute top-4 left-4 z-[1000] bg-white border border-gray-300 rounded-lg py-2 px-4 cursor-pointer shadow-md hover:bg-gray-50 transition-colors font-medium text-gray-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to India
        </button>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-2">Project Coverage</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">States</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Districts</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[22, 80]}
        zoom={5}
        minZoom={4}
        maxZoom={12}
        style={{ height: "100%", width: "100%", background: "#f0f9ff" }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* Fit map */}
        {statesData && !selectedState && <FitBounds data={statesData} />}
        {districtsData && selectedState && (
          <FitBounds
            data={{
              ...districtsData,
              features: districtsData.features.filter(
                (f: any) => f.properties["ST_NM"] === selectedState
              ),
            }}
          />
        )}

        {/* States */}
        {statesData && !selectedState && (
          <GeoJSON
            data={statesData as any}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* Districts */}
        {districtsData && selectedState && (
          <GeoJSON
            data={{
              ...districtsData,
              features: districtsData.features.filter(
                (f: any) => f.properties["ST_NM"] === selectedState
              ),
            }}
            style={districtStyle}
            onEachFeature={onEachDistrict}
          />
        )}

        {/* Labels */}
        {labels.map((l, idx) => (
          <Marker
            key={idx}
            position={[l.lat, l.lng]}
            icon={L.divIcon({
              className: "label",
              html: `<div class="bg-white bg-opacity-90 px-3 py-2 rounded-full shadow-lg font-bold text-gray-800 text-sm border-2 border-blue-500 flex flex-col items-center">
                <div>${l.name}</div>
                <div class="text-xs text-center mt-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-bold">
                  ${l.count} project${l.count !== 1 ? 's' : ''}
                </div>
              </div>`,
            })}
          />
        ))}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
          background: #f0f9ff;
        }
        .label {
          background: transparent;
          border: none;
          text-align: center;
          white-space: nowrap;
        }
        .leaflet-tooltip {
          background: white;
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 0.5rem;
          padding: 0.5rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}