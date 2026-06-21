import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Box, Divider } from '@mui/material';
import { Sync } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import PatientInfo from '@/Pages/Patient/Components/PatientInfo';
import Prescription from './Components/Prescription';
import Payment from './Components/Payment';
import Button from '@mui/material/Button';
import { Head, router } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader.jsx';
import InlineTagManager from '@/Components/InlineTagManager';
import StatusChip from './Show/StatusChip';
import PriorityChanger from './Show/PriorityChanger';
import SummaryCards from './Show/SummaryCards';
import QuickActions from './Show/QuickActions';
import ReportSamplingSection from './Show/ReportSamplingSection';
import DoctorInfoSection from './Show/DoctorInfoSection';
import TestItemsSection from './Show/TestItemsSection';

const Show = ({
    acceptance,
    patient,
    acceptanceItems,
    invoice,
    minAllowablePayment = 0,
    canEdit,
    status,
    canPrintBarcode,
    canCheckStatus,
    canUpdatePriority,
    canEditItemPrices,
    maxDiscount = 0,
}) => {
    // State
    const [expanded, setExpanded] = useState({
        patient: true,
        report: true,
        doctor: true,
        items: true,
        prescription: false,
        payment: true,
    });

    const [promotingTests, setPromotingTests] = useState(null); // array of selected tests
    const [editingPrices, setEditingPrices] = useState(false);
    const [editItem, setEditItem] = useState({ open: false, mode: null, test: null, panel: null });

    const handleEditTest = (id) => {
        const test = (acceptance?.acceptance_items?.tests || []).find((t) => t.id === id);
        if (test) setEditItem({ open: true, mode: 'editTest', test, panel: null });
    };

    const handleEditPanel = (id) => {
        const panel = (acceptance?.acceptance_items?.panels || []).find((p) => p.id === id);
        if (panel) setEditItem({ open: true, mode: 'editPanel', test: null, panel });
    };

    const closeEditItem = () => setEditItem({ open: false, mode: null, test: null, panel: null });

    const submitEditedTest = (testItem) => {
        router.put(
            route('acceptances.updateItem', acceptance.id),
            { tests: [testItem] },
            {
                preserveScroll: true,
                onSuccess: closeEditItem,
            },
        );
    };

    const submitEditedPanel = (panelItem) => {
        router.put(
            route('acceptances.updateItem', acceptance.id),
            { panels: [panelItem] },
            {
                preserveScroll: true,
                onSuccess: closeEditItem,
            },
        );
    };

    const handleEjectPanel = (panel) => {
        const firstItem = panel.acceptanceItems?.[0];
        if (!firstItem) return;
        router.put(
            route('acceptanceItems.ejectPanel', {
                acceptance: acceptance.id,
                acceptanceItem: firstItem.id,
            }),
            {},
            { preserveState: true, only: ['acceptance'] },
        );
    };

    const handlePromoteToPanel = (panelMethodTestIds) => {
        if (!promotingTests?.length) return;
        router.put(
            route('acceptances.promoteToPanel', { acceptance: acceptance.id }),
            {
                acceptance_item_ids: promotingTests.map((t) => t.id),
                panel_method_tests: panelMethodTestIds,
            },
            {
                preserveState: true,
                only: ['acceptance'],
                onSuccess: () => setPromotingTests(null),
            },
        );
    };

    // Handle accordion expansion
    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded({ ...expanded, [panel]: isExpanded });
    };

    // Calculate totals
    const totals = useMemo(() => {
        const total = acceptanceItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
        const discount = acceptanceItems.reduce(
            (acc, item) => acc + (parseFloat(item.discount) || 0),
            0,
        );
        const netTotal = total - discount;
        const paid = invoice?.payments
            ? invoice.payments.reduce((acc, payment) => acc + (parseFloat(payment.price) || 0), 0)
            : 0;
        const remaining = netTotal - paid;
        return {
            total,
            discount,
            netTotal,
            paid,
            remaining,
            items: acceptanceItems.length,
        };
    }, [acceptanceItems, invoice]);

    // Get the active report methods
    const activeReportMethods = Object.keys(acceptance?.howReport || {}).filter(
        (method) => ['print', 'sms', 'whatsapp'].includes(method) && acceptance.howReport[method],
    );

    return (
        <Box
            sx={{
                p: { xs: '0.5em', sm: '1em', md: '1.5em' },
                backgroundColor: 'background.default',
                borderRadius: 2,
                boxShadow: { xs: 0, md: 1 },
            }}
        >
            <Head title={`Acceptance #${acceptance.id}`} />
            <PageHeader
                title={`Acceptance #${acceptance.id}`}
                subtitle={`Created: ${new Date(acceptance.created_at).toLocaleString()}`}
                actions={[
                    <StatusChip key="status" status={acceptance.status} />,
                    <PriorityChanger
                        key="priority"
                        acceptance={acceptance}
                        canUpdatePriority={canUpdatePriority}
                    />,
                    canCheckStatus && (
                        <Button
                            key="check-status"
                            variant="outlined"
                            startIcon={<Sync />}
                            onClick={() => {
                                router.put(
                                    route('acceptances.checkStatus', acceptance.id),
                                    {},
                                    {
                                        preserveState: true,
                                        only: ['acceptance', 'success', 'status'],
                                    },
                                );
                            }}
                        >
                            Check Status
                        </Button>
                    ),
                ]}
            />

            <Box sx={{ mb: 2 }}>
                <InlineTagManager
                    initialTags={acceptance?.tags || []}
                    updateUrl={route('acceptances.tags.update', acceptance.id)}
                    entityType="acceptance"
                />
            </Box>

            {/* Header with status and basic info */}
            <SummaryCards totals={totals} />
            <QuickActions
                acceptance={acceptance}
                canEdit={canEdit}
                canPrintBarcode={canPrintBarcode}
            />

            <Divider sx={{ my: 4 }} />

            {/* Patient Information */}
            <PatientInfo
                patient={patient}
                showDocuments
                defaultExpanded={expanded.patient}
                viewPatient
            />

            {/* Report & Sampling Information */}
            <ReportSamplingSection
                acceptance={acceptance}
                expanded={expanded.report}
                onChange={handleAccordionChange('report')}
                activeReportMethods={activeReportMethods}
            />

            {/* Doctor Information */}
            <DoctorInfoSection
                acceptance={acceptance}
                expanded={expanded.doctor}
                onChange={handleAccordionChange('doctor')}
            />

            {/* Acceptance Items */}
            <TestItemsSection
                acceptance={acceptance}
                acceptanceItems={acceptanceItems}
                patient={patient}
                totals={totals}
                expanded={expanded.items}
                onChange={handleAccordionChange('items')}
                canEditItemPrices={canEditItemPrices}
                maxDiscount={maxDiscount}
                promotingTests={promotingTests}
                setPromotingTests={setPromotingTests}
                onPromoteToPanel={handlePromoteToPanel}
                onEjectPanel={handleEjectPanel}
                onEditTest={handleEditTest}
                onEditPanel={handleEditPanel}
                editingPrices={editingPrices}
                setEditingPrices={setEditingPrices}
                editItem={editItem}
                closeEditItem={closeEditItem}
                onSubmitTest={submitEditedTest}
                onSubmitPanel={submitEditedPanel}
            />

            {/* Prescription */}
            <Box sx={{ mt: 2 }}>
                <Prescription
                    prescription={acceptance.prescription}
                    acceptance={acceptance}
                    defaultExpanded={expanded.prescription}
                />
            </Box>

            {/* Payment Information */}
            <Box sx={{ mt: 2 }}>
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

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: 'Patients',
                link: route('patients.index'),
                icon: null,
            },
            {
                title: page.props.patient.fullName,
                link: route('patients.show', page.props.patient.id),
                icon: null,
            },
            {
                title: 'Acceptances',
                link: route('acceptances.index', { patient_id: page.props.patient.id }),
                icon: null,
            },
            {
                title: `Acceptance #${page?.props?.acceptance?.id}`,
                link: '',
                icon: null,
            },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
