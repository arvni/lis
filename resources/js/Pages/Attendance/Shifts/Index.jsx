import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import ShiftForm from './Components/ShiftForm';

const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export const weeklyHours = (days) => {
    const total = days.reduce(
        (sum, day) => sum + toMinutes(day.end_time) - toMinutes(day.start_time),
        0,
    );
    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    return minutes ? `${hours} h ${minutes} m` : `${hours} h`;
};

const ShiftIndex = () => {
    const { shifts, weekdays, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openShiftForm, setOpenShiftForm] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);

    const weekdayLabels = useMemo(
        () => Object.fromEntries(weekdays.map((weekday) => [weekday.value, weekday.label])),
        [weekdays],
    );

    const findShift = useCallback(
        (id) => shifts.data.find((shift) => shift.id === id) ?? { id },
        [shifts.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedShift({ ...findShift(id), _method: 'put' });
            setOpenShiftForm(true);
        },
        [findShift],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedShift(findShift(id));
            setOpenDeleteForm(true);
        },
        [findShift],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedShift(null);
        setOpenShiftForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedShift?.id) return;
        return router.post(
            route('attendance.shifts.destroy', selectedShift.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedShift, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedShift(null);
        setOpenShiftForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('attendance.shifts.index'), {
            data: { page, filters, sort, pageSize },
            only: ['shifts', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'name',
                headerName: 'Name',
                type: 'string',
                flex: 0.8,
                renderCell: (params) => (
                    <Box>
                        <Typography sx={{ fontWeight: 500 }}>{params.value}</Typography>
                        {params.row.description && (
                            <Typography variant="body2" color="text.secondary">
                                {params.row.description}
                            </Typography>
                        )}
                    </Box>
                ),
            },
            {
                field: 'days',
                headerName: 'Weekly Hours',
                flex: 2,
                sortable: false,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(params.value ?? []).map((day) => (
                            <Chip
                                key={day.weekday}
                                size="small"
                                variant="outlined"
                                label={`${(weekdayLabels[day.weekday] ?? '').slice(0, 3)} ${day.start_time}–${day.end_time}`}
                            />
                        ))}
                    </Box>
                ),
            },
            {
                field: 'total',
                headerName: 'Per Week',
                flex: 0.4,
                sortable: false,
                renderCell: (params) => weeklyHours(params.row.days ?? []),
            },
            {
                field: 'is_active',
                headerName: 'Status',
                flex: 0.4,
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) =>
                    params.value ? (
                        <Chip
                            icon={<CheckCircleIcon />}
                            label="Active"
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                    ) : (
                        <Chip
                            icon={<PauseCircleIcon />}
                            label="Inactive"
                            size="small"
                            variant="outlined"
                        />
                    ),
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                sortable: false,
                width: 100,
                getActions: (params) => [
                    <GridActionsCellItem
                        key={`edit-${params.row.id}`}
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={handleEdit(params.row.id)}
                        showInMenu
                    />,
                    <GridActionsCellItem
                        key={`delete-${params.row.id}`}
                        icon={<DeleteIcon color="error" />}
                        label="Delete"
                        onClick={handleDelete(params.row.id)}
                        showInMenu
                    />,
                ],
            },
        ],
        [handleEdit, handleDelete, weekdayLabels],
    );

    return (
        <>
            <Head title="Shifts" />
            <PageHeader
                title="Shifts"
                subtitle="Weekly working hours that repeat every week"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                        size="medium"
                    >
                        Add Shift
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={shifts}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{ '& .MuiDataGrid-cell': { py: 1.5 } }}
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete shift: ${selectedShift?.name || ''}`}
                    message="Its weekly hours are deleted with it."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openShiftForm && (
                <ShiftForm
                    open={openShiftForm}
                    defaultValue={selectedShift}
                    weekdays={weekdays}
                    onClose={handleCloseForm}
                />
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
        title: 'Shifts',
        link: null,
        icon: null,
    },
];

ShiftIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default ShiftIndex;
