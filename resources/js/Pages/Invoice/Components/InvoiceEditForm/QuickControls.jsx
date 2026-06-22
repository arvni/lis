import {
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Business, Person } from '@mui/icons-material';
import { STATUS_OPTIONS } from './constants';

const QuickControls = ({ formData, errors, ownerAvailable, onOwnerChange, onStatusChange }) => (
    <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 0.5, display: 'block' }}
                >
                    Bill to
                </Typography>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={formData.owner_type || ''}
                    onChange={onOwnerChange}
                    color="primary"
                >
                    <ToggleButton value="patient" disabled={!ownerAvailable.patient}>
                        <Person fontSize="small" sx={{ mr: 1 }} />
                        Patient
                    </ToggleButton>
                    <ToggleButton value="referrer" disabled={!ownerAvailable.referrer}>
                        <Business fontSize="small" sx={{ mr: 1 }} />
                        Referrer
                    </ToggleButton>
                </ToggleButtonGroup>
                {errors.owner_type && (
                    <Typography
                        variant="caption"
                        color="error"
                        sx={{ mt: 0.5, display: 'block' }}
                    >
                        {errors.owner_type}
                    </Typography>
                )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={!!errors.status} size="small">
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                        labelId="status-label"
                        label="Status"
                        value={formData.status || ''}
                        onChange={(e) => onStatusChange(e.target.value)}
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </Stack>
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.status && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            {errors.status}
                        </Typography>
                    )}
                </FormControl>
            </Grid>
        </Grid>
    </Paper>
);

export default QuickControls;
