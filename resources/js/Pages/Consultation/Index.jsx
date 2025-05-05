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
} from "@mui/material";

// Material UI icons
import {
    RemoveRedEye,
    DeleteOutlined,
    MedicalServicesOutlined,
    AccessTimeOutlined,
    CalendarToday,
    LocalHospitalOutlined
} from "@mui/icons-material";

// Status colors mapping
const statusColors = {
    waiting: "warning",
    completed: "success",
    cancelled: "error",
    "in-progress": "info",
    scheduled: "secondary",
    // Default color for any other status
    default: "default"
};

// Format duration for better readability
const formatDuration = (duration) => {
    if (!duration) return "—";

    // If it's already formatted, return as is
    if (typeof duration === 'string' && duration.includes(':')) {
        return duration;
    }

    // If it's in minutes, format as hours and minutes
    if (typeof duration === 'number') {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    return duration;
};

// Format waiting time for better readability
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

// Format dates for better readability
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
        return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } else if (isTomorrow) {
        return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } else {
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
};

const Index = () => {
    const { post, setData, data, reset, processing } = useForm({});
    const { consultations, status, errors, success, requestInputs } = usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    // Enhanced columns with better visual presentation
    const columns = useMemo(() => [
        {
            field: 'patient_fullname',
            headerName: 'Patient',
            type: "string",
            display:"flex",
            flex: 0.5,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            flex: 0.5,
            display:"flex",
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
            display:"flex",
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
            field: 'waiting_time',
            headerName: 'Waiting From',
            type: "string",
            flex: 0.25,
            display:"flex",
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeOutlined fontSize="small" color="action" />
                    <Typography variant="body2">
                        {formatWaitingTime(params.value)}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'duration',
            headerName: 'Duration',
            type: "string",
            sortable: false,
            flex: 0.2,
            display:"flex",
            renderCell: (params) => (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {formatDuration(params.value)}
                </Typography>
            )
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            type: "datetime",
            flex: 0.3,
            display:"flex",
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday fontSize="small" color="action" />
                    <Tooltip title={params.value }>
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

    const show = (id) => () => {
        router.visit(route("consultations.show", id));
    };

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('consultations.index'), {
            data: {
                page,
                filters,
                sort,
                pageSize
            },
            preserveState: true,
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

    return (
        <Box sx={{ position: 'relative' }}>
            <PageHeader
                title="Consultations"
                subtitle="Manage patient consultations"
                icon={<MedicalServicesOutlined fontSize="large" sx={{ mr: 2 }} />}
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 4
                }}
            >
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
        title: "Dashboard",
        link: route('dashboard'),
        icon: null
    },
    {
        title: "Consultations",
        link: null,
        icon: <MedicalServicesOutlined fontSize="small" />
    }
];

Index.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Index;
