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
    Chip
} from "@mui/material";
import {
    RemoveRedEye,
    EditNote,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from "@mui/icons-material";
import {useState, useCallback} from "react";
import InvoiceEditForm from "@/Pages/Invoice/Components/InvoiceEditForm";
import Excel from "@/../images/excel.svg";
import DeleteForm from "@/Components/DeleteForm";
import {Link, router, useForm, usePage} from "@inertiajs/react";
import axios from "axios";


export const INVOICE_STATUS = {
    WAITING_FOR_PAYMENT: {
        value: "Waiting",
        color : "warning"
    },
    PAID: {value: "Paid",color :"success"},
    CREDIT_PAID: {value: "Credit Paid",color : "warning"},
    PARTIALLY_PAID: {value: "Partially Paid",color : "info"},
    CANCELED: {value: "Canceled",color: "error"}
}

const InvoiceIndex = () => {
    const {invoices, status, success, requestInputs, canDelete} = usePage().props;

    // State management
    const [loading, setLoading] = useState(false);
    const [openEditForm, setOpenEditForm] = useState(false);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const {data, setData, post, processing, reset} = useForm();

    // Format currency values consistently
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Status indicator with appropriate colors
    const StatusChip = ({status}) => {
        let stat=INVOICE_STATUS?.[Object.keys(INVOICE_STATUS).find(item=>INVOICE_STATUS?.[item].value==status)];
        return <Chip label={status} color={stat?.color||'default'} size="small"/>;
    };

    // Table columns with improved readability
    const columns = [
        {
            field: 'invoiceNo',
            headerName: 'Invoice #',
            width: 110,
            display:"flex"
        },
        {
            field: 'owner',
            headerName: 'Owner',
            width: 200,
            sortable: false,
            display:"flex",
            renderCell: ({value}) => value?.fullName || "—"
        },
        {
            field: 'name',
            headerName: 'Patient',
            type: "string",
            width: 200,
            sortable: false,
            display:"flex",
            renderCell: ({row}) => row?.patient?.fullName || "—"
        },
        {
            field: 'acceptance_items_sum_price',
            headerName: 'Amount',
            type: "number",
            width: 100,
            display:"flex",
            renderCell: ({value}) => formatCurrency(value)
        },
        {
            field: 'acceptance_items_sum_discount',
            headerName: 'Discount',
            type: "number",
            width: 100,
            display:"flex",
            renderCell: ({value}) => formatCurrency(Math.ceil(value))
        },
        {
            field: 'payments_sum_price',
            headerName: 'Paid',
            type: "number",
            width: 100,
            renderCell: ({value}) => formatCurrency(Math.floor(value))
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            width: 120,
            display:"flex",
            renderCell: ({value}) => <StatusChip status={value}/>
        },
        {
            field: 'created_at',
            headerName: 'Created Date',
            type: "date",
            display:"flex",
            valueGetter: (value) => value && new Date(value),
            width: 120,
            renderCell: ({value}) => value ? value.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : "—"
        },
        {
            field: 'id',
            type: 'action',
            sortable: false,
            headerName: 'Actions',
            display:"flex",
            renderCell: ({row}) => {
                return (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="View Invoice">
                            <IconButton
                                href={route("invoices.show", row.id)}
                                target="_blank"
                                size="small"
                                color="info"
                            >
                                <RemoveRedEye/>
                            </IconButton>
                        </Tooltip>

                        {canDelete && (<Tooltip title="Edit Invoice">
                            <IconButton
                                onClick={() => handleEdit(row.id)}
                                size="small"
                                color="primary"
                            >
                                <EditIcon/>
                            </IconButton>
                        </Tooltip>)}

                        {Boolean(row?.acceptance?.id) && (
                            <Tooltip title="Edit Acceptance">
                                <IconButton
                                    component={Link}
                                    href={route("acceptances.edit", row.acceptance.id)}
                                    size="small"
                                    color="secondary"
                                >
                                    <EditNote/>
                                </IconButton>
                            </Tooltip>
                        )}

                        {canDelete && (
                            <Tooltip title="Delete Invoice">
                                <IconButton
                                    onClick={() => deleteInvoice(row)}
                                    size="small"
                                    color="error"
                                >
                                    <DeleteIcon/>
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
        router.visit(route('invoices.index'), {
            data: {page, filters, sort, pageSize},
            only: ["invoices", "status", "success", "requestInputs"],
            preserveState: true
        });
    }, []);

    // CRUD operations
    const handleEdit = async (id) => {
        try {
            setLoading(true);
            const response = await axios.get(route("api.invoices.show", id));
            setData({...response.data.data, _method: "put"});
            setOpenEditForm(true);
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setLoading(false);
        }
    };


    const deleteInvoice = (invoice) => {
        setData({...invoice, _method: "delete"});
        setOpenDeleteForm(true);
    };

    const handleDestroy = () => {
        post(route('invoices.destroy', data?.id), {
            preserveState: false,
            onSuccess: () => {
                reset();
                setOpenDeleteForm(false);
            }
        });
    };

    // Form handlers
    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}));
    };

    const handleCancel = () => {
        setOpenEditForm(false);
        reset();
    };

    const handleCloseDeleteForm = () => {
        setOpenDeleteForm(false);
        reset();
    };

    return (
        <>
            <Box sx={{mb: 3}}>
                <Paper sx={{padding: 2}}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5" component="h1" sx={{fontWeight: 'bold'}}>
                            Invoice Management
                        </Typography>

                        <Tooltip title="Export to Excel">
                            <IconButton
                                href={route("invoices.export", requestInputs)}
                                color="success"
                                sx={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    p: 1
                                }}
                            >
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <img src={Excel} alt="Excel" width="24px"/>
                                    <Typography variant="button" sx={{display: {xs: 'none', sm: 'block'}}}>
                                        Export
                                    </Typography>
                                </Stack>
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Paper>
            </Box>

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={invoices}
                reload={pageReload}
                Filter={Filter}
                loading={processing || loading}
                success={success}
                status={status}
            >
                <InvoiceEditForm
                    invoice={data}
                    onClose={handleCancel}
                    open={openEditForm}
                />

                <DeleteForm
                    title={`Invoice No. ${data?.invoiceNo}`}
                    agreeCB={handleDestroy}
                    disAgreeCB={handleCloseDeleteForm}
                    openDelete={openDeleteForm}
                />
            </TableLayout>
        </>
    );
};

const breadCrumbs = [
    {
        title: "Invoices",
        link: null,
        icon: null
    }
];

InvoiceIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default InvoiceIndex;
