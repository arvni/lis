import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    TextField,
    Typography,
} from '@mui/material';
import {
    CalendarToday,
    CheckCircleOutlined,
    Info,
    MonetizationOn,
    Person,
} from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch.jsx';

export default function StatementDetailsPanel({
    data,
    errors,
    validationErrors,
    editMode,
    processing,
    currentMonth,
    onChange,
    selectedChips,
    selectedCount,
    totalAmount,
    onRemoveSelected,
}) {
    return (
        <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1 }} color="primary" />
                    Statement Details
                </Typography>

                <SelectSearch
                    label="Select Referrer"
                    fullWidth
                    error={Boolean(errors?.referrer || validationErrors?.referrer)}
                    disabled={editMode || processing}
                    onChange={onChange}
                    helperText={
                        errors?.referrer ||
                        validationErrors?.referrer ||
                        'Choose the referring doctor or entity'
                    }
                    url={route('api.referrers.list')}
                    value={data.referrer}
                    name="referrer"
                    required
                    slotProps={{
                        input: {
                            startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />,
                        },
                    }}
                />

                <TextField
                    label="Month"
                    type="month"
                    name="month"
                    value={data.month}
                    onChange={onChange}
                    error={Boolean(errors?.month)}
                    helperText={errors?.month || 'Filter invoices by month'}
                    disabled={processing}
                    required
                    slotProps={{
                        inputLabel: { shrink: true },
                        input: {
                            startAdornment: (
                                <CalendarToday sx={{ mr: 1, color: 'action.active' }} />
                            ),
                        },
                        htmlInput: { max: currentMonth },
                    }}
                />

                {/* ── Selected invoices chips ── */}
                {selectedChips.length > 0 && (
                    <>
                        <Divider />
                        <Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 1,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                >
                                    <CheckCircleOutlined fontSize="small" color="primary" />
                                    Selected
                                    <Chip
                                        label={selectedCount}
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 0.5 }}
                                    />
                                </Typography>
                                <Chip
                                    label={`OMR ${totalAmount.toFixed(2)}`}
                                    size="small"
                                    color="success"
                                    icon={<MonetizationOn />}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.75,
                                    maxHeight: 220,
                                    overflowY: 'auto',
                                    p: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    bgcolor: 'action.hover',
                                }}
                            >
                                {selectedChips.map((inv) => (
                                    <Chip
                                        key={inv.id}
                                        label={inv.invoice_no || `#${inv.id}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        onDelete={() => onRemoveSelected(inv.id)}
                                        title={inv.patient_name || ''}
                                        sx={{ maxWidth: 140 }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
