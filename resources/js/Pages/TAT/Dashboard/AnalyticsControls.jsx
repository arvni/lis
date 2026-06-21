import {
    Box,
    Button,
    CircularProgress,
    Grid,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { BarChart as BarChartIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch.jsx';
import { PRESETS } from './constants';

const AnalyticsControls = ({
    af,
    applyAnalytics,
    testObj,
    setTestObj,
    analyticsDates,
    analyticsLoading,
    onRefresh,
}) => (
    <>
        <Stack direction="row" spacing={1} mb={2} sx={{ alignItems: 'center' }}>
            <BarChartIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
                Avg TAT by Test
            </Typography>
            {analyticsDates && !analyticsLoading && (
                <Typography variant="caption" color="text.secondary">
                    ({analyticsDates.from} → {analyticsDates.to})
                </Typography>
            )}
            {analyticsLoading && <CircularProgress size={16} />}
            <Box sx={{ ml: 'auto' }}>
                <Tooltip title="Refresh">
                    <span>
                        <Button
                            size="small"
                            startIcon={<RefreshIcon />}
                            onClick={onRefresh}
                            disabled={analyticsLoading}
                        >
                            Refresh
                        </Button>
                    </span>
                </Tooltip>
            </Box>
        </Stack>

        {/* Date presets + filters */}
        <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12 }}>
                    <Stack direction="row" gap={1} sx={{ flexWrap: 'wrap' }}>
                        {PRESETS.map((p) => (
                            <Button
                                key={p.key}
                                size="small"
                                variant={af.a_preset === p.key ? 'contained' : 'outlined'}
                                onClick={() =>
                                    applyAnalytics({
                                        a_preset: p.key,
                                        a_from: '',
                                        a_to: '',
                                    })
                                }
                            >
                                {p.label}
                            </Button>
                        ))}
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <SelectSearch
                        value={testObj}
                        onChange={(e) => {
                            const obj = e.target.value;
                            setTestObj(obj ?? null);
                            applyAnalytics({ a_test_id: obj?.id ?? '' });
                        }}
                        name="test"
                        label="Test"
                        url={route('api.tests.list')}
                        fullWidth
                        size="small"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                        label="Custom From"
                        type="date"
                        size="small"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={af.a_from}
                        onChange={(e) => applyAnalytics({ a_from: e.target.value, a_preset: '' })}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                    <TextField
                        label="Custom To"
                        type="date"
                        size="small"
                        fullWidth
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={af.a_to}
                        onChange={(e) => applyAnalytics({ a_to: e.target.value, a_preset: '' })}
                    />
                </Grid>
            </Grid>
        </Paper>
    </>
);

export default AnalyticsControls;
