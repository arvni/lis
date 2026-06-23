import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import { getGoogleMapsLink } from './constants';

// Shared start/end journey location card.
const LocationCard = ({ title, location }) => (
    <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle2" color="primary" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Lat: {location.latitude}, Lng: {location.longitude}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Accuracy: {parseFloat(location.accuracy).toFixed(2)}m
                </Typography>
                <br />
                <Typography variant="caption" color="text.secondary">
                    {new Date(location.timestamp).toLocaleString()}
                </Typography>
            </Box>
            <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<LocationOn />}
                href={getGoogleMapsLink(location.latitude, location.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
            >
                View on Google Maps
            </Button>
        </CardContent>
    </Card>
);

export default LocationCard;
