import React, { useCallback, useMemo } from 'react';
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
    IconButton
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from '@mui/icons-material/Person';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SelectSearch from "@/Components/SelectSearch.jsx";

const PanelTestForm = ({
                           acceptanceItems,
                           onChange,
                           errors = {},
                           patient
                       }) => {
    // Memoized change handler for method test fields
    const handleMethodTestChange = useCallback((id) =>
            (e) => {
                const { name, value } = e.target;
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

    // Memoized change handler for patient selection
    const handlePatientsChange = useCallback((itemId, index) =>
            (e) => {
                const { value } = e.target;
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

    // Memoize the rendered grid items to optimize performance
    const renderedItems = useMemo(() =>
            acceptanceItems?.map((item, index) => {
                const sampleTypes = item.method_test?.method?.test?.sample_types || [];
                const hasErrors = Boolean(
                    errors?.[`acceptanceItems.${index}.customParameters.sampleType`] ||
                    errors?.[`acceptanceItems.${index}.patients.0.id`]
                );

                return (
                    <Grid item size={{ xs: 12 }} key={`panel-item-${item.id}`}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1" fontWeight="medium">
                                    {item.method_test?.method?.test?.name || "Test"}
                                </Typography>
                                <Chip
                                    label={`Method: ${item.method_test?.method?.name || "Unknown"}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ ml: 2 }}
                                />
                                <Tooltip title="Configure the test details below">
                                    <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1 }} />
                                </Tooltip>
                            </Box>

                            <Grid container spacing={3}>
                                {/* Patient Selection */}
                                {Array.from({ length: item.method_test?.method?.no_patient || 1 }).map((_, indexP) => (
                                    <Grid item key={indexP} size={{ xs: 12, sm: 6, md: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <SelectSearch
                                                    helperText={errors?.[`acceptanceItems.${index}.patients.${indexP}.id`] || "Select the patient for this test"}
                                                    error={Boolean(errors?.[`acceptanceItems.${index}.patients.${indexP}.id`])}
                                                    value={item.patients[indexP] || ""}
                                                    fullWidth
                                                    label={`Patient ${indexP + 1}`}
                                                    defaultData={{ patient: patient.id }}
                                                    onChange={handlePatientsChange(item.id, indexP)}
                                                    url={route("api.patients.list")}
                                                    name="patient"
                                                    startAdornment={<PersonIcon color="action" sx={{ mr: 1 }} />}
                                                />
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}

                                {/* Sample Type Selection */}
                                <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
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
                                        <FormHelperText error={Boolean(errors?.[`acceptanceItems.${index}.customParameters.sampleType`])}>
                                            {errors?.[`acceptanceItems.${index}.customParameters.sampleType`] || "Type of biological sample required"}
                                        </FormHelperText>
                                    </FormControl>
                                </Grid>

                                {/* Details Input */}
                                <Grid item size={{ xs: 12 }}>
                                    <Box sx={{ mt: 1 }}>
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
                    <Grid item size={{ xs: 12 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                            <ScienceOutlinedIcon color="primary" sx={{ mr: 1 }} />
                            <Typography
                                variant="subtitle1"
                                fontWeight="medium"
                            >
                                Configure Panel Tests
                            </Typography>
                            <Tooltip title="Each test in the panel needs to be configured individually">
                                <IconButton size="small" sx={{ ml: 1 }}>
                                    <InfoOutlinedIcon fontSize="small" color="action" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Divider sx={{ mb: 3 }} />
                    </Grid>
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
                    <ScienceOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6">No Tests Available</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        This panel doesn't contain any tests to configure
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};

export default PanelTestForm;
