import React from 'react';
import { Chip, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { formatDate } from '@/Services/helper.js';

export const buildColumns = ({ canRetry, canDelete, handleRetry, onDetail, onDelete }) => [
    {
        field: 'id',
        headerName: 'ID',
        width: 70,
        type: 'number',
    },
    {
        field: 'display_name',
        headerName: 'Job Type',
        width: 280,
        renderCell: ({ value }) => {
            const short = value?.split('\\').pop() ?? value;
            return (
                <Tooltip title={value} arrow>
                    <Chip
                        label={short}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ maxWidth: 260 }}
                    />
                </Tooltip>
            );
        },
    },
    {
        field: 'queue',
        headerName: 'Queue',
        width: 110,
        renderCell: ({ value }) => <Chip label={value} size="small" variant="outlined" />,
    },
    {
        field: 'exception',
        headerName: 'Error',
        flex: 1,
        minWidth: 260,
        renderCell: ({ value }) => (
            <Typography variant="caption" color="error.main" noWrap title={value}>
                {value}
            </Typography>
        ),
    },
    {
        field: 'failed_at',
        headerName: 'Failed At',
        width: 165,
        renderCell: ({ value }) => formatDate(value),
    },
    {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 110,
        sortable: false,
        getActions: (params) => {
            const actions = [
                <GridActionsCellItem
                    key="detail"
                    icon={<InfoOutlinedIcon />}
                    label="View Details"
                    onClick={() => onDetail(params.row)}
                    showInMenu={false}
                />,
            ];
            if (canRetry) {
                actions.push(
                    <GridActionsCellItem
                        key="retry"
                        icon={<ReplayIcon color="primary" />}
                        label="Retry"
                        onClick={handleRetry(params.row.uuid)}
                        showInMenu={false}
                    />,
                );
            }
            if (canDelete) {
                actions.push(
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteIcon color="error" />}
                        label="Delete"
                        onClick={() => onDelete(params.row)}
                        showInMenu={false}
                    />,
                );
            }
            return actions;
        },
    },
];
