import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const STORES = [
  {
    id: 1,
    name: "Sahloul 4",
    address: "Ideal Prix Maxi Sahloul4",
    coordinates: { lat: 35.8354, lng: 10.6045 },
  },
  {
    id: 2,
    name: "Sahloul 1",
    address: "Idéal Prix",
    coordinates: { lat: 35.8381, lng: 10.5945 },
  },
  {
    id: 3,
    name: "Soukra",
    address: "IDEAL PRIX SOUKRA",
    coordinates: { lat: 36.8804, lng: 10.2612 },
  },
  {
    id: 4,
    name: "Bareket Sahel",
    address: "Ideal Prix Barraket Sahel",
    coordinates: { lat: 36.4066, lng: 10.5609 },
  },
  {
    id: 5,
    name: "Hay Riadh",
    address: "Idéal Prix Erriadh",
    coordinates: { lat: 35.8082, lng: 10.6089 },
  },
  {
    id: 6,
    name: "Souk Lahad",
    address: "Ideal Prix",
    coordinates: { lat: 35.8172, lng: 10.6309 },
  },
];

function MapController() {
  const map = useMap();
  const bounds = L.latLngBounds(STORES.map(s => [s.coordinates.lat, s.coordinates.lng]));
  map.fitBounds(bounds, { padding: [50, 50] });
  return null;
}

export default function StoresPage() {
  return (
    <main style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="bg-gray-50 min-h-screen">
        <div className="content-container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-[#717182] mb-6">
            <Link to="/" className="hover:text-[#D4302A] transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#1E1E1E] font-medium">Nos magasins</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[#1E1E1E] mb-2" style={{ fontFamily: "Poppins, sans-serif", fontSize: "2rem", fontWeight: 700 }}>
              Nos magasins
            </h1>
            <p className="text-[#717182]">Découvrez nos 6 points de vente</p>
          </div>

          {/* Map */}
          <div className="mb-8">
            <div className="bg-white border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm">
              <MapContainer
                center={[35.8, 10.6]}
                zoom={11}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapController />
                {STORES.map((store) => (
                  <Marker
                    key={store.id}
                    position={[store.coordinates.lat, store.coordinates.lng]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <strong>{store.name}</strong>
                        <br />
                        {store.address}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Store Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STORES.map((store) => (
              <div
                key={store.id}
                className="bg-white border border-[#E5E5E5] rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-[#1E1E1E] font-semibold text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {store.name}
                </h3>
                <p className="text-[#717182] text-sm mb-3">
                  {store.address}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block w-2 h-2 bg-[#D4302A] rounded-full"></span>
                  <span>
                    {store.coordinates.lat.toFixed(4)}°N, {store.coordinates.lng.toFixed(4)}°E
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}