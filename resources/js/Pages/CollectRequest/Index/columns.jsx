import React from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { formatDate } from '@/Services/helper.js';
import { fmtDateTime } from './constants';

export function buildColumns({ showCollectRequest, editCollectRequest, deleteCollectRequest }) {
    return [
        { field: 'id', headerName: 'ID', type: 'number', width: 80 },
        {
            field: 'sample_collector',
            headerName: 'Sample Collector',
            type: 'string',
            width: 180,
            renderCell: ({ row }) => row.sample_collector?.name || 'N/A',
        },
        {
            field: 'referrer',
            headerName: 'Referrer',
            type: 'string',
            width: 180,
            renderCell: ({ row }) => row.referrer?.name || 'N/A',
        },
        { field: 'barcode', headerName: 'Barcode', type: 'string', width: 130 },
        {
            field: 'preferred_date',
            headerName: 'Preferred Date',
            width: 170,
            renderCell: (params) => (params.value ? formatDate(params.value) : '—'),
        },
        {
            field: 'referrer_orders_count',
            headerName: 'Orders',
            type: 'number',
            width: 90,
        },
        {
            field: 'started_at',
            headerName: 'Started At',
            width: 170,
            renderCell: ({ row }) => fmtDateTime(row.logistic_information?.started_at),
        },
        {
            field: 'ended_at',
            headerName: 'Ended At',
            width: 170,
            renderCell: ({ row }) => fmtDateTime(row.logistic_information?.ended_at),
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            width: 160,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'actions',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => {
                const actions = [
                    <GridActionsCellItem
                        key="view"
                        icon={<RemoveRedEyeIcon />}
                        label="Show"
                        href={route('collect-requests.show', params.row.id)}
                        onClick={showCollectRequest(params.row.id)}
                    />,
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit"
                        href={route('collect-requests.edit', params.row.id)}
                        onClick={editCollectRequest(params.row.id)}
                    />,
                ];
                if (!params.row.referrer_orders_count) {
                    actions.push(
                        <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deleteCollectRequest(params.row)}
                        />,
                    );
                }
                return actions;
            },
        },
    ];
}
