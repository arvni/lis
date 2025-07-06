import React, {useState} from "react";
import {
    Button,
    FormControlLabel,
    FormLabel,
    Radio, RadioGroup,
    Switch,
    TextField,
    Typography,
    Box,
    Paper,
    Alert,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Tabs,
    Tab,
    Chip,
    Collapse, Divider, InputLabel, Select, MenuItem, OutlinedInput
} from "@mui/material";
import SelectSearch from "@/Components/SelectSearch";
import MethodFields from "./MethodFields";
import SampleTypeFields from "@/Pages/Test/Components/SampleTypesFields";
import Editor from "@/Components/Editor";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid2";
import PageHeader from "@/Components/PageHeader.jsx";
import {
    Save,
    Cancel,
    ArrowBack,
    ArrowForward,
    Help,
    Assignment,
    Science,
    ReceiptLong,
    Description,
    Biotech,
    ViewInAr, CurrencyExchange, Money
} from "@mui/icons-material";
import {TabContext, TabList, TabPanel} from "@mui/lab";
import ParametersField from "@/Components/ParametersField.jsx";
import ConditionsField from "@/Components/ConditionsField.jsx";

export default function TestForm({
                                     data = {
                                         type: '1',
                                         status: true,
                                         fullName: '',
                                         name: '',
                                         code: '',
                                         sample_type_tests: [],
                                         method_tests: []
                                     },
                                     setData,
                                     submit,
                                     edit,
                                     cancel,
                                     errors = {},
                                     setError,
                                     clearErrors
                                 }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [activeTab, setActiveTab] = useState(0);
    const [helpVisible, setHelpVisible] = useState({});
    const [priceActiveTab, setPriceActiveTab] = useState("1");

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleChange = (e) => onChange(
        e.target.name,
        e.target.type === "checkbox" ? e.target.checked : e.target.value
    );

    const handleTypeChange = (e, v) => {
        setData(prevState => ({
            ...prevState,
            type: v,
            testGroup: "",
            report_templates: [],
            parameters: [],
            sampleTypes: [],
        }));

        // Reset to first tab when type changes
        setActiveTab(0);
    };

    const onChange = (key, value) => setData(prevState => ({...prevState, [key]: value}));

    const check = () => {
        clearErrors();
        let output = true;
        let newErrors = {};

        if (!data?.fullName) {
            output = false;
            newErrors.fullName = "Please enter full name";
            setError("fullName", "Please enter full name");
        }

        if (!data?.name) {
            output = false;
            newErrors.name = "Please enter short name";
            setError("name", "Please enter short name");
        }

        if (!data?.code) {
            output = false;
            newErrors.code = "Please enter test code";
            setError("code", "Please enter test code");
        }

        if (data?.type === '1') {
            if (!data?.test_group?.id) {
                output = false;
                newErrors.test_group = "Please select a test group";
                setError("test_group", "Please select a test group");
            }

            if (!data?.report_templates.length) {
                output = false;
                newErrors.report_template = "Please select a report template";
                setError("report_templates", "Please select a report template");
            }

            if (!data?.sample_type_tests?.length) {
                output = false;
                newErrors.sample_type_tests = "Please select at least one sample type";
                setError("sample_type_tests", "Please select at least one sample type");
            }
        }

        if (!data?.method_tests?.length) {
            output = false;
            newErrors.method_tests = "Please select at least one method";
            setError("method_tests", "Please select at least one method");
        }

        // If errors, switch to the tab with the first error
        if (!output) {
            if (newErrors.fullName || newErrors.name || newErrors.code || newErrors.test_group || newErrors.report_template) {
                setActiveTab(0);
            } else if (newErrors.sample_type_tests) {
                setActiveTab(1);
            } else if (newErrors.method_tests) {
                setActiveTab(2);
            }
        }

        return output;
    };

    const handleSubmit = () => {
        if (check()) {
            submit();
        }
    };
    const handlePriceTabChange = (event, newValue) => {
        setPriceActiveTab(newValue);
    };

    const handleExtraChange = (e) => {
        console.log(e);
        const updatedExtra = {
            ...data.extra,
            [e.target.name]: e.target.value
        };
        onChange("extra", updatedExtra);
    };
    const handleReferrerExtraChange = (e) => {
        const updatedExtra = {
            ...data.referrer_extra,
            [e.target.name]: e.target.value
        };
        onChange("referrer_extra", updatedExtra);
    };

    const toggleHelp = (field) => {
        setHelpVisible(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const getTestTypeLabel = () => {
        switch (data.type) {
            case 'TEST':
                return 'Test';
            case 'SERVICE':
                return 'Service';
            case 'PANEL':
                return 'Panel';
            default:
                return 'Test';
        }
    };

    const getTestTypeIcon = () => {
        switch (data.type) {
            case 'TEST':
                return <Science color="primary"/>;
            case 'SERVICE':
                return <ReceiptLong color="primary"/>;
            case 'PANEL':
                return <ViewInAr color="primary"/>;
            default:
                return <Science color="primary"/>;
        }
    };

    const getHelpText = (field) => {
        const helpTexts = {
            fullName: "The complete name of the test as it will appear on reports and documentation.",
            name: "A shorter version of the test name for quick reference in the system.",
            code: "A unique identifier code for this test, used for tracking and referencing.",
            test_type: "Select whether this is a standard test, a service, or a panel of multiple tests.",
            test_group: "The category or group this test belongs to for organizational purposes.",
            report_template: "The template that will be used when generating reports for this test.",
            sample_types: "The types of samples that can be used for this test.",
            methods: "The testing methods that can be used for this test.",
            description: "Additional information about the test, preparation requirements, or other details."
        };

        return helpTexts[field] || "No help available for this field.";
    };

    // Render basic information tab
    const renderBasicInfoTab = () => (
        <Box sx={{p: {xs: 1, sm: 2}}}>
            <Paper elevation={0} variant="outlined" sx={{p: 3, mb: 3}}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                }}>
                    {getTestTypeIcon()}
                    <Typography variant="h6" sx={{ml: 1}}>
                        {edit ? "Edit" : "New"} {getTestTypeLabel()}
                    </Typography>
                    <Chip
                        label={data.status ? "Active" : "Inactive"}
                        color={data.status ? "success" : "default"}
                        size="small"
                        sx={{ml: 2}}
                    />
                </Box>

                <FormControl sx={{mb: 3, width: '100%'}}>
                    <FormLabel id="test-type-label" sx={{mb: 1}}>Test Type</FormLabel>
                    <RadioGroup
                        row
                        aria-labelledby="test-type-label"
                        name="type"
                        onChange={handleTypeChange}
                        value={data.type}
                        sx={{mb: 1}}
                    >
                        <FormControlLabel
                            value="TEST"
                            control={<Radio/>}
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Science fontSize="small" sx={{mr: 0.5}}/>
                                    Test
                                </Box>
                            }
                            disabled={Boolean(data?.id)}
                        />
                        <FormControlLabel
                            value="SERVICE"
                            control={<Radio/>}
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <ReceiptLong fontSize="small" sx={{mr: 0.5}}/>
                                    Service
                                </Box>
                            }
                            disabled={Boolean(data?.id)}
                        />
                        <FormControlLabel
                            value="PANEL"
                            control={<Radio/>}
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <ViewInAr fontSize="small" sx={{mr: 0.5}}/>
                                    Panel
                                </Box>
                            }
                            disabled={Boolean(data?.id)}
                        />
                    </RadioGroup>
                    <FormHelperText>
                        {Boolean(data?.id)
                            ? "Test type cannot be changed after creation"
                            : "Select the type of test you want to create"}
                    </FormHelperText>
                </FormControl>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, md: 6}}>
                        <Box sx={{position: 'relative'}}>
                            <TextField
                                value={data.fullName || ''}
                                fullWidth
                                name="fullName"
                                label="Full Name"
                                placeholder="Enter the complete test name"
                                onChange={handleChange}
                                error={Boolean(errors?.fullName)}
                                helperText={errors?.fullName || "The complete name as it appears on reports"}
                                slotProps={{
                                    Input: {
                                        endAdornment: (
                                            <Tooltip title="Show help">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleHelp('fullName')}
                                                    edge="end"
                                                >
                                                    <Help fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        )
                                    }
                                }}
                            />
                            <Collapse in={Boolean(helpVisible.fullName)}>
                                <Alert
                                    severity="info"
                                    sx={{mt: 1}}
                                    onClose={() => toggleHelp('fullName')}
                                >
                                    {getHelpText('fullName')}
                                </Alert>
                            </Collapse>
                        </Box>
                    </Grid>

                    <Grid size={{xs: 12, md: 6}}>
                        <Box sx={{position: 'relative'}}>
                            <TextField
                                value={data.name || ''}
                                fullWidth
                                name="name"
                                label="Short Name"
                                placeholder="Enter a shortened name"
                                onChange={handleChange}
                                error={Boolean(errors?.name)}
                                helperText={errors?.name || "A shorter version for quick reference"}
                                slotProps={{
                                    Input: {
                                        endAdornment: (
                                            <Tooltip title="Show help">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleHelp('name')}
                                                    edge="end"
                                                >
                                                    <Help fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        )
                                    }
                                }}
                            />
                            <Collapse in={Boolean(helpVisible.name)}>
                                <Alert
                                    severity="info"
                                    sx={{mt: 1}}
                                    onClose={() => toggleHelp('name')}
                                >
                                    {getHelpText('name')}
                                </Alert>
                            </Collapse>
                        </Box>
                    </Grid>

                    <Grid size={{xs: 12, md: 6}}>
                        <Box sx={{position: 'relative'}}>
                            <TextField
                                value={data.code || ''}
                                fullWidth
                                name="code"
                                label="Test Code"
                                placeholder="Enter a unique code"
                                onChange={handleChange}
                                error={Boolean(errors?.code)}
                                helperText={errors?.code || "A unique identifier for this test"}
                                slotProps={{
                                    Input: {
                                        endAdornment: (
                                            <Tooltip title="Show help">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => toggleHelp('code')}
                                                    edge="end"
                                                >
                                                    <Help fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        )
                                    }
                                }}
                            />
                            <Collapse in={Boolean(helpVisible.code)}>
                                <Alert
                                    severity="info"
                                    sx={{mt: 1}}
                                    onClose={() => toggleHelp('code')}
                                >
                                    {getHelpText('code')}
                                </Alert>
                            </Collapse>
                        </Box>
                    </Grid>

                    <Grid size={{xs: 12, md: 6}}>
                        <FormControlLabel
                            name="status"
                            control={
                                <Switch
                                    checked={Boolean(data.status)}
                                    onChange={handleChange}
                                    color="success"
                                />
                            }
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <Typography sx={{mr: 1}}>Status</Typography>
                                    <Chip
                                        label={data.status ? "Active" : "Inactive"}
                                        size="small"
                                        color={data.status ? "success" : "default"}
                                    />
                                </Box>
                            }
                            sx={{mt: 1}}
                        />
                    </Grid>

                    {(data.type === "TEST" || data.type === "PANEL") && (
                        <Grid size={{xs: 12, md: 6}}>
                            <Box sx={{position: 'relative'}}>
                                <SelectSearch
                                    value={data.test_group || ''}
                                    onChange={handleChange}
                                    name="test_group"
                                    fullWidth
                                    label="Test Group"
                                    placeholder="Select a test group"
                                    url={route('api.testGroups.list')}
                                    error={Boolean(errors?.test_group)}
                                    helperText={errors?.test_group || "The category this test belongs to"}
                                />
                                <Collapse in={Boolean(helpVisible.test_group)}>
                                    <Alert
                                        severity="info"
                                        sx={{mt: 1}}
                                        onClose={() => toggleHelp('test_group')}
                                    >
                                        {getHelpText('test_group')}
                                    </Alert>
                                </Collapse>
                            </Box>
                        </Grid>
                    )}
                    {data.type === "TEST" && (<>
                        <Grid size={{xs: 12, md: 6}}>
                            <Box sx={{position: 'relative'}}>
                                <SelectSearch
                                    value={data.report_templates || []}
                                    onChange={handleChange}
                                    name="report_templates"
                                    fullWidth
                                    label="Report Templates"
                                    multiple
                                    placeholder="Select report templates"
                                    url={route('api.reportTemplates.list')}
                                    error={Boolean(errors?.report_templates)}
                                    helperText={errors?.report_templates || "Template used for test reports"}
                                />
                                <Collapse in={Boolean(helpVisible.report_templates)}>
                                    <Alert
                                        severity="info"
                                        sx={{mt: 1}}
                                        onClose={() => toggleHelp('report_templates')}
                                    >
                                        {getHelpText('report_templates')}
                                    </Alert>
                                </Collapse>
                            </Box>
                        </Grid>
                        <Grid size={{xs: 12, md: 6}}>
                            <Box sx={{position: 'relative'}}>
                                <SelectSearch
                                    value={data.request_form || ""}
                                    onChange={handleChange}
                                    name="request_form"
                                    fullWidth
                                    label="Request Form"
                                    placeholder="Select request form"
                                    url={route('api.requestForms.list')}
                                    error={Boolean(errors?.request_form)}
                                    helperText={errors?.request_form || "Request form used for test"}
                                />
                                <Collapse in={Boolean(helpVisible.request_form)}>
                                    <Alert
                                        severity="info"
                                        sx={{mt: 1}}
                                        onClose={() => toggleHelp('request_form')}
                                    >
                                        {getHelpText('request_form')}
                                    </Alert>
                                </Collapse>
                            </Box>

                        </Grid>
                        <Grid size={{xs: 12, md: 6}}>
                            <Box sx={{position: 'relative'}}>
                                <SelectSearch
                                    value={data.consent_form || ""}
                                    onChange={handleChange}
                                    name="consent_form"
                                    fullWidth
                                    label="Consent Form"
                                    placeholder="Select Consent form"
                                    url={route('api.consentForms.list')}
                                    error={Boolean(errors?.consent_form)}
                                    helperText={errors?.consent_form || "Consent form used for test"}
                                />
                                <Collapse in={Boolean(helpVisible.consent_form)}>
                                    <Alert
                                        severity="info"
                                        sx={{mt: 1}}
                                        onClose={() => toggleHelp('consent_form')}
                                    >
                                        {getHelpText('consent_form')}
                                    </Alert>
                                </Collapse>
                            </Box>
                        </Grid>
                        <Grid size={{xs: 12, md: 6}}>
                            <Box sx={{position: 'relative'}}>
                                <SelectSearch
                                    value={data.instruction || ""}
                                    onChange={handleChange}
                                    name="instruction"
                                    fullWidth
                                    label="Instruction"
                                    placeholder="Select Instruction"
                                    url={route('api.instructions.list')}
                                    error={Boolean(errors?.instruction)}
                                    helperText={errors?.instruction || "Instruction used for test"}
                                />
                                <Collapse in={Boolean(helpVisible.instruction)}>
                                    <Alert
                                        severity="info"
                                        sx={{mt: 1}}
                                        onClose={() => toggleHelp('instruction')}
                                    >
                                        {getHelpText('instruction')}
                                    </Alert>
                                </Collapse>
                            </Box>
                        </Grid>

                    </>)}
                </Grid>
            </Paper>

            <Box sx={{mt: 3, display: 'flex', justifyContent: 'space-between'}}>
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={cancel}
                    startIcon={<Cancel/>}
                >
                    Cancel
                </Button>

                <Box><Button
                    variant="contained"
                    color="primary"
                    onClick={() => setActiveTab(1)}
                    endIcon={<ArrowForward/>}
                >
                    Next: {data.type === '1' ? "Sample Types" : "Methods"}
                </Button>
                    {edit ? <Button
                    variant="contained"
                    color="success"
                    sx={{ml: 1}}
                    onClick={handleSubmit}
                    startIcon={<Save/>}
                >
                    Update
                </Button> : null}
                </Box>
            </Box>
        </Box>
    );
    // Render sample types tab
    const renderSampleTypesTab = () => (
        <Box sx={{p: {xs: 1, sm: 2}}}>
            <Paper elevation={0} variant="outlined" sx={{p: 3, mb: 3}}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Biotech color="primary"/>
                    <Typography variant="h6" sx={{ml: 1}}>
                        Sample Types
                    </Typography>
                </Box>

                <Box sx={{position: 'relative'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <Typography variant="subtitle1">
                            Acceptable Sample Types
                        </Typography>
                        <Tooltip title="Show help">
                            <IconButton
                                size="small"
                                onClick={() => toggleHelp('sample_types')}
                                sx={{ml: 1}}
                            >
                                <Help fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Collapse in={Boolean(helpVisible.sample_types)}>
                        <Alert
                            severity="info"
                            sx={{mb: 2}}
                            onClose={() => toggleHelp('sample_types')}
                        >
                            {getHelpText('sample_types')}
                        </Alert>
                    </Collapse>

                    <SampleTypeFields
                        onChange={onChange}
                        name="sample_type_tests"
                        error={errors?.sample_type_tests}
                        sampleTypes={data.sample_type_tests || []}
                    />
                </Box>
            </Paper>

            <Box sx={{mt: 3, display: 'flex', justifyContent: 'space-between'}}>
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setActiveTab(0)}
                    startIcon={<ArrowBack/>}
                >
                    Back
                </Button>

                <Box><Button
                    variant="contained"
                    color="primary"
                    onClick={() => setActiveTab(2)}
                    endIcon={<ArrowForward/>}
                >
                    Next: Methods
                </Button>
                    {edit ? <Button
                        variant="contained"
                        color="success"
                        sx={{ml: 1}}
                        onClick={handleSubmit}
                        startIcon={<Save/>}
                    >
                        Update
                    </Button> : null}
                </Box>
            </Box>
        </Box>
    );
    // Render price tab - Redesigned for better UX
    const renderPriceTab = () => (
        <Box sx={{p: {xs: 1, sm: 2}}}>
            <Paper elevation={0} variant="outlined" sx={{p: 3, mb: 3}}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Money color="primary"/>
                    <Typography variant="h6" sx={{ml: 1}}>
                        Pricing Configuration
                    </Typography>
                    <Chip
                        label="Required"
                        size="small"
                        color="primary"
                        sx={{ml: 2}}
                    />
                </Box>

                <Box sx={{position: 'relative'}}>
                    <TabContext value={priceActiveTab}>
                        <Box sx={{borderBottom: 1, borderColor: 'divider', mb: 3}}>
                            <TabList
                                onChange={handlePriceTabChange}
                                aria-label="Pricing Tabs"
                                variant="fullWidth"
                            >
                                <Tab
                                    label={
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <Money fontSize="small"/>
                                            <Box>
                                                <Typography variant="subtitle2">Direct Patient</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Walk-in pricing
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                    value="1"
                                    sx={{textTransform: 'none'}}
                                />
                                <Tab
                                    label={
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <CurrencyExchange fontSize="small"/>
                                            <Box>
                                                <Typography variant="subtitle2">Referral</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Doctor referred
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                    value="2"
                                    sx={{textTransform: 'none'}}
                                />
                            </TabList>
                        </Box>

                        <TabPanel value="1" sx={{p: 0}}>
                            <Box sx={{mb: 3}}>
                                <Alert severity="info" sx={{mb: 3}}>
                                    <Typography variant="subtitle2" sx={{mb: 1}}>
                                        Direct Patient Pricing
                                    </Typography>
                                    Configure pricing for patients who come directly without referrals.
                                </Alert>

                                <Paper elevation={2} sx={{
                                    p: 3,
                                    mb: 3,
                                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                                }}>
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                        <CurrencyExchange color="primary" sx={{mr: 1}}/>
                                        <Typography variant="h6">Pricing Method</Typography>
                                        <Tooltip title="Choose how pricing will be calculated for this panel">
                                            <IconButton size="small" sx={{ml: 1}}>
                                                <Help fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <FormControl fullWidth>
                                        <InputLabel id="price-type-select-label">Select Pricing Method</InputLabel>
                                        <Select
                                            labelId="price-type-select-label"
                                            id="price-type-select"
                                            value={data?.price_type || "Fix"}
                                            label="Select Pricing Method"
                                            name="price_type"
                                            onChange={(e) => onChange("price_type", e.target.value)}
                                            startAdornment={<CurrencyExchange sx={{mr: 1, ml: -0.5}}/>}
                                        >
                                            <MenuItem value="Fix">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                    <Money fontSize="small"/>
                                                    <Box>
                                                        <Typography variant="subtitle2">Fixed Price</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Set a single fixed amount
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Formulate">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                    <Assignment fontSize="small"/>
                                                    <Box>
                                                        <Typography variant="subtitle2">Formula-based</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Calculate using parameters
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Conditional">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                    <Science fontSize="small"/>
                                                    <Box>
                                                        <Typography variant="subtitle2">Conditional</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Price based on conditions
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Paper>

                                {data?.price_type === "Fix" && (
                                    <Paper elevation={1} sx={{p: 3, border: '2px solid', borderColor: 'success.light'}}>
                                        <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                            <Money color="success" sx={{mr: 1}}/>
                                            <Typography variant="h6" color="success.main">Fixed Price Setup</Typography>
                                        </Box>
                                        <Alert severity="success" sx={{mb: 2}}>
                                            Set a single price that will apply to all patients.
                                        </Alert>
                                        <FormControl fullWidth>
                                            <InputLabel
                                                error={Boolean(errors?.price)}
                                                id="payment-method-label"
                                                required
                                            >
                                                Price Amount
                                            </InputLabel>
                                            <OutlinedInput
                                                fullWidth
                                                type="number"
                                                name="price"
                                                label="Price Amount"
                                                value={data.price || 0}
                                                error={Boolean(errors?.price)}
                                                required
                                                inputProps={{min: 0, step: 0.001}}
                                                onChange={(e) => onChange("price", e.target.value)}
                                                startAdornment={<Typography variant="h6" color="success.main"
                                                                            sx={{mr: 1}}>OMR</Typography>}
                                                sx={{
                                                    fontSize: '1.2rem',
                                                    '& input': {fontSize: '1.2rem', fontWeight: 'bold'}
                                                }}
                                            />
                                            {errors?.price && <FormHelperText error>{errors?.price}</FormHelperText>}
                                        </FormControl>
                                    </Paper>
                                )}

                                {data?.price_type === "Formulate" && (
                                    <Box>
                                        <Paper elevation={1}
                                               sx={{p: 3, mb: 3, border: '2px solid', borderColor: 'info.light'}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                                <Assignment color="info" sx={{mr: 1}}/>
                                                <Typography variant="h6" color="info.main">Formula-based
                                                    Pricing</Typography>
                                            </Box>
                                            <Alert severity="info" sx={{mb: 3}}>
                                                Define parameters and create a mathematical formula to calculate dynamic
                                                pricing.
                                            </Alert>

                                            <Box sx={{mb: 3}}>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 1: Define Parameters
                                                </Typography>
                                                <ParametersField
                                                    defaultValue={data?.extra?.parameters || []}
                                                    onChange={handleExtraChange}
                                                    name="parameters"
                                                    errors={errors?.extra?.parameters}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 2: Create Formula
                                                </Typography>
                                                <TextField
                                                    name="formula"
                                                    label="Price Calculation Formula"
                                                    placeholder="e.g. age * 0.5 + weight * 0.2 + 10"
                                                    onChange={handleExtraChange}
                                                    value={data?.extra?.formula || ""}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    helperText={errors?.["extra.formula"] || "Use the parameters you've defined above in your mathematical formula"}
                                                    error={Boolean(errors?.["extra.formula"])}
                                                    sx={{
                                                        '& .MuiInputBase-root': {
                                                            fontFamily: 'monospace'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Paper>
                                    </Box>
                                )}

                                {data?.price_type === "Conditional" && (
                                    <Box>
                                        <Paper elevation={1}
                                               sx={{p: 3, border: '2px solid', borderColor: 'warning.light'}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                                <Science color="warning" sx={{mr: 1}}/>
                                                <Typography variant="h6" color="warning.main">Conditional
                                                    Pricing</Typography>
                                            </Box>
                                            <Alert severity="warning" sx={{mb: 3}}>
                                                Set different prices based on specific conditions and parameters.
                                            </Alert>

                                            <Box sx={{mb: 3}}>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 1: Define Parameters
                                                </Typography>
                                                <ParametersField
                                                    defaultValue={data?.extra?.parameters || []}
                                                    onChange={handleExtraChange}
                                                    name="parameters"
                                                    errors={errors?.extra?.parameters}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 2: Set Conditions
                                                </Typography>
                                                <ConditionsField
                                                    defaultValue={data?.extra?.conditions || []}
                                                    onChange={handleExtraChange}
                                                    name="conditions"
                                                    errors={errors?.extra?.conditions}
                                                    parameters={data?.extra?.parameters || []}
                                                />
                                            </Box>
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        </TabPanel>

                        <TabPanel value="2" sx={{p: 0}}>
                            <Box sx={{mb: 3}}>
                                <Alert severity="info" sx={{mb: 3}}>
                                    <Typography variant="subtitle2" sx={{mb: 1}}>
                                        Referral Pricing
                                    </Typography>
                                    Configure special pricing for patients referred by doctors or healthcare providers.
                                </Alert>

                                <Paper elevation={2} sx={{
                                    p: 3,
                                    mb: 3,
                                    background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)'
                                }}>
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                        <CurrencyExchange color="primary" sx={{mr: 1}}/>
                                        <Typography variant="h6">Referral Pricing Method</Typography>
                                        <Tooltip
                                            title="Choose how referred test pricing will be calculated for this panel">
                                            <IconButton size="small" sx={{ml: 1}}>
                                                <Help fontSize="small"/>
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <FormControl fullWidth>
                                        <InputLabel id="referrer-price-type-select-label">Select Referral Pricing
                                            Method</InputLabel>
                                        <Select
                                            labelId="referrer-price-type-select-label"
                                            id="referrer-price-type-select"
                                            value={data?.referrer_price_type || "Fix"}
                                            label="Select Referral Pricing Method"
                                            name="referrer_price_type"
                                            onChange={(e) => onChange("referrer_price_type", e.target.value)}
                                            startAdornment={<CurrencyExchange sx={{mr: 1, ml: -0.5}}/>}
                                        >
                                            <MenuItem value="Fix">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                    <Money fontSize="small"/>
                                                    <Box>
                                                        <Typography variant="subtitle2">Fixed Price</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Set a single fixed amount
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Formulate">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                    <Assignment fontSize="small"/>
                                                    <Box>
                                                        <Typography variant="subtitle2">Formula-based</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Calculate using parameters
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="Conditional">
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                                                    <Science fontSize="small"/>
                                                    <Box>
                                                        <Typography variant="subtitle2">Conditional</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Price based on conditions
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Paper>

                                {data?.referrer_price_type === "Fix" && (
                                    <Paper elevation={1} sx={{p: 3, border: '2px solid', borderColor: 'success.light'}}>
                                        <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                            <Money color="success" sx={{mr: 1}}/>
                                            <Typography variant="h6" color="success.main">Fixed Referral
                                                Price</Typography>
                                        </Box>
                                        <Alert severity="success" sx={{mb: 2}}>
                                            Set a single price that will apply to all referred patients.
                                        </Alert>
                                        <FormControl fullWidth>
                                            <InputLabel
                                                error={Boolean(errors?.referrer_price)}
                                                id="referrer-payment-method-label"
                                                required
                                            >
                                                Referral Price Amount
                                            </InputLabel>
                                            <OutlinedInput
                                                fullWidth
                                                type="number"
                                                name="referrer_price"
                                                label="Referral Price Amount"
                                                value={data.referrer_price || 0}
                                                error={Boolean(errors?.referrer_price)}
                                                required
                                                inputProps={{min: 0, step: 0.001}}
                                                onChange={(e) => onChange("referrer_price", e.target.value)}
                                                startAdornment={<Typography variant="h6" color="success.main"
                                                                            sx={{mr: 1}}>OMR</Typography>}
                                                sx={{
                                                    fontSize: '1.2rem',
                                                    '& input': {fontSize: '1.2rem', fontWeight: 'bold'}
                                                }}
                                            />
                                            {errors?.referrer_price &&
                                                <FormHelperText error>{errors?.referrer_price}</FormHelperText>}
                                        </FormControl>
                                    </Paper>
                                )}

                                {data?.referrer_price_type === "Formulate" && (
                                    <Box>
                                        <Paper elevation={1}
                                               sx={{p: 3, mb: 3, border: '2px solid', borderColor: 'info.light'}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                                <Assignment color="info" sx={{mr: 1}}/>
                                                <Typography variant="h6" color="info.main">Formula-based Referral
                                                    Pricing</Typography>
                                            </Box>
                                            <Alert severity="info" sx={{mb: 3}}>
                                                Define parameters and create a mathematical formula for dynamic referral
                                                pricing.
                                            </Alert>

                                            <Box sx={{mb: 3}}>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 1: Define Parameters
                                                </Typography>
                                                <ParametersField
                                                    defaultValue={data?.referrer_extra?.parameters || []}
                                                    onChange={handleReferrerExtraChange}
                                                    name="parameters"
                                                    errors={errors?.referrer_extra?.parameters}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 2: Create Formula
                                                </Typography>
                                                <TextField
                                                    name="formula"
                                                    label="Referral Price Calculation Formula"
                                                    placeholder="e.g. age * 0.5 + weight * 0.2 + 10"
                                                    onChange={handleReferrerExtraChange}
                                                    value={data?.referrer_extra?.formula || ""}
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    helperText={errors?.["referrer_extra.formula"] || "Use the parameters you've defined above in your mathematical formula"}
                                                    error={Boolean(errors?.["referrer_extra.formula"])}
                                                    sx={{
                                                        '& .MuiInputBase-root': {
                                                            fontFamily: 'monospace'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Paper>
                                    </Box>
                                )}

                                {data?.referrer_price_type === "Conditional" && (
                                    <Box>
                                        <Paper elevation={1}
                                               sx={{p: 3, border: '2px solid', borderColor: 'warning.light'}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                                <Science color="warning" sx={{mr: 1}}/>
                                                <Typography variant="h6" color="warning.main">Conditional Referral
                                                    Pricing</Typography>
                                            </Box>
                                            <Alert severity="warning" sx={{mb: 3}}>
                                                Set different referral prices based on specific conditions and
                                                parameters.
                                            </Alert>

                                            <Box sx={{mb: 3}}>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 1: Define Parameters
                                                </Typography>
                                                <ParametersField
                                                    defaultValue={data?.referrer_extra?.parameters || []}
                                                    onChange={handleReferrerExtraChange}
                                                    name="parameters"
                                                    errors={errors?.referrer_extra?.parameters}
                                                />
                                            </Box>

                                            <Box>
                                                <Typography variant="subtitle1" sx={{mb: 2, fontWeight: 'bold'}}>
                                                    Step 2: Set Conditions
                                                </Typography>
                                                <ConditionsField
                                                    defaultValue={data?.referrer_extra?.conditions || []}
                                                    onChange={handleReferrerExtraChange}
                                                    name="conditions"
                                                    errors={errors?.referrer_extra?.conditions}
                                                    parameters={data?.referrer_extra?.parameters || []}
                                                />
                                            </Box>
                                        </Paper>
                                    </Box>
                                )}
                            </Box>
                        </TabPanel>
                    </TabContext>
                </Box>
            </Paper>

            <Box sx={{mt: 3, display: 'flex', justifyContent: 'space-between'}}>
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setActiveTab(0)}
                    startIcon={<ArrowBack/>}
                >
                    Back
                </Button>

                <Box><Button
                    variant="contained"
                    color="primary"
                    onClick={() => setActiveTab(2)}
                    endIcon={<ArrowForward/>}
                >
                    Next: Methods
                </Button>
                    {edit ? <Button
                        variant="contained"
                        color="success"
                        sx={{ml: 1}}
                        onClick={handleSubmit}
                        startIcon={<Save/>}
                    >
                        Update
                    </Button> : null}
                </Box>
            </Box>
        </Box>
    );

    // Render methods tab
    const renderMethodsTab = () => (
        <Box sx={{p: {xs: 1, sm: 2}}}>
            <Paper elevation={0} variant="outlined" sx={{p: 3, mb: 3}}>
                <Box sx={{position: 'relative'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <Typography variant="h6">
                            {data.type === '3' ? 'Tests' : 'Methods'}
                        </Typography>
                        <Tooltip title="Show help">
                            <IconButton
                                size="small"
                                onClick={() => toggleHelp('methods')}
                                sx={{ml: 1}}
                            >
                                <Help fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Collapse in={Boolean(helpVisible.methods)}>
                        <Alert
                            severity="info"
                            sx={{mb: 2}}
                            onClose={() => toggleHelp('methods')}
                        >
                            {getHelpText('methods')}
                        </Alert>
                    </Collapse>

                    <MethodFields
                        onChange={onChange}
                        methodTests={data?.method_tests || []}
                        error={errors?.method_tests}
                        name="method_tests"
                        type={data.type}
                        label={data.type === '3' ? "Tests" : "Methods"}
                    />
                </Box>
            </Paper>

            <Box sx={{mt: 3, display: 'flex', justifyContent: 'space-between'}}>
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setActiveTab(data.type === '1' ? 1 : 0)}
                    startIcon={<ArrowBack/>}
                >
                    Back
                </Button>

                <Box><Button
                    variant="contained"
                    color="primary"
                    onClick={() => setActiveTab(3)}
                    endIcon={<ArrowForward/>}
                >
                    Next: Description
                </Button>
                    {edit ? <Button
                        variant="contained"
                        color="success"
                        sx={{ml: 1}}
                        onClick={handleSubmit}
                        startIcon={<Save/>}
                    >
                        Update
                    </Button> : null}
                </Box>
            </Box>
        </Box>
    );

    // Render description tab
    const renderDescriptionTab = () => (
        <Box sx={{p: {xs: 1, sm: 2}}}>
            <Paper elevation={0} variant="outlined" sx={{p: 3, mb: 3}}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Description color="primary"/>
                    <Typography variant="h6" sx={{ml: 1}}>
                        Description & Notes
                    </Typography>
                </Box>

                <Box sx={{position: 'relative'}}>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <Typography variant="subtitle1">
                            Additional Information
                        </Typography>
                        <Tooltip title="Show help">
                            <IconButton
                                size="small"
                                onClick={() => toggleHelp('description')}
                                sx={{ml: 1}}
                            >
                                <Help fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Collapse in={Boolean(helpVisible.description)}>
                        <Alert
                            severity="info"
                            sx={{mb: 2}}
                            onClose={() => toggleHelp('description')}
                        >
                            {getHelpText('description')}
                        </Alert>
                    </Collapse>

                    <Editor
                        value={data?.description || ''}
                        name="description"
                        onChange={handleChange}
                    />
                </Box>
            </Paper>

            <Box sx={{mt: 3, display: 'flex', justifyContent: 'space-between'}}>
                <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setActiveTab(2)}
                    startIcon={<ArrowBack/>}
                >
                    Back
                </Button>

                <Button
                    variant="contained"
                    color="success"
                    onClick={handleSubmit}
                    startIcon={<Save/>}
                >
                    {edit ? "Update" : "Create"} {getTestTypeLabel()}
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{maxWidth: 1200, mx: 'auto'}}>
            <PageHeader
                title={`${edit ? "Edit" : "Add New"} ${getTestTypeLabel()}`}
                sx={{mb: 3}}
            />

            <Paper sx={{mb: 4}}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons={isMobile ? "auto" : false}
                    sx={{borderBottom: 1, borderColor: 'divider'}}
                >
                    <Tab
                        icon={<Assignment/>}
                        label={isMobile ? null : "Basic Information"}
                        iconPosition="start"
                    />
                    {data.type === 'TEST' && (
                        <Tab
                            icon={<Biotech/>}
                            label={isMobile ? null : "Sample Types"}
                            iconPosition="start"
                        />
                    )}
                    {data.type === 'PANEL' && (
                        <Tab
                            icon={<Money/>}
                            label={isMobile ? null : "Price"}
                            iconPosition="start"
                        />
                    )}
                    <Tab
                        icon={data.type === 'PANEL' ? <ViewInAr/> : <Science/>}
                        label={isMobile ? null : (data.type === 'PANEL' ? "Tests" : "Methods")}
                        iconPosition="start"
                    />
                    <Tab
                        icon={<Description/>}
                        label={isMobile ? null : "Description"}
                        iconPosition="start"
                    />
                </Tabs>

                {activeTab === 0 && renderBasicInfoTab()}
                {activeTab === 1 && (data.type === 'TEST' ? renderSampleTypesTab() : data.type === "SERVICE" ? renderMethodsTab() : renderPriceTab())}
                {activeTab === 2 && (data.type === 'SERVICE' ? renderDescriptionTab() : renderMethodsTab())}
                {activeTab === 3 && renderDescriptionTab()}
            </Paper>
        </Box>
    );
}
