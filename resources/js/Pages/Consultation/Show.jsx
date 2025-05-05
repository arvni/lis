import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import DoneForm from "@/Pages/Consultation/Components/DoneForm";
import Counter from "@/Components/Counter";
import {router, useForm} from "@inertiajs/react";
import React, {useState} from "react";
import {useSnackbar} from "notistack";

// Material UI components
import {
    Container,
    Typography,
    Divider,
    Button,
    Paper,
    Box,
    Chip,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Tooltip,
    Grid2 as Grid,
    Stack
} from "@mui/material";

// Material UI icons
import {
    MedicalServicesOutlined,
    CalendarToday,
    PersonOutlined,
    PlayArrow,
    CheckCircleOutline,
    Edit,
    ArrowBack,
    LocalHospital,
    EventAvailable,
    AccessTime,
    AccessTimeFilledOutlined,
    Assignment,
    Print,
    Share,
    Description
} from "@mui/icons-material";
import Drawing from "@/Components/Drawing.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

// Status badge component with appropriate colors
const StatusBadge = ({status}) => {
    const getColor = () => {
        switch (status?.toLowerCase()) {
            case 'waiting':
                return 'warning';
            case 'started':
                return 'info';
            case 'done':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Chip
            label={status || 'Unknown'}
            color={getColor()}
            size="medium"
            sx={{
                textTransform: 'capitalize',
                fontWeight: 500,
                px: 1,
                borderRadius: 2
            }}
        />
    );
};

// Format date for better display
const formatDate = (dateString) => {
    if (!dateString) return "Not specified";

    try {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
};

const Show = ({
                  consultant,
                  patient,
                  consultation,
                  status,
                  canEdit
              }) => {
    const {
        data,
        setData,
        post,
        processing,
        reset,
    } = useForm({
        information: {
            report: "",
            ...consultation.information
        },
        _method: "put"
    });
    const {enqueueSnackbar} = useSnackbar();
    const [openDoneForm, setOpenDoneForm] = useState(false);

    const handleOpenDoneForm = () => {
        setOpenDoneForm(true);
    };

    const handleDoneFormChange = e => setData(previousData => ({
        ...previousData,
        information: {
            ...previousData.information,
            [e.target.name]: e.target.value
        }
    }));

    const handleDoneFormClose = () => {
        reset();
        setOpenDoneForm(false);
    };

    const start = () => {
        post(route("consultations.start", consultation.id));
    };

    const update = () => {
        post(route("consultations.update", consultation.id), {
            onSuccess: () => {
                setOpenDoneForm(false);
                enqueueSnackbar(status, {variant: "success"});
            }
        });
    };

    const handleAddAcceptance = () => router.visit(route("acceptances.create", consultation.patient.id));

    const goBack = () => router.visit(route("consultations.index"));

    // Render different actions based on consultation status
    const renderActionContent = () => {
        switch (consultation.status?.toLowerCase()) {
            case "booked":
            case "waiting":
                return (
                    <Button
                        onClick={start}
                        variant="contained"
                        color="primary"
                        startIcon={<PlayArrow/>}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 4
                            }
                        }}
                    >
                        Start Consultation
                    </Button>
                );
            case "started":
                return (
                    <Button
                        onClick={handleOpenDoneForm}
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleOutline/>}
                        sx={{
                            borderRadius: 2,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 4
                            }
                        }}
                    >
                        Complete Consultation
                    </Button>
                );
            case "done":
                return (
                    <Box sx={{mt: 2, width: "100%"}}>
                        <Card elevation={1} sx={{mb: 3, borderRadius: 2}}>
                            <CardHeader
                                title={
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <Assignment color="primary"/>
                                        <Typography variant="h6">Consultation Report</Typography>
                                    </Box>
                                }
                                action={
                                    <Box sx={{display: 'flex', gap: 1}}>
                                        <Tooltip title="Print Report">
                                            <IconButton size="small" color="primary">
                                                <Print/>
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Share Report">
                                            <IconButton size="small" color="primary">
                                                <Share/>
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                                sx={{borderBottom: '1px solid #f0f0f0', pb: 1}}
                            />
                            <CardContent>
                                {consultation.information?.image && (
                                    <Box sx={{
                                        mb: 2,
                                        borderRadius: 2,
                                        minHeight: "500px",
                                        height: "100%",
                                        width: "100%",
                                        overflow: 'auto',
                                        display: "flex",
                                        flexDirection: "column"
                                    }}>

                                        {!consultation.information.image?.nodes ? <img
                                                src={consultation.information.image}
                                                alt="Consultation Image"
                                                style={{
                                                    width: "100%",
                                                    maxHeight: "400px",
                                                    objectFit: "contain"
                                                }}
                                            /> :
                                            <Drawing disabled
                                                     defaultValue={consultation.information.image}/>}
                                    </Box>
                                )}
                                <Box
                                    sx={{
                                        p: 2,
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 2,
                                        mb: 2,
                                        minHeight: '100px',
                                        backgroundColor: '#fafafa'
                                    }}
                                >
                                    <div
                                        dangerouslySetInnerHTML={{__html: consultation.information.report || 'No report content available.'}}/>
                                </Box>

                                {canEdit && (
                                    <Button
                                        onClick={handleOpenDoneForm}
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<Edit/>}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Edit Report
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                );
            default:
                return <Typography color="text.secondary">Status not recognized</Typography>;
        }
    };

    return (
        <>
            <PageHeader
                title={`Consultation #${consultation.id}`}
                actions={<Stack direction="row" spacing={2} alignItems="center">
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack/>}
                    onClick={goBack}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none'
                    }}
                >
                    Back to List
                </Button>
                <StatusBadge status={consultation.status}/>
                    {/*{consultation.status === "done" && (*/}
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<Description/>}
                            onClick={handleAddAcceptance}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                boxShadow: 2
                            }}
                        >
                            Add Acceptance
                        </Button>
                    {/*)}*/}
            </Stack>}/>

            <Grid container spacing={3}>
                <Grid size={{xs: 12}}>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 0,
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: '100%'
                        }}
                    >
                        <Box sx={{bgcolor: 'primary.main', color: 'white', p: 2}}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <PersonOutlined/>
                                <Typography variant="h6">Patient Information</Typography>
                            </Box>
                        </Box>
                        <Box sx={{p: 2}}>
                            <PatientInfo patient={patient} viewPatient={true}/>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{xs: 12}}>
                    <Paper
                        elevation={2}
                        sx={{
                            p: 0,
                            borderRadius: 2,
                            overflow: 'hidden',
                            height: '100%'
                        }}
                    >
                        <Box sx={{bgcolor: 'primary.main', color: 'white', p: 2}}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <MedicalServicesOutlined/>
                                <Typography variant="h6">Consultation Details</Typography>
                            </Box>
                        </Box>

                        <Box sx={{p: 3}}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <LocalHospital color="primary" fontSize="small"/>
                                        <Typography variant="body2" color="text.secondary">Consultant</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{mt: 0.5, fontWeight: 500}}>
                                        {consultant.name || 'Not assigned'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <CalendarToday color="primary" fontSize="small"/>
                                        <Typography variant="body2" color="text.secondary">Due Date</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{mt: 0.5}}>
                                        {formatDate(consultation.dueDate) || 'Not scheduled'}
                                    </Typography>
                                </Grid>

                                {consultation.started_at && (
                                    <>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <EventAvailable color="primary" fontSize="small"/>
                                                <Typography variant="body2" color="text.secondary">Started
                                                    At</Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{mt: 0.5}}>
                                                {formatDate(consultation.started_at)}
                                            </Typography>
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <AccessTimeFilledOutlined color="primary" fontSize="small"/>
                                                <Typography variant="body2" color="text.secondary">Duration</Typography>
                                            </Box>
                                            <Box sx={{mt: 0.5, display: 'flex', alignItems: 'center'}}>
                                                {consultation.status === "done" ? (
                                                    <Chip
                                                        icon={<AccessTime fontSize="small"/>}
                                                        label={`${consultation.duration} minutes`}
                                                        variant="outlined"
                                                        color="info"
                                                        size="small"
                                                        sx={{borderRadius: 1}}
                                                    />
                                                ) : (
                                                    <Counter date={consultation.started_at}/>
                                                )}
                                            </Box>
                                        </Grid>
                                    </>
                                )}
                            </Grid>

                            <Divider sx={{my: 3}}/>

                            <Box sx={{display: 'flex', justifyContent: 'center', p: 2}}>
                                {renderActionContent()}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <DoneForm
                onChange={handleDoneFormChange}
                data={data.information}
                loading={processing}
                open={openDoneForm}
                onClose={handleDoneFormClose}
                submit={update}
                title={"Consultation Report"}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: "Consultations",
        link: route("consultations.index"),
        icon: <MedicalServicesOutlined fontSize="small"/>,
    }
];

Show.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: "Consultation #" + page.props.consultation.id,
                link: "",
                icon: null
            }
        ]}
    />
);

export default Show;
