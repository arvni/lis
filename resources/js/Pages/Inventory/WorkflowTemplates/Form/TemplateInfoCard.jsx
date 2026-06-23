import {
    Box,
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    Switch,
    TextField,
    Typography,
} from '@mui/material';

const TemplateInfoCard = ({ data, setData, errors }) => (
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
