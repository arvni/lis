import {useCallback, useMemo, useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {Box, Button, Chip, Tooltip, Typography} from "@mui/material";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PercentIcon from "@mui/icons-material/Percent";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import TestIcon from "@mui/icons-material/Science";
import ReferrerIcon from "@mui/icons-material/Share";

import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "./Components/Filter";
import AddForm from "./Components/AddForm";

const OffersIndex = () => {
    const { offers, status, errors, success, requestInputs } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);

    // Memoize the findOffer function to avoid recreating it on every render
    const findOffer = useCallback((id) => {
        return offers.data.find((offer) => offer.id === id) ?? { id };
    }, [offers.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditOffer = useCallback((id) => () => {
        setSelectedOffer({ ...findOffer(id), _method: "put" });
        setOpenAddForm(true);
    }, [findOffer]);

    const handleDeleteOffer = useCallback((id) => () => {
        setSelectedOffer(findOffer(id));
        setOpenDeleteForm(true);
    }, [findOffer]);

    const handleCloseForm = useCallback(() => {
        setSelectedOffer(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedOffer?.id) return;
        return router.post(
            route('offers.destroy', selectedOffer.id),
            { _method: "delete" },
            { onSuccess: handleCloseForm }
        );
    }, [selectedOffer, handleCloseForm]);

    const handleAddNew = useCallback(() => {
        setSelectedOffer(null);
        setOpenAddForm(true);
    }, []);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('offers.index'), {
            data: { page, filters, sort, pageSize },
            only: ["offers", "status", "success", "requestInputs"]
        });
    }, []);

    // Helper to format date ranges
    const formatDateRange = useCallback((startDate, endDate) => {
        if (!startDate && !endDate) return "No date limit";
        if (startDate && !endDate) return `From ${new Date(startDate).toLocaleDateString()}`;
        if (!startDate && endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
        return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }, []);

    // Helper to render formatted amount with icon
    const renderAmount = useCallback((params) => {
        const isPercentage = params.row.type === 'PERCENTAGE';
        return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isPercentage ? (
                    <PercentIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                ) : (
                    <AttachMoneyIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                )}
                <Typography>
                    {isPercentage ? `${params.row.amount}%` : `$${parseFloat(params.row.amount).toFixed(2)}`}
                </Typography>
            </Box>
        );
    }, []);

    // Helper to render status chip
    const renderStatus = useCallback((params) => {
        return params.row.active ? (
            <Chip
                icon={<CheckCircleIcon />}
                label="Active"
                size="small"
                color="success"
                variant="outlined"
            />
        ) : (
            <Chip
                icon={<CancelIcon />}
                label="Inactive"
                size="small"
                color="default"
                variant="outlined"
            />
        );
    }, []);

    // Helper to render date range with icon
    const renderDateRange = useCallback((params) => {
        const { started_at, ended_at } = params.row;
        const today = new Date();
        const start = started_at ? new Date(started_at) : null;
        const end = ended_at ? new Date(ended_at) : null;

        // Check if offer is currently active based on dates
        const isCurrentlyActive = (!start || start <= today) && (!end || end >= today);

        return (
            <Tooltip title={formatDateRange(started_at, ended_at)}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon
                        fontSize="small"
                        color={isCurrentlyActive ? "success" : "disabled"}
                        sx={{ mr: 0.5 }}
                    />
                    <Typography noWrap sx={{ maxWidth: 200 }}>
                        {formatDateRange(started_at, ended_at)}
                    </Typography>
                </Box>
            </Tooltip>
        );
    }, [formatDateRange]);

    // Helper to render relationships count
    const renderRelationships = useCallback((params) => {
        const testCount = params.row.tests?.length || 0;
        const referrerCount = params.row.referrers?.length || 0;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title={`${testCount} Tests`}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TestIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography>{testCount}</Typography>
                    </Box>
                </Tooltip>
                <Tooltip title={`${referrerCount} Referrers`}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ReferrerIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography>{referrerCount}</Typography>
                    </Box>
                </Tooltip>
            </Box>
        );
    }, []);

    // Memoize columns definition to prevent recreating on every render
    const columns = useMemo(() => [
        {
            field: 'title',
            headerName: 'Offer Title',
            type: "string",
            width: 200,
            flex: 1,
            renderCell: (params) => (
                <Tooltip title={params.row.description || "No description"}>
                    <Typography fontWeight="medium">{params.value}</Typography>
                </Tooltip>
            )
        },
        {
            field: 'amount',
            headerName: 'Amount',
            type: "number",
            flex:.2,
            renderCell: renderAmount
        },
        {
            field: 'date_range',
            headerName: 'Date Range',
            type: "string",
            flex: 1,
            sortable: false,
            renderCell: renderDateRange
        },
        {
            field: 'relationships',
            headerName: 'Relationships',
            flex:.5,
            sortable: false,
            renderCell: renderRelationships
        },
        {
            field: 'active',
            headerName: 'Status',
            type: "boolean",
            flex:.3,
            align: 'center',
            headerAlign: 'center',
            renderCell: renderStatus
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            sortable: false,
            width: 100,
            getActions: (params) => {
                return [
                    <GridActionsCellItem
                        key={`edit-${params.row.id}`}
                        icon={<EditIcon/>}
                        label="Edit"
                        onClick={handleEditOffer(params.row.id)}
                        showInMenu
                    />
                ];
            }
        }
    ], [
        handleEditOffer,
        handleDeleteOffer,
        renderAmount,
        renderStatus,
        renderDateRange,
        renderRelationships
    ]);

    return (
        <>
            <PageHeader
                title="Offers Management"
                subtitle="Create and manage discount offers for tests and referrals"
                actions={
                    <Button
                        onClick={handleAddNew}
                        startIcon={<AddIcon />}
                        color="success"
                        variant="contained"
                        size="medium"
                    >
                        Create New Offer
                    </Button>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={offers}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="comfortable"
                disableSelectionOnClick
                getRowHeight={() => 'auto'}
                sx={{
                    '& .MuiDataGrid-cell': {
                        py: 1.5
                    }
                }}
            />

            {openDeleteForm && (
                <DeleteForm
                    title={`Delete Offer: ${selectedOffer?.name || ''}`}
                    message="Are you sure you want to delete this offer? This action cannot be undone."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm
                    open={openAddForm}
                    defaultValue={selectedOffer}
                    onClose={handleCloseForm}
                />
            )}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Dashboard",
        link: route("dashboard"),
        icon: null
    },
    {
        title: "Offers",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
OffersIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default OffersIndex;
