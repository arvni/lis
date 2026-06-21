import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Alert, Grid } from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import DocumentViewer from '@/Pages/Document';
import WorkflowProgress from './Show/WorkflowProgress';
import DiscussionPanel from './Show/DiscussionPanel';
import RequestInfoCard from './Show/RequestInfoCard';
import LineItemsCard from './Show/LineItemsCard';
import ReceivingHistoryCard from './Show/ReceivingHistoryCard';
import TimelineCard from './Show/TimelineCard';
import HeaderActions from './Show/HeaderActions';
import ActionDialogs from './Show/ActionDialogs';
import TemplateMatchDialog from './Show/TemplateMatchDialog';

const Show = () => {
    const {
        purchaseRequest: pr,
        approvals,
        canActOnWorkflow,
        canDirectApprove,
        isRequester,
        wasRejected,
        users,
        success,
        status,
        poDocument,
        paymentDocument,
    } = usePage().props;
    const [viewingDoc, setViewingDoc] = useState(null);

    // Template match check
    const [matchDialog, setMatchDialog] = useState(false);
    const [matchResult, setMatchResult] = useState(null);
    const [matchLoading, setMatchLoading] = useState(false);

    const checkTemplate = () => {
        setMatchLoading(true);
        setMatchDialog(true);
        axios
            .get(route('inventory.purchase-requests.match-template', pr.id))
            .then((r) => setMatchResult(r.data))
            .finally(() => setMatchLoading(false));
    };

    // Dialog state
    const [submitDialog, setSubmitDialog] = useState(false);
    const [changeNotes, setChangeNotes] = useState('');
    const [orderDialog, setOrderDialog] = useState(false);
    const [payDialog, setPayDialog] = useState(false);
    const [shipDialog, setShipDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);
    const [brandsDialog, setBrandsDialog] = useState(false);
    const [brandLines, setBrandLines] = useState([]);

    const [orderSupplier, setOrderSupplier] = useState(pr.supplier ?? null);
    const orderForm = useForm({ po_number: '', supplier_id: pr.supplier_id ?? '', po_file: null });
    const payForm = useForm({ payment_date: '', payment_reference: '', payment_file: null });
    const shipForm = useForm({
        shipment_date: '',
        tracking_number: '',
        expected_delivery_date: '',
    });
    const cancelForm = useForm({ notes: '' });

    const openBrandsDialog = () => {
        setBrandLines(
            (pr.lines ?? []).map((l) => ({ id: l.id, brand: l.brand ?? '', item: l.item })),
        );
        setBrandsDialog(true);
    };
    const submitBrands = () => {
        router.post(
            route('inventory.purchase-requests.set-brands', pr.id),
            { lines: brandLines },
            {
                onSuccess: () => setBrandsDialog(false),
            },
        );
    };

    const submitOrder = () =>
        orderForm.post(route('inventory.purchase-requests.order', pr.id), {
            forceFormData: true,
            onSuccess: () => setOrderDialog(false),
        });
    const submitPay = () =>
        payForm.post(route('inventory.purchase-requests.pay', pr.id), {
            forceFormData: true,
            onSuccess: () => setPayDialog(false),
        });
    const submitShip = () =>
        shipForm.post(route('inventory.purchase-requests.ship', pr.id), {
            onSuccess: () => setShipDialog(false),
        });
    const submitCancel = () =>
        cancelForm.post(route('inventory.purchase-requests.cancel', pr.id), {
            onSuccess: () => setCancelDialog(false),
        });

    const handleAction = (action) =>
        router.put(route('inventory.purchase-requests.update', pr.id), { action });

    const histories = pr.histories ?? [];
    const currentStatus = pr.status;

    return (
        <>
            <Head title={`Purchase Request #${pr.id}`} />
            <PageHeader
                title={`Purchase Request #${pr.id}${pr.po_number ? ` · PO ${pr.po_number}` : ''}`}
                actions={
                    <HeaderActions
                        pr={pr}
                        currentStatus={currentStatus}
                        canDirectApprove={canDirectApprove}
                        isRequester={isRequester}
                        approvals={approvals}
                        onCheckTemplate={checkTemplate}
                        onSubmit={() =>
                            wasRejected ? setSubmitDialog(true) : handleAction('submit')
                        }
                        onApprove={() => handleAction('approve')}
                        onIssuePO={() => setOrderDialog(true)}
                        onSetBrands={openBrandsDialog}
                        onRecordPayment={() => setPayDialog(true)}
                        onMarkShipped={() => setShipDialog(true)}
                        onCancel={() => setCancelDialog(true)}
                    />
                }
            />

            {status && (
                <Alert severity={success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left: info + lines + receipts */}
                <Grid size={{ xs: 12, md: 7 }}>
                    {pr.workflow_template_id && (
                        <WorkflowProgress
                            approvals={approvals ?? []}
                            canAct={canActOnWorkflow}
                            prId={pr.id}
                            users={users}
                        />
                    )}
                    <DiscussionPanel comments={pr.comments ?? []} prId={pr.id} />
                    <RequestInfoCard
                        pr={pr}
                        poDocument={poDocument}
                        paymentDocument={paymentDocument}
                        onViewDoc={setViewingDoc}
                    />
                    <LineItemsCard lines={pr.lines} />
                    {pr.receipts?.length > 0 && <ReceivingHistoryCard receipts={pr.receipts} />}
                </Grid>

                {/* Right: timeline */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <TimelineCard histories={histories} />
                </Grid>
            </Grid>

            <ActionDialogs
                pr={pr}
                orderDialog={orderDialog}
                setOrderDialog={setOrderDialog}
                orderForm={orderForm}
                orderSupplier={orderSupplier}
                setOrderSupplier={setOrderSupplier}
                submitOrder={submitOrder}
                payDialog={payDialog}
                setPayDialog={setPayDialog}
                payForm={payForm}
                submitPay={submitPay}
                shipDialog={shipDialog}
                setShipDialog={setShipDialog}
                shipForm={shipForm}
                submitShip={submitShip}
                cancelDialog={cancelDialog}
                setCancelDialog={setCancelDialog}
                cancelForm={cancelForm}
                submitCancel={submitCancel}
                brandsDialog={brandsDialog}
                setBrandsDialog={setBrandsDialog}
                brandLines={brandLines}
                setBrandLines={setBrandLines}
                submitBrands={submitBrands}
                submitDialog={submitDialog}
                setSubmitDialog={setSubmitDialog}
                changeNotes={changeNotes}
                setChangeNotes={setChangeNotes}
            />

            <TemplateMatchDialog
                open={matchDialog}
                onClose={() => setMatchDialog(false)}
                loading={matchLoading}
                result={matchResult}
                pr={pr}
            />

            <DocumentViewer document={viewingDoc} onClose={() => setViewingDoc(null)} />
        </>
    );
};

const breadcrumbs = (pr) => [
    { title: 'Inventory', link: null },
    { title: 'Purchase Requests', link: route('inventory.purchase-requests.index') },
    { title: `#${pr?.id || ''}`, link: null },
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.purchaseRequest)}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
