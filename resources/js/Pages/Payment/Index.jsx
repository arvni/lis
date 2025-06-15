import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import {
    Stack,
    IconButton,
    Box,
    Paper,
    Typography,
    Tooltip,
} from "@mui/material";
import {
    Delete as DeleteIcon,
} from "@mui/icons-material";
import { useState, useCallback } from "react";
import DeleteForm from "@/Components/DeleteForm";
import { router, useForm, usePage } from "@inertiajs/react";

const PaymentIndex = () => {
    const { payments, status, success, requestInputs, canDelete } = usePage().props;

    // State management
    const [loading, setLoading] = useState(false);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const { data, setData, post, processing, reset } = useForm();

    // Format currency values consistently
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Table columns with improved readability
    const columns = [
        {
            field: 'payer',
            headerName: 'Payer',
            width: 200,
            sortable: false,
            renderCell: ({value}) => value?.fullName || "—"
        },
        {
            field: 'cashier',
            headerName: 'Cashier',
            width: 200,
            sortable: false,
            renderCell: ({value}) => value?.name || "—"
        },
        {
            field: 'price',
            headerName: 'Paid',
            type: "number",
            width: 100,
            renderCell: ({value}) => formatCurrency(Math.floor(value))
        },
        {
            field: 'paymentMethod',
            headerName: 'Payment Method',
            type: "string",
            width: 120,
        },
        {
            field: 'created_at',
            headerName: 'Created Date',
            type: "date",
            valueGetter: (value) => value && new Date(value),
            width: 170,
            renderCell: ({value}) => value ? value.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : "—"
        },
        {
            field: 'id',
            type:'action',
            sortable: false,
            headerName: 'Actions',
            width: 180,
            renderCell: ({row}) => {
                return (
                    <Stack direction="row" spacing={1}>
                        {canDelete && (
                            <Tooltip title="Delete Payment">
                                <IconButton
                                    onClick={() => deletePayment(row)}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                );
            }
        }
    ];

    // Page reload function
    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('payments.index'), {
            data: { page, filters, sort, pageSize },
            only: ["payments", "status", "success", "requestInputs"],
            preserveState: true
        });
    }, []);

    const deletePayment = (payments) => {
        setData({...payments, _method: "delete"});
        setOpenDeleteForm(true);
    };

    const handleDestroy = () => {
        post(route('payments.destroy', data?.id), {
            preserveState: false,
            onSuccess: () => {
                reset();
                setOpenDeleteForm(false);
            }
        });
    };

    // Form handlers
    const handleCloseDeleteForm = () => {
        setOpenDeleteForm(false);
        reset();
    };

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Paper sx={{ padding: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
                            Payment Management
                        </Typography>
                    </Stack>
                </Paper>
            </Box>

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={payments}
                reload={pageReload}
                Filter={Filter}
                loading={processing}
                success={success}
                status={status}
            />
            <DeleteForm
                title={`Payment ${data?.payer?.fullName}  ${data?.price} `}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseDeleteForm}
                openDelete={openDeleteForm}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: "Payments",
        link: null,
        icon: null
    }
];

PaymentIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default PaymentIndex;
