import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Box,
    Chip,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { CheckCircle, Receipt, MoneyOff } from '@mui/icons-material';
import PropTypes from 'prop-types';

/**
 * Confirmation step for financial approval.
 *
 * Approval releases the acceptance to publishing, so the reviewer confirms it
 * against what they can see here — above all whether an invoice exists. An
 * uninvoiced acceptance can still be approved, but only deliberately: the
 * confirm button says so, and the request carries the acknowledgement the
 * endpoint requires.
 */
const ApproveFinancialConfirm = ({ open, acceptance, formatCurrency, loading, onCancel, onConfirm }) => {
    const invoice = acceptance?.invoice;

    return (
        <Dialog
            open={open}
            onClose={!loading ? onCancel : undefined}
            aria-labelledby="approve-financial-dialog-title"
            slotProps={{ paper: { sx: { borderRadius: 2, minWidth: { xs: '85%', sm: 440 } } } }}
        >
            <DialogTitle id="approve-financial-dialog-title">Confirm Financial Approval</DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Acceptance
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                            #{acceptance?.id} — {acceptance?.patient?.fullName || 'N/A'}
                        </Typography>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Invoice
                        </Typography>
                        {invoice ? (
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <Chip
                                    icon={<Receipt />}
                                    label="Has Invoice"
                                    size="small"
                                    color="success"
                                    variant="filled"
                                />
                                <Typography variant="body2">
                                    Total: {formatCurrency(invoice.total)}
                                </Typography>
                            </Stack>
                        ) : (
                            <Chip
                                icon={<MoneyOff />}
                                label="No Invoice"
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                        )}
                    </Box>

                    {invoice ? (
                        <Alert severity="info">
                            Approving releases this acceptance for publishing.
                        </Alert>
                    ) : (
                        <Alert severity="warning">
                            This acceptance has no invoice. Approving it now releases it for
                            publishing unbilled — create an invoice first unless you mean to.
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color={invoice ? 'success' : 'warning'}
                    startIcon={<CheckCircle />}
                    onClick={onConfirm}
                    disabled={loading}
                    autoFocus
                    sx={{ textTransform: 'none' }}
                >
                    {invoice ? 'Approve' : 'Approve Without Invoice'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ApproveFinancialConfirm.propTypes = {
    open: PropTypes.bool.isRequired,
    acceptance: PropTypes.object,
    formatCurrency: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

export default ApproveFinancialConfirm;
