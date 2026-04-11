import React, {useState, useCallback, useMemo} from 'react';
import {router, usePage} from '@inertiajs/react';
import {
    Button, Box, Typography, Chip, Paper, IconButton, Tooltip,
    ToggleButtonGroup, ToggleButton, Card, CardContent, Stack
} from '@mui/material';
import {GridActionsCellItem} from '@mui/x-data-grid';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteForm from '@/Components/DeleteForm';
import Filter from './Components/Filter';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {formatDate} from "@/Services/helper.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    pending:    'warning',
    assigned:   'info',
    in_transit: 'secondary',
    completed:  'success',
    cancelled:  'error',
};

function fmtDateTime(val) {
    if (!val) return '—';
    return new Date(val).toLocaleString([], {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────
function buildCalendarDays(year, month) {
    // month is 0-based JS month
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({calendarEvents, calendarMonth, onMonthChange}) {
    const [year, month] = calendarMonth.split('-').map(Number);
    const jsMonth = month - 1; // 0-based

    const eventsByDay = useMemo(() => {
        const map = {};
        (calendarEvents || []).forEach(ev => {
            const d = new Date(ev.preferred_date);
            const day = d.getDate();
            if (!map[day]) map[day] = [];
            map[day].push(ev);
        });
        return map;
    }, [calendarEvents]);

    const cells = buildCalendarDays(year, jsMonth);

    const prevMonth = () => {
        const d = new Date(year, jsMonth - 1, 1);
        onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };
    const nextMonth = () => {
        const d = new Date(year, jsMonth + 1, 1);
        onMonthChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === jsMonth;

    return (
        <Paper sx={{p: 2}}>
            {/* Header */}
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
                <IconButton onClick={prevMonth} size="small"><ChevronLeftIcon/></IconButton>
                <Typography variant="h6" fontWeight="bold">
                    {MONTH_NAMES[jsMonth]} {year}
                </Typography>
                <IconButton onClick={nextMonth} size="small"><ChevronRightIcon/></IconButton>
            </Box>

            {/* Day-of-week headers */}
            <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', mb: '4px'}}>
                {DAY_NAMES.map(d => (
                    <Box key={d} sx={{textAlign: 'center', py: '4px'}}>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">{d}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Calendar grid */}
            <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px'}}>
                {cells.map((day, idx) => {
                    const isToday = isCurrentMonth && day === today.getDate();
                    const events = day ? (eventsByDay[day] || []) : [];
                    return (
                        <Box
                            key={idx}
                            sx={{
                                minHeight: 90,
                                border: '1px solid',
                                borderColor: isToday ? 'primary.main' : 'divider',
                                borderRadius: 1,
                                p: '4px',
                                bgcolor: day ? (isToday ? 'primary.50' : 'background.paper') : 'action.hover',
                            }}
                        >
                            {day && (
                                <>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: isToday ? 'bold' : 'normal',
                                            color: isToday ? 'primary.main' : 'text.primary',
                                            display: 'block',
                                            mb: '2px',
                                        }}
                                    >
                                        {day}
                                    </Typography>
                                    <Stack spacing={'2px'}>
                                        {events.map(ev => (
                                            <Tooltip
                                                key={ev.id}
                                                title={
                                                    <Box>
                                                        <Typography variant="caption" display="block">
                                                            <strong>#{ev.id}</strong> — {ev.referrer?.fullName || '—'}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            Collector: {ev.sample_collector?.name || '—'}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            Preferred: {new Date(ev.preferred_date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                                        </Typography>
                                                        {ev.logistic_information?.started_at && (
                                                            <Typography variant="caption" display="block">
                                                                Started: {fmtDateTime(ev.logistic_information.started_at)}
                                                            </Typography>
                                                        )}
                                                        {ev.logistic_information?.ended_at && (
                                                            <Typography variant="caption" display="block">
                                                                Ended: {fmtDateTime(ev.logistic_information.ended_at)}
                                                            </Typography>
                                                        )}
                                                        {ev.note && (
                                                            <Typography variant="caption" display="block">
                                                                Note: {ev.note}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                                arrow
                                            >
                                                <Chip
                                                    label={`#${ev.id} ${ev.referrer?.fullName?.split(' ')[0] || ''}`}
                                                    size="small"
                                                    color={STATUS_COLORS[ev.status] || 'default'}
                                                    onClick={() => router.visit(route('collect-requests.show', ev.id))}
                                                    sx={{
                                                        fontSize: '0.65rem',
                                                        height: 18,
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        '& .MuiChip-label': {overflow: 'hidden', textOverflow: 'ellipsis'}
                                                    }}
                                                />
                                            </Tooltip>
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Box>
                    );
                })}
            </Box>

            {/* Legend */}
            <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2}}>
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <Chip key={status} label={status.replace('_', ' ')} size="small" color={color} variant="outlined"/>
                ))}
            </Box>
        </Paper>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CollectRequestsIndex = () => {
    const {collectRequests, status, success, requestInputs, calendarEvents, calendarMonth} = usePage().props;

    const [collectRequest, setCollectRequest] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

    const showCollectRequest = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('collect-requests.show', id));
    }, []);

    const editCollectRequest = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('collect-requests.edit', id));
    }, []);

    const deleteCollectRequest = useCallback((params) => () => {
        setCollectRequest(params);
        setOpenDeleteForm(true);
    }, []);

    const addCollectRequest = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('collect-requests.create'));
    }, []);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('collect-requests.index'), {
            data: {page, filters, sort, pageSize},
            only: ['collectRequests', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const handleMonthChange = useCallback((month) => {
        router.visit(route('collect-requests.index'), {
            data: {...requestInputs, calendar_month: month},
            only: ['calendarEvents', 'calendarMonth'],
            preserveState: true,
        });
    }, [requestInputs]);

    const handleCloseDeleteForm = useCallback(() => {
        setCollectRequest(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(async () => {
        if (collectRequest) {
            router.post(
                route('collect-requests.destroy', collectRequest.id),
                {_method: 'delete'},
                {onSuccess: handleCloseDeleteForm}
            );
        }
    }, [collectRequest, handleCloseDeleteForm]);

    const columns = useMemo(() => [
        {field: 'id', headerName: 'ID', type: 'number', width: 80},
        {
            field: 'sample_collector',
            headerName: 'Sample Collector',
            type: 'string',
            width: 180,
            renderCell: ({row}) => row.sample_collector?.name || 'N/A'
        },
        {
            field: 'referrer',
            headerName: 'Referrer',
            type: 'string',
            width: 180,
            renderCell: ({row}) => row.referrer?.name || 'N/A'
        },
        {field: 'barcode', headerName: 'Barcode', type: 'string', width: 130},
        {
            field: 'preferred_date',
            headerName: 'Preferred Date',
            width: 170,
            renderCell: (params) => params.value ? formatDate(params.value) : '—'
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
            renderCell: ({row}) => fmtDateTime(row.logistic_information?.started_at),
        },
        {
            field: 'ended_at',
            headerName: 'Ended At',
            width: 170,
            renderCell: ({row}) => fmtDateTime(row.logistic_information?.ended_at),
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
                        icon={<RemoveRedEyeIcon/>}
                        label="Show"
                        href={route('collect-requests.show', params.row.id)}
                        onClick={showCollectRequest(params.row.id)}
                    />,
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon/>}
                        label="Edit"
                        href={route('collect-requests.edit', params.row.id)}
                        onClick={editCollectRequest(params.row.id)}
                    />
                ];
                if (!params.row.referrer_orders_count) {
                    actions.push(
                        <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon/>}
                            label="Delete"
                            onClick={deleteCollectRequest(params.row)}
                        />
                    );
                }
                return actions;
            }
        }
    ], [showCollectRequest, editCollectRequest, deleteCollectRequest]);

    return (
        <>
            <PageHeader
                title="Collect Requests"
                actions={
                    <Box sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(_, v) => v && setViewMode(v)}
                            size="small"
                        >
                            <ToggleButton value="list"><ViewListIcon fontSize="small"/></ToggleButton>
                            <ToggleButton value="calendar"><CalendarMonthIcon fontSize="small"/></ToggleButton>
                        </ToggleButtonGroup>
                        <Button
                            color="success"
                            href={route('collect-requests.create')}
                            onClick={addCollectRequest}
                            variant="contained"
                            startIcon={<AddIcon/>}
                        >
                            Add Collect Request
                        </Button>
                    </Box>
                }
            />

            {viewMode === 'calendar' ? (
                <Box sx={{px: 2, pb: 2}}>
                    <CalendarView
                        calendarEvents={calendarEvents}
                        calendarMonth={calendarMonth}
                        onMonthChange={handleMonthChange}
                    />
                </Box>
            ) : (
                <TableLayout
                    defaultValues={requestInputs}
                    columns={columns}
                    data={collectRequests}
                    reload={pageReload}
                    Filter={Filter}
                    success={success}
                    status={status}
                >
                    <DeleteForm
                        title={`Collect Request #${collectRequest?.id ?? ''}`}
                        agreeCB={handleDestroy}
                        disAgreeCB={handleCloseDeleteForm}
                        openDelete={openDeleteForm}
                    />
                </TableLayout>
            )}
        </>
    );
};

CollectRequestsIndex.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[{title: 'Collect Requests', link: null, icon: null}]}
    >
        {page}
    </AuthenticatedLayout>
);

export default CollectRequestsIndex;
