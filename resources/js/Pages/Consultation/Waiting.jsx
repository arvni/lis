import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import PageHeader from "@/Components/PageHeader.jsx";
import { router, useForm, usePage } from "@inertiajs/react";
import { useState, useMemo } from "react";

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
    Button
} from "@mui/material";

// Material UI icons
import {
    RemoveRedEye,
    DeleteOutlined,
    MedicalServicesOutlined,
    AccessTimeOutlined,
    CalendarToday,
    LocalHospitalOutlined,
    HourglassEmptyOutlined,
    RefreshOutlined,
} from "@mui/icons-material";

// Status colors mapping
const statusColors = {
    waiting: "warning",
    completed: "success",
    cancelled: "error",
    "in-progress": "info",
    scheduled: "secondary",
    default: "default"
};

// Format date for better readability
const formatDate = (dateString) => {
    if (!dateString) return "—";

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
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

// Format waiting time for better display
const formatWaitingTime = (waitingTime) => {
    if (!waitingTime) return "—";

    // If it looks like it contains a date or time unit, return as is
    if (typeof waitingTime === 'string' &&
        (waitingTime.includes(':') || waitingTime.includes('day') || waitingTime.includes('hour'))) {
        return waitingTime;
    }

    // If it's in minutes, format intelligently
    if (typeof waitingTime === 'number') {
        if (waitingTime < 60) {
            return `${waitingTime}m`;
        } else if (waitingTime < 24 * 60) {
            const hours = Math.floor(waitingTime / 60);
            const minutes = waitingTime % 60;
            return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
        } else {
            const days = Math.floor(waitingTime / (24 * 60));
            const hours = Math.floor((waitingTime % (24 * 60)) / 60);
            return `${days}d ${hours > 0 ? `${hours}h` : ''}`;
        }
    }

    return waitingTime;
};

const Waiting = () => {
    const { post, setData, data, reset, processing } = useForm({});
    const { consultations, status, errors, success, requestInputs } = usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    // Enhanced columns with better visual presentation
    const columns = useMemo(() => [
        {
            field: 'patient_fullname',
            headerName: 'Patient',
            type: "string",
            flex: 0.7,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.light',
                            fontSize: '0.875rem'
                        }}
                    >
                        {params.value ? params.value.charAt(0).toUpperCase() : 'P'}
                    </Avatar>
                    <Tooltip title={params.value || "Unknown"} placement="top">
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {params.value || "Unknown"}
                        </Typography>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'consultant_name',
            headerName: 'Consultant',
            type: "string",
            flex: 0.7,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalOutlined fontSize="small" color="primary" />
                    <Tooltip title={params.value || "Unassigned"} placement="top">
                        <Typography
                            variant="body2"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {params.value || "Unassigned"}
                        </Typography>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            flex: 0.2,
            renderCell: (params) => {
                const status = params.value?.toLowerCase() || 'default';
                const color = statusColors[status] || statusColors.default;

                return (
                    <Chip
                        label={params.value || "Unknown"}
                        color={color}
                        size="small"
                        variant={status === 'waiting' ? 'filled' : 'outlined'}
                        sx={{
                            textTransform: 'capitalize',
                            fontWeight: status === 'waiting' ? 500 : 400
                        }}
                    />
                );
            }
        },
        {
            field: 'waitingT_time',
            headerName: 'Waiting Time',
            type: "string",
            flex: 0.3,
            renderCell: (params) => {
                // Determine if waiting time is long (e.g., more than 30 min)
                const isLongWait = params.value &&
                    ((typeof params.value === 'number' && params.value > 30) ||
                        (typeof params.value === 'string' && (params.value.includes('hour') || params.value.includes('day'))));

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeOutlined
                            fontSize="small"
                            color={isLongWait ? "error" : "action"}
                        />
                        <Typography
                            variant="body2"
                            color={isLongWait ? "error.main" : "text.primary"}
                            fontWeight={isLongWait ? 500 : 400}
                        >
                            {formatWaitingTime(params.value)}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            type: "date",
            flex: 0.4,
            valueGetter: (value) => value && new Date(value),
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Tooltip title={params.value.toLocaleString() || "Not scheduled"}>
                        <Typography variant="body2">
                            {formatDate(params.value)}
                        </Typography>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            flex: 0.2,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                        <IconButton
                            onClick={() => show(params.row.id)()}
                            size="small"
                            color="primary"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                }
                            }}
                        >
                            <RemoveRedEye fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    {params.row.status?.toLowerCase() === 'waiting' && (
                        <Tooltip title="Delete Consultation">
                            <IconButton
                                onClick={() => deleteConsultation(params.row)()}
                                size="small"
                                color="error"
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'rgba(211, 47, 47, 0.08)'
                                    }
                                }}
                            >
                                <DeleteOutlined fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )
        }
    ], []);

    const deleteConsultation = (params) => () => {
        setData({...params, _method: "delete"});
        setOpenDeleteForm(true);
    };

    const show = (id) => () => router.visit(route("consultations.show", id));

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('consultations.waiting-list'), {
            data: {
                page,
                filters,
                sort,
                pageSize
            },
            only: ["consultations", "status", "success", "requestInputs"],
            preserveState: true
        });
    };

    const handleCloseDeleteForm = () => {
        reset();
        setOpenDeleteForm(false);
    };

    const handleDestroy = async () => {
        post(route('consultations.destroy', data.id), {
            onSuccess: handleCloseDeleteForm
        });
    };

    // Function to check if there are urgent consultations (waiting for a long time)
    const hasUrgentConsultations = () => {
        if (!consultations?.data) return false;

        return consultations.data.some(consultation => {
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
    const waitingCount = consultations?.data ?
        consultations.data.filter(c => c.status?.toLowerCase() === 'waiting').length :
        0;

    return (
        <Box sx={{ position: 'relative' }}>
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
                        alignItems: 'center'
                    }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            startIcon={<RefreshOutlined />}
                            onClick={() => pageReload(
                                requestInputs?.page || 1,
                                requestInputs?.filters,
                                requestInputs?.sort,
                                requestInputs?.pageSize
                            )}
                        >
                            Refresh
                        </Button>
                    }
                >
                    Some patients have been waiting for a long time. Please prioritize their consultations.
                </Alert>
            )}

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 4
                }}
            >
                <Box
                    sx={{
                        bgcolor: '#f5faff',
                        p: 2,
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
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
                            onClick={() => pageReload(
                                requestInputs?.page || 1,
                                requestInputs?.filters,
                                requestInputs?.sort,
                                requestInputs?.pageSize
                            )}
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
                        }
                    }}
                    onRowClick={(params) => show(params.id)()}
                    emptyContent={
                        <Box sx={{ p: 4, textAlign: 'center' }}>
                            <HourglassEmptyOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
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
                title={`Delete ${data?.patient_full_name || 'Patient'}'s Consultation`}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseDeleteForm}
                openDelete={openDeleteForm}
            />
        </Box>
    );
};

const breadCrumbs = [
    {
        title: "Consultations",
        link: route('consultations.index'),
        icon: <MedicalServicesOutlined fontSize="small" />
    },
    {
        title: "Waiting List",
        link: null,
        icon: <HourglassEmptyOutlined fontSize="small" />
    }
];

Waiting.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Waiting;
