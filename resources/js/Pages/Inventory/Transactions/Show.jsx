import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Alert, Grid } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import HeaderActions from './Show/HeaderActions';
import TransactionDetailsCard from './Show/TransactionDetailsCard';
import LineItemsCard from './Show/LineItemsCard';
import AuditTrail from './Show/AuditTrail';
import ReturnDialog from './Show/ReturnDialog';

const Show = () => {
    const { transaction, success, status } = usePage().props;
    const [returnDialog, setReturnDialog] = useState(false);
    const [returnNotes, setReturnNotes] = useState('');

    const handleSubmit = () => router.post(route('inventory.transactions.submit', transaction.id));
    const handleApprove = () =>
        router.post(route('inventory.transactions.approve', transaction.id));
    const handleCancel = () => router.post(route('inventory.transactions.cancel', transaction.id));
    const handleRevise = () => router.post(route('inventory.transactions.revise', transaction.id));
    const handleReturn = () => {
        router.post(route('inventory.transactions.return', transaction.id), { notes: returnNotes });
        setReturnDialog(false);
        setReturnNotes('');
    };

    const txStatus = transaction.status;
    const txType = transaction.transaction_type;
    const histories = transaction.histories ?? [];
    const canPrintLabels = ['ENTRY', 'RETURN'].includes(txType) && txStatus === 'APPROVED';
    const canConfirmReceipt =
        txType === 'TRANSFER' && txStatus === 'APPROVED' && !transaction.transfer_received_at;
    const receiptConfirmed = txType === 'TRANSFER' && !!transaction.transfer_received_at;

    const handleConfirmReceipt = () =>
        router.post(route('inventory.transactions.confirm-receipt', transaction.id));

    return (
        <>
            <Head title={`Transaction: ${transaction.reference_number}`} />
            <PageHeader
                title={transaction.reference_number}
                actions={
                    <HeaderActions
                        transaction={transaction}
                        txStatus={txStatus}
                        canPrintLabels={canPrintLabels}
                        canConfirmReceipt={canConfirmReceipt}
                        onSubmit={handleSubmit}
                        onApprove={handleApprove}
                        onCancel={handleCancel}
                        onRevise={handleRevise}
                        onConfirmReceipt={handleConfirmReceipt}
                        onReturn={() => setReturnDialog(true)}
                    />
                }
            />

            {status && (
                <Alert
                    severity={success ? 'success' : 'error'}
                    sx={{ mb: 2, whiteSpace: 'pre-line' }}
                >
                    {status}
                </Alert>
            )}

            {canConfirmReceipt && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This transfer has been approved but the destination store has not yet confirmed
                    receipt. Lots are in <strong>QUARANTINE</strong> and unavailable for export
                    until confirmed.
                </Alert>
            )}

            {receiptConfirmed && (
                <Alert severity="success" icon={<TaskAltIcon />} sx={{ mb: 2 }}>
                    Receipt confirmed on {transaction.transfer_received_at?.substring(0, 10)}. Lots
                    are now <strong>ACTIVE</strong> in the destination store.
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <TransactionDetailsCard transaction={transaction} txStatus={txStatus} />
                    <LineItemsCard transaction={transaction} />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <AuditTrail histories={histories} />
                </Grid>
            </Grid>

            <ReturnDialog
                open={returnDialog}
                onClose={() => setReturnDialog(false)}
                notes={returnNotes}
                onNotesChange={setReturnNotes}
                onReturn={handleReturn}
            />
        </>
    );
};

const breadcrumbs = (tx) => [
    { title: 'Inventory', link: null },
    { title: 'Transactions', link: route('inventory.transactions.index') },
    { title: tx?.reference_number || 'Transaction', link: null },
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.transaction)}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
