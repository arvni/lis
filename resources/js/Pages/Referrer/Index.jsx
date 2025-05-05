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

const ReferrersIndex = () => {
    // Destructure props with type safety
    const { referrers, status, success, requestInputs } = usePage().props;

    // State management with explicit types
    const [referrer, setReferrer] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    // Memoized navigation handlers to prevent unnecessary re-renders
    const showReferrer = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('referrers.show', id));
    }, []);

    const editReferrer = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('referrers.edit', id));
    }, []);

    const deleteReferrer = useCallback((params) => () => {
        setReferrer(params);
        setOpenDeleteForm(true);
    }, []);

    const addReferrer = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        router.visit(route('referrers.create'));
    }, []);

    // Page reload handler with explicit parameters
    const pageReload = useCallback((
        page,
        filters,
        sort,
        pageSize
    ) => {
        router.visit(route('referrers.index'), {
            data: { page, filters, sort, pageSize },
            only: ['referrers', 'status', 'success', 'requestInputs'],
        });
    }, []);

    // Delete form handlers
    const handleCloseDeleteForm = useCallback(() => {
        setReferrer(null);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(async () => {
        if (referrer) {
            router.post(
                route('referrers.destroy', referrer.id),
                { _method: 'delete' },
                { onSuccess: handleCloseDeleteForm }
            );
        }
    }, [referrer, handleCloseDeleteForm]);

    // Columns definition with improved type safety
    const columns = useMemo(()=>[
        {
            field: 'name',
            headerName: 'Title',
            type: 'string',
            width: 200,
        },
        {
            field: 'email',
            headerName: 'Email',
            type: 'string',
            width: 200,
        },
        {
            field: 'phoneNo',
            headerName: 'Phone No',
            type: 'string',
            width: 200,
        },
        {
            field: 'acceptances_count',
            headerName: 'Acceptance No',
            type: 'number',
        },
        {
            field: 'isActive',
            headerName: 'Status',
            type: 'boolean',
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
                        href={route('referrers.show', params.row.id)}
                        onClick={showReferrer(params.row.id)}
                    />,
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit"
                        href={route('referrers.edit', params.row.id)}
                        onClick={editReferrer(params.row.id)}
                    />
                ];

                // Conditionally add delete action
                if (!params.row.acceptances_count) {
                    actions.push(
                        <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon />}
                            label="Delete"
                            onClick={deleteReferrer(params.row)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [showReferrer, editReferrer, deleteReferrer]);

    // Breadcrumbs definition
    const breadCrumbs = [
        {
            title: 'Referrers',
            link: null,
            icon: null
        }
    ];

    return (
        <>
            <PageHeader
                title="Referrers List"
                actions={
                    <Button
                        color="success"
                        href={route('referrers.create')}
                        onClick={addReferrer}
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Add Referrer
                    </Button>
                }
            />
            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={referrers}
                reload={pageReload}
                Filter={Filter}
                success={success}
                status={status}
            >
                <DeleteForm
                    title={`${referrer?.name ?? ''} Referrer`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseDeleteForm}
                    openDelete={openDeleteForm}
                />
            </TableLayout>
        </>
    );
};

// Layout wrapper
ReferrersIndex.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: 'Referrers',
                link: null,
                icon: null
            }
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default ReferrersIndex;
