import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import AddForm from './Components/AddForm';

const DiscountPartnerIndex = () => {
    const { partners, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);

    const findPartner = useCallback(
        (id) => partners.data.find((partner) => partner.id === id) ?? { id },
        [partners.data],
    );

    const handleEdit = useCallback(
        (id) => () => {
            setSelectedPartner({ ...findPartner(id), _method: 'put' });
            setOpenAddForm(true);
        },
        [findPartner],
    );

    const handleDelete = useCallback(
        (id) => () => {
            setSelectedPartner(findPartner(id));
            setOpenDeleteForm(true);
        },
        [findPartner],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedPartner(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedPartner?.id) return;
        return router.post(
            route('discount-partners.destroy', selectedPartner.id),
            { _method: 'delete' },
            { onSuccess: handleCloseForm },
        );
    }, [selectedPartner, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedPartner(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('discount-partners.index'), {
            data: { page, filters, sort, pageSize },
            only: ['partners', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const formatContractWindow = useCallback((startsAt, endsAt) => {
        if (!startsAt && !endsAt) return 'Open ended';
        if (startsAt && !endsAt) return `From ${startsAt}`;
        if (!startsAt && endsAt) return `Until ${endsAt}`;
        return `${startsAt} — ${endsAt}`;
    }, []);

    const renderOffers = useCallback((params) => {
        const offers = params.row.offers ?? [];
        if (!offers.length) {
            return (
                <Tooltip title="Cards for this partner will not discount anything until an offer is attached">
                    <Chip size="small" color="warning" variant="outlined" label="No offer" />
                </Tooltip>
            );
        }
        return (
            <Tooltip title={offers.map((offer) => offer.name).join(', ')}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalOfferIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography>{offers.length}</Typography>
                </Box>
            </Tooltip>
        );
    }, []);

    const renderStatus = useCallback(
        (params) =>
            params.row.in_force ? (
                <Chip
                    icon={<CheckCircleIcon />}
                    label="In force"
                    size="small"
                    color="success"
                    variant="outlined"
                />
            ) : (
                <Chip
                    icon={<CancelIcon />}
                    label={params.row.active ? 'Out of window' : 'Inactive'}
                    size="small"
                    color="default"
                    variant="outlined"
                />
            ),
        [],
    );

    const columns = useMemo(
        () => [
            {
                field: 'name',
                headerName: 'Company',
                type: 'string',
                flex: 1,
                renderCell: (params) => (
                    <Tooltip title={params.row.notes || 'No notes'}>
                        <Typography fontWeight="medium">{params.value}</Typography>
                    </Tooltip>
                ),
            },
            {
                field: 'contract_no',
                headerName: 'Contract No',
                type: 'string',
                flex: 0.5,
                renderCell: (params) => params.value || '—',
            },
            {
                field: 'contract_window',
                headerName: 'Contract Window',
                type: 'string',
                flex: 0.8,
                sortable: false,
                renderCell: (params) =>
                    formatContractWindow(params.row.starts_at, params.row.ends_at),
            },
            {
                field: 'offers',
                headerName: 'Offers',
                flex: 0.4,
                sortable: false,
                renderCell: renderOffers,
            },
            {
                field: 'cards_count',
                headerName: 'Cards',
                type: 'number',
                flex: 0.3,
                renderCell: (params) => (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CardMembershipIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography>{params.value ?? 0}</Typography>
                    </Box>
                ),
            },
            {
                field: 'active',
                headerName: 'Status',
                flex: 0.4,
                align: 'center',
                headerAlign: 'center',
                renderCell: renderStatus,
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
        [handleEdit, handleDelete, formatContractWindow, renderOffers, renderStatus],
    );

    return (
        <>
            <Head title="Discount Partners" />
            <PageHeader
                title="Discount Partners"
                subtitle="Companies whose card holders receive contracted discounts"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                        size="medium"
                    >
                        Add Partner
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={partners}
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
                    title={`Delete partner: ${selectedPartner?.name || ''}`}
                    message="Existing cards stay in the system but stop discounting. This cannot be undone."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm
                    open={openAddForm}
                    defaultValue={selectedPartner}
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
        title: 'Discount Partners',
        link: null,
        icon: null,
    },
];

DiscountPartnerIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default DiscountPartnerIndex;
