import TableLayout from "@/Layouts/TableLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
    Typography,
    IconButton,
    Stack,
    Paper,
    Box,
    Tooltip,
    Chip,
    Menu,
    MenuItem,
    Checkbox,
    ListItemText,
    Button
} from "@mui/material";
import {
    RemoveRedEye as RemoveRedEyeIcon,
    ViewColumn as ViewColumnIcon
} from "@mui/icons-material";
import Filter from "./Components/Filter";
import Excel from "@/../images/excel.svg";
import {Head, router, usePage} from "@inertiajs/react";
import {useState, useCallback, useEffect} from "react";

const StatisticsIndex = () => {
    const {acceptanceItems, requestInputs} = usePage().props;
    const [loading, setLoading] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

    // Format currency values consistently
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Format date in a readable format
    const formatDate = (dateString) => {
        if (!dateString) return "—";

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Status indicator component
    const StatusChip = ({status}) => {
        let color = "default";

        switch (status?.toLowerCase()) {
            case "completed":
                color = "success";
                break;
            case "in progress":
            case "processing":
                color = "warning";
                break;
            case "pending":
                color = "info";
                break;
            case "cancelled":
            case "failed":
                color = "error";
                break;
            default:
                color = "default";
        }

        return <Chip label={status || "Unknown"} color={color} size="small"/>;
    };

    // Navigate to item details
    const showAcceptanceItem = useCallback((row) => (e) => {
        e.preventDefault();
        setLoading(true);
        router.visit(route("acceptanceItems.show", {acceptanceItem: row.id, acceptance: row.acceptance_id}), {
            onFinish: () => setLoading(false)
        });
    }, []);

    // All available columns
    const allColumns = [
        {
            field: 'id',
            headerName: 'ID',
            type: "number",
            flex: 0.2,
            hidden: true,
        },
        {
            field: 'invoice.owner.fullName',
            headerName: 'Client',
            type: "string",
            flex: 0.7,
            sortable: false,
            renderCell: ({row}) => row?.invoice?.owner?.fullName || "—",
        },
        {
            field: 'patient_fullname',
            headerName: 'Patient Name',
            type: "string",
            flex: 0.7,
            renderCell: ({value}) => value || "—"
        },
        {
            field: 'patient_idno',
            headerName: 'ID Number',
            type: "string",
            flex: 0.25,
            renderCell: ({value}) => value || "—"
        },
        {
            field: 'patient_dateofbirth',
            headerName: 'Date of Birth',
            type: "string",
            flex: 0.3,
            renderCell: ({value}) => formatDate(value)
        },
        {
            field: 'test_testsname',
            headerName: 'Test Name',
            type: "string",
            flex: 0.3,
            renderCell: ({value}) => value || "—"
        },
        {
            field: 'method_name',
            headerName: 'Method',
            type: "string",
            flex: 0.25,
            renderCell: ({value}) => value || "—"
        },
        {
            field: 'price',
            headerName: 'Price',
            type: "number",
            flex: 0.15,
            renderCell: ({value}) => formatCurrency(value)
        },
        {
            field: 'discount',
            headerName: 'Discount',
            type: "number",
            flex: 0.2,
            renderCell: ({value}) => formatCurrency(value)
        },
        {
            field: 'active_sample_collection_date',
            headerName: 'Sample Date',
            type: "date",
            valueGetter: (value) => value ? new Date(value) : null,
            flex: 0.3,
            renderCell: ({value}) => value ? formatDate(value) : "-"
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            flex: 0.3,
            sortable: false,
            renderCell: ({value}) => <StatusChip status={value}/>
        },
        {
            field: 'updated_at',
            headerName: 'Last Updated',
            type: "date",
            valueGetter: (value) => value ? new Date(value) : null,
            flex: 0.3,
            renderCell: ({value}) => formatDate(value)
        },
        {
            field: 'action',
            headerName: 'Actions',
            flex: 0.1,
            sortable: false,
            renderCell: ({row}) => (
                <Stack spacing={1} direction="row">
                    <Tooltip title="View Details">
                        <IconButton
                            onClick={showAcceptanceItem(row)}
                            href={route("acceptanceItems.show", {
                                acceptanceItem: row.id,
                                acceptance: row.acceptance_id
                            })}
                            size="small"
                            color="info"
                        >
                            <RemoveRedEyeIcon/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ];

    // Initialize visible columns on component mount
    useEffect(() => {
        // Exclude the 'id' column which is hidden by default
        const initialVisibleColumns = allColumns
            .filter(column => !column.hidden)
            .map(column => column.field);
        setVisibleColumns(initialVisibleColumns);
    }, []);

    // Get currently visible columns
    const columns = allColumns.map(column => ({
        ...column,
        hidden: !visibleColumns.includes(column.field)
    }));

    // Handle column visibility toggle
    const handleColumnToggle = (field) => {
        setVisibleColumns(prev => {
            if (prev.includes(field)) {
                return prev.filter(col => col !== field);
            } else {
                return [...prev, field];
            }
        });
    };

    // Open column selector menu
    const handleColumnMenuOpen = (event) => {
        setColumnMenuAnchor(event.currentTarget);
    };

    // Close column selector menu
    const handleColumnMenuClose = () => {
        setColumnMenuAnchor(null);
    };

    // Show all columns
    const showAllColumns = () => {
        const allFields = allColumns
            .filter(column => column.field !== 'id') // Keep 'id' hidden
            .map(column => column.field);
        setVisibleColumns(allFields);
    };

    // Hide all columns except essential ones
    const hideAllColumns = () => {
        setVisibleColumns(['patient_fullname', 'status', 'action']); // Keep minimum essential columns
    };

    // Page reload function
    const pageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('acceptanceItems.index'), {
            data: {page, filters, pageSize, sort},
            only: ["acceptanceItems", "requestInputs"],
            preserveState: true
        });
    }, []);

    return (
        <>
            <Head title="Test Statistics"/>

            <Box sx={{mb: 3}}>
                <Paper sx={{padding: 2, mb: 2}}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h5" component="h1" sx={{fontWeight: 'bold'}}>
                            Test Statistics
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            {/* Column Selector Button */}
                            <Tooltip title="Select Columns">
                                <IconButton
                                    onClick={handleColumnMenuOpen}
                                    color="primary"
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        p: 1
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <ViewColumnIcon/>
                                        <Typography variant="button" sx={{display: {xs: 'none', sm: 'block'}}}>
                                            Columns
                                        </Typography>
                                    </Stack>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Export to Excel">
                                <IconButton
                                    href={route("acceptanceItems.export", {...requestInputs, visibleColumns})}
                                    color="success"
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        p: 1
                                    }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <img src={Excel} alt="Excel" width="24px"/>
                                        <Typography variant="button" sx={{display: {xs: 'none', sm: 'block'}}}>
                                            Export
                                        </Typography>
                                    </Stack>
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    </Stack>
                </Paper>
            </Box>

            {/* Column Selector Menu */}
            <Menu
                anchorEl={columnMenuAnchor}
                open={Boolean(columnMenuAnchor)}
                onClose={handleColumnMenuClose}
                slotProps={{
                    paper: {
                        style: {
                            maxHeight: 300,
                            width: 250,
                        },
                    }
                }}
            >
                <Box sx={{px: 2, py: 1}}>
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            onClick={showAllColumns}
                            variant="outlined"
                        >
                            Show All
                        </Button>
                        <Button
                            size="small"
                            onClick={hideAllColumns}
                            variant="outlined"
                        >
                            Hide All
                        </Button>
                    </Stack>
                </Box>
                {allColumns
                    .filter(column => column.field !== 'id') // Don't show 'id' in the selector
                    .map((column) => (
                        <MenuItem
                            key={column.field}
                            onClick={() => handleColumnToggle(column.field)}
                            dense
                        >
                            <Checkbox
                                checked={visibleColumns.includes(column.field)}
                                color="primary"
                                size="small"
                            />
                            <ListItemText primary={column.headerName}/>
                        </MenuItem>
                    ))}
            </Menu>

            <TableLayout
                defaultValues={requestInputs}
                reload={pageReload}
                columns={columns}
                data={acceptanceItems}
                Filter={Filter}
                loading={loading}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: "Test Statistics",
        link: null,
        icon: null
    }
];

StatisticsIndex.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default StatisticsIndex;
