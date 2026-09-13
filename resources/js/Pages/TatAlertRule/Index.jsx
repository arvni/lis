import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
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
import AddForm from './Components/AddForm';

const formatThreshold = (days) =>
    days === 0 ? 'Due today or overdue' : `≤ ${days} working day${days === 1 ? '' : 's'} left`;

const ChipList = ({ items, emptyLabel, max = 3 }) => {
    if (!items.length) {
        return <Typography color="text.secondary">{emptyLabel}</Typography>;
    }
    const hidden = items.length - max;

    return (
        <Tooltip title={items.map((item) => item.name).join(', ')}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {items.slice(0, max).map((item) => (
                    <Chip
                        key={item.key}
                        size="small"
                        variant="outlined"
                        color={item.color ?? 'default'}
                        label={item.name}
                    />
                ))}
                {hidden > 0 && <Chip size="small" label={`+${hidden}`} />}
            </Box>
        </Tooltip>
    );
};

const TatAlertRuleIndex = () => {
    const { rules, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);

    const findRule = useCallback(
        (id) => rules.data.find((rule) => rule.id === id) ?? { id },
        [rules.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedRule({ ...findRule(id), _method: 'put' });
            setOpenAddForm(true);
        },
        [findRule],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedRule(findRule(id));
            setOpenDeleteForm(true);
        },
        [findRule],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedRule(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedRule?.id) return;
        return router.post(
            route('tat-alert-rules.destroy', selectedRule.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedRule, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedRule(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('tat-alert-rules.index'), {
            data: { page, filters, sort, pageSize },
            only: ['rules', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'name',
                headerName: 'Name',
                type: 'string',
                flex: 0.8,
                renderCell: (params) => <Typography fontWeight="medium">{params.value}</Typography>,
            },
            {
                field: 'days_left',
                headerName: 'Notify When',
                type: 'number',
                flex: 0.7,
                align: 'left',
                headerAlign: 'left',
                renderCell: (params) => formatThreshold(params.value),
            },
            {
                field: 'tests',
                headerName: 'Tests',
                flex: 1.2,
                sortable: false,
                renderCell: (params) => (
                    <ChipList
                        items={(params.row.tests ?? []).map((test) => ({
                            key: test.id,
                            name: test.name,
                        }))}
                        emptyLabel="No tests"
                    />
                ),
            },
            {
                field: 'recipients',
                headerName: 'Recipients',
                flex: 1.2,
                sortable: false,
                renderCell: (params) => (
                    <ChipList
                        items={[
                            ...(params.row.roles ?? []).map((role) => ({
                                key: `role-${role.id}`,
                                name: role.name,
                                color: 'primary',
                            })),
                            ...(params.row.users ?? []).map((user) => ({
                                key: `user-${user.id}`,
                                name: user.name,
                            })),
                        ]}
                        emptyLabel="Nobody"
                    />
                ),
            },
            {
                field: 'active',
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
                            label="Paused"
                            size="small"
                            variant="outlined"
                        />
                    ),
            },
            {
                field: 'last_run_on',
                headerName: 'Last Run',
                type: 'string',
                flex: 0.4,
                renderCell: (params) => params.value || 'Never',
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
            <Head title="TAT Alerts" />
            <PageHeader
                title="TAT Alerts"
                subtitle="Daily reminders for acceptance items that are running out of turnaround time"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                        size="medium"
                    >
                        Add Alert
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={rules}
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
                    title={`Delete TAT alert: ${selectedRule?.name || ''}`}
                    message="Its recipients will stop receiving these reminders."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm open={openAddForm} defaultValue={selectedRule} onClose={handleCloseForm} />
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
        title: 'TAT Alerts',
        link: null,
        icon: null,
    },
];

TatAlertRuleIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default TatAlertRuleIndex;
