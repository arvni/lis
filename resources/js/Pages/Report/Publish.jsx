import React, {useMemo, useState, useCallback} from 'react';
import {router, usePage} from '@inertiajs/react';
import {GridActionsCellItem} from '@mui/x-data-grid';
import {
    RemoveRedEye,
    Publish,
    Schedule,
    Person,
    Science,
    WhatsApp,
    Email,
    CheckCircle
} from '@mui/icons-material';
import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Filter from './Components/Filter';
import {
    Stack,
    Typography,
    Chip,
    Box,
    Tooltip,
    Avatar,
    Badge
} from "@mui/material";
import {formatDate} from "@/Services/helper.js";
import PageHeader from "@/Components/PageHeader.jsx";
import OnlyPublish from "@/Pages/Report/Components/OnlyPublish.jsx";

// Constants for breadcrumbs
const BREADCRUMBS = [
    {
        title: "Reports",
        link: route('reports.index'),
        icon: <Science />
    },
    {
        title: "Publishing Queue",
        link: null,
        icon: <Publish />
    }
];

// Helper function to get report status
const getReportStatus = (report) => {
    if (report.published_at) {
        return { status: 'published', color: 'success', label: 'Published' };
    }
    if (report.approved_at) {
        return { status: 'approved', color: 'info', label: 'Ready to Publish' };
    }
    return { status: 'pending', color: 'warning', label: 'Pending' };
};

// Helper function to get delivery methods
const getDeliveryMethods = (report) => {
    const methods = [];
    const howReport = report.acceptance_item?.acceptance?.howReport;

    if (howReport?.whatsapp) {
        methods.push({ type: 'whatsapp', icon: <WhatsApp />, color: '#25D366' });
    }
    if (howReport?.email) {
        methods.push({ type: 'email', icon: <Email />, color: '#1976d2' });
    }
    if (howReport?.sendToReferrer) {
        methods.push({ type: 'referrer', icon: <Person />, color: '#9c27b0' });
    }

    return methods;
};

const PublishingQueue = () => {
    // Destructure page props
    const {
        acceptances,
        status,
        errors,
        success,
        requestInputs,
        canEdit,
        stats
    } = usePage().props;

    const [openPublishForm, setOpenPublishForm] = useState(false);
    const [selectedAcceptance, setSelectedAcceptance] = useState(null);
    const [publishingAcceptances, setPublishingAcceptances] = useState(new Set());

    // Optimized handlers with useCallback
    const handleClosePublishForm = useCallback(() => {
        setOpenPublishForm(false);
        setSelectedAcceptance(null);
    }, []);

    const handleOpenPublishForm = useCallback((acceptance) => {
        setSelectedAcceptance(acceptance);
        setOpenPublishForm(true);
    }, []);

    const handleQuickPublish = useCallback((acceptanceId) => {
        setPublishingAcceptances(prev => new Set([...prev, acceptanceId]));

        router.put(route('acceptances.publish', acceptanceId), {
            silently_publish: false
        }, {
            onFinish: () => {
                setPublishingAcceptances(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(acceptanceId);
                    return newSet;
                });
            },
            preserveState: true,
            only: ['acceptances', 'success', 'errors']
        });
    }, []);

    // Memoized columns with enhanced rendering
    const columns = useMemo(() => [
        {
            field: 'acceptance_id',
            headerName: 'Acceptance ID',
            flex: 0.5,
            renderCell: ({row}) => (
                <Box>
                    <Typography variant="body2" fontWeight="600">
                        #{row.id}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'patient_info',
            headerName: 'Patient Information',
            flex: 1.2,
            sortable: false,
            renderCell: ({row}) => {
                const patient = row.patient;

                return (
                    <Box>
                        <Typography variant="body2" fontWeight="500" noWrap>
                            {patient?.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            ID: {patient?.idNo || 'N/A'}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'tests_info',
            headerName: 'Tests',
            flex: 1.3,
            sortable: false,
            renderCell: ({row}) => {
                const testCount = row.acceptance_items?.length || 0;
                const testNames = row.acceptance_items?.map(item => item.test?.name).join(', ') || 'No tests';

                return (
                    <Box>
                        <Typography variant="body2" fontWeight="500" noWrap>
                            {testCount} Test{testCount !== 1 ? 's' : ''}
                        </Typography>
                        <Tooltip title={testNames}>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {testNames.length > 30 ? testNames.substring(0, 30) + '...' : testNames}
                            </Typography>
                        </Tooltip>
                    </Box>
                );
            }
        },
        {
            field: 'approval_status',
            headerName: 'Reports Status',
            flex: 0.8,
            sortable: false,
            renderCell: ({row}) => {
                const items = row.acceptance_items || [];
                const totalItems = items.length;
                const approvedItems = items.filter(item => item.report?.approved_at).length;
                const publishedItems = items.filter(item => item.report?.published_at).length;

                return (
                    <Box>
                        <Typography variant="body2" fontWeight="500">
                            {approvedItems}/{totalItems} Approved
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {publishedItems}/{totalItems} Published
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'delivery_methods',
            headerName: 'Delivery Methods',
            flex: 1,
            sortable: false,
            renderCell: ({row}) => {
                const howReport = row.howReport;

                const methods = [];
                if (howReport?.whatsapp) {
                    methods.push({ type: 'whatsapp', icon: <WhatsApp />, color: '#25D366', value: howReport.whatsappNumber });
                }
                if (howReport?.email) {
                    methods.push({ type: 'email', icon: <Email />, color: '#1976d2', value: howReport.emailAddress });
                }
                if (howReport?.sendToReferrer && row.referrer?.email) {
                    methods.push({ type: 'referrer', icon: <Person />, color: '#9c27b0', value: 'To Referrer' });
                }

                return (
                    <Stack spacing={0.5}>
                        {methods.map((method, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ color: method.color, display: 'flex' }}>
                                    {method.icon}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {method.value}
                                </Typography>
                            </Box>
                        ))}
                        {methods.length === 0 && (
                            <Chip
                                label="No delivery method"
                                size="small"
                                color="warning"
                                variant="outlined"
                            />
                        )}
                    </Stack>
                );
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            sortable: false,
            flex: 0.3,
            getActions: (params) => {
                const actions = [];
                const isPublishing = publishingAcceptances.has(params.row.id);
                const howReport = params.row.howReport;
                const hasDeliveryMethods = (howReport?.whatsapp || howReport?.email || howReport?.sendToReferrer);

                // View/Configure action
                actions.push(
                    <GridActionsCellItem
                        key={`configure-${params.row.id}`}
                        icon={<RemoveRedEye />}
                        label="Configure Publishing"
                        onClick={() => handleOpenPublishForm(params.row)}
                        disabled={isPublishing}
                    />
                );

                // Quick publish action (only if delivery methods exist and user can edit)
                if (canEdit && hasDeliveryMethods) {
                    actions.push(
                        <GridActionsCellItem
                            key={`publish-${params.row.id}`}
                            icon={<Publish />}
                            label="Quick Publish"
                            onClick={() => handleQuickPublish(params.row.id)}
                            disabled={isPublishing}
                            showInMenu
                        />
                    );
                }

                return actions;
            }
        }
    ], [canEdit, publishingAcceptances, handleOpenPublishForm, handleQuickPublish]);

    // Optimized page reload handler
    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('reports.publishing'), {
            data: {page, filters, sort, pageSize},
            only: ["acceptances", "status", "success", "requestInputs", "stats"],
            preserveState: true
        });
    }, []);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const totalAcceptances = acceptances?.data?.length || 0;
        const withDeliveryMethods = acceptances?.data?.filter(a =>
            a.howReport?.whatsapp || a.howReport?.email || a.howReport?.sendToReferrer
        ).length || 0;

        return {
            total: totalAcceptances,
            withDelivery: withDeliveryMethods,
            noDelivery: totalAcceptances - withDeliveryMethods
        };
    }, [acceptances?.data]);

    return (
        <>
            <PageHeader
                title="Publishing Queue"
                subtitle="Manage acceptance publishing and delivery"
                stats={[
                    { label: 'Total Acceptances', value: summaryStats.total, color: 'primary' },
                    { label: 'With Delivery', value: summaryStats.withDelivery, color: 'success' },
                    { label: 'No Delivery', value: summaryStats.noDelivery, color: 'warning' }
                ]}
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={acceptances}
                Filter={Filter}
                errors={errors}
                loading={publishingAcceptances.size > 0}
                emptyStateProps={{
                    title: "No Acceptances in Publishing Queue",
                    description: "Acceptances will appear here once all their reports are approved and ready for publishing.",
                    icon: <Publish sx={{ fontSize: 64, color: 'text.disabled' }} />
                }}
            />

            {openPublishForm && selectedAcceptance && (
                <OnlyPublish
                    open={openPublishForm}
                    onCancel={handleClosePublishForm}
                    acceptance={selectedAcceptance}
                />
            )}
        </>
    );
};

// Layout wrapper with improved breadcrumbs
PublishingQueue.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={BREADCRUMBS}
    >
        {page}
    </AuthenticatedLayout>
);

export default PublishingQueue;
