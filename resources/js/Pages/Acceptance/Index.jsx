import { useCallback, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Filter from './Components/Filter';
import TableLayout from '@/Layouts/TableLayout';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from '@/Components/PageHeader.jsx';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Stack, Button, Typography, Box, Paper, alpha } from '@mui/material';
import {
    LocalHospital as LocalHospitalIcon,
    FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import AddPoolingDialog from '@/Pages/Acceptance/Components/AddPoolingDialog.jsx';
import { getRowClassName } from './Index/helpers';
import { buildColumns } from './Index/columns';
import CancelDialog from './Index/CancelDialog';

const Index = () => {
    const { post, setData, data, reset, processing } = useForm();

    const {
        acceptances,
        status,
        success,
        requestInputs,
        canUpdate,
        canDelete,
        canCancel,
        canEditInvoiced,
    } = usePage().props;

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openCancelForm, setOpenCancelForm] = useState(false);
    const [openPoolingDialog, setOpenPoolingDialog] = useState(false);
    const [poolingAcceptance, setPoolingAcceptance] = useState(null);

    const edit = useCallback(
        (id) => () => {
            router.visit(route('acceptances.edit', id));
        },
        [],
    );

    const deleteAcceptance = useCallback(
        (params) => () => {
            setData({ ...params, _method: 'delete' });
            setOpenDeleteForm(true);
        },
        [setData],
    );

    const cancelAcceptance = useCallback(
        (params) => () => {
            setData({ ...params, _method: 'put' });
            setOpenCancelForm(true);
        },
        [setData],
    );

    const handleAddPooling = useCallback((row) => {
        setPoolingAcceptance(row);
        setOpenPoolingDialog(true);
    }, []);

    const columns = useMemo(
        () =>
            buildColumns({
                canUpdate,
                canDelete,
                canCancel,
                canEditInvoiced,
                edit,
                deleteAcceptance,
                cancelAcceptance,
                onAddPooling: handleAddPooling,
            }),
        [
            canUpdate,
            canDelete,
            canCancel,
            canEditInvoiced,
            edit,
            deleteAcceptance,
            cancelAcceptance,
            handleAddPooling,
        ],
    );

    const handleCloseCancelForm = useCallback(() => {
        reset();
        setOpenCancelForm(false);
    }, [reset]);

    const handleCancel = useCallback(() => {
        post(route('acceptances.cancel', data?.id), {
            onSuccess: handleCloseCancelForm,
            onError: handleCloseCancelForm,
        });
    }, [post, data?.id, handleCloseCancelForm]);

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('acceptances.index'), {
            data: { page, filters, sort, pageSize },
            only: ['acceptances', 'status', 'requestInputs', 'success'],
            queryStringArrayFormat: 'indices',
        });
    }, []);

    const handleCloseDeleteForm = useCallback(() => {
        setOpenDeleteForm(false);
        reset();
    }, [reset]);

    const handleDestroy = useCallback(() => {
        post(route('acceptances.destroy', data?.id), {
            onSuccess: handleCloseDeleteForm,
        });
    }, [post, data?.id, handleCloseDeleteForm]);

    return (
        <>
            <Head title="Acceptances" />
            <PageHeader
                title="Acceptances List"
                icon={<LocalHospitalIcon fontSize="large" color="primary" />}
                subtitle="Manage and view all patient acceptances"
                actions={
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            color="success"
                            startIcon={<FileDownloadIcon />}
                            href={route('acceptances.export', requestInputs)}
                        >
                            Export Excel
                        </Button>
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
                    borderColor: 'divider',
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
                                transition: 'background-color 0.2s',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: 'grey.50',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                            },
                            '& .reported-row': {
                                bgcolor: (theme) => alpha(theme.palette.success.light, 0.15),
                                '&:hover': {
                                    bgcolor: (theme) => alpha(theme.palette.success.light, 0.25),
                                },
                            },
                            '& .canceled-row': {
                                bgcolor: (theme) => alpha(theme.palette.error.light, 0.15),
                                '&:hover': {
                                    bgcolor: (theme) => alpha(theme.palette.error.light, 0.25),
                                },
                            },
                            border: 'none',
                        },
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
                            Are you sure you want to delete the acceptance for{' '}
                            <strong>{data?.patient_fullname || 'this patient'}</strong>?
                        </Typography>
                        <Typography variant="body2" color="error">
                            This action cannot be undone and may affect related records.
                        </Typography>
                    </Box>
                }
            />

            <CancelDialog
                open={openCancelForm}
                onClose={handleCloseCancelForm}
                onConfirm={handleCancel}
                data={data}
                processing={processing}
            />

            <AddPoolingDialog
                open={openPoolingDialog}
                onClose={() => setOpenPoolingDialog(false)}
                acceptance={poolingAcceptance}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Acceptances',
        link: null,
        icon: <LocalHospitalIcon fontSize="small" />,
    },
];

Index.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Index;
