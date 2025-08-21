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
        reports,
        status,
        errors,
        success,
        requestInputs,
        canEdit,
        stats
    } = usePage().props;

    const [openPublishForm, setOpenPublishForm] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [publishingReports, setPublishingReports] = useState(new Set());

    // Optimized handlers with useCallback
    const handleClosePublishForm = useCallback(() => {
        setOpenPublishForm(false);
        setSelectedReport(null);
    }, []);

    const handleOpenPublishForm = useCallback((report) => {
        setSelectedReport(report);
        setOpenPublishForm(true);
    }, []);

    const handleQuickPublish = useCallback((reportId) => {
        setPublishingReports(prev => new Set([...prev, reportId]));

        router.put(route('reports.publish', reportId), {
            silently_publish: false
        }, {
            onFinish: () => {
                setPublishingReports(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(reportId);
                    return newSet;
                });
            },
            preserveState: true,
            only: ['reports', 'success', 'errors']
        });
    }, []);

    // Memoized columns with enhanced rendering
    const columns = useMemo(() => [
        {
            field: 'patient_info',
            headerName: 'Patient Information',
            flex: 1.2,
            sortable: false,
            renderCell: ({row}) => {
                const patients = row.acceptance_item?.patients || [];
                const patientNames = patients.map(p => p.fullName).join(", ");

                return (
                    <Box>
                        <Typography variant="body2" fontWeight="500" noWrap>
                            {patientNames || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            ID: {row.acceptance_item?.id || 'N/A'}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: 'test_info',
            headerName: 'Test & Method',
            flex: 1.3,
            sortable: false,
            renderCell: ({row}) => {
                const testName = row.acceptance_item?.test?.name || 'Unknown Test';
                const methodName = row.acceptance_item?.method?.name || 'Unknown Method';

                return (
                    <Box>
                        <Typography variant="body2" fontWeight="500" noWrap>
                            {testName}
                        </Typography>
                        <Chip
                            label={methodName}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 0.5, maxWidth: '100%' }}
                        />
                    </Box>
                );
            }
        },
        {
            field: 'reporter_info',
            headerName: 'Reporter',
            flex: 0.8,
            renderCell: ({row}) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {row.reporter_name?.charAt(0) || 'R'}
                    </Avatar>
                    <Typography variant="body2" noWrap>
                        {row.reporter_name || 'Unknown'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'reported_at',
            headerName: 'Reported',
            type: "datetime",
            flex: 0.8,
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value}) => (
                <Box>
                    <Typography variant="body2">
                        {formatDate(value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {value ? new Date(value).toLocaleTimeString() : 'N/A'}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'delivery_methods',
            headerName: 'Delivery Methods',
            flex: 1,
            sortable: false,
            renderCell: ({row}) => {
                const methods = getDeliveryMethods(row);
                const howReport = row.acceptance_item?.acceptance?.howReport;

                return (
                    <Stack spacing={0.5}>
                        {methods.map((method, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ color: method.color, display: 'flex' }}>
                                    {method.icon}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {method.type === 'whatsapp' && howReport?.whatsappNumber}
                                    {method.type === 'email' && howReport?.emailAddress}
                                    {method.type === 'referrer' && 'To Referrer'}
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
            field: 'approval_info',
            headerName: 'Approval Status',
            flex: 1,
            sortable: false,
            renderCell: ({row}) => {
                const reportStatus = getReportStatus(row);

                return (
                    <Box>
                        <Chip
                            icon={reportStatus.status === 'approved' ? <CheckCircle /> : <Schedule />}
                            label={reportStatus.label}
                            size="small"
                            color={reportStatus.color}
                            variant="filled"
                            sx={{ mb: 0.5 }}
                        />
                        {row.approver_name && (
                            <Typography variant="caption" color="text.secondary" display="block">
                                by {row.approver_name}
                            </Typography>
                        )}
                        {row.approved_at && (
                            <Typography variant="caption" color="text.secondary" display="block">
                                {formatDate(row.approved_at)}
                            </Typography>
                        )}
                    </Box>
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
                const isPublishing = publishingReports.has(params.row.id);
                const hasDeliveryMethods = getDeliveryMethods(params.row).length > 0;

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
                if (canEdit && hasDeliveryMethods && !params.row.published_at) {
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
    ], [canEdit, publishingReports, handleOpenPublishForm, handleQuickPublish]);

    // Optimized page reload handler
    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('reports.publishing'), {
            data: {page, filters, sort, pageSize},
            only: ["reports", "status", "success", "requestInputs", "stats"],
            preserveState: true
        });
    }, []);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const totalReports = reports?.data?.length || 0;
        const readyToPublish = reports?.data?.filter(r => r.approved_at && !r.published_at).length || 0;
        const published = reports?.data?.filter(r => r.published_at).length || 0;

        return {
            total: totalReports,
            ready: readyToPublish,
            published: published,
            pending: totalReports - readyToPublish - published
        };
    }, [reports?.data]);

    return (
        <>
            <PageHeader
                title="Publishing Queue"
                subtitle="Manage report publishing and delivery"
                stats={[
                    { label: 'Total Reports', value: summaryStats.total, color: 'primary' },
                    { label: 'Ready to Publish', value: summaryStats.ready, color: 'success' },
                    { label: 'Published', value: summaryStats.published, color: 'info' },
                    { label: 'Pending', value: summaryStats.pending, color: 'warning' }
                ]}
            />

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={reports}
                Filter={Filter}
                errors={errors}
                loading={publishingReports.size > 0}
                emptyStateProps={{
                    title: "No Reports in Publishing Queue",
                    description: "Reports will appear here once they are approved and ready for publishing.",
                    icon: <Publish sx={{ fontSize: 64, color: 'text.disabled' }} />
                }}
            />

            {openPublishForm && selectedReport && (
                <OnlyPublish
                    open={openPublishForm}
                    onCancel={handleClosePublishForm}
                    report={selectedReport}
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
