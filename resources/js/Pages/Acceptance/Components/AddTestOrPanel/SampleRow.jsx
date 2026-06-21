import { useMemo, memo } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Stack,
} from '@mui/material';
import { Person as PersonIcon, Remove } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';

// ─── Sample Row ────────────────────────────────────────────────────────────────
const SampleRow = memo(
    ({
        sample,
        sampleIndex,
        sampleTypes,
        patientCount,
        errors,
        patient,
        onChange,
        onRemove,
        canRemove,
    }) => {
        const defaultPatientData = useMemo(() => ({ patient: patient?.id }), [patient?.id]);
        return (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, position: 'relative' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5,
                    }}
                >
                    <Typography variant="caption" fontWeight="bold" color="primary.main">
                        Sample {sampleIndex + 1}
                    </Typography>
                    {canRemove && (
                        <IconButton size="small" color="error" onClick={() => onRemove(sampleIndex)}>
                            <Remove fontSize="small" />
                        </IconButton>
                    )}
                </Box>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <FormControl
                            fullWidth
                            size="small"
                            error={Boolean(errors?.[`s${sampleIndex}.sampleType`])}
                        >
                            <InputLabel>Sample Type</InputLabel>
                            <Select
                                value={sample.sampleType || ''}
                                label="Sample Type"
                                onChange={(e) => onChange(sampleIndex, 'sampleType', e.target.value)}
                            >
                                {sampleTypes.map((st) => (
                                    <MenuItem key={st.id} value={st.id}>
                                        {st.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors?.[`s${sampleIndex}.sampleType`] && (
                                <FormHelperText>
                                    {errors[`s${sampleIndex}.sampleType`]}
                                </FormHelperText>
                            )}
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 7 }}>
                        <Stack spacing={1}>
                            {Array.from({ length: patientCount }).map((_, pi) => (
                                <SelectSearch
                                    key={pi}
                                    size="small"
                                    value={sample.patients?.[pi] || ''}
                                    label={patientCount > 1 ? `Patient ${pi + 1}` : 'Patient'}
                                    fullWidth
                                    url={route('api.patients.list')}
                                    defaultData={defaultPatientData}
                                    onChange={(e) =>
                                        onChange(sampleIndex, 'patient', e.target.value, pi)
                                    }
                                    name="patient"
                                    error={Boolean(errors?.[`s${sampleIndex}.p${pi}`])}
                                    helperText={errors?.[`s${sampleIndex}.p${pi}`] || ''}
                                    startAdornment={
                                        <PersonIcon
                                            fontSize="small"
                                            color="action"
                                            sx={{ mr: 0.5 }}
                                        />
                                    }
                                />
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
        );
    },
);
SampleRow.displayName = 'SampleRow';

export default SampleRow;
