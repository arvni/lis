import React from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Chip, Stack, Typography } from '@mui/material';
import countries from '@/Data/Countries.js';
import { formatDate } from '@/Services/helper';

const renderDebt = ({ row }) => {
    let amount =
        row.payments_sum_price * 1 -
        row.acceptance_items_sum_price * 1 +
        row.acceptance_items_sum_discount * 1;
    return amount < 0 ? (
        <Chip
            label={`${Intl.NumberFormat().format(Math.abs(amount).toFixed(2))}`}
            color="error"
            size="small"
        />
    ) : (
        <Typography>{Intl.NumberFormat().format(amount)}</Typography>
    );
};

export function buildColumns({ showPatient, deletePatient, canDelete }) {
    return [
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            flex: 0.05,
            display: 'flex',
            hidden: true,
        },
        {
            field: 'fullName',
            headerName: 'Name',
            type: 'string',
            flex: 1,
            display: 'flex',
            renderCell: ({ value, row }) => (
                <a href={route('patients.show', row.id)} onClick={showPatient(row.id)}>
                    {value}
                </a>
            ),
        },
        {
            field: 'idNo',
            headerName: 'ID No./Passport No.',
            type: 'string',
            flex: 0.4,
            display: 'flex',
        },
        {
            field: 'phone',
            headerName: 'Phone',
            type: 'string',
            flex: 0.4,
            display: 'flex',
        },
        {
            field: 'nationality',
            headerName: 'Nationality',
            type: 'string',
            flex: 0.4,
            display: 'flex',
            valueGetter: (value) => countries.find((item) => item.code === value)?.label,
            renderCell: ({ row, value }) => (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Box
                        component="img"
                        loading="lazy"
                        width="24"
                        height="16"
                        src={`https://flagcdn.com/w40/${row.nationality.toLowerCase()}.png`}
                        alt={value}
                        sx={{ border: '1px solid #eee' }}
                    />
                    <span>{value}</span>
                </Stack>
            ),
        },
        {
            field: 'governorate',
            headerName: 'Governorate',
            type: 'string',
            flex: 0.4,
            display: 'flex',
            renderCell: ({ value }) => value || '-',
        },
        {
            field: 'dateOfBirth',
            headerName: 'Date Of Birth (Age)',
            flex: 0.4,
            display: 'flex',
            renderCell: ({ row }) => (
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <span>{row.dateOfBirth}</span>
                    <Chip label={row.age} size="small" variant="outlined" />
                </Stack>
            ),
        },
        {
            field: 'debt',
            headerName: 'Debt',
            sortable: false,
            flex: 0.3,
            display: 'flex',
            renderCell: renderDebt,
        },
        {
            field: 'created_at',
            headerName: 'Register Date',
            flex: 0.6,
            display: 'flex',
            type: 'datetime',
            valueGetter: (value) => (value ? new Date(value) : null),
            renderCell: ({ value }) => (value ? formatDate(value) : '-'),
        },
        {
            field: 'action',
            headerName: 'Action',
            type: 'actions',
            flex: 0.1,
            display: 'flex',
            sortable: false,
            getActions: (params) => {
                let cols = [];
                if (
                    params.row.acceptances_count < 1 &&
                    params.row.consultations_count < 1 &&
                    params.row.relatives_count < 1 &&
                    canDelete
                ) {
                    cols.push(
                        <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deletePatient(params.row)}
                        />,
                    );
                }

                return cols;
            },
        },
    ];
}
