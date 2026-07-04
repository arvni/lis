import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Filter from './Components/Filter';
import TableLayout from '@/Layouts/TableLayout';
import DeleteForm from '@/Components/DeleteForm';
import React, { useCallback, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader.jsx';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MergeIcon from '@mui/icons-material/Merge';
import StatsDashboard from './Index/StatsDashboard';
import { buildColumns } from './Index/columns';

const Index = () => {
    const { post, setData, data, reset, processing } = useForm();
    const { patients, status, success, requestInputs, stats, canDelete, canMerge } =
        usePage().props;
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(false);

    const showPatient = useCallback(
        (id) => (e) => {
            e.preventDefault();
            router.visit(route('patients.show', id));
        },
        [],
    );
    const deletePatient = useCallback(
        (params) => () => {
            setData({ _method: 'delete', ...params });
            setOpenDeleteForm(true);
        },
        [setData],
    );

    const pageReload = useCallback(
        (page, filters, sort, pageSize) =>
            router.visit(route('patients.index'), {
                data: {
                    page,
                    filters,
                    sort,
                    pageSize,
                },
                only: ['patients', 'status', 'success', 'requestInputs'],
            }),
        [],
    );

    const handleCloseDeleteForm = useCallback(() => {
        reset();
        setOpenDeleteForm(false);
    }, [reset]);

    const handleDestroy = useCallback(
        () =>
            post(route('patients.destroy', data.id), {
                onSuccess: handleCloseDeleteForm,
            }),
        [data.id, post, handleCloseDeleteForm],
    );

    const addPatient = useCallback(() => router.visit(route('patients.create')), []);

    const mergePatients = useCallback(() => router.visit(route('patients.merge.create')), []);

    const toggleStats = useCallback(() => {
        setStatsExpanded((prev) => !prev);
    }, []);

    const columns = useMemo(
        () => buildColumns({ showPatient, deletePatient, canDelete }),
        [showPatient, deletePatient, canDelete],
    );

    return (
        <>
            <Head title="Patients" />
            <PageHeader
                title="Patients"
                description="Manage patient records and view statistics"
                actions={[
                    canMerge && (
                        <Button
                            onClick={mergePatients}
                            key="merge-button"
                            variant="outlined"
                            color="primary"
                            startIcon={<MergeIcon />}
                        >
                            Merge Patients
                        </Button>
                    ),
                    <Button
                        onClick={addPatient}
                        key="add-button"
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon />}
                    >
                        Add Patient
                    </Button>,
                ]}
            />

            <StatsDashboard stats={stats} expanded={statsExpanded} onToggle={toggleStats} />

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={patients}
                reload={pageReload}
                Filter={Filter}
                loading={processing}
                success={success}
                status={status}
            >
                <DeleteForm
                    title={`Delete ${data?.fullName}`}
                    message={`Are you sure you want to delete this patient? This action cannot be undone.`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseDeleteForm}
                    openDelete={openDeleteForm}
                />
            </TableLayout>
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Patients',
        link: null,
        icon: null,
    },
];

Index.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Index;
