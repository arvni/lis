import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import {router} from "@inertiajs/react";
import {
    IconButton,
    Chip,
    Box,
    Tooltip,
    Typography,
    Stack,
    Badge
} from "@mui/material";
import {
    Print as PrintIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Science as ScienceIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon
} from "@mui/icons-material";

const Index = ({samples, status, requestInputs}) => {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        let date;
        if (typeof dateString === 'string')
            date = new Date(dateString);
        else date = dateString;
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    };

    const columns = [
        {
            field: 'patient_fullname',
            headerName: 'Patient',
            type: "string",
            width: 200,
            renderCell: ({row}) => (
                <Box display="flex" alignItems="center">
                    <PersonIcon fontSize="small" sx={{mr: 1, color: "primary.main", opacity: 0.7}}/>
                    <Typography variant="body2" fontWeight={500}>
                        {row.patient_fullname || "N/A"}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'acceptance_items',
            headerName: 'Acceptance ID',
            type: "string",
            sortable: false,
            width: 140,
            renderCell: ({row}) => (
                <Chip
                    icon={<AssignmentIcon/>}
                    label={row.acceptance_items?.[0]?.acceptance_id || "N/A"}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{fontWeight: 500}}
                />
            )
        },
        {
            field: 'patient_idno',
            headerName: 'ID No./Passport',
            type: "string",
            width: 150,
            renderCell: ({row}) => (
                <Typography variant="body2" color="text.secondary">
                    {row.patient_idno || "N/A"}
                </Typography>
            )
        },
        {
            field: 'tests',
            headerName: 'Tests',
            type: "string",
            sortable: false,
            width: 200,
            renderCell: ({row}) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {row?.acceptance_items?.map((item, index) => (
                        <Tooltip key={index} title={`Method: ${item.method?.name || "N/A"}`}>
                            <Chip
                                icon={<ScienceIcon fontSize="small"/>}
                                label={item?.test?.name || "N/A"}
                                size="small"
                                sx={{
                                    my: 0.25,
                                    bgcolor: "info.50",
                                    color: "info.main",
                                    fontSize: "0.7rem",
                                    height: 24
                                }}
                            />
                        </Tooltip>
                    ))}
                </Stack>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            width: 200,
            renderCell: ({row}) => (
                <Stack spacing={0.5} width="100%">
                    {row?.acceptance_items?.map((item, index) => (
                        <Chip
                            key={index}
                            icon={item.pivot.active ?
                                <CheckCircleIcon fontSize="small"/> :
                                <CancelIcon fontSize="small"/>
                            }
                            label={item.pivot.active ?
                                "Sampled" :
                                `Rejected (${item.method?.test?.name})`
                            }
                            color={item.pivot.active ? "success" : "error"}
                            variant={item.pivot.active ? "filled" : "outlined"}
                            size="small"
                            sx={{
                                height: 24,
                                fontSize: "0.7rem",
                                fontWeight: 500
                            }}
                        />
                    ))}
                </Stack>
            )
        },
        {
            field: 'created_at',
            headerName: 'Added Date',
            width: 170,
            type: "datetime",
            valueGetter: (value) => value && new Date(value),
            renderCell: ({value}) => (
                <Typography variant="body2" color="text.secondary">
                    {formatDate(value)}
                </Typography>
            )
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            renderCell: (id) => (
                <Tooltip title="Print Sample Details">
                    <IconButton
                        href={route("samples.show", id)}
                        target="_blank"
                        color="primary"
                        size="small"
                        sx={{
                            border: '1px solid',
                            borderColor: 'primary.light',
                            '&:hover': {
                                bgcolor: 'primary.50'
                            }
                        }}
                    >
                        <PrintIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            )
        }
    ];

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route("samples.index"), {
            only: ["samples", "status", "requestInputs"],
            data: {
                page,
                filters,
                sort,
                pageSize
            },
            preserveState: true
        });
    };

    const samplesCount = samples?.data?.length || 0;

    return (
        <>
            <PageHeader
                title={
                    <Box display="flex" alignItems="center">
                        <ScienceIcon sx={{mr: 1.5, color: "primary.main"}}/>
                        <Typography variant="h5" fontWeight={600}>
                            Samples List
                        </Typography>
                        <Badge
                            badgeContent={samplesCount}
                            color="primary"
                            sx={{ml: 2}}
                        />
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
                        '& .MuiDataGrid-row:hover': {
                            bgcolor: 'action.hover',
                            transition: 'background-color 0.2s'
                        },
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: 'grey.100',
                            fontWeight: 'bold'
                        }
                    }
                }}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: "Samples List",
        link: null,
        icon: <ScienceIcon fontSize="small"/>
    }
];

Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>;

export default Index;
