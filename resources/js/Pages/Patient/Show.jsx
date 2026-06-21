import { useState, useMemo, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import {
    InterpreterMode as InterpreterModeIcon,
    ReceiptLong as ReceiptLongIcon,
    Person as PersonIcon,
    Description as DescriptionIcon,
    Assignment as AssignmentIcon,
    Payments as PaymentsIcon,
    Receipt as ReceiptIcon,
    MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Import components
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PatientInfo from './Components/PatientInfo';
import PatientMetaInfo from '@/Pages/Patient/Components/PatientMetaInfo';
import RelativesInfo from '@/Pages/Patient/Components/RelativesInfo';
import DocumentsInfo from '@/Components/DocumentsInfo';
import LoadMore from '@/Components/LoadMore';
import AddForm from './Components/AddForm.jsx';
import { Head, router, usePage } from '@inertiajs/react';
import TabPanel from './Show/TabPanel';
import PatientSummaryCard from './Show/PatientSummaryCard';
import PatientTabsNav from './Show/PatientTabsNav';
import {
    buildInvoiceColumns,
    buildPaymentColumns,
    buildConsultationsColumns,
    buildAcceptanceColumns,
} from './Show/columns';

// --- Main Component ---
const Show = ({
    patient,
    stats,

    success, // From Inertia flash messages
    status, // From Inertia flash messages
    errors, // From Inertia flash messages
    canEdit = false,
    canCreateAcceptance = false,
    canCreateConsultation = false,
    allowedTags = [],
}) => {
    const { enqueueSnackbar } = useSnackbar();
    const [tabValue, setTabValue] = useState(0);
    const [openConsultationForm, setOpenConsultationForm] = useState(false);
    const [loadingTabs, setLoadingTabs] = useState({}); // State to track loading status per tab dataKey

    // Get ALL props from usePage to access potentially lazy-loaded data
    const { props: pageProps } = usePage();
    const { relatives, invoices, payments, acceptances, patientMeta, documents, consultations } =
        pageProps; // Use latest props from usePage, falling back to initial

    // Define tab headers with dataKey for lazy loading
    // Keep Overview (index 0) data always loaded initially
    const tabs = useMemo(
        () => [
            {
                label: 'Overview',
                icon: <PersonIcon fontSize="small" />,
                count: null,
                dataKey: null,
            }, // No lazy loading
            {
                label: 'Documents',
                icon: <DescriptionIcon fontSize="small" />,
                count: documents?.length,
                dataKey: 'documents',
            },
            {
                label: 'Consultations',
                icon: <MedicalServicesIcon fontSize="small" />,
                count: consultations?.length,
                dataKey: 'consultations',
            },
            {
                label: 'Acceptances',
                icon: <AssignmentIcon fontSize="small" />,
                count: acceptances?.length,
                dataKey: 'acceptances',
            },
            {
                label: 'Invoices',
                icon: <ReceiptIcon fontSize="small" />,
                count: invoices?.length,
                dataKey: 'invoices',
            },
            {
                label: 'Payments',
                icon: <PaymentsIcon fontSize="small" />,
                count: payments?.length,
                dataKey: 'payments',
            },
            // Consider adding Relatives/PatientMeta to tabs if they should be lazy-loaded too
        ],
        [documents, consultations, acceptances, invoices, payments],
    ); // Recalculate counts if data changes

    // Actions based on permissions (Fixed navigation for Add Acceptance)
    const actions = useMemo(
        () => [
            ...(canCreateConsultation
                ? [
                      {
                          icon: <InterpreterModeIcon />,
                          name: 'Add Consultation',
                          color: 'primary',
                          onClick: () => setOpenConsultationForm(true),
                      },
                  ]
                : []),
            ...(canCreateAcceptance
                ? [
                      {
                          icon: <ReceiptLongIcon />,
                          name: 'Add Acceptance',
                          color: 'secondary',
                          // Use router.visit for SPA navigation
                          onClick: () => router.visit(route('acceptances.create', patient.id)),
                      },
                  ]
                : []),
        ],
        [canCreateConsultation, canCreateAcceptance, patient.id],
    );

    // --- Navigation Handler ---
    const handleNavigate = useCallback((e) => {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (href) {
            router.visit(href); // Use Inertia visit for internal links
        }
    }, []);

    // --- Column Definitions (Memoized) ---
    const invoiceColumns = useMemo(() => buildInvoiceColumns(handleNavigate), [handleNavigate]);
    const paymentColumns = useMemo(() => buildPaymentColumns(), []);
    const consultationsColumns = useMemo(
        () => buildConsultationsColumns(handleNavigate),
        [handleNavigate],
    );
    const acceptanceColumns = useMemo(
        () => buildAcceptanceColumns(handleNavigate),
        [handleNavigate],
    );

    // --- Tab Change Handler with Lazy Loading ---
    const handleTabChange = useCallback(
        (event, newValue) => {
            const targetTab = tabs[newValue];
            const dataKey = targetTab?.dataKey;

            setTabValue(newValue); // Update visible tab immediately

            // Check if data needs loading (not index 0, has a dataKey, not already loaded/loading)
            if (dataKey && pageProps[dataKey] === undefined && !loadingTabs[dataKey]) {
                setLoadingTabs((prev) => ({ ...prev, [dataKey]: true })); // Set loading state for this tab

                router.reload({
                    only: [dataKey], // Request only the specific data key
                    preserveState: true, // Keep current component state (like filters in LoadMore if applicable)
                    preserveScroll: true, // Keep scroll position
                    onSuccess: () => {
                        setLoadingTabs((prev) => ({ ...prev, [dataKey]: false })); // Clear loading state on success
                    },
                    onError: (errors) => {
                        console.error(`Failed to load data for tab: ${dataKey}`, errors);
                        enqueueSnackbar(`Error loading ${targetTab.label} data.`, {
                            variant: 'error',
                        });
                        setLoadingTabs((prev) => ({ ...prev, [dataKey]: false })); // Clear loading state on error
                    },
                });
            }
        },
        [tabs, pageProps, loadingTabs, enqueueSnackbar],
    ); // Dependencies for useCallback

    // Handle consultation form close
    const handleCloseConsultationForm = useCallback(() => setOpenConsultationForm(false), []);

    // Display flash notifications
    useEffect(() => {
        if (success && status) {
            // Ensure both exist
            enqueueSnackbar(status, { variant: 'success' });
        }
        // Handle potential array or object errors from Inertia
        if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
            Object.values(errors)
                .flat()
                .forEach((errorMsg) => {
                    // Flatten potential arrays of errors per field
                    if (typeof errorMsg === 'string') {
                        enqueueSnackbar(errorMsg, { variant: 'error', persist: false }); // Don't persist validation errors generally
                    }
                });
        } else if (errors && typeof errors === 'string') {
            // Handle single string error
            enqueueSnackbar(errors, { variant: 'error' });
        }
    }, [success, status, errors, enqueueSnackbar]); // Rerun if flash messages change

    // --- Main Render ---
    return (
        <Box>
            <Head title={patient.fullName} />
            <PatientSummaryCard
                patient={patient}
                stats={stats}
                actions={actions}
                tabs={tabs}
                pageProps={pageProps}
            />

            {/* Tabs Navigation */}
            <PatientTabsNav
                tabs={tabs}
                tabValue={tabValue}
                onChange={handleTabChange}
                loadingTabs={loadingTabs}
            />

            {/* Tab Content */}
            <Box>
                {/* Overview Tab (Always loaded) */}
                <TabPanel value={tabValue} index={0}>
                    <PatientInfo patient={patient} editable={canEdit} defaultExpanded />
                    <PatientMetaInfo
                        patientMeta={patientMeta}
                        editable={canEdit}
                        patientId={patient.id}
                    />
                    <RelativesInfo
                        relatives={relatives}
                        patientId={patient.id}
                        canAddPatient={canEdit}
                    />
                </TabPanel>
                {/* Documents Tab */}
                <TabPanel value={tabValue} index={1} loading={loadingTabs['documents']}>
                    {documents !== undefined && ( // Render only if data is loaded (or initially present)
                        <DocumentsInfo
                            documents={documents || []} // Pass empty array if null/undefined after load attempt
                            defaultExpanded
                            titleVariant="h6"
                            editable={canEdit}
                            patientId={patient.id}
                            appendData={{
                                ownerId: patient.id,
                                ownerClass: 'patient',
                            }}
                            allowedTags={allowedTags}
                            url={route('documents.batchUpdate')} // Assuming this handles uploads/updates
                        />
                    )}
                </TabPanel>
                {/* Consultations Tab */}
                <TabPanel value={tabValue} index={2} loading={loadingTabs['consultations']}>
                    {consultations !== undefined && (
                        <LoadMore
                            title="Consultations"
                            items={consultations || []}
                            columns={consultationsColumns}
                            defaultExpanded
                            loading={loadingTabs['consultations']} // Pass loading state
                            pageSize={5}
                            onRefresh={() => {
                                // Fixed refresh action
                                enqueueSnackbar('Refreshing consultations...', { variant: 'info' });
                                setLoadingTabs((prev) => ({ ...prev, consultations: true }));
                                router.reload({
                                    only: ['consultations'],
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () =>
                                        setLoadingTabs((prev) => ({
                                            ...prev,
                                            consultations: false,
                                        })),
                                    onError: () =>
                                        setLoadingTabs((prev) => ({
                                            ...prev,
                                            consultations: false,
                                        })),
                                });
                            }}
                            emptyMessage="No consultations found for this patient"
                        />
                    )}
                </TabPanel>
                {/* Acceptances Tab */}
                <TabPanel value={tabValue} index={3} loading={loadingTabs['acceptances']}>
                    {acceptances !== undefined && (
                        <LoadMore
                            title="Acceptances"
                            items={acceptances || []}
                            columns={acceptanceColumns}
                            defaultExpanded
                            loading={loadingTabs['acceptances']}
                            pageSize={5}
                            emptyMessage="No acceptances found for this patient"
                        />
                    )}
                </TabPanel>
                {/* Invoices Tab */}
                <TabPanel value={tabValue} index={4} loading={loadingTabs['invoices']}>
                    {invoices !== undefined && (
                        <LoadMore
                            title="Invoices"
                            items={invoices || []}
                            columns={invoiceColumns}
                            defaultExpanded
                            loading={loadingTabs['invoices']}
                            pageSize={5}
                            emptyMessage="No invoices found for this patient"
                        />
                    )}
                </TabPanel>
                {/* Payments Tab */}
                <TabPanel value={tabValue} index={5} loading={loadingTabs['payments']}>
                    {payments !== undefined && (
                        <LoadMore
                            title="Payments"
                            items={payments || []}
                            columns={paymentColumns}
                            defaultExpanded
                            loading={loadingTabs['payments']}
                            pageSize={5}
                            emptyMessage="No payments found for this patient"
                        />
                    )}
                </TabPanel>
            </Box>

            {/* Add Consultation Form Modal */}
            {canCreateConsultation && (
                <AddForm
                    onClose={handleCloseConsultationForm}
                    open={openConsultationForm}
                    patientId={patient?.id}
                />
            )}
        </Box>
    );
};

// Define breadcrumbs (remains the same)
const breadCrumbs = [
    {
        title: 'Patients',
        link: route('patients.index'),
        icon: null,
    },
];

// Assign layout (remains the same)
Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: page.props.patient.fullName,
                link: null, // Current page, no link
                icon: null,
            },
        ]}
        title={`Patient: ${page.props.patient.fullName}`} // Use page title from props
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
