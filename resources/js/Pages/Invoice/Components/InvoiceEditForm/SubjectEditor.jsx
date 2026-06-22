import {
    Box,
    Button,
    FormControlLabel,
    Grid,
    IconButton,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { AddCircle as AddCircleOutline, Delete as DeleteOutline } from '@mui/icons-material';

const SubjectEditor = ({ subject, onChange }) => {
    const enabled = Boolean(subject);

    const handleToggle = (e) => {
        if (e.target.checked) {
            onChange({ title: '', lines: [{ label: '', value: '' }] });
        } else {
            onChange(null);
        }
    };

    const updateField = (patch) => onChange({ ...subject, ...patch });

    const updateLine = (idx, patch) => {
        const lines = [...(subject?.lines || [])];
        lines[idx] = { ...lines[idx], ...patch };
        updateField({ lines });
    };

    const addLine = () =>
        updateField({ lines: [...(subject?.lines || []), { label: '', value: '' }] });

    const removeLine = (idx) => {
        const lines = [...(subject?.lines || [])];
        lines.splice(idx, 1);
        updateField({ lines });
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: enabled ? 2 : 0 }}
            >
                <Box>
                    <Typography variant="subtitle2">Subject / For</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Defaults to patient info on the printed invoice. Override here to show a
                        project or custom block.
                    </Typography>
                </Box>
                <FormControlLabel
                    control={<Switch checked={enabled} onChange={handleToggle} />}
                    label={enabled ? 'Custom' : 'Patient info'}
                />
            </Stack>

            {enabled && (
                <Stack spacing={1.5}>
                    <TextField
                        size="small"
                        fullWidth
                        label="Title"
                        placeholder="e.g. Project Name"
                        value={subject?.title || ''}
                        onChange={(e) => updateField({ title: e.target.value })}
                    />
                    <Box>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Fields
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<AddCircleOutline fontSize="small" />}
                                onClick={addLine}
                            >
                                Add field
                            </Button>
                        </Stack>
                        <Stack spacing={1}>
                            {(subject?.lines || []).map((line, idx) => (
                                <Grid key={idx} container spacing={1} alignItems="center">
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Label (e.g. Reference)"
                                            value={line.label || ''}
                                            onChange={(e) =>
                                                updateLine(idx, { label: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 11, sm: 7 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Value"
                                            value={line.value || ''}
                                            onChange={(e) =>
                                                updateLine(idx, { value: e.target.value })
                                            }
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 1, sm: 1 }}>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeLine(idx)}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}
                        </Stack>
                    </Box>
                </Stack>
            )}
        </Paper>
    );
};

export default SubjectEditor;
