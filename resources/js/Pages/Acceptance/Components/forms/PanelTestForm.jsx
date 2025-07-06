import React, {useCallback, useMemo} from 'react';
import {
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Grid2 as Grid,
    Typography,
    Paper,
    Box,
    Divider,
    Chip,
    Tooltip,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SelectSearch from "@/Components/SelectSearch.jsx";
import PriceField from "../MethodPriceField.jsx"; // Import the PriceField component

const PanelTestForm = ({
                           acceptanceItems,
                           onChange,
                           errors = {},
                           patient,
                           panel, // Add panel prop for pricing
                       }) => {
    // Memoized change handler for method test fields
    const handleMethodTestChange = useCallback((id) =>
            (e) => {
                const {name, value} = e.target;
                let acceptanceItemIndex = acceptanceItems.findIndex((item) => item.id === id)
                let newValue = {};
                if (name === "sampleType") {
                    newValue = {
                        customParameters: {
                            ...acceptanceItems[acceptanceItemIndex].customParameters,
                            [name]: value
                        },
                    }
                } else
                    newValue = {
                        [name]: value
                    }
                const updatedMethodTests = [...acceptanceItems]; // Create a new array to ensure proper re-render
                updatedMethodTests[acceptanceItemIndex] = {
                    ...updatedMethodTests[acceptanceItemIndex],
                    ...newValue
                };
                onChange(updatedMethodTests);
            },
        [acceptanceItems, onChange]
    );

    // Handler for panel price changes
    const handlePanelPriceChange = useCallback((priceData) => {
        if (onChange) {
            onChange(acceptanceItems.map(item => ({
                ...item,
                price: priceData.price / acceptanceItems.length,
                customParameters: {
                    ...item.customParameters,
                    ...(priceData.customParameters || {})
                }
            })));
        }
    }, [onChange]);

    // Memoized change handler for patient selection
    const handlePatientsChange = useCallback((itemId, index) =>
            (e) => {
                const {value} = e.target;
                const newAcceptanceItems = [...acceptanceItems];
                const newAcceptanceItemIndex = newAcceptanceItems.findIndex((item) => item.id === itemId);

                // Create a new array of patients to trigger re-render
                const updatedPatients = [...newAcceptanceItems[newAcceptanceItemIndex].patients];
                updatedPatients[index] = value;

                newAcceptanceItems[newAcceptanceItemIndex] = {
                    ...newAcceptanceItems[newAcceptanceItemIndex],
                    patients: updatedPatients
                };

                onChange(newAcceptanceItems);
            },
        [acceptanceItems, onChange]
    );

    // Helper function to check if panel has custom pricing
    const hasPanelPricing = useMemo(() => {
        return panel?.extra?.parameters?.length > 0 &&
            (panel?.price_type === "Formulate" || panel?.price_type === "Conditional");
    }, [panel]);

    // Memoize the rendered grid items to optimize performance
    const renderedItems = useMemo(() =>
            acceptanceItems?.map((item, index) => {
                const sampleTypes = item.method_test?.method?.test?.sample_types || [];

                const hasErrors = Boolean(
                    errors?.[`acceptanceItems.${index}.customParameters.sampleType`] ||
                    errors?.[`acceptanceItems.${index}.patients.0.id`]
                );

                return (
                    <Grid item size={{xs: 12}} key={`panel-item-${item.id}`}>
                        <Paper
                            elevation={1}
                            sx={{
                                p: 3,
                                mb: 2,
                                borderRadius: 2,
                                borderLeft: '4px solid',
                                borderLeftColor: hasErrors ? 'error.main' : 'primary.main'
                            }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <ScienceIcon color="primary" sx={{mr: 1}}/>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    {item.method_test?.method?.test?.name || "Test"}
                                </Typography>
                                <Chip
                                    label={`Method: ${item.method_test?.method?.name || "Unknown"}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ml: 2}}
                                />
                                <Tooltip title="Configure the test details below">
                                    <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
                                </Tooltip>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Patient Selection */}
                                {Array.from({length: item.method_test?.method?.no_patient || 1}).map((_, indexP) => (
                                    <Grid item key={indexP} size={{xs: 12, sm: 6, md: 4}}>
                                        <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
                                            <Box sx={{flexGrow: 1}}>
                                                <SelectSearch
                                                    helperText={errors?.[`acceptanceItems.${index}.patients.${indexP}.id`] || "Select the patient for this test"}
                                                    error={Boolean(errors?.[`acceptanceItems.${index}.patients.${indexP}.id`])}
                                                    value={item.patients[indexP] || ""}
                                                    fullWidth
                                                    label={`Patient ${indexP + 1}`}
                                                    defaultData={{patient: patient.id}}
                                                    onChange={handlePatientsChange(item.id, indexP)}
                                                    url={route("api.patients.list")}
                                                    name="patient"
                                                    startAdornment={<PersonIcon color="action" sx={{mr: 1}}/>}
                                                />
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}

                                {/* Sample Type Selection */}
                                <Grid item size={{xs: 12, sm: 6, md: 4}}>
                                    <FormControl
                                        fullWidth
                                        error={Boolean(errors?.[`acceptanceItems.${index}.customParameters.sampleType`])}
                                    >
                                        <InputLabel id={`sample-type-${item.id}`}>
                                            Sample Type
                                        </InputLabel>
                                        <Select
                                            onChange={handleMethodTestChange(item.id)}
                                            name="sampleType"
                                            label="Sample Type"
                                            value={item?.customParameters?.sampleType || ""}
                                            fullWidth
                                            labelId={`sample-type-${item.id}`}
                                        >
                                            <MenuItem value="">
                                                <em>Select sample type</em>
                                            </MenuItem>
                                            {sampleTypes.map(sampleType => (
                                                <MenuItem
                                                    key={`sample-type-${item.id}-${sampleType.id}`}
                                                    value={sampleType.id}
                                                >
                                                    {sampleType.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText
                                            error={Boolean(errors?.[`acceptanceItems.${index}.customParameters.sampleType`])}>
                                            {errors?.[`acceptanceItems.${index}.customParameters.sampleType`] || "Type of biological sample required"}
                                        </FormHelperText>
                                    </FormControl>
                                </Grid>

                                {/* Details Input */}
                                <Grid item size={{xs: 12}}>
                                    <Box sx={{mt: 1}}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Additional Details (Optional)
                                        </Typography>
                                        <TextField
                                            name="details"
                                            multiline
                                            fullWidth
                                            minRows={2}
                                            placeholder="Enter any specific notes or details for this test"
                                            onChange={handleMethodTestChange(item.id)}
                                            value={item.details || ""}
                                            variant="outlined"
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                );
            }),
        [acceptanceItems, errors, handleMethodTestChange, handlePatientsChange, patient]
    );

    return (
        <Box>
            {acceptanceItems?.length > 0 ? (
                <Grid container spacing={2}>
                    <Grid item size={{xs: 12}}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Box display="flex" alignItems="center">
                                <ScienceOutlinedIcon color="primary" sx={{mr: 1}}/>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight="medium"
                                >
                                    Configure Panel Tests
                                </Typography>
                                <Tooltip title="Each test in the panel needs to be configured individually">
                                    <IconButton size="small" sx={{ml: 1}}>
                                        <InfoOutlinedIcon fontSize="small" color="action"/>
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            {/* Panel Price Display */}
                            {panel?.price_type === "Fix" && (
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 2,
                                        backgroundColor: 'success.main',
                                        color: 'white',
                                        borderRadius: 2
                                    }}
                                >
                                    <Box display="flex" alignItems="center">
                                        <AttachMoneyIcon sx={{mr: 1}}/>
                                        <Typography variant="h6" fontWeight="bold">
                                            Panel Price: {panel.price} OMR
                                        </Typography>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                        <Divider sx={{mb: 3}}/>
                    </Grid>

                    {/* Panel Price Configuration Section */}
                    {hasPanelPricing && (
                        <Grid item size={{xs: 12}}>
                            <Paper
                                elevation={2}
                                sx={{
                                    mb: 3,
                                    borderRadius: 2,
                                    borderLeft: '4px solid',
                                    borderLeftColor: 'secondary.main'
                                }}
                            >
                                <Accordion defaultExpanded>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon/>}
                                        sx={{
                                            backgroundColor: 'secondary.50',
                                            borderRadius: 1,
                                            '&.Mui-expanded': {
                                                minHeight: 48
                                            }
                                        }}
                                    >
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                            <AttachMoneyIcon color="secondary" sx={{mr: 1}}/>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                Panel Price Configuration
                                            </Typography>
                                            <Chip
                                                label={panel?.name || "Panel"}
                                                size="small"
                                                color="secondary"
                                                variant="outlined"
                                                sx={{ml: 2}}
                                            />
                                            {panel?.price_type==="Fix" && (
                                                <Chip
                                                    label={`${panel.price} OMR`}
                                                    size="small"
                                                    color="success"
                                                    sx={{ml: 1}}
                                                />
                                            )}
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{pt: 2}}>
                                        <PriceField
                                            method={panel}
                                            onChange={handlePanelPriceChange}
                                            values={acceptanceItems[0]?.customParameters || {}}
                                            errors={errors}
                                        />
                                    </AccordionDetails>
                                </Accordion>
                            </Paper>
                        </Grid>
                    )}

                    {/* Render individual test items */}
                    {renderedItems}
                </Grid>
            ) : (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: 'grey.50',
                        borderRadius: 2,
                        border: '1px dashed grey.300'
                    }}
                >
                    <ScienceOutlinedIcon sx={{fontSize: 40, color: 'text.secondary', mb: 2}}/>
                    <Typography variant="h6">No Tests Available</Typography>
                    <Typography variant="body2" sx={{mt: 1}}>
                        This panel doesn't contain any tests to configure
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default PanelTestForm;
