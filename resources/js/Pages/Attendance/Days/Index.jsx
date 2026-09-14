import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import CorrectionForm from './Components/CorrectionForm';

const CORRECT = 'Attendance.Daily Attendance.Correct Attendance';
const EXPORT = 'Attendance.Daily Attendance.Export Attendance';

export const STATUS_COLORS = {
    PRESENT: 'success',
    INCOMPLETE: 'warning',
    ABSENT: 'error',
    OFF: 'default',
    HOLIDAY: 'info',
    LEAVE: 'secondary',
};

export const formatMinutes = (minutes) => {
    if (!minutes) return '—';
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} m`;

    return rest ? `${hours} h ${rest} m` : `${hours} h`;
};

export const StatusCell = ({ day }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip size="small" color={STATUS_COLORS[day.status] ?? 'default'} label={day.status_label} />
        {day.is_manual && (
            <Tooltip
                title={`Corrected by ${day.corrected_by ?? 'someone'} on ${day.corrected_at}: ${day.note ?? ''}`}
            >
                <Chip size="small" variant="outlined" label="Corrected" />
            </Tooltip>
        )}
    </Box>
);

const MinutesCell = ({ minutes, highlight = false }) => (
    <Typography
        variant="body2"
        sx={{ color: highlight && minutes ? 'warning.main' : 'text.primary' }}
    >
        {formatMinutes(minutes)}
    </Typography>
);

const DayIndex = () => {
    const { days, status, errors, success, requestInputs, auth } = usePage().props;
    const permissions = useMemo(() => auth?.permissions ?? [], [auth?.permissions]);
    const canCorrect = permissions.includes(CORRECT);
    const canExport = permissions.includes(EXPORT);

    const [selectedDay, setSelectedDay] = useState(null);

    const findDay = useCallback(
        (id) => days.data.find((day) => day.id === id) ?? null,
        [days.data],
    );

    const handleCorrect = useCallback((id) => () => setSelectedDay(findDay(id)), [findDay]);

    const handleReset = useCallback(
        (id) => () =>
            router.put(route('attendance.days.reset', id), {}, { preserveScroll: true }),
        [],
    );

    const handleCloseForm = useCallback(() => setSelectedDay(null), []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('attendance.days.index'), {
            data: { page, filters, sort, pageSize },
            only: ['days', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'date',
                headerName: 'Date',
                flex: 0.6,
                renderCell: (params) => (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {params.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {params.row.weekday}
                        </Typography>
                    </Box>
                ),
            },
            {
                field: 'user',
                headerName: 'User',
                flex: 0.9,
                sortable: false,
                renderCell: (params) => params.value?.name,
            },
            {
                field: 'shift',
                headerName: 'Scheduled',
                flex: 0.8,
                sortable: false,
                renderCell: (params) =>
                    params.row.scheduled_start ? (
                        <Box>
                            <Typography variant="body2">
                                {params.row.scheduled_start}–{params.row.scheduled_end}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {params.value?.name}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {params.value?.name ?? 'No shift'}
                        </Typography>
                    ),
            },
            {
                field: 'check_in',
                headerName: 'In',
                flex: 0.4,
                sortable: false,
                renderCell: (params) => params.value ?? '—',
            },
            {
                field: 'check_out',
                headerName: 'Out',
                flex: 0.4,
                sortable: false,
                renderCell: (params) => params.value ?? '—',
            },
            {
                field: 'status',
                headerName: 'Status',
                flex: 0.9,
                renderCell: (params) => <StatusCell day={params.row} />,
            },
            {
                field: 'late_minutes',
                headerName: 'Late',
                flex: 0.4,
                renderCell: (params) => <MinutesCell minutes={params.value} highlight />,
            },
            {
                field: 'early_leave_minutes',
                headerName: 'Left Early',
                flex: 0.45,
                renderCell: (params) => <MinutesCell minutes={params.value} highlight />,
            },
            {
                field: 'worked_minutes',
                headerName: 'Worked',
                flex: 0.5,
                renderCell: (params) => <MinutesCell minutes={params.value} />,
            },
            {
                field: 'leave_minutes',
                headerName: 'On Leave',
                flex: 0.5,
                renderCell: (params) => <MinutesCell minutes={params.value} />,
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                sortable: false,
                width: 90,
                getActions: (params) => {
                    if (!canCorrect) return [];
                    const actions = [
                        <GridActionsCellItem
                            key={`correct-${params.row.id}`}
                            icon={<EditIcon />}
                            label="Correct"
                            onClick={handleCorrect(params.row.id)}
                            showInMenu
                        />,
                    ];
                    if (params.row.is_manual) {
                        actions.push(
                            <GridActionsCellItem
                                key={`reset-${params.row.id}`}
                                icon={<RestartAltIcon />}
                                label="Recalculate from punches"
                                onClick={handleReset(params.row.id)}
                                showInMenu
                            />,
                        );
                    }

                    return actions;
                },
            },
        ],
        [canCorrect, handleCorrect, handleReset],
    );

    return (
        <>
            <Head title="Daily Attendance" />
            <PageHeader
                title="Daily Attendance"
                subtitle="One row per person per day, built from door punches every 10 minutes"
                actions={
                    canExport && (
                        <Button
                            startIcon={<DownloadIcon />}
                            variant="outlined"
                            color="success"
                            component="a"
                            href={route('attendance.days.export', requestInputs)}
                        >
                            Export
                        </Button>
                    )
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={days}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
            />

            {selectedDay && (
                <CorrectionForm open day={selectedDay} onClose={handleCloseForm} />
            )}
        </>
    );
};

const breadcrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Daily Attendance',
        link: null,
        icon: null,
    },
];

DayIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default DayIndex;
