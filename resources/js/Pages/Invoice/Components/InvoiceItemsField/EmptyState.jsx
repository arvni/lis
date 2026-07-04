import { Button, Paper, Typography } from '@mui/material';
import { Add as AddIcon, Receipt as ReceiptIcon } from '@mui/icons-material';

const EmptyState = ({ onAdd }) => (
    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', backgroundColor: 'grey.50' }}>
        <ReceiptIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
            No items on this invoice yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a manual line item below, or add an acceptance to this invoice.
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={onAdd}>
            Add Item
        </Button>
    </Paper>
);

export default EmptyState;
