import { Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';
import LocationCard from './LocationCard';
import TemperatureCard from './TemperatureCard';

const JourneyTimeCard = ({ title, value }) => (
    <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle2" color="primary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h6">{value ? new Date(value).toLocaleString() : 'N/A'}</Typography>
        </CardContent>
    </Card>
);

const LogisticsSection = ({ logistics, temperatureData, temperatureStats }) => {
    if (!logistics) {
        return (
            <Grid size={{ xs: 12 }}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontStyle: 'italic', textAlign: 'center' }}
                        >
                            No logistics information available
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        );
    }

    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <JourneyTimeCard title="Journey Started" value={logistics.started_at} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
                <JourneyTimeCard title="Journey Ended" value={logistics.ended_at} />
            </Grid>

            {logistics.starting_location && (
                <Grid size={{ xs: 12, sm: 6 }}>
                    <LocationCard title="Starting Location" location={logistics.starting_location} />
                </Grid>
            )}

            {logistics.ending_location && (
                <Grid size={{ xs: 12, sm: 6 }}>
                    <LocationCard title="Ending Location" location={logistics.ending_location} />
                </Grid>
            )}

            {temperatureData.length > 0 && (
                <Grid size={{ xs: 12 }}>
                    <TemperatureCard
                        temperatureData={temperatureData}
                        temperatureStats={temperatureStats}
                    />
                </Grid>
            )}

            {logistics.barcodes && logistics.barcodes.length > 0 && (
                <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Barcodes Scanned
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                {logistics.barcodes.map((barcode, index) => (
                                    <Chip
                                        key={index}
                                        label={barcode}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </>
    );
};

export default LogisticsSection;
