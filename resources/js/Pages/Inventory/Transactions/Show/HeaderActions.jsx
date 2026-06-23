import { Box, Button } from '@mui/material';
import { router } from '@inertiajs/react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import ReplayIcon from '@mui/icons-material/Replay';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import UndoIcon from '@mui/icons-material/Undo';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

const HeaderActions = ({
    transaction,
    txStatus,
    canPrintLabels,
    canConfirmReceipt,
    onSubmit,
    onApprove,
    onCancel,
    onRevise,
    onConfirmReceipt,
    onReturn,
}) => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
            startIcon={<ContentCopyIcon />}
            size="small"
            variant="outlined"
            onClick={() =>
                router.visit(
                    route('inventory.transactions.create', { repeat_from: transaction.id }),
                )
            }
        >
            Repeat
        </Button>
        {canPrintLabels && (
            <Button
                startIcon={<PrintIcon />}
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() =>
                    router.visit(route('inventory.transactions.labels', transaction.id))
                }
            >
                Print Labels
            </Button>
        )}
        {canConfirmReceipt && (
            <Button
                startIcon={<TaskAltIcon />}
                size="small"
                variant="contained"
                color="success"
                onClick={onConfirmReceipt}
            >
                Confirm Receipt
            </Button>
        )}
        {txStatus === 'DRAFT' && (
            <Button
                startIcon={<EditIcon />}
                size="small"
                variant="outlined"
                onClick={() => router.visit(route('inventory.transactions.edit', transaction.id))}
            >
                Edit
            </Button>
        )}
        {txStatus === 'DRAFT' && (
            <Button
                startIcon={<SendIcon />}
                size="small"
                variant="contained"
                color="info"
                onClick={onSubmit}
            >
                Submit
            </Button>
        )}
        {txStatus === 'PENDING_APPROVAL' && (
            <Button
                startIcon={<UndoIcon />}
                size="small"
                variant="outlined"
                color="warning"
                onClick={onReturn}
            >
                Return
            </Button>
        )}
        {txStatus === 'PENDING_APPROVAL' && (
            <Button startIcon={<ReplayIcon />} size="small" variant="outlined" onClick={onRevise}>
                Revise
            </Button>
        )}
        {txStatus === 'PENDING_APPROVAL' && (
            <Button
                startIcon={<CheckCircleIcon />}
                size="small"
                variant="contained"
                color="success"
                onClick={onApprove}
            >
                Approve
            </Button>
        )}
        {['DRAFT', 'PENDING_APPROVAL'].includes(txStatus) && (
            <Button
                startIcon={<CancelIcon />}
                size="small"
                variant="outlined"
                color="error"
                onClick={onCancel}
            >
                Cancel
            </Button>
        )}
    </Box>
);

export default HeaderActions;
