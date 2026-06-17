import React, { useEffect, useState, useMemo } from 'react';
import { RemoveRedEye } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Tab, Box, Chip } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

// Layouts and Components
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ReferrerInfo from './Components/ReferrerInfo';
import LoadMore from '@/Components/LoadMore';

import ReferrerTestsTab from './Components/ReferrerTestsTab';
import { Head } from '@inertiajs/react';

const Show = ({ referrer, success, status, errors }) => {
    const { enqueueSnackbar } = useSnackbar();
    const [activeTab, setActiveTab] = useState('1');

    const referrerOrderColumns = useMemo(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                width: 70,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'order_id',
                headerName: 'Order ID',
                type: 'string',
                width: 150,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'created_at',
                headerName: 'Created At',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ row }) =>
                    row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
            },
            {
                field: 'id_action',
                headerName: 'Action',
                type: 'string',
                width: 100,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ row }) => (
                    <a
                        href={route('referrer-orders.show', row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <RemoveRedEye />
                    </a>
                ),
            },
        ],
        [],
    );

    const collectRequestColumns = useMemo(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                width: 70,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'sample_collector',
                headerName: 'Collector',
                type: 'string',
                width: 160,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ row }) => row.sample_collector?.name || '—',
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                width: 180,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ row }) => (
                    <Chip
                        label={row.status ? row.status.replace(/_/g, ' ') : '—'}
                        size="small"
                        variant="outlined"
                    />
                ),
            },
            {
                field: 'barcode',
                headerName: 'Barcode',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'preferred_date',
                headerName: 'Preferred Date',
                type: 'string',
                width: 140,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ row }) =>
                    row.preferred_date ? new Date(row.preferred_date).toLocaleDateString() : '—',
            },
            {
                field: 'collect_action',
                headerName: 'Action',
                type: 'string',
                width: 100,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ row }) => (
                    <a
                        href={route('collect-requests.show', row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <RemoveRedEye />
                    </a>
                ),
            },
        ],
        [],
    );

    const orderMaterialColumns = useMemo(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                width: 70,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'sample_type',
                headerName: 'Sample Type',
                type: 'string',
                width: 160,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ row }) => row.sample_type?.name || '—',
            },
            {
                field: 'amount',
                headerName: 'Quantity',
                type: 'number',
                width: 100,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ row }) => (
                    <Chip
                        label={row.status || '—'}
                        size="small"
                        color={row.status === 'PROCESSED' ? 'success' : 'warning'}
                        variant="outlined"
                    />
                ),
            },
            {
                field: 'created_at',
                headerName: 'Ordered At',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ row }) =>
                    row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
            },
        ],
        [],
    );

    const invoiceColumns = useMemo(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                width: 70,
                align: 'center',
                headerAlign: 'center',
            },
            {
                field: 'total_price',
                headerName: 'Amount',
                type: 'number',
                width: 120,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ value }) => (value != null ? Number(value).toLocaleString() : '—'),
            },
            {
                field: 'discount',
                headerName: 'Discount',
                type: 'number',
                width: 110,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ value }) => (value != null ? Number(value).toLocaleString() : '—'),
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                width: 160,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ value }) => (
                    <Chip label={value || '—'} size="small" variant="outlined" />
                ),
            },
            {
                field: 'created_at',
                headerName: 'Created At',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
                renderCell: ({ value }) => (value ? new Date(value).toLocaleDateString() : '—'),
            },
            {
                field: 'invoice_action',
                headerName: 'Action',
                type: 'string',
                width: 90,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ row }) => (
                    <a
                        href={route('invoices.show', row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <RemoveRedEye />
                    </a>
                ),
            },
        ],
        [],
    );

    const acceptanceColumns = useMemo(
        () => [
            {
                field: 'id',
                headerName: 'ID',
                type: 'number',
                width: 70,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
            },
            {
                field: 'referenceCode',
                headerName: 'Reference',
                type: 'string',
                width: 160,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                width: 180,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ value }) => (
                    <Chip label={value || '—'} size="small" variant="outlined" />
                ),
            },
            {
                field: 'created_at',
                headerName: 'Created At',
                type: 'string',
                width: 130,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ value }) => (value ? new Date(value).toLocaleDateString() : '—'),
            },
            {
                field: 'acceptance_action',
                headerName: 'Action',
                type: 'string',
                width: 90,
                align: 'center',
                headerAlign: 'center',
                sortable: false,
                renderCell: ({ row }) => (
                    <a
                        href={route('acceptances.show', row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <RemoveRedEye />
                    </a>
                ),
            },
        ],
        [],
    );

    // Handle notifications for success and errors
    useEffect(() => {
        if (success) {
            enqueueSnackbar(status || 'Success', {
                variant: 'success',
            });
        }

        if (errors) {
            Object.entries(errors).forEach(([_, message]) =>
                enqueueSnackbar(message, {
                    variant: 'error',
                }),
            );
        }
    }, [success, errors, enqueueSnackbar, status]);

    // Tab change handler
    const handleTabChange = (_event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <div>
            <Head title={`Referrer: ${referrer.fullName}`} />
            <ReferrerInfo referrer={referrer} editable defaultExpanded />
            <TabContext value={activeTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Acceptances" value="1" />
                        <Tab label="Invoices" value="2" />
                        <Tab label="Test Prices" value="3" />
                        <Tab label="Referrer Orders" value="4" />
                        <Tab label="Collect Requests" value="5" />
                        <Tab label="Order Materials" value="6" />
                    </TabList>
                </Box>
                <TabPanel value="1">
                    <LoadMore
                        title="Acceptances"
                        items={referrer.acceptances}
                        columns={acceptanceColumns}
                        defaultExpanded
                        loadMoreLink={route('acceptances.index', { referrer_id: referrer.id })}
                    />
                </TabPanel>
                <TabPanel value="2">
                    <LoadMore
                        title="Invoices"
                        items={referrer.invoices}
                        columns={invoiceColumns}
                        defaultExpanded
                        loadMoreLink={route('invoices.index', {
                            id: referrer.id,
                            owner: 'Referrer',
                        })}
                    />
                </TabPanel>
                <TabPanel value="3">
                    <ReferrerTestsTab referrer={referrer} />
                </TabPanel>
                <TabPanel value="4">
                    <LoadMore
                        title="Referrer Orders"
                        items={referrer.referrer_orders ?? []}
                        columns={referrerOrderColumns}
                        defaultExpanded
                        loadMoreLink={route('referrer-orders.index', {
                            filters: { referrer_id: referrer.id },
                        })}
                    />
                </TabPanel>
                <TabPanel value="5">
                    <LoadMore
                        title="Collect Requests"
                        items={referrer.collect_requests ?? []}
                        columns={collectRequestColumns}
                        defaultExpanded
                        loadMoreLink={route('collect-requests.index', {
                            filters: { referrer_id: referrer.id },
                        })}
                    />
                </TabPanel>
                <TabPanel value="6">
                    <LoadMore
                        title="Order Materials"
                        items={referrer.order_materials ?? []}
                        columns={orderMaterialColumns}
                        defaultExpanded
                        loadMoreLink={route('orderMaterials.index', {
                            filters: { referrer_id: referrer.id },
                        })}
                    />
                </TabPanel>
            </TabContext>
        </div>
    );
};

// Breadcrumb's configuration
const breadCrumbs = [
    {
        title: 'Referrer',
        link: route('referrers.index'),
        icon: null,
    },
];

// Layout wrapper
Show.layout = (page) => {
    const { props } = page;
    return (
        <AuthenticatedLayout
            auth={props.auth}
            breadcrumbs={[
                ...breadCrumbs,
                {
                    title: props.referrer.fullName,
                    link: null,
                    icon: null,
                },
            ]}
        >
            {page}
        </AuthenticatedLayout>
    );
};

export default Show;
