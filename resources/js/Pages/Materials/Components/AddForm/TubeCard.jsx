import { Box, Grid, IconButton, InputAdornment, Paper, TextField, Typography } from '@mui/material';
import { QrCode, CalendarToday, Numbers, DeleteOutlined } from '@mui/icons-material';

const startAdornment = (icon) => ({
    input: { startAdornment: <InputAdornment position="start">{icon}</InputAdornment> },
});

const TubeCard = ({ tube, index, canDelete, errors, onTubeChange, onDeleteTube }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9',
        }}
    >
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2,
            }}
        >
            <Typography variant="subtitle2" color="primary">
                Tube #{index + 1}
            </Typography>
            {canDelete && (
                <IconButton size="small" color="error" onClick={() => onDeleteTube(index)}>
                    <DeleteOutlined fontSize="small" />
                </IconButton>
            )}
        </Box>
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    label="Tube Barcode"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={tube.tube_barcode}
                    onChange={(e) => onTubeChange(index, 'tube_barcode', e.target.value)}
                    error={!!errors?.[`tubes.${index}.tube_barcode`]}
                    helperText={
                        errors?.[`tubes.${index}.tube_barcode`] || 'Scan or enter tube barcode'
                    }
                    slotProps={startAdornment(<QrCode fontSize="small" />)}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    label="Tube Series"
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={tube.tube_series || ''}
                    onChange={(e) => onTubeChange(index, 'tube_series', e.target.value)}
                    error={!!errors?.[`tubes.${index}.tube_series`]}
                    helperText={errors?.[`tubes.${index}.tube_series`] || 'Optional tube series'}
                    slotProps={startAdornment(<Numbers fontSize="small" />)}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    label="Manufactured Date"
                    fullWidth
                    type="date"
                    variant="outlined"
                    size="small"
                    value={tube.manufactured_date || ''}
                    onChange={(e) => onTubeChange(index, 'manufactured_date', e.target.value)}
                    error={!!errors?.[`tubes.${index}.manufactured_date`]}
                    helperText={
                        errors?.[`tubes.${index}.manufactured_date`] || 'Optional manufactured date'
                    }
                    slotProps={{
                        ...startAdornment(<CalendarToday fontSize="small" />),
                        inputLabel: { shrink: true },
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    label="Expire Date"
                    fullWidth
                    type="date"
                    variant="outlined"
                    size="small"
                    value={tube.expire_date}
                    onChange={(e) => onTubeChange(index, 'expire_date', e.target.value)}
                    error={!!errors?.[`tubes.${index}.expire_date`]}
                    helperText={errors?.[`tubes.${index}.expire_date`] || 'Tube expiration date'}
                    slotProps={{
                        ...startAdornment(<CalendarToday fontSize="small" />),
                        inputLabel: { shrink: true },
                    }}
                />
            </Grid>
        </Grid>
    </Paper>
);

export default TubeCard;
