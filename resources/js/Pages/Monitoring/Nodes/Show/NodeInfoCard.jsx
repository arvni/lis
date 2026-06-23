import { Box, Card, CardContent, CardHeader, Chip, Divider, Grid, Typography } from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import { Field } from './constants';

const NodeInfoCard = ({ node }) => (
    <Card elevation={0} variant="outlined" sx={{ mb: 2 }}>
        <CardHeader
            title="Node Info"
            action={
                <Box sx={{ pt: 1, pr: 1 }}>
                    <Chip
                        icon={
                            node.onlined ? (
                                <WifiIcon fontSize="small" />
                            ) : (
                                <WifiOffIcon fontSize="small" />
                            )
                        }
                        label={node.onlined ? 'Online' : 'Offline'}
                        color={node.onlined ? 'success' : 'default'}
                        size="small"
                    />
                </Box>
            }
        />
        <CardContent>
            <Grid container spacing={0}>
                <Grid size={6}>
                    <Field label="Node ID">{node.nodeId}</Field>
                </Grid>
                <Grid size={6}>
                    <Field label="Model">{node.model}</Field>
                </Grid>
            </Grid>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Signal
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SignalCellularAltIcon fontSize="small" color="info" />
                        <Typography variant="body2" fontWeight={500}>
                            {node.signalLevel ?? '—'}
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Battery
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <BatteryChargingFullIcon
                            fontSize="small"
                            color={(node.batteryLevel ?? 100) < 20 ? 'error' : 'success'}
                        />
                        <Typography variant="body2" fontWeight={500}>
                            {node.batteryLevel ?? '—'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            {node.section_name && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <Field label="Section">
                        <Chip label={node.section_name} size="small" variant="outlined" />
                    </Field>
                </>
            )}
            {node.notes && (
                <>
                    <Divider sx={{ my: 1 }} />
                    <Field label="Notes">{node.notes}</Field>
                </>
            )}
        </CardContent>
    </Card>
);

export default NodeInfoCard;
