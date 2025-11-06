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
import {formatDate} from "@/Services/helper.js";

const CollectRequestsIndex = () => {
    const { collectRequests, status, success, requestInputs } = usePage().props;

    const [collectRequest, setCollectRequest] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

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
            data: { page, filters, sort, pageSize },
            only: ['collectRequests', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const handleCloseDeleteForm = useCallback(() => {
        setCollectRequest(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(async () => {
        if (collectRequest) {
            router.post(
                route('collect-requests.destroy', collectRequest.id),
                { _method: 'delete' },
                { onSuccess: handleCloseDeleteForm }
            );
        }
    }, [collectRequest, handleCloseDeleteForm]);

    const columns = useMemo(()=>[
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            width: 80,
        },
        {
            field: 'sample_collector',
            headerName: 'Sample Collector',
            type: 'string',
            width: 200,
            renderCell: ({row}) => row.sample_collector?.name || 'N/A'
        },
        {
            field: 'referrer',
            headerName: 'Referrer',
            type: 'string',
            width: 200,
            renderCell: ({row}) => row.referrer?.name || 'N/A'
        },
        {
            field: 'referrer_orders_count',
            headerName: 'Orders Count',
            type: 'number',
            width: 150,
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            width: 180,
            renderCell:(params)=>formatDate(params.value),
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
                        href={route('collect-requests.show', params.row.id)}
                        onClick={showCollectRequest(params.row.id)}
                    />,
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit"
                        href={route('collect-requests.edit', params.row.id)}
                        onClick={editCollectRequest(params.row.id)}
                    />
                ];

                if (!params.row.referrer_orders_count) {
                    actions.push(
                        <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon />}
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
                title="Collect Requests List"
                actions={
                    <Button
                        color="success"
                        href={route('collect-requests.create')}
                        onClick={addCollectRequest}
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Add Collect Request
                    </Button>
                }
            />
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
        </>
    );
};

CollectRequestsIndex.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: 'Collect Requests',
                link: null,
                icon: null
            }
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default CollectRequestsIndex;
