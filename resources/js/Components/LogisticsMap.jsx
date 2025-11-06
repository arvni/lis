import React, { useState, useEffect } from "react";
import { Map, Marker } from "pigeon-maps";
import { Box, Paper, Typography } from "@mui/material";

/**
 * Reusable logistics map component for displaying and selecting location
 * @param {Object} props
 * @param {number} props.latitude - Latitude coordinate
 * @param {number} props.longitude - Longitude coordinate
 * @param {Function} props.onLocationChange - Callback when location is changed (only for editable mode)
 * @param {boolean} props.editable - Whether the map is editable (clickable to change location)
 * @param {number} props.height - Map height in pixels (default: 400)
 * @param {number} props.zoom - Map zoom level (default: 13)
 */
const LogisticsMap = ({
    latitude,
    longitude,
    onLocationChange,
    editable = false,
    height = 400,
    zoom: initialZoom = 13
}) => {
    // Default to a generic location if no coordinates provided
    const defaultLat = 35.6892; // Tokyo
    const defaultLng = 51.3890; // Tehran

    const [center, setCenter] = useState([
        latitude || defaultLat,
        longitude || defaultLng
    ]);
    const [marker, setMarker] = useState(
        latitude && longitude ? [latitude, longitude] : null
    );
    const [zoom, setZoom] = useState(initialZoom);

    // Update center and marker when props change
    useEffect(() => {
        if (latitude && longitude) {
            setCenter([latitude, longitude]);
            setMarker([latitude, longitude]);
        }
    }, [latitude, longitude]);

    // Handle map click (only in editable mode)
    const handleMapClick = ({ latLng }) => {
        if (!editable) return;

        const [lat, lng] = latLng;
        setMarker([lat, lng]);
        setCenter([lat, lng]);

        if (onLocationChange) {
            onLocationChange({ latitude: lat, longitude: lng });
        }
    };

    // Handle marker drag (only in editable mode)
    const handleMarkerDrag = (latLng) => {
        if (!editable) return;

        const [lat, lng] = latLng;
        setMarker([lat, lng]);

        if (onLocationChange) {
            onLocationChange({ latitude: lat, longitude: lng });
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 2 }}>
            {editable && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Click on the map to set location, or drag the marker
                </Typography>
            )}
            <Box sx={{ height: `${height}px`, width: "100%", borderRadius: 1, overflow: "hidden" }}>
                <Map
                    center={center}
                    zoom={zoom}
                    onBoundsChanged={({ center: newCenter, zoom: newZoom }) => {
                        setCenter(newCenter);
                        setZoom(newZoom);
                    }}
                    onClick={handleMapClick}
                    height={height}
                >
                    {marker && (
                        <Marker
                            anchor={marker}
                            color="#1976d2"
                            onClick={editable ? undefined : null}
                            onDragEnd={editable ? handleMarkerDrag : undefined}
                        />
                    )}
                </Map>
            </Box>
            {marker && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Location: {marker[0].toFixed(6)}, {marker[1].toFixed(6)}
                </Typography>
            )}
        </Paper>
    );
};

export default LogisticsMap;
