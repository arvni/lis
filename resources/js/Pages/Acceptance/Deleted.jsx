import { useCallback, useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import { Box, Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import {
    DeleteSweep as DeleteSweepIcon,
    RestoreFromTrash as RestoreFromTrashIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { formatDate } from '@/Services/helper.js';
import { getStatusInfo } from './Index/helpers';

const Deleted = () => {
    const { acceptances, requestInputs, status, success } = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    const [restoringId, setRestoringId] = useState(null);

    const restore = useCallback(
        (row) => () => {
            setRestoringId(row.id);
            router.put(
                route('acceptances.restore', row.id),
                {},
                {
                    // The row leaves this list on success, so there is nothing here
                    // to show a failure against — the snackbar is the only channel.
                    onError: (errors) =>
                        Object.values(errors ?? {})
                            .flat()
                            .forEach(
                                (message) =>
                                    message && enqueueSnackbar(message, { variant: 'error' }),
                            ),
                    onFinish: () => setRestoringId(null),
                },
            );
        },
        [enqueueSnackbar],
    );

    const columns = useMemo(
        () => [
            {
                field: 'patient_fullname',
                headerName: 'Patient',
                type: 'string',
                flex: 1.2,
                display: 'flex',
                renderCell: ({ row }) => (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">{row.patient_fullname || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                            ID: {row.patient_idno || 'N/A'}
                        </Typography>
                    </Box>
                ),
            },
            {
                field: 'referrer_fullname',
                headerName: 'Referrer',
                type: 'string',
                flex: 0.6,
                display: 'flex',
                renderCell: ({ value }) => value || 'N/A',
            },
            {
                field: 'status',
                headerName: 'Status When Deleted',
                type: 'string',
                flex: 0.6,
                display: 'flex',
                renderCell: ({ value }) => {
                    const { color, icon, label } = getStatusInfo(value);
                    return <Chip size="small" color={color} icon={icon} label={label} />;
                },
            },
            {
                field: 'acceptance_items_count',
                headerName: 'Tests',
                type: 'number',
                flex: 0.3,
                display: 'flex',
            },
            {
                field: 'deleted_at',
                headerName: 'Deleted At',
                type: 'datetime',
                flex: 0.5,
                display: 'flex',
                valueGetter: (value) => value && new Date(value),
                renderCell: ({ value }) => formatDate(value),
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                flex: 0.3,
                display: 'flex',
                getActions: (params) => [
                    <GridActionsCellItem
                        key="restore"
                        icon={
                            <Tooltip title="Restore acceptance">
                                <RestoreFromTrashIcon color="success" />
                            </Tooltip>
                        }
                        label="Restore"
                        disabled={restoringId === params.row.id}
                        onClick={restore(params.row)}
                    />,
                ],
            },
        ],
        [restore, restoringId],
    );

    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('acceptances.deleted'), {
            data: { page, filters, sort, pageSize },
            only: ['acceptances', 'status', 'requestInputs', 'success'],
            queryStringArrayFormat: 'indices',
        });
    }, []);

    return (
        <>
            <Head title="Deleted Acceptances" />
            <PageHeader
                title="Deleted Acceptances"
                icon={<DeleteSweepIcon fontSize="large" color="error" />}
                subtitle="Restore an acceptance together with its tests, and take its invoice off cancelled"
                actions={
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Button
                            component={Link}
                            href={route('acceptances.index')}
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                        >
                            Back to Acceptances
                        </Button>
                    </Stack>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={acceptances}
                reload={pageReload}
                loading={Boolean(restoringId)}
                success={success}
                status={status}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Acceptances',
        link: route('acceptances.index'),
        icon: null,
    },
    {
        title: 'Deleted',
        link: null,
        icon: <DeleteSweepIcon fontSize="small" />,
    },
];

Deleted.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Deleted;
