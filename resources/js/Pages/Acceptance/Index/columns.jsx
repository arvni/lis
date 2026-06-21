import { Link } from '@inertiajs/react';
import { Stack, Typography, Box, Chip, Tooltip, Badge } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    CalendarToday as CalendarTodayIcon,
    QrCode as QrCodeIcon,
    HourglassEmpty as HourglassEmptyIcon,
    MergeType as MergeTypeIcon,
    FlashOn as FlashOnIcon,
    PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';
import InlineTagManager from '@/Components/InlineTagManager';
import { formatDate } from '@/Services/helper.js';
import { formatCurrency, getStatusInfo, getBarcodeChipColor } from './helpers';

export const buildColumns = ({
    canUpdate,
    canDelete,
    canCancel,
    canEditInvoiced,
    edit,
    deleteAcceptance,
    cancelAcceptance,
    onAddPooling,
}) => [
    {
        field: 'patient_fullname',
        headerName: 'Patient',
        type: 'string',
        flex: 1.2,
        display: 'flex',
        align: 'left',
        renderCell: ({ row }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Link href={route('acceptances.show', row.id)} title={row.id}>
                    {row.patient_fullname || 'N/A'}
                </Link>
                <Typography variant="caption" color="text.secondary">
                    ID: {row.patient_idno || 'N/A'}
                </Typography>
            </Box>
        ),
    },
    {
        field: 'referrer_fullname',
        headerName: 'Referrer',
        type: 'string',
        flex: 0.5,
        display: 'flex',
        renderCell: ({ row }) => (
            <Box display="flex" sx={{ alignItems: 'center' }}>
                <Box>
                    <Typography variant="body2">{row.referrer_fullname || 'N/A'}</Typography>
                    {row.referrer_fullname && (
                        <Typography variant="caption" color="text.secondary">
                            Reference Code: {row.referenceCode || 'N/A'}
                        </Typography>
                    )}
                </Box>
            </Box>
        ),
    },
    {
        field: 'barcodes',
        headerName: 'Barcodes',
        type: 'string',
        sortable: false,
        flex: 0.6,
        display: 'flex',
        renderCell: ({ row }) => {
            const samples = row?.samples || [];

            // If no samples, show "No barcodes"
            if (samples.length === 0) {
                return (
                    <Typography variant="caption" color="text.secondary">
                        No barcodes
                    </Typography>
                );
            }

            // Show up to 2 barcodes and a count badge if there are more
            const displayedSamples = samples.slice(0, 2);
            const remaining = samples.length - displayedSamples.length;

            return (
                <Stack direction="row" spacing={0.5}>
                    {displayedSamples.map((item, idx) => (
                        <Chip
                            key={idx}
                            icon={<QrCodeIcon fontSize="small" />}
                            label={item.barcode}
                            size="small"
                            color={getBarcodeChipColor(idx)}
                            variant="outlined"
                            sx={{
                                fontSize: '0.7rem',
                                borderStyle: 'dashed',
                            }}
                        />
                    ))}
                    {remaining > 0 && (
                        <Tooltip title={`${remaining} more barcode${remaining > 1 ? 's' : ''}`}>
                            <Chip
                                label={`+${remaining}`}
                                size="small"
                                variant="outlined"
                                sx={{
                                    fontSize: '0.7rem',
                                    bgcolor: 'grey.100',
                                }}
                            />
                        </Tooltip>
                    )}
                </Stack>
            );
        },
    },
    {
        field: 'tags',
        headerName: 'Tags',
        sortable: false,
        flex: 0.7,
        display: 'flex',
        renderCell: ({ row }) => (
            <InlineTagManager
                initialTags={row.tags || []}
                updateUrl={route('acceptances.tags.update', row.id)}
                entityType="acceptance"
            />
        ),
    },
    {
        field: 'out_patient',
        headerName: 'Patient Type',
        type: 'boolean',
        flex: 0.3,
        display: 'flex',
        renderCell: ({ row }) => (
            <Chip
                label={row.out_patient ? 'Out patient' : 'In patient'}
                color={row.out_patient ? 'info' : 'secondary'}
                variant={row.out_patient ? 'filled' : 'filled'}
                size="small"
                sx={{
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    borderRadius: 1,
                }}
            />
        ),
    },
    {
        field: 'remaining_amount',
        headerName: 'Remaining',
        flex: 0.3,
        display: 'flex',
        type: 'number',
        renderCell: ({ row }) => {
            const remaining = row.payable_amount - row.payments_sum_price;
            const isPaid = remaining <= 0;

            return (
                <Tooltip title={isPaid ? 'Fully paid' : 'Remaining amount to be paid'}>
                    <Chip
                        label={formatCurrency(remaining)}
                        color={isPaid ? 'success' : 'warning'}
                        size="small"
                        variant={isPaid ? 'outlined' : 'filled'}
                        sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            borderRadius: 1,
                        }}
                    />
                </Tooltip>
            );
        },
    },
    {
        field: 'status',
        headerName: 'Status',
        type: 'string',
        flex: 0.4,
        display: 'flex',
        renderCell: ({ row }) => {
            const statusInfo = getStatusInfo(row.status);

            return (
                <Chip
                    icon={statusInfo.icon}
                    label={statusInfo.label}
                    color={statusInfo.color}
                    size="small"
                    sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        borderRadius: 1,
                    }}
                />
            );
        },
    },
    {
        field: 'priority',
        headerName: 'Priority',
        type: 'string',
        flex: 0.25,
        display: 'flex',
        renderCell: ({ row }) => {
            const map = {
                stat: {
                    label: 'STAT',
                    color: 'error',
                    icon: <FlashOnIcon fontSize="small" />,
                },
                urgent: {
                    label: 'Urgent',
                    color: 'warning',
                    icon: <PriorityHighIcon fontSize="small" />,
                },
                routine: { label: 'Routine', color: 'default', icon: null },
            };
            const cfg = map[row.priority] ?? map.routine;
            if (row.priority === 'routine') return null;
            return (
                <Chip
                    icon={cfg.icon}
                    label={cfg.label}
                    color={cfg.color}
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
            );
        },
    },
    {
        field: 'report_date',
        headerName: 'Est. Report Date',
        flex: 0.4,
        display: 'flex',
        valueGetter: (value) => value && new Date(value),
        renderCell: ({ value, row }) => {
            // Calculate if report date is today, in the past or future
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const reportDate = value ?? null;
            const reportDay = reportDate ? new Date(reportDate) : null;
            if (reportDay) reportDay.setHours(0, 0, 0, 0);

            const isToday = reportDay && reportDay.getTime() === today.getTime();
            const isPast = reportDay && reportDay.getTime() < today.getTime();

            const isReported = row.status?.toLowerCase() === 'reported';

            return reportDate ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    {isReported ? (
                        <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                    ) : row.waiting_for_pooling ? (
                        <HourglassEmptyIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />
                    ) : (
                        <Badge
                            color={isToday ? 'warning' : isPast ? 'error' : 'success'}
                            variant="dot"
                            sx={{ mr: 1 }}
                        >
                            <CalendarTodayIcon fontSize="small" color="action" />
                        </Badge>
                    )}
                    <Box>
                        <Typography
                            variant="body2"
                            color={
                                isPast && !isReported && !row.waiting_for_pooling
                                    ? 'error.main'
                                    : 'text.primary'
                            }
                        >
                            {formatDate(reportDate).split(',')[0]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(reportDate).split(',')[1]}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary">
                    N/A
                </Typography>
            );
        },
    },
    {
        field: 'created_at',
        headerName: 'Registered At',
        flex: 0.4,
        type: 'datetime',
        display: 'flex',
        valueGetter: (value) => value && new Date(value),
        renderCell: ({ value }) => formatDate(value),
    },
    {
        field: 'published_at',
        headerName: 'Published At',
        flex: 0.4,
        type: 'datetime',
        display: 'flex',
        valueGetter: (value) => value && new Date(value),
        renderCell: ({ value }) => (value ? formatDate(value) : '-'),
    },
    {
        field: 'how_found_us',
        headerName: 'How Found Us',
        type: 'string',
        flex: 0.4,
        display: 'flex',
        renderCell: ({ row }) =>
            row.how_found_us ? (
                <Chip
                    label={row.how_found_us}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    sx={{ fontSize: '0.7rem', maxWidth: 140 }}
                />
            ) : null,
    },
    {
        field: 'id',
        headerName: 'Actions',
        type: 'actions',
        flex: 0.6,
        display: 'flex',
        getActions: (params) => {
            const isInvoiced = Boolean(params.row.invoice_id);
            const invoicedAllowed = !isInvoiced || canEditInvoiced;
            let cols = [];

            if ((canUpdate || params.row.status === 'pending') && invoicedAllowed) {
                cols.push(
                    <GridActionsCellItem
                        icon={
                            <Tooltip title="Edit acceptance">
                                <EditIcon color="primary" />
                            </Tooltip>
                        }
                        label="Edit"
                        onClick={edit(params.row.id)}
                    />,
                );
            }

            if ((canDelete || params.row.status === 'pending') && invoicedAllowed) {
                cols.push(
                    <GridActionsCellItem
                        icon={
                            <Tooltip title="Delete acceptance">
                                <DeleteIcon color="error" />
                            </Tooltip>
                        }
                        label="Delete"
                        onClick={deleteAcceptance(params.row)}
                    />,
                );
            }

            if (canCancel && params.row.status?.toLowerCase() !== 'canceled' && invoicedAllowed) {
                cols.push(
                    <GridActionsCellItem
                        icon={
                            <Tooltip title="Cancel acceptance">
                                <CancelIcon color="warning" />
                            </Tooltip>
                        }
                        label="Cancel"
                        onClick={cancelAcceptance(params.row)}
                    />,
                );
            }

            if (params.row.status?.toLowerCase() === 'pooling' && invoicedAllowed) {
                cols.push(
                    <GridActionsCellItem
                        icon={
                            <Tooltip title="Add pooling sample">
                                <MergeTypeIcon color="secondary" />
                            </Tooltip>
                        }
                        label="Add Pooling"
                        onClick={() => onAddPooling(params.row)}
                    />,
                );
            }

            return cols;
        },
    },
];
