import React from 'react';
import {
    Box,
    Chip,
    FormControlLabel,
    FormHelperText,
    Paper,
    Radio,
    RadioGroup,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import { ReceiptLong, Science, ViewInAr } from '@mui/icons-material';
import Grid from '@mui/material/Grid';
import SelectSearch from '@/Components/SelectSearch';

export default function BasicStep({ data, errors, onField, handleTypeChange, nav }) {
    return (
        <Box>
            {/* section: type */}
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Test Type
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <RadioGroup row value={data.type} onChange={handleTypeChange}>
                    {[
                        { value: 'TEST', label: 'Test', Icon: Science },
                        { value: 'SERVICE', label: 'Service', Icon: ReceiptLong },
                        { value: 'PANEL', label: 'Panel', Icon: ViewInAr },
                    ].map(({ value, label, Icon }) => (
                        <FormControlLabel
                            key={value}
                            value={value}
                            disabled={Boolean(data?.id)}
                            control={<Radio size="small" />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Icon fontSize="small" />
                                    {label}
                                </Box>
                            }
                        />
                    ))}
                </RadioGroup>
                <FormHelperText>
                    {data?.id
                        ? 'Type cannot be changed after creation'
                        : 'Determines which fields and workflow apply'}
                </FormHelperText>
            </Paper>

            {/* section: identifiers */}
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Identifiers
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        name="fullName"
                        label="Full Name"
                        value={data.fullName || ''}
                        onChange={onField}
                        fullWidth
                        required
                        error={Boolean(errors?.fullName)}
                        helperText={errors?.fullName || 'Shown on reports and invoices'}
                        placeholder="e.g. Complete Blood Count"
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField
                        name="name"
                        label="Short Name"
                        value={data.name || ''}
                        onChange={onField}
                        fullWidth
                        required
                        error={Boolean(errors?.name)}
                        helperText={errors?.name || 'Abbreviated label'}
                        placeholder="e.g. CBC"
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField
                        name="code"
                        label="Test Code"
                        value={data.code || ''}
                        onChange={onField}
                        fullWidth
                        required
                        error={Boolean(errors?.code)}
                        helperText={errors?.code || 'Unique code'}
                        placeholder="e.g. CBC-001"
                    />
                </Grid>
            </Grid>

            {/* section: settings */}
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Settings
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <FormControlLabel
                        name="status"
                        control={
                            <Switch
                                checked={Boolean(data.status)}
                                onChange={onField}
                                color="success"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Active
                                <Chip
                                    size="small"
                                    label={data.status ? 'Yes' : 'No'}
                                    color={data.status ? 'success' : 'default'}
                                />
                            </Box>
                        }
                    />
                    <FormControlLabel
                        name="can_merge"
                        control={
                            <Switch
                                checked={Boolean(data.can_merge)}
                                onChange={onField}
                                color="success"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Merge on Invoice
                                <Chip
                                    size="small"
                                    label={data.can_merge ? 'Yes' : 'No'}
                                    color={data.can_merge ? 'success' : 'default'}
                                />
                            </Box>
                        }
                    />
                </Box>
            </Paper>

            {/* section: classification */}
            {(data.type === 'TEST' || data.type === 'PANEL') && (
                <>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block' }}
                    >
                        Classification
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <SelectSearch
                                value={data.test_groups || []}
                                onChange={onField}
                                name="test_groups"
                                multiple
                                fullWidth
                                label="Test Groups"
                                url={route('api.testGroups.list')}
                                error={Boolean(errors?.test_groups)}
                                helperText={errors?.test_groups}
                            />
                        </Grid>
                    </Grid>
                </>
            )}

            {/* section: TEST-specific documents */}
            {data.type === 'TEST' && (
                <>
                    <Typography
                        variant="overline"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block' }}
                    >
                        Reports & Documents
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <SelectSearch
                                value={data.report_templates || []}
                                onChange={onField}
                                name="report_templates"
                                multiple
                                fullWidth
                                label="Report Templates *"
                                url={route('api.reportTemplates.list')}
                                error={Boolean(errors?.report_templates)}
                                helperText={
                                    errors?.report_templates ||
                                    'Templates used when generating results'
                                }
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                value={data.request_form || ''}
                                onChange={onField}
                                name="request_form"
                                fullWidth
                                label="Request Form"
                                url={route('api.requestForms.list')}
                                error={Boolean(errors?.request_form)}
                                helperText={errors?.request_form}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                value={data.consent_form || ''}
                                onChange={onField}
                                name="consent_form"
                                fullWidth
                                label="Consent Form"
                                url={route('api.consentForms.list')}
                                error={Boolean(errors?.consent_form)}
                                helperText={errors?.consent_form}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                value={data.instruction || ''}
                                onChange={onField}
                                name="instruction"
                                fullWidth
                                label="Patient Instructions"
                                url={route('api.instructions.list')}
                                error={Boolean(errors?.instruction)}
                                helperText={errors?.instruction}
                            />
                        </Grid>
                    </Grid>
                </>
            )}

            {nav}
        </Box>
    );
}
