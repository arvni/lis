import React, {useMemo, useState, useCallback} from 'react';
import {usePage, router, useForm} from '@inertiajs/react';
import axios from 'axios';
import {
    Box,
    Typography,
    Chip,
    Button,
    Stack,
    Alert,
    Tooltip
} from '@mui/material';
import {
    CheckCircle,
    AttachMoney,
    Receipt,
    Edit,
    Add,
    MoneyOff
} from '@mui/icons-material';
import {GridActionsCellItem} from '@mui/x-data-grid';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader';
import Filter from './Components/Filter';
import InvoiceEditForm from '@/Pages/Invoice/Components/InvoiceEditForm';
import CreateInvoiceForm from '@/Pages/Acceptance/Components/CreateInvoiceForm';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-OM', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const FinancialCheck = () => {
    const {
        acceptances,
        status,
        errors,
        success,
        requestInputs
    } = usePage().props;

    const [processingAcceptances, setProcessingAcceptances] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [openEditForm, setOpenEditForm] = useState(false);
    const [openCreateInvoice, setOpenCreateInvoice] = useState(false);
    const [selectedAcceptance, setSelectedAcceptance] = useState(null);
    const {data, setData, reset} = useForm();

    const handleApproveFinancial = useCallback((acceptanceId) => {
        setProcessingAcceptances(prev => new Set([...prev, acceptanceId]));

        router.put(route('acceptances.approveFinancial', acceptanceId), {}, {
            onFinish: () => {
                setProcessingAcceptances(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(acceptanceId);
                    return newSet;
                });
            },
            preserveState: true,
            only: ['acceptances', 'success', 'errors']
        });
    }, []);

    const handleCreateInvoice = useCallback((acceptance) => {
        setSelectedAcceptance(acceptance);
        setOpenCreateInvoice(true);
    }, []);

    const handleViewInvoice = useCallback((invoiceId) => {
        router.visit(route('invoices.show', invoiceId));
    }, []);

    const handleEditInvoice = useCallback(async (invoiceId) => {
        try {
            setLoading(true);
            const response = await axios.get(route("api.invoices.show", invoiceId));
            setData({...response.data.data, _method: "put"});
            setOpenEditForm(true);
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setLoading(false);
        }
    }, [setData]);

    const columns = useMemo(() => [
        {
            field: 'id',
            headerName: 'Acceptance ID',
            flex: 0.5,
            renderCell: ({row}) => (
                <Typography variant="body2" fontWeight="600">
                    #{row.id}
                </Typography>
            )
        },
        {
            field: 'patient_info',
            headerName: 'Patient',
            flex: 1,
            renderCell: ({row}) => (
                <Box>
                    <Typography variant="body2" fontWeight="500" noWrap>
                        {row.patient?.fullName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        ID: {row.patient?.idNo || 'N/A'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'tests_count',
            headerName: 'Tests',
            flex: 0.6,
            renderCell: ({row}) => {
                const testCount = row.acceptance_items?.length || 0;
                return (
                    <Chip
                        label={`${testCount} Test${testCount !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'invoice_status',
            headerName: 'Invoice Status',
            flex: 1,
            sortable: false,
            renderCell: ({row}) => {
                if (row.invoice) {
                    return (
                        <Box>
                            <Chip
                                icon={<Receipt />}
                                label="Has Invoice"
                                size="small"
                                color="success"
                                variant="filled"
                                sx={{mb: 0.5}}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                                Total: {formatCurrency(row.invoice.total)}
                            </Typography>
                        </Box>
                    );
                }
                return (
                    <Chip
                        icon={<MoneyOff />}
                        label="No Invoice"
                        size="small"
                        color="warning"
                        variant="outlined"
                    />
                );
            }
        },
        {
            field: 'created_at',
            headerName: 'Created',
            type: "datetime",
            flex: 0.7,
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value}) => (
                <Typography variant="body2">
                    {formatDate(value)}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            flex: 1.5,
            getActions: (params) => {
                const actions = [];
                const isProcessing = processingAcceptances.has(params.row.id);
                const hasInvoice = !!params.row.invoice;

                if (!hasInvoice) {
                    // Create Invoice button
                    actions.push(
                        <Button
                            key={`create-invoice-${params.row.id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<Add />}
                            onClick={() => handleCreateInvoice(params.row)}
                            disabled={isProcessing}
                            sx={{mr: 1}}
                        >
                            Create Invoice
                        </Button>
                    );
                } else {
                    // View Invoice button
                    actions.push(
                        <Button
                            key={`view-invoice-${params.row.id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<Receipt />}
                            onClick={() => handleViewInvoice(params.row.invoice.id)}
                            disabled={isProcessing}
                            sx={{mr: 1}}
                        >
                            View
                        </Button>
                    );
                    // Edit Invoice button
                    actions.push(
                        <Button
                            key={`edit-invoice-${params.row.id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEditInvoice(params.row.invoice.id)}
                            disabled={isProcessing}
                            sx={{mr: 1}}
                        >
                            Edit
                        </Button>
                    );
                }

                // Approve Financial button
                actions.push(
                    <Button
                        key={`approve-${params.row.id}`}
                        variant="contained"
                        size="small"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApproveFinancial(params.row.id)}
                        disabled={isProcessing || !hasInvoice}
                    >
                        Approve
                    </Button>
                );

                return actions;
            }
        }
    ], [processingAcceptances, handleCreateInvoice, handleViewInvoice, handleEditInvoice, handleApproveFinancial]);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('acceptances.financialCheck'), {
            data: {page, filters, sort, pageSize},
            only: ["acceptances", "status", "success", "requestInputs"],
            preserveState: true
        });
    }, []);

    const handleChange = (key, value) => {
        setData(previousData => ({...previousData, [key]: value}));
    };

    const handleCancel = () => {
        setOpenEditForm(false);
        reset();
    };

    const handleCreateInvoiceClose = () => {
        setOpenCreateInvoice(false);
        setSelectedAcceptance(null);
    };

    const summaryStats = useMemo(() => {
        const total = acceptances?.data?.length || 0;
        const withInvoice = acceptances?.data?.filter(a => a.invoice).length || 0;
        const withoutInvoice = total - withInvoice;

        return {
            total,
            withInvoice,
            withoutInvoice
        };
    }, [acceptances?.data]);

    return (
        <>
            <PageHeader
                title="Financial Check"
                subtitle="Review invoices and approve acceptances for publishing"
                stats={[
                    {label: 'Total Acceptances', value: summaryStats.total, color: 'primary'},
                    {label: 'With Invoice', value: summaryStats.withInvoice, color: 'success'},
                    {label: 'Without Invoice', value: summaryStats.withoutInvoice, color: 'warning'}
                ]}
            />

            {!summaryStats.withInvoice && summaryStats.total > 0 && (
                <Alert severity="warning" sx={{mb: 2}}>
                    All acceptances need invoices before they can be approved. Create invoices to proceed.
                </Alert>
            )}

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={acceptances}
                Filter={Filter}
                errors={errors}
                loading={processingAcceptances.size > 0 || loading}
                emptyStateProps={{
                    title: "No Acceptances for Financial Check",
                    description: "Acceptances will appear here once all their reports are approved.",
                    icon: <AttachMoney sx={{fontSize: 64, color: 'text.disabled'}}/>
                }}
            >
                <InvoiceEditForm
                    invoice={data}
                    onClose={handleCancel}
                    open={openEditForm}
                />
            </TableLayout>

            {openCreateInvoice && selectedAcceptance && (
                <CreateInvoiceForm
                    open={openCreateInvoice}
                    onClose={handleCreateInvoiceClose}
                    initialData={{
                        acceptance_id: selectedAcceptance.id,
                        owner_type: "patient",
                        owner_id: selectedAcceptance.patient?.id,
                        patient: selectedAcceptance.patient,
                        referrer: selectedAcceptance.referrer
                    }}
                />
            )}
        </>
    );
};

FinancialCheck.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            {label: 'Financial Check', url: route('acceptances.financialCheck')}
        ]}
    />
);

export default FinancialCheck;

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
