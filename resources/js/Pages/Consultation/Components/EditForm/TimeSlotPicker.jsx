import {
    Box,
    CircularProgress,
    FormControlLabel,
    FormHelperText,
    Paper,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const TimeSlotPicker = ({ times, waiting, value, onChange, error }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
        }}
    >
        <Box display="flex" mb={2} sx={{ alignItems: 'center' }}>
            <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="medium">
                Available Time Slots
            </Typography>
        </Box>

        {waiting ? (
            <Box display="flex" p={4} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" ml={2}>
                    Loading available times...
                </Typography>
            </Box>
        ) : times.length > 0 ? (
            <>
                <RadioGroup
                    name="time"
                    value={value}
                    onChange={onChange}
                    sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
                >
                    {times.map((item, index) => (
                        <FormControlLabel
                            key={index}
                            value={item.value}
                            label={item.label}
                            disabled={item.disabled}
                            control={
                                <Radio
                                    color="primary"
                                    disabled={item.disabled}
                                    checkedIcon={<CheckCircleIcon />}
                                />
                            }
                            sx={{
                                border: '1px solid',
                                borderColor:
                                    value === item.value ? 'primary.main' : 'divider',
                                borderRadius: '8px',
                                m: 0.5,
                                p: 0.5,
                                pr: 1.5,
                                transition: 'all 0.2s',
                                bgcolor:
                                    value === item.value
                                        ? 'action.selected'
                                        : 'background.paper',
                                '&:hover': {
                                    bgcolor: 'action.hover',
                                    borderColor: 'primary.light',
                                },
                            }}
                        />
                    ))}
                </RadioGroup>

                {error && <FormHelperText error>{error}</FormHelperText>}
            </>
        ) : (
            <Typography variant="body2" color="text.secondary" align="center" py={2}>
                No available time slots. Please try another date or consultant.
            </Typography>
        )}
    </Paper>
);

export default TimeSlotPicker;
