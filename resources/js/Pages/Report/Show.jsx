import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

import { Alert, Box, IconButton, LinearProgress } from '@mui/material';
import { ThumbDownAlt, Close } from '@mui/icons-material';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import TestInfo from '@/Pages/AcceptanceItem/Components/TestInfo';
import SectionsInfo from '@/Pages/AcceptanceItem/Components/SectionsInfo';

import ApproveForm from './Components/ApproveForm';
import ApprovalFlowStepper from './Components/ApprovalFlowStepper';
import RejectForm from './Components/RejectForm';
import History from './Components/History';
import Signers from './Components/Signers';

import { Head, router, useForm } from '@inertiajs/react';
import { formatDate, getStatusChip } from './Show/helpers';
import ReportHeader from './Show/ReportHeader';
import PatientSection from './Show/PatientSection';
import ReportContent from './Show/ReportContent';
import ClinicalReport from './Show/ClinicalReport';
import StepApproveDialog from './Show/StepApproveDialog';
import UnpublishDialog from './Show/UnpublishDialog';

/**
 * Show Component - Displays a comprehensive view of a report with approval and publishing functionality
 *
 * @param {Object} props - Component props
 * @param {Object} props.report - The report data to display
 * @param {Array} props.history - Report history array
 * @param {Array} props.signers - Report signers array
 * @param {boolean} props.canApprove - Whether the user can approve the report
 * @param {boolean} props.canEdit - Whether the user can edit the report
 * @param {boolean} props.canPrint - Whether the user can print the report
 * @param {boolean} props.canUnpublish - Whether the user can unpublish the report
 * @param {string} props.clinicalCommentTemplateUrl - URL for clinical comment template
 */
const Show = ({
    report,
    _status,
    history,
    signers,
    canApprove,
    canEdit,
    canPrint,
    _canPublish,
    canUnpublish,
    clinicalCommentTemplateUrl,
}) => {
    const { post, data, setData, wasSuccessful, hasErrors, errors, reset, processing } = useForm({
        _method: 'put',
    });
    const [openApprove, setOpenApprove] = useState(false);
    const [openStepApprove, setOpenStepApprove] = useState(false);
    const [openReject, setOpenReject] = useState(false);
    const [openUnpublish, setOpenUnpublish] = useState(false);

    // Approval flow context: which step is awaiting action and whether it is the last one
    const approvalFlow = report.report_template?.approval_flow;
    const flowSteps =
        approvalFlow?.active && approvalFlow.steps?.length ? approvalFlow.steps : null;
    const currentStepPosition = report.current_step_position ?? flowSteps?.[0]?.position;
    const currentStep = flowSteps?.find((step) => step.position === currentStepPosition);
    const isFinalStep =
        !flowSteps || currentStepPosition === flowSteps[flowSteps.length - 1].position;
    const { enqueueSnackbar } = useSnackbar();
    const [activeAccordions, setActiveAccordions] = useState({
        report: true,
        clinicalReport: report.clinical_comment || report.clinical_comment_document,
        signers: true,
    });

    // Handle approval dialog open: intermediate steps only collect an optional
    // comment, the final step uploads the published PDF
    const handleApprove = () => {
        if (!isFinalStep) {
            setOpenStepApprove(true);
            return;
        }
        setData((previousData) => ({
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
            _method: 'put',
        });
        setOpenApprove(true);
    };

    // Cancel any open dialog
    const cancel = () => {
        setOpenApprove(false);
        setOpenStepApprove(false);
        setOpenReject(false);
        setOpenUnpublish(false);
        reset();
    };

    // Show success/error notifications
    useEffect(() => {
        if (wasSuccessful) {
            enqueueSnackbar('it has done successfully', { variant: 'success' });
        }
        if (hasErrors) {
            Object.keys(errors).forEach((item) =>
                enqueueSnackbar(`${item}: ${errors[item]}`, { variant: 'error' }),
            );
        }
    }, [wasSuccessful, hasErrors, errors, enqueueSnackbar]);

    // Submit approval
    const approve = () => {
        post(route('reports.approve', report.id), {
            onSuccess: () => {
                setOpenApprove(false);
                setOpenStepApprove(false);
            },
        });
    };

    // Submit rejection
    const reject = () => {
        post(route('reports.reject', report.id), { onSuccess: () => setOpenReject(false) });
    };

    // Submit unpublish
    const unpublish = () =>
        post(route('reports.unpublish', report.id), {
            onSuccess: () => setOpenUnpublish(false),
        });

    // Open dialog handlers
    const handleReject = () => setOpenReject(true);
    const handleUnpublish = () => setOpenUnpublish(true);

    // Handle form field changes
    const handleChange = (e) =>
        setData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));

    // Navigate to edit page
    const handleEdit = () => router.visit(route('reports.edit', report.id));

    // Handle accordion state changes
    const handleAccordionChange = (accordionName) => (event, expanded) => {
        setActiveAccordions((prev) => ({
            ...prev,
            [accordionName]: expanded,
        }));
    };

    const statusChip = getStatusChip(report, currentStep);

    return (
        <Box sx={{ mb: 4 }}>
            <Head title={`Report #${report.id}`} />
            {/* Rejection Alert */}
            {!report.status && (
                <Alert
                    severity="error"
                    variant="filled"
                    icon={<ThumbDownAlt />}
                    sx={{ mb: 3 }}
                    action={
                        <IconButton color="inherit" size="small" aria-label="close">
                            <Close fontSize="small" />
                        </IconButton>
                    }
                >
                    This report was rejected by <strong>{report?.reporter?.name}</strong> at{' '}
                    {formatDate(report.approved_at)}
                </Alert>
            )}

            <ReportHeader
                report={report}
                statusChip={statusChip}
                canEdit={canEdit}
                canApprove={canApprove}
                canUnpublish={canUnpublish}
                onEdit={handleEdit}
                onApprove={handleApprove}
                onReject={handleReject}
                onUnpublish={handleUnpublish}
            />

            {/* Patient Information */}
            <PatientSection patients={report.acceptance_item.patients} />

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

            {/* Approval Flow Progress */}
            <ApprovalFlowStepper report={report} />

            {/* History */}
            {history.length > 0 && report.status ? <History history={history} /> : null}

            {/* Report Content */}
            <ReportContent
                report={report}
                canPrint={canPrint}
                expanded={activeAccordions.report}
                onChange={handleAccordionChange('report')}
            />

            {/* Clinical Report */}
            <ClinicalReport
                report={report}
                canEdit={canEdit}
                expanded={activeAccordions.clinicalReport}
                onChange={handleAccordionChange('clinicalReport')}
                onEdit={handleEditClinicalReport}
            />

            {/* Signers */}
            {signers && (
                <Box sx={{ mb: 2 }}>
                    <Signers signers={signers} onChange={null} editable={false} />
                </Box>
            )}

            {/* Processing Indicator */}
            {processing && (
                <Box sx={{ width: '100%', mb: 2 }}>
                    <LinearProgress />
                </Box>
            )}

            {/* Dialogs */}
            <ApproveForm
                open={openApprove}
                onCancel={cancel}
                setData={setData}
                onSubmit={approve}
                data={data}
                documents={report.documents.filter((item) => item.ext === 'pdf')}
                clinicalCommentTemplateUrl={clinicalCommentTemplateUrl}
            />

            <RejectForm
                open={openReject}
                onCancel={cancel}
                onChange={handleChange}
                onSubmit={reject}
                data={data}
            />

            {/* Intermediate Step Approval Dialog */}
            <StepApproveDialog
                open={openStepApprove}
                onCancel={cancel}
                onApprove={approve}
                onChange={handleChange}
                data={data}
                processing={processing}
                currentStep={currentStep}
                approvalFlow={approvalFlow}
            />

            <UnpublishDialog
                open={openUnpublish}
                onCancel={cancel}
                onConfirm={unpublish}
                processing={processing}
            />
        </Box>
    );
};

// Define breadcrumbs
let breadCrumbs = [
    {
        title: 'Reports',
        link: route('reports.index'),
        icon: null,
    },
];

// Set layout
Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: 'Report ' + page.props.report.id,
                icon: null,
            },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
