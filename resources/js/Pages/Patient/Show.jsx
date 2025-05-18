import React, {useState, useEffect, useMemo, useCallback} from "react";
import {
    Box,
    Tab,
    Tabs,
    Chip,
    Tooltip,
    IconButton,
    Typography,
    Divider,
    Card,
    CardContent,
    Fade,
    Badge,
    useTheme,
    alpha,
    CircularProgress
} from "@mui/material";
import {
    RemoveRedEye,
    InterpreterMode as InterpreterModeIcon,
    ReceiptLong as ReceiptLongIcon,
    Person as PersonIcon,
    Description as DescriptionIcon,
    Assignment as AssignmentIcon,
    Payments as PaymentsIcon,
    Receipt as ReceiptIcon,
    MedicalServices as MedicalServicesIcon,
    ContactPhone as ContactPhoneIcon
} from "@mui/icons-material";
import {useSnackbar} from "notistack";

// Import components
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PatientInfo from "./Components/PatientInfo";
import PatientMetaInfo from "@/Pages/Patient/Components/PatientMetaInfo";
import RelativesInfo from "@/Pages/Patient/Components/RelativesInfo";
import DocumentsInfo from "@/Components/DocumentsInfo";
import LoadMore from "@/Components/LoadMore";
import AddForm from "./Components/AddForm.jsx";
import {Head, router, usePage} from "@inertiajs/react";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";

// --- Helper Components & Functions ---

// TabPanel component with minHeight via sx prop and optional loading state
function TabPanel(props) {
    const {children, value, index, loading, ...other} = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`patient-tabpanel-${index}`}
            aria-labelledby={`patient-tab-${index}`}
            {...other}
            style={{position: 'relative'}} // Needed for absolute positioning of loader
        >
            {/* Add a loading indicator */}
            {loading && (
                <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200, py: 3}}>
                    <CircularProgress/>
                </Box>
            )}
            {/* Fade in content when not loading */}
            <Fade in={value === index && !loading}>
                <Box sx={{py: 3, minHeight: 200}}>
                    {/* Only render children when not loading to prevent rendering with incomplete data */}
                    {!loading ? children : null}
                </Box>
            </Fade>
        </div>
    );
}

// Helper for consistent currency formatting (using OMR for Oman)
const formatCurrency = (value) => {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('en-OM', { // Using locale for Oman
        style: 'currency',
        currency: 'OMR', // Omani Rial
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// Helper for formatting dates consistently
const formatDate = (dateString, options = {}) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', {...defaultOptions, ...options}).format(date);
};

// Helper for rendering status chips consistently
const renderStatusChip = (value, colorMap) => {
    if (!value) return null;
    return (
        <Chip
            label={value}
            size="small"
            color={colorMap[value] || 'default'}
            sx={{fontWeight: 500}}
        />
    );
};

// Helper for rendering the view button consistently
const renderViewButton = (href, onClickHandler) => (
    <Tooltip title="View Details">
        {/* Use span to avoid Tooltip warning if IconButton is disabled */}
        <span>
            <IconButton
                href={href}
                onClick={onClickHandler}
                size="small"
                color="primary"
                disabled={!href} // Disable if no link
            >
                <RemoveRedEye fontSize="small"/>
            </IconButton>
        </span>
    </Tooltip>
);

// --- Main Component ---
const Show = ({
                  patient,
                  stats,
                  // Make related data potentially undefined initially for lazy loading
                  relatives: initialRelatives,
                  invoices: initialInvoices,
                  payments: initialPayments,
                  acceptances: initialAcceptances,
                  patientMeta: initialPatientMeta,
                  documents: initialDocuments,
                  consultations: initialConsultations,
                  success, // From Inertia flash messages
                  status,  // From Inertia flash messages
                  errors,  // From Inertia flash messages
                  canEdit = false,
                  canCreateAcceptance = false,
                  canCreateConsultation = false,
              }) => {
    const theme = useTheme();
    const {enqueueSnackbar} = useSnackbar();
    const [tabValue, setTabValue] = useState(0);
    const [openConsultationForm, setOpenConsultationForm] = useState(false);
    const [loadingTabs, setLoadingTabs] = useState({}); // State to track loading status per tab dataKey

    // Get ALL props from usePage to access potentially lazy-loaded data
    const {props: pageProps} = usePage();
    const {
        relatives = initialRelatives,
        invoices = initialInvoices,
        payments = initialPayments,
        acceptances = initialAcceptances,
        patientMeta = initialPatientMeta,
        documents = initialDocuments,
        consultations = initialConsultations,
    } = pageProps; // Use latest props from usePage, falling back to initial


    // Define tab headers with dataKey for lazy loading
    // Keep Overview (index 0) data always loaded initially
    const tabs = useMemo(() => [
        {label: "Overview", icon: <PersonIcon fontSize="small"/>, count: null, dataKey: null}, // No lazy loading
        {label: "Documents", icon: <DescriptionIcon fontSize="small"/>, count: documents?.length, dataKey: 'documents'},
        {
            label: "Consultations",
            icon: <MedicalServicesIcon fontSize="small"/>,
            count: consultations?.length,
            dataKey: 'consultations'
        },
        {
            label: "Acceptances",
            icon: <AssignmentIcon fontSize="small"/>,
            count: acceptances?.length,
            dataKey: 'acceptances'
        },
        {label: "Invoices", icon: <ReceiptIcon fontSize="small"/>, count: invoices?.length, dataKey: 'invoices'},
        {label: "Payments", icon: <PaymentsIcon fontSize="small"/>, count: payments?.length, dataKey: 'payments'},
        // Consider adding Relatives/PatientMeta to tabs if they should be lazy-loaded too
    ], [documents, consultations, acceptances, invoices, payments]); // Recalculate counts if data changes

    // Actions based on permissions (Fixed navigation for Add Acceptance)
    const actions = useMemo(() => [
        ...(canCreateConsultation ? [{
            icon: <InterpreterModeIcon/>,
            name: 'Add Consultation',
            color: "primary",
            onClick: () => setOpenConsultationForm(true)
        }] : []),
        ...(canCreateAcceptance ? [{
            icon: <ReceiptLongIcon/>,
            name: 'Add Acceptance',
            color: "secondary",
            // Use router.visit for SPA navigation
            onClick: () => router.visit(route("acceptances.create", patient.id))
        }] : []),
    ], [canCreateConsultation, canCreateAcceptance, patient.id]);

    // --- Navigation Handler ---
    const handleNavigate = useCallback((e) => {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (href) {
            router.visit(href); // Use Inertia visit for internal links
        }
    }, []);

    // --- Column Definitions (Memoized) ---
    const invoiceColumns = useMemo(() => [
        {
            field: 'total_amount',
            headerName: 'Total Amount',
            type: 'number',
            flex: 0.5,
            align: "center",
            valueFormatter: (value) => formatCurrency(value*1),
        },
        {
            field: 'total_discount',
            headerName: 'Total Discount',
            type: 'number',
            flex: 0.5,
            align: "center",
            valueFormatter: (value) => formatCurrency(value*1),
        },
        {
            field: 'total_paid',
            headerName: 'Total Paid',
            type: 'number',
            flex: 0.5,
            align: "center",
            valueFormatter: (value) => formatCurrency(value*1),
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1,
            align: "center",
            renderCell: ({value}) => renderStatusChip(value,
                {
                    Paid: 'success',
                    Pending: 'warning',
                    Overdue: 'error',
                }
            ),
        },
        {
            field: 'id',
            headerName: 'View',
            flex: 0.5,
            align: "center",
            sortable: false,
            filterable: false,
            renderCell: ({row}) => renderViewButton(route("invoices.show", row.id), handleNavigate),
        }
    ], [handleNavigate]);

    const paymentColumns = useMemo(() => [
        {
            field: 'price', headerName: 'Amount', type: 'number', flex: 1, align: "center",
            valueFormatter: ({value}) => formatCurrency(value), // Standardized currency
        },
        {
            field: 'paymentMethod', headerName: 'Method', flex: 1, align: "center",
            renderCell: ({value}) => renderStatusChip(value, {
                'Credit Card': 'primary', Cash: 'success', Insurance: 'info', Transfer: 'secondary' // Example mapping
            }),
        },
        {
            field: 'created_at', headerName: 'Date', flex: 1, align: "center", type: 'date',
            valueGetter: (value) => value && new Date(value),
            valueFormatter: ({value}) => formatDate(value), // Use helper
        }
    ], []);

    const consultationsColumns = useMemo(() => [
        {
            field: 'consultant', headerName: 'Consultant', flex: 1.2,
            renderCell: ({row}) => (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden'}}>
                    <ContactPhoneIcon fontSize="small" color="action"/>
                    <Typography variant="body2" sx={{
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {row?.consultant?.name || 'N/A'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'status', headerName: 'Status', flex: 1, align: "center",
            renderCell: ({value}) => renderStatusChip(value, {
                Completed: 'success', Scheduled: 'primary', Waiting: 'warning', Canceled: 'error'
            }),
        },
        {field: 'waitingDuration', headerName: 'Waiting Since', flex: 1, align: "center"}, // Assuming this is pre-formatted text
        {field: 'duration', headerName: 'Duration', flex: 0.8, align: "center"}, // Assuming this is pre-formatted text
        {
            field: 'dueDate', headerName: 'Due Date', flex: 1, align: "center", type: 'dateTime',
            valueGetter: (value) => value && new Date(value),
            valueFormatter: ({value}) => formatDate(value, {hour: '2-digit', minute: '2-digit'}), // Add time
        },
        {
            field: 'action', headerName: 'View', flex: 0.5, align: "center", sortable: false, filterable: false,
            renderCell: ({row}) => renderViewButton(route("consultations.show", row.id), handleNavigate),
        }
    ], [handleNavigate]);

    const acceptanceColumns = useMemo(() => [
        {field: 'id', headerName: 'ID', flex: 0.5, align: "center"},
        {
            field: 'status', headerName: 'Status', flex: 1, align: "center",
            renderCell: ({value}) => renderStatusChip(value, {
                Accepted: 'success', Pending: 'warning', Rejected: 'error'
            }),
        },
        {
            field: "created_at", headerName: 'Created', flex: 1, align: "center", type: 'date',
            valueGetter: (value) => value && new Date(value),
            valueFormatter: ({value}) => formatDate(value),
        },
        {
            field: "view", headerName: 'View', flex: 0.5, align: "center", sortable: false, filterable: false,
            renderCell: ({row}) => renderViewButton(route("acceptances.show", row.id), handleNavigate),
        }
    ], [handleNavigate]);

    // --- Tab Change Handler with Lazy Loading ---
    const handleTabChange = useCallback((event, newValue) => {
        const targetTab = tabs[newValue];
        const dataKey = targetTab?.dataKey;

        setTabValue(newValue); // Update visible tab immediately

        // Check if data needs loading (not index 0, has a dataKey, not already loaded/loading)
        if (dataKey && pageProps[dataKey] === undefined && !loadingTabs[dataKey]) {
            setLoadingTabs(prev => ({...prev, [dataKey]: true})); // Set loading state for this tab

            router.reload({
                only: [dataKey], // Request only the specific data key
                preserveState: true, // Keep current component state (like filters in LoadMore if applicable)
                preserveScroll: true, // Keep scroll position
                onSuccess: () => {
                    setLoadingTabs(prev => ({...prev, [dataKey]: false})); // Clear loading state on success
                },
                onError: (errors) => {
                    console.error(`Failed to load data for tab: ${dataKey}`, errors);
                    enqueueSnackbar(`Error loading ${targetTab.label} data.`, {variant: "error"});
                    setLoadingTabs(prev => ({...prev, [dataKey]: false})); // Clear loading state on error
                },
            });
        }
    }, [tabs, pageProps, loadingTabs, enqueueSnackbar]); // Dependencies for useCallback

    // Handle consultation form close
    const handleCloseConsultationForm = useCallback(() => setOpenConsultationForm(false), []);

    // Display flash notifications
    useEffect(() => {
        if (success && status) { // Ensure both exist
            enqueueSnackbar(status, {variant: "success"});
        }
        // Handle potential array or object errors from Inertia
        if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
            Object.values(errors).flat().forEach(errorMsg => { // Flatten potential arrays of errors per field
                if (typeof errorMsg === 'string') {
                    enqueueSnackbar(errorMsg, {variant: "error", persist: false}); // Don't persist validation errors generally
                }
            });
        } else if (errors && typeof errors === 'string') { // Handle single string error
            enqueueSnackbar(errors, {variant: "error"});
        }
    }, [success, status, errors, enqueueSnackbar]); // Rerun if flash messages change

    // --- Patient Summary Card ---
    const PatientSummaryCard = useMemo(() => (
        <Card
            elevation={0}
            sx={{
                mb: 3,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.03) // Use theme alpha
            }}
        >
            <CardContent>
                <Box sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {/* Patient Info */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <Avatar
                            src={patient.avatar} // Assuming patient object has avatar URL
                            alt={patient.fullName}
                            sx={{
                                bgcolor: 'primary.main', // Background color if no image
                                width: 56,
                                height: 56
                            }}
                        >
                            {patient.fullName?.charAt(0).toUpperCase()} {/* Fallback initial */}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" component="div" color="primary.main" sx={{mb: 0.5}}>
                                {patient.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ID: {patient.idNo || 'N/A'}
                            </Typography>
                            {/* Actions */}
                            <Box sx={{display: "flex", gap: 1, mt: 1}}>
                                {actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant="outlined"
                                        color={action.color}
                                        size="small"
                                        startIcon={action.icon}
                                        onClick={action.onClick}
                                    >
                                        {action.name}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* Stats */}
                    <Box sx={{
                        display: 'flex',
                        gap: {xs: 2, md: 3},
                        flexWrap: 'wrap',
                        justifyContent: {xs: 'flex-start', md: 'flex-end'}
                    }}>
                        {/* Use tabs array for consistency */}
                        {tabs.slice(1).map((tab, index) => ( // Start from index 1 (skip Overview)
                            <React.Fragment key={tab.label}>
                                {index > 0 && <Divider orientation="vertical" flexItem/>}
                                <Box sx={{textAlign: 'center'}}>
                                    <Typography variant="overline" color="text.secondary"
                                                sx={{display: 'block', lineHeight: 1.2}}>
                                        {tab.label}
                                    </Typography>
                                    <Typography variant="h6">
                                        {/* Use data from props directly for summary */}
                                        {pageProps[tab.dataKey]?.length ?? stats?.[tab.dataKey] ?? 0}
                                    </Typography>
                                </Box>
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    ), [patient, stats, actions, theme, tabs, pageProps]); // Depend on relevant data

    // --- Main Render ---
    return (
        <Box>
            <Head title={patient.fullName}/>
            {PatientSummaryCard}

            {/* Tabs Navigation */}
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Patient details tabs"
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.primary.main, 0.02), // Subtle background
                    '& .MuiTab-root': {
                        minHeight: 56, // Slightly smaller height
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        px: 2, // Adjust padding
                    },
                    '& .Mui-selected': {
                        color: 'primary.main',
                        fontWeight: 600,
                    },
                    '& .MuiTabs-indicator': {
                        height: 3,
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                    }
                }}
            >
                {tabs.map((tab, index) => (
                    <Tab
                        key={index}
                        label={
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                {tab.icon}
                                <Badge
                                    badgeContent={tab.count ?? 0} // Use count from memoized tabs state
                                    color={tabValue === index ? "primary" : "default"}
                                    invisible={tab.count === null || tab.count === 0} // Hide if null or 0
                                    max={99}
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.65rem',
                                            height: 18,
                                            minWidth: 18,
                                            right: -8, // Adjust position
                                            top: -2,
                                        },
                                        // Apply badge directly to the label text container
                                        '& .MuiBox-root': {pr: tab.count ? 2 : 0} // Add padding only if badge is potentially visible
                                    }}
                                >
                                    {tab.label}
                                </Badge>
                            </Box>
                        }
                        id={`patient-tab-${index}`}
                        aria-controls={`patient-tabpanel-${index}`}
                        disabled={loadingTabs[tab.dataKey]} // Disable tab while its data is loading
                    />
                ))}
            </Tabs>

            {/* Tab Content */}
            <Box> {/* Removed default padding p:3 */}
                {/* Overview Tab (Always loaded) */}
                <TabPanel value={tabValue} index={0}>
                    <PatientInfo patient={patient} editable={canEdit} defaultExpanded/>
                    <PatientMetaInfo patientMeta={patientMeta} editable={canEdit} patientId={patient.id}/>
                    <RelativesInfo relatives={relatives} patientId={patient.id} canAddPatient={canEdit}/>
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
                                ownerClass: "patient"
                            }}
                            url={route("documents.batchUpdate")} // Assuming this handles uploads/updates
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
                            defaultExpanded={true}
                            loading={loadingTabs['consultations']} // Pass loading state
                            pageSize={5}
                            onRefresh={() => { // Fixed refresh action
                                enqueueSnackbar("Refreshing consultations...", {variant: "info"});
                                setLoadingTabs(prev => ({...prev, consultations: true}));
                                router.reload({
                                    only: ['consultations'],
                                    preserveState: true,
                                    preserveScroll: true,
                                    onSuccess: () => setLoadingTabs(prev => ({...prev, consultations: false})),
                                    onError: () => setLoadingTabs(prev => ({...prev, consultations: false}))
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
                            defaultExpanded={true}
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
                            defaultExpanded={true}
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
                            defaultExpanded={true}
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
        title: "Patients",
        link: route("patients.index"),
        icon: null,
    }
];

// Assign layout (remains the same)
Show.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: page.props.patient.fullName,
                link: null, // Current page, no link
                icon: null,
            }
        ]}
        title={`Patient: ${page.props.patient.fullName}`} // Use page title from props
    />
);

export default Show;
