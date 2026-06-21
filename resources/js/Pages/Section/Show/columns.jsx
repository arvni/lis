import { Link } from '@inertiajs/react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import {
    RemoveRedEye as RemoveRedEyeIcon,
    Done as DoneIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    ScienceOutlined as ScienceIcon,
    AccessTimeOutlined as AccessTimeIcon,
} from '@mui/icons-material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import InlineTagManager from '@/Components/InlineTagManager';
import { ACTION_TYPES } from '@/Pages/Section/Components/DoneForm';
import { STATUS_CONFIG, ACCEPTANCE_ITEM_STATES_STATUS, formatDateTime } from './constants.jsx';

export const buildColumns = (theme, handleOpenForm, handleOpenRejectForm) => [
    {
        field: 'test',
        headerName: 'Test',
        type: 'string',
        sortable: false,
        flex: 0.8,
        display: 'flex',
        renderCell: ({ row }) => (
            <Tooltip title={row?.acceptance_item?.test?.name || 'No test name'} arrow>
                <Typography noWrap variant="body2">
                    {row?.acceptance_item?.test?.name +
                        ' >>  ' +
                        row?.acceptance_item?.method?.test?.name || '-'}
                </Typography>
            </Tooltip>
        ),
    },
    {
        field: 'fullName',
        headerName: 'Patient',
        sortable: false,
        display: 'flex',
        type: 'string',
        flex: 1,
        renderCell: ({ row }) => {
            return (
                <Tooltip title={row?.sample?.patient?.fullName || 'No patient name'} arrow>
                    <Typography noWrap variant="body2">
                        {row.sample?.patient?.fullName || '-'}
                    </Typography>
                </Tooltip>
            );
        },
    },
    {
        field: 'dateOfBirth',
        headerName: 'Age',
        sortable: false,
        display: 'flex',
        flex: 0.2,
        type: 'string',
        renderCell: ({ row }) => {
            return <Typography variant="body2">{row?.sample?.patient?.age || '-'}</Typography>;
        },
    },
    {
        field: 'sampled_at',
        headerName: 'Sampled At',
        type: 'datetime',
        display: 'flex',
        sortable: false,
        width: 160,
        renderCell: ({ row }) => {
            const date = row?.sample?.created_at
                ? formatDateTime(new Date(row.sample.created_at))
                : '-';
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon fontSize="small" color="action" />
                    <Typography variant="body2">{date}</Typography>
                </Box>
            );
        },
    },
    {
        field: 'started_at',
        headerName: 'Started At',
        type: 'string',
        display: 'flex',
        width: 160,
        renderCell: ({ row }) => {
            const date = row.started_at ? formatDateTime(new Date(row.started_at)) : '-';
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">{date}</Typography>
                </Box>
            );
        },
    },
    {
        field: 'status',
        headerName: 'Status',
        type: 'string',
        display: 'flex',
        flex: 0.4,
        renderCell: ({ row }) => {
            const statusInfo = STATUS_CONFIG[row.status] || STATUS_CONFIG.waiting;
            return (
                <Chip
                    icon={statusInfo.icon}
                    label={statusInfo.label}
                    size="small"
                    color={statusInfo.chipColor}
                    sx={{ fontWeight: 'medium' }}
                />
            );
        },
    },
    {
        field: 'tags',
        headerName: 'Tags',
        type: 'string',
        sortable: false,
        display: 'flex',
        flex: 0.8,
        renderCell: ({ row }) => (
            <InlineTagManager
                initialTags={row.acceptance_item?.tags || []}
                updateUrl={route('acceptanceItems.tags.update', row.acceptance_item?.id)}
                entityType="acceptanceItem"
            />
        ),
    },
    {
        field: 'id',
        headerName: 'Actions',
        type: 'actions',
        width: 160,
        getActions: ({ row }) => {
            let output = [
                <GridActionsCellItem
                    icon={
                        <Tooltip title="View Details">
                            <RemoveRedEyeIcon />
                        </Tooltip>
                    }
                    label="Show"
                    component={Link}
                    key={'show-' + row.id}
                    href={route('acceptanceItems.show', {
                        acceptanceItem: row.acceptance_item_id,
                        acceptance: row.acceptance_item.acceptance_id,
                    })}
                    sx={{
                        color: theme.palette.info.main,
                        border: `1px solid ${theme.palette.info.main}`,
                        borderRadius: '50%',
                        p: 0.5,
                        '&:hover': {
                            backgroundColor: theme.palette.info.light,
                            boxShadow: theme.shadows[2],
                        },
                    }}
                />,
            ];

            if (row.status === ACCEPTANCE_ITEM_STATES_STATUS.PROCESSING) {
                output.push(
                    <GridActionsCellItem
                        key={'done-' + row.id}
                        icon={
                            <Tooltip title="Mark as Done">
                                <DoneIcon />
                            </Tooltip>
                        }
                        label="Done"
                        onClick={handleOpenForm(row.id, ACTION_TYPES.COMPLETE)}
                        sx={{
                            color: theme.palette.success.main,
                            border: `1px solid ${theme.palette.success.main}`,
                            borderRadius: '50%',
                            p: 0.5,
                            '&:hover': {
                                backgroundColor: theme.palette.success.light,
                                boxShadow: theme.shadows[2],
                            },
                        }}
                    />,
                    <GridActionsCellItem
                        key={'reject-' + row.id}
                        icon={
                            <Tooltip title="Reject">
                                <CloseIcon />
                            </Tooltip>
                        }
                        label="Reject"
                        onClick={handleOpenRejectForm(row.id)}
                        sx={{
                            color: theme.palette.error.main,
                            border: `1px solid ${theme.palette.error.main}`,
                            borderRadius: '50%',
                            p: 0.5,
                            '&:hover': {
                                backgroundColor: theme.palette.error.light,
                                boxShadow: theme.shadows[2],
                            },
                        }}
                    />,
                );
            } else if (row.status === ACCEPTANCE_ITEM_STATES_STATUS.FINISHED) {
                output.push(
                    <GridActionsCellItem
                        key={'edit-' + row.id}
                        icon={
                            <Tooltip title="Edit">
                                <EditIcon />
                            </Tooltip>
                        }
                        label="Edit"
                        onClick={handleOpenForm(row.id, ACTION_TYPES.UPDATE)}
                        sx={{
                            color: theme.palette.warning.main,
                            border: `1px solid ${theme.palette.warning.main}`,
                            borderRadius: '50%',
                            p: 0.5,
                            '&:hover': {
                                backgroundColor: theme.palette.warning.light,
                                boxShadow: theme.shadows[2],
                            },
                        }}
                    />,
                );
            }

            return output;
        },
    },
];
