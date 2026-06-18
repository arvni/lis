import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import Filter from './Components/ShowFilter';
import EnteringForm from '@/Pages/Section/Components/EnteringForm';
import { ACTION_TYPES, WorkflowActionForm } from '@/Pages/Section/Components/DoneForm';
import {
    Box,
    Button,
    Card,
    Chip,
    Grid as Grid,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    RemoveRedEye as RemoveRedEyeIcon,
    Done as DoneIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    ScienceOutlined as ScienceIcon,
    AccessTimeOutlined as AccessTimeIcon,
    CheckCircleOutlined as CheckCircleIcon,
    ErrorOutlined as ErrorOutlineIcon,
    HourglassEmpty as HourglassEmptyIcon,
    Refresh as RefreshIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
import InlineTagManager from '@/Components/InlineTagManager';
import { GridActionsCellItem } from '@mui/x-data-grid';
import Avatar from '@mui/material/Avatar';

// Status configurations with icons and colors
const STATUS_CONFIG = {
    rejected: {
        icon: <ErrorOutlineIcon fontSize="small" />,
        label: 'Rejected',
        color: 'error',
        chipColor: 'error',
    },
    finished: {
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Finished',
        color: 'success',
        chipColor: 'success',
    },
    processing: {
        icon: <AccessTimeIcon fontSize="small" />,
        label: 'Processing',
        color: 'info',
        chipColor: 'info',
    },
    waiting: {
        icon: <HourglassEmptyIcon fontSize="small" />,
        label: 'Waiting',
        color: 'warning',
        chipColor: 'warning',
    },
};

const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    if (typeof dateTimeStr === 'string') return dateTimeStr;

    try {
        const date = new Date(dateTimeStr);
        return new Intl.DateTimeFormat('default', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date);
    } catch (e) {
        return dateTimeStr;
    }
};

const ACCEPTANCE_ITEM_STATES_STATUS = {
    REJECTED: 'rejected',
    FINISHED: 'finished',
    PROCESSING: 'processing',
    WAITING: 'waiting',
};

const Show = () => {
    const theme = useTheme();
    const { post, setData, data, reset, processing } = useForm({});
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [openEnteringForm, setOpenEnteringForm] = useState(false);
    const [openDoneForm, setOpenDoneForm] = useState(false);

    const { section, acceptanceItemStates, status, errors, success, requestInputs, stats } =
        usePage().props;

    const getSelectionIds = (selection) => {
        if (!selection) return [];
        if (Array.isArray(selection)) return selection;
        if (selection.ids) {
            // In MUI X v7+, selection can be an object with a Set or Array in .ids
            if (typeof selection.ids.forEach === 'function') {
                const ids = [];
                selection.ids.forEach((id) => ids.push(id));
                return ids;
            }
            if (Array.isArray(selection.ids)) return selection.ids;
            if (typeof selection.ids === 'object') return Object.keys(selection.ids);
        }
        return [];
    };

    const isCompatible = useMemo(() => {
        const selection = getSelectionIds(selectedRows);
        if (selection.length <= 1) return true;

        const dataRows = acceptanceItemStates?.data || [];
        const rows = dataRows.filter((row) => selection.includes(row.id));
        if (rows.length === 0) return true;

        const firstRow = rows[0];
        return rows.every(
            (row) =>
                row.acceptance_item?.test?.id === firstRow.acceptance_item?.test?.id &&
                row.acceptance_item?.method?.test?.id ===
                    firstRow.acceptance_item?.method?.test?.id,
        );
    }, [selectedRows, acceptanceItemStates]);

    const columns = useMemo(
        () => [
            {
                field: 'test',
                headerName: 'Test',
                type: 'string',
                sortable: false,
                flex: 0.8,
                display: 'flex',
                renderCell: ({ row }) => (
                    <Tooltip title={row?.acceptance_item?.test?.name || 'No test name'} arrow>
                        <Typography noWrap variant="body2">
                            {row?.acceptance_item?.test?.name +
                                ' >>  ' +
                                row?.acceptance_item?.method?.test?.name || '-'}
                        </Typography>
                    </Tooltip>
                ),
            },
            {
                field: 'fullName',
                headerName: 'Patient',
                sortable: false,
                display: 'flex',
                type: 'string',
                flex: 1,
                renderCell: ({ row }) => {
                    return (
                        <Tooltip title={row?.sample?.patient?.fullName || 'No patient name'} arrow>
                            <Typography noWrap variant="body2">
                                {row.sample?.patient?.fullName || '-'}
                            </Typography>
                        </Tooltip>
                    );
                },
            },
            {
                field: 'dateOfBirth',
                headerName: 'Age',
                sortable: false,
                display: 'flex',
                flex: 0.2,
                type: 'string',
                renderCell: ({ row }) => {
                    return (
                        <Typography variant="body2">{row?.sample?.patient?.age || '-'}</Typography>
                    );
                },
            },
            {
                field: 'sampled_at',
                headerName: 'Sampled At',
                type: 'datetime',
                display: 'flex',
                sortable: false,
                width: 160,
                renderCell: ({ row }) => {
                    const date = row?.sample?.created_at
                        ? formatDateTime(new Date(row.sample.created_at))
                        : '-';
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScienceIcon fontSize="small" color="action" />
                            <Typography variant="body2">{date}</Typography>
                        </Box>
                    );
                },
            },
            {
                field: 'started_at',
                headerName: 'Started At',
                type: 'string',
                display: 'flex',
                width: 160,
                renderCell: ({ row }) => {
                    const date = row.started_at ? formatDateTime(new Date(row.started_at)) : '-';
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="body2">{date}</Typography>
                        </Box>
                    );
                },
            },
            {
                field: 'status',
                headerName: 'Status',
                type: 'string',
                display: 'flex',
                flex: 0.4,
                renderCell: ({ row }) => {
                    const statusInfo = STATUS_CONFIG[row.status] || STATUS_CONFIG.waiting;
                    return (
                        <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            size="small"
                            color={statusInfo.chipColor}
                            sx={{ fontWeight: 'medium' }}
                        />
                    );
                },
            },
            {
                field: 'tags',
                headerName: 'Tags',
                type: 'string',
                sortable: false,
                display: 'flex',
                flex: 0.8,
                renderCell: ({ row }) => (
                    <InlineTagManager
                        initialTags={row.acceptance_item?.tags || []}
                        updateUrl={route('acceptanceItems.tags.update', row.acceptance_item?.id)}
                        entityType="acceptanceItem"
                    />
                ),
            },
            {
                field: 'id',
                headerName: 'Actions',
                type: 'actions',
                width: 160,
                getActions: ({ row }) => {
                    let output = [
                        <GridActionsCellItem
                            icon={
                                <Tooltip title="View Details">
                                    <RemoveRedEyeIcon />
                                </Tooltip>
                            }
                            label="Show"
                            component={Link}
                            key={'show-' + row.id}
                            href={route('acceptanceItems.show', {
                                acceptanceItem: row.acceptance_item_id,
                                acceptance: row.acceptance_item.acceptance_id,
                            })}
                            sx={{
                                color: theme.palette.info.main,
                                border: `1px solid ${theme.palette.info.main}`,
                                borderRadius: '50%',
                                p: 0.5,
                                '&:hover': {
                                    backgroundColor: theme.palette.info.light,
                                    boxShadow: theme.shadows[2],
                                },
                            }}
                        />,
                    ];

                    if (row.status === ACCEPTANCE_ITEM_STATES_STATUS.PROCESSING) {
                        output.push(
                            <GridActionsCellItem
                                key={'done-' + row.id}
                                icon={
                                    <Tooltip title="Mark as Done">
                                        <DoneIcon />
                                    </Tooltip>
                                }
                                label="Done"
                                onClick={handleOpenForm(row.id, ACTION_TYPES.COMPLETE)}
                                sx={{
                                    color: theme.palette.success.main,
                                    border: `1px solid ${theme.palette.success.main}`,
                                    borderRadius: '50%',
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: theme.palette.success.light,
                                        boxShadow: theme.shadows[2],
                                    },
                                }}
                            />,
                            <GridActionsCellItem
                                key={'reject-' + row.id}
                                icon={
                                    <Tooltip title="Reject">
                                        <CloseIcon />
                                    </Tooltip>
                                }
                                label="Reject"
                                onClick={handleOpenRejectForm(row.id)}
                                sx={{
                                    color: theme.palette.error.main,
                                    border: `1px solid ${theme.palette.error.main}`,
                                    borderRadius: '50%',
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: theme.palette.error.light,
                                        boxShadow: theme.shadows[2],
                                    },
                                }}
                            />,
                        );
                    } else if (row.status === ACCEPTANCE_ITEM_STATES_STATUS.FINISHED) {
                        output.push(
                            <GridActionsCellItem
                                key={'edit-' + row.id}
                                icon={
                                    <Tooltip title="Edit">
                                        <EditIcon />
                                    </Tooltip>
                                }
                                label="Edit"
                                onClick={handleOpenForm(row.id, ACTION_TYPES.UPDATE)}
                                sx={{
                                    color: theme.palette.warning.main,
                                    border: `1px solid ${theme.palette.warning.main}`,
                                    borderRadius: '50%',
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: theme.palette.warning.light,
                                        boxShadow: theme.shadows[2],
                                    },
                                }}
                            />,
                        );
                    }

                    return output;
                },
            },
        ],
        [acceptanceItemStates, requestInputs, section, theme],
    );

    const onSuccess = () => {
        setOpenEnteringForm(false);
        setOpenDoneForm(false);
        setSelectedRows([]);
        reset();
    };

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('sections.show', section.id), {
            data: { page, filters, sort, pageSize },
            only: ['acceptanceItemStates', 'section', 'status', 'success', 'requestInputs'],
            preserveState: true,
            queryStringArrayFormat: 'indices',
        });
    };

    const handleBarcodeChange = (e) => setData({ barcode: e.target.value });

    const handleEntering = () => post(route('sections.enter', section.id), { onSuccess });

    const handleOpenEnteringForm = () => {
        setData({ barcode: '' });
        setOpenEnteringForm(true);
    };

    const handleCloseEnteringForm = () => {
        reset();
        setOpenEnteringForm(false);
    };

    const handleOpenForm = (id, type) => () => {
        setLoading(true);
        axios
            .get(route('acceptanceItemStates.show', id))
            .then((res) => setData({ ...res.data.data, actionType: type, _method: 'put' }))
            .then(() => {
                setLoading(false);
                setOpenDoneForm(true);
            });
    };

    const handleCloseDoneForm = () => {
        reset();
        setOpenDoneForm(false);
    };

    const handleChange = (name, value) => setData((prevData) => ({ ...prevData, [name]: value }));

    const handleSubmit = () => {
        if (data.ids && data.ids.length > 0) {
            post(route('acceptanceItemStates.bulkUpdate'), { onSuccess });
        } else {
            post(route('acceptanceItemStates.update', data.id), { onSuccess });
        }
    };

    const handleOpenBulkForm = (type) => () => {
        const selection = getSelectionIds(selectedRows);
        if (selection.length === 0) return;

        // Find the first selected row to use its parameters as a template
        const firstSelectedRow = acceptanceItemStates.data.find((row) => row.id === selection[0]);
        if (!firstSelectedRow) return;

        setLoading(true);
        axios
            .get(route('acceptanceItemStates.show', firstSelectedRow.id))
            .then((res) =>
                setData({
                    ...res.data.data,
                    ids: selection,
                    actionType: type,
                    _method: 'put',
                }),
            )
            .then(() => {
                setLoading(false);
                setOpenDoneForm(true);
            });
    };

    const handleOpenBulkRejectForm = () => async () => {
        const selection = getSelectionIds(selectedRows);
        if (selection.length === 0) return;

        const firstSelectedRow = acceptanceItemStates.data.find((row) => row.id === selection[0]);
        if (!firstSelectedRow) return;

        setLoading(true);
        axios
            .get(route('acceptanceItemStates.prevSections', firstSelectedRow.id))
            .then((res) => {
                setOptions(res.data.sections);
            })
            .then(() => axios.get(route('acceptanceItemStates.show', firstSelectedRow.id)))
            .then((res) =>
                setData({
                    ...res.data.data,
                    ids: selection,
                    next: null,
                    actionType: ACTION_TYPES.REJECT,
                    _method: 'put',
                }),
            )
            .then(() => {
                setOpenDoneForm(true);
                setLoading(false);
            });
    };

    const handleOpenRejectForm = (id) => async () => {
        setLoading(true);
        axios
            .get(route('acceptanceItemStates.prevSections', id))
            .then((res) => {
                setOptions(res.data.sections);
            })
            .then(() => axios.get(route('acceptanceItemStates.show', id)))
            .then((res) =>
                setData({
                    ...res.data.data,
                    next: null,
                    actionType: ACTION_TYPES.REJECT,
                    _method: 'put',
                }),
            )
            .then(() => {
                setOpenDoneForm(true);
                setLoading(false);
            });
    };

    return (
        <>
            <Head title={section.name} />

            {/* Section Header */}
            <Card
                elevation={2}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: theme.palette.primary.contrastText,
                }}
            >
                <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {section.icon ? (
                                <Avatar src={section.icon} />
                            ) : (
                                <DashboardIcon fontSize="large" />
                            )}
                            <Box>
                                <Typography variant="h4" fontWeight="bold">
                                    {section.name}
                                </Typography>
                                <Typography variant="subtitle1">{section.sectionGroup}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid
                        size={{ xs: 12, md: 6 }}
                        sx={{
                            display: 'flex',
                            justifyContent: { xs: 'flex-start', md: 'flex-end' },
                            gap: 1,
                        }}
                    >
                        {/* Bulk buttons removed from here and moved to TableLayout headerActions below */}
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenEnteringForm}
                            color="secondary"
                            sx={{
                                borderRadius: 6,
                                px: 3,
                                py: 1,
                                boxShadow: theme.shadows[4],
                                '&:hover': {
                                    boxShadow: theme.shadows[8],
                                },
                            }}
                        >
                            Add Sample
                        </Button>

                        <Tooltip title="Refresh Data">
                            <IconButton
                                onClick={() =>
                                    pageReload(
                                        1,
                                        requestInputs?.filters,
                                        requestInputs?.sort,
                                        requestInputs?.pageSize,
                                    )
                                }
                                sx={{
                                    ml: 2,
                                    color: theme.palette.primary.contrastText,
                                    border: `1px solid ${theme.palette.primary.contrastText}`,
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <RefreshIcon sx={{ color: 'white' }} />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Card>

            {/* Stats Dashboard */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Total Samples
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {stats.total}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.primary.light,
                                display: 'flex',
                            }}
                        >
                            <DashboardIcon fontSize="large" sx={{ color: 'white' }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            borderLeft: `4px solid ${theme.palette.success.main}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Completed
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {stats.finished || 0}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.success.light,
                                display: 'flex',
                            }}
                        >
                            <CheckCircleIcon fontSize="large" sx={{ color: 'white' }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            borderLeft: `4px solid ${theme.palette.info.main}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                In Progress
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="info.main">
                                {stats.processing || 0}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.info.light,
                                display: 'flex',
                            }}
                        >
                            <AccessTimeIcon fontSize="large" sx={{ color: 'white' }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            borderLeft: `4px solid ${theme.palette.warning.main}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Waiting
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                                {stats.waiting || 0}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.warning.light,
                                display: 'flex',
                            }}
                        >
                            <HourglassEmptyIcon fontSize="large" sx={{ color: 'white' }} />
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6, lg: 2.4 }}>
                    <Paper
                        elevation={1}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            borderLeft: `4px solid ${theme.palette.error.main}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Rejected
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                                {stats.rejected || 0}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                p: 1,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.error.light,
                                display: 'flex',
                            }}
                        >
                            <ErrorOutlineIcon fontSize="large" sx={{ color: 'white' }} />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Main Table */}
            <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableLayout
                    defaultValues={requestInputs}
                    success={success}
                    status={status}
                    reload={pageReload}
                    columns={columns}
                    data={acceptanceItemStates}
                    loading={processing || loading}
                    Filter={Filter}
                    errors={errors}
                    checkboxSelection
                    onRowSelectionModelChange={(newSelection) =>
                        setSelectedRows(newSelection || [])
                    }
                    isRowSelectable={(params) =>
                        params.row.status === ACCEPTANCE_ITEM_STATES_STATUS.PROCESSING
                    }
                    headerActions={
                        <Stack direction="row" spacing={2} alignItems="center">
                            {getSelectionIds(selectedRows).length > 0 ? (
                                <>
                                    {!isCompatible && (
                                        <Tooltip title="Selected items must have the same test and method for bulk actions">
                                            <Chip
                                                label="Incompatible Selection"
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </Tooltip>
                                    )}
                                    <Button
                                        variant="contained"
                                        startIcon={<DoneIcon />}
                                        onClick={handleOpenBulkForm(ACTION_TYPES.COMPLETE)}
                                        color="success"
                                        size="small"
                                        disabled={!isCompatible}
                                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                                    >
                                        Bulk Done ({getSelectionIds(selectedRows).length})
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<CloseIcon />}
                                        onClick={handleOpenBulkRejectForm()}
                                        color="error"
                                        size="small"
                                        disabled={!isCompatible}
                                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                                    >
                                        Bulk Reject ({getSelectionIds(selectedRows).length})
                                    </Button>
                                </>
                            ) : (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontStyle: 'italic' }}
                                >
                                    Select processing items for bulk actions
                                </Typography>
                            )}
                        </Stack>
                    }
                />
            </Card>

            {/* Modals */}
            <EnteringForm
                onChange={handleBarcodeChange}
                open={openEnteringForm && !processing}
                submit={handleEntering}
                barcode={data.barcode}
                onClose={handleCloseEnteringForm}
            />

            <WorkflowActionForm
                actionType={data.actionType}
                onClose={handleCloseDoneForm}
                open={openDoneForm && !processing && !loading}
                acceptanceItemState={data}
                onChange={handleChange}
                onSubmit={handleSubmit}
                options={options}
            />
        </>
    );
};

const getNestedParents = (sectionGroup) => {
    if (sectionGroup.parent) {
        return [
            ...getNestedParents(sectionGroup.parent),
            {
                title: sectionGroup.name,
                link: route('sectionGroups.show', sectionGroup.id),
                icon: null,
            },
        ];
    }
    return [
        {
            title: sectionGroup.name,
            link: route('sectionGroups.show', sectionGroup.id),
            icon: null,
        },
    ];
};

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={[
            ...getNestedParents(page.props.section.section_group),
            {
                title: page.props.section.name,
                link: null,
                icon: null,
            },
        ]}
    />
);

export default Show;
