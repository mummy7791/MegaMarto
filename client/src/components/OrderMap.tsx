import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

type Props = {
  lat: number;
  lng: number;
};

const containerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "12px",
};

function OrderMap({ lat, lng }: Props) {
  const center = { lat, lng };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
        {/* 📍 Delivery Location */}
        <Marker position={center} />

        {/* 🚚 Optional: Delivery Boy Marker */}
        <Marker
          position={{
            lat: lat + 0.002,
            lng: lng + 0.002,
          }}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          }}
        />
      </GoogleMap>
    </LoadScript>
  );
}

export default OrderMap;