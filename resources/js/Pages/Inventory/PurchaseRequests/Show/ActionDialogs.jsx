import { router } from '@inertiajs/react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import SupplierSelect from '@/Pages/Inventory/Components/SupplierSelect';
import BrandInput from '@/Pages/Inventory/Components/BrandInput';

const ActionDialogs = ({
    pr,
    orderDialog,
    setOrderDialog,
    orderForm,
    orderSupplier,
    setOrderSupplier,
    submitOrder,
    payDialog,
    setPayDialog,
    payForm,
    submitPay,
    shipDialog,
    setShipDialog,
    shipForm,
    submitShip,
    cancelDialog,
    setCancelDialog,
    cancelForm,
    submitCancel,
    brandsDialog,
    setBrandsDialog,
    brandLines,
    setBrandLines,
    submitBrands,
    submitDialog,
    setSubmitDialog,
    changeNotes,
    setChangeNotes,
}) => (
    <>
        {/* Issue PO dialog */}
        <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Issue Purchase Order</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                    size="small"
                    fullWidth
                    required
                    label="PO Number"
                    sx={{ mt: 2 }}
                    value={orderForm.data.po_number}
                    onChange={(e) => orderForm.setData('po_number', e.target.value)}
                    error={!!orderForm.errors.po_number}
                    helperText={orderForm.errors.po_number}
                />
                <SupplierSelect
                    size="small"
                    required
                    label="Supplier"
                    value={orderSupplier}
                    onChange={(s) => {
                        setOrderSupplier(s);
                        orderForm.setData('supplier_id', s?.id ?? '');
                    }}
                    error={!!orderForm.errors.supplier_id}
                />
                <TextField
                    size="small"
                    fullWidth
                    label="PO File (PDF/Image)"
                    type="file"
                    slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { accept: 'application/pdf,image/*' },
                    }}
                    onChange={(e) => orderForm.setData('po_file', e.target.files[0] ?? null)}
                    helperText="Optional — attach the PO document"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOrderDialog(false)}>Cancel</Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={submitOrder}
                    disabled={
                        orderForm.processing ||
                        !orderForm.data.po_number ||
                        !orderForm.data.supplier_id
                    }
                >
                    Issue PO
                </Button>
            </DialogActions>
        </Dialog>

        {/* Record Payment dialog */}
        <Dialog open={payDialog} onClose={() => setPayDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                    size="small"
                    fullWidth
                    required
                    type="date"
                    label="Payment Date"
                    sx={{ mt: 2 }}
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={payForm.data.payment_date}
                    onChange={(e) => payForm.setData('payment_date', e.target.value)}
                    error={!!payForm.errors.payment_date}
                />
                <TextField
                    size="small"
                    fullWidth
                    label="Reference / Cheque No"
                    value={payForm.data.payment_reference}
                    onChange={(e) => payForm.setData('payment_reference', e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    label="Payment Document"
                    type="file"
                    slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: { accept: 'application/pdf,image/*' },
                    }}
                    onChange={(e) => payForm.setData('payment_file', e.target.files[0] ?? null)}
                    helperText="Optional — attach receipt or bank transfer"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPayDialog(false)}>Cancel</Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={submitPay}
                    disabled={payForm.processing || !payForm.data.payment_date}
                >
                    Save Payment
                </Button>
            </DialogActions>
        </Dialog>

        {/* Mark Shipped dialog */}
        <Dialog open={shipDialog} onClose={() => setShipDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                    size="small"
                    fullWidth
                    type="date"
                    label="Shipment Date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={shipForm.data.shipment_date}
                    sx={{ mt: 2 }}
                    onChange={(e) => shipForm.setData('shipment_date', e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    label="Tracking Number"
                    value={shipForm.data.tracking_number}
                    onChange={(e) => shipForm.setData('tracking_number', e.target.value)}
                />
                <TextField
                    size="small"
                    fullWidth
                    type="date"
                    label="Expected Delivery"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={shipForm.data.expected_delivery_date}
                    onChange={(e) => shipForm.setData('expected_delivery_date', e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShipDialog(false)}>Cancel</Button>
                <Button
                    variant="contained"
                    color="info"
                    onClick={submitShip}
                    disabled={shipForm.processing}
                >
                    Mark Shipped
                </Button>
            </DialogActions>
        </Dialog>

        {/* Cancel dialog */}
        <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Cancel Purchase Request</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    label="Reason (optional)"
                    value={cancelForm.data.notes}
                    sx={{ mt: 2 }}
                    onChange={(e) => cancelForm.setData('notes', e.target.value)}
                    autoFocus
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setCancelDialog(false)}>Back</Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={submitCancel}
                    disabled={cancelForm.processing}
                >
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
                            <TableCell sx={{ minWidth: 220 }}>Brand</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {brandLines.map((bl, idx) => (
                            <TableRow key={bl.id}>
                                <TableCell>
                                    <Typography variant="body2">{bl.item?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {bl.item?.item_code}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <BrandInput
                                        value={bl.brand}
                                        itemId={bl.item?.id}
                                        onChange={(v) =>
                                            setBrandLines((prev) =>
                                                prev.map((l, i) =>
                                                    i === idx ? { ...l, brand: v } : l,
                                                ),
                                            )
                                        }
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setBrandsDialog(false)}>Cancel</Button>
                <Button variant="contained" onClick={submitBrands}>
                    Save Brands
                </Button>
            </DialogActions>
        </Dialog>

        {/* Re-submission change note dialog */}
        <Dialog open={submitDialog} onClose={() => setSubmitDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Re-submit Purchase Request</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    autoFocus
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    sx={{ mt: 1 }}
                    label="What changed since the rejection? (required)"
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSubmitDialog(false)}>Cancel</Button>
                <Button
                    variant="contained"
                    color="info"
                    disabled={!changeNotes.trim()}
                    onClick={() => {
                        router.put(route('inventory.purchase-requests.update', pr.id), {
                            action: 'submit',
                            change_notes: changeNotes,
                        });
                        setSubmitDialog(false);
                    }}
                >
                    Re-submit
                </Button>
            </DialogActions>
        </Dialog>
    </>
);

export default ActionDialogs;
