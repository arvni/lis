import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Accordion,
    AccordionDetails,
    Chip,
    Box,
    Paper,
    Card,
    CardContent,
    Tooltip,
    Divider
} from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import {
    Check,
    Close,
    ExpandMore as ExpandMoreIcon,
    LocalHospital,
    Person,
    Email,
    Print,
    Timeline,
    Receipt,
    RequestQuote,
    Science,
    PlaylistAddCheck,
    WhatsApp
} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import React, {useMemo, useState} from "react";
import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import Prescription from "./Components/Prescription";
import Payment from "./Components/Payment";
import Button from "@mui/material/Button";
import {Link} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import {BarcodeIcon} from "lucide-react";
import TestsTable from "@/Pages/Acceptance/Components/TestsSection/TestsTable.jsx";


// Status chip component for better consistency
const StatusChip = ({status}) => {
    const getStatusColor = () => {
        switch (status?.toLowerCase()) {
            case "completed":
                return "success";
            case "pending":
                return "warning";
            case "cancelled":
                return "error";
            default:
                return "primary";
        }
    };

    return (
        <Chip
            label={status || "Created"}
            color={getStatusColor()}
            variant="filled"
            sx={{
                fontWeight: 'bold',
                fontSize: '0.9rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        />
    );
};

// Styled Section Title component
const SectionTitle = ({icon, title}) => {
    const Icon = icon;
    return (
        <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
            <Icon sx={{mr: 1, color: 'primary.main'}}/>
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    letterSpacing: '0.02em'
                }}
            >
                {title}
            </Typography>
        </Box>
    );
};

// Info Item component for consistent styling across information sections
const InfoItem = ({label, value, icon, valueComponent}) => {
    const Icon = icon;
    return (
        <Box
            sx={{
                display: "flex",
                gap: 1,
                alignItems: 'center',
                py: 0.5
            }}
        >
            {icon && <Icon fontSize="small" color="action"/>}
            <Typography fontWeight="bold" color="text.secondary" sx={{minWidth: 120}}>
                {label}:
            </Typography>
            {valueComponent || (
                <Typography sx={{wordBreak: "break-word"}}>{value || 'N/A'}</Typography>
            )}
        </Box>
    );
};

// Summary Card for displaying summary information
const SummaryCard = ({title, value, icon, color = "primary"}) => {
    const Icon = icon;
    return (
        <Card
            elevation={2}
            sx={{
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4
                }
            }}
        >
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography color="text.secondary" variant="subtitle1" fontWeight="medium">
                        {title}
                    </Typography>
                    <Icon sx={{color: `${color}.main`}}/>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{mt: 2, color: `${color}.main`}}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
};

const ReportMethodItem = ({icon: Icon, color = "info", text}) => (
    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
        <Icon color={color}/>
        <Typography variant="body2" sx={{ml: 1}}>
            {text}
        </Typography>
    </Box>
);

// Define the mapping of methods to their display components
const methodConfig = {
    email: {
        icon: Email,
        getText: (data) => data.emailAddress
    },
    print: {
        icon: Print,
        getText: (data) => data.printReceiver
    },
    whatsapp: {
        icon: WhatsApp,
        getText: (data) => data.whatsappNumber
    }
};

const Show = ({
                  acceptance,
                  patient,
                  acceptanceItems,
                  invoice,
                  minAllowablePayment = 0,
                  canEdit,
                  status,
                  canPrintBarcode
              }) => {

    // State
    const [expanded, setExpanded] = useState({
        patient: true,
        report: true,
        doctor: true,
        items: true,
        prescription: false,
        payment: true
    });

    // Handle accordion expansion
    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded({...expanded, [panel]: isExpanded});
    };

    // Calculate totals
    const totals = useMemo(() => {
        const total = acceptanceItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
        const discount = acceptanceItems.reduce((acc, item) => acc + (parseFloat(item.discount) || 0), 0);
        const netTotal = total - discount;
        const paid = invoice?.payments ? invoice.payments.reduce((acc, payment) => acc + (parseFloat(payment.price) || 0), 0) : 0;
        const remaining = netTotal - paid;
        return {
            total,
            discount,
            netTotal,
            paid,
            remaining,
            items: acceptanceItems.length
        };
    }, [acceptanceItems, invoice]);
    // Quick action buttons
    const QuickActions = () => (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2}}>
            <Tooltip title="Print Receipt">
                <Button
                    variant="outlined"
                    startIcon={<Print/>}
                    href={route("acceptances.print", acceptance.id)}
                    component={Link}
                >
                    Print Receipt
                </Button>
            </Tooltip>
            {canEdit && (
                <Tooltip title="Edit Acceptance">
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<PlaylistAddCheck/>}
                        href={route("acceptances.edit", acceptance.id)}
                    >
                        Edit
                    </Button>
                </Tooltip>
            )}
            {canPrintBarcode && (
                <Tooltip title="Print Barcodes">
                    <Button
                        variant="outlined"
                        color="info"
                        target="_blank"
                        startIcon={<BarcodeIcon/>}
                        href={route("acceptances.barcodes", acceptance.id)}>
                        Print Barcodes
                    </Button>
                </Tooltip>
            )}
        </Box>
    );

    // Get the active report methods
    const activeReportMethods = Object.keys(acceptance?.howReport || {})
        .filter(method =>
            ["print", "email", "whatsapp"].includes(method) &&
            acceptance.howReport[method]
        );

    return (
        <Box sx={{
            p: {xs: "0.5em", sm: "1em", md: "1.5em"},
            backgroundColor: 'background.default',
            borderRadius: 2,
            boxShadow: {xs: 0, md: 1}
        }}>

            <PageHeader title={`Acceptance #${acceptance.id}`}
                        subtitle={`Created: ${new Date(acceptance.created_at).toLocaleString()}`} actions={[
                <StatusChip status={acceptance.status}/>
            ]}/>

            {/* Header with status and basic info */}
            <Box sx={{mb: 4}}>
                {/* Summary Cards Row */}
                <Grid container spacing={2} sx={{mb: 4}}>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="Total Items"
                            value={totals.items}
                            icon={PlaylistAddCheck}
                            color="primary"
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="Total Amount"
                            value={`${totals.netTotal.toFixed(2)}`}
                            icon={RequestQuote}
                            color="secondary"
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="Amount Paid"
                            value={`${totals.paid ? totals.paid.toFixed(2) : '0.00'}`}
                            icon={(props) => <Typography {...props}>OMR</Typography>}
                            color="success"
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <SummaryCard
                            title="Amount Due"
                            value={`${totals.remaining.toFixed(2)}`}
                            icon={Receipt}
                            color={totals.remaining > 0 ? "error" : "success"}
                        />
                    </Grid>
                </Grid>
            </Box>
            <QuickActions/>

            <Divider sx={{my: 4}}/>

            {/* Patient Information */}
            <PatientInfo
                patient={patient}
                showDocuments
                defaultExpanded={expanded.patient}
                viewPatient
            />

            {/* Report & Sampling Information */}
            <Accordion
                expanded={expanded.report}
                onChange={handleAccordionChange('report')}
                sx={{
                    mt: 2,
                    borderRadius: 1,
                    '&:before': {display: 'none'},
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="report-sampling-information"
                    id="report-sampling"
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    <SectionTitle icon={Timeline} title="Report & Sampling"/>
                </AccordionSummary>
                <AccordionDetails sx={{backgroundColor: 'background.default', p: 3}}>
                    <Grid container spacing={3}>
                        <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                            <InfoItem
                                label="Out Patient"
                                valueComponent={
                                    acceptance.out_patient ?
                                        <Check color="success"/> :
                                        <Close color="error"/>
                                }
                            />
                        </Grid>

                        {acceptance?.sampler && <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                            <InfoItem
                                label="Sampler"
                                valueComponent={
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <Typography variant="body2"
                                                    sx={{ml: 0.5}}>{acceptance?.sampler?.name}</Typography>
                                    </Box>
                                }
                            />
                        </Grid>}

                        <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                            <InfoItem
                                label="Acceptor"
                                value={acceptance.acceptor?.name}
                            />
                        </Grid>

                        <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                            <InfoItem
                                label="Report Method"
                                valueComponent={
                                    activeReportMethods.length > 0 ? (
                                        activeReportMethods.map(method => (
                                            <ReportMethodItem
                                                key={method}
                                                icon={methodConfig[method].icon}
                                                text={methodConfig[method].getText(acceptance.howReport)}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No report method specified
                                        </Typography>
                                    )
                                }
                            />
                        </Grid>
                        {acceptance.referrer && <>
                            <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                                <InfoItem
                                    label="Referrer"
                                    valueComponent={
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                            <LocalHospital color="primary" fontSize="small"/>
                                            <Typography variant="body2" sx={{ml: 0.5}}>
                                                {acceptance.referrer?.fullName || acceptance.referrer?.name}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Grid>

                            <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                                <InfoItem
                                    label="Reference No"
                                    value={acceptance.referenceCode}
                                />
                            </Grid>
                        </>}
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Doctor Information */}
            <Accordion
                expanded={expanded.doctor}
                onChange={handleAccordionChange('doctor')}
                sx={{
                    mt: 2,
                    borderRadius: 1,
                    '&:before': {display: 'none'},
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="doctor-information"
                    id="doctor"
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    <SectionTitle icon={Person} title="Doctor Information"/>
                </AccordionSummary>
                <AccordionDetails sx={{backgroundColor: 'background.default', p: 3}}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <InfoItem
                                label="Name"
                                value={acceptance.doctor?.name}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <InfoItem
                                label="Expertise"
                                value={acceptance.doctor?.expertise}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <InfoItem
                                label="Phone"
                                value={acceptance.doctor?.phone}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={3}>
                            <InfoItem
                                label="License No"
                                value={acceptance.doctor?.licenseNo}
                            />
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {/* Acceptance Items */}
            <Accordion
                expanded={expanded.items}
                onChange={handleAccordionChange('items')}
                sx={{
                    mt: 2,
                    borderRadius: 1,
                    '&:before': {display: 'none'},
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon/>}
                    aria-controls="acceptance-items"
                    id="acceptance-items"
                    sx={{
                        backgroundColor: 'background.paper',
                        borderRadius: '8px 8px 0 0'
                    }}
                >
                    <SectionTitle icon={Science} title="Test Items"/>
                </AccordionSummary>
                <AccordionDetails sx={{backgroundColor: 'background.default', p: 3}}>
                    <Paper elevation={1} sx={{borderRadius: 2, overflow: 'hidden'}}>
                        <TestsTable
                            showButton
                            showTotal={false}
                            tests={acceptance?.acceptance_items?.tests || []}
                            panels={acceptance?.acceptance_items?.panels || []}
                        />
                    </Paper>
                    <Box
                        sx={{
                            mt: 3,
                            p: 3,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Total Price:
                                    <Box component="span" sx={{ml: 1, color: 'text.primary'}}>
                                        {totals.total.toFixed(2)}
                                    </Box>
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Total Discount:
                                    <Box component="span" sx={{ml: 1, color: 'error.main'}}>
                                        {totals.discount.toFixed(2)}
                                    </Box>
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Net Amount:
                                    <Box component="span" sx={{ml: 1, color: 'success.main'}}>
                                        {totals.netTotal.toFixed(2)}
                                    </Box>
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </AccordionDetails>
            </Accordion>

            {/* Prescription */}
            <Box sx={{mt: 2}}>
                <Prescription
                    prescription={acceptance.prescription}
                    acceptance={acceptance}
                    defaultExpanded={expanded.prescription}
                />
            </Box>

            {/* Payment Information */}
            <Box sx={{mt: 2}}>
                <Payment
                    patient={patient}
                    acceptance={acceptance}
                    acceptanceItems={acceptanceItems}
                    invoice={invoice}
                    status={status}
                    minAllowablePayment={minAllowablePayment}
                    defaultExpanded={expanded.payment}
                />
            </Box>
        </Box>
    );
};

Show.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            {
                title: "Patients",
                link: route("patients.index"),
                icon: null,
            },
            {
                title: page.props.patient.fullName,
                link: route("patients.show", page.props.patient.id),
                icon: null,
            },
            {
                title: "Acceptances",
                link: route("acceptances.index", {patient_id: page.props.patient.id}),
                icon: null,
            },
            {
                title: `Acceptance #${page?.props?.acceptance?.id}`,
                link: "",
                icon: null
            }
        ]}
    />
);

export default Show;
