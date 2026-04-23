import {useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip, Dialog,
    DialogActions, DialogContent, DialogTitle, Divider, Grid,
    Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineDot, TimelineContent,
} from "@mui/lab";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import ReplayIcon from "@mui/icons-material/Replay";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PrintIcon from "@mui/icons-material/Print";
import UndoIcon from "@mui/icons-material/Undo";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import BlockIcon from "@mui/icons-material/Block";
import BuildIcon from "@mui/icons-material/Build";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const STATUS_COLORS = {DRAFT: "default", PENDING_APPROVAL: "warning", APPROVED: "success", CANCELLED: "error"};
const TYPE_COLORS   = {ENTRY: "success", EXPORT: "error", ADJUST: "warning", TRANSFER: "info", RETURN: "secondary", EXPIRED_REMOVAL: "error"};

const EVENT_META = {
    CREATED:   {label: "Created",               color: "grey",    icon: <AddCircleOutlineIcon fontSize="small"/>},
    SUBMITTED: {label: "Submitted for approval", color: "info",    icon: <SendIcon fontSize="small"/>},
    RETURNED:  {label: "Returned to requester",  color: "warning", icon: <UndoIcon fontSize="small"/>},
    REVISED:   {label: "Revised by requester",   color: "primary", icon: <BuildIcon fontSize="small"/>},
    APPROVED:  {label: "Approved",               color: "success", icon: <TaskAltIcon fontSize="small"/>},
    CANCELLED: {label: "Cancelled",              color: "error",   icon: <BlockIcon fontSize="small"/>},
};

const InfoRow = ({label, children}) => (
    <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", py: 0.75}}>
        <Typography variant="body2" color="text.secondary" sx={{minWidth: 110}}>{label}</Typography>
        <Typography variant="body2" fontWeight={500} textAlign="right">{children || "—"}</Typography>
    </Box>
);

const Show = () => {
    const {transaction, success, status} = usePage().props;
    const [returnDialog, setReturnDialog] = useState(false);
    const [returnNotes, setReturnNotes]   = useState("");

    const handleSubmit  = () => router.post(route("inventory.transactions.submit",  transaction.id));
    const handleApprove = () => router.post(route("inventory.transactions.approve", transaction.id));
    const handleCancel  = () => router.post(route("inventory.transactions.cancel",  transaction.id));
    const handleRevise  = () => router.post(route("inventory.transactions.revise",  transaction.id));
    const handleReturn  = () => {
        router.post(route("inventory.transactions.return", transaction.id), {notes: returnNotes});
        setReturnDialog(false);
        setReturnNotes("");
    };

    const txStatus = transaction.status;
    const txType   = transaction.transaction_type;
    const histories = transaction.histories ?? [];
    const canPrintLabels = ["ENTRY", "RETURN"].includes(txType) && txStatus === "APPROVED";

    return (
        <>
            <PageHeader
                title={transaction.reference_number}
                actions={
                    <Box sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
                        <Button startIcon={<ContentCopyIcon/>} size="small" variant="outlined"
                            onClick={() => router.visit(route("inventory.transactions.create", {repeat_from: transaction.id}))}>
                            Repeat
                        </Button>
                        {canPrintLabels && (
                            <Button startIcon={<PrintIcon/>} size="small" variant="outlined" color="secondary"
                                onClick={() => router.visit(route("inventory.transactions.labels", transaction.id))}>
                                Print Labels
                            </Button>
                        )}
                        {txStatus === "DRAFT" && (
                            <Button startIcon={<EditIcon/>} size="small" variant="outlined"
                                onClick={() => router.visit(route("inventory.transactions.edit", transaction.id))}>
                                Edit
                            </Button>
                        )}
                        {txStatus === "DRAFT" && (
                            <Button startIcon={<SendIcon/>} size="small" variant="contained" color="info" onClick={handleSubmit}>
                                Submit
                            </Button>
                        )}
                        {txStatus === "PENDING_APPROVAL" && (
                            <Button startIcon={<UndoIcon/>} size="small" variant="outlined" color="warning"
                                onClick={() => setReturnDialog(true)}>
                                Return
                            </Button>
                        )}
                        {txStatus === "PENDING_APPROVAL" && (
                            <Button startIcon={<ReplayIcon/>} size="small" variant="outlined" onClick={handleRevise}>
                                Revise
                            </Button>
                        )}
                        {txStatus === "PENDING_APPROVAL" && (
                            <Button startIcon={<CheckCircleIcon/>} size="small" variant="contained" color="success" onClick={handleApprove}>
                                Approve
                            </Button>
                        )}
                        {["DRAFT", "PENDING_APPROVAL"].includes(txStatus) && (
                            <Button startIcon={<CancelIcon/>} size="small" variant="outlined" color="error" onClick={handleCancel}>
                                Cancel
                            </Button>
                        )}
                    </Box>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2, whiteSpace: "pre-line"}}>
                    {status}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card sx={{mb: 3}}>
                        <CardHeader
                            title="Transaction Details"
                            action={
                                <Box sx={{pt: 1, pr: 1, display: "flex", gap: 0.5}}>
                                    <Chip
                                        label={transaction.transaction_type?.replace("_", " ")}
                                        color={TYPE_COLORS[transaction.transaction_type] || "default"}
                                        size="small" variant="outlined"
                                    />
                                    <Chip
                                        label={txStatus?.replace("_", " ")}
                                        color={STATUS_COLORS[txStatus] || "default"}
                                        size="small"
                                    />
                                </Box>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={0}>
                                <Grid item xs={12} sm={6}>
                                    <InfoRow label="Reference">{transaction.reference_number}</InfoRow>
                                    <InfoRow label="Date">{transaction.transaction_date}</InfoRow>
                                    <InfoRow label="Source Store">{transaction.store?.name}</InfoRow>
                                    {transaction.destination_store && (
                                        <InfoRow label="Destination">{transaction.destination_store.name}</InfoRow>
                                    )}
                                    {transaction.supplier && (
                                        <InfoRow label="Supplier">{transaction.supplier.name}</InfoRow>
                                    )}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <InfoRow label="Requested By">{transaction.requested_by?.name}</InfoRow>
                                    <InfoRow label="Approved By">{transaction.approved_by?.name}</InfoRow>
                                    <InfoRow label="Total Value">
                                        {transaction.total_value != null
                                            ? Number(transaction.total_value).toLocaleString(undefined, {minimumFractionDigits: 2})
                                            : null}
                                    </InfoRow>
                                </Grid>
                            </Grid>
                            {transaction.notes && (
                                <>
                                    <Divider sx={{my: 1.5}}/>
                                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Notes</Typography>
                                    <Typography variant="body2">{transaction.notes}</Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader
                            title="Line Items"
                            subheader={`${transaction.lines?.length ?? 0} line${transaction.lines?.length !== 1 ? "s" : ""}`}
                        />
                        <CardContent sx={{p: 0, overflowX: "auto"}}>
                            <Table size="small" sx={{minWidth: 700}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell>Lot #</TableCell>
                                        <TableCell>Brand</TableCell>
                                        <TableCell>Cat No</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Expiry</TableCell>
                                        <TableCell align="right">Qty</TableCell>
                                        <TableCell>Unit</TableCell>
                                        <TableCell align="right">Unit Price</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transaction.lines?.map((line) => (
                                        <TableRow key={line.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>{line.item?.name}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{fontFamily: "monospace"}}>
                                                    {line.item?.item_code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                                    {line.lot_number || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{line.brand || "—"}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                                    {line.cat_no || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{line.location?.label || "—"}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                {line.expiry_date
                                                    ? <Typography variant="body2">{line.expiry_date}</Typography>
                                                    : "—"
                                                }
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={500}>{line.quantity}</Typography>
                                            </TableCell>
                                            <TableCell>{line.unit?.name}</TableCell>
                                            <TableCell align="right">{line.unit_price ? Number(line.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2}) : "—"}</TableCell>
                                            <TableCell align="right">{line.total_price ? Number(line.total_price).toLocaleString(undefined, {minimumFractionDigits: 2}) : "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!transaction.lines?.length && (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{py: 3}}>
                                                <Typography variant="body2" color="text.secondary">No line items.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardHeader title="Audit Trail"/>
                        <CardContent sx={{p: 0, pt: 1}}>
                            {histories.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{p: 2}}>
                                    No history recorded yet.
                                </Typography>
                            ) : (
                                <Timeline sx={{"& .MuiTimelineItem-root:before": {flex: 0, p: 0}, pl: 1}}>
                                    {histories.map((h, idx) => {
                                        const meta   = EVENT_META[h.event] ?? {label: h.event, color: "grey", icon: null};
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
                                                        {h.created_at}
                                                    </Typography>
                                                    {h.notes && (
                                                        <Box sx={{mt: 0.5, p: 1, bgcolor: "warning.50", borderRadius: 1, borderLeft: "3px solid", borderColor: "warning.main"}}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {h.notes}
                                                            </Typography>
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

            <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Return to Requester</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                        The transaction will be sent back as a draft so the requester can revise and resubmit.
                    </Typography>
                    <TextField
                        size="small" fullWidth multiline rows={3} label="Reason / Notes (optional)"
                        value={returnNotes}
                        onChange={(e) => setReturnNotes(e.target.value)}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReturnDialog(false)}>Cancel</Button>
                    <Button variant="contained" color="warning" startIcon={<UndoIcon/>} onClick={handleReturn}>
                        Return to Requester
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const breadcrumbs = (tx) => [
    {title: "Inventory", link: null},
    {title: "Transactions", link: route("inventory.transactions.index")},
    {title: tx?.reference_number || "Transaction", link: null},
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.transaction)}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
