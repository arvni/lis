import {
    Avatar,
    Box,
    Chip,
    Collapse,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    CheckCircle,
    ExpandLess,
    ExpandMore,
    LocationOn,
    Person,
    Science,
    Warning,
} from '@mui/icons-material';
import { getStatusColor } from './helpers';
import MaterialField from './MaterialField';

export default function BarcodeCard({
    barcode,
    index,
    expanded,
    matVal,
    now,
    referrer,
    isReferredOutpatient,
    onToggle,
    onChange,
    onMaterialCheck,
}) {
    const statusColor = getStatusColor(barcode);
    const showReceivedError =
        barcode.collection_date &&
        (!barcode.received_at ||
            new Date(barcode.collection_date) > new Date(barcode.received_at));

    const showMaterial =
        referrer &&
        (barcode.sampleType?.orderable ||
            (isReferredOutpatient && barcode.sampleType?.required_barcode));

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                borderColor:
                    statusColor === 'success'
                        ? 'success.main'
                        : statusColor === 'warning'
                          ? 'warning.main'
                          : 'divider',
            }}
        >
            {/* Row summary — clickable */}
            <Box
                onClick={onToggle}
                sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    userSelect: 'none',
                }}
            >
                <IconButton size="small" tabIndex={-1}>
                    {expanded ? (
                        <ExpandLess fontSize="small" />
                    ) : (
                        <ExpandMore fontSize="small" />
                    )}
                </IconButton>

                <Chip
                    label={barcode.barcodeGroup?.name || `BC-${index + 1}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ fontWeight: 600, minWidth: 64 }}
                />

                <Box display="flex" gap={1} sx={{ alignItems: 'center', flex: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}>
                        <Person sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                        {barcode.patient?.fullName || '—'}
                    </Typography>
                </Box>

                <Chip
                    size="small"
                    icon={<Science sx={{ fontSize: 14 }} />}
                    label={barcode.sampleType?.name || 'Unknown'}
                    sx={{ bgcolor: 'info.50', color: 'info.dark', fontWeight: 500 }}
                />

                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                >
                    {barcode.items?.length || 0} test
                    {barcode.items?.length !== 1 ? 's' : ''}
                </Typography>

                <Chip
                    size="small"
                    color={statusColor}
                    icon={
                        statusColor === 'error' ? (
                            <Warning sx={{ fontSize: 14 }} />
                        ) : (
                            <CheckCircle sx={{ fontSize: 14 }} />
                        )
                    }
                    label={
                        !barcode.collection_date || !barcode.received_at
                            ? 'Incomplete'
                            : statusColor === 'warning'
                              ? 'Invalid dates'
                              : 'Ready'
                    }
                />
            </Box>

            {/* Expanded detail panel */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Divider />
                <Box sx={{ p: 2.5, bgcolor: 'grey.50' }}>
                    <Stack spacing={2.5}>
                        {/* Tests */}
                        <Box>
                            <Typography
                                variant="caption"
                                fontWeight={600}
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 1,
                                }}
                            >
                                <Science sx={{ fontSize: 14 }} /> Requested Tests
                            </Typography>
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{ flexWrap: 'wrap' }}
                                useFlexGap
                            >
                                {barcode.items?.map((item, i) => (
                                    <Chip
                                        key={i}
                                        size="small"
                                        variant="outlined"
                                        sx={{ bgcolor: 'background.paper', mb: 0.5 }}
                                        label={
                                            <>
                                                <strong>{item.test?.name}</strong>
                                                {item.method?.name ? ` • ${item.method.name}` : ''}
                                            </>
                                        }
                                    />
                                ))}
                            </Stack>
                        </Box>

                        <Divider />

                        {/* Collection fields */}
                        <Box>
                            <Typography
                                variant="caption"
                                fontWeight={600}
                                color="text.secondary"
                                sx={{
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1.5,
                                    display: 'block',
                                }}
                            >
                                Collection Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="sampleLocation"
                                        label="Sampling Location"
                                        placeholder="e.g., In Lab"
                                        value={barcode.sampleLocation || ''}
                                        onChange={onChange}
                                        slotProps={{
                                            input: {
                                                startAdornment: (
                                                    <LocationOn
                                                        fontSize="small"
                                                        color="action"
                                                        sx={{ mr: 0.5 }}
                                                    />
                                                ),
                                            },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="collection_date"
                                        type="datetime-local"
                                        label="Collection Date & Time"
                                        value={barcode.collection_date || ''}
                                        onChange={onChange}
                                        error={!barcode.collection_date}
                                        helperText={!barcode.collection_date ? 'Required' : ''}
                                        slotProps={{
                                            htmlInput: { max: now },
                                            inputLabel: { shrink: true },
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        name="received_at"
                                        type="datetime-local"
                                        label="Received Date & Time"
                                        value={barcode.received_at || ''}
                                        onChange={onChange}
                                        error={!!showReceivedError}
                                        helperText={
                                            !barcode.received_at && barcode.collection_date
                                                ? 'Required'
                                                : showReceivedError
                                                  ? 'Must be after collection date'
                                                  : ''
                                        }
                                        slotProps={{
                                            htmlInput: {
                                                max: now,
                                                min: barcode.collection_date || undefined,
                                            },
                                            inputLabel: { shrink: true },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Material — for orderable or required_barcode referrer samples */}
                        {showMaterial && (
                            <MaterialField
                                barcode={barcode}
                                matVal={matVal}
                                isReferredOutpatient={isReferredOutpatient}
                                onCheck={(value) => onMaterialCheck(value)}
                            />
                        )}
                    </Stack>
                </Box>
            </Collapse>
        </Paper>
    );
}
