import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import axios from "axios";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip, CircularProgress, Dialog,
    DialogActions, DialogContent, DialogTitle, Divider, Grid,
    Step, StepContent, StepLabel, Stepper,
    Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
    LinearProgress,
} from "@mui/material";
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineDot, TimelineContent,
} from "@mui/lab";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import SendIcon from "@mui/icons-material/Send";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import {Autocomplete} from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SearchIcon from "@mui/icons-material/Search";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import SupplierSelect from "@/Pages/Inventory/Components/SupplierSelect";
import BrandInput from "@/Pages/Inventory/Components/BrandInput";
import DocumentViewer from "@/Pages/Document";

const InfoRow = ({label, children, chipContent}) => (
    <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.75}}>
        <Typography variant="body2" color="text.secondary" sx={{minWidth: 110}}>{label}</Typography>
        {chipContent
            ? <Box>{chipContent}</Box>
            : <Typography variant="body2" fontWeight={500} textAlign="right">{children || "—"}</Typography>
        }
    </Box>
);

const FileChip = ({document, onClick}) => document
    ? <Chip
        icon={<AttachFileIcon/>}
        label={document.originalName}
        size="small"
        variant="outlined"
        color="primary"
        onClick={onClick}
        sx={{cursor: "pointer", maxWidth: 220, fontFamily: "monospace", fontSize: "0.7rem"}}
    />
    : null;

const STATUS_COLORS = {
    DRAFT: "default", SUBMITTED: "info", APPROVED: "success",
    ORDERED: "warning", PAID: "secondary", SHIPPED: "info",
    PARTIALLY_RECEIVED: "warning", RECEIVED: "success", CANCELLED: "error",
};

const EVENT_META = {
    CREATED:          {label: "Created",            color: "grey",    icon: <AddCircleOutlineIcon fontSize="small"/>},
    SUBMITTED:        {label: "Submitted",           color: "info",    icon: <SendIcon fontSize="small"/>},
    APPROVED:         {label: "Approved",            color: "success", icon: <CheckCircleIcon fontSize="small"/>},
    ORDERED:          {label: "PO Issued",           color: "warning", icon: <AssignmentTurnedInIcon fontSize="small"/>},
    PAID:             {label: "Payment Recorded",    color: "secondary",icon: <PaymentIcon fontSize="small"/>},
    SHIPPED:          {label: "Shipped",             color: "info",    icon: <LocalShippingIcon fontSize="small"/>},
    RECEIVED_PARTIAL: {label: "Partially Received",  color: "warning", icon: <MoveToInboxIcon fontSize="small"/>},
    RECEIVED:         {label: "Fully Received",      color: "success", icon: <MoveToInboxIcon fontSize="small"/>},
    CANCELLED:        {label: "Cancelled",           color: "error",   icon: <CancelIcon fontSize="small"/>},
    STEP_APPROVED:    {label: "Step Approved",       color: "success", icon: <ThumbUpIcon fontSize="small"/>},
    REJECTED:         {label: "Step Rejected",       color: "error",   icon: <ThumbDownIcon fontSize="small"/>},
    RECALLED:         {label: "Recalled by Requester", color: "warning",  icon: <CancelIcon fontSize="small"/>},
    RESUBMITTED:      {label: "Re-submitted",          color: "info",     icon: <SendIcon fontSize="small"/>},
    STEP_DELEGATED:   {label: "Step Delegated",        color: "secondary", icon: <AccountTreeIcon fontSize="small"/>},
};

const DiscussionPanel = ({comments, prId}) => {
    const commentForm = useForm({body: ""});
    const submit = () => commentForm.post(route("inventory.purchase-requests.comments.store", prId), {
        onSuccess: () => commentForm.reset(),
    });
    return (
        <Card sx={{mb: 3}}>
            <CardHeader
                title={
                    <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                        <ChatBubbleOutlineIcon fontSize="small" color="action"/>
                        <Typography variant="h6">Discussion</Typography>
                    </Box>
                }
            />
            <CardContent sx={{pt: 0}}>
                {comments.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No comments yet.</Typography>
                ) : (
                    <Box sx={{mb: 2, display: "flex", flexDirection: "column", gap: 1.5}}>
                        {comments.map((c) => (
                            <Box key={c.id} sx={{display: "flex", gap: 1.5, alignItems: "flex-start"}}>
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: "50%", bgcolor: "primary.main",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>
                                    <Typography variant="caption" color="white" fontWeight={700}>
                                        {c.user?.name?.[0]?.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Box sx={{flex: 1, bgcolor: "grey.50", borderRadius: 1, p: 1}}>
                                    <Box sx={{display: "flex", justifyContent: "space-between", mb: 0.5}}>
                                        <Typography variant="caption" fontWeight={600}>{c.user?.name}</Typography>
                                        <Typography variant="caption" color="text.disabled">{c.created_at?.substring(0, 16)}</Typography>
                                    </Box>
                                    <Typography variant="body2">{c.body}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
                <Box sx={{display: "flex", gap: 1, mt: 1}}>
                    <TextField
                        fullWidth size="small" placeholder="Leave a comment…"
                        value={commentForm.data.body}
                        onChange={(e) => commentForm.setData("body", e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submit())}
                        error={!!commentForm.errors.body}
                    />
                    <Button variant="contained" size="small" onClick={submit}
                        disabled={commentForm.processing || !commentForm.data.body}>
                        Post
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

const canCancel = (status) => !["RECEIVED", "CANCELLED"].includes(status);
const canReceive = (status) => ["SHIPPED", "PARTIALLY_RECEIVED"].includes(status);

const APPROVAL_COLORS = {PENDING: "warning", APPROVED: "success", REJECTED: "error"};

const WorkflowProgress = ({approvals, canAct, prId, users}) => {
    const [rejectDialog,   setRejectDialog]   = useState(false);
    const [delegateDialog, setDelegateDialog] = useState(false);
    const [delegateUser,   setDelegateUser]   = useState(null);
    const approveForm  = useForm({notes: ""});
    const rejectForm   = useForm({notes: ""});
    const delegateForm = useForm({delegate_to_user_id: ""});

    if (!approvals || approvals.length === 0) return null;

    const activeIdx = approvals.findIndex((a) => a.status === "PENDING");

    const submitApprove = () => {
        approveForm.post(route("inventory.purchase-requests.approve-step", prId), {
            onSuccess: () => approveForm.reset(),
        });
    };

    const submitReject = () => {
        rejectForm.post(route("inventory.purchase-requests.reject-step", prId), {
            onSuccess: () => { rejectForm.reset(); setRejectDialog(false); },
        });
    };

    return (
        <>
            <Card sx={{mb: 3}}>
                <CardHeader
                    title={
                        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                            <AccountTreeIcon fontSize="small" color="primary"/>
                            <Typography variant="h6">Approval Workflow</Typography>
                        </Box>
                    }
                />
                <CardContent sx={{pt: 0}}>
                    <Stepper activeStep={activeIdx === -1 ? approvals.length : activeIdx} orientation="vertical">
                        {approvals.map((approval, idx) => {
                            const isPending  = approval.status === "PENDING";
                            const isApproved = approval.status === "APPROVED";
                            const isRejected = approval.status === "REJECTED";
                            const stepColor  = isApproved ? "success" : isRejected ? "error" : "inherit";
                            const isActive   = idx === activeIdx;

                            return (
                                <Step key={approval.id} completed={isApproved}>
                                    <StepLabel
                                        error={isRejected}
                                        optional={
                                            <Typography variant="caption" color="text.secondary">
                                                {approval.step?.approver_user
                                                    ? `User: ${approval.step.approver_user.name}`
                                                    : approval.step?.approver_role
                                                        ? `Role: ${approval.step.approver_role}`
                                                        : null
                                                }
                                            </Typography>
                                        }
                                    >
                                        <Box sx={{display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap"}}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {approval.step?.name ?? `Step ${idx + 1}`}
                                            </Typography>
                                            <Chip
                                                label={approval.status}
                                                size="small"
                                                color={APPROVAL_COLORS[approval.status] ?? "default"}
                                                variant={isPending ? "outlined" : "filled"}
                                            />
                                            {isPending && approval.due_at && (
                                                new Date(approval.due_at) < new Date()
                                                    ? <Chip icon={<WarningAmberIcon fontSize="small"/>} label="Overdue" size="small" color="error"/>
                                                    : <Chip label={`Due ${approval.due_at.substring(0,10)}`} size="small" variant="outlined" color="warning"/>
                                            )}
                                        </Box>
                                    </StepLabel>
                                    <StepContent>
                                        {approval.acted_by && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {isApproved ? "Approved" : "Rejected"} by {approval.acted_by.name}
                                                {approval.acted_at ? ` · ${approval.acted_at.substring(0, 10)}` : ""}
                                            </Typography>
                                        )}
                                        {approval.notes && (
                                            <Box sx={{mt: 0.5, p: 1, bgcolor: "grey.50", borderRadius: 1, borderLeft: "3px solid", borderColor: isRejected ? "error.main" : "success.main"}}>
                                                <Typography variant="caption">{approval.notes}</Typography>
                                            </Box>
                                        )}

                                        {isActive && canAct && (
                                            <Box sx={{mt: 1.5, display: "flex", gap: 1, alignItems: "center"}}>
                                                <TextField
                                                    size="small"
                                                    label="Comment (optional)"
                                                    value={approveForm.data.notes}
                                                    onChange={(e) => approveForm.setData("notes", e.target.value)}
                                                    sx={{flex: 1}}
                                                />
                                                <Button
                                                    startIcon={<ThumbUpIcon/>}
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    onClick={submitApprove}
                                                    disabled={approveForm.processing}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    startIcon={<ThumbDownIcon/>}
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => setRejectDialog(true)}
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => setDelegateDialog(true)}
                                                >
                                                    Delegate
                                                </Button>
                                            </Box>
                                        )}
                                    </StepContent>
                                </Step>
                            );
                        })}
                    </Stepper>
                </CardContent>
            </Card>

            <Dialog open={delegateDialog} onClose={() => setDelegateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Delegate This Step</DialogTitle>
                <DialogContent sx={{pt: 2}}>
                    <Autocomplete
                        sx={{mt: 1}}
                        options={users ?? []}
                        getOptionLabel={(u) => u.name}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        value={delegateUser}
                        onChange={(_, u) => { setDelegateUser(u); delegateForm.setData("delegate_to_user_id", u?.id ?? ""); }}
                        renderInput={(params) => <TextField {...params} size="small" label="Delegate to user" required/>}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDelegateDialog(false)}>Cancel</Button>
                    <Button variant="contained" disabled={!delegateUser || delegateForm.processing}
                        onClick={() => delegateForm.post(route("inventory.purchase-requests.delegate-step", prId), {
                            onSuccess: () => { delegateForm.reset(); setDelegateUser(null); setDelegateDialog(false); }
                        })}>
                        Delegate
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reject This Step</DialogTitle>
                <DialogContent sx={{pt: 2}}>
                    <TextField
                        autoFocus fullWidth multiline rows={3} size="small" sx={{mt: 1}}
                        label="Reason for rejection (required)"
                        value={rejectForm.data.notes}
                        onChange={(e) => rejectForm.setData("notes", e.target.value)}
                        error={!!rejectForm.errors.notes}
                        helperText={rejectForm.errors.notes}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained" color="error"
                        onClick={submitReject}
                        disabled={rejectForm.processing || !rejectForm.data.notes}
                    >
                        Confirm Reject
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const Show = () => {
    const {purchaseRequest: pr, approvals, canActOnWorkflow, canDirectApprove, isRequester, wasRejected, users, success, status, poDocument, paymentDocument} = usePage().props;
    const [viewingDoc, setViewingDoc] = useState(null);

    // Template match check
    const [matchDialog,   setMatchDialog]   = useState(false);
    const [matchResult,   setMatchResult]   = useState(null);
    const [matchLoading,  setMatchLoading]  = useState(false);

    const checkTemplate = () => {
        setMatchLoading(true);
        setMatchDialog(true);
        axios.get(route('inventory.purchase-requests.match-template', pr.id))
            .then(r => setMatchResult(r.data))
            .finally(() => setMatchLoading(false));
    };

    // Dialog state
    const [submitDialog,  setSubmitDialog]  = useState(false);
    const [changeNotes,   setChangeNotes]  = useState("");
    const [orderDialog,   setOrderDialog]   = useState(false);
    const [payDialog,     setPayDialog]      = useState(false);
    const [shipDialog,    setShipDialog]     = useState(false);
    const [cancelDialog,  setCancelDialog]   = useState(false);
    const [brandsDialog,  setBrandsDialog]   = useState(false);
    const [brandLines,    setBrandLines]     = useState([]);

    const [orderSupplier, setOrderSupplier] = useState(pr.supplier ?? null);
    const orderForm  = useForm({po_number: "", supplier_id: pr.supplier_id ?? "", po_file: null});
    const payForm    = useForm({payment_date: "", payment_reference: "", payment_file: null});
    const shipForm   = useForm({shipment_date: "", tracking_number: "", expected_delivery_date: ""});
    const cancelForm = useForm({notes: ""});

    const openBrandsDialog = () => {
        setBrandLines((pr.lines ?? []).map((l) => ({id: l.id, brand: l.brand ?? "", item: l.item})));
        setBrandsDialog(true);
    };
    const submitBrands = () => {
        router.post(route("inventory.purchase-requests.set-brands", pr.id), {lines: brandLines}, {
            onSuccess: () => setBrandsDialog(false),
        });
    };

    const submitOrder  = () => orderForm.post(route("inventory.purchase-requests.order",  pr.id), {forceFormData: true, onSuccess: () => setOrderDialog(false)});
    const submitPay    = () => payForm.post(route("inventory.purchase-requests.pay",      pr.id), {forceFormData: true, onSuccess: () => setPayDialog(false)});
    const submitShip   = () => shipForm.post(route("inventory.purchase-requests.ship",    pr.id), {onSuccess: () => setShipDialog(false)});
    const submitCancel = () => cancelForm.post(route("inventory.purchase-requests.cancel", pr.id), {onSuccess: () => setCancelDialog(false)});

    const handleAction = (action) => router.put(route("inventory.purchase-requests.update", pr.id), {action});

    const histories = pr.histories ?? [];
    const currentStatus = pr.status;

    const qtyRemaining = (line) => Math.max(0, parseFloat(line.qty) - parseFloat(line.qty_received ?? 0));

    return (
        <>
            <PageHeader
                title={`Purchase Request #${pr.id}${pr.po_number ? ` · PO ${pr.po_number}` : ""}`}
                actions={
                    <Box sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
                        <Button startIcon={<ContentCopyIcon/>} variant="outlined"
                            onClick={() => router.visit(route("inventory.purchase-requests.create", {repeat_from: pr.id}))}>
                            Repeat
                        </Button>
                        {canDirectApprove && (
                            <Button startIcon={<SearchIcon/>} variant="outlined" color="info" onClick={checkTemplate}>
                                Check Template
                            </Button>
                        )}
                        {currentStatus === "DRAFT" && (
                            <Button startIcon={<EditIcon/>} variant="outlined"
                                onClick={() => router.visit(route("inventory.purchase-requests.edit", pr.id))}>
                                Edit
                            </Button>
                        )}
                        {currentStatus === "DRAFT" && (
                            <Button variant="contained" color="info" onClick={() => wasRejected ? setSubmitDialog(true) : handleAction("submit")}>
                                Submit
                            </Button>
                        )}
                        {currentStatus === "SUBMITTED" && canDirectApprove && (
                            <Button startIcon={<CheckCircleIcon/>} variant="contained" color="success" onClick={() => handleAction("approve")}>
                                Approve
                            </Button>
                        )}
                        {currentStatus === "SUBMITTED" && isRequester && !(approvals ?? []).some(a => a.status === "APPROVED" || a.status === "REJECTED") && (
                            <Button variant="outlined" color="warning" onClick={() => router.post(route("inventory.purchase-requests.recall", pr.id))}>
                                Recall
                            </Button>
                        )}
                        {currentStatus === "APPROVED" && (
                            <Button startIcon={<AssignmentTurnedInIcon/>} variant="contained" color="warning"
                                onClick={() => setOrderDialog(true)}>
                                Issue PO
                            </Button>
                        )}
                        {["ORDERED","PAID","SHIPPED","PARTIALLY_RECEIVED"].includes(currentStatus) && (
                            <Button variant="outlined" onClick={openBrandsDialog}>
                                Set Brands
                            </Button>
                        )}
                        {currentStatus === "ORDERED" && (
                            <Button startIcon={<PaymentIcon/>} variant="contained" color="secondary"
                                onClick={() => setPayDialog(true)}>
                                Record Payment
                            </Button>
                        )}
                        {["ORDERED", "PAID"].includes(currentStatus) && (
                            <Button startIcon={<LocalShippingIcon/>} variant="contained" color="info"
                                onClick={() => setShipDialog(true)}>
                                Mark Shipped
                            </Button>
                        )}
                        {canReceive(currentStatus) && (
                            <Button startIcon={<MoveToInboxIcon/>} variant="contained" color="success"
                                onClick={() => router.visit(route("inventory.purchase-requests.receive", pr.id))}>
                                Receive Items
                            </Button>
                        )}
                        {canCancel(currentStatus) && (
                            <Button startIcon={<CancelIcon/>} variant="outlined" color="error"
                                onClick={() => setCancelDialog(true)}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2}}>{status}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Left: info + lines + receipts */}
                <Grid item xs={12} md={7}>
                    {pr.workflow_template_id && (
                        <WorkflowProgress approvals={approvals ?? []} canAct={canActOnWorkflow} prId={pr.id} users={users}/>
                    )}
                    <DiscussionPanel comments={pr.comments ?? []} prId={pr.id}/>
                    <Card sx={{mb: 3}}>
                        <CardHeader
                            title="Request Info"
                            action={
                                <Box sx={{pt: 1, pr: 1, display: "flex", gap: 0.5}}>
                                    <Chip
                                        label={pr.urgency}
                                        size="small"
                                        color={pr.urgency === "URGENT" ? "error" : "default"}
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={(pr.status ?? "").replace(/_/g, " ")}
                                        size="small"
                                        color={STATUS_COLORS[pr.status] || "default"}
                                    />
                                </Box>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <InfoRow label="Requested By">{pr.requested_by?.name}</InfoRow>
                                    <InfoRow label="Approved By">{pr.approved_by?.name}</InfoRow>
                                    <InfoRow label="Workflow">{pr.workflow_template?.name ?? "— none —"}</InfoRow>
                                    <InfoRow label="Supplier">{pr.supplier?.name}</InfoRow>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoRow label="PO Number">{pr.po_number}</InfoRow>
                                    <InfoRow label="PO File" chipContent={poDocument ? <FileChip document={poDocument} onClick={() => setViewingDoc(poDocument)}/> : null}/>
                                    <InfoRow label="Payment Date">{pr.payment_date}</InfoRow>
                                    <InfoRow label="Payment Ref">{pr.payment_reference}</InfoRow>
                                    <InfoRow label="Payment File" chipContent={paymentDocument ? <FileChip document={paymentDocument} onClick={() => setViewingDoc(paymentDocument)}/> : null}/>
                                    <InfoRow label="Shipment Date">{pr.shipment_date}</InfoRow>
                                    <InfoRow label="Tracking #">{pr.tracking_number}</InfoRow>
                                    <InfoRow label="Expected ETA">{pr.expected_delivery_date}</InfoRow>
                                </Grid>
                            </Grid>
                            {pr.notes && (
                                <>
                                    <Divider sx={{my: 1.5}}/>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Notes</Typography>
                                    <Typography variant="body2">{pr.notes}</Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card sx={{mb: 3}}>
                        <CardHeader title="Line Items"/>
                        <CardContent sx={{p: 0}}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell>Cat No</TableCell>
                                        <TableCell>Brand</TableCell>
                                        <TableCell align="right">Ordered</TableCell>
                                        <TableCell align="right">Received</TableCell>
                                        <TableCell>Unit</TableCell>
                                        <TableCell>Supplier</TableCell>
                                        <TableCell>Notes</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pr.lines?.map((line) => {
                                        const pct = line.qty > 0 ? Math.min(100, (parseFloat(line.qty_received ?? 0) / parseFloat(line.qty)) * 100) : 0;
                                        return (
                                            <TableRow key={line.id}>
                                                <TableCell>
                                                    <Typography variant="body2">{line.item?.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{line.item?.item_code}</Typography>
                                                </TableCell>
                                                <TableCell>{line.cat_no || "—"}</TableCell>
                                                <TableCell>{line.brand || "—"}</TableCell>
                                                <TableCell align="right">{line.qty} {line.unit?.name}</TableCell>
                                                <TableCell align="right" sx={{minWidth: 100}}>
                                                    <Typography variant="body2">{parseFloat(line.qty_received ?? 0)}</Typography>
                                                    <LinearProgress variant="determinate" value={pct} sx={{mt: 0.5, height: 4, borderRadius: 2}}
                                                        color={pct >= 100 ? "success" : "warning"}/>
                                                </TableCell>
                                                <TableCell>{line.unit?.name}</TableCell>
                                                <TableCell>{line.preferred_supplier?.name || "—"}</TableCell>
                                                <TableCell>{line.notes || "—"}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {pr.receipts?.length > 0 && (
                        <Card>
                            <CardHeader title="Receiving History"/>
                            <CardContent sx={{p: 0}}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Transaction</TableCell>
                                            <TableCell>Lines Received</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pr.receipts.map((receipt) => (
                                            <TableRow key={receipt.id}>
                                                <TableCell>{receipt.created_at?.substring(0, 10)}</TableCell>
                                                <TableCell>
                                                    <Button size="small" variant="text"
                                                        onClick={() => router.visit(route("inventory.transactions.show", receipt.transaction_id))}>
                                                        {receipt.transaction?.reference_number}
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    {receipt.lines?.map((rl) => (
                                                        <Typography key={rl.id} variant="caption" display="block">
                                                            {rl.pr_line?.item?.name}: {rl.qty_received} {rl.pr_line?.unit?.name}
                                                            {rl.lot_number ? ` · Lot ${rl.lot_number}` : ""}
                                                        </Typography>
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Right: timeline */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardHeader title="Timeline"/>
                        <CardContent sx={{p: 0}}>
                            {histories.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{p: 2}}>No history yet.</Typography>
                            ) : (
                                <Timeline sx={{"& .MuiTimelineItem-root:before": {flex: 0, p: 0}}}>
                                    {histories.map((h, idx) => {
                                        const meta = EVENT_META[h.event] ?? {label: h.event, color: "grey", icon: null};
                                        const isLast = idx === histories.length - 1;
                                        return (
                                            <TimelineItem key={h.id}>
                                                <TimelineSeparator>
                                                    <TimelineDot color={meta.color} variant={isLast ? "filled" : "outlined"} sx={{m: 0.5}}>
                                                        {meta.icon}
                                                    </TimelineDot>
                                                    {!isLast && <TimelineConnector/>}
                                                </TimelineSeparator>
                                                <TimelineContent sx={{pb: 2, pt: 0.5}}>
                                                    <Typography variant="body2" fontWeight={600}>{meta.label}</Typography>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        {h.user?.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.disabled" display="block">
                                                        {h.created_at?.substring(0, 10)}
                                                    </Typography>
                                                    {h.notes && (
                                                        <Box sx={{mt: 0.5, p: 1, bgcolor: "warning.50", borderRadius: 1, borderLeft: "3px solid", borderColor: "warning.main"}}>
                                                            <Typography variant="caption" color="text.secondary">{h.notes}</Typography>
                                                        </Box>
                                                    )}
                                                    {h.change_notes && (
                                                        <Box sx={{mt: 0.5, p: 1, bgcolor: "info.50", borderRadius: 1, borderLeft: "3px solid", borderColor: "info.main"}}>
                                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>What changed: </Typography>
                                                            <Typography variant="caption" color="text.secondary">{h.change_notes}</Typography>
                                                        </Box>
                                                    )}
                                                </TimelineContent>
                                            </TimelineItem>
                                        );
                                    })}
                                </Timeline>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Issue PO dialog */}
            <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Issue Purchase Order</DialogTitle>
                <DialogContent sx={{display: "flex", flexDirection: "column", gap: 2, pt: 2}}>
                    <TextField size="small" fullWidth required label="PO Number" sx={{mt:2}}
                        value={orderForm.data.po_number}
                        onChange={(e) => orderForm.setData("po_number", e.target.value)}
                        error={!!orderForm.errors.po_number}
                        helperText={orderForm.errors.po_number}/>
                    <SupplierSelect
                        size="small"
                        required
                        label="Supplier"
                        value={orderSupplier}
                        onChange={(s) => { setOrderSupplier(s); orderForm.setData("supplier_id", s?.id ?? ""); }}
                        error={!!orderForm.errors.supplier_id}
                    />
                    <TextField size="small" fullWidth label="PO File (PDF/Image)"
                        type="file" InputLabelProps={{shrink: true}}
                        inputProps={{accept: "application/pdf,image/*"}}
                        onChange={(e) => orderForm.setData("po_file", e.target.files[0] ?? null)}
                        helperText="Optional — attach the PO document"/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOrderDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={submitOrder}
                        disabled={orderForm.processing || !orderForm.data.po_number || !orderForm.data.supplier_id}>
                        Issue PO
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Record Payment dialog */}
            <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogContent sx={{display: "flex", flexDirection: "column", gap: 2, pt: 2}}>
                    <TextField size="small" fullWidth required type="date" label="Payment Date" sx={{mt:2}}
                        InputLabelProps={{shrink: true}}
                        value={payForm.data.payment_date}
                        onChange={(e) => payForm.setData("payment_date", e.target.value)}
                        error={!!payForm.errors.payment_date}/>
                    <TextField size="small" fullWidth label="Reference / Cheque No"
                        value={payForm.data.payment_reference}
                        onChange={(e) => payForm.setData("payment_reference", e.target.value)}/>
                    <TextField size="small" fullWidth label="Payment Document"
                        type="file" InputLabelProps={{shrink: true}}
                        inputProps={{accept: "application/pdf,image/*"}}
                        onChange={(e) => payForm.setData("payment_file", e.target.files[0] ?? null)}
                        helperText="Optional — attach receipt or bank transfer"/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPayDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="secondary" onClick={submitPay}
                        disabled={payForm.processing || !payForm.data.payment_date}>
                        Save Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Mark Shipped dialog */}
            <Dialog open={shipDialog} onClose={() => setShipDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Mark as Shipped</DialogTitle>
                <DialogContent sx={{display: "flex", flexDirection: "column", gap: 2, pt: 2}}>
                    <TextField size="small" fullWidth type="date" label="Shipment Date" InputLabelProps={{shrink: true}}
                        value={shipForm.data.shipment_date}  sx={{mt:2}}
                        onChange={(e) => shipForm.setData("shipment_date", e.target.value)}/>
                    <TextField size="small" fullWidth label="Tracking Number"
                        value={shipForm.data.tracking_number}
                        onChange={(e) => shipForm.setData("tracking_number", e.target.value)}/>
                    <TextField size="small" fullWidth type="date" label="Expected Delivery" InputLabelProps={{shrink: true}}
                        value={shipForm.data.expected_delivery_date}
                        onChange={(e) => shipForm.setData("expected_delivery_date", e.target.value)}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShipDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="info" onClick={submitShip} disabled={shipForm.processing}>
                        Mark Shipped
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel dialog */}
            <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Cancel Purchase Request</DialogTitle>
                <DialogContent sx={{pt: 2}}>
                    <TextField size="small" fullWidth multiline rows={3} label="Reason (optional)"
                        value={cancelForm.data.notes} sx={{mt:2}}
                        onChange={(e) => cancelForm.setData("notes", e.target.value)}
                        autoFocus/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialog(false)}>Back</Button>
                    <Button variant="contained" color="error" onClick={submitCancel} disabled={cancelForm.processing}>
                        Confirm Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Set Brands dialog */}
            <Dialog open={brandsDialog} onClose={() => setBrandsDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Set Brands per Line</DialogTitle>
                <DialogContent>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Item</TableCell>
                                <TableCell sx={{minWidth: 220}}>Brand</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {brandLines.map((bl, idx) => (
                                <TableRow key={bl.id}>
                                    <TableCell>
                                        <Typography variant="body2">{bl.item?.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{bl.item?.item_code}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <BrandInput
                                            value={bl.brand}
                                            itemId={bl.item?.id}
                                            onChange={(v) => setBrandLines((prev) =>
                                                prev.map((l, i) => i === idx ? {...l, brand: v} : l)
                                            )}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBrandsDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={submitBrands}>Save Brands</Button>
                </DialogActions>
            </Dialog>

            {/* Re-submission change note dialog */}
            <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Re-submit Purchase Request</DialogTitle>
                <DialogContent sx={{pt: 2}}>
                    <TextField
                        autoFocus fullWidth multiline rows={3} size="small" sx={{mt: 1}}
                        label="What changed since the rejection? (required)"
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained" color="info"
                        disabled={!changeNotes.trim()}
                        onClick={() => {
                            router.put(route("inventory.purchase-requests.update", pr.id), {action: "submit", change_notes: changeNotes});
                            setSubmitDialog(false);
                        }}
                    >
                        Re-submit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Template match dialog */}
            <Dialog open={matchDialog} onClose={() => setMatchDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <AccountTreeIcon fontSize="small" color="info"/>
                    Template Match Check
                </DialogTitle>
                <DialogContent sx={{pt: 1}}>
                    {matchLoading ? (
                        <Box sx={{py: 4, textAlign: 'center'}}><CircularProgress/></Box>
                    ) : matchResult ? (
                        <>
                            <Box sx={{mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1}}>
                                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>PR attributes used for matching</Typography>
                                <Typography variant="body2"><b>Urgency:</b> {matchResult.pr.urgency}</Typography>
                                <Typography variant="body2"><b>Est. Total:</b> {matchResult.pr.estimated_total}</Typography>
                                <Typography variant="body2"><b>Requester roles:</b> {matchResult.pr.requester_roles.join(', ') || '—'}</Typography>
                            </Box>

                            <Box sx={{mb: 2, p: 1.5, borderRadius: 1, border: '1px solid', borderColor: matchResult.matched_template ? 'success.main' : 'warning.main', bgcolor: matchResult.matched_template ? 'success.50' : 'warning.50'}}>
                                {matchResult.matched_template ? (
                                    <>
                                        <Typography variant="body2" color="success.main" fontWeight={700}>✓ Matched: {matchResult.matched_template.name}</Typography>
                                        {pr.workflow_template_id !== matchResult.matched_template.id && (
                                            <Typography variant="caption" color="warning.main" display="block" sx={{mt: 0.5}}>
                                                ⚠ Current assigned template differs — re-submit to update.
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Typography variant="body2" color="warning.main" fontWeight={700}>✗ No matching template — PR will skip workflow approval</Typography>
                                )}
                            </Box>

                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5}}>All templates evaluated</Typography>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                {matchResult.evaluated.map((t) => {
                                    const color = t.result === 'match' || t.result === 'default_fallback' ? 'success' : t.result === 'skip' ? 'default' : 'error';
                                    const label = {match: 'Matched', no_match: 'No match', skip: 'Skipped', default_fallback: 'Default fallback'}[t.result] ?? t.result;
                                    return (
                                        <Box key={t.id} sx={{p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider', opacity: t.is_active ? 1 : 0.5}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                                                <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                                                <Box sx={{display: 'flex', gap: 0.5, flexShrink: 0}}>
                                                    {!t.is_active && <Chip label="Inactive" size="small" color="default" variant="outlined"/>}
                                                    <Chip label={label} size="small" color={color} variant={t.result === 'match' || t.result === 'default_fallback' ? 'filled' : 'outlined'}/>
                                                </Box>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Priority: {t.priority} · {t.steps} step(s)
                                                {t.is_default ? ' · Default/fallback' : ''}
                                            </Typography>
                                            {t.reasons.length > 0 && (
                                                <Box sx={{mt: 0.5}}>
                                                    {t.reasons.map((r, i) => (
                                                        <Typography key={i} variant="caption" color="error.main" display="block">✗ {r}</Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        </>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMatchDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <DocumentViewer document={viewingDoc} onClose={() => setViewingDoc(null)}/>
        </>
    );
};

const breadcrumbs = (pr) => [
    {title: "Inventory", link: null},
    {title: "Purchase Requests", link: route("inventory.purchase-requests.index")},
    {title: `#${pr?.id || ""}`, link: null},
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.purchaseRequest)}>{page}</AuthenticatedLayout>
);

export default Show;
