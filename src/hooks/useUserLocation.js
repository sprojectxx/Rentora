import { useState, useEffect } from "react";

export function useUserLocation() {
    const [coords, setCoords] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            setLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
        const watchId = navigator.geolocation.watchPosition(
            (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => { },
            { enableHighAccuracy: true, maximumAge: 30000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return { coords, error, loading };
}

export function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
    if (km < 1) return `${(km * 1000).toFixed(0)} m away`;
    return `${km.toFixed(1)} km away`;
}