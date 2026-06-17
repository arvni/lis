import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    APIProvider,
    Map,
    AdvancedMarker,
    useMapsLibrary,
    useMap,
} from '@vis.gl/react-google-maps';
import { Box, Paper, Typography, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PropTypes from 'prop-types';

const DEFAULT_CENTER = { lat: 23.588, lng: 58.3829 }; // Muscat, Oman

const PlaceSearch = ({ onPlaceSelect }) => {
    const places = useMapsLibrary('places');
    const inputRef = useRef(null);

    useEffect(() => {
        if (!places || !inputRef.current) return;
        const autocomplete = new places.Autocomplete(inputRef.current);
        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place?.geometry?.location) onPlaceSelect(place);
        });
        return () => window.google.maps.event.removeListener(listener);
    }, [places, onPlaceSelect]);

    return (
        <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Search for a place…"
            sx={{ mb: 1.5 }}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
};

const MapContent = ({ latitude, longitude, onLocationChange, editable, height, initialZoom }) => {
    const map = useMap();
    const hasCoords = latitude && longitude;

    const [markerPos, setMarkerPos] = useState(
        hasCoords ? { lat: Number(latitude), lng: Number(longitude) } : null,
    );

    // Sync marker + pan when lat/lng props change (e.g. manual text input)
    useEffect(() => {
        if (!latitude || !longitude) return;
        const pos = { lat: Number(latitude), lng: Number(longitude) };
        setMarkerPos(pos);
        map?.panTo(pos);
    }, [latitude, longitude, map]);

    const handleMapClick = useCallback(
        (e) => {
            if (!editable) return;
            const { lat, lng } = e.detail.latLng;
            setMarkerPos({ lat, lng });
            onLocationChange?.({ latitude: lat, longitude: lng });
        },
        [editable, onLocationChange],
    );

    const handleMarkerDragEnd = useCallback(
        (e) => {
            if (!editable || !e.latLng) return;
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPos({ lat, lng });
            onLocationChange?.({ latitude: lat, longitude: lng });
        },
        [editable, onLocationChange],
    );

    const handlePlaceSelect = useCallback(
        (place) => {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const pos = { lat, lng };
            setMarkerPos(pos);
            map?.panTo(pos);
            map?.setZoom(15);
            onLocationChange?.({ latitude: lat, longitude: lng });
        },
        [map, onLocationChange],
    );

    return (
        <>
            {editable && <PlaceSearch onPlaceSelect={handlePlaceSelect} />}
            {editable && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Search for a place, click on the map, or drag the marker to set the location
                </Typography>
            )}
            <Box sx={{ height: `${height}px`, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
                <Map
                    defaultCenter={
                        hasCoords
                            ? { lat: Number(latitude), lng: Number(longitude) }
                            : DEFAULT_CENTER
                    }
                    defaultZoom={initialZoom}
                    mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
                    onClick={handleMapClick}
                    clickableIcons={false}
                    style={{ width: '100%', height: '100%' }}
                >
                    {markerPos && (
                        <AdvancedMarker
                            position={markerPos}
                            draggable={editable}
                            onDragEnd={handleMarkerDragEnd}
                        />
                    )}
                </Map>
            </Box>
            {markerPos && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                >
                    Location: {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
                </Typography>
            )}
        </>
    );
};

const LogisticsMap = ({
    latitude,
    longitude,
    onLocationChange,
    editable = false,
    height = 400,
    zoom: initialZoom = 13,
}) => {
    return (
        <Paper elevation={2} sx={{ p: 2 }}>
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <MapContent
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={onLocationChange}
                    editable={editable}
                    height={height}
                    initialZoom={initialZoom}
                />
            </APIProvider>
        </Paper>
    );
};

LogisticsMap.propTypes = {
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    onLocationChange: PropTypes.func,
    editable: PropTypes.bool,
    height: PropTypes.number,
    zoom: PropTypes.number,
};

export default LogisticsMap;
