import { router } from '@inertiajs/react';
import { Box, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import SearchIcon from '@mui/icons-material/Search';
import { canCancel, canReceive } from './constants';

const HeaderActions = ({
    pr,
    currentStatus,
    canDirectApprove,
    isRequester,
    approvals,
    onCheckTemplate,
    onSubmit,
    onApprove,
    onIssuePO,
    onSetBrands,
    onRecordPayment,
    onMarkShipped,
    onCancel,
}) => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
            startIcon={<ContentCopyIcon />}
            variant="outlined"
            onClick={() =>
                router.visit(route('inventory.purchase-requests.create', { repeat_from: pr.id }))
            }
        >
            Repeat
        </Button>
        {canDirectApprove && (
            <Button
                startIcon={<SearchIcon />}
                variant="outlined"
                color="info"
                onClick={onCheckTemplate}
            >
                Check Template
            </Button>
        )}
        {currentStatus === 'DRAFT' && (
            <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={() => router.visit(route('inventory.purchase-requests.edit', pr.id))}
            >
                Edit
            </Button>
        )}
        {currentStatus === 'DRAFT' && (
            <Button variant="contained" color="info" onClick={onSubmit}>
                Submit
            </Button>
        )}
        {currentStatus === 'SUBMITTED' && canDirectApprove && (
            <Button
                startIcon={<CheckCircleIcon />}
                variant="contained"
                color="success"
                onClick={onApprove}
            >
                Approve
            </Button>
        )}
        {currentStatus === 'SUBMITTED' &&
            isRequester &&
            !(approvals ?? []).some(
                (a) => a.status === 'APPROVED' || a.status === 'REJECTED',
            ) && (
                <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => router.post(route('inventory.purchase-requests.recall', pr.id))}
                >
                    Recall
                </Button>
            )}
        {currentStatus === 'APPROVED' && (
            <Button
                startIcon={<AssignmentTurnedInIcon />}
                variant="contained"
                color="warning"
                onClick={onIssuePO}
            >
                Issue PO
            </Button>
        )}
        {['ORDERED', 'PAID', 'SHIPPED', 'PARTIALLY_RECEIVED'].includes(currentStatus) && (
            <Button variant="outlined" onClick={onSetBrands}>
                Set Brands
            </Button>
        )}
        {currentStatus === 'ORDERED' && (
            <Button
                startIcon={<PaymentIcon />}
                variant="contained"
                color="secondary"
                onClick={onRecordPayment}
            >
                Record Payment
            </Button>
        )}
        {['ORDERED', 'PAID'].includes(currentStatus) && (
            <Button
                startIcon={<LocalShippingIcon />}
                variant="contained"
                color="info"
                onClick={onMarkShipped}
            >
                Mark Shipped
            </Button>
        )}
        {canReceive(currentStatus) && (
            <Button
                startIcon={<MoveToInboxIcon />}
                variant="contained"
                color="success"
                onClick={() => router.visit(route('inventory.purchase-requests.receive', pr.id))}
            >
                Receive Items
            </Button>
        )}
        {canCancel(currentStatus) && (
            <Button
                startIcon={<CancelIcon />}
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
