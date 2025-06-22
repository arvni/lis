import {
    TextField,
    Paper,
    Box,
    Stack, Chip, ListItem, ListItemIcon, ListItemText, List
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import RequirementForm from "../Components/RequirementForm.jsx";

import Upload from "@/Components/Upload";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import React from "react";
import {CheckBox, FormatListNumbered, TextFields} from "@mui/icons-material";

const AddForm = ({open, onClose, defaultValue}) => {
    console.log(defaultValue);
    const url = defaultValue?.id
        ? route('requestForms.update', defaultValue.id)
        : route('requestForms.store');
    const defaultData = {
        name: "",
        document: null,
        form_data: [],
        ...defaultValue
    };

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            defaultValue={defaultData}
            generalTitle="Request Form"
            url={url}
            maxWidth="md"
        >
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors, processing} = useFormState();
    const handleChange = (e) => setData(prevState => ({...prevState, [e.target.name]: e.target.value}));

    const handleFormDataChanged = (form_data) => {
        setData(prevState => ({
            ...prevState,
            form_data
        }));
    };

    /**
     * Get field type icon
     *
     * @param {string} type Field type
     * @returns {JSX.Element} Icon component
     */
    const getFieldTypeIcon = (type) => {
        switch (type) {
            case 'text':
                return <TextFields fontSize="small" color="primary"/>;
            case 'checkbox':
                return <CheckBox fontSize="small" color="secondary"/>;
            case 'number':
                return <FormatListNumbered fontSize="small" color="success"/>;
            default:
                return <TextFields fontSize="small" color="primary"/>;
        }
    };

    return (
        <Grid size={12}>
            {/* Basic Information Section */}
            <Paper elevation={0} sx={{p: 3, border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom color="primary">
                    Basic Information
                </Typography>
                <Divider sx={{mb: 2}}/>

                <Grid container spacing={3}>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Request Form Title"
                            name="name"
                            onChange={handleChange}
                            value={data?.name || ""}
                            placeholder="Enter a descriptive title for this form"
                            required
                            helperText="This title will be displayed to users when selecting form"
                        />
                    </Grid>

                    <Grid size={12}>
                        <Typography variant="subtitle2" gutterBottom>
                            Document
                        </Typography>
                        <Upload
                            value={data?.document}
                            name="document"
                            editable
                            onChange={setData}
                            accept=".pdf,.docx,application/pdf"
                            url={route("documents.store")}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>
                            Accepted formats: .pdf
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Parameters Section */}
            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    mb: 2,
                    borderRadius: 2,
                    width: "100%"
                }}
            >
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                    <Typography variant="h6">
                        Form Fields
                    </Typography>

                    <Chip
                        label={`${data.form_data.length} ${data.form_data.length === 1 ? 'field' : 'fields'}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                    />
                </Box>

                <Typography variant="body2" color="text.secondary">
                    Add fields that will be included in this form. Drag to reorder fields.
                </Typography>

                {/* Form fields component */}
                <RequirementForm
                    onChange={handleFormDataChanged}
                    requirements={data.form_data}
                    error={errors}
                    disabled={processing}
                />

                {/* Preview of form fields */}
                {data.form_data.length > 0 && (
                    <Box sx={{mt: 3}}>
                        <Typography variant="subtitle2" gutterBottom>
                            Field Preview
                        </Typography>
                        <Paper variant="outlined" sx={{mt: 1}}>
                            <List disablePadding>
                                {data.form_data.map((field, index) => (
                                    <React.Fragment key={`field-${index}`}>
                                        {index > 0 && <Divider component="li"/>}
                                        <ListItem>
                                            <ListItemIcon>
                                                {getFieldTypeIcon(field.type)}
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {field.label}
                                                        {field.required && (
                                                            <Typography
                                                                component="span"
                                                                color="error.main"
                                                                sx={{ml: 0.5}}
                                                            >
                                                                *
                                                            </Typography>
                                                        )}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field
                                                        {field.placeholder && ` • Placeholder: "${field.placeholder}"`}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        </Paper>
                    </Box>
                )}
            </Paper>
        </Grid>
    );
};

export default AddForm;
