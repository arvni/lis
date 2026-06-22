import { Button, Stack } from '@mui/material';
import { Add as AddIcon, Print as PrintIcon } from '@mui/icons-material';

const ActionButtons = ({
    isPendingPayment,
    isMinPaymentMet,
    invoice,
    onAddPayment,
    onPrintReceipt,
}) => (
    <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        {isPendingPayment && (
            <Button
                variant="contained"
                onClick={onAddPayment}
                disabled={!invoice}
                startIcon={<AddIcon />}
                color="primary"
                sx={{ borderRadius: 1 }}
            >
                Add Payment
            </Button>
        )}
        {isMinPaymentMet && (
            <Button
                variant="outlined"
                onClick={onPrintReceipt}
                startIcon={<PrintIcon />}
                color="secondary"
                sx={{ borderRadius: 1 }}
            >
                Print Receipt
            </Button>
        )}
    </Stack>
);

export default ActionButtons;
