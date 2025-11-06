import React, {useState, useCallback, useMemo} from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader';
import DeleteForm from '@/Components/DeleteForm';
import Filter from './Components/Filter';

// Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AddIcon from '@mui/icons-material/Add';

const SampleCollectorsIndex = () => {
    const { sampleCollectors, status, success, requestInputs } = usePage().props;

    const [sampleCollector, setSampleCollector] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const showSampleCollector = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('sample-collectors.show', id));
    }, []);

    const editSampleCollector = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('sample-collectors.edit', id));
    }, []);

    const deleteSampleCollector = useCallback((params) => () => {
        setSampleCollector(params);
        setOpenDeleteForm(true);
    }, []);

    const addSampleCollector = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('sample-collectors.create'));
    }, []);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('sample-collectors.index'), {
            data: { page, filters, sort, pageSize },
            only: ['sampleCollectors', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const handleCloseDeleteForm = useCallback(() => {
        setSampleCollector(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(async () => {
        if (sampleCollector) {
            router.post(
                route('sample-collectors.destroy', sampleCollector.id),
                { _method: 'delete' },
                { onSuccess: handleCloseDeleteForm }
            );
        }
    }, [sampleCollector, handleCloseDeleteForm]);

    const columns = useMemo(()=>[
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            width: 80,
        },
        {
            field: 'name',
            headerName: 'Name',
            type: 'string',
            width: 200,
        },
        {
            field: 'email',
            headerName: 'Email',
            type: 'string',
            width: 250,
        },
        {
            field: 'collect_requests_count',
            headerName: 'Collect Requests',
            type: 'number',
            width: 150,
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
                        icon={<RemoveRedEyeIcon />}
                        label="Show"
                        href={route('sample-collectors.show', params.row.id)}
                        onClick={showSampleCollector(params.row.id)}
                    />,
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit"
                        href={route('sample-collectors.edit', params.row.id)}
                        onClick={editSampleCollector(params.row.id)}
                    />
                ];

                if (!params.row.collect_requests_count) {
                    actions.push(
                        <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deleteSampleCollector(params.row)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [showSampleCollector, editSampleCollector, deleteSampleCollector]);

    return (
        <>
            <PageHeader
                title="Sample Collectors List"
                actions={
                    <Button
                        color="success"
                        href={route('sample-collectors.create')}
                        onClick={addSampleCollector}
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Add Sample Collector
                    </Button>
                }
            />
            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={sampleCollectors}
                reload={pageReload}
                Filter={Filter}
                success={success}
                status={status}
            >
                <DeleteForm
                    title={`${sampleCollector?.name ?? ''} Sample Collector`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseDeleteForm}
                    openDelete={openDeleteForm}
                />
            </TableLayout>
        </>
    );
};

SampleCollectorsIndex.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: 'Sample Collectors',
                link: null,
                icon: null
            }
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default SampleCollectorsIndex;
