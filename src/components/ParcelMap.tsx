import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const currentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

const milestoneIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
})

interface Coord { lat: number; lng: number }

interface Props {
  origin: string
  destination: string
  currentLocation?: string | null
  milestones?: { location: string; status?: string }[]
}

async function geocode(place: string): Promise<Coord | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`)
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {}
  return null
}

export function ParcelMap({ origin, destination, currentLocation, milestones }: Props) {
  const [originCoord, setOriginCoord] = useState<Coord | null>(null)
  const [destCoord, setDestCoord] = useState<Coord | null>(null)
  const [currentCoord, setCurrentCoord] = useState<Coord | null>(null)
  const [milestoneCoords, setMilestoneCoords] = useState<{ coord: Coord; label: string }[]>([])
  const [loaded, setLoaded] = useState(false)

  const milestoneLocations = useMemo(() => (milestones || []).map(m => m.location).join(','), [milestones])
  
  useEffect(() => {
    setLoaded(false)
    Promise.all([
      geocode(origin),
      geocode(destination),
      currentLocation ? geocode(currentLocation) : Promise.resolve(null),
      ...(milestones || []).map(m => geocode(m.location)),
    ]).then(results => {
      setOriginCoord(results[0])
      setDestCoord(results[1])
      setCurrentCoord(results[2] as Coord | null)
      const ms = []
      for (let i = 3; i < results.length; i++) {
        if (results[i] && milestones?.[i - 3]) {
          ms.push({ coord: results[i] as Coord, label: milestones[i - 3].location })
        }
      }
      setMilestoneCoords(ms)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [origin, destination, currentLocation, milestoneLocations])

  const points = [originCoord, currentCoord, destCoord].filter(Boolean) as Coord[]
  const bounds = points.length > 1 ? L.latLngBounds(points.map(p => [p.lat, p.lng])) : undefined
  const center = originCoord || destCoord || { lat: 40.7128, lng: -74.006 }

  if (!loaded) return <div className="map-loading"><div className="spinner" /></div>

  return (
    <div className="parcel-map-container">
      <MapContainer key={`${origin}-${destination}-${currentLocation}`} center={[center.lat, center.lng]} zoom={bounds ? undefined : 4} bounds={bounds} boundsOptions={{ padding: [50, 50] }} className="parcel-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {originCoord && (
          <Marker position={[originCoord.lat, originCoord.lng]} icon={originIcon}>
            <Popup>Origin: {origin}</Popup>
          </Marker>
        )}
        {destCoord && (
          <Marker position={[destCoord.lat, destCoord.lng]} icon={destIcon}>
            <Popup>Destination: {destination}</Popup>
          </Marker>
        )}
        {currentCoord && (
          <Marker position={[currentCoord.lat, currentCoord.lng]} icon={currentIcon}>
            <Popup>Current: {currentLocation}</Popup>
          </Marker>
        )}
        {milestoneCoords.map((m, i) => (
          <Marker key={i} position={[m.coord.lat, m.coord.lng]} icon={milestoneIcon}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
        {points.length >= 2 && <Polyline positions={points.map(p => [p.lat, p.lng])} color="#1B3A5C" weight={3} dashArray="8 6" />}
      </MapContainer>
    </div>
  )
}
