import React, {useState, useMemo} from "react";
import {
    Box,
    Chip,
    Divider,
    ListItem,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useTheme,
    Badge,
    Avatar,
    LinearProgress,
    Card,
    Button,
    useMediaQuery,
    Tabs,
    Tab,
    Grid2 as Grid,
} from "@mui/material";
import List from "@mui/material/List";
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineItem,
    TimelineOppositeContent,
    TimelineSeparator
} from "@mui/lab";
import {
    Done as DoneIcon,
    Close as CloseIcon,
    AccessTime as AccessTimeIcon,
    Info as InfoIcon,
    CheckCircle,
    ErrorOutline,
    HourglassEmpty,
    CalendarToday,
    Timeline as TimelineIcon,
    Science as ScienceIcon,
    Assignment as AssignmentIcon,
    Person as PersonIcon
} from "@mui/icons-material";
import {WorkflowActionForm, ACTION_TYPES} from "@/Pages/Section/Components/DoneForm";
import {Link, useForm} from "@inertiajs/react";
import Document from "@/Pages/Document.jsx";

// Enhanced status configuration
const workflowStatus = {
    waiting: {
        icon: <HourglassEmpty fontSize="small"/>,
        color: "warning",
        label: "Waiting",
        description: "This section is waiting to be processed"
    },
    processing: {
        icon: <AccessTimeIcon fontSize="small"/>,
        color: "info",
        label: "Processing",
        description: "This section is currently being processed"
    },
    finished: {
        icon: <CheckCircle fontSize="small"/>,
        color: "success",
        label: "Finished",
        description: "This section has been completed successfully"
    },
    rejected: {
        icon: <ErrorOutline fontSize="small"/>,
        color: "error",
        label: "Rejected",
        description: "This section was rejected and needs attention"
    }
};

// Custom Tab Panel Component
function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`sample-tabpanel-${index}`}
            aria-labelledby={`sample-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{pt: 3}}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// Patient Information Component
const PatientInfoCard = ({patient, sample}) => {
    const theme = useTheme();

    if (!patient && !sample) return null;

    return (
        <Card
            elevation={1}
            sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.info.light}`,
                backgroundColor: theme.palette.info.main,
                color: theme.palette.info.contrastText
            }}
        >
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                        sx={{
                            bgcolor: theme.palette.info.dark,
                            width: 48,
                            height: 48
                        }}
                    >
                        <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                            {patient?.fullName || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Patient ID: {patient?.id || 'N/A'}
                        </Typography>
                        {sample?.barcode && (
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Sample Barcode: {sample.barcode}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </Box>
        </Card>
    );
};

// Enhanced status dot component
const StatusDot = ({status}) => {
    const theme = useTheme();
    const statusConfig = workflowStatus[status];

    return (
        <Tooltip title={statusConfig.description} arrow placement="top">
            <TimelineDot
                color={statusConfig.color}
                sx={{
                    boxShadow: theme.shadows[3],
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'scale(1.15)',
                        boxShadow: theme.shadows[6]
                    },
                    cursor: 'pointer'
                }}
            >
                {statusConfig.icon}
            </TimelineDot>
        </Tooltip>
    );
};

// User avatar component
const UserAvatar = ({name, size = 32}) => {
    const theme = useTheme();

    if (!name) return null;

    const initials = name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <Tooltip title={name} arrow>
            <Avatar
                sx={{
                    width: size,
                    height: size,
                    bgcolor: theme.palette.primary.main,
                    fontSize: size / 2,
                    fontWeight: 'bold'
                }}
            >
                {initials}
            </Avatar>
        </Tooltip>
    );
};

// Format date string to be more readable
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';

    try {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat('default', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    } catch (e) {
        return dateTimeStr;
    }
};

// Timeline Component for individual sample
const SampleTimeline = ({acceptanceItemStates, onOpenDoneForm, onOpenRejectForm}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedDoc, setSelectedDoc] = useState(null);

    const handleOpenFile = (doc) => (e) => {
        e.preventDefault();
        setSelectedDoc(doc);
    };

    const handleCloseFile = () => setSelectedDoc(null);

    const renderParameterValue = (parameter) => {
        if (parameter.type === 'file' && parameter.value) {
            return (
                <>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<InfoIcon/>}
                        onClick={handleOpenFile(parameter.value)}
                        href={route("documents.download", (parameter.value.id || parameter.value.hash))}
                        target="_blank"
                        sx={{mt: 0.5, borderRadius: 1}}
                        title={parameter.value.originalName}
                    >
                        View File
                    </Button>
                    <Document
                        document={selectedDoc}
                        onClose={handleCloseFile}
                    />
                </>
            );
        }

        return (
            <Typography variant="body2">
                {parameter.value || '-'}
            </Typography>
        );
    };

    return (
        <Timeline position={isMobile ? "right" : "alternate"} sx={{px: {xs: 0, sm: 2}}}>
            {acceptanceItemStates?.map((acceptanceItemState, index) => (
                <TimelineItem key={index}>
                    {!isMobile && (
                        <TimelineOppositeContent
                            sx={{
                                m: 'auto 0',
                                px: {xs: 1, sm: 2},
                                py: 1,
                                maxWidth: {xs: '100%', sm: '30%'}
                            }}
                        >
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    backgroundColor: theme.palette.background.paper,
                                    borderRight: index % 2 === 0 ? `4px solid ${theme.palette.primary.main}` : 'none',
                                    borderLeft: index % 2 !== 0 ? `4px solid ${theme.palette.primary.main}` : 'none',
                                    borderRadius: 2,
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        boxShadow: theme.shadows[4],
                                        transform: 'translateY(-3px)'
                                    }
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    href={route("sections.show", acceptanceItemState.section.id)}
                                    component={Link}
                                    fontWeight="bold"
                                    gutterBottom
                                    sx={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    {acceptanceItemState.section.name}
                                </Typography>

                                <Chip
                                    icon={workflowStatus[acceptanceItemState.status].icon}
                                    label={workflowStatus[acceptanceItemState.status].label}
                                    size="small"
                                    color={workflowStatus[acceptanceItemState.status].color}
                                    sx={{fontWeight: 'medium', mt: 0.5}}
                                />
                            </Paper>
                        </TimelineOppositeContent>
                    )}

                    <TimelineSeparator sx={{justifyContent: "center"}}>
                        {index > 0 && (
                            <TimelineConnector
                                sx={{
                                    bgcolor:
                                        acceptanceItemState.status === 'finished'
                                            ? theme.palette.success.light
                                            : acceptanceItemState.status === 'rejected'
                                                ? theme.palette.error.light
                                                : theme.palette.divider,
                                    minHeight: 40
                                }}
                            />
                        )}

                        <StatusDot status={acceptanceItemState.status}/>

                        {index < acceptanceItemStates.length - 1 && (
                            <TimelineConnector
                                sx={{
                                    bgcolor:
                                        acceptanceItemState.status === 'finished'
                                            ? theme.palette.success.light
                                            : theme.palette.divider,
                                    minHeight: 40
                                }}
                            />
                        )}
                    </TimelineSeparator>

                    <TimelineContent sx={{py: 2, px: {xs: 1, sm: 2}}}>
                        <Card
                            elevation={2}
                            sx={{
                                borderRadius: 2,
                                overflow: 'hidden',
                                transition: 'all 0.3s',
                                '&:hover': {
                                    boxShadow: theme.shadows[4],
                                }
                            }}
                        >
                            {isMobile && (
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: theme.palette.background.default,
                                    borderBottom: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {acceptanceItemState.section.name}
                                        </Typography>
                                        <Chip
                                            icon={workflowStatus[acceptanceItemState.status].icon}
                                            label={workflowStatus[acceptanceItemState.status].label}
                                            size="small"
                                            color={workflowStatus[acceptanceItemState.status].color}
                                            sx={{fontWeight: 'medium'}}
                                        />
                                    </Stack>
                                </Box>
                            )}

                            <Box sx={{p: 2}}>
                                {acceptanceItemState.started_at && (
                                    <Stack
                                        direction="row"
                                        spacing={1}
                                        alignItems="center"
                                        sx={{mb: 2}}
                                    >
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                                            badgeContent={<CalendarToday fontSize="small" color="action"/>}
                                        >
                                            <UserAvatar name={acceptanceItemState.started_by?.name}/>
                                        </Badge>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Started by{' '}
                                                <Typography component="span" fontWeight="bold">
                                                    {acceptanceItemState.started_by?.name || 'Unknown'}
                                                </Typography>
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDateTime(acceptanceItemState.started_at)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                )}

                                {["finished", "rejected"].includes(acceptanceItemState.status) && (
                                    <>
                                        {acceptanceItemState.parameters && acceptanceItemState.parameters.length > 0 && (
                                            <>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="bold"
                                                    sx={{
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5
                                                    }}
                                                >
                                                    <InfoIcon fontSize="small" color="primary"/>
                                                    Parameters
                                                </Typography>

                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: 1,
                                                        mb: 2,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <List dense disablePadding>
                                                        {(typeof acceptanceItemState.parameters !== "string"
                                                                ? acceptanceItemState.parameters
                                                                : JSON.parse(acceptanceItemState.parameters)
                                                        ).map((parameter, paramIndex) => (
                                                            <React.Fragment key={paramIndex}>
                                                                {paramIndex > 0 && <Divider/>}
                                                                <ListItem
                                                                    sx={{
                                                                        py: 1,
                                                                        px: 2,
                                                                        backgroundColor: paramIndex % 2 === 0
                                                                            ? 'transparent'
                                                                            : theme.palette.action.hover
                                                                    }}
                                                                >
                                                                    <Stack
                                                                        direction={{xs: 'column', sm: 'row'}}
                                                                        spacing={1}
                                                                        alignItems={{xs: 'flex-start', sm: 'center'}}
                                                                        justifyContent="space-between"
                                                                        width="100%"
                                                                    >
                                                                        <Typography
                                                                            variant="subtitle2"
                                                                            color="text.primary"
                                                                            fontWeight="medium"
                                                                        >
                                                                            {parameter.name}:
                                                                        </Typography>
                                                                        {renderParameterValue(parameter)}
                                                                    </Stack>
                                                                </ListItem>
                                                            </React.Fragment>
                                                        ))}
                                                    </List>
                                                </Paper>
                                            </>
                                        )}

                                        {acceptanceItemState.details && (
                                            <>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight="bold"
                                                    sx={{
                                                        mb: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5
                                                    }}
                                                >
                                                    <ErrorOutline fontSize="small" color="error"/>
                                                    Rejection Details
                                                </Typography>

                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 2,
                                                        backgroundColor: theme.palette.error.light,
                                                        color: theme.palette.error.dark,
                                                        borderLeft: `4px solid ${theme.palette.error.main}`,
                                                        borderRadius: 1,
                                                        mb: 2
                                                    }}
                                                >
                                                    <Typography variant="body2">
                                                        {acceptanceItemState.details}
                                                    </Typography>
                                                </Paper>
                                            </>
                                        )}

                                        {acceptanceItemState.finished_at && (
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                                alignItems="center"
                                                sx={{
                                                    mt: 2,
                                                    pt: 2,
                                                    borderTop: `1px dashed ${theme.palette.divider}`
                                                }}
                                            >
                                                <Badge
                                                    overlap="circular"
                                                    anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                                                    badgeContent={
                                                        acceptanceItemState.status === 'finished'
                                                            ? <CheckCircle fontSize="small" color="success"/>
                                                            : <CloseIcon fontSize="small" color="error"/>
                                                    }
                                                >
                                                    <UserAvatar name={acceptanceItemState.finished_by?.name}/>
                                                </Badge>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {acceptanceItemState.status === 'finished' ? 'Completed' : 'Rejected'} by{' '}
                                                        <Typography component="span" fontWeight="bold">
                                                            {acceptanceItemState.finished_by?.name || 'Unknown'}
                                                        </Typography>
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDateTime(acceptanceItemState.finished_at)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        )}
                                    </>
                                )}

                                {acceptanceItemState.status === "processing" && (
                                    <Stack
                                        direction="row"
                                        spacing={2}
                                        justifyContent="center"
                                        sx={{mt: 2}}
                                    >
                                        <Button
                                            variant="outlined"
                                            startIcon={<DoneIcon/>}
                                            onClick={onOpenDoneForm(acceptanceItemState.id)}
                                            color="success"
                                            sx={{
                                                borderRadius: 6,
                                                px: 2,
                                                py: 1,
                                                '&:hover': {
                                                    backgroundColor: theme.palette.success.light,
                                                    borderColor: theme.palette.success.dark,
                                                    boxShadow: theme.shadows[2]
                                                }
                                            }}
                                        >
                                            Complete
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            startIcon={<CloseIcon/>}
                                            onClick={onOpenRejectForm(acceptanceItemState.id)}
                                            color="error"
                                            sx={{
                                                borderRadius: 6,
                                                px: 2,
                                                py: 1,
                                                '&:hover': {
                                                    backgroundColor: theme.palette.error.light,
                                                    borderColor: theme.palette.error.dark,
                                                    boxShadow: theme.shadows[2]
                                                }
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </Stack>
                                )}
                            </Box>
                        </Card>
                    </TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
    );
};

const SectionsInfo = ({acceptanceItemStates = true}) => {
    const theme = useTheme();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openForm, setOpenForm] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const {post, setData, data, reset, processing} = useForm({});

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
            acceptanceItemStates: items
        }));
    }, [acceptanceItemStates]);

    const onSuccess = () => {
        setOpenForm(false);
        reset();
    };

    const handleOpenDoneForm = (id) => () => {
        setLoading(true);
        axios.get(route("acceptanceItemStates.show", id))
            .then(res => {
                setData({...res.data.data, actionType: ACTION_TYPES.COMPLETE, "_method": "put"});
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
        axios.get(route("acceptanceItemStates.prevSections", id))
            .then(res => {
                setOptions(res.data.sections);
            }).then(() => axios.get(route("acceptanceItemStates.show", id)))
            .then(res => {
                setData({...res.data.data, next:"", "_method": "put", actionType: ACTION_TYPES.REJECT});
            })
            .then(() => {
                setOpenForm(true);
                setLoading(false);
            });
    };

    const handleFormChange = (name, value) => setData(prevData => ({...prevData, [name]: value}));

    const handleSubmit = () => post(route("acceptanceItemStates.update", data.id), {onSuccess});

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Calculate overall statistics
    const overallStats = useMemo(() => {
        const totalSections = acceptanceItemStates?.length || 0;
        const completedSections = acceptanceItemStates?.filter(
            state => ['finished', 'rejected'].includes(state.status)
        ).length || 0;
        const overallProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

        return {
            totalSamples: groupedSamples.length,
            totalSections,
            completedSections,
            overallProgress
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
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs:12, md:6}}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <TimelineIcon fontSize="large"/>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                        Workflow Dashboard
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        {overallStats.overallProgress.toFixed(0)}% Complete • {overallStats.totalSamples} Samples • {overallStats.totalSections} Sections
                                    </Typography>
                                </Box>
                            </Stack>
                        </Grid>

                        <Grid size={{ xs:12, md:6}}>
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
                                transition: 'transform 1s ease-in-out'
                            }
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
                                fontWeight: 'bold'
                            }
                        }}
                    >
                        {groupedSamples.map((sample, index) => (
                            <Tab
                                key={sample.sampleId}
                                label={
                                    <Stack direction="column" spacing={0.5} alignItems="center">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <ScienceIcon fontSize="small" />
                                            <span>{sample.sample?.barcode || `Sample ${sample.sampleId}`}</span>
                                            <Chip
                                                size="small"
                                                label={sample.acceptanceItemStates.length}
                                                color="primary"
                                                sx={{ minWidth: 24, height: 20 }}
                                            />
                                        </Stack>
                                        {sample.patient?.fullName && (
                                            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                                {sample.patient.fullName}
                                            </Typography>
                                        )}
                                    </Stack>
                                }
                                id={`sample-tab-${index}`}
                                aria-controls={`sample-tabpanel-${index}`}
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 120
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
