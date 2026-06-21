import React from 'react';
import { Link } from '@inertiajs/react';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import InlineTagManager from '@/Components/InlineTagManager';

export const STATUS_CONFIG = {
    rejected: { label: 'Rejected', color: 'error' },
    finished: { label: 'Finished', color: 'success' },
    processing: { label: 'Processing', color: 'info' },
    waiting: { label: 'Waiting', color: 'warning' },
};

export const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';

    try {
        return new Intl.DateTimeFormat('default', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(new Date(dateTimeStr));
    } catch (e) {
        return dateTimeStr;
    }
};

export const getNestedParents = (sectionGroup) => {
    if (sectionGroup.parent) {
        return [
            ...getNestedParents(sectionGroup.parent),
            {
                title: sectionGroup.name,
                link: route('sectionGroups.show', sectionGroup.id),
                icon: null,
            },
        ];
    }
    return [
        {
            title: sectionGroup.name,
            link: route('sectionGroups.show', sectionGroup.id),
            icon: null,
        },
    ];
};

export const buildAcceptanceItemColumns = () => [
    {
        field: 'id',
        headerName: 'ID',
        display: 'flex',
        width: 80,
    },
    {
        field: 'referenceCode',
        headerName: 'Acceptance',
        sortable: false,
        flex: 0.35,
        renderCell: ({ row }) => (
            <Typography variant="body2" noWrap>
                {row.acceptance?.referenceCode || `#${row.acceptance_id}`}
            </Typography>
        ),
    },
    {
        field: 'patient',
        headerName: 'Patient',
        sortable: false,
        flex: 0.7,
        renderCell: ({ row }) => {
            const patient = row.active_sample?.patient || row.acceptance?.patient;
            return (
                <Tooltip title={patient?.fullName || 'No patient'} arrow>
                    <Typography variant="body2" noWrap>
                        {patient?.fullName || '-'}
                    </Typography>
                </Tooltip>
            );
        },
    },
    {
        field: 'test',
        headerName: 'Test',
        sortable: false,
        flex: 0.8,
        renderCell: ({ row }) => (
            <Tooltip title={row.test?.name || 'No test'} arrow>
                <Typography variant="body2" noWrap>
                    {row.test?.name || '-'}
                </Typography>
            </Tooltip>
        ),
    },
    {
        field: 'method',
        headerName: 'Method',
        sortable: false,
        flex: 0.5,
        renderCell: ({ row }) => (
            <Typography variant="body2" noWrap>
                {row.method?.name || '-'}
            </Typography>
        ),
    },
    {
        field: 'status',
        headerName: 'Status',
        sortable: false,
        flex: 0.55,
        display: 'flex',
        renderCell: ({ row }) => (
            <Chip
                size="small"
                label={row.status || '-'}
                color={
                    row.latest_state?.status
                        ? STATUS_CONFIG[row.latest_state.status]?.color || 'default'
                        : 'default'
                }
                variant="outlined"
            />
        ),
    },
    {
        field: 'tags',
        headerName: 'Tags',
        sortable: false,
        flex: 0.65,
        display: 'flex',
        minWidth: 180,
        renderCell: ({ row }) => (
            <InlineTagManager
                initialTags={row.tags || []}
                updateUrl={route('acceptanceItems.tags.update', row.id)}
                entityType="acceptanceItem"
            />
        ),
    },
    {
        field: 'last_section',
        headerName: 'Last Section',
        sortable: false,
        flex: 0.55,
        renderCell: ({ row }) => {
            const stateStatus = STATUS_CONFIG[row.latest_state?.status];
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                        {row.latest_state?.section?.name || '-'}
                    </Typography>
                    {stateStatus && (
                        <Chip
                            size="small"
                            label={stateStatus.label}
                            color={stateStatus.color}
                            sx={{ height: 22 }}
                        />
                    )}
                </Box>
            );
        },
    },
    {
        field: 'updated_at',
        headerName: 'Last Updated',
        type: 'date',
        flex: 0.4,
        valueGetter: (value, row) =>
            row.latest_state?.updated_at ? new Date(row.latest_state.updated_at) : null,
        renderCell: ({ row }) => (
            <Typography variant="body2">
                {formatDateTime(row.latest_state?.updated_at || row.updated_at)}
            </Typography>
        ),
    },
    {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        width: 70,
        display: 'flex',
        renderCell: ({ row }) => (
            <Tooltip title="View Acceptance Item">
                <IconButton
                    component={Link}
                    href={route('acceptanceItems.show', {
                        acceptanceItem: row.id,
                        acceptance: row.acceptance_id,
                    })}
                    size="small"
                    color="info"
                >
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        ),
    },
];
