import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import HolidayForm from './Components/HolidayForm';

const HolidayIndex = () => {
    const { holidays, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openHolidayForm, setOpenHolidayForm] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    const findHoliday = useCallback(
        (id) => holidays.data.find((holiday) => holiday.id === id) ?? { id },
        [holidays.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedHoliday({ ...findHoliday(id), _method: 'put' });
            setOpenHolidayForm(true);
        },
        [findHoliday],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedHoliday(findHoliday(id));
            setOpenDeleteForm(true);
        },
        [findHoliday],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedHoliday(null);
        setOpenHolidayForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedHoliday?.id) return;
        return router.post(
            route('attendance.holidays.destroy', selectedHoliday.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedHoliday, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedHoliday(null);
        setOpenHolidayForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('attendance.holidays.index'), {
            data: { page, filters, sort, pageSize },
            only: ['holidays', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'date',
                headerName: 'Date',
                type: 'string',
                flex: 0.5,
                renderCell: (params) => <Typography fontWeight="medium">{params.value}</Typography>,
            },
            {
                field: 'weekday',
                headerName: 'Day',
                type: 'string',
                flex: 0.4,
                sortable: false,
            },
            {
                field: 'title',
                headerName: 'Title',
                type: 'string',
                flex: 1.5,
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
        [handleEdit, handleDelete],
    );

    return (
        <>
            <Head title="Holidays" />
            <PageHeader
                title="Holidays"
                subtitle="Company-wide days off: nobody is expected to work, whatever their shift"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                        size="medium"
                    >
                        Add Holiday
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={holidays}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete holiday: ${selectedHoliday?.title || ''}`}
                    message={`${selectedHoliday?.date || 'This date'} becomes a normal working day again.`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openHolidayForm && (
                <HolidayForm
                    open={openHolidayForm}
                    defaultValue={selectedHoliday}
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
        title: 'Holidays',
        link: null,
        icon: null,
    },
];

HolidayIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default HolidayIndex;
