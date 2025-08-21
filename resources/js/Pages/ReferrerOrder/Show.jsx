import React, {useState} from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Divider,
    Grid2 as Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from "@mui/material";
import ClientLayout from "@/Layouts/AuthenticatedLayout";
import PatientAddForm from "./Components/Form";
import AcceptanceForm from "./Components/AcceptanceForm";
import AddSampleForm from "./Components/AddSampleForm";
import AddFromExistPatientForm from "./Components/AddFromExistPatientForm";
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
    Add
} from "@mui/icons-material";
import axios from "axios";
import PageHeader from "@/Components/PageHeader.jsx";

// Tab Panel Component for better organization
function TabPanel({children, value, index, ...other}) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`order-tabpanel-${index}`}
            aria-labelledby={`order-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{p: 3}}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const Show = ({referrerOrder, errors = {}}) => {
    // State management
    const [openAddPatient, setOpenAddPatient] = useState(false);
    const [openAddFromExist, setOpenAddFromExist] = useState(false);
    const [openAddAcceptance, setOpenAddAcceptance] = useState(false);
    const [openAddSample, setOpenAddSample] = useState(false);
    const [loading, setLoading] = useState(false);
    const [barcodes, setBarcodes] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const [notification, setNotification] = useState({open: false, message: "", severity: "info"});
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
    };
    const handleSubmitAcceptance = (data) => {
        router.post(route("referrerOrders.acceptance", referrerOrder.id), data, {onSuccess: handleCloseAddAcceptance});
    }


    // Action handlers
    const handleAddPatient = () => setOpenAddPatient(true);
    const handleAddAcceptance = () => setOpenAddAcceptance(true);
    const handleAddSample = () => {
        setLoading(true);
        axios.get(route("api.sampleCollection.list", referrerOrder.acceptance_id))
            .then(res => {
                setBarcodes(res.data.barcodes);
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
    };

    const handleCloseAddAcceptance = () => setOpenAddAcceptance(false);
    const handleAddSampleClose = () => setOpenAddSample(false);
    const handleAddFromExistsPatient = () => setOpenAddFromExist(true);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const gotoPage = url => () => router.visit(url);

    const handleCloseNotification = () => {
        setNotification({...notification, open: false});
    };

    // Helper functions for UI
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    };

    // Get gender display with icon
    const getGenderDisplay = (gender) => {
        const numGender = Number(gender);
        return numGender == 1 ?
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <Male color="primary" sx={{mr: 0.5}}/> Male
            </Box> :
            <Box sx={{display: 'flex', alignItems: 'center'}}>
                <Female color="secondary" sx={{mr: 0.5}}/> Female
            </Box>;
    };

    // Determine completion status
    const hasPatient = Boolean(referrerOrder.patient_id);
    const hasAcceptance = Boolean(referrerOrder.acceptance_id);
    const hasSamples = referrerOrder?.acceptance?.samples?.length > 0;

    // Calculate completion percentage
    const getCompletionPercentage = () => {
        let percentage = 0;
        if (hasPatient) percentage += 50;
        if (hasAcceptance) percentage += 25;
        if (hasSamples) percentage += 25;
        return percentage;
    };

    const getCompletionColor = () => {
        const percentage = getCompletionPercentage();
        if (percentage < 50) return "error";
        if (percentage < 100) return "warning";
        return "success";
    };

    const {id: patientID, ...patient} = referrerOrder?.orderInformation?.patient;

    return (
        <>
            <PageHeader icon={<Assignment sx={{mr: 1}}/>}
                        title={`Order ID: ${referrerOrder.order_id}`}
                        subtitle={`Referrer: ${referrerOrder?.referrer?.fullName}`}
                        actions={[<Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Status:
                                <Chip
                                    size="small"
                                    color={getCompletionColor()}
                                    label={`${getCompletionPercentage()}% Complete`}
                                    sx={{ml: 1}}
                                />
                            </Typography>
                            <Typography variant="subtitle1" fontWeight="600">
                                Analysis requested:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {referrerOrder?.orderInformation?.tests?.map((test) => (
                                    <Chip
                                        key={test.id}
                                        label={test.name}
                                        color="primary"
                                        size="small"
                                        icon={<MedicalServices fontSize="small"/>}
                                        sx={{my: 0.5}}
                                    />
                                ))}
                            </Stack>
                        </Box>]
                        }
            />
            <Paper sx={{p: {xs: "0.5em", md: "1em"}, mt: "1em", borderRadius: "8px"}}>
                {/* Header Section */}

                {/* Tabs Navigation */}
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                    >
                        <Tab label="Patient Details" icon={<Person/>} iconPosition="start"/>
                        <Tab label="Request Form" icon={<Description/>} iconPosition="start"/>
                        <Tab label="Files" icon={<FileCopy/>} iconPosition="start"/>
                    </Tabs>
                </Box>

                {/* Patient Details Tab */}
                <TabPanel value={activeTab} index={0}>
                    <Card elevation={2}>
                        <CardHeader
                            title={
                                <Typography variant="h6" sx={{display: 'flex', alignItems: 'center'}}>
                                    <Person sx={{mr: 1}}/>
                                    Patient Details
                                </Typography>
                            }
                            sx={{
                                background: "linear-gradient(to right, #e0e0e0, #f5f5f5)",
                                borderBottom: "1px solid #ddd"
                            }}
                        />
                        <CardContent>
                            <Grid container spacing={3}>
                                {/* Patient Information */}
                                <Grid size={{xs: 12, md: 6}}>
                                    <Box sx={{mb: 2}}>
                                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                            <Person sx={{mr: 1, verticalAlign: 'middle'}}/>
                                            Personal Information
                                        </Typography>
                                        <Divider sx={{mb: 2}}/>

                                        <Grid container spacing={2}>
                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body1" fontWeight="500">
                                                    {referrerOrder.orderInformation.patient?.fullName || "Not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 6}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <CalendarToday fontSize="small" sx={{mr: 1}}/>
                                                    Born: {formatDate(referrerOrder.orderInformation.patient?.dateOfBirth)}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 6}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    {getGenderDisplay(referrerOrder.orderInformation.patient?.gender)}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Fingerprint fontSize="small" sx={{mr: 1}}/>
                                                    ID No.: {referrerOrder.orderInformation.patient?.id_no || "Not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Fingerprint fontSize="small" sx={{mr: 1}}/>
                                                    Reference
                                                    ID: {referrerOrder.orderInformation.patient?.reference_id || "Not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Info fontSize="small" sx={{mr: 1}}/>
                                                    Consanguineous
                                                    parents: {referrerOrder.orderInformation.patient?.consanguineousParents ? "Yes" : "No"}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                            <LocationOn sx={{mr: 1, verticalAlign: 'middle'}}/>
                                            Contact Information
                                        </Typography>
                                        <Divider sx={{mb: 2}}/>

                                        <Grid container spacing={2}>
                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Email fontSize="small" sx={{mr: 1}}/>
                                                    {referrerOrder.orderInformation.patient?.contact?.email || "Email not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Phone fontSize="small" sx={{mr: 1}}/>
                                                    {referrerOrder.orderInformation.patient?.contact?.phone || "Phone not specified"}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'flex-start'}}>
                                                    <HomeWork fontSize="small" sx={{mr: 1, mt: 0.5}}/>
                                                    <span>
                                                        {referrerOrder.orderInformation.patient?.contact?.address || "No address"}{referrerOrder.orderInformation.patient?.contact?.address ? "," : ""}
                                                        <br/>
                                                        {referrerOrder.orderInformation.patient?.contact?.city || ""}{referrerOrder.orderInformation.patient?.contact?.city ? "," : ""} {referrerOrder.orderInformation.patient?.contact?.state || ""}
                                                    </span>
                                                </Typography>
                                            </Grid>

                                            <Grid size={{xs: 12}}>
                                                <Typography variant="body2" color="text.secondary"
                                                            sx={{display: 'flex', alignItems: 'center'}}>
                                                    <Public fontSize="small" sx={{mr: 1}}/>
                                                    {referrerOrder.orderInformation.patient?.contact?.country?.label || "Country not specified"}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </Grid>

                                {/* Sample Information */}
                                <Grid size={{xs: 12, md: 6}}>
                                    <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                        <Science sx={{mr: 1, verticalAlign: 'middle'}}/>
                                        Material Details
                                    </Typography>
                                    <Divider sx={{mb: 2}}/>

                                    {referrerOrder.orderInformation.samples?.length > 0 ? (
                                        <List sx={{bgcolor: "#f5f5f5", borderRadius: 1, p: 2}}>
                                            {referrerOrder.orderInformation.samples?.map((sample, index) => (
                                                <React.Fragment key={sample.id || index}>
                                                    <ListItem
                                                        alignItems="flex-start"
                                                        sx={{
                                                            bgcolor: 'background.paper',
                                                            mb: 1,
                                                            borderRadius: 1,
                                                            border: '1px solid #e0e0e0'
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <Science color="primary"/>
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography fontWeight="500">
                                                                    Sample
                                                                    #{index + 1}: {sample.sample_type?.name || "Unknown type"}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <>
                                                                    <Typography variant="body2" component="span">
                                                                        Sample ID: {sample.sampleId || "Not specified"}
                                                                    </Typography>
                                                                    <br/>
                                                                    <Typography variant="body2" component="span">
                                                                        Collection
                                                                        Date: {formatDate(sample.collectionDate)}
                                                                    </Typography>
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    ) : (
                                        <Alert severity="info" sx={{mt: 2}}>No samples have been added yet.</Alert>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>

                        <CardActions sx={{justifyContent: "flex-end", p: 2, backgroundColor: "#f5f5f5"}}>
                            {!referrerOrder.patient_id ? (
                                <>
                                    <Button
                                        variant="contained"
                                        onClick={handleAddPatient}
                                        startIcon={<PersonAdd/>}
                                        sx={{mr: 1}}
                                    >
                                        Add New Patient
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        onClick={handleAddFromExistsPatient}
                                        startIcon={<Person/>}
                                    >
                                        Select Existing Patient
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="contained"
                                    onClick={gotoPage(route("patients.show", referrerOrder.patient_id))}
                                    startIcon={<Person/>}
                                >
                                    View Patient Details
                                </Button>
                            )}
                        </CardActions>
                    </Card>
                </TabPanel>

                {/* Request Form Tab */}
                <TabPanel value={activeTab} index={1}>
                    <Card elevation={2}>
                        <CardHeader
                            title={
                                <Typography variant="h6" sx={{display: 'flex', alignItems: 'center'}}>
                                    <Description sx={{mr: 1}}/>
                                    Request Form Details
                                </Typography>
                            }
                            sx={{
                                background: "linear-gradient(to right, #e0e0e0, #f5f5f5)",
                                borderBottom: "1px solid #ddd"
                            }}
                        />
                        <CardContent>
                            <Grid container spacing={3}>
                                {Object.keys(referrerOrder.orderInformation.orderForms || {}).map((orderFormKey, index) => (
                                    <Grid size={{xs: 12, md: 6}} key={index}>
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight="600"
                                            gutterBottom
                                            sx={{display: 'flex', alignItems: 'center'}}
                                        >
                                            <Info sx={{mr: 1}}/>
                                            {orderFormKey}
                                        </Typography>
                                        <Divider sx={{mb: 2}}/>

                                        <List sx={{bgcolor: "#f5f5f5", borderRadius: 1}}>
                                            {referrerOrder.orderInformation.orderForms[orderFormKey].map((item, itemIndex) => (
                                                <ListItem key={itemIndex}>
                                                    <ListItemText
                                                        primary={
                                                            <Typography fontWeight="500">
                                                                {item.label}
                                                            </Typography>
                                                        }
                                                        secondary={item.value || "Not specified"}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Grid>
                                ))}

                                {Object.keys(referrerOrder.orderInformation.orderForms || {}).length === 0 && (
                                    <Grid size={{xs: 12}}>
                                        <Alert severity="info">No form details available.</Alert>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>

                        {referrerOrder.patient_id && (
                            <CardActions sx={{justifyContent: "space-between", p: 2, backgroundColor: "#f5f5f5"}}>
                                {referrerOrder.acceptance_id ? (
                                    <>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={gotoPage(route("acceptances.show", referrerOrder.acceptance_id))}
                                            startIcon={<Description/>}
                                        >
                                            View Acceptance Details
                                        </Button>

                                        {referrerOrder?.acceptance?.samples?.length < 1 ? (
                                            <Button
                                                variant="contained"
                                                onClick={handleAddSample}
                                                startIcon={<Add/>}
                                                disabled={loading}
                                            >
                                                {loading ? <CircularProgress size={24}/> : "Add Samples"}
                                            </Button>
                                        ) : null}
                                    </>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleAddAcceptance}
                                        startIcon={<Add/>}
                                    >
                                        Add Acceptance
                                    </Button>
                                )}
                            </CardActions>
                        )}
                    </Card>
                </TabPanel>

                {/* Files Tab */}
                <TabPanel value={activeTab} index={2}>
                    <Card elevation={2}>
                        <CardHeader
                            title={
                                <Typography variant="h6" sx={{display: 'flex', alignItems: 'center'}}>
                                    <FileCopy sx={{mr: 1}}/>
                                    Attached Files
                                </Typography>
                            }
                            sx={{
                                background: "linear-gradient(to right, #e0e0e0, #f5f5f5)",
                                borderBottom: "1px solid #ddd"
                            }}
                        />
                        <CardContent>
                            {referrerOrder.owned_documents && referrerOrder.owned_documents.length > 0 ? (
                                <List>
                                    {referrerOrder.owned_documents.map((item, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{
                                                bgcolor: '#f5f5f5',
                                                mb: 1,
                                                borderRadius: 1,
                                                '&:hover': {bgcolor: '#e3f2fd'}
                                            }}
                                            secondaryAction={
                                                <Tooltip title="Download file">
                                                    <IconButton
                                                        edge="end"
                                                        component="a"
                                                        href={route("documents.download", item.hash)}
                                                        target="_blank"
                                                        color="primary"
                                                    >
                                                        <Download/>
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                        >
                                            <ListItemIcon>
                                                <Description/>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={`Document #${index + 1}`}
                                                secondary={`File hash: ${item.hash.substring(0, 8)}...`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Alert severity="info">No documents available for this order.</Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabPanel>
            </Paper>

            {/* Modals */}
            <AddFromExistPatientForm
                open={openAddFromExist}
                referrerOrder={referrerOrder}
                onClose={handleCloseAddPatient}
            />

            <PatientAddForm
                defaultValues={{...patient, idNo: patient.id_no}}
                id={referrerOrder.id}
                open={openAddPatient}
                onClose={handleCloseAddPatient}
            />

            {referrerOrder?.patient && (
                <AcceptanceForm
                    errors={errors}
                    initialData={acceptanceData}
                    onSubmit={handleSubmitAcceptance}
                    open={openAddAcceptance}
                    id={referrerOrder.id}
                    onClose={handleCloseAddAcceptance}
                    requestedTests={referrerOrder?.orderInformation?.tests}
                    maxDiscount={0}
                />
            )}
            {(referrerOrder.acceptance_id && barcodes.length) ? (
                <AddSampleForm
                    referrerOrder={referrerOrder}
                    onClose={handleAddSampleClose}
                    samples={referrerOrder.orderInformation.samples}
                    open={openAddSample}
                    barcodes={barcodes}
                />
            ) : null}

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
