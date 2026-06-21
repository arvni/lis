import { useState } from 'react';
import { Alert, Box, Chip, Paper, Snackbar, Tab, Tabs } from '@mui/material';
import ClientLayout from '@/Layouts/AuthenticatedLayout';
import PatientAddForm from './Components/Form';
import AcceptanceForm from './Components/AcceptanceForm';
import AddSampleForm from './Components/AddSampleForm';
import AddFromExistPatientForm from './Components/AddFromExistPatientForm';
import SelectAcceptanceDialog from './Components/SelectAcceptanceDialog';
import { Head, router } from '@inertiajs/react';
import { Assignment, Description, Person, FileCopy, Timeline } from '@mui/icons-material';
import axios from 'axios';
import PageHeader from '@/Components/PageHeader.jsx';
import TabPanel from './Show/TabPanel';
import StatusTimeline from './Show/StatusTimeline';
import PatientsTestsTab from './Show/PatientsTestsTab';
import OrderFormsTab from './Show/OrderFormsTab';
import ConsentsTab from './Show/ConsentsTab';
import DocumentsTab from './Show/DocumentsTab';
import PatientActionDialog from './Show/PatientActionDialog';

const Show = ({ referrerOrder, errors = {} }) => {
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
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info',
    });
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
            tests: [],
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
        samples: (item.samples || []).map((sample) => ({
            patients: (sample.patients || []).map((p) => ({ id: p.id })),
            sampleType: sample.sampleType,
        })),
        customParameters: {
            sampleType: item.customParameters?.sampleType,
            discounts: item.customParameters?.discounts || [],
            price: item.customParameters?.price,
        },
        details: item.details,
        deleted: item.deleted || false,
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
                panels: (data.acceptanceItems?.panels || []).map((panel) => ({
                    ...cleanAcceptanceItem(panel),
                    sampleless: panel.sampleless || false,
                    reportless: panel.reportless || false,
                    acceptanceItems: (panel.acceptanceItems || []).map(cleanAcceptanceItem),
                })),
            },
        };

        router.post(route('referrerOrders.acceptance', referrerOrder.id), cleanedData, {
            onSuccess: handleCloseAddAcceptance,
        });
    };

    const handleAddPatient = () => setOpenAddPatient(true);
    const handleAddAcceptance = () => setOpenAddAcceptance(true);
    const handleAddSample = () => {
        setLoading(true);
        axios
            .get(route('api.sampleCollection.list', referrerOrder.acceptance_id))
            .then((res) => {
                setBarcodes(res.data.barcodes);

                // For pooling orders, extract all unique acceptance items
                if (referrerOrder.pooling) {
                    const allItems = [];
                    const itemIds = new Set();
                    res.data.barcodes.forEach((barcode) => {
                        barcode.items?.forEach((item) => {
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
            .catch((error) => {
                setNotification({
                    open: true,
                    message:
                        'Failed to load barcodes: ' +
                        (error.response?.data?.message || 'Unknown error'),
                    severity: 'error',
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
    const gotoPage = (url) => () => router.visit(url);
    const handleCloseNotification = () => setNotification({ ...notification, open: false });

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
        if (percentage < 50) return 'error';
        if (percentage < 100) return 'warning';
        return 'success';
    };

    const { id: _patientID, ...patient } = referrerOrder?.orderInformation?.patient || {};
    // Use patients array if available, otherwise fall back to single patient object
    const patients =
        referrerOrder?.orderInformation?.patients?.length > 0
            ? referrerOrder.orderInformation.patients
            : referrerOrder?.orderInformation?.patient
              ? [referrerOrder.orderInformation.patient]
              : [];
    const orderItems = referrerOrder?.orderInformation?.orderItems || [];

    return (
        <>
            <Head title={`Referrer Order #${referrerOrder.order_id}`} />
            {/* Page Header */}
            <PageHeader
                icon={<Assignment sx={{ mr: 1 }} />}
                title={`Order #${referrerOrder.order_id}`}
                subtitle={`Referrer: ${referrerOrder?.referrer?.fullName} | Status: ${referrerOrder?.orderInformation?.status}`}
                actions={[
                    <Chip
                        key="completion"
                        size="medium"
                        color={getCompletionColor()}
                        label={`${getCompletionPercentage()}% Complete`}
                        icon={<Timeline />}
                    />,
                ]}
            />

            {/* Status Timeline */}
            <StatusTimeline referrerOrder={referrerOrder} />

            {/* Main Content */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Tabs Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none',
                                fontSize: '1rem',
                            },
                        }}
                    >
                        <Tab label="Patients & Tests" icon={<Person />} iconPosition="start" />
                        <Tab label="Order Forms" icon={<Description />} iconPosition="start" />
                        <Tab label="Consents" icon={<Assignment />} iconPosition="start" />
                        <Tab label="Documents" icon={<FileCopy />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* Tab Panels */}
                <Box sx={{ px: 3 }}>
                    <TabPanel value={activeTab} index={0}>
                        <PatientsTestsTab
                            referrerOrder={referrerOrder}
                            patients={patients}
                            orderItems={orderItems}
                            loading={loading}
                            onAddPatient={handleAddPatient}
                            onAddFromExist={handleAddFromExistsPatient}
                            onSelectPatient={handleSelectPatient}
                            gotoPage={gotoPage}
                            onAddAcceptance={handleAddAcceptance}
                            onAddSample={handleAddSample}
                            onOpenSelectAcceptance={handleOpenSelectAcceptance}
                        />
                    </TabPanel>

                    <TabPanel value={activeTab} index={1}>
                        <OrderFormsTab orderForms={referrerOrder.orderInformation.orderForms} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                        <ConsentsTab consents={referrerOrder.orderInformation.consents} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={3}>
                        <DocumentsTab documents={referrerOrder.owned_documents} />
                    </TabPanel>
                </Box>
            </Paper>

            {/* Modals */}
            <PatientActionDialog
                open={openPatientActionModal}
                onClose={() => setOpenPatientActionModal(false)}
                selectedPatient={selectedPatient}
                onAddNewPatient={handleAddNewPatient}
                onSelectFromExisting={handleSelectFromExisting}
            />

            <AddFromExistPatientForm
                open={openAddFromExist}
                referrerOrder={referrerOrder}
                onClose={handleCloseAddPatient}
            />

            <PatientAddForm
                defaultValues={
                    selectedPatient
                        ? { ...selectedPatient, idNo: selectedPatient?.id_no }
                        : {
                              ...patient,
                              idNo: patient?.id_no,
                          }
                }
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
                            ? orderItems.map((item) => item.test)
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

            {referrerOrder.acceptance_id && barcodes.length > 0 && (
                <AddSampleForm
                    referrerOrder={referrerOrder}
                    onClose={handleAddSampleClose}
                    samples={
                        orderItems.length > 0
                            ? orderItems.flatMap((item) => item.samples || [])
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
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
        title: 'Referrer Orders',
        link: route('referrer-orders.index'),
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
                title: 'Order #' + page.props.referrerOrder.order_id,
                link: null,
                icon: null,
            },
        ]}
    >
        {page}
    </ClientLayout>
);

export default Show;
