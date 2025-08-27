import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import PageHeader from "@/Components/PageHeader.jsx";
import {router, usePage} from "@inertiajs/react";
import {useState, useMemo} from "react";

// Material UI components
import {
    Paper,
    Box,
    Chip,
    Tooltip,
    IconButton,
    Typography,
    Button,
    Alert,
} from "@mui/material";

// Material UI icons
import {
    ScienceOutlined,
    AccessTimeOutlined,
    CalendarToday,
    AssignmentOutlined,
    RefreshOutlined,
    Description,
    Timeline
} from "@mui/icons-material";

// Format date for better readability
const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
    } else if (isYesterday) {
        return `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
    } else {
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        }) + ', ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
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
    const {acceptanceItems, status, errors, success, requestInputs} = usePage().props;

    // Enhanced columns with better visual presentation
    const columns = useMemo(() => [
        {
            field: 'acceptance.patient.fullName',
            headerName: 'Patient',
            type: "string",
            flex: 1,
            sortable: false,
            display: "flex",
            renderCell: ({row}) => (
                <Box>
                    <Tooltip title={row?.patient?.fullName || "Unknown"} placement="top">
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {row?.patient?.fullName || "Unknown"}
                        </Typography>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'test.name',
            headerName: 'Test',
            type: "string",
            flex: 1,
            display: "flex",
            sortable: false,
            renderCell: ({row}) => (
                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <ScienceOutlined fontSize="small" color="primary"/>
                        <Tooltip title={row.test.name} placement="top">
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {row.test.name}
                            </Typography>
                        </Tooltip>
                    </Box>
                    <Chip
                        label={row.method.name}
                        size="small"
                        variant="outlined"
                        sx={{
                            mt: 0.5,
                            maxWidth: '100%',
                            fontSize: '0.7rem',
                            height: 20,
                            '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }
                        }}
                    />
                </Box>
            )
        },
        {
            field: 'waitingForReport',
            headerName: 'Waiting Time',
            type: "string",
            sortable: false,
            flex: 0.7,
            display: "flex",
            renderCell: ({value}) => {
                // Determine if waiting time is long (e.g., more than 2 hours)
                const isLongWait = value &&
                    ((typeof value === 'number' && value > 120) ||
                        (typeof value === 'string' && (value.includes('hour') || value.includes('day'))));

                return (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <AccessTimeOutlined
                            fontSize="small"
                            color={isLongWait ? "error" : "action"}
                        />
                        <Typography
                            variant="body2"
                            color={isLongWait ? "error.main" : "text.primary"}
                            fontWeight={isLongWait ? 500 : 400}
                        >
                            {formatWaitingTime(value)}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'created_at',
            headerName: 'Started At',
            type: "date",
            flex: 0.7,
            display: "flex",
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value}) => (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <CalendarToday fontSize="small" color="action"/>
                    <Tooltip title={value ? new Date(value).toLocaleString() : "Not recorded"}>
                        <Typography variant="body2">
                            {formatDate(value)}
                        </Typography>
                    </Tooltip>
                </Box>
            )
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            sortable: false,
            flex: 0.6,
            display: "flex",
            renderCell: ({row}) => (
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<Description/>}
                    onClick={() => handleCreate(row)()}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: 2,
                        '&:hover': {
                            boxShadow: 3,
                        }
                    }}
                >
                    Create Report
                </Button>
            )
        }
    ], []);

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('reports.waitingList'), {
            data: {
                page,
                filters,
                sort,
                pageSize
            },
            only: ["acceptanceItems", "status", "success", "requestInputs"],
            preserveState: true
        });
    };

    const handleCreate = (row) => () => router.visit(route("acceptanceItems.createReport", row.id));

    // Function to check if there are urgent reports (waiting for a long time)
    const hasUrgentReports = () => {
        if (!acceptanceItems?.data) return false;

        return acceptanceItems.data.some(item => {
            const waitingTime = item.waitingForReport;
            if (!waitingTime) return false;

            if (typeof waitingTime === 'number') {
                return waitingTime > 120; // More than 2 hours
            }

            if (typeof waitingTime === 'string') {
                return waitingTime.includes('hour') || waitingTime.includes('day');
            }

            return false;
        });
    };

    // Count of waiting reports
    const waitingCount = acceptanceItems?.data?.length || 0;

    return (
        <Box sx={{position: 'relative'}}>
            <PageHeader
                title="Ready For Reporting"
                subtitle={`${waitingCount} tests waiting for reports`}
                icon={<AssignmentOutlined fontSize="large" sx={{mr: 2}}/>}
            />

            {hasUrgentReports() && (
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
                            startIcon={<RefreshOutlined/>}
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
                    Some reports have been waiting for a long time. Please prioritize them.
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
                        bgcolor: '#f5f8ff',
                        p: 2,
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Timeline color="primary"/>
                        <Typography variant="subtitle1" fontWeight={500}>
                            Tests Awaiting Reports
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
                            sx={{
                                borderRadius: 1,
                                '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                }
                            }}
                        >
                            <RefreshOutlined/>
                        </IconButton>
                    </Tooltip>
                </Box>

                <TableLayout
                    defaultValues={requestInputs}
                    success={success}
                    status={status}
                    reload={pageReload}
                    columns={columns}
                    data={acceptanceItems}
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
                    onRowClick={(params) => handleCreate(params.row)()}
                    emptyContent={
                        <Box sx={{p: 4, textAlign: 'center'}}>
                            <AssignmentOutlined sx={{fontSize: 48, color: 'text.secondary', mb: 2}}/>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Tests Waiting For Reports
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                All tests have been reported. Check back later.
                            </Typography>
                        </Box>
                    }
                />
            </Paper>
        </Box>
    );
};

const breadCrumbs = [
    {
        title: "Reports",
        link: route("reports.index"),
        icon: <Description fontSize="small"/>
    },
    {
        title: "Waiting List",
        link: null,
        icon: <Timeline fontSize="small"/>
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
