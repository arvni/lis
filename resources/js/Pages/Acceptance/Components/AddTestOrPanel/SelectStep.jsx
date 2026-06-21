import { Box, Typography, Grid, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import SelectSearch from '@/Components/SelectSearch';
import { TYPES } from './constants';

// ─── Step 1: Type + Selection ──────────────────────────────────────────────────
const SelectStep = ({
    type,
    testData,
    panelData,
    loading,
    errors,
    requestedTests,
    onTypeSelect,
    onItemSelect,
    onRequestedSelect,
}) => {
    const preview = type !== 'PANEL' ? testData.method_test?.test : panelData.panel;
    const hasPreview = Boolean(preview?.id);

    return (
        <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                What would you like to add?
            </Typography>

            <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {TYPES.map(({ value, label, desc, color }) => (
                    <Grid key={value} size={{ xs: 12, sm: 4 }}>
                        <Paper
                            elevation={type === value ? 4 : 1}
                            onClick={() => onTypeSelect(value)}
                            sx={{
                                p: 2,
                                cursor: 'pointer',
                                borderRadius: 2,
                                border: '2px solid',
                                borderColor: type === value ? `${color}.main` : 'transparent',
                                bgcolor: type === value ? `${color}.50` : 'background.paper',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    borderColor: `${color}.300`,
                                    bgcolor: `${color}.50`,
                                    transform: 'translateY(-1px)',
                                },
                            }}
                        >
                            <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                color={type === value ? `${color}.main` : 'text.primary'}
                            >
                                {label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {desc}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {errors.type && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.type}
                </Alert>
            )}

            {type && (
                <Box>
                    {type !== 'PANEL' && requestedTests.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Quick select from requested:
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {requestedTests.map((t) => (
                                    <Chip
                                        key={t.server_id || t.name}
                                        label={t.name}
                                        onClick={onRequestedSelect(t)}
                                        size="small"
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    <SelectSearch
                        value={
                            type !== 'PANEL'
                                ? testData.method_test?.test?.id
                                    ? testData.method_test.test
                                    : ''
                                : panelData.panel || ''
                        }
                        label={
                            type === 'PANEL'
                                ? 'Select Panel'
                                : type === 'TEST'
                                  ? 'Select Test'
                                  : 'Select Service'
                        }
                        fullWidth
                        url={route('api.tests.list')}
                        defaultData={{ type, status: true }}
                        onChange={onItemSelect}
                        name="test"
                        error={Boolean(errors.test || errors.selection || errors.panel)}
                        helperText={
                            errors.test ||
                            errors.selection ||
                            errors.panel ||
                            'Start typing to search...'
                        }
                        disabled={loading}
                    />

                    {loading && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                mt: 2,
                                color: 'text.secondary',
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography variant="body2">Loading details...</Typography>
                        </Box>
                    )}

                    {!loading && hasPreview && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                mt: 2,
                                borderRadius: 2,
                                bgcolor: type === 'PANEL' ? 'secondary.50' : 'primary.50',
                                border: '1px solid',
                                borderColor: type === 'PANEL' ? 'secondary.200' : 'primary.200',
                            }}
                        >
                            <Typography variant="subtitle2" fontWeight="bold">
                                {preview.fullName || preview.name}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    mt: 0.75,
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}
                            >
                                {preview.code && (
                                    <Chip
                                        label={preview.code}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontFamily: 'monospace' }}
                                    />
                                )}
                                {type === 'PANEL' && (
                                    <Chip
                                        label={`${preview.method_tests?.length || 0} tests included`}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                )}
                                {(preview.test_groups || []).map((g) => (
                                    <Chip
                                        key={g.id}
                                        label={g.name}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default SelectStep;
