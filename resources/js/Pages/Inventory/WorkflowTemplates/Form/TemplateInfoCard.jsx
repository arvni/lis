import {
    Box,
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    MenuItem,
    Switch,
    TextField,
    Typography,
} from '@mui/material';

const TemplateInfoCard = ({ data, setData, errors, requestTypes = [] }) => (
    <Card>
        <CardHeader title="Template Info" />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
                fullWidth
                required
                size="small"
                label="Name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
            />
            <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                label="Description (optional)"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
            />
            <TextField
                select
                fullWidth
                size="small"
                label="Applies to"
                value={data.request_type}
                onChange={(e) => {
                    const { value } = e.target;
                    setData((prev) => ({
                        ...prev,
                        request_type: value,
                        // Leave workflows are picked by the requester's roles only.
                        conditions:
                            value === 'LEAVE'
                                ? { ...prev.conditions, urgencies: [], min_total: '' }
                                : prev.conditions,
                    }));
                }}
                error={!!errors.request_type}
                helperText={errors.request_type ?? 'Which requests this workflow governs'}
            >
                <MenuItem value="">Purchase & export requests</MenuItem>
                {requestTypes.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                        {t.label}
                    </MenuItem>
                ))}
            </TextField>
            <FormControlLabel
                control={
                    <Switch
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                    />
                }
                label="Active"
            />
            <FormControlLabel
                control={
                    <Switch
                        checked={data.is_default}
                        onChange={(e) => setData('is_default', e.target.checked)}
                    />
                }
                label={
                    <Box>
                        <Typography variant="body2">Default / fallback</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Used when no other template matches
                        </Typography>
                    </Box>
                }
            />
            <TextField
                fullWidth
                size="small"
                type="number"
                label="Priority"
                slotProps={{ htmlInput: { min: 0 } }}
                value={data.priority}
                onChange={(e) => setData('priority', parseInt(e.target.value) || 0)}
                helperText="Lower number = evaluated first (0 = highest priority)"
            />
        </CardContent>
    </Card>
);

export default TemplateInfoCard;
