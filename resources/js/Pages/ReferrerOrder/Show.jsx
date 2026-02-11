import React, {useState} from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid2 as Grid,
    IconButton,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Typography,
    Avatar,
    ListItemButton,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PatientAddForm from "./Components/Form";
import AcceptanceForm from "./Components/AcceptanceForm";
import AddSampleForm from "./Components/AddSampleForm";
import AddFromExistPatientForm from "./Components/AddFromExistPatientForm";
import SelectAcceptanceDialog from "./Components/SelectAcceptanceDialog";
import {router} from "@inertiajs/react";
import {
    Assignment,
    Description,
    Download,
    FileCopy,
    Person,
    PersonAdd,
    Science,
    CalendarToday,
    Email,
    Phone,
    LocationOn,
    HomeWork,
    Public,
    Male,
    Female,
    Fingerprint,
    Info,
    MedicalServices,
    Add,
    CheckCircle,
    Timeline,
    ExpandMore,
    ExpandLess,
    Biotech,
    LocalShipping,
    AssignmentTurnedIn,
    MergeType
} from "@mui/icons-material";
import axios from "axios";
import PageHeader from "@/Components/PageHeader.jsx";

// Custom Tab Panel Component
function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`order-tabpanel-${index}`}
            aria-labelledby={`order-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{py: 3}}>{children}</Box>}
        </div>
    );
}

// Patient Card Component
const PatientCard = ({patient, index, isMultiple, onSelectPatient,mainPatientID}) => {
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        try {
            return new Date(dateString).toLocaleDateString('en-GB');
        } catch (e) {
            return dateString;
        }
    };

    const getGenderInfo = (gender) => {
        const numGender = Number(gender);
        return numGender === 1
            ? {icon: <Male/>, label: "Male", color: "primary.main"}
            : {icon: <Female/>, label: "Female", color: "secondary.main"};
    };

    const genderInfo = getGenderInfo(patient.gender);
    const hasServerId = (patient.server_id||(patient.is_main&&mainPatientID)) ?? false;
    return (
        <Paper
            elevation={patient.is_main ? 3 : 1}
            onClick={() => !hasServerId && onSelectPatient && onSelectPatient(patient)}
            sx={{
                p: 3,
                height: '100%',
                border: patient.is_main ? '2px solid' : '1px solid',
                borderColor: patient.is_main ? 'primary.main' : 'divider',
                bgcolor: patient.is_main ? 'primary.50' : 'background.paper',
                transition: 'all 0.3s ease',
                cursor: !hasServerId ? 'pointer' : 'default',
                position: 'relative',
                '&:hover': {
                    boxShadow: !hasServerId ? 6 : (patient.is_main ? 3 : 1),
                    transform: !hasServerId ? 'translateY(-2px)' : 'none'
                }
            }}
        >
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                        sx={{
                            bgcolor: patient.is_main ? 'primary.main' : 'grey.400',
                            width: 56,
                            height: 56
                        }}
                    >
                        <Person fontSize="large"/>
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            {patient.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Ref ID: {patient.reference_id || "N/A"}
                        </Typography>
                    </Box>
                </Stack>
                <Stack spacing={1} alignItems="flex-end">
                    {patient.is_main && (
                        <Chip
                            label="Main Patient"
                            color="primary"
                            size="small"
                            sx={{fontWeight: 600}}
                        />
                    )}
                    {!hasServerId && (
                        <Chip
                            label="Click to Add"
                            color="warning"
                            size="small"
                            icon={<PersonAdd fontSize="small"/>}
                            sx={{fontWeight: 600}}
                        />
                    )}
                </Stack>
            </Stack>

            <Divider sx={{my: 2}}/>

            {/* Patient Details */}
            <Grid container spacing={2}>
                <Grid size={{xs: 12, sm: 6}}>
                    <Stack spacing={1.5}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            {genderInfo.icon}
                            <Typography variant="body2" color="text.secondary">
                                <strong>Gender:</strong> {genderInfo.label}
                            </Typography>
                        </Box>

                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <CalendarToday fontSize="small" color="action"/>
                            <Typography variant="body2" color="text.secondary">
                                <strong>DOB:</strong> {formatDate(patient.dateOfBirth)}
                            </Typography>
                        </Box>

                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Public fontSize="small" color="action"/>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Nationality:</strong> {patient.nationality?.label || "N/A"}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                <Grid size={{xs: 12, sm: 6}}>
                    <Stack spacing={1.5}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Fingerprint fontSize="small" color="action"/>
                            <Typography variant="body2" color="text.secondary">
                                <strong>ID No:</strong> {patient.id_no || "N/A"}
                            </Typography>
                        </Box>

                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Info fontSize="small" color="action"/>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Consanguineous:</strong>{" "}
                                {patient.consanguineousParents === "1" ? "Yes" :
                                    patient.consanguineousParents === "0" ? "No" : "Unknown"}
                            </Typography>
                        </Box>

                        {patient.isFetus && (
                            <Chip
                                label="Fetus"
                                size="small"
                                color="info"
                                icon={<Biotech fontSize="small"/>}
                            />
                        )}
                    </Stack>
                </Grid>

                {/* Contact Information (only for main patient) */}
                {patient.is_main && patient.contact && (
                    <Grid size={{xs: 12}}>
                        <Divider sx={{my: 2}}>
                            <Chip label="Contact Information" size="small"/>
                        </Divider>
                        <Stack spacing={1}>
                            {patient.contact.email && (
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <Email fontSize="small" color="action"/>
                                    <Typography variant="body2">{patient.contact.email}</Typography>
                                </Box>
                            )}
                            {patient.contact.phone && (
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <Phone fontSize="small" color="action"/>
                                    <Typography variant="body2">{patient.contact.phone}</Typography>
                                </Box>
                            )}
                            {patient.contact.address && (
                                <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1}}>
                                    <HomeWork fontSize="small" color="action" sx={{mt: 0.5}}/>
                                    <Typography variant="body2">
                                        {patient.contact.address}
                                        {patient.contact.city && <>, {patient.contact.city}</>}
                                        {patient.contact.state && <>, {patient.contact.state}</>}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </Paper>
    );
};

// Test Order Item Component
const TestOrderItem = ({orderItem, index}) => {
    const [expanded, setExpanded] = useState(true);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-GB');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Paper elevation={2} sx={{mb: 2, overflow: 'hidden'}}>
            {/* Test Header */}
            <ListItemButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                    bgcolor: 'primary.50',
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    py: 2
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center" sx={{flex: 1}}>
                    <Avatar sx={{bgcolor: 'primary.main'}}>
                        <MedicalServices/>
                    </Avatar>
                    <Box sx={{flex: 1}}>
                        <Typography variant="h6" fontWeight={600}>
                            {orderItem.test?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Code: {orderItem.test?.code}
                        </Typography>
                    </Box>
                    <Chip
                        label={`${orderItem.samples?.length || 0} Samples`}
                        color="primary"
                        size="small"
                    />
                    <Chip
                        label={`${orderItem.patients?.length || 0} Patients`}
                        color="secondary"
                        size="small"
                    />
                </Stack>
                {expanded ? <ExpandLess/> : <ExpandMore/>}
            </ListItemButton>

            {/* Expandable Content */}
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{p: 3}}>
                    {/* Test Details */}
                    {orderItem.test?.turnaroundTime && (
                        <Alert severity="info" sx={{mb: 3}}>
                            <Typography variant="body2">
                                <strong>Turnaround Time:</strong> {orderItem.test.turnaroundTime} days
                            </Typography>
                        </Alert>
                    )}

                    {/* Patients */}
                    {orderItem.patients?.length > 0 && (
                        <Box sx={{mb: 3}}>
                            <Typography variant="subtitle2" gutterBottom
                                        sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Person fontSize="small" color="primary"/>
                                Associated Patients
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{mt: 1}}>
                                {orderItem.patients.map((patient) => (
                                    <Chip
                                        key={patient.id}
                                        avatar={<Avatar>{patient.fullName.charAt(0)}</Avatar>}
                                        label={patient.fullName}
                                        variant={patient.is_main ? "filled" : "outlined"}
                                        color={patient.is_main ? "primary" : "default"}
                                        sx={{mb: 1}}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}

                    {/* Samples */}
                    {orderItem.samples?.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom
                                        sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Science fontSize="small" color="primary"/>
                                Sample Requirements
                            </Typography>
                            <Grid container spacing={2} sx={{mt: 0.5}}>
                                {orderItem.samples.map((sample, idx) => (
                                    <Grid size={{xs: 12, sm: 6, md: 4}} key={sample.id || idx}>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                bgcolor: 'grey.50',
                                                '&:hover': {bgcolor: 'grey.100'}
                                            }}
                                        >
                                            <Stack spacing={1}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    Sample #{idx + 1}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    <strong>Type:</strong> {sample.sampleType?.name || "Unknown"}
                                                </Typography>
                                                {sample.sampleId && (
                                                    <Typography variant="body2" color="text.secondary">
                                                        <strong>ID:</strong> {sample.sampleId}
                                                    </Typography>
                                                )}
                                                {sample.collectionDate && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Collected: {formatDate(sample.collectionDate)}
                                                    </Typography>
                                                )}
                                                {sample.sampleType?.sample_id_required === 1 && !sample.sampleId && (
                                                    <Chip
                                                        label="ID Required"
                                                        size="small"
                                                        color="warning"
                                                        sx={{mt: 1}}
                                                    />
                                                )}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

// Status Timeline Component
const StatusTimeline = ({referrerOrder}) => {
    // Determine current step based on actual order state
    const getCurrentStep = () => {
        const samplesCollected = !referrerOrder.needs_add_sample;
        const hasAcceptance = Boolean(referrerOrder.acceptance_id);
        const hasPatient = Boolean(referrerOrder.patient_id);

        if (samplesCollected) return 'samples_collected';
        if (hasAcceptance) return 'acceptance_created';
        if (hasPatient) return 'patient_added';
        return 'finalize';
    };

    const getStepStatus = (step) => {
        const steps = ['finalize', 'patient_added', 'acceptance_created', 'samples_collected'];
        const currentStep = getCurrentStep();
        const currentStepIndex = steps.indexOf(currentStep);
        const stepIndex = steps.indexOf(step);

        // If we're at the last step (samples_collected), mark it as completed
        if (currentStep === 'samples_collected' && step === 'samples_collected') return 'completed';

        if (stepIndex < currentStepIndex) return 'completed';
        if (stepIndex === currentStepIndex) return 'active';
        return 'pending';
    };

    const steps = [
        {key: 'finalize', label: 'Order Finalized', icon: <CheckCircle/>},
        {key: 'patient_added', label: 'Patient Added', icon: <Person/>},
        {key: 'acceptance_created', label: 'Acceptance Created', icon: <AssignmentTurnedIn/>},
        {key: 'samples_collected', label: 'Samples Collected', icon: <Science/>}
    ];

    return (
        <Paper elevation={2} sx={{p: 3, mb: 3}}>
            <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                <Timeline color="primary"/>
                Order Progress
            </Typography>
            <Stack direction="row" spacing={2} sx={{mt: 3, position: 'relative'}}>
                {steps.map((step, index) => {
                    const status = getStepStatus(step.key);
                    return (
                        <Box key={step.key} sx={{flex: 1, position: 'relative'}}>
                            <Stack alignItems="center" spacing={1}>
                                <Avatar
                                    sx={{
                                        bgcolor: status === 'completed' ? 'success.main' :
                                            status === 'active' ? 'primary.main' : 'grey.300',
                                        width: 48,
                                        height: 48
                                    }}
                                >
                                    {step.icon}
                                </Avatar>
                                <Typography
                                    variant="caption"
                                    align="center"
                                    fontWeight={status === 'active' ? 600 : 400}
                                    color={status === 'pending' ? 'text.secondary' : 'text.primary'}
                                >
                                    {step.label}
                                </Typography>
                            </Stack>
                            {index < steps.length - 1 && (
                                <Divider
                                    sx={{
                                        position: 'absolute',
                                        top: 24,
                                        left: '50%',
                                        right: '-50%',
                                        bgcolor: status === 'completed' ? 'success.main' : 'grey.300',
                                        height: 2,
                                        zIndex: 0
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
};

const Show = ({referrerOrder, errors = {}}) => {
    // State management
    const [openAddPatient, setOpenAddPatient] = useState(false);
    const [openAddFromExist, setOpenAddFromExist] = useState(false);
    const [openAddAcceptance, setOpenAddAcceptance] = useState(false);
    const [openAddSample, setOpenAddSample] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [openPatientActionModal, setOpenPatientActionModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [barcodes, setBarcodes] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [notification, setNotification] = useState({open: false, message: "", severity: "info"});
    // Pooling state
    const [openSelectAcceptance, setOpenSelectAcceptance] = useState(false);
    const [selectedExistingAcceptance, setSelectedExistingAcceptance] = useState(null);
    const [acceptanceItems, setAcceptanceItems] = useState([]);

    const acceptanceData = {
        patient: referrerOrder.patient,
        referrer: referrerOrder.referrer,
        referred: true,
        samplerGender: 1,
        out_patient: false,
        howReport: {},
        acceptanceItems: {
            panels: [],
            tests: []
        },
        referenceCode: referrerOrder?.orderInformation?.patient?.reference_id,
        prescription: null,
        existing_acceptance_id: selectedExistingAcceptance?.id || null,
    };

    // Helper function to clean acceptance item data
    const cleanAcceptanceItem = (item) => ({
        method_test: { id: item.method_test?.id },
        price: item.price,
        discount: item.discount,
        sampleless: item.sampleless || false,
        no_sample: item.no_sample || 1,
        samples: (item.samples || []).map(sample => ({
            patients: (sample.patients || []).map(p => ({ id: p.id })),
            sampleType: sample.sampleType
        })),
        customParameters: {
            sampleType: item.customParameters?.sampleType,
            discounts: item.customParameters?.discounts || [],
            price: item.customParameters?.price
        },
        details: item.details,
        deleted: item.deleted || false
    });

    // Action handlers
    const handleSubmitAcceptance = (data) => {
        // Clean up data to only send what's needed
        const cleanedData = {
            referenceCode: data.referenceCode,
            out_patient: data.out_patient,
            howReport: data.howReport,
            existing_acceptance_id: data.existing_acceptance_id,
            acceptanceItems: {
                tests: (data.acceptanceItems?.tests || []).map(cleanAcceptanceItem),
                panels: (data.acceptanceItems?.panels || []).map(panel => ({
                    ...cleanAcceptanceItem(panel),
                    acceptanceItems: (panel.acceptanceItems || []).map(cleanAcceptanceItem)
                }))
            }
        };

        router.post(route("referrerOrders.acceptance", referrerOrder.id), cleanedData, {
            onSuccess: handleCloseAddAcceptance
        });
    };

    const handleAddPatient = () => setOpenAddPatient(true);
    const handleAddAcceptance = () => setOpenAddAcceptance(true);
    const handleAddSample = () => {
        setLoading(true);
        axios.get(route("api.sampleCollection.list", referrerOrder.acceptance_id))
            .then(res => {
                setBarcodes(res.data.barcodes);

                // For pooling orders, extract all unique acceptance items
                if (referrerOrder.pooling) {
                    const allItems = [];
                    const itemIds = new Set();
                    res.data.barcodes.forEach(barcode => {
                        barcode.items?.forEach(item => {
                            if (!itemIds.has(item.id)) {
                                itemIds.add(item.id);
                                allItems.push(item);
                            }
                        });
                    });
                    setAcceptanceItems(allItems);
                }

                setOpenAddSample(true);
            })
            .catch(error => {
                setNotification({
                    open: true,
                    message: "Failed to load barcodes: " + (error.response?.data?.message || "Unknown error"),
                    severity: "error"
                });
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleCloseAddPatient = () => {
        setOpenAddPatient(false);
        setOpenAddFromExist(false);
        setOpenPatientActionModal(false);
        setSelectedPatient(null);
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setOpenPatientActionModal(true);
    };

    const handleAddNewPatient = () => {
        setOpenPatientActionModal(false);
        setOpenAddPatient(true);
    };

    const handleSelectFromExisting = () => {
        setOpenPatientActionModal(false);
        setOpenAddFromExist(true);
    };

    const handleCloseAddAcceptance = () => {
        setOpenAddAcceptance(false);
        setSelectedExistingAcceptance(null);
    };
    const handleAddSampleClose = () => {
        setOpenAddSample(false);
        setAcceptanceItems([]);
    };
    const handleAddFromExistsPatient = () => setOpenAddFromExist(true);
    const handleTabChange = (event, newValue) => setActiveTab(newValue);
    const gotoPage = url => () => router.visit(url);
    const handleCloseNotification = () => setNotification({...notification, open: false});

    // Pooling handlers
    const handleOpenSelectAcceptance = () => setOpenSelectAcceptance(true);
    const handleCloseSelectAcceptance = () => setOpenSelectAcceptance(false);
    const handleSelectExistingAcceptance = (acceptance) => {
        setSelectedExistingAcceptance(acceptance);
        setOpenAddAcceptance(true);
    };
    const handleCreateNewFromPooling = () => {
        setSelectedExistingAcceptance(null);
        setOpenAddAcceptance(true);
    };

    // Determine completion status
    const hasPatient = Boolean(referrerOrder.patient_id);
    const hasAcceptance = Boolean(referrerOrder.acceptance_id);
    const samplesCollected = !referrerOrder.needs_add_sample;

    const getCompletionPercentage = () => {
        let percentage = 0;
        if (hasPatient) percentage += 50;
        if (hasAcceptance) percentage += 25;
        if (samplesCollected) percentage += 25;
        return percentage;
    };

    const getCompletionColor = () => {
        const percentage = getCompletionPercentage();
        if (percentage < 50) return "error";
        if (percentage < 100) return "warning";
        return "success";
    };

    const {id: patientID, ...patient} = referrerOrder?.orderInformation?.patient || {};
    // Use patients array if available, otherwise fall back to single patient object
    const patients = referrerOrder?.orderInformation?.patients?.length > 0
        ? referrerOrder.orderInformation.patients
        : (referrerOrder?.orderInformation?.patient ? [referrerOrder.orderInformation.patient] : []);
    const orderItems = referrerOrder?.orderInformation?.orderItems || [];

    return (
        <>
            {/* Page Header */}
            <PageHeader
                icon={<Assignment sx={{mr: 1}}/>}
                title={`Order #${referrerOrder.order_id}`}
                subtitle={`Referrer: ${referrerOrder?.referrer?.fullName} | Status: ${referrerOrder?.orderInformation?.status}`}
                actions={[
                    <Chip
                        size="medium"
                        color={getCompletionColor()}
                        label={`${getCompletionPercentage()}% Complete`}
                        icon={<Timeline/>}
                    />
                ]}
            />

            {/* Status Timeline */}
            <StatusTimeline referrerOrder={referrerOrder}/>

            {/* Main Content */}
            <Paper sx={{borderRadius: 2, overflow: 'hidden'}}>
                {/* Tabs Navigation */}
                <Box sx={{borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50'}}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none',
                                fontSize: '1rem'
                            }
                        }}
                    >
                        <Tab label="Patients & Tests" icon={<Person/>} iconPosition="start"/>
                        <Tab label="Order Forms" icon={<Description/>} iconPosition="start"/>
                        <Tab label="Consents" icon={<Assignment/>} iconPosition="start"/>
                        <Tab label="Documents" icon={<FileCopy/>} iconPosition="start"/>
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                <Box sx={{px: 3}}>
                    {/* Patients & Tests Tab */}
                    <TabPanel value={activeTab} index={0}>
                        {/* Patients Section */}
                        <Box sx={{mb: 4}}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h5" fontWeight={600}>
                                    Patients ({patients.length})
                                </Typography>
                                {!referrerOrder.patient_id && (
                                    <Stack direction="row" spacing={2}>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddPatient}
                                            startIcon={<PersonAdd/>}
                                        >
                                            Add New Patient
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleAddFromExistsPatient}
                                            startIcon={<Person/>}
                                        >
                                            Select Existing
                                        </Button>
                                    </Stack>
                                )}
                                {referrerOrder.patient_id && (
                                    <Button
                                        variant="contained"
                                        onClick={gotoPage(route("patients.show", referrerOrder.patient_id))}
                                        startIcon={<Person/>}
                                    >
                                        View Patient Details
                                    </Button>
                                )}
                            </Stack>

                            <Grid container spacing={3}>
                                {patients.map((patientData, index) => (
                                    <Grid size={{xs: 12, md: patients.length > 1 ? 6 : 12}}
                                          key={patientData.id || index}>
                                        <PatientCard
                                            mainPatientID={referrerOrder.patient_id}
                                            patient={patientData}
                                            index={index}
                                            isMultiple={patients.length > 1}
                                            onSelectPatient={handleSelectPatient}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Tests & Samples Section */}
                        <Box>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="h5" fontWeight={600}>
                                        Tests & Samples ({orderItems.length})
                                    </Typography>
                                    {referrerOrder.pooling && (
                                        <Chip
                                            icon={<MergeType/>}
                                            label="Pooling Order"
                                            color="info"
                                            size="small"
                                        />
                                    )}
                                </Stack>
                                {referrerOrder.patient_id && (
                                    <Stack direction="row" spacing={2}>
                                        {referrerOrder.acceptance_id ? (
                                            <>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={gotoPage(route("acceptances.show", referrerOrder.acceptance_id))}
                                                    startIcon={<Description/>}
                                                >
                                                    View Acceptance
                                                </Button>
                                                {referrerOrder.needs_add_sample && (
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={handleAddSample}
                                                        startIcon={loading ? <CircularProgress size={20}/> : <Add/>}
                                                        disabled={loading}
                                                    >
                                                        Add Samples
                                                    </Button>
                                                )}
                                            </>
                                        ) : referrerOrder.pooling ? (
                                            <Button
                                                variant="contained"
                                                onClick={handleOpenSelectAcceptance}
                                                startIcon={<MergeType/>}
                                                color="info"
                                            >
                                                Select Existing Acceptance
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                onClick={handleAddAcceptance}
                                                startIcon={<Add/>}
                                            >
                                                Create Acceptance
                                            </Button>
                                        )}
                                    </Stack>
                                )}
                            </Stack>

                            {orderItems.length > 0 ? (
                                orderItems.map((orderItem, index) => (
                                    <TestOrderItem
                                        key={orderItem.id || index}
                                        orderItem={orderItem}
                                        index={index}
                                    />
                                ))
                            ) : (
                                <Alert severity="info">No tests have been ordered yet.</Alert>
                            )}
                        </Box>
                    </TabPanel>

                    {/* Order Forms Tab */}
                    <TabPanel value={activeTab} index={1}>
                        {referrerOrder.orderInformation.orderForms &&
                        Object.keys(referrerOrder.orderInformation.orderForms).length > 0 ? (
                            <Grid container spacing={3}>
                                {Object.entries(referrerOrder.orderInformation.orderForms).map(([formKey, formData], index) => (
                                    <Grid size={{xs: 12, md: 6}} key={index}>
                                        <Paper elevation={2} sx={{p: 3}}>
                                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                                {formKey}
                                            </Typography>
                                            <Divider sx={{mb: 2}}/>
                                            <Stack spacing={2}>
                                                {formData.map((item, idx) => (
                                                    <Box key={idx}>
                                                        <Typography variant="body2" color="text.secondary"
                                                                    fontWeight={500}>
                                                            {item.label}
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {item.value || "Not specified"}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info">No order form data available.</Alert>
                        )}
                    </TabPanel>

                    {/* Consents Tab */}
                    <TabPanel value={activeTab} index={2}>
                        {referrerOrder.orderInformation.consents ? (
                            <Grid container spacing={3}>
                                {/* Consent Confirmations */}
                                {Object.entries(referrerOrder.orderInformation.consents)
                                    .filter(([key]) => key !== 'consentForm')
                                    .map(([key, consent]) => (
                                        <Grid size={{xs: 12}} key={key}>
                                            <Paper
                                                elevation={2}
                                                sx={{
                                                    p: 3,
                                                    bgcolor: consent.value === "1" ? 'success.50' : 'warning.50',
                                                    border: '2px solid',
                                                    borderColor: consent.value === "1" ? 'success.main' : 'warning.main'
                                                }}
                                            >
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: consent.value === "1" ? 'success.main' : 'warning.main'
                                                        }}
                                                    >
                                                        {consent.value === "1" ? <CheckCircle/> : <Info/>}
                                                    </Avatar>
                                                    <Box sx={{flex: 1}}>
                                                        <Typography variant="body1">
                                                            {consent.title || `Consent ${key}`}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={consent.value === "1" ? "Accepted" : "Not Accepted"}
                                                        color={consent.value === "1" ? "success" : "warning"}
                                                    />
                                                </Stack>
                                            </Paper>
                                        </Grid>
                                    ))}

                                {/* Consent Form Files */}
                                {referrerOrder.orderInformation.consents.consentForm && (
                                    <Grid size={{xs: 12}}>
                                        <Paper elevation={2} sx={{p: 3}}>
                                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                                Consent Form Documents
                                            </Typography>
                                            <Divider sx={{mb: 2}}/>
                                            <Stack spacing={2}>
                                                {referrerOrder.orderInformation.consents.consentForm.map((file, index) => (
                                                    <Paper
                                                        key={index}
                                                        variant="outlined"
                                                        sx={{
                                                            p: 2,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 2,
                                                            '&:hover': {bgcolor: 'action.hover'}
                                                        }}
                                                    >
                                                        <Avatar sx={{bgcolor: 'primary.main'}}>
                                                            <Description/>
                                                        </Avatar>
                                                        <Box sx={{flex: 1}}>
                                                            <Typography variant="body1" fontWeight={500}>
                                                                Consent Form {index + 1}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {file}
                                                            </Typography>
                                                        </Box>
                                                        <IconButton color="primary">
                                                            <Download/>
                                                        </IconButton>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    </Grid>
                                )}
                            </Grid>
                        ) : (
                            <Alert severity="info">No consent information available.</Alert>
                        )}
                    </TabPanel>

                    {/* Documents Tab */}
                    <TabPanel value={activeTab} index={3}>
                        {referrerOrder.owned_documents && referrerOrder.owned_documents.length > 0 ? (
                            <Grid container spacing={2}>
                                {referrerOrder.owned_documents.map((item, index) => (
                                    <Grid size={{xs: 12, sm: 6, md: 4}} key={index}>
                                        <Paper
                                            elevation={2}
                                            sx={{
                                                p: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 2,
                                                '&:hover': {
                                                    boxShadow: 6,
                                                    transform: 'translateY(-2px)'
                                                },
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <Avatar sx={{width: 64, height: 64, bgcolor: 'primary.main'}}>
                                                <FileCopy fontSize="large"/>
                                            </Avatar>
                                            <Typography variant="h6" align="center">
                                                Document #{index + 1}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" align="center">
                                                {item.hash.substring(0, 16)}...
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                startIcon={<Download/>}
                                                component="a"
                                                href={route("documents.download", item.hash)}
                                                target="_blank"
                                                fullWidth
                                            >
                                                Download
                                            </Button>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Alert severity="info">No documents attached to this order.</Alert>
                        )}
                    </TabPanel>
                </Box>
            </Paper>

            {/* Modals */}
            {/* Patient Action Selection Dialog */}
            <Dialog
                open={openPatientActionModal}
                onClose={() => setOpenPatientActionModal(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{bgcolor: 'primary.main'}}>
                            <Person/>
                        </Avatar>
                        <Box>
                            <Typography variant="h6">
                                Add Patient to System
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedPatient?.fullName}
                            </Typography>
                        </Box>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{mb: 3}}>
                        This patient from the order needs to be added to the system. Choose an option below.
                    </Alert>

                    <Stack spacing={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                border: '2px solid',
                                borderColor: 'primary.main',
                                bgcolor: 'primary.50',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: 4,
                                    transform: 'translateY(-2px)'
                                }
                            }}
                            onClick={handleAddNewPatient}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{bgcolor: 'primary.main', width: 48, height: 48}}>
                                    <PersonAdd/>
                                </Avatar>
                                <Box sx={{flex: 1}}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Add New Patient
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Create a new patient record with the information from this order
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                border: '2px solid',
                                borderColor: 'secondary.main',
                                bgcolor: 'secondary.50',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: 4,
                                    transform: 'translateY(-2px)'
                                }
                            }}
                            onClick={handleSelectFromExisting}
                        >
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{bgcolor: 'secondary.main', width: 48, height: 48}}>
                                    <Person/>
                                </Avatar>
                                <Box sx={{flex: 1}}>
                                    <Typography variant="h6" fontWeight={600}>
                                        Select Existing Patient
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Link this order to an existing patient in the system
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPatientActionModal(false)}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            <AddFromExistPatientForm
                open={openAddFromExist}
                referrerOrder={referrerOrder}
                onClose={handleCloseAddPatient}
            />

            <PatientAddForm
                defaultValues={selectedPatient ? {...selectedPatient, idNo: selectedPatient?.id_no} : {
                    ...patient,
                    idNo: patient?.id_no
                }}
                id={referrerOrder.id}
                open={openAddPatient}
                onClose={handleCloseAddPatient}
                withRelative={selectedPatient && !selectedPatient.is_main}
                mainPatientId={referrerOrder.patient_id}
            />

            {referrerOrder?.patient && (
                <AcceptanceForm
                    errors={errors}
                    initialData={acceptanceData}
                    onSubmit={handleSubmitAcceptance}
                    open={openAddAcceptance}
                    id={referrerOrder.id}
                    onClose={handleCloseAddAcceptance}
                    requestedTests={
                        orderItems.length > 0
                            ? orderItems.map(item => item.test)
                            : referrerOrder?.orderInformation?.tests
                    }
                    maxDiscount={100}
                    existingAcceptanceId={selectedExistingAcceptance?.id}
                    isPoolingMode={referrerOrder.pooling && !!selectedExistingAcceptance}
                />
            )}

            {referrerOrder.pooling && referrerOrder.patient_id && (
                <SelectAcceptanceDialog
                    open={openSelectAcceptance}
                    onClose={handleCloseSelectAcceptance}
                    patientId={referrerOrder.patient_id}
                    referrerId={referrerOrder.referrer_id}
                    onSelectAcceptance={handleSelectExistingAcceptance}
                    onCreateNew={handleCreateNewFromPooling}
                    poolingOnly={Boolean(referrerOrder.pooling)}
                />
            )}

            {(referrerOrder.acceptance_id && barcodes.length > 0) && (
                <AddSampleForm
                    referrerOrder={referrerOrder}
                    onClose={handleAddSampleClose}
                    samples={
                        orderItems.length > 0
                            ? orderItems.flatMap(item => item.samples || [])
                            : referrerOrder.orderInformation.samples
                    }
                    open={openAddSample}
                    barcodes={barcodes}
                    isPooling={referrerOrder.pooling}
                    allAcceptanceItems={acceptanceItems}
                />
            )}

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{width: '100%'}}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </>
    );
};

// Breadcrumbs configuration
const breadCrumbs = [
    {
        title: "Referrer Orders",
        link: route("referrer-orders.index"),
        icon: null,
    },
];

// Layout wrapper
Show.layout = (page) => (
    <ClientLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: "Order #" + page.props.referrerOrder.order_id,
                link: null,
                icon: null
            }
        ]}
        children={page}
    />
);

export default Show;
