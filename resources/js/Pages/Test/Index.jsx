import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { GridActionsCellItem } from '@mui/x-data-grid';
import Filter from './Components/Filter';
import TableLayout from '@/Layouts/TableLayout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForm from '@/Components/DeleteForm';
import { useState } from 'react';
import { Button } from '@mui/material';
import { Description as ExcelIcon } from '@mui/icons-material';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader.jsx';
import AddIcon from '@mui/icons-material/Add';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { Chip } from '@mui/material';
import PreOrderSettingsDialog from './Components/PreOrderSettingsDialog';

const TestType = {
    1: 'Test',
    2: 'Service',
    3: 'Panel',
};

const Index = () => {
    const columns = [
        {
            field: 'code',
            headerName: 'Test Code',
            flex: 0.2,
        },
        {
            field: 'name',
            headerName: 'Title',
            type: 'string',
            flex: 0.4,
        },
        {
            field: 'type',
            headerName: 'Type',
            type: 'string',
            width: 100,
            flex: 0.2,
            renderCell: ({ row }) => TestType?.[row.type],
        },
        {
            field: 'test_group',
            headerName: 'Category',
            sortable: false,
            type: 'string',
            flex: 0.8,
            renderCell: ({ row }) => row.test_groups.map((item) => item.name).join(', '),
        },
        {
            field: 'status',
            headerName: 'Status',
            type: 'boolean',
            flex: 0.1,
        },
        {
            field: 'flow_id',
            headerName: 'Pre-order',
            sortable: false,
            flex: 0.25,
            renderCell: ({ row }) =>
                row.flow_id ? (
                    <Chip
                        size="small"
                        variant="outlined"
                        color="primary"
                        label={flowNames[row.flow_id] ?? 'On'}
                    />
                ) : null,
        },
        {
            field: 'acceptance_items_count',
            headerName: 'Acceptance No',
            type: 'number',
            sortable: true,
            flex: 0.2,
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            flex: 0.2,
            sortable: false,
            getActions: (params) => {
                let cols = [
                    <GridActionsCellItem
                        key="Edit"
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={editTest(params.row.id)}
                        showInMenu
                    />,
                ];
                if (canManagePreOrders)
                    cols.push(
                        <GridActionsCellItem
                            key="PreOrder"
                            icon={<AccountTreeIcon />}
                            label="Pre-order settings"
                            showInMenu
                            onClick={() => setPreOrderTest(params.row)}
                        />,
                    );
                if (!params.row.acceptance_items_count)
                    cols.push(
                        <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label="Delete"
                            showInMenu
                            onClick={deleteTest(params.row)}
                        />,
                    );
                return cols;
            },
        },
    ];
    const { tests, status, success, requestInputs, flows = [], auth } = usePage().props;
    const canManagePreOrders = auth.permissions.includes('PreOrders.Flows.Manage');
    const flowNames = Object.fromEntries(flows.map((f) => [f.id, f.name]));
    const [preOrderTest, setPreOrderTest] = useState(null);
    const [test, setTest] = useState(null);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const editTest = (id) => () => router.visit(route('tests.edit', id));
    const deleteTest = (params) => () => {
        setTest(params);
        setOpenDeleteForm(true);
    };
    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('tests.index'), {
            data: { page, filters, sort, pageSize },
            only: ['tests', 'status', 'success', 'requestInputs'],
        });
    };
    const handleCloseDeleteForm = () => {
        setTest(null);
        setOpenDeleteForm(false);
    };
    const handleDestroy = () => {
        router.post(
            route('tests.destroy', test.id),
            { _method: 'delete' },
            { onFinish: handleCloseDeleteForm },
        );
    };
    const addTest = (e) => {
        e.preventDefault();
        router.visit(route('tests.create'));
    };
    return (
        <>
            <Head title="Tests" />
            <PageHeader
                title="List Tests"
                actions={[
                    <Button
                        key="add-button"
                        onClick={addTest}
                        variant="contained"
                        color="success"
                        href={route('tests.create')}
                        startIcon={<AddIcon />}
                    >
                        Add Test
                    </Button>,

                    <Button
                        key="download-excel-list-button"
                        href={route('tests.export', requestInputs)}
                        variant="contained"
                        color="info"
                        startIcon={<ExcelIcon />}
                    >
                        Export to Excel
                    </Button>,
                ]}
            />
            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={tests}
                reload={pageReload}
                Filter={Filter}
                success={success}
                status={status}
            >
                <DeleteForm
                    title={`${test?.name} Test`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseDeleteForm}
                    openDelete={openDeleteForm}
                />
                <PreOrderSettingsDialog
                    test={preOrderTest}
                    flows={flows}
                    onClose={() => setPreOrderTest(null)}
                />
            </TableLayout>
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Tests',
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
