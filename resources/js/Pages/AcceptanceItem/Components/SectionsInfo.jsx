import { useState, useMemo } from 'react';
import {
    Box,
    Chip,
    Paper,
    Stack,
    Typography,
    useTheme,
    LinearProgress,
    Tabs,
    Tab,
    Grid as Grid,
} from '@mui/material';
import {
    Timeline as TimelineIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { WorkflowActionForm, ACTION_TYPES } from '@/Pages/Section/Components/DoneForm';
import { useForm } from '@inertiajs/react';
import TabPanel from './SectionsInfo/TabPanel.jsx';
import PatientInfoCard from './SectionsInfo/PatientInfoCard.jsx';
import SampleTimeline from './SectionsInfo/SampleTimeline.jsx';

const SectionsInfo = ({ acceptanceItemStates = true }) => {
    const theme = useTheme();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openForm, setOpenForm] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const { post, setData, data, reset, processing } = useForm({});

    // Group acceptance item states by sample_id
    const groupedSamples = useMemo(() => {
        if (!acceptanceItemStates?.length) return [];

        const grouped = acceptanceItemStates.reduce((acc, item) => {
            const sampleId = item.sample_id || 'Unknown';
            if (!acc[sampleId]) {
                acc[sampleId] = [];
            }
            acc[sampleId].push(item);
            return acc;
        }, {});

        return Object.entries(grouped).map(([sampleId, items]) => ({
            sampleId,
            sample: items[0]?.sample, // Get sample info from first item
            patient: items[0]?.sample?.patient, // Get patient info from sample
            acceptanceItemStates: items,
        }));
    }, [acceptanceItemStates]);

    const onSuccess = () => {
        setOpenForm(false);
        reset();
    };

    const handleOpenDoneForm = (id) => () => {
        setLoading(true);
        axios
            .get(route('acceptanceItemStates.show', id))
            .then((res) => {
                setData({ ...res.data.data, actionType: ACTION_TYPES.COMPLETE, _method: 'put' });
            })
            .then(() => {
                setLoading(false);
                setOpenForm(true);
            });
    };

    const handleCloseForm = () => {
        reset();
        setOpenForm(false);
    };

    const handleOpenRejectForm = (id) => async () => {
        setLoading(true);
        axios
            .get(route('acceptanceItemStates.prevSections', id))
            .then((res) => {
                setOptions(res.data.sections);
            })
            .then(() => axios.get(route('acceptanceItemStates.show', id)))
            .then((res) => {
                setData({
                    ...res.data.data,
                    next: '',
                    _method: 'put',
                    actionType: ACTION_TYPES.REJECT,
                });
            })
            .then(() => {
                setOpenForm(true);
                setLoading(false);
            });
    };

    const handleFormChange = (name, value) =>
        setData((prevData) => ({ ...prevData, [name]: value }));

    const handleSubmit = () => post(route('acceptanceItemStates.update', data.id), { onSuccess });

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Calculate overall statistics
    const overallStats = useMemo(() => {
        const totalSections = acceptanceItemStates?.length || 0;
        const completedSections =
            acceptanceItemStates?.filter((state) => ['finished', 'rejected'].includes(state.status))
                .length || 0;
        const overallProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

        return {
            totalSamples: groupedSamples.length,
            totalSections,
            completedSections,
            overallProgress,
        };
    }, [acceptanceItemStates, groupedSamples]);

    if (!groupedSamples.length) {
        return (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                    No workflow data available
                </Typography>
            </Paper>
        );
    }

    return (
        <>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Header with overall statistics */}
                <Box
                    sx={{
                        p: 3,
                        backgroundColor: theme.palette.primary.dark,
                        color: theme.palette.primary.contrastText,
                    }}
                >
                    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                <TimelineIcon fontSize="large" />
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        Workflow Dashboard
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        {overallStats.overallProgress.toFixed(0)}% Complete •{' '}
                                        {overallStats.totalSamples} Samples •{' '}
                                        {overallStats.totalSections} Sections
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {overallStats.completedSections} / {overallStats.totalSections}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    Sections Complete
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <LinearProgress
                        variant="determinate"
                        value={overallStats.overallProgress}
                        sx={{
                            mt: 2,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                transition: 'transform 1s ease-in-out',
                            },
                        }}
                    />
                </Box>

                {/* Tabs for different samples */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                fontWeight: 'bold',
                            },
                        }}
                    >
                        {groupedSamples.map((sample, index) => (
                            <Tab
                                key={sample.sampleId}
                                label={
                                    <Stack
                                        direction="column"
                                        spacing={0.5}
                                        sx={{ alignItems: 'center' }}
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            sx={{ alignItems: 'center' }}
                                        >
                                            <ScienceIcon fontSize="small" />
                                            <span>
                                                {sample.sample?.barcode ||
                                                    `Sample ${sample.sampleId}`}
                                            </span>
                                            <Chip
                                                size="small"
                                                label={sample.acceptanceItemStates.length}
                                                color="primary"
                                                sx={{ minWidth: 24, height: 20 }}
                                            />
                                        </Stack>
                                        {sample.patient?.fullName && (
                                            <Typography
                                                variant="caption"
                                                sx={{ opacity: 0.7, fontSize: '0.7rem' }}
                                            >
                                                {sample.patient.fullName}
                                            </Typography>
                                        )}
                                    </Stack>
                                }
                                id={`sample-tab-${index}`}
                                aria-controls={`sample-tabpanel-${index}`}
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 120,
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Tab panels */}
                {groupedSamples.map((sampleGroup, index) => (
                    <TabPanel key={sampleGroup.sampleId} value={activeTab} index={index}>
                        {/* Patient Information Card */}
                        <PatientInfoCard
                            patient={sampleGroup.patient}
                            sample={sampleGroup.sample}
                        />

                        {/* Timeline for this sample */}
                        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ p: { xs: 1, sm: 3 } }}>
                                <SampleTimeline
                                    acceptanceItemStates={sampleGroup.acceptanceItemStates}
                                    onOpenDoneForm={handleOpenDoneForm}
                                    onOpenRejectForm={handleOpenRejectForm}
                                />
                            </Box>
                        </Paper>
                    </TabPanel>
                ))}
            </Paper>

            <WorkflowActionForm
                actionType={data.actionType}
                onClose={handleCloseForm}
                open={openForm && !processing && !loading}
                acceptanceItemState={data}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                options={options}
            />
        </>
    );
};

export default SectionsInfo;
