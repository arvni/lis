import { RemoveRedEye } from '@mui/icons-material';

export const getGoogleMapsLink = (latitude, longitude) =>
    `https://www.google.com/maps?q=${latitude},${longitude}`;

export const referrerOrdersColumns = [
    { field: 'id', headerName: 'ID', type: 'number', width: 70 },
    { field: 'order_id', headerName: 'Order ID', type: 'string', width: 150 },
    {
        field: 'patient',
        headerName: 'Patient',
        width: 200,
        renderCell: ({ row }) => row.patient?.fullName || 'N/A',
    },
    { field: 'status', headerName: 'Status', type: 'string', width: 150 },
    { field: 'received_at', headerName: 'Received At', width: 180 },
    {
        field: 'action',
        headerName: 'Action',
        type: 'string',
        width: 100,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
            <a href={route('referrer-orders.show', row.id)} target="_blank" rel="noopener noreferrer">
                <RemoveRedEye />
            </a>
        ),
    },
];
