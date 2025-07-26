import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import {
    Stack,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Box,
    Alert,
    Snackbar,
    CircularProgress,
    Backdrop,
} from "@mui/material";
import {
    Delete as DeleteIcon,
    ImportExport,
    Add as AddIcon,
    Visibility as ViewIcon,
} from "@mui/icons-material";
import { useState, useCallback, useEffect } from "react";
import DeleteForm from "@/Components/DeleteForm";
import { router, useForm, usePage } from "@inertiajs/react";
import PageHeader from "@/Components/PageHeader.jsx";
import Button from "@mui/material/Button";
import AddForm from "./Components/AddForm.jsx";
import { formatDate } from "@/Services/helper.js";
import EditIcon from "@mui/icons-material/Edit";

const StatementIndex = () => {
    const { statements, status, success, requestInputs, canDelete, canEdit, canAdd } = usePage().props;

    // Enhanced state management
    const [loading, setLoading] = useState(false);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStatement, setSelectedStatement] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const { data, setData, post, processing, reset, errors } = useForm({
        referrer: "",
        issue_date: "",
        invoices: []
    });

    // Handle success/error messages
    useEffect(() => {
        if (success) {
            setSnackbar({
                open: true,
                message: success,
                severity: 'success'
            });
        }
        if (status) {
            setSnackbar({
                open: true,
                message: status,
                severity: 'error'
            });
        }
    }, [success, status]);

    // Enhanced table columns with better formatting and accessibility
    const columns = [
        {
            field: 'referrer',
            headerName: 'Referrer',
            width: 220,
            sortable: true,
            renderCell: ({ value }) => (
                <Box>
                    <Typography variant="body2" fontWeight="medium">
                        {value?.fullName || "No referrer assigned"}
                    </Typography>
                    {value?.email && (
                        <Typography variant="caption" color="text.secondary">
                            {value.email}
                        </Typography>
                    )}
                </Box>
            )
        },
        {
            field: 'issue_date',
            headerName: 'Issue Date',
            valueGetter: (value) => value && new Date(value),
            width: 150,
            sortable: true,
            renderCell: ({ value }) => (
                <Tooltip title={value ? value.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'No date set'}>
                    <Typography variant="body2">
                        {value ? value.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        }) : "No date"}
                    </Typography>
                </Tooltip>
            )
        },
        {
            field: 'no',
            headerName: 'No',
            width: 130,
            sortable: true,
        },
        {
            field: 'created_at',
            headerName: 'Created',
            width: 140,
            sortable: true,
            renderCell: ({ value }) => (
                <Tooltip title={formatDate(value, 'full')}>
                    <Typography variant="body2" color="text.secondary">
                        {formatDate(value, 'short')}
                    </Typography>
                </Tooltip>
            )
        },
        {
            field: 'id',
            type: 'action',
            sortable: false,
            headerName: 'Actions',
            width: 200,
            renderCell: ({ row }) => {
                return (
                    <Stack direction="row" spacing={0.5}>
                        {/*<Tooltip title="View Statement Details">*/}
                        {/*    <IconButton*/}
                        {/*        onClick={() => viewStatement(row)}*/}
                        {/*        size="small"*/}
                        {/*        color="info"*/}
                        {/*        aria-label={`View statement for ${row.referrer?.fullName || 'unknown referrer'}`}*/}
                        {/*    >*/}
                        {/*        <ViewIcon />*/}
                        {/*    </IconButton>*/}
                        {/*</Tooltip>*/}

                        {canEdit && (
                            <Tooltip title="Edit Statement">
                                <IconButton
                                    onClick={() => editStatement(row)}
                                    size="small"
                                    color="primary"
                                    disabled={loading}
                                    aria-label={`Edit statement for ${row.referrer?.fullName || 'unknown referrer'}`}
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        <Tooltip title="Export Statement">
                            <IconButton
                                href={route("statements.export", row.id)}
                                size="small"
                                color="success"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Export statement for ${row.referrer?.fullName || 'unknown referrer'}`}
                            >
                                <ImportExport />
                            </IconButton>
                        </Tooltip>

                        {canDelete && (
                            <Tooltip title="Delete Statement">
                                <IconButton
                                    onClick={() => deleteStatement(row)}
                                    size="small"
                                    color="error"
                                    disabled={processing}
                                    aria-label={`Delete statement for ${row.referrer?.fullName || 'unknown referrer'}`}
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

    // Enhanced page reload function with better error handling
    const pageReload = useCallback((page = 1, filters = [], sort = { field: "issue_date", sort: "desc" }, pageSize = 10) => {
        setLoading(true);
        router.visit(route('statements.index'), {
            data: { page, filters, sort, pageSize },
            only: ["statements", "status", "success", "requestInputs"],
            onFinish: () => setLoading(false),
            onError: () => {
                setSnackbar({
                    open: true,
                    message: 'Failed to reload data. Please try again.',
                    severity: 'error'
                });
                setLoading(false);
            }
        });
    }, []);

    // Enhanced action handlers with better UX
    const deleteStatement = (statement) => {
        setSelectedStatement(statement);
        setData({ ...statement, _method: "delete" });
        setOpenDeleteForm(true);
    };

    const editStatement = async (statement) => {
        setSelectedStatement(statement);
        setEditMode(true);
        setLoading(true);

        try {
            await fetchData(statement.id);
            setOpenAddForm(true);
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to load statement data. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // const viewStatement = (statement) => {
    //     // You can implement a view-only modal or navigate to a detail page
    //     setSnackbar({
    //         open: true,
    //         message: `Viewing statement for ${statement.referrer?.fullName || 'unknown referrer'}`,
    //         severity: 'info'
    //     });
    // };

    const fetchData = async (id) => {
        try {
            const response = await axios.get(route("statements.show", id));
            setData(response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('Failed to fetch statement data:', error);
            throw error;
        }
    };

    const handleDestroy = () => {
        post(route('statements.destroy', data?.id), {
            onSuccess: () => {
                reset();
                setOpenDeleteForm(false);
                setSelectedStatement(null);
                setSnackbar({
                    open: true,
                    message: 'Statement deleted successfully',
                    severity: 'success'
                });
                pageReload();
            },
            onError: () => {
                setSnackbar({
                    open: true,
                    message: 'Failed to delete statement. Please try again.',
                    severity: 'error'
                });
            }
        });
    };

    // Enhanced form handlers
    const handleCloseDeleteForm = () => {
        setOpenDeleteForm(false);
        setSelectedStatement(null);
        reset();
    };

    const handleAddNew = () => {
        setEditMode(false);
        setSelectedStatement(null);
        reset();
        setOpenAddForm(true);
    };

    const handleCloseAddForm = () => {
        reset();
        setEditMode(false);
        setSelectedStatement(null);
        setOpenAddForm(false);
        pageReload();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <PageHeader
                title="Statement Management"
                subtitle={`${statements?.data?.length || 0} statements found`}
                actions={[
                    canAdd && (
                        <Button
                            onClick={handleAddNew}
                            variant="contained"
                            startIcon={<AddIcon />}
                            disabled={loading}
                            key="add-statement"
                        >
                            Add New Statement
                        </Button>
                    )
                ].filter(Boolean)}
            />

            {/* Error display for form validation */}
            {Object.keys(errors).length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Please correct the following errors:
                    <ul>
                        {Object.entries(errors).map(([field, message]) => (
                            <li key={field}>{message}</li>
                        ))}
                    </ul>
                </Alert>
            )}

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={statements}
                reload={pageReload}
                Filter={Filter}
                loading={processing || loading}
                success={success}
                status={status}
            />

            {/* Enhanced Delete Confirmation */}
            <DeleteForm
                title={`Delete Statement`}
                message={`Are you sure you want to delete the statement for ${selectedStatement?.referrer?.fullName || 'this referrer'} issued on ${selectedStatement?.issue_date || 'unknown date'}? This action cannot be undone.`}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseDeleteForm}
                openDelete={openDeleteForm}
                processing={processing}
            />

            {/* Enhanced Add/Edit Form */}
            {openAddForm&&<AddForm
                defaultValue={data}
                open={openAddForm}
                onClose={handleCloseAddForm}
                editMode={editMode}
                title={editMode ? 'Edit Statement' : 'Add New Statement'}
            />}

            {/* Loading Backdrop */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
                open={loading}
            >
                <CircularProgress color="inherit" />
                <Typography variant="h6" sx={{ ml: 2 }}>
                    {editMode ? 'Loading statement data...' : 'Processing...'}
                </Typography>
            </Backdrop>

            {/* Enhanced Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

const breadCrumbs = [
    {
        title: "Statements",
        link: null,
        icon: null
    }
];

StatementIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default StatementIndex;
