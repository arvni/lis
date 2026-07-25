import { useState } from 'react';
import { Head, Link, router, usePage, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import WorkflowProgress from './Show/WorkflowProgress';
import { STATUS_COLORS, EVENT_META, canCancel, canFulfill } from './constants';

const InfoRow = ({ label, children }) => (
    <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 130 }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={500}>
            {children}
        </Typography>
    </Stack>
);

const Show = () => {
    const {
        exportRequest: er,
        approvals,
        canActOnWorkflow,
        canDirectApprove,
        isRequester,
        wasRejected,
        users,
        success,
        status,
    } = usePage().props;

    const [cancelDialog, setCancelDialog] = useState(false);
    const [submitDialog, setSubmitDialog] = useState(false);
    const cancelForm = useForm({ notes: '' });
    const submitForm = useForm({ action: 'submit', change_notes: '' });
    const commentForm = useForm({ body: '' });

    const currentStatus = er.status;
    const isDraft = currentStatus === 'DRAFT';

    const doAction = (action) =>
        router.put(route('inventory.export-requests.update', er.id), { action });

    const submitCancel = () =>
        cancelForm.post(route('inventory.export-requests.cancel', er.id), {
            onSuccess: () => setCancelDialog(false),
        });

    const submitResubmit = () =>
        submitForm.put(route('inventory.export-requests.update', er.id), {
            onSuccess: () => setSubmitDialog(false),
        });

    const addComment = () =>
        commentForm.post(route('inventory.export-requests.comments.store', er.id), {
            onSuccess: () => commentForm.reset(),
        });

    const lines = er.lines ?? [];
    const histories = er.histories ?? [];
    const comments = er.comments ?? [];
    const fulfillments = er.fulfillments ?? [];

    return (
        <>
            <Head title={`Export Request #${er.id}`} />
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <span>Export Request #{er.id}</span>
                        <Chip
                            label={currentStatus?.replace(/_/g, ' ')}
                            color={STATUS_COLORS[currentStatus] || 'default'}
                            size="small"
                        />
                    </Box>
                }
                actions={
                    <Stack direction="row" spacing={1}>
                        {isDraft && isRequester && (
                            <>
                                <Button
                                    startIcon={<EditIcon />}
                                    component={Link}
                                    href={route('inventory.export-requests.edit', er.id)}
                                >
                                    Edit
                                </Button>
                                <Button
                                    startIcon={<SendIcon />}
                                    variant="contained"
                                    onClick={() =>
                                        wasRejected ? setSubmitDialog(true) : doAction('submit')
                                    }
                                >
                                    Submit
                                </Button>
                            </>
                        )}
                        {currentStatus === 'SUBMITTED' && isRequester && (
                            <Button
                                startIcon={<UndoIcon />}
                                color="warning"
                                onClick={() =>
                                    router.post(route('inventory.export-requests.recall', er.id))
                                }
                            >
                                Recall
                            </Button>
                        )}
                        {canDirectApprove && currentStatus === 'SUBMITTED' && (
                            <Button
                                startIcon={<CheckCircleIcon />}
                                variant="contained"
                                color="success"
                                onClick={() => doAction('approve')}
                            >
                                Approve
                            </Button>
                        )}
                        {canFulfill(currentStatus) && (
                            <Button
                                startIcon={<LocalShippingIcon />}
                                variant="contained"
                                color="primary"
                                component={Link}
                                href={route('inventory.export-requests.fulfill', er.id)}
                            >
                                Fulfill / Dispatch
                            </Button>
                        )}
                        {canCancel(currentStatus) && (
                            <Button
                                startIcon={<CancelIcon />}
                                color="error"
                                onClick={() => setCancelDialog(true)}
                            >
                                Cancel
                            </Button>
                        )}
                    </Stack>
                }
            />

            {status && (
                <Alert severity={success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    {er.workflow_template_id && (
                        <WorkflowProgress
                            approvals={approvals ?? []}
                            canAct={canActOnWorkflow}
                            requestId={er.id}
                            users={users}
                        />
                    )}

                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Request Details" />
                        <CardContent sx={{ pt: 0 }}>
                            <InfoRow label="Requested By">{er.requested_by?.name ?? '—'}</InfoRow>
                            <InfoRow label="From Store">{er.store?.name ?? '—'}</InfoRow>
                            <InfoRow label="Destination">{er.destination}</InfoRow>
                            <InfoRow label="Urgency">{er.urgency}</InfoRow>
                            {er.workflow_template && (
                                <InfoRow label="Workflow">{er.workflow_template.name}</InfoRow>
                            )}
                            {er.approved_by && (
                                <InfoRow label="Approved By">{er.approved_by.name}</InfoRow>
                            )}
                            {er.purpose && <InfoRow label="Purpose">{er.purpose}</InfoRow>}
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Requested Items" />
                        <CardContent sx={{ p: 0, overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell>Unit</TableCell>
                                        <TableCell align="right">Requested</TableCell>
                                        <TableCell align="right">Fulfilled</TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>Progress</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lines.map((l) => {
                                        const qty = parseFloat(l.qty);
                                        const done = parseFloat(l.qty_fulfilled);
                                        const pct = qty > 0 ? Math.min(100, (done / qty) * 100) : 0;
                                        return (
                                            <TableRow key={l.id}>
                                                <TableCell>
                                                    {l.item?.name ?? `#${l.item_id}`}
                                                </TableCell>
                                                <TableCell>{l.unit?.name ?? '—'}</TableCell>
                                                <TableCell align="right">{qty}</TableCell>
                                                <TableCell align="right">{done}</TableCell>
                                                <TableCell>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={pct}
                                                        color={pct >= 100 ? 'success' : 'primary'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {fulfillments.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                            <CardHeader title="Fulfillment History" />
                            <CardContent sx={{ pt: 0 }}>
                                {fulfillments.map((f) => (
                                    <Box key={f.id} sx={{ mb: 1.5 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {f.transaction?.reference_number ??
                                                `Tx #${f.transaction_id}`}
                                            {f.created_at
                                                ? ` · ${f.created_at.substring(0, 10)}`
                                                : ''}
                                        </Typography>
                                        {(f.lines ?? []).map((fl) => (
                                            <Typography
                                                key={fl.id}
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                            >
                                                {fl.export_line?.item?.name ?? 'Item'}:{' '}
                                                {fl.qty_fulfilled}
                                            </Typography>
                                        ))}
                                        {f.notes && (
                                            <Typography variant="caption" color="text.secondary">
                                                {f.notes}
                                            </Typography>
                                        )}
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    <Card sx={{ mb: 3 }}>
                        <CardHeader title="Discussion" />
                        <CardContent sx={{ pt: 0 }}>
                            {comments.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    No comments yet.
                                </Typography>
                            )}
                            {comments.map((c) => (
                                <Box key={c.id} sx={{ mb: 1 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {c.user?.name ?? 'User'}
                                        <Typography
                                            component="span"
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ ml: 1 }}
                                        >
                                            {c.created_at?.substring(0, 16)?.replace('T', ' ')}
                                        </Typography>
                                    </Typography>
                                    <Typography variant="body2">{c.body}</Typography>
                                </Box>
                            ))}
                            <Divider sx={{ my: 1.5 }} />
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder="Add a comment…"
                                    value={commentForm.data.body}
                                    onChange={(e) => commentForm.setData('body', e.target.value)}
                                />
                                <Button
                                    variant="contained"
                                    onClick={addComment}
                                    disabled={!commentForm.data.body || commentForm.processing}
                                >
                                    Post
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Card>
                        <CardHeader title="Timeline" />
                        <CardContent sx={{ pt: 0 }}>
                            {histories.length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    No activity yet.
                                </Typography>
                            )}
                            {histories.map((h) => {
                                const meta = EVENT_META[h.event] ?? {
                                    label: h.event,
                                    color: 'grey',
                                };
                                return (
                                    <Stack
                                        key={h.id}
                                        direction="row"
                                        spacing={1}
                                        sx={{ py: 0.75, alignItems: 'flex-start' }}
                                    >
                                        <Chip
                                            label={meta.label}
                                            size="small"
                                            color={meta.color === 'grey' ? 'default' : meta.color}
                                            icon={meta.icon}
                                        />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {h.user?.name ?? 'System'} ·{' '}
                                                {h.created_at?.substring(0, 16)?.replace('T', ' ')}
                                            </Typography>
                                            {h.notes && (
                                                <Typography variant="body2">{h.notes}</Typography>
                                            )}
                                        </Box>
                                    </Stack>
                                );
                            })}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog
                open={cancelDialog}
                onClose={() => setCancelDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Cancel Export Request</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        sx={{ mt: 1 }}
                        label="Reason (optional)"
                        value={cancelForm.data.notes}
                        onChange={(e) => cancelForm.setData('notes', e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialog(false)}>Keep</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={submitCancel}
                        disabled={cancelForm.processing}
                    >
                        Cancel Request
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={submitDialog}
                onClose={() => setSubmitDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Re-submit Request</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={2}
                        size="small"
                        sx={{ mt: 1 }}
                        label="What changed since it was rejected?"
                        value={submitForm.data.change_notes}
                        onChange={(e) => submitForm.setData('change_notes', e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={submitResubmit}
                        disabled={submitForm.processing}
                    >
                        Re-submit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const breadcrumbs = (er) => [
    { title: 'Inventory', link: null },
    { title: 'Export Requests', link: route('inventory.export-requests.index') },
    { title: `#${er?.id || ''}`, link: null },
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.exportRequest)}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
