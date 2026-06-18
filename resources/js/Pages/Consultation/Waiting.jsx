import TableLayout from '@/Layouts/TableLayout';
import DeleteForm from '@/Components/DeleteForm';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Filter from './Components/Filter';
import PageHeader from '@/Components/PageHeader.jsx';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';

// Material UI components
import {
    Paper,
    Box,
    Chip,
    Tooltip,
    IconButton,
    Typography,
    Avatar,
    Alert,
    Button,
} from '@mui/material';

// Material UI icons
import {
    DeleteOutlined,
    MedicalServicesOutlined,
    AccessTimeOutlined,
    CalendarToday,
    LocalHospitalOutlined,
    HourglassEmptyOutlined,
    RefreshOutlined,
} from '@mui/icons-material';

const statusColors = {
    waiting: 'warning',
    booked: 'info',
    started: 'primary',
    done: 'success',
    default: 'default',
};

// Format date for better readability
const formatDate = (dateString) => {
    if (!dateString) return '—';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
        return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return (
            date.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
            }) +
            ', ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
    }
};

const formatWaitingTime = (minutes) => {
    if (minutes === null || minutes === undefined) return '—';
    const m = Math.round(Math.abs(minutes));
    if (m < 60) return `${m}m`;
    if (m < 24 * 60) {
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
    }
    const d = Math.floor(m / (24 * 60));
    const h = Math.floor((m % (24 * 60)) / 60);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
};

const Waiting = () => {
    const { post, setData, data, reset, processing } = useForm({});
    const { consultations, status, errors, success, requestInputs } = usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const columns = useMemo(
        () => [
            {
                field: 'patient_fullname',
                headerName: 'Patient',
                type: 'string',
                display: 'flex',
                flex: 0.6,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            sx={{
                                width: 30,
                                height: 30,
                                bgcolor: 'primary.light',
                                fontSize: '0.8rem',
                                flexShrink: 0,
                            }}
                        >
                            {params.value ? params.value.charAt(0).toUpperCase() : 'P'}
                        </Avatar>
                        <Tooltip title="View consultation" placement="top">
                            <Typography
                                variant="body2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    show(params.row.id)();
                                }}
                                sx={{
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    color: 'primary.main',
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                {params.value || 'Unknown'}
                            </Typography>
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: 'patient_phone',
                headerName: 'Phone',
                type: 'string',
                display: 'flex',
                flex: 0.4,
                renderCell: (params) => (
                    <Typography
                        variant="body2"
                        color={params.value ? 'text.primary' : 'text.disabled'}
                    >
                        {params.value || '—'}
                    </Typography>
                ),
            },
            {
                field: 'consultant_name',
                headerName: 'Consultant',
                type: 'string',
                display: 'flex',
                flex: 0.5,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalHospitalOutlined fontSize="small" color="primary" />
                        <Tooltip title={params.value || 'Unassigned'} placement="top">
                            <Typography
                                variant="body2"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {params.value || '—'}
                            </Typography>
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                display: 'flex',
                flex: 0.25,
                renderCell: (params) => {
                    const status = params.value?.toLowerCase() || 'default';
                    const color = statusColors[status] || statusColors.default;
                    return (
                        <Chip
                            label={params.value || '—'}
                            color={color}
                            size="small"
                            variant={status === 'waiting' ? 'filled' : 'outlined'}
                            sx={{ textTransform: 'capitalize' }}
                        />
                    );
                },
            },
            {
                field: 'waiting_time',
                headerName: 'Waiting Time',
                type: 'string',
                display: 'flex',
                flex: 0.3,
                renderCell: (params) => {
                    const minutes = typeof params.value === 'number' ? params.value : null;
                    const isLong = minutes !== null && minutes > 30;
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeOutlined
                                fontSize="small"
                                color={isLong ? 'error' : 'action'}
                            />
                            <Typography
                                variant="body2"
                                color={isLong ? 'error.main' : 'text.primary'}
                                fontWeight={isLong ? 600 : 400}
                            >
                                {formatWaitingTime(params.value)}
                            </Typography>
                        </Box>
                    );
                },
            },
            {
                field: 'dueDate',
                headerName: 'Due Date',
                type: 'datetime',
                display: 'flex',
                flex: 0.4,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Tooltip title={params.value ? String(params.value) : 'Not scheduled'}>
                            <Typography variant="body2">{formatDate(params.value)}</Typography>
                        </Tooltip>
                    </Box>
                ),
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                display: 'flex',
                flex: 0.2,
                sortable: false,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {params.row.status?.toLowerCase() === 'waiting' && (
                            <Tooltip title="Delete">
                                <IconButton
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteConsultation(params.row)();
                                    }}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteOutlined fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                ),
            },
        ],
        [],
    );

    const deleteConsultation = (params) => () => {
        setData({ ...params, _method: 'delete' });
        setOpenDeleteForm(true);
    };

    const show = (id) => () => router.visit(route('consultations.show', id));

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('consultations.waiting-list'), {
            data: {
                page,
                filters,
                sort,
                pageSize,
            },
            only: ['consultations', 'status', 'success', 'requestInputs'],
            preserveState: true,
        });
    };

    const handleCloseDeleteForm = () => {
        reset();
        setOpenDeleteForm(false);
    };

    const handleDestroy = async () => {
        post(route('consultations.destroy', data.id), {
            onSuccess: handleCloseDeleteForm,
        });
    };

    // Function to check if there are urgent consultations (waiting for a long time)
    const hasUrgentConsultations = () => {
        if (!consultations?.data) return false;

        return consultations.data.some((consultation) => {
            const waitingTime = consultation.waiting_time;
            if (!waitingTime) return false;

            if (typeof waitingTime === 'number') {
                return waitingTime > 30; // More than 30 minutes
            }

            if (typeof waitingTime === 'string') {
                return waitingTime.includes('hour') || waitingTime.includes('day');
            }

            return false;
        });
    };

    // Count of waiting consultations
    const waitingCount = consultations?.data
        ? consultations.data.filter((c) => c.status?.toLowerCase() === 'waiting').length
        : 0;

    return (
        <Box sx={{ position: 'relative' }}>
            <Head title="Waiting Consultations" />
            <PageHeader
                title="Waiting Consultations"
                subtitle={`Patients waiting for consultation: ${waitingCount}`}
                icon={<HourglassEmptyOutlined fontSize="large" sx={{ mr: 2 }} />}
            />

            {hasUrgentConsultations() && (
                <Alert
                    severity="warning"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<RefreshOutlined />}
                            onClick={() =>
                                pageReload(
                                    requestInputs?.page || 1,
                                    requestInputs?.filters,
                                    requestInputs?.sort,
                                    requestInputs?.pageSize,
                                )
                            }
                        >
                            Refresh
                        </Button>
                    }
                >
                    Some patients have been waiting for a long time. Please prioritize their
                    consultations.
                </Alert>
            )}

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 4,
                }}
            >
                <Box
                    sx={{
                        bgcolor: '#f5faff',
                        p: 2,
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HourglassEmptyOutlined color="primary" />
                        <Typography variant="subtitle1" fontWeight={500}>
                            Waiting Patients
                        </Typography>
                    </Box>

                    <Tooltip title="Refresh List">
                        <IconButton
                            size="small"
                            onClick={() =>
                                pageReload(
                                    requestInputs?.page || 1,
                                    requestInputs?.filters,
                                    requestInputs?.sort,
                                    requestInputs?.pageSize,
                                )
                            }
                        >
                            <RefreshOutlined />
                        </IconButton>
                    </Tooltip>
                </Box>

                <TableLayout
                    defaultValues={requestInputs}
                    success={success}
                    status={status}
                    reload={pageReload}
                    columns={columns}
                    data={consultations}
                    processing={processing}
                    Filter={Filter}
                    errors={errors}
                    sx={{
                        '& .MuiDataGrid-row': {
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f5f5f5',
                        },
                        '& .MuiDataGrid-cell': {
                            padding: '8px 16px',
                        },
                    }}
                    onRowClick={(params) => show(params.id)()}
                    emptyContent={
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <HourglassEmptyOutlined
                                sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                            />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Waiting Consultations
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                There are currently no patients waiting for consultation.
                            </Typography>
                        </Box>
                    }
                />
            </Paper>

            <DeleteForm
                title={`Delete ${data?.patient_fullname || 'Patient'}'s Consultation`}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseDeleteForm}
                openDelete={openDeleteForm}
            />
        </Box>
    );
};

const breadCrumbs = [
    {
        title: 'Consultations',
        link: route('consultations.index'),
        icon: <MedicalServicesOutlined fontSize="small" />,
    },
    {
        title: 'Waiting List',
        link: null,
        icon: <HourglassEmptyOutlined fontSize="small" />,
    },
];

Waiting.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Waiting;
