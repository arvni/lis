import { Box, Typography } from '@mui/material';
import { ContactPhone as ContactPhoneIcon } from '@mui/icons-material';
import { formatCurrency, formatDate, renderStatusChip, renderViewButton } from './helpers';

export const buildInvoiceColumns = (handleNavigate) => [
    {
        field: 'total_amount',
        headerName: 'Total Amount',
        type: 'number',
        flex: 0.5,
        align: 'center',
        valueFormatter: (value) => formatCurrency(value * 1),
    },
    {
        field: 'total_discount',
        headerName: 'Total Discount',
        type: 'number',
        flex: 0.5,
        align: 'center',
        valueFormatter: (value) => formatCurrency(value * 1),
    },
    {
        field: 'total_paid',
        headerName: 'Total Paid',
        type: 'number',
        flex: 0.5,
        align: 'center',
        valueFormatter: (value) => formatCurrency(value * 1),
    },
    {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        align: 'center',
        renderCell: ({ value }) =>
            renderStatusChip(value, {
                Paid: 'success',
                Pending: 'warning',
                Overdue: 'error',
            }),
    },
    {
        field: 'id',
        headerName: 'View',
        flex: 0.5,
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: ({ row }) => renderViewButton(route('invoices.show', row.id), handleNavigate),
    },
];

export const buildPaymentColumns = () => [
    {
        field: 'price',
        headerName: 'Amount',
        type: 'number',
        flex: 1,
        align: 'center',
        valueFormatter: (value) => formatCurrency(value), // Standardized currency
    },
    {
        field: 'paymentMethod',
        headerName: 'Method',
        flex: 1,
        align: 'center',
        renderCell: ({ value }) =>
            renderStatusChip(value, {
                Card: 'primary',
                Cash: 'success',
                Credit: 'info',
                Transfer: 'secondary',
            }),
    },
    {
        field: 'created_at',
        headerName: 'Date',
        flex: 1,
        align: 'center',
        type: 'date',
        valueGetter: (value) => value && new Date(value),
        valueFormatter: (value) => formatDate(value),
    },
];

export const buildConsultationsColumns = (handleNavigate) => [
    {
        field: 'consultant',
        headerName: 'Consultant',
        flex: 1.2,
        display: 'flex',
        renderCell: ({ row }) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                <ContactPhoneIcon fontSize="small" color="action" />
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {row?.consultant_name || 'N/A'}
                </Typography>
            </Box>
        ),
    },
    {
        field: 'status',
        headerName: 'Status',
        flex: 0.8,
        align: 'center',
        renderCell: ({ value }) =>
            renderStatusChip(value, {
                Completed: 'success',
                Scheduled: 'primary',
                Waiting: 'warning',
                Canceled: 'error',
            }),
        display: 'flex',
    },
    {
        field: 'dueDate',
        headerName: 'Due Date',
        flex: 1,
        align: 'center',
        type: 'dateTime',
        valueGetter: (value) => value && new Date(value),
        valueFormatter: (value) => formatDate(value, { hour: '2-digit', minute: '2-digit' }), // Add time
    },
    {
        field: 'action',
        headerName: 'View',
        flex: 0.5,
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: ({ row }) =>
            renderViewButton(route('consultations.show', row.id), handleNavigate),
    },
];

export const buildAcceptanceColumns = (handleNavigate) => [
    { field: 'id', headerName: 'ID', flex: 0.5, align: 'center' },
    {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        align: 'center',
        renderCell: ({ value }) =>
            renderStatusChip(value, {
                Accepted: 'success',
                Pending: 'warning',
                Rejected: 'error',
            }),
    },
    {
        field: 'created_at',
        headerName: 'Created',
        flex: 1,
        align: 'center',
        type: 'date',
        valueGetter: (value) => value && new Date(value),
        valueFormatter: (value) => formatDate(value),
    },
    {
        field: 'view',
        headerName: 'View',
        flex: 0.5,
        align: 'center',
        sortable: false,
        filterable: false,
        renderCell: ({ row }) =>
            renderViewButton(route('acceptances.show', row.id), handleNavigate),
    },
];
