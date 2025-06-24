import React, {useState, useMemo} from 'react';
import {
    Box,
    Chip,
    IconButton,
    Typography,
    TextField,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Grid2 as Grid,
} from '@mui/material';
import {
    Science as ScienceIcon,
    ReceiptLong as ServiceIcon,
    ViewInAr as PanelIcon,
    Biotech as SampleIcon,
    Calculate as CalculateIcon,
    MonetizationOn as PriceIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import TableLayout from '@/Layouts/TableLayout';
import PageHeader from "@/Components/PageHeader.jsx";
import {router, usePage} from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.jsx";
import FormulaTester from "@/Components/FormulaTester.jsx";


// Filter Component
const TestFilter = ({defaultFilter, onFilter}) => {
    const [filters, setFilters] = useState({
        search: defaultFilter?.search || '',
        type: defaultFilter?.type || '',
        status: defaultFilter?.status || ''
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({...prev, [field]: value}));
    };

    const applyFilters = () => {
        onFilter(filters)();
    };

    const clearFilters = () => {
        const clearedFilters = {search: '', type: '', status: ''};
        setFilters(clearedFilters);
        onFilter(clearedFilters)();
    };

    return (
        <Grid container spacing={2} alignItems="center">
            <Grid size={{xs: 12, md: 4}}>
                <TextField
                    fullWidth
                    size="small"
                    label="Search by name or code"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Enter test name or code..."
                />
            </Grid>
            <Grid size={{xs: 12, md: 3}}>
                <TextField
                    fullWidth
                    size="small"
                    select
                    label="Test Type"
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    slotProps={{select: {native: true}}}
                >
                    <option value="">All Types</option>
                    <option value="TEST">Test</option>
                    <option value="SERVICE">Service</option>
                    <option value="PANEL">Panel</option>
                </TextField>
            </Grid>
            <Grid size={{xs: 12, md: 3}}>
                <TextField
                    fullWidth
                    size="small"
                    select
                    label="Status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    slotProps={{select: {native: true}}}
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </TextField>
            </Grid>
            <Grid size={{xs: 12, md: 2}}>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        onClick={applyFilters}
                        startIcon={<FilterIcon/>}
                        size="small"
                        fullWidth
                    >
                        Filter
                    </Button>
                    <Tooltip title="Clear Filters">
                        <IconButton onClick={clearFilters} size="small">
                            <ClearIcon/>
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Grid>
        </Grid>
    );
};

// Sample Types Display Component
const SampleTypesDisplay = ({sampleTypes = []}) => {
    if (!sampleTypes.length) return <Typography variant="body2" color="text.secondary">—</Typography>;

    return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {sampleTypes.slice(0, 3).map((type) => (
                <Chip
                    key={type.id}
                    label={type.name}
                    size="small"
                    variant="outlined"
                    icon={<SampleIcon fontSize="small"/>}
                />
            ))}
            {sampleTypes.length > 3 && (
                <Chip
                    label={`+${sampleTypes.length - 3} more`}
                    size="small"
                    variant="outlined"
                />
            )}
        </Stack>
    );
};

// Method Display Component with Price Calculator
const MethodDisplay = ({method, testType}) => {
    const [calculatorOpen, setCalculatorOpen] = useState(false);

    if (testType === 'PANEL') return null;

    const handleCalculatorOpen = () => {
        setCalculatorOpen(true);
    };

    const handleCalculatorClose = () => {
        setCalculatorOpen(false);
    };

    return (
        <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight="medium">
                    {method.name}
                </Typography>
                {method.price_type === 'Fix' ? (<Chip
                    label={`${method.price} OMR`}
                    size="small"
                    color="primary"
                    variant="outlined"
                />) : (
                    <Tooltip title="Open Price Calculator">
                        <IconButton
                            size="small"
                            onClick={handleCalculatorOpen}
                            color="primary"
                        >
                            <CalculateIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
                {method.turnaround_time} days • {method.workflow?.name}
            </Typography>

            {/* Price Calculator Dialog */}
            {method.price_type !== 'Fix' && (
                <Dialog
                    open={calculatorOpen}
                    onClose={handleCalculatorClose}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Price Calculator - {method.name}
                    </DialogTitle>
                    <DialogContent>
                        <FormulaTester
                            parameters={method.extra?.parameters || []}
                            formula={method.extra?.formula || ''}
                            isConditional={method.price_type === 'Conditional'}
                            conditions={method.extra?.conditions || []}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCalculatorClose}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

// Methods List Component
const MethodsList = ({methodTests = [], testType}) => {
    if (testType === 'PANEL' || !methodTests.length) {
        return <Typography variant="body2" color="text.secondary">—</Typography>;
    }

    return (
        <Stack spacing={1} direction="row">
            {methodTests.slice(0, 2).map((methodTest, index) => (
                <MethodDisplay
                    key={methodTest.id}
                    method={methodTest.method}
                    testType={testType}
                />
            ))}
            {methodTests.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                    +{methodTests.length - 2} more methods
                </Typography>
            )}
        </Stack>
    );
};

// Test Type Icon Component
const TestTypeIcon = ({type}) => {
    const iconProps = {fontSize: 'small'};

    switch (type) {
        case 'TEST':
            return <ScienceIcon {...iconProps} />;
        case 'SERVICE':
            return <ServiceIcon {...iconProps} />;
        case 'PANEL':
            return <PanelIcon {...iconProps} />;
        default:
            return <ScienceIcon {...iconProps} />;
    }
};

// Main Test List Component
const TestList = () => {
    const {tests, requestInputs} = usePage().props;
    // Define table columns
    const columns = useMemo(() => [
        {
            field: 'code',
            headerName: 'Code',
            flex: 0.1,
            display: "flex",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight="medium">
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'name',
            headerName: 'Test Name',
            flex: .3,
            minWidth: 200,
            display: "flex",
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" fontWeight="medium">
                        {params.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.fullName}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 70,
            flex: 0.15,
            display: "flex",
            renderCell: (params) => (
                <Chip
                    icon={<TestTypeIcon type={params.value}/>}
                    label={params.value}
                    size="small"
                    variant="outlined"
                    color={params.value === 'TEST' ? 'primary' : params.value === 'SERVICE' ? 'secondary' : 'default'}
                />
            )
        },
        {
            field: 'testGroup',
            headerName: 'Group',
            flex: 0.15,
            display: "flex",
            renderCell: ({row}) => row.test_group_name || '—'
        },
        {
            field: 'sample_types',
            headerName: 'Sample Types',
            flex: 0.4,
            display: "flex",
            renderCell: ({row}) => <SampleTypesDisplay sampleTypes={row.sample_types}/>
        },
        {
            field: 'method_tests',
            headerName: 'Methods & Pricing',
            flex: 1,
            display: "flex",
            minWidth: 400,
            alignItems: "center",
            renderCell: (params) => (
                <Box sx={{py: 1}}>
                    {params.row.type === 'PANEL' ? (
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <PriceIcon fontSize="small" color="primary"/>
                                <Typography variant="body2" fontWeight="medium">
                                    {params.row.price} OMR
                                </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                                Panel Price
                            </Typography>
                        </Box>
                    ) : (
                        <MethodsList methodTests={params.value} testType={params.row.type}/>
                    )}
                </Box>
            )
        }
    ], []);

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route("test-list"), {
            data: {page, filters, sort, pageSize},
            only: ["tests", "requestInputs"],
        });
    };


    return (
        <>
            <PageHeader title="Test List"/>
            <TableLayout
                Filter={TestFilter}
                columns={columns}
                reload={pageReload}
                data={tests}
                defaultValues={requestInputs}
                customProps={{
                    containerSx: {
                        '& .MuiDataGrid-cell': {
                            alignItems: 'flex-start',
                            py: 1
                        }
                    }
                }}
            />
        </>
    );
};
const breadCrumbs = [
    {
        title: "Tests List",
        link: null,
        icon: null
    }
]

TestList.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
export default TestList;
