import SelectSearch from '@/Components/SelectSearch';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import FormHelperText from '@mui/material/FormHelperText';

import ScienceIcon from '@mui/icons-material/Science';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

const AddTestModal = ({
    open,
    modalStep,
    testType,
    currentTest,
    currentMethod,
    currentSampleType,
    panelSampleTypes,
    currentPrice,
    loadingTestDetails,
    defaultReferrer,
    onClose,
    onTestTypeChange,
    onTestSelect,
    onModalStepChange,
    onSelectMethod,
    onSampleTypeChange,
    onPanelSampleTypeChange,
    onPriceChange,
    onAddTest,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', p: 2 }}>
            <Box display="flex" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" sx={{ alignItems: 'center' }}>
                    <ScienceIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="span">
                        Add Test
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
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
                                    onChange={onTestTypeChange}
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
                                    url={route('api.tests.list')}
                                    defaultData={{
                                        type: testType,
                                        status: true,
                                        ...(defaultReferrer?.id && {
                                            referrer: {
                                                id: defaultReferrer.id,
                                            },
                                        }),
                                    }}
                                    onChange={onTestSelect}
                                    name="test"
                                    helperText="Search and select test to add"
                                    disableFirst={true}
                                />
                            </Grid>
                        )}
                    </Grid>

                    {loadingTestDetails && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mt: 3,
                            }}
                        >
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
                                    <strong>Panel Test:</strong> This panel includes multiple tests.
                                    Please select sample type for each test.
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
                                        <Typography
                                            variant="body1"
                                            fontWeight="medium"
                                            color="primary"
                                        >
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
                                                <TableCell>
                                                    <strong>Test Name</strong>
                                                </TableCell>
                                                <TableCell>
                                                    <strong>Sample Type</strong>
                                                </TableCell>
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
                                                        {methodTest.method?.test?.sample_types &&
                                                        methodTest.method.test.sample_types.length >
                                                            0 ? (
                                                            <FormControl fullWidth size="small">
                                                                <Select
                                                                    value={
                                                                        panelSampleTypes[
                                                                            methodTest.id
                                                                        ] || ''
                                                                    }
                                                                    onChange={(e) =>
                                                                        onPanelSampleTypeChange(
                                                                            methodTest.id,
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    displayEmpty
                                                                >
                                                                    <MenuItem value="">
                                                                        <em>Select Sample Type</em>
                                                                    </MenuItem>
                                                                    {methodTest.method.test.sample_types.map(
                                                                        (sampleType) => (
                                                                            <MenuItem
                                                                                key={sampleType.id}
                                                                                value={sampleType.id}
                                                                            >
                                                                                {sampleType.name}
                                                                            </MenuItem>
                                                                        ),
                                                                    )}
                                                                </Select>
                                                            </FormControl>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                color="text.secondary"
                                                            >
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
                        {(testType === 'TEST' || testType === 'SERVICE') &&
                            currentTest.method_tests &&
                            currentTest.method_tests.length > 0 && (
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
                                                        <TableCell align="center">
                                                            Turnaround Time
                                                        </TableCell>
                                                        <TableCell align="center">Price</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {currentTest.method_tests.map((method) => (
                                                        <TableRow
                                                            key={method.id}
                                                            hover
                                                            onClick={() =>
                                                                onSelectMethod(method)
                                                            }
                                                            selected={
                                                                currentMethod?.id === method.id
                                                            }
                                                            sx={{
                                                                cursor: 'pointer',
                                                                '&.Mui-selected': {
                                                                    backgroundColor: 'primary.light',
                                                                },
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Typography
                                                                    fontWeight={
                                                                        currentMethod?.id ===
                                                                        method.id
                                                                            ? 'medium'
                                                                            : 'normal'
                                                                    }
                                                                >
                                                                    {method.method?.name ||
                                                                        method.name}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {method.method?.turnaround_time ||
                                                                    method.turnaround_time ||
                                                                    '-'}{' '}
                                                                days
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography fontWeight="medium">
                                                                    {method.price ||
                                                                        method.method?.price ||
                                                                        0}{' '}
                                                                    OMR
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
                        {testType === 'TEST' &&
                            currentMethod &&
                            currentMethod.method?.test?.sample_types &&
                            currentMethod.method.test.sample_types.length > 0 && (
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
                                                onChange={(e) =>
                                                    onSampleTypeChange(e.target.value)
                                                }
                                                label="Select Sample Type"
                                            >
                                                {currentMethod.method.test.sample_types.map(
                                                    (sampleType) => (
                                                        <MenuItem
                                                            key={sampleType.id}
                                                            value={sampleType.id}
                                                        >
                                                            {sampleType.name}
                                                        </MenuItem>
                                                    ),
                                                )}
                                            </Select>
                                            <FormHelperText>
                                                Type of biological sample to collect
                                            </FormHelperText>
                                        </FormControl>
                                    </Grid>
                                </>
                            )}

                        {/* No methods available message */}
                        {(testType === 'TEST' || testType === 'SERVICE') &&
                            (!currentTest.method_tests ||
                                currentTest.method_tests.length === 0) && (
                                <Grid size={{ xs: 12 }}>
                                    <Alert severity="warning">
                                        <Typography variant="body2">
                                            No methods are configured for this{' '}
                                            {testType.toLowerCase()}. Please contact administration.
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
                                onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                OMR
                                            </Typography>
                                        ),
                                    },
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
                    onClick={() => onModalStepChange(0)}
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                >
                    Back
                </Button>
            ) : (
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
            )}

            {modalStep === 0 ? (
                <Button
                    onClick={() => onModalStepChange(1)}
                    variant="contained"
                    disabled={!currentTest}
                    endIcon={<ArrowForwardIcon />}
                >
                    Continue
                </Button>
            ) : (
                <Button
                    onClick={onAddTest}
                    variant="contained"
                    disabled={
                        !currentTest ||
                        ((testType === 'TEST' || testType === 'SERVICE') && !currentMethod) ||
                        (testType === 'TEST' &&
                            currentMethod &&
                            currentMethod.method?.test?.sample_types?.length > 0 &&
                            !currentSampleType)
                    }
                    startIcon={<CheckIcon />}
                >
                    Add Test
                </Button>
            )}
        </DialogActions>
    </Dialog>
);

export default AddTestModal;
