import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader.jsx";
import { useForm } from "@inertiajs/react";
import { useState } from "react";
import * as XLSX from 'xlsx';
import countries from "@/Data/Countries";
import SelectSearch from "@/Components/SelectSearch";

// Material UI imports
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Autocomplete from "@mui/material/Autocomplete";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import FormHelperText from "@mui/material/FormHelperText";

// Material UI icons
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MappingIcon from "@mui/icons-material/Transform";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SettingsIcon from "@mui/icons-material/Settings";
import ScienceIcon from "@mui/icons-material/Science";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";

const Create = ({ success, error, patientFields }) => {
    const { data, setData, post, processing, errors } = useForm({
        file: null,
        has_header: true,
        column_mapping: {},
        default_values: {
            research: false,
            nationality: null,
            gender: '',
            tribe: '',
            wilayat: '',
            village: '',
            referrer: null
        },
        tests: []
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [step, setStep] = useState(1); // 1: upload, 2: mapping, 3: test selection
    const [selectedTests, setSelectedTests] = useState([]);
    const [testType, setTestType] = useState('');
    const [loadingTestDetails, setLoadingTestDetails] = useState(false);
    const [testModalOpen, setTestModalOpen] = useState(false);
    const [currentTest, setCurrentTest] = useState(null);
    const [currentMethod, setCurrentMethod] = useState(null);
    const [currentSampleType, setCurrentSampleType] = useState('');
    const [panelSampleTypes, setPanelSampleTypes] = useState({}); // For panel: {testMethodId: sampleTypeId}
    const [currentPrice, setCurrentPrice] = useState(0);
    const [modalStep, setModalStep] = useState(0); // 0: select test, 1: configure

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setData('file', file);
            setPreviewData(null);
            setStep(1);
        }
    };

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target.result;
                    const workbook = XLSX.read(data, { type: 'binary' });

                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to array of arrays
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: null
                    });

                    resolve(jsonData);
                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (err) => reject(err);
            reader.readAsBinaryString(file);
        });
    };

    const handlePreview = async () => {
        if (!selectedFile) return;

        setLoadingPreview(true);

        try {
            const excelData = await readExcelFile(selectedFile);

            if (!excelData || excelData.length === 0) {
                alert('The Excel file is empty');
                setLoadingPreview(false);
                return;
            }

            let columns = [];
            let preview = [];
            let totalRows = 0;

            if (data.has_header) {
                // First row is headers
                columns = excelData[0] || [];
                // Get preview of first 5 rows (excluding header)
                preview = excelData.slice(1, 6);
                totalRows = excelData.length - 1;
            } else {
                // Generate column names (Column 1, Column 2, etc.)
                const columnCount = excelData[0]?.length || 0;
                for (let i = 0; i < columnCount; i++) {
                    columns.push(`Column ${i + 1}`);
                }
                // Get preview of first 5 rows
                preview = excelData.slice(0, 5);
                totalRows = excelData.length;
            }

            setPreviewData({
                columns,
                preview,
                totalRows
            });

            // Initialize column mapping
            const initialMapping = {};
            columns.forEach((col, index) => {
                initialMapping[index] = '';
            });
            setData('column_mapping', initialMapping);
            setStep(2);

        } catch (err) {
            console.error('Error reading Excel file:', err);
            alert('Error reading Excel file: ' + err.message);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('import.store'), {
            forceFormData: true,
        });
    };

    const handleReset = () => {
        setSelectedFile(null);
        setData({
            file: null,
            has_header: true,
            column_mapping: {},
            default_values: {
                research: false,
                nationality: null,
                gender: '',
                tribe: '',
                wilayat: '',
                village: '',
                referrer: null
            }
        });
        setPreviewData(null);
        setStep(1);
    };

    const handleCheckboxChange = (e) => {
        setData('has_header', e.target.checked);
        setPreviewData(null);
        setStep(1);
    };

    const handleMappingChange = (columnIndex, patientField) => {
        setData('column_mapping', {
            ...data.column_mapping,
            [columnIndex]: patientField
        });
    };

    const handleDefaultValueChange = (field, value) => {
        setData('default_values', {
            ...data.default_values,
            [field]: value
        });
    };

    const handleTestTypeChange = (e) => {
        setTestType(e.target.value);
        setCurrentTest(null);
        setCurrentMethod(null);
    };

    const handleOpenTestModal = () => {
        setTestModalOpen(true);
        setTestType('');
        setCurrentTest(null);
        setCurrentMethod(null);
        setCurrentSampleType('');
        setPanelSampleTypes({});
        setCurrentPrice(0);
        setModalStep(0);
    };

    const handleCloseTestModal = () => {
        setTestModalOpen(false);
        setTestType('');
        setCurrentTest(null);
        setCurrentMethod(null);
        setCurrentSampleType('');
        setPanelSampleTypes({});
        setCurrentPrice(0);
        setModalStep(0);
    };

    const fetchTestDetails = async (testId) => {
        setLoadingTestDetails(true);
        try {
            const params = data.default_values?.referrer?.id
                ? { referrer: { id: data.default_values.referrer.id } }
                : {};

            const response = await window.axios.get(route("api.tests.show", testId), { params });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching test details:', error);
            return null;
        } finally {
            setLoadingTestDetails(false);
        }
    };

    const handleTestSelect = async (e) => {
        const selected = e.target.value;
        if (!selected || !selected.id) return;

        const testDetails = await fetchTestDetails(selected.id);
        if (!testDetails) return;

        setCurrentTest(testDetails);

        // For panels, set default values
        if (testType === 'PANEL') {
            setCurrentMethod(null);
            setCurrentPrice(testDetails.price || 0);
        } else {
            // For TEST and SERVICE, set first method as default
            const methodTests = testDetails.method_tests || [];
            if (methodTests.length > 0) {
                setCurrentMethod(methodTests[0]);
                setCurrentPrice(methodTests[0].price || 0);
            } else {
                setCurrentMethod(null);
                setCurrentPrice(testDetails.price || 0);
            }
        }
    };

    const handleAddTestToList = () => {
        if (!currentTest) return;

        const newTest = {
            test: currentTest,
            method: currentMethod,
            type: testType,
            price: currentPrice,
            sampleType: currentSampleType || null,
            panelSampleTypes: testType === 'PANEL' ? panelSampleTypes : null
        };

        setSelectedTests([...selectedTests, newTest]);
        setData('tests', [...data.tests, newTest]);

        // Close modal and reset
        handleCloseTestModal();
    };

    const handleMethodSelect = (testIndex, methodData) => {
        const updatedTests = [...selectedTests];
        updatedTests[testIndex] = {
            ...updatedTests[testIndex],
            method: methodData.method,
            price: methodData.price
        };
        setSelectedTests(updatedTests);
        setData('tests', updatedTests);
    };

    const handleRemoveTest = (index) => {
        const updated = selectedTests.filter((_, i) => i !== index);
        setSelectedTests(updated);
        setData('tests', updated);
    };

    return (
        <Box sx={{ position: 'relative' }}>
            <PageHeader
                title="Import Excel File"
                subtitle="Upload and import patient data from Excel files"
                icon={<UploadFileIcon fontSize="large" sx={{ mr: 2 }} />}
            />

            <Paper
                elevation={2}
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    p: 4,
                    maxWidth: step === 1 ? 800 : (step === 3 ? 1000 : 1200),
                    mx: 'auto',
                    mt: 4
                }}
            >
                {success && (
                    <Alert
                        severity="success"
                        sx={{ mb: 3 }}
                        icon={<CheckCircleIcon />}
                    >
                        {success}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Step 1: File Upload */}
                    {step === 1 && (
                        <>
                            <Box
                                sx={{
                                    border: '2px dashed',
                                    borderColor: errors.file ? 'error.main' : 'divider',
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: 'center',
                                    backgroundColor: 'background.default',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        backgroundColor: 'action.hover',
                                    }
                                }}
                            >
                                <input
                                    accept=".xlsx,.xls,.csv"
                                    style={{ display: 'none' }}
                                    id="file-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="file-upload">
                                    <Box sx={{ cursor: 'pointer' }}>
                                        <CloudUploadIcon
                                            sx={{
                                                fontSize: 64,
                                                color: 'primary.main',
                                                mb: 2
                                            }}
                                        />
                                        <Typography variant="h6" gutterBottom>
                                            Click to upload Excel file
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Supported formats: .xlsx, .xls, .csv
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                            Maximum file size: 10MB
                                        </Typography>
                                    </Box>
                                </label>

                                {selectedFile && (
                                    <Box sx={{ mt: 3 }}>
                                        <Chip
                                            icon={<InsertDriveFileIcon />}
                                            label={selectedFile.name}
                                            onDelete={handleReset}
                                            color="primary"
                                            variant="outlined"
                                            sx={{ maxWidth: '100%' }}
                                        />
                                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                            Size: {(selectedFile.size / 1024).toFixed(2)} KB
                                        </Typography>
                                    </Box>
                                )}

                                {errors.file && (
                                    <Alert severity="error" sx={{ mt: 2 }}>
                                        {errors.file}
                                    </Alert>
                                )}
                            </Box>

                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={data.has_header}
                                            onChange={handleCheckboxChange}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="body1">
                                            First row contains headers
                                        </Typography>
                                    }
                                />
                            </Box>

                            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    disabled={!selectedFile || loadingPreview}
                                    onClick={handlePreview}
                                    startIcon={loadingPreview ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {loadingPreview ? 'Loading...' : 'Next: Map Columns'}
                                </Button>

                                {selectedFile && !loadingPreview && (
                                    <Button
                                        variant="outlined"
                                        onClick={handleReset}
                                        sx={{
                                            px: 4,
                                            py: 1.5,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Box>
                        </>
                    )}

                    {/* Step 2: Column Mapping */}
                    {step === 2 && previewData && (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    <MappingIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Map Excel Columns to Patient Fields
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Total rows: {previewData.totalRows}
                                </Typography>
                            </Box>

                            <TableContainer sx={{ maxHeight: 500 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                                                Excel Column
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                                                Sample Data
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                                                Maps To Patient Field
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {previewData.columns.map((column, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {column}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        {previewData.preview.slice(0, 3).map((row, rowIndex) => (
                                                            <Typography
                                                                key={rowIndex}
                                                                variant="caption"
                                                                display="block"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    fontStyle: 'italic'
                                                                }}
                                                            >
                                                                {row[index] || '-'}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Select Field</InputLabel>
                                                        <Select
                                                            value={data.column_mapping[index] || ''}
                                                            onChange={(e) => handleMappingChange(index, e.target.value)}
                                                            label="Select Field"
                                                        >
                                                            <MenuItem value="">
                                                                <em>Skip this column</em>
                                                            </MenuItem>
                                                            {patientFields.map((field) => (
                                                                <MenuItem key={field.value} value={field.value}>
                                                                    {field.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {errors.column_mapping && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {errors.column_mapping}
                                </Alert>
                            )}

                            {/* Default Values Section */}
                            <Card sx={{ mt: 4 }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                        <SettingsIcon sx={{ mr: 1 }} />
                                        Set Default Values for All Records
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                        These values will be applied to all imported records
                                    </Typography>

                                    <Divider sx={{ mb: 3 }} />

                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={data.default_values?.research || false}
                                                        onChange={(e) => handleDefaultValueChange('research', e.target.checked)}
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="body1">Research Patient</Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Mark all patients as research participants
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <Autocomplete
                                                fullWidth
                                                size="small"
                                                options={countries}
                                                value={data.default_values?.nationality || null}
                                                onChange={(e, newValue) => handleDefaultValueChange('nationality', newValue)}
                                                autoHighlight
                                                getOptionLabel={(option) => option?.label || ''}
                                                renderOption={(props, option) => (
                                                    <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                                                        <img
                                                            loading="lazy"
                                                            width="20"
                                                            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                                                            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                                                            alt=""
                                                        />
                                                        {option.label} ({option.code})
                                                    </Box>
                                                )}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Default Nationality"
                                                        placeholder="Select nationality"
                                                        helperText="Leave empty if nationality is in Excel or not needed"
                                                    />
                                                )}
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Default Gender</InputLabel>
                                                <Select
                                                    value={data.default_values?.gender || ''}
                                                    onChange={(e) => handleDefaultValueChange('gender', e.target.value)}
                                                    label="Default Gender"
                                                >
                                                    <MenuItem value="">
                                                        <em>No Default</em>
                                                    </MenuItem>
                                                    <MenuItem value="male">Male</MenuItem>
                                                    <MenuItem value="female">Female</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Default Tribe"
                                                value={data.default_values?.tribe || ''}
                                                onChange={(e) => handleDefaultValueChange('tribe', e.target.value)}
                                                size="small"
                                                helperText="Leave empty if not applicable"
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Default Wilayat"
                                                value={data.default_values?.wilayat || ''}
                                                onChange={(e) => handleDefaultValueChange('wilayat', e.target.value)}
                                                size="small"
                                                helperText="Leave empty if not applicable"
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <TextField
                                                fullWidth
                                                label="Default Village"
                                                value={data.default_values?.village || ''}
                                                onChange={(e) => handleDefaultValueChange('village', e.target.value)}
                                                size="small"
                                                helperText="Leave empty if not applicable"
                                            />
                                        </Grid>

                                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                            <SelectSearch
                                                name="referrer"
                                                value={data.default_values?.referrer || null}
                                                label="Default Referrer"
                                                fullWidth
                                                size="small"
                                                url={route("api.referrers.list")}
                                                onChange={(e) => handleDefaultValueChange('referrer', e.target.value)}
                                                helperText="Select default referring facility/doctor for all patients"
                                            />
                                        </Grid>
                                    </Grid>

                                    <Alert severity="info" sx={{ mt: 3 }}>
                                        <Typography variant="body2">
                                            <strong>Note:</strong> Default values will only be used when the Excel file doesn't contain data for these fields.
                                            If you map an Excel column to a field, the Excel data will take priority.
                                        </Typography>
                                    </Alert>
                                </CardContent>
                            </Card>

                            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setStep(1)}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => setStep(3)}
                                    startIcon={<ArrowForwardIcon />}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    Next: Select Tests
                                </Button>
                            </Box>
                        </>
                    )}

                    {/* Step 3: Test Selection */}
                    {step === 3 && (
                        <>
                            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        <ScienceIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                        Tests for Patients
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Add tests or panels that will be assigned to all imported patients
                                    </Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenTestModal}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                    }}
                                >
                                    Add Test
                                </Button>
                            </Box>

                            {/* Empty State */}
                            {selectedTests.length === 0 && (
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Box sx={{ textAlign: 'center', py: 6 }}>
                                            <ScienceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                                No Tests Added
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                                Click "Add Test" button to select tests for your patients
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AddIcon />}
                                                onClick={handleOpenTestModal}
                                            >
                                                Add Your First Test
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Selected Tests List */}
                            {selectedTests.length > 0 && (
                                <Card sx={{ mb: 3 }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                            Selected Tests ({selectedTests.length})
                                        </Typography>
                                        <List>
                                            {selectedTests.map((test, index) => (
                                                <Box key={index} sx={{ mb: 2 }}>
                                                    <ListItem
                                                        secondaryAction={
                                                            <IconButton edge="end" onClick={() => handleRemoveTest(index)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        }
                                                        sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}
                                                    >
                                                        <ListItemText
                                                            primary={test.test?.name}
                                                            secondary={
                                                                <>
                                                                    <Typography component="span" variant="body2" display="block">
                                                                        Type: {test.type}
                                                                    </Typography>
                                                                    {test.method && (
                                                                        <Typography component="span" variant="body2" display="block">
                                                                            Method: {test.method.method?.name || test.method.name || 'N/A'}
                                                                        </Typography>
                                                                    )}
                                                                    {test.sampleType && (
                                                                        <Typography component="span" variant="body2" display="block">
                                                                            Sample Type: {test.sampleType}
                                                                        </Typography>
                                                                    )}
                                                                </>
                                                            }
                                                        />
                                                    </ListItem>

                                                    {/* Price Input */}
                                                    <Box sx={{ pl: 2, pr: 7, pt: 1, pb: 1 }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            type="number"
                                                            label="Price"
                                                            value={test.price}
                                                            onChange={(e) => {
                                                                const updatedTests = [...selectedTests];
                                                                updatedTests[index] = {
                                                                    ...updatedTests[index],
                                                                    price: parseFloat(e.target.value) || 0
                                                                };
                                                                setSelectedTests(updatedTests);
                                                                setData('tests', updatedTests);
                                                            }}
                                                            InputProps={{
                                                                endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>OMR</Typography>
                                                            }}
                                                        />
                                                    </Box>

                                                    {/* Method Selection for TEST and SERVICE */}
                                                    {(test.type === 'TEST' || test.type === 'SERVICE') && test.test?.method_tests && test.test.method_tests.length > 1 && (
                                                        <Box sx={{ pl: 2, pr: 7, pt: 1 }}>
                                                            <FormControl fullWidth size="small">
                                                                <InputLabel>Select Method</InputLabel>
                                                                <Select
                                                                    value={test.method?.id || ''}
                                                                    onChange={(e) => {
                                                                        const method = test.test.method_tests.find(m => m.id === e.target.value);
                                                                        handleMethodSelect(index, { method, price: method.price });
                                                                    }}
                                                                    label="Select Method"
                                                                >
                                                                    {test.test.method_tests.map((method) => (
                                                                        <MenuItem key={method.id} value={method.id}>
                                                                            {method.method?.name || method.name} - {method.price} OMR
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </List>
                                    </CardContent>
                                </Card>
                            )}

                            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => setStep(2)}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={processing || selectedTests.length === 0}
                                    startIcon={processing ? <CircularProgress size={20} /> : <UploadFileIcon />}
                                    sx={{
                                        px: 4,
                                        py: 1.5,
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {processing ? 'Importing...' : 'Import Patients with Tests'}
                                </Button>
                            </Box>
                        </>
                    )}
                </form>

                {step === 1 && (
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" gutterBottom color="textSecondary">
                            Instructions:
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="div">
                            <ul style={{ paddingLeft: 20, margin: 0 }}>
                                <li>Select an Excel file (.xlsx, .xls) or CSV file</li>
                                <li>File size should not exceed 10MB</li>
                                <li>Check "First row contains headers" if your Excel has column headers</li>
                                <li>Click "Next" to map Excel columns to patient fields</li>
                            </ul>
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Test Selector Modal */}
            <Dialog
                open={testModalOpen}
                onClose={handleCloseTestModal}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', p: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                            <ScienceIcon sx={{ mr: 2 }} />
                            <Typography variant="h6">Add Test</Typography>
                        </Box>
                        <IconButton onClick={handleCloseTestModal} sx={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                {/* Stepper */}
                <Box sx={{ width: '100%', px: 3, pt: 3 }}>
                    <Stepper activeStep={modalStep} alternativeLabel>
                        <Step>
                            <StepLabel>Select Test</StepLabel>
                        </Step>
                        <Step>
                            <StepLabel>Configure</StepLabel>
                        </Step>
                    </Stepper>
                </Box>

                <DialogContent sx={{ p: 3 }}>
                    {/* Step 1: Select Test */}
                    {modalStep === 0 && (
                        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Select Test Type and Test
                            </Typography>

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Test Type</InputLabel>
                                        <Select
                                            value={testType}
                                            onChange={handleTestTypeChange}
                                            label="Test Type"
                                        >
                                            <MenuItem value="">
                                                <em>Select Type</em>
                                            </MenuItem>
                                            <MenuItem value="PANEL">Panel</MenuItem>
                                            <MenuItem value="TEST">Test</MenuItem>
                                            <MenuItem value="SERVICE">Service</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {testType && (
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <SelectSearch
                                            value={null}
                                            label={`Select ${testType === 'PANEL' ? 'Panel' : testType === 'SERVICE' ? 'Service' : 'Test'}`}
                                            fullWidth
                                            url={route("api.tests.list")}
                                            defaultData={{
                                                type: testType,
                                                status: true,
                                                ...(data.default_values?.referrer?.id && {
                                                    referrer: { id: data.default_values.referrer.id }
                                                })
                                            }}
                                            onChange={handleTestSelect}
                                            name="test"
                                            helperText="Search and select test to add"
                                            disableFirst={true}
                                        />
                                    </Grid>
                                )}
                            </Grid>

                            {loadingTestDetails && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3 }}>
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    <Typography variant="body2">Loading test details...</Typography>
                                </Box>
                            )}

                            {currentTest && !loadingTestDetails && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                        Test Details
                                    </Typography>
                                    <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Name
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {currentTest.name}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Code
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {currentTest.code}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Box>
                            )}
                        </Paper>
                    )}

                    {/* Step 2: Configure Method and Sample Type */}
                    {modalStep === 1 && currentTest && (
                        <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                Configure Test Parameters
                            </Typography>

                            {/* Panel Information */}
                            {testType === 'PANEL' && (
                                <Box sx={{ mt: 2 }}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <Typography variant="body2">
                                            <strong>Panel Test:</strong> This panel includes multiple tests. Please select sample type for each test.
                                        </Typography>
                                    </Alert>

                                    {/* Panel Details */}
                                    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Panel Name
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {currentTest.name}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Price
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium" color="primary">
                                                    {currentTest.price || 0} OMR
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>

                                    {/* Test Methods List */}
                                    {currentTest.method_tests && currentTest.method_tests.length > 0 ? (
                                        <TableContainer component={Paper} elevation={1}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><strong>Test Name</strong></TableCell>
                                                        <TableCell><strong>Sample Type</strong></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {currentTest.method_tests.map((methodTest, index) => (
                                                        <TableRow key={index} hover>
                                                            <TableCell>
                                                                <Typography variant="body2">
                                                                    {methodTest.method?.test?.name || 'N/A'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ width: '50%' }}>
                                                                {methodTest.method?.test?.sample_types && methodTest.method.test.sample_types.length > 0 ? (
                                                                    <FormControl fullWidth size="small">
                                                                        <Select
                                                                            value={panelSampleTypes[methodTest.id] || ''}
                                                                            onChange={(e) => {
                                                                                setPanelSampleTypes(prev => ({
                                                                                    ...prev,
                                                                                    [methodTest.id]: e.target.value
                                                                                }));
                                                                            }}
                                                                            displayEmpty
                                                                        >
                                                                            <MenuItem value="">
                                                                                <em>Select Sample Type</em>
                                                                            </MenuItem>
                                                                            {methodTest.method.test.sample_types.map((sampleType) => (
                                                                                <MenuItem key={sampleType.id} value={sampleType.id}>
                                                                                    {sampleType.name}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                ) : (
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        No sample types available
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Alert severity="warning">
                                            No test methods found in this panel.
                                        </Alert>
                                    )}
                                </Box>
                            )}

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                {/* Method Selection for TEST and SERVICE */}
                                {(testType === 'TEST' || testType === 'SERVICE') && currentTest.method_tests && currentTest.method_tests.length > 0 && (
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Method Selection
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <TableContainer component={Paper}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Method Name</TableCell>
                                                            <TableCell align="center">Turnaround Time</TableCell>
                                                            <TableCell align="center">Price</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {currentTest.method_tests.map((method) => (
                                                            <TableRow
                                                                key={method.id}
                                                                hover
                                                                onClick={() => {
                                                                    setCurrentMethod(method);
                                                                    setCurrentPrice(method.price || 0);
                                                                }}
                                                                selected={currentMethod?.id === method.id}
                                                                sx={{
                                                                    cursor: 'pointer',
                                                                    '&.Mui-selected': {
                                                                        backgroundColor: 'primary.light',
                                                                    }
                                                                }}
                                                            >
                                                                <TableCell>
                                                                    <Typography fontWeight={currentMethod?.id === method.id ? 'medium' : 'normal'}>
                                                                        {method.method?.name || method.name}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {method.method?.turnaround_time || method.turnaround_time || '-'} days
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Typography fontWeight="medium">
                                                                        {method.price || method.method?.price || 0} OMR
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>
                                    </>
                                )}

                                {/* Sample Type Selection (only for TEST, not PANEL or SERVICE) */}
                                {testType === 'TEST' && currentMethod && currentMethod.method?.test?.sample_types && currentMethod.method.test.sample_types.length > 0 && (
                                    <>
                                        <Grid size={{ xs: 12 }}>
                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                                Sample Type
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12 }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Select Sample Type</InputLabel>
                                                <Select
                                                    value={currentSampleType}
                                                    onChange={(e) => setCurrentSampleType(e.target.value)}
                                                    label="Select Sample Type"
                                                >
                                                    {currentMethod.method.test.sample_types.map((sampleType) => (
                                                        <MenuItem key={sampleType.id} value={sampleType.id}>
                                                            {sampleType.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                                <FormHelperText>Type of biological sample to collect</FormHelperText>
                                            </FormControl>
                                        </Grid>
                                    </>
                                )}

                                {/* No methods available message */}
                                {(testType === 'TEST' || testType === 'SERVICE') && (!currentTest.method_tests || currentTest.method_tests.length === 0) && (
                                    <Grid size={{ xs: 12 }}>
                                        <Alert severity="warning">
                                            <Typography variant="body2">
                                                No methods are configured for this {testType.toLowerCase()}. Please contact administration.
                                            </Typography>
                                        </Alert>
                                    </Grid>
                                )}

                                {/* Price Input - Always show in configure step */}
                                <Grid size={{ xs: 12 }}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        Price
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Test Price"
                                        value={currentPrice}
                                        onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                                        InputProps={{
                                            endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>OMR</Typography>
                                        }}
                                        helperText="You can modify the test price"
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                    {modalStep > 0 ? (
                        <Button
                            onClick={() => setModalStep(0)}
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                        >
                            Back
                        </Button>
                    ) : (
                        <Button onClick={handleCloseTestModal} variant="outlined">
                            Cancel
                        </Button>
                    )}

                    {modalStep === 0 ? (
                        <Button
                            onClick={() => setModalStep(1)}
                            variant="contained"
                            disabled={!currentTest}
                            endIcon={<ArrowForwardIcon />}
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAddTestToList}
                            variant="contained"
                            disabled={
                                !currentTest ||
                                ((testType === 'TEST' || testType === 'SERVICE') && !currentMethod) ||
                                (testType === 'TEST' && currentMethod && currentMethod.method?.test?.sample_types?.length > 0 && !currentSampleType)
                            }
                            startIcon={<CheckIcon />}
                        >
                            Add Test
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const breadCrumbs = [
    {
        title: "Dashboard",
        link: route('dashboard'),
        icon: null
    },
    {
        title: "Import",
        link: null,
        icon: <UploadFileIcon fontSize="small" />
    }
];

Create.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Create;
