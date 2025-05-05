import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Alert,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Tabs,
    Tab
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Define input types with descriptions
const TYPE_DESCRIPTIONS = {
    text: "Single line text input",
    number: "Numeric input only",
    date: "Date picker",
    image: "Image upload",
    select: "Dropdown selection",
    checkbox: "Yes/No checkbox option"
};

// TabPanel component for parameters tabs
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`parameter-tabpanel-${index}`}
            aria-labelledby={`parameter-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `parameter-tab-${index}`,
        'aria-controls': `parameter-tabpanel-${index}`,
    };
}

const TemplateParameters = ({ data, setData, errors = {} }) => {
    const [tabValue, setTabValue] = useState(0);
    const [showTabs, setShowTabs] = useState(false);

    // Check if we need to display tabs (more than 1 parameter)
    useEffect(() => {
        setShowTabs(data?.parameters?.length > 1);
    }, [data?.parameters]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Add a new parameter
    const addParameter = () => {
        const newParameters = [
            ...(data.parameters || []),
            {
                title: '',
                type: 'text',
                required: false,
                active: true,
                custom_props: ''
            }
        ];

        setData({ ...data, parameters: newParameters });

        // Set the tab to the newly added parameter
        if (newParameters.length > 1) {
            setTabValue(newParameters.length - 1);
        }
    };

    // Remove a parameter
    const removeParameter = (index) => {
        if (data.parameters.length <= 1) return;

        const newParameters = [...data.parameters];
        newParameters.splice(index, 1);

        setData({ ...data, parameters: newParameters });

        // Adjust the active tab if needed
        if (tabValue >= newParameters.length) {
            setTabValue(Math.max(0, newParameters.length - 1));
        }
    };

    // Handle parameter change
    const handleParameterChange = (index, field, value) => {
        const newParameters = [...data.parameters];
        newParameters[index] = { ...newParameters[index], [field]: value };

        // If parameter is required, it must be active
        if (field === 'required' && value === true) {
            newParameters[index].active = true;
        }

        setData({ ...data, parameters: newParameters });
    };

    // If no parameters exist, initialize with one empty parameter
    useEffect(() => {
        if (!data.parameters || data.parameters.length === 0) {
            setData({
                ...data,
                parameters: [
                    {
                        title: '',
                        type: 'text',
                        required: false,
                        active: true,
                        custom_props: ''
                    }
                ]
            });
        }
    }, []);

    // Render parameter form
    const renderParameterForm = (param, index) => (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                mb: 2,
                border: '1px solid #e0e0e0',
                borderLeft: '4px solid',
                borderLeftColor: param.required ? 'primary.main' : 'grey.300',
                borderRadius: 1,
                position: 'relative',
                '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
            }}
        >
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} container>
                    <Grid item xs={12} sm={8} md={9}>
                        <Typography variant="subtitle2" gutterBottom>
                            Parameter #{index + 1}
                            {param.required && (
                                <Typography component="span" color="error" sx={{ ml: 1 }}>
                                    *Required
                                </Typography>
                            )}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} md={3} textAlign="right">
                        {showTabs && (
                            <Tooltip title="Drag to reorder" placement="top">
                                <IconButton size="small" sx={{ mr: 1, cursor: 'grab' }}>
                                    <DragIndicatorIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip
                            title={data.parameters.length <= 1 ? "At least one parameter is required" : "Remove parameter"}
                            placement="top"
                        >
              <span>
                <IconButton
                    color="error"
                    onClick={() => removeParameter(index)}
                    disabled={data.parameters.length <= 1}
                    size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
                        </Tooltip>
                    </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Parameter Title"
                        value={param.title || ""}
                        onChange={(e) => handleParameterChange(index, 'title', e.target.value)}
                        placeholder="e.g., Patient Name"
                        required
                        error={!param.title}
                        helperText={!param.title ? "Title is required" : ""}
                    />
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel id={`param-type-label-${index}`}>Input Type</InputLabel>
                        <Select
                            labelId={`param-type-label-${index}`}
                            value={param.type}
                            label="Input Type"
                            onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                        >
                            {Object.entries(TYPE_DESCRIPTIONS).map(([type, description]) => (
                                <MenuItem value={type} key={type}>
                                    <Box>
                                        <Typography variant="body2">{type.charAt(0).toUpperCase() + type.slice(1)}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={6} sm={3}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={param.required}
                                onChange={(e) => handleParameterChange(index, 'required', e.target.checked)}
                            />
                        }
                        label="Required"
                    />
                </Grid>

                <Grid item xs={6} sm={3}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={param.active}
                                onChange={(e) => handleParameterChange(index, 'active', e.target.checked)}
                                disabled={param.required}
                            />
                        }
                        label="Active"
                        title={param.required ? "Required parameters must be active" : ""}
                    />
                </Grid>

                {(param.type === 'select' || param.type === 'checkbox') && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Options"
                            value={param.custom_props || ""}
                            onChange={(e) => handleParameterChange(index, 'custom_props', e.target.value)}
                            placeholder="Option 1, Option 2, Option 3"
                            helperText="Separate options with commas (,)"
                            required
                            error={param.type === 'select' && !param.custom_props}
                        />

                        {param.custom_props && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Preview:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                    {param.custom_props.split(',').map((option, i) => (
                                        <Chip key={i} label={option.trim()} size="small" variant="outlined" />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Grid>
                )}
            </Grid>
        </Paper>
    );

    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" color="primary">
                    Template Parameters
                </Typography>
                <Tooltip title="Parameters are variables that users will fill in when creating a report from this template">
                    <IconButton size="small">
                        <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Alert severity="info" sx={{ mb: 3 }}>
                Define the information fields that users need to complete when using this template
            </Alert>

            {showTabs ? (
                <>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="parameter tabs"
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {data.parameters.map((param, index) => (
                                <Tab
                                    key={index}
                                    label={param.title || `Parameter ${index + 1}`}
                                    {...a11yProps(index)}
                                    icon={param.required ? <span style={{ color: 'red' }}>*</span> : null}
                                    iconPosition="end"
                                />
                            ))}
                        </Tabs>
                    </Box>

                    {data.parameters.map((param, index) => (
                        <TabPanel key={index} value={tabValue} index={index}>
                            {renderParameterForm(param, index)}
                        </TabPanel>
                    ))}
                </>
            ) : (
                // When only one parameter, no tabs needed
                data?.parameters?.map((param, index) => renderParameterForm(param, index))
            )}

            <Box textAlign="center" mt={3}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={addParameter}
                    sx={{ px: 3 }}
                >
                    Add New Parameter
                </Button>
            </Box>
        </Paper>
    );
};

export default TemplateParameters;
