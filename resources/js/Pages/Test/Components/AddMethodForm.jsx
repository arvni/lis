import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    TextField,
    Stepper,
    Step,
    StepLabel,
    Box,
    Paper,
    Typography,
    Divider,
    Alert,
    Tooltip,
    IconButton, Tab
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import SelectSearch from "@/Components/SelectSearch";
import React, { useState, useEffect } from "react";
import ParametersField from "@/Components/ParametersField";
import ConditionsField from "@/Components/ConditionsField";
import FormulaConditionTester from "@/Components/FormulaTester";
import {
    Save,
    NavigateNext,
    NavigateBefore,
    Refresh,
    Help,
    CurrencyExchange
} from "@mui/icons-material";
import {TabContext, TabList, TabPanel} from "@mui/lab";


const TEST_TYPES={
    TEST:'TEST',
    SERVICE:'SERVICE',
    PANEL:'PANEL'
}



const AddMethodForm = ({ method = {}, onChange, onSubmit, onClose, open, errors, type = '1' }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [methodData, setMethodData] = useState(method);

    // Initialize method data with defaults when the form opens
    useEffect(() => {
        if (open) {
            setMethodData({
                ...method,
                extra: method.extra || {},
                price_type: method.price_type || "Fix",
                price: method.price || 0,
                referrer_extra: method.referrer_extra || {},
                referrer_price_type: method.referrer_price_type || "Fix",
                referrer_price: method.referrer_price || 0
            });
        }
    }, [method, open]);

    const steps = [
        'Basic Information',
        'Pricing Configuration',
        'Test & Confirm'
    ];
    const [tab, setTab] = useState("1");
    const handleTabChange = (event, newValue) => {
        setTab(newValue);
    };

    const handleChange = (name, value) => {
        const updatedMethod = {
            ...methodData,
            [name]: value
        };
        setMethodData(updatedMethod);
        onChange(name, value);
    };

    const handleExtraChange = (e) => {
        const updatedExtra = {
            ...methodData.extra,
            [e.target.name]: e.target.value
        };
        setMethodData({
            ...methodData,
            extra: updatedExtra
        });
        onChange("extra", updatedExtra);
    };

    const handleReferrerExtraChange = (e) => {
        const updatedExtra = {
            ...methodData.referrer_extra,
            [e.target.name]: e.target.value
        };
        setMethodData({
            ...methodData,
            referrer_extra: updatedExtra
        });
        onChange("referrer_extra", updatedExtra);
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmitForm = () => {
        onSubmit();
    };

    const handleReset = () => {
        // Reset to default values or initial data
        setMethodData({
            ...method,
            extra: method.extra || {},
            price_type: method.price_type || "Fix",
            price: method.price || 0
        });
    };

    // Render different form content based on the active step
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid size={{xs:12,sm:6}}>
                            <TextField
                                name="name"
                                onChange={(e) => handleChange("name", e.target.value)}
                                value={methodData?.name || ""}
                                label="Method Title"
                                placeholder="Enter a descriptive name"
                                fullWidth
                                error={Boolean(errors?.name)}
                                helperText={errors?.name}
                            />
                        </Grid>

                        {type === TEST_TYPES.TEST ? (
                            <>
                                <Grid size={{xs:12,sm:6}}>
                                    <SelectSearch
                                        value={methodData?.workflow || ""}
                                        onChange={(e) => handleChange("workflow", e.target.value)}
                                        name="workflow"
                                        fullWidth
                                        label="Workflow"
                                        url={route('api.workflows.list')}
                                        error={Boolean(errors?.workflow)}
                                        helperText={errors?.workflow}
                                    />
                                </Grid>

                                <Grid size={{xs:12,sm:6}}>
                                    <SelectSearch
                                        value={methodData?.barcode_group || ""}
                                        onChange={(e) => handleChange("barcode_group", e.target.value)}
                                        name="barcode_group"
                                        fullWidth
                                        label="Barcode Group"
                                        url={route('api.barcodeGroups.list')}
                                        error={Boolean(errors?.barcode_group)}
                                        helperText={errors?.barcode_group}
                                    />
                                </Grid>

                                <Grid size={{xs:12,sm:6}}>
                                    <TextField
                                        type="number"
                                        value={methodData?.turnaround_time || ""}
                                        name="turnaround_time"
                                        label="Test Turnaround Time (Days)"
                                        placeholder="How many days to complete"
                                        onChange={(e) => handleChange("turnaround_time", e.target.value)}
                                        fullWidth
                                        error={Boolean(errors?.turnaround_time)}
                                        helperText={errors?.turnaround_time || "Number of days needed to complete the test"}
                                        slotProps={{
                                            Input: {
                                                inputProps: {min: 0}
                                            }
                                        }}
                                    />
                                </Grid>
                            </>
                        ) : null}

                        <Grid size={{xs:12,sm:6}}>
                            <TextField
                                type="number"
                                value={methodData?.no_patient || 0}
                                name="no_patient"
                                label="Number of Patients"
                                placeholder="Capacity per batch"
                                onChange={(e) => handleChange("no_patient", e.target.value)}
                                fullWidth
                                error={Boolean(errors?.no_patient)}
                                helperText={errors?.no_patient || "How many patients can be processed at once"}
                                slotProps={{
                                    Input: {
                                        inputProps: {min: 0}
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                );

            case 1:
                return (
                    <TabContext value={tab}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleTabChange} aria-label="Pricing Tabs">
                                <Tab label="Direct Patient Price" value="1" />
                                <Tab label="Referral Price" value="2" />
                            </TabList>
                        </Box>
                        <TabPanel value="1">
                            <Box sx={{ mt: 2 }}>
                                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        Price Type
                                        <Tooltip title="Choose how pricing will be calculated for this method">
                                            <IconButton size="small" sx={{ ml: 1 }}>
                                                <Help fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <FormControl fullWidth>
                                        <InputLabel id="price-type-select-label">Price Type</InputLabel>
                                        <Select
                                            labelId="price-type-select-label"
                                            id="price-type-select"
                                            value={methodData?.price_type || "Fix"}
                                            label="Price Type"
                                            name="price_type"
                                            onChange={(e) => handleChange("price_type", e.target.value)}
                                            startAdornment={<CurrencyExchange sx={{ mr: 1, ml: -0.5 }} />}
                                        >
                                            <MenuItem value="Fix">Fixed Price</MenuItem>
                                            <MenuItem value="Formulate">Formula-based Price</MenuItem>
                                            <MenuItem value="Conditional">Conditional Price</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {methodData?.price_type === "Fix" && (
                                        <Box sx={{ mt: 2 }}>
                                            <FormControl fullWidth>
                                                <InputLabel
                                                    error={Boolean(errors?.price)}
                                                    id="payment-method-label"
                                                    required
                                                >
                                                    Price
                                                </InputLabel>
                                                <OutlinedInput
                                                    fullWidth
                                                    type="number"
                                                    name="price"
                                                    label="Price"
                                                    value={methodData.price || 0}
                                                    error={Boolean(errors?.price)}
                                                    required
                                                    inputProps={{ min: 0, step: 0.001 }}
                                                    onChange={(e) => handleChange("price", e.target.value)}
                                                    endAdornment={<Typography variant="caption" sx={{ ml: 1 }}>OMR</Typography>}
                                                />
                                                {errors?.price && <FormHelperText error>{errors?.price}</FormHelperText>}
                                            </FormControl>
                                        </Box>
                                    )}

                                    {methodData?.price_type === "Formulate" && (
                                        <Box sx={{ mt: 3 }}>
                                            <ParametersField
                                                defaultValue={methodData?.extra?.parameters || []}
                                                onChange={handleExtraChange}
                                                name="parameters"
                                                errors={errors?.extra?.parameters}
                                            />

                                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    Price Formula
                                                    <Tooltip title="Define a mathematical formula using parameters. E.g: age * 0.5 + 10">
                                                        <IconButton size="small" sx={{ ml: 1 }}>
                                                            <Help fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Typography>
                                                <Divider sx={{ mb: 2 }} />

                                                <TextField
                                                    name="formula"
                                                    label="Formula"
                                                    placeholder="e.g. age * 0.5 + weight * 0.2 + 10"
                                                    onChange={handleExtraChange}
                                                    value={methodData?.extra?.formula || ""}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    helperText={errors?.["extra.formula"] || "Define a mathematical formula using the parameters you've added"}
                                                    error={Boolean(errors?.["extra.formula"])}
                                                />
                                            </Paper>
                                        </Box>
                                    )}

                                    {methodData?.price_type === "Conditional" && (
                                        <Box sx={{ mt: 3 }}>
                                            <ParametersField
                                                defaultValue={methodData?.extra?.parameters || []}
                                                onChange={handleExtraChange}
                                                name="parameters"
                                                errors={errors?.extra?.parameters}
                                            />

                                            <ConditionsField
                                                defaultValue={methodData?.extra?.conditions || []}
                                                onChange={handleExtraChange}
                                                name="conditions"
                                                errors={errors?.extra?.conditions}
                                                parameters={methodData?.extra?.parameters || []}
                                            />
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        </TabPanel>
                        <TabPanel value="2">
                            <Box sx={{ mt: 2 }}>
                                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        Referrer Price Type
                                        <Tooltip title="Choose how reffered test pricing will be calculated for this method">
                                            <IconButton size="small" sx={{ ml: 1 }}>
                                                <Help fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />

                                    <FormControl fullWidth>
                                        <InputLabel id="price-type-select-label">Price Type</InputLabel>
                                        <Select
                                            labelId="price-type-select-label"
                                            id="price-type-select"
                                            value={methodData?.referrer_price_type || "Fix"}
                                            label="Price Type"
                                            name="price_type"
                                            onChange={(e) => handleChange("referrer_price_type", e.target.value)}
                                            startAdornment={<CurrencyExchange sx={{ mr: 1, ml: -0.5 }} />}
                                        >
                                            <MenuItem value="Fix">Fixed Price</MenuItem>
                                            <MenuItem value="Formulate">Formula-based Price</MenuItem>
                                            <MenuItem value="Conditional">Conditional Price</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {methodData?.referrer_price_type === "Fix" && (
                                        <Box sx={{ mt: 2 }}>
                                            <FormControl fullWidth>
                                                <InputLabel
                                                    error={Boolean(errors?.referrer_price)}
                                                    id="payment-method-label"
                                                    required
                                                >
                                                    Price
                                                </InputLabel>
                                                <OutlinedInput
                                                    fullWidth
                                                    type="number"
                                                    name="price"
                                                    label="Price"
                                                    value={methodData.referrer_price || 0}
                                                    error={Boolean(errors?.referrer_price)}
                                                    required
                                                    inputProps={{ min: 0, step: 0.001 }}
                                                    onChange={(e) => handleChange("referrer_price", e.target.value)}
                                                    endAdornment={<Typography variant="caption" sx={{ ml: 1 }}>OMR</Typography>}
                                                />
                                                {errors?.price && <FormHelperText error>{errors?.referrer_price}</FormHelperText>}
                                            </FormControl>
                                        </Box>
                                    )}

                                    {methodData?.referrer_price_type === "Formulate" && (
                                        <Box sx={{ mt: 3 }}>
                                            <ParametersField
                                                defaultValue={methodData?.referrer_extra?.parameters || []}
                                                onChange={handleReferrerExtraChange}
                                                name="parameters"
                                                errors={errors?.referrer_extra?.parameters}
                                            />

                                            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                                                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    Price Formula
                                                    <Tooltip title="Define a mathematical formula using parameters. E.g: age * 0.5 + 10">
                                                        <IconButton size="small" sx={{ ml: 1 }}>
                                                            <Help fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Typography>
                                                <Divider sx={{ mb: 2 }} />

                                                <TextField
                                                    name="formula"
                                                    label="Formula"
                                                    placeholder="e.g. age * 0.5 + weight * 0.2 + 10"
                                                    onChange={handleReferrerExtraChange}
                                                    value={methodData?.referrer_extra?.formula || ""}
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    helperText={errors?.["referrer_extra.formula"] || "Define a mathematical formula using the parameters you've added"}
                                                    error={Boolean(errors?.["referrer_extra.formula"])}
                                                />
                                            </Paper>
                                        </Box>
                                    )}

                                    {methodData?.referrer_price_type === "Conditional" && (
                                        <Box sx={{ mt: 3 }}>
                                            <ParametersField
                                                defaultValue={methodData?.referrer_extra?.parameters || []}
                                                onChange={handleReferrerExtraChange}
                                                name="parameters"
                                                errors={errors?.referrer_extra?.parameters}
                                            />

                                            <ConditionsField
                                                defaultValue={methodData?.referrer_extra?.conditions || []}
                                                onChange={handleReferrerExtraChange}
                                                name="conditions"
                                                errors={errors?.referrer_extra?.conditions}
                                                parameters={methodData?.referrer_extra?.parameters || []}
                                            />
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        </TabPanel>
                    </TabContext>
                );

            case 2:
                return (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Review your settings and test the price calculation before submitting
                        </Alert>

                        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Method Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Method Name</Typography>
                                    <Typography variant="body1" gutterBottom>{methodData?.name || "Not specified"}</Typography>
                                </Grid>

                                {type === '1' && (
                                    <>
                                        <Grid xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">Workflow</Typography>
                                            <Typography variant="body1" gutterBottom>{methodData?.workflow || "Not specified"}</Typography>
                                        </Grid>

                                        <Grid xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">Barcode Group</Typography>
                                            <Typography variant="body1" gutterBottom>{methodData?.barcode_group || "Not specified"}</Typography>
                                        </Grid>

                                        <Grid xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">Turnaround Time</Typography>
                                            <Typography variant="body1" gutterBottom>{methodData?.turnaround_time || 0} days</Typography>
                                        </Grid>
                                    </>
                                )}

                                <Grid xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Number of Patients</Typography>
                                    <Typography variant="body1" gutterBottom>{methodData?.no_patient || 0}</Typography>
                                </Grid>

                                <Grid xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Price Type</Typography>
                                    <Typography variant="body1" gutterBottom>{methodData?.price_type || "Fix"}</Typography>
                                </Grid>
                                <Grid xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">Referrer Price Type</Typography>
                                    <Typography variant="body1" gutterBottom>{methodData?.referrer_price_type || "Fix"}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        <FormulaConditionTester
                            parameters={methodData?.extra?.parameters || []}
                            formula={methodData?.extra?.formula || ""}
                            conditions={methodData?.extra?.conditions || []}
                            priceType={methodData?.price_type || "Fix"}
                            fixedPrice={methodData?.price || 0}
                        />
                    </Box>
                );

            default:
                return "Unknown step";
        }
    };

    return (
        <Dialog
            open={open}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6">
                    {methodData?.id ? `Edit ${methodData.name || "Method"}` : "Add New Method"}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Stepper
                    activeStep={activeStep}
                    sx={{ pt: 3, pb: 4 }}
                    alternativeLabel
                >
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {getStepContent(activeStep)}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
                <Box>
                    <Button
                        onClick={onClose}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReset}
                        startIcon={<Refresh />}
                        sx={{ ml: 1 }}
                    >
                        Reset
                    </Button>
                </Box>

                <Box>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        startIcon={<NavigateBefore />}
                        sx={{ mr: 1 }}
                    >
                        Back
                    </Button>

                    {activeStep === steps.length - 1 ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmitForm}
                            startIcon={<Save />}
                        >
                            Submit
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            endIcon={<NavigateNext />}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default AddMethodForm;
