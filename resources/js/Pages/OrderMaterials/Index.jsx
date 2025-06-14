import {useCallback, useMemo, useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {GridActionsCellItem} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader.jsx";
import Filter from "./Components/Filter";
import AddForm from "./Components/Form";
import PrintIcon from "@mui/icons-material/Print";

const OrderMaterialsIndex = () => {
    const {orderMaterials, status, errors, success, requestInputs} = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [selectedOrderMaterial, setSelectedOrderMaterial] = useState(null);

    const [loading, setLoading] = useState(false);

    // Memoize the findOrderMaterial function to avoid recreating it on every render
    const findOrderMaterial = useCallback((id) => {
        return orderMaterials.data.find((orderOrderMaterial) => orderOrderMaterial.id === id) ?? {id};
    }, [orderMaterials.data]);

    // Create handlers with useCallback to prevent unnecessary re-renders
    const handleEditOrderMaterial = useCallback((id) => () => {
        setLoading(true);
        axios.get(route("api.orderMaterials.show", id)).then(({data}) => {
            setSelectedOrderMaterial({...data.data, _method: "put"});
        }).then(() => {
            setLoading(false);
            setOpenAddForm(true);
        })
    }, []);

    const handleDeleteOrderMaterial = useCallback((id) => () => {
        setSelectedOrderMaterial(findOrderMaterial(id));
        setOpenDeleteForm(true);
    }, [findOrderMaterial]);

    const handleCloseForm = useCallback(() => {
        setSelectedOrderMaterial(null);
        setOpenAddForm(false);
        setOpenDeleteForm(false);
    }, []);

    const handleDestroy = useCallback(() => {
        if (!selectedOrderMaterial?.id) return;
        return router.post(
            route('orderMaterials.destroy', selectedOrderMaterial.id),
            {_method: "delete"},
            {onSuccess: handleCloseForm}
        );
    }, [selectedOrderMaterial, handleCloseForm]);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('orderMaterials.index'), {
            data: {page, filters, sort, pageSize},
            only: ["orderMaterials", "status", "success", "requestInputs"]
        });
    }, []);

    // Memoize columns definition to prevent recreating on every render
    const columns = useMemo(() => [
        {
            field: 'referrer_fullname',
            headerName: 'Referrer',
            type: "string",
            display: "flex",
            width: 200,
            flex: 1,
        },
        {
            field: 'sample_type_name',
            headerName: 'Sample Type',
            type: "string",
            width: 200,
            display: "flex",
            flex: 1,
        },
        {
            field: 'amount',
            headerName: 'Quantity',
            type: "string",
            width: 50,
            display: "flex",
            flex: 0.2,
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            width: 100,
            display: "flex",
            flex: .5,
        },
        {
            field: 'created_at',
            headerName: 'Ordered At',
            type: "datetime",
            width: 100,
            display: "flex",
            flex: .5,
            valueGetter: (value) => new Date(value),
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            sortable: false,
            width: 100,
            display: "flex",
            getActions: (params) => {
                return [
                    params.row.status === "PROCESSED" ? <GridActionsCellItem
                        key={`print-${params.row.id}`}
                        icon={<PrintIcon/>}
                        label="Print"
                        href={route("orderMaterials.print", params.row.id)}
                        target="_blank"
                    /> : <GridActionsCellItem
                        key={`edit-${params.row.id}`}
                        icon={<EditIcon/>}
                        label="Edit"
                        onClick={handleEditOrderMaterial(params.row.id)}
                    />
                ];
            }
        }
    ], [
        handleEditOrderMaterial,
        handleDeleteOrderMaterial,
    ]);
    return (
        <>
            <PageHeader
                title="Order Materials Management"
                subtitle="Create and manage discount order materials for tests and referrals"
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={orderMaterials}
                Filter={Filter}
                errors={errors}
                autoHeight
                loading={loading}
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
                    title={`Delete OrderMaterial: ${selectedOrderMaterial?.name || ''}`}
                    message="Are you sure you want to delete this order material? This action cannot be undone."
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseForm}
                    openDelete={openDeleteForm}
                />
            )}

            {openAddForm && (
                <AddForm
                    open={openAddForm}
                    defaultValue={selectedOrderMaterial}
                    onClose={handleCloseForm}
                />
            )}
        </>
    );
};

// Define breadcrumbs outside the component
const breadcrumbs = [
    {
        title: "Order Materials",
        link: null,
        icon: null
    }
];

// Use a more descriptive name for the layout function
OrderMaterialsIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default OrderMaterialsIndex;
