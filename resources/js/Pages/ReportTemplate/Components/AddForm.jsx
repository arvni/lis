import {
    TextField,
    FormControlLabel,
    Checkbox,
    MenuItem,
    InputLabel,
    Select,
    FormControl,
    Paper,
    Box,
    Tooltip,
    Alert,
    Stack, Chip
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import Upload from "@/Components/Upload";
import { FormProvider, useFormState } from "@/Components/FormTemplate.jsx";

const TYPE_DESCRIPTIONS = {
    text: "Single line text input",
    number: "Numeric input only",
    date: "Date picker",
    image: "Image upload",
    select: "Dropdown selection",
    checkbox: "Yes/No checkbox option"
};

const AddForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('reportTemplates.update', defaultValue.id)
        : route('reportTemplates.store');
    const defaultData = {
        name: "",
        template: null,
        parameters: [
            {
                title: "",
                required: false,
                active: true,
                type: "text",
                custom_props: ""
            }
        ],
        ...defaultValue
    };

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            defaultValue={defaultData}
            generalTitle="Report Template"
            url={url}
            maxWidth="md"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData } = useFormState();
    const handleChange = (e) => setData(prevState => ({ ...prevState, [e.target.name]: e.target.value }));

    // Handle parameter changes
    const handleParameterChange = (index, field, value) => {
        const updatedParameters = [...data.parameters];
        updatedParameters[index] = {
            ...updatedParameters[index],
            [field]: value
        };
        setData(prevState => ({ ...prevState, parameters: updatedParameters }));
    };

    // Add a new parameter
    const addParameter = () => {
        setData(prevState => ({
            ...prevState,
            parameters: [
                ...prevState.parameters,
                { title: "", required: false, active: true, type: "text", custom_props: "" }
            ]
        }));
    };

    // Remove a parameter
    const removeParameter = (index) => {
        const updatedParameters = [...data.parameters];
        updatedParameters.splice(index, 1);
        setData(prevState => ({ ...prevState, parameters: updatedParameters }));
    };

    return (
        <Stack spacing={3}>
            {/* Basic Information Section */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3}>
                    <Grid xs={12}>
                        <TextField
                            fullWidth
                            label="Template Title"
                            name="name"
                            onChange={handleChange}
                            value={data?.name || ""}
                            placeholder="Enter a descriptive title for this template"
                            required
                            helperText="This title will be displayed to users when selecting templates"
                        />
                    </Grid>

                    <Grid xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                            Template Document
                        </Typography>
                        <Upload
                            value={data?.template}
                            name="template"
                            editable
                            onChange={setData}
                            required
                            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            url={route("documents.store")}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Accepted formats: .doc, .docx (Word documents)
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Parameters Section */}
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

                {data?.parameters?.map((param, index) => (
                    <Paper
                        key={index}
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
                            <Grid xs={12} container>
                                <Grid xs={12} sm={8} md={9}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Parameter #{index + 1}
                                        {param.required && (
                                            <Typography component="span" color="error" sx={{ ml: 1 }}>
                                                *Required
                                            </Typography>
                                        )}
                                    </Typography>
                                </Grid>
                                <Grid xs={12} sm={4} md={3} textAlign="right">
                                    <Tooltip title="Drag to reorder" placement="top">
                                        <IconButton size="small" sx={{ mr: 1, cursor: 'grab' }}>
                                            <DragIndicatorIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
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

                            <Grid xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Parameter Title"
                                    value={param.title || ""}
                                    onChange={(e) => handleParameterChange(index, 'title', e.target.value)}
                                    placeholder="e.g., Patient Name"
                                    required
                                />
                            </Grid>

                            <Grid xs={12} sm={6}>
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

                            <Grid xs={6} sm={3}>
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

                            <Grid xs={6} sm={3}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={param.active}
                                            onChange={(e) => handleParameterChange(index, 'active', e.target.checked)}
                                        />
                                    }
                                    label="Active"
                                    disabled={param.required}
                                    title={param.required ? "Required parameters must be active" : ""}
                                />
                            </Grid>

                            {(param.type === 'select' || param.type === 'checkbox') && (
                                <Grid xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Options"
                                        value={param.custom_props || ""}
                                        onChange={(e) => handleParameterChange(index, 'custom_props', e.target.value)}
                                        placeholder="Option 1, Option 2, Option 3"
                                        helperText="Separate options with commas (,)"
                                        required
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
                ))}

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
        </Stack>
    );
};

export default AddForm;
