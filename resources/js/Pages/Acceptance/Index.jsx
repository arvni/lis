import React, {useCallback, useMemo, useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {GridActionsCellItem} from "@mui/x-data-grid";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import DeleteForm from "@/Components/DeleteForm";
import PageHeader from "@/Components/PageHeader.jsx";
import {router, useForm, usePage} from "@inertiajs/react";
import {
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Tooltip,
    Paper,
    CircularProgress,
    Avatar,
    Badge,
    Divider,
    alpha
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Cancel as CancelIcon,
    LocalHospital as LocalHospitalIcon,
    CheckCircle as CheckCircleIcon,
    Payments as PaymentsIcon,
    CalendarToday as CalendarTodayIcon,
    QrCode as QrCodeIcon,
    Science as ScienceIcon,
    Input as InputIcon,
    Settings as SettingsIcon,
    Assignment as AssignmentIcon,
    HourglassEmpty as HourglassEmptyIcon,
    Warning as WarningIcon
} from "@mui/icons-material";
import {calculateBusinessDays, formatDate} from "@/Services/helper.js";

const Index = () => {
    const {
        post,
        setData,
        data,
        reset,
        processing
    } = useForm();

    const {
        acceptances,
        status,
        success,
        requestInputs,
        canView,
        canUpdate,
        canDelete,
        canCancel
    } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openCancelForm, setOpenCancelForm] = useState(false);

    // Format currency amounts
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'OMR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Get status info based on status text
    const getStatusInfo = (status) => {
        const statusMap = {
            'waiting for payment': {
                color: 'warning',
                icon: <HourglassEmptyIcon/>,
                label: 'Waiting for Payment'
            },
            'sampling': {
                color: 'info',
                icon: <ScienceIcon/>,
                label: 'Sampling'
            },
            'waiting for entering': {
                color: 'warning',
                icon: <InputIcon/>,
                label: 'Waiting for Entry'
            },
            'processing': {
                color: 'info',
                icon: <SettingsIcon/>,
                label: 'Processing'
            },
            'reported': {
                color: 'success',
                icon: <AssignmentIcon/>,
                label: 'Reported'
            },
            'canceled': {
                color: 'error',
                icon: <CancelIcon/>,
                label: 'Canceled'
            }
        };

        // Default case for backward compatibility
        if (!statusMap[status?.toLowerCase()]) {
            if (status === 'Completed') return {color: 'success', icon: <CheckCircleIcon/>, label: status};
            if (status === 'Pending') return {color: 'warning', icon: <HourglassEmptyIcon/>, label: status};
            if (status === 'In Progress') return {color: 'info', icon: <SettingsIcon/>, label: status};
            return {color: 'default', icon: <WarningIcon/>, label: status || 'Unknown'};
        }

        return statusMap[status.toLowerCase()];
    };

    const getBarcodeChipColor = (index) => {
        // Cycle through colors for visual distinction
        const colors = ['primary', 'secondary', 'success', 'warning', 'info'];
        return colors[index % colors.length];
    };

    const columns = useMemo(() => [
        {
            field: 'patient_fullname',
            headerName: 'Patient',
            type: "string",
            flex: 0.7,
            display: "flex",
            align: 'left',
            renderCell: ({row}) => (
                <Box display="flex" alignItems="center">
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            mr: 1.5,
                            bgcolor: (theme) => theme.palette.primary.light,
                            color: (theme) => theme.palette.primary.dark,
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {row.patient_fullname?.charAt(0) || "?"}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={600}>
                            {row.patient_fullname || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ID: {row.patient_idno || "N/A"}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'referrer_fullname',
            headerName: 'Referrer',
            type: "string",
            flex: 0.5,
            display: "flex",
            renderCell: ({row}) => (
                <Box display="flex" alignItems="center">
                    <Box>
                        <Typography variant="body2">
                            {row.referrer_fullname || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Reference Code: {row.referenceCode || "N/A"}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'barcodes',
            headerName: 'Barcodes',
            type: "string",
            sortable: false,
            flex: 0.6,
            display: "flex",
            renderCell: ({row}) => {
                const samples = row?.samples || [];

                // If no samples, show "No barcodes"
                if (samples.length === 0) {
                    return (
                        <Typography variant="caption" color="text.secondary">
                            No barcodes
                        </Typography>
                    );
                }

                // Show up to 2 barcodes and a count badge if there are more
                const displayedSamples = samples.slice(0, 2);
                const remaining = samples.length - displayedSamples.length;

                return (
                    <Stack direction="row" spacing={0.5}>
                        {displayedSamples.map((item, idx) => (
                            <Chip
                                key={idx}
                                icon={<QrCodeIcon fontSize="small"/>}
                                label={item.barcode}
                                size="small"
                                color={getBarcodeChipColor(idx)}
                                variant="outlined"
                                sx={{
                                    fontSize: '0.7rem',
                                    borderStyle: 'dashed',
                                }}
                            />
                        ))}
                        {remaining > 0 && (
                            <Tooltip title={`${remaining} more barcode${remaining > 1 ? 's' : ''}`}>
                                <Chip
                                    label={`+${remaining}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        fontSize: '0.7rem',
                                        bgcolor: 'grey.100',
                                    }}
                                />
                            </Tooltip>
                        )}
                    </Stack>
                );
            }
        },
        {
            field: 'out_patient',
            headerName: 'Patient Type',
            type: "boolean",
            flex: 0.3,
            display: "flex",
            renderCell: ({row}) => (
                <Chip
                    icon={<LocalHospitalIcon fontSize="small"/>}
                    label={row.out_patient ? "Out patient" : "In patient"}
                    color={row.out_patient ? "info" : "secondary"}
                    variant={row.out_patient ? "filled" : "filled"}
                    size="small"
                    sx={{
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        borderRadius: 1
                    }}
                />
            )
        },
        {
            field: 'remaining_amount',
            headerName: 'Remaining',
            flex: 0.3,
            display: "flex",
            type: "number",
            renderCell: ({row}) => {
                const remaining = row.payable_amount - row.payments_sum_price;
                const isPaid = remaining <= 0;

                return (
                    <Tooltip title={isPaid ? "Fully paid" : "Remaining amount to be paid"}>
                        <Chip
                            icon={<PaymentsIcon fontSize="small"/>}
                            label={formatCurrency(remaining)}
                            color={isPaid ? "success" : "warning"}
                            size="small"
                            variant={isPaid ? "outlined" : "filled"}
                            sx={{
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                borderRadius: 1
                            }}
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            flex: 0.4,
            display: "flex",
            renderCell: ({row}) => {
                const statusInfo = getStatusInfo(row.status);

                return (
                    <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                        sx={{
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            borderRadius: 1
                        }}
                    />
                );
            }
        },
        {
            field: 'report_date',
            headerName: 'Est. Report Date',
            flex: 0.4,
            display: "flex",
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value, row}) => {
                // Calculate if report date is today, in the past or future
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const reportDate = value ? calculateBusinessDays(row.created_at, value) : null;
                const reportDay = reportDate ? new Date(reportDate) : null;
                if (reportDay) reportDay.setHours(0, 0, 0, 0);

                const isToday = reportDay && reportDay.getTime() === today.getTime();
                const isPast = reportDay && reportDay.getTime() < today.getTime();

                return reportDate ? (
                    <Box display="flex" alignItems="center">
                        <Badge
                            color={isToday ? "warning" : isPast ? "error" : "success"}
                            variant="dot"
                            sx={{mr: 1}}
                        >
                            <CalendarTodayIcon fontSize="small" color="action"/>
                        </Badge>
                        <Box>
                            <Typography variant="body2" color={isPast ? "error.main" : "text.primary"}>
                                {formatDate(reportDate).split(',')[0]}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatDate(reportDate).split(',')[1]}
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">N/A</Typography>
                );
            }
        },
        {
            field: 'created_at',
            headerName: 'Registered At',
            flex: 0.4,
            type: "datetime",
            display: "flex",
            valueGetter: (value) => value && new Date(value),
            renderCell:({value})=>formatDate(value)
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            flex: 0.1,
            display: "flex",
            getActions: (params) => {
                let cols = [];

                if (canView) {
                    cols.push(
                        <GridActionsCellItem
                            icon={
                                <Tooltip title="View details">
                                    <VisibilityIcon color="info"/>
                                </Tooltip>
                            }
                            label="View"
                            onClick={show(params.row.id)}
                            showInMenu
                        />
                    );
                }

                if (canUpdate) {
                    cols.push(
                        <GridActionsCellItem
                            icon={
                                <Tooltip title="Edit acceptance">
                                    <EditIcon color="primary"/>
                                </Tooltip>
                            }
                            label="Edit"
                            onClick={edit(params.row.id)}
                            showInMenu
                        />
                    );
                }

                if (canDelete) {
                    cols.push(
                        <GridActionsCellItem
                            icon={
                                <Tooltip title="Delete acceptance">
                                    <DeleteIcon color="error"/>
                                </Tooltip>
                            }
                            label="Delete"
                            showInMenu
                            onClick={deleteAcceptance(params.row)}
                        />
                    );
                }

                if (canCancel && params.row.status?.toLowerCase() !== 'canceled') {
                    cols.push(
                        <GridActionsCellItem
                            icon={
                                <Tooltip title="Cancel acceptance">
                                    <CancelIcon color="warning"/>
                                </Tooltip>
                            }
                            label="Cancel"
                            showInMenu
                            onClick={cancelAcceptance(params.row)}
                        />
                    );
                }

                return cols;
            }
        }
    ], [canView, canUpdate, canDelete, canCancel]);

    const edit = useCallback((id) => () => {
        router.visit(route('acceptances.edit', id));
    }, []);

    const deleteAcceptance = useCallback((params) => () => {
        setData({...params, _method: "delete"});
        setOpenDeleteForm(true);
    }, [setData]);

    const cancelAcceptance = useCallback((params) => () => {
        setData({...params, _method: "put"});
        setOpenCancelForm(true);
    }, [setData]);

    const handleCloseCancelForm = useCallback(() => {
        reset();
        setOpenCancelForm(false);
    }, [reset]);

    const handleCancel = useCallback(() => {
        post(route('acceptances.cancel', data?.id), {
            onSuccess: handleCloseCancelForm,
            onError: handleCloseCancelForm
        });
    }, [post, data?.id, handleCloseCancelForm]);

    const show = useCallback((id) => () => {
        router.visit(route("acceptances.show", id));
    }, []);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route("acceptances.index"), {
            data: {page, filters, sort, pageSize},
            only: ["acceptances", "status", "requestInputs", "success"],
        });
    }, []);

    const handleCloseDeleteForm = useCallback(() => {
        setOpenDeleteForm(false);
        reset();
    }, [reset]);

    const handleDestroy = useCallback(() => {
        post(route('acceptances.destroy', data?.id), {
            onSuccess: handleCloseDeleteForm
        });
    }, [post, data?.id, handleCloseDeleteForm]);

    const getRowClassName = (params) => {
        const status = params.row.status?.toLowerCase();

        if (status === 'canceled') {
            return 'canceled-row';
        }

        if (status === 'reported') {
            return 'reported-row';
        }

        return '';
    };

    return (
        <>
            <PageHeader
                title="Acceptances List"
                icon={<LocalHospitalIcon fontSize="large" color="primary"/>}
                subtitle="Manage and view all patient acceptances"
                actions={
                    <Stack direction="row" spacing={2}>
                        <Chip
                            icon={<AssignmentIcon/>}
                            label="Reports Ready"
                            color="success"
                            variant="outlined"
                            sx={{fontWeight: 500}}
                        />
                        <Chip
                            icon={<ScienceIcon/>}
                            label="In Progress"
                            color="info"
                            variant="outlined"
                            sx={{fontWeight: 500}}
                        />
                        <Chip
                            icon={<HourglassEmptyIcon/>}
                            label="Waiting"
                            color="warning"
                            variant="outlined"
                            sx={{fontWeight: 500}}
                        />
                    </Stack>
                }
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    mb: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <TableLayout
                    defaultValues={requestInputs}
                    columns={columns}
                    data={acceptances}
                    reload={pageReload}
                    Filter={Filter}
                    loading={processing}
                    success={success}
                    status={status}
                    getRowClassName={getRowClassName}
                    customProps={{
                        sx: {
                            '& .MuiDataGrid-row:hover': {
                                bgcolor: 'action.hover',
                                transition: 'background-color 0.2s'
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: 'grey.50',
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            },
                            '& .reported-row': {
                                bgcolor: (theme) => alpha(theme.palette.success.light, 0.15),
                                '&:hover': {
                                    bgcolor: (theme) => alpha(theme.palette.success.light, 0.25),
                                }
                            },
                            '& .canceled-row': {
                                bgcolor: (theme) => alpha(theme.palette.error.light, 0.15),
                                '&:hover': {
                                    bgcolor: (theme) => alpha(theme.palette.error.light, 0.25),
                                }
                            },
                            border: 'none'
                        }
                    }}
                />
            </Paper>

            <DeleteForm
                title={`Delete Acceptance #${data?.id}`}
                agreeCB={handleDestroy}
                disAgreeCB={handleCloseDeleteForm}
                openDelete={openDeleteForm}
                message={
                    <Box>
                        <Typography variant="body1" gutterBottom>
                            Are you sure you want to delete the acceptance
                            for <strong>{data?.patient_fullname || 'this patient'}</strong>?
                        </Typography>
                        <Typography variant="body2" color="error">
                            This action cannot be undone and may affect related records.
                        </Typography>
                    </Box>
                }
            />

            <Dialog
                open={openCancelForm}
                onClose={processing ? undefined : handleCloseCancelForm}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {
                            borderRadius: 2,
                            maxWidth: 450
                        }
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: 'warning.light',
                    color: 'warning.dark',
                    py: 2,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <CancelIcon sx={{mr: 1.5}}/>
                    Cancel Acceptance #{data?.id}
                </DialogTitle>

                <DialogContent sx={{pt: 3, pb: 2}}>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <Avatar
                            sx={{
                                bgcolor: 'warning.light',
                                color: 'warning.dark',
                                mr: 2,
                                width: 40,
                                height: 40
                            }}
                        >
                            <WarningIcon/>
                        </Avatar>
                        <Typography variant="h6">
                            Confirm Cancellation
                        </Typography>
                    </Box>

                    <Divider sx={{my: 2}}/>

                    <Typography variant="body1">
                        Are you sure you want to cancel the acceptance
                        for <strong>{data?.patient_fullname || 'this patient'}</strong>?
                    </Typography>

                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: 'warning.lighter',
                            borderColor: 'warning.light'
                        }}
                    >
                        <Typography variant="body2" color="warning.dark">
                            <WarningIcon
                                fontSize="small"
                                sx={{
                                    verticalAlign: 'middle',
                                    mr: 1
                                }}
                            />
                            This action cannot be undone. All linked records will be marked as cancelled.
                        </Typography>
                    </Paper>
                </DialogContent>

                <DialogActions sx={{px: 3, pb: 3}}>
                    <Button
                        onClick={handleCloseCancelForm}
                        disabled={processing}
                        variant="outlined"
                        startIcon={<CancelIcon/>}
                        sx={{borderRadius: 1.5}}
                    >
                        No, Keep It
                    </Button>
                    <Button
                        color="warning"
                        variant="contained"
                        onClick={handleCancel}
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit"/> : <CheckCircleIcon/>}
                        sx={{borderRadius: 1.5}}
                    >
                        Yes, Cancel Acceptance
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const breadCrumbs = [
    {
        title: "Acceptances",
        link: null,
        icon: <LocalHospitalIcon fontSize="small"/>
    }
];

Index.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Index;
