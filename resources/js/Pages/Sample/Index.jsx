import React, {useState} from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import EditSampleModal from "./Components/EditSampleModal";
import TableLayout from "@/Layouts/TableLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import {router, Link} from "@inertiajs/react";
import {
    IconButton,
    Chip,
    Box,
    Tooltip,
    Typography,
    Stack,
    Badge,
} from "@mui/material";
import {
    Print as PrintIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Science as ScienceIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
    QrCode as QrCodeIcon,
    HourglassEmpty as PendingIcon,
    Person as ApproverIcon,
    Edit as EditIcon,
} from "@mui/icons-material";
import {formatDate} from "@/Services/helper.js";

const qcStatusConfig = {
    approved: {label: 'Approved', color: 'success', icon: <CheckCircleIcon fontSize="small"/>},
    rejected: {label: 'Rejected', color: 'error', icon: <CancelIcon fontSize="small"/>},
    pending: {label: 'Pending', color: 'warning', icon: <PendingIcon fontSize="small"/>},
};

const Index = ({samples, status, requestInputs, canEdit}) => {
    const [editSample, setEditSample] = useState(null);

    const columns = [
        {
            field: 'barcode',
            headerName: 'Barcode',
            type: 'string',
            width: 160,
            renderCell: ({row}) => (
                <Stack direction="row" spacing={0.5} sx={{alignItems: 'center'}}>
                    <QrCodeIcon fontSize="small" color="action"/>
                    <Typography variant="body2" fontWeight={500} fontFamily="monospace">
                        {row.barcode || '—'}
                    </Typography>
                </Stack>
            ),
        },
        {
            field: 'patient',
            headerName: 'Patient',
            sortable: false,
            type: 'string',
            width: 300,
            renderCell: ({row}) => (
                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    <Typography variant="body2" fontWeight={500}>
                        {row.patient?.fullName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {row.patient?.idNo || ''}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'acceptance_items',
            headerName: 'Acceptance',
            type: 'string',
            sortable: false,
            display: 'flex',
            width: 130,
            renderCell: ({row}) => (
                row.acceptance_items?.[0]?.acceptance_id &&
                <Link href={route('acceptances.show', row.acceptance_items[0].acceptance_id)}>
                    <Chip
                        icon={<AssignmentIcon/>}
                        label={row.acceptance_items[0].acceptance_id}
                        variant="outlined"
                        color="primary"
                        size="small"
                        sx={{fontWeight: 500}}
                    />
                </Link>
            ),
        },
        {
            field: 'tests',
            headerName: 'Tests',
            type: 'string',
            sortable: false,
            width: 200,
            renderCell: ({row}) => (
                <Stack direction="row" spacing={0.5} sx={{flexWrap: 'wrap'}}>
                    {row?.acceptance_items?.map((item, index) => (
                        <Tooltip key={index} title={`Method: ${item.method?.name || 'N/A'}`}>
                            <Chip
                                icon={<ScienceIcon fontSize="small"/>}
                                label={item?.test?.name || 'N/A'}
                                size="small"
                                sx={{my: 0.25, bgcolor: 'info.50', color: 'info.main', fontSize: '0.7rem', height: 24}}
                            />
                        </Tooltip>
                    ))}
                </Stack>
            ),
        },
        {
            field: 'qc_status',
            headerName: 'QC Status',
            type: 'string',
            width: 130,
            display: 'flex',
            renderCell: ({row}) => {
                const cfg = qcStatusConfig[row.qc_status] ?? {label: row.qc_status, color: 'default', icon: null};
                const chip = (
                    <Chip
                        icon={cfg.icon}
                        label={cfg.label}
                        color={cfg.color}
                        size="small"
                        variant={row.qc_status === 'rejected' ? 'outlined' : 'filled'}
                        sx={{
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            height: 24,
                            cursor: row.qc_status === 'rejected' && row.rejection_reason ? 'help' : 'default'
                        }}
                    />
                );
                if (row.qc_status === 'rejected' && row.rejection_reason) {
                    return (
                        <Tooltip title={row.rejection_reason} arrow placement="top">
                            {chip}
                        </Tooltip>
                    );
                }
                return chip;
            },
        },
        {
            field: 'qc_approved_by',
            headerName: 'QC By',
            type: 'string',
            sortable: false,
            width: 160,
            renderCell: ({row}) => (
                row.qc_approved_by ? (
                    <Stack >
                            <Typography variant="body2">{row.qc_approved_by.name}</Typography>
                            {row.qc_approved_at && (
                                <Typography variant="caption" color="text.secondary">
                                    {formatDate(row.qc_approved_at)}
                                </Typography>
                            )}
                    </Stack>
                ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                )
            ),
        },
        {
            field: 'received_at',
            headerName: 'Received',
            width: 150,
            type: 'datetime',
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value}) => (
                <Typography variant="body2" color="text.secondary">{formatDate(value)}</Typography>
            ),
        },
        {
            field: 'collection_date',
            headerName: 'Collected',
            width: 150,
            type: 'datetime',
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value}) => (
                <Typography variant="body2" color="text.secondary">{formatDate(value)}</Typography>
            ),
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: canEdit ? 120 : 80,
            sortable: false,
            renderCell: ({row}) => (
                <Stack direction="row" spacing={0.5}>
                    {canEdit && (
                        <Tooltip title="Edit Barcode">
                            <IconButton
                                onClick={() => setEditSample(row)}
                                color="warning"
                                size="small"
                                sx={{border: '1px solid', borderColor: 'warning.light', '&:hover': {bgcolor: 'warning.50'}}}
                            >
                                <EditIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Print Sample Details">
                        <IconButton
                            href={route('samples.show', row.id)}
                            target="_blank"
                            color="primary"
                            size="small"
                            sx={{border: '1px solid', borderColor: 'primary.light', '&:hover': {bgcolor: 'primary.50'}}}
                        >
                            <PrintIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        },
    ];

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('samples.index'), {
            only: ['samples', 'status', 'requestInputs'],
            data: {page, filters, sort, pageSize},
            preserveState: true,
        });
    };

    const samplesCount = samples?.data?.length || 0;

    return (
        <>
            <EditSampleModal
                open={Boolean(editSample)}
                sample={editSample}
                onClose={() => setEditSample(null)}
            />
            <PageHeader
                title={
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <ScienceIcon sx={{mr: 1.5, color: 'primary.main'}}/>
                        <Typography variant="h5" fontWeight={600}>Samples List</Typography>
                        <Badge badgeContent={samplesCount} color="primary" sx={{ml: 2}}/>
                    </Box>
                }
            />

            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={samples}
                reload={pageReload}
                Filter={Filter}
                status={status}
                customProps={{
                    sx: {
                        '& .MuiDataGrid-row:hover': {bgcolor: 'action.hover', transition: 'background-color 0.2s'},
                        '& .MuiDataGrid-columnHeaders': {bgcolor: 'grey.100', fontWeight: 'bold'},
                    },
                }}
            />
        </>
    );
};

const breadCrumbs = [
    {title: 'Samples List', link: null, icon: <ScienceIcon fontSize="small"/>},
];

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>;

export default Index;
