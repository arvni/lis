import { Box, Button, Card, CardContent, CardHeader, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SensorChart from './SensorChart';

const ReadingsCard = ({ samples, hasHumidity, period, tz, exportUrl }) => (
    <Card elevation={0} variant="outlined">
        <CardHeader
            title="Readings"
            subheader={
                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Chip
                        icon={<ThermostatIcon fontSize="small" />}
                        label="Temperature"
                        size="small"
                        color="error"
                        variant="outlined"
                    />
                    {hasHumidity && (
                        <Chip
                            icon={<WaterDropIcon fontSize="small" />}
                            label="Humidity"
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                    <Chip label={`${samples.length} readings`} size="small" variant="outlined" />
                </Box>
            }
            action={
                <Box sx={{ pt: 1, pr: 1 }}>
                    <Button
                        component="a"
                        href={exportUrl}
                        startIcon={<DownloadIcon />}
                        variant="outlined"
                        size="small"
                    >
                        Download Excel
                    </Button>
                </Box>
            }
        />
        <CardContent>
            <SensorChart samples={samples} hasHumidity={hasHumidity} period={period} tz={tz} />
        </CardContent>
    </Card>
);

export default ReadingsCard;
