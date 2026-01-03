import React, {useEffect, useState} from "react";
import {useSnackbar} from "notistack";

import {
    Accordion,
    AccordionDetails,
    Alert,
    Stack,
    Paper,
    Button,
    Typography,
    AccordionSummary,
    AccordionActions,
    Dialog,
    DialogTitle,
    DialogActions,
    Box,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    LinearProgress,
} from "@mui/material";
import {
    Edit,
    ExpandMore as ExpandMoreIcon,
    ThumbDownAlt,
    ThumbUpAlt,
    Close,
    DownloadOutlined,
    VisibilityOffOutlined,
    HistoryOutlined,
    Description,
    MedicalServices,
    Report as ReportIcon,
    Visibility as VisibilityIcon
} from "@mui/icons-material";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

import PatientInfo from "@/Pages/Patient/Components/PatientInfo";
import DocumentsInfo from "@/Components/DocumentsInfo";
import TestInfo from "@/Pages/AcceptanceItem/Components/TestInfo";
import SectionsInfo from "@/Pages/AcceptanceItem/Components/SectionsInfo";

import ApproveForm from "./Components/ApproveForm";
import RejectForm from "./Components/RejectForm";
import History from "./Components/History";
import Signers from "./Components/Signers";

import DialogContent from "@mui/material/DialogContent";
import {router, useForm, Link} from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";

const formatDate = (date) => {
    if (!date)
        return "";
    if (typeof date === 'string')
        date = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

/**
 * Show Component - Displays a comprehensive view of a report with approval and publishing functionality
 *
 * @param {Object} props - Component props
 * @param {Object} props.report - The report data to display
 * @param {string} props.status - Status message
 * @param {Array} props.history - Report history array
 * @param {Array} props.signers - Report signers array
 * @param {boolean} props.canApprove - Whether the user can approve the report
 * @param {boolean} props.canEdit - Whether the user can edit the report
 * @param {boolean} props.canPrint - Whether the user can print the report
 * @param {boolean} props.canPublish - Whether the user can publish the report
 * @param {boolean} props.canUnpublish - Whether the user can unpublish the report
 * @param {string} props.clinicalCommentTemplateUrl - URL for clinical comment template
 */
const Show = ({
                  report,
                  status,
                  history,
                  signers,
                  canApprove,
                  canEdit,
                  canPrint,
                  canPublish,
                  canUnpublish,
                  clinicalCommentTemplateUrl
              }) => {
    const {post, data, setData, wasSuccessful, hasErrors, errors, reset, processing} = useForm({_method: "put"});
    const [openApprove, setOpenApprove] = useState(false);
    const [openReject, setOpenReject] = useState(false);
    const [openUnpublish, setOpenUnpublish] = useState(false);
    const {enqueueSnackbar} = useSnackbar();
    const [activeAccordions, setActiveAccordions] = useState({
        report: true,
        clinicalReport: report.clinical_comment || report.clinical_comment_document,
        signers: true
    });

    // Handle approval dialog open
    const handleApprove = () => {
        setData(previousData => ({
            ...previousData,
            clinical_comment: report.clinical_comment,
        }));
        setOpenApprove(true);
    };

    // Handle clinical report edit
    const handleEditClinicalReport = () => {
        setData({
            clinical_comment: report.clinical_comment,
            approver: report.approver,
            clinical_comment_document: report.clinical_comment_document,
            published_report_document: report.published_document,
            _method: "put"
        });
        setOpenApprove(true);
    };

    // Cancel any open dialog
    const cancel = () => {
        setOpenApprove(false);
        setOpenReject(false);
        setOpenUnpublish(false);
        reset();
    };

    // Show success/error notifications
    useEffect(() => {
        if (wasSuccessful) {
            enqueueSnackbar("it has done successfully", {variant: "success"});
        }
        if (hasErrors) {
            Object.keys(errors).forEach((item) =>
                enqueueSnackbar(`${item}: ${errors[item]}`, {variant: "error"})
            );
        }
    }, [wasSuccessful, hasErrors]);

    // Submit approval
    const approve = () => {
        post(route("reports.approve", report.id), {onSuccess: () => setOpenApprove(false)});
    };

    // Submit rejection
    const reject = () => {
        post(route("reports.reject", report.id), {onSuccess: () => setOpenReject(false)});
    };

    // Submit unpublish
    const unpublish = () =>
        post(route("reports.unpublish", report.id), {
            onSuccess: () => setOpenUnpublish(false)
        });

    // Open dialog handlers
    const handleReject = () => setOpenReject(true);
    const handleUnpublish = () => setOpenUnpublish(true);

    // Handle form field changes
    const handleChange = (e) =>
        setData(prevState => ({...prevState, [e.target.name]: e.target.value}));

    // Navigate to edit page
    const handleEdit = () => router.visit(route("reports.edit", report.id));

    // Handle accordion state changes
    const handleAccordionChange = (accordionName) => (event, expanded) => {
        setActiveAccordions(prev => ({
            ...prev,
            [accordionName]: expanded
        }));
    };

    // Get report status chip configuration
    const getStatusChip = () => {
        if (!report.status) {
            return {label: "Rejected", color: "error", icon: <ThumbDownAlt fontSize="small"/>};
        }
        if (report.publisher) {
            return {label: "Published", color: "success", icon: <Share fontSize="small"/>};
        }
        if (report.approver) {
            return {label: "Approved", color: "primary", icon: <ThumbUpAlt fontSize="small"/>};
        }
        return {label: "Pending", color: "warning", icon: <HistoryOutlined fontSize="small"/>};
    };

    const statusChip = getStatusChip();

    return (
        <Box sx={{mb: 4}}>
            {/* Rejection Alert */}
            {!report.status && (
                <Alert
                    severity="error"
                    variant="filled"
                    icon={<ThumbDownAlt/>}
                    sx={{mb: 3}}
                    action={
                        <IconButton color="inherit" size="small" aria-label="close">
                            <Close fontSize="small"/>
                        </IconButton>
                    }
                >
                    This report was rejected
                    by <strong>{report?.reporter?.name}</strong> at {formatDate(report.approved_at)}
                </Alert>
            )}

            <PageHeader title={`Report #${report.id}`}
                        icon={<ReportIcon/>}
                        subtitle={<Chip
                            icon={statusChip.icon}
                            label={statusChip.label}
                            color={statusChip.color}
                            size="small"
                        />}
                        actions={[
                            <Tooltip title="View Acceptance Item" key="view-acceptance-item">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    component={Link}
                                    href={route("acceptanceItems.show", {
                                        acceptance: report.acceptance_item.acceptance_id,
                                        acceptanceItem: report.acceptance_item.id
                                    })}
                                    startIcon={<VisibilityIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 'medium'
                                    }}
                                >
                                    View Acceptance Item
                                </Button>
                            </Tooltip>,
                            canEdit ?
                                <Tooltip title="Edit Report" key="edit-report">
                                    <Button
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        onClick={handleEdit}
                                        startIcon={<Edit/>}
                                    >
                                        Edit
                                    </Button>
                                </Tooltip> : null,
                            canApprove && !report.approver ? <>
                                <Tooltip title="Reject Report">
                                    <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={handleReject}
                                        startIcon={<ThumbDownAlt/>}
                                    >
                                        Reject
                                    </Button>
                                </Tooltip>
                                <Tooltip title="Approve Report">
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={handleApprove}
                                        startIcon={<ThumbUpAlt/>}
                                    >
                                        Approve
                                    </Button>
                                </Tooltip>
                            </> : null,
                            canUnpublish && report.publisher ?
                                <Tooltip title="Unpublish Report">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={handleUnpublish}
                                        startIcon={<VisibilityOffOutlined/>}
                                    >
                                        Unpublish
                                    </Button>
                                </Tooltip> : null
                        ]}/>

            {/* Patient Information */}
            {report.acceptance_item.patients.map((patient, index) => (
                <React.Fragment key={`patient-${index}`}>
                    <PatientInfo patient={patient} showDocuments defaultExpanded={false}/>

                    {/* Consultation Information */}
                    {patient?.consultation?.information && (
                        <Accordion
                            defaultExpanded={false}
                            elevation={2}
                            sx={{mb: 2, borderRadius: 1, overflow: 'hidden'}}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <MedicalServices color="primary"/>
                                    <Typography variant="h6">Consultation</Typography>
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Paper
                                    variant="outlined"
                                    sx={{p: 2, borderRadius: 1}}
                                >
                                    {patient.consultation.information?.image && (
                                        <Box
                                            component="img"
                                            src={patient.consultation.information?.image}
                                            alt="Consultation Image"
                                            sx={{
                                                width: "100%",
                                                mb: 2,
                                                borderRadius: 1,
                                                boxShadow: 1
                                            }}
                                        />
                                    )}
                                    <Box
                                        sx={{
                                            "& img": {maxWidth: "100%"},
                                            "& table": {borderCollapse: "collapse"},
                                            "& td, & th": {border: "1px solid #ddd", padding: "8px"}
                                        }}
                                        dangerouslySetInnerHTML={{__html: patient?.consultation?.information?.report}}
                                    />
                                </Paper>
                            </AccordionDetails>
                        </Accordion>
                    )}
                </React.Fragment>
            ))}

            {/* Test Information */}
            <TestInfo
                method={report.acceptance_item?.method}
                test={report.acceptance_item.test}
                showSections={false}
                defaultExpanded={false}
            />

            {/* Sections Information */}
            <SectionsInfo
                acceptanceItemStates={report.acceptance_item.acceptance_item_states}
                defaultExpanded={false}
            />

            {/* History */}
            {history.length > 0 && report.status ? <History history={history}/> : null}

            {/* Report Content */}
            <Accordion
                defaultExpanded={true}
                expanded={activeAccordions.report}
                onChange={handleAccordionChange('report')}
                elevation={2}
                sx={{
                    mb: 2,
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:before': {display: 'none'},
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Description color="primary"/>
                        <Typography variant="h6">Report Content</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 1,
                            "& img": {maxWidth: "100%"}
                        }}
                    >
                        {report.value ? (
                            <Box
                                sx={{
                                    overflowX: "auto",
                                    "& table": {borderCollapse: "collapse"},
                                    "& td, & th": {border: "1px solid #ddd", padding: "8px"}
                                }}
                                dangerouslySetInnerHTML={{__html: report.value}}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No report content available
                            </Typography>
                        )}
                    </Paper>

                    {/* Report Metadata */}
                    <Box sx={{mt: 2}}>
                        <Stack spacing={2} divider={<Divider flexItem/>}>
                            {/* Reported By */}
                            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems={{sm: 'center'}}
                                   justifyContent="space-between">
                                <Typography>
                                    Reported
                                    by <strong>{report.reporter.name}</strong> at {formatDate(report.reported_at)}
                                </Typography>
                                {report.reported_document && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<DownloadOutlined/>}
                                        target="_blank"
                                        href={route("reports.download", (report.id ?? report.hash))}
                                    >
                                        Download Report
                                    </Button>
                                )}
                            </Stack>

                            {/* Approved By */}
                            {report.approver && (
                                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems={{sm: 'center'}}
                                       justifyContent="space-between">
                                    <Typography>
                                        Approved
                                        by <strong>{report.approver.name}</strong> at {formatDate(report.approved_at)}
                                    </Typography>
                                    {report.approved_document && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<DownloadOutlined/>}
                                            target="_blank"
                                            href={route("documents.show", report?.approved_document?.id || report?.approved_document?.hash)}
                                        >
                                            Download Approved Version
                                        </Button>
                                    )}
                                </Stack>
                            )}

                            {/* Published By */}
                            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} alignItems={{sm: 'center'}}
                                   justifyContent="space-between">
                                {report.publisher && (<Typography>
                                    Published
                                    by <strong>{report.publisher.name}</strong> at {formatDate(report.published_at)}
                                </Typography>)}
                                {report.published_document && canPrint && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<DownloadOutlined/>}
                                        target="_blank"
                                        href={route("documents.show", report?.published_document?.id || report?.published_document?.hash)}
                                    >
                                        Download Published Version
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Attached Documents */}
                    {report.documents.length > 0 && (
                        <Box sx={{mt: 3}}>
                            <Typography variant="subtitle1" gutterBottom>
                                Attached Documents
                            </Typography>
                            <DocumentsInfo
                                documents={report.documents}
                                editable={false}
                                patientId={report.acceptance_item.patients[0].id}
                            />
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Clinical Report */}

            <Accordion
                expanded={activeAccordions.clinicalReport}
                onChange={handleAccordionChange('clinicalReport')}
                elevation={2}
                sx={{
                    mb: 2,
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:before': {display: 'none'},
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <MedicalServices color="primary"/>
                        <Typography variant="h6">Clinical Report</Typography>
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 1,
                            "& img": {maxWidth: "100%"}
                        }}
                    >
                        {report.clinical_comment ? (
                            <Box
                                sx={{
                                    overflow: "auto",
                                    maxWidth: "100%",
                                    "& table": {borderCollapse: "collapse"},
                                    "& td, & th": {border: "1px solid #ddd", padding: "8px"}
                                }}
                                dangerouslySetInnerHTML={{__html: report.clinical_comment}}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No clinical comment content available
                            </Typography>
                        )}

                        {report.clinical_comment_document && (
                            <Box sx={{mt: 2}}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DownloadOutlined/>}
                                    target="_blank"
                                    href={route("documents.download", (report.clinical_comment_document.id ?? report.clinical_comment_document.hash))}
                                >
                                    Download Clinical Report
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </AccordionDetails>
                {canEdit && report.approver && (
                    <AccordionActions>
                        <Button
                            onClick={handleEditClinicalReport}
                            startIcon={<Edit/>}
                            size="small"
                            color="primary"
                        >
                            Edit Clinical Report
                        </Button>
                    </AccordionActions>
                )}
            </Accordion>

            {/* Signers */}
            {signers && (
                <Box sx={{mb: 2}}>
                    <Signers
                        signers={signers}
                        onChange={null}
                        editable={false}
                    />
                </Box>
            )}

            {/* Processing Indicator */}
            {processing && (
                <Box sx={{width: '100%', mb: 2}}>
                    <LinearProgress/>
                </Box>
            )}

            {/* Dialogs */}
            <ApproveForm
                open={openApprove}
                onCancel={cancel}
                setData={setData}
                onSubmit={approve}
                data={data}
                documents={report.documents.filter(item => item.ext === 'pdf')}
                clinicalCommentTemplateUrl={clinicalCommentTemplateUrl}
            />

            <RejectForm
                open={openReject}
                onCancel={cancel}
                onChange={handleChange}
                onSubmit={reject}
                data={data}
            />

            <Dialog
                open={openUnpublish}
                maxWidth="sm"
                fullWidth
                slotProps={{Paper: {sx: {borderRadius: 2}}}}
            >
                <DialogTitle sx={{pb: 1}}>
                    Unpublish Report
                </DialogTitle>
                <DialogContent sx={{pt: 2}}>
                    <Typography>
                        Are you sure you want to unpublish this report? This action will make the report unavailable to
                        users.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{p: 2, pt: 1}}>
                    <Button
                        onClick={cancel}
                        color="inherit"
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={unpublish}
                        disabled={processing}
                        startIcon={processing ? <LinearProgress size={20}/> : <VisibilityOffOutlined/>}
                    >
                        Unpublish
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Define breadcrumbs
let breadCrumbs = [
    {
        title: "Reports",
        link: route("reports.index"),
        icon: null,
    },
];

// Set layout
Show.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: "Report " + page.props.report.id,
                icon: null
            }
        ]}
    />
);

export default Show;
