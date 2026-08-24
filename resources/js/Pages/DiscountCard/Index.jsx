import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Button, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import PrintIcon from '@mui/icons-material/Print';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import IssueBatchForm from './Components/IssueBatchForm';
import EditCardForm from './Components/EditCardForm';
import StatusChip from './Components/StatusChip';

const DiscountCardIndex = () => {
    const { cards, status, errors, success, requestInputs, statuses, canIssue } = usePage().props;

    const [openIssueForm, setOpenIssueForm] = useState(false);
    const [openRevokeConfirm, setOpenRevokeConfirm] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    const findCard = useCallback(
        (id) => cards.data.find((card) => card.id === id) ?? { id },
        [cards.data],
    );

    const handleEdit = useCallback((id) => () => setSelectedCard(findCard(id)), [findCard]);

    const handleRevoke = useCallback(
        (id) => () => {
            setSelectedCard(findCard(id));
            setOpenRevokeConfirm(true);
        },
        [findCard],
    );

    const handleCloseForm = useCallback(() => {
        setSelectedCard(null);
        setOpenIssueForm(false);
        setOpenRevokeConfirm(false);
    }, []);

    const handleConfirmRevoke = useCallback(() => {
        if (!selectedCard?.id) return;
        return router.post(
            route('discountCards.revoke', selectedCard.id),
            {},
            { onSuccess: handleCloseForm, preserveScroll: true },
        );
    }, [selectedCard, handleCloseForm]);

    const handlePrintBatch = useCallback(
        (id) => () => {
            const card = findCard(id);
            if (!card?.batch?.id) return;
            router.visit(route('discountCardBatches.print', card.batch.id));
        },
        [findCard],
    );

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('discount-cards.index'), {
            data: { page, filters, sort, pageSize },
            only: ['cards', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const renderUsage = useCallback((params) => {
        const { used_count: used, usage_limit: limit } = params.row;
        const label = limit ? `${used} / ${limit}` : `${used} / ∞`;
        return (
            <Tooltip title={limit ? 'Uses consumed of the card limit' : 'Unlimited uses'}>
                <Typography>{label}</Typography>
            </Tooltip>
        );
    }, []);

    const columns = useMemo(
        () => [
            {
                field: 'number',
                headerName: 'Card Number',
                type: 'string',
                flex: 0.8,
                renderCell: (params) => (
                    <Typography fontFamily="monospace" fontWeight="medium">
                        {params.value}
                    </Typography>
                ),
            },
            {
                field: 'partner',
                headerName: 'Partner',
                type: 'string',
                flex: 0.8,
                sortable: false,
                renderCell: (params) => params.row.partner?.name ?? '—',
            },
            {
                field: 'status',
                headerName: 'Status',
                flex: 0.5,
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) => (
                    <StatusChip status={params.value} expired={params.row.expired} />
                ),
            },
            {
                field: 'used_count',
                headerName: 'Usage',
                type: 'number',
                flex: 0.4,
                renderCell: renderUsage,
            },
            {
                field: 'expires_at',
                headerName: 'Expires',
                type: 'string',
                flex: 0.4,
                renderCell: (params) => params.value ?? 'Never',
            },
            {
                field: 'issued_at',
                headerName: 'Issued',
                type: 'string',
                flex: 0.5,
                renderCell: (params) => params.value ?? '—',
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
                        key={`print-${params.row.id}`}
                        icon={<PrintIcon />}
                        label="Print batch"
                        onClick={handlePrintBatch(params.row.id)}
                        showInMenu
                    />,
                    <GridActionsCellItem
                        key={`revoke-${params.row.id}`}
                        icon={<BlockIcon color="error" />}
                        label="Revoke"
                        onClick={handleRevoke(params.row.id)}
                        showInMenu
                    />,
                ],
            },
        ],
        [handleEdit, handleRevoke, handlePrintBatch, renderUsage],
    );

    return (
        <>
            <Head title="Discount Cards" />
            <PageHeader
                title="Discount Cards"
                subtitle="Bearer cards issued against partner contracts"
                actions={
                    canIssue ? (
                        <Button
                            onClick={() => setOpenIssueForm(true)}
                            startIcon={<AddIcon />}
                            color="success"
                            variant="contained"
                            size="medium"
                        >
                            Issue Cards
                        </Button>
                    ) : null
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={cards}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{ '& .MuiDataGrid-cell': { py: 1.5 } }}
            />

            {openIssueForm && <IssueBatchForm open={openIssueForm} onClose={handleCloseForm} />}

            {selectedCard && !openRevokeConfirm && (
                <EditCardForm
                    open
                    card={selectedCard}
                    statuses={statuses ?? []}
                    onClose={handleCloseForm}
                />
            )}

            {openRevokeConfirm && (
                <DeleteForm
                    title={`Revoke card ${selectedCard?.number || ''}`}
                    message="The card stops working immediately and permanently. Other cards in its batch are unaffected."
                    agreeCB={handleConfirmRevoke}
                    disAgreeCB={handleCloseForm}
                    openDelete={openRevokeConfirm}
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
        title: 'Discount Cards',
        link: null,
        icon: null,
    },
];

DiscountCardIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default DiscountCardIndex;
