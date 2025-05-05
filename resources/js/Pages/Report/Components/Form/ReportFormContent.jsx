import React from "react";
import {
    Box,
    Button,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Alert,
    Tooltip,
    useTheme,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
    FileDownload as FileDownloadIcon,
    Check as CheckIcon,
    Tune as TuneIcon
} from "@mui/icons-material";
import DocumentUploadSection from "./DocumentUploadSection.jsx";
import ParameterSection from "./ParameterSection.jsx";

/**
 * Content section of the Report Form
 */
const ReportFormContent = ({
                               data,
                               setData,
                               errors,
                               templates,
                               parameterErrors,
                               activeParameters,
                               hasParameters,
                               handleTemplateChange,
                               handleParameterChange,
                               handleFileChange,
                               handleSubmit,
                               getActiveStep,
                               patientID
                           }) => {
    const theme = useTheme();

    return (
        <Box sx={{p: {xs: 2, sm: 3}}}>
            {/* Document Progress Stepper */}
            <Stepper
                activeStep={getActiveStep()}
                alternativeLabel
                sx={{mb: 4, mt: 1}}
            >
                <Step>
                    <StepLabel>Reported Document</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Approved Document</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Published Document</StepLabel>
                </Step>
            </Stepper>

            <Box>
                <FormControl
                    fullWidth
                    required
                    error={errors.report_template}
                    variant="outlined"
                    size="medium"
                    margin="normal"
                >
                    <InputLabel id="report-template-label">Template</InputLabel>
                    <Select
                        labelId="report-template-label"
                        id="report-template"
                        value={data?.report_template?.id || ''}
                        label="Template"
                        onChange={handleTemplateChange}
                    >
                        {templates.map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                                {template.name}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.report_template && (
                        <Typography variant="caption" color="error">
                            {errors.report_template}
                        </Typography>
                    )}
                </FormControl>
            </Box>

            {/* Template Download Button */}
            {data.report_template && <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 3}}>
                <Tooltip title="Download document template for this report">
                    <Button
                        href={data.report_template.template}
                        target="_blank"
                        variant="outlined"
                        startIcon={<FileDownloadIcon/>}
                        size="medium"
                        color="secondary"
                        sx={{borderRadius: 6}}
                    >
                        Download Template
                    </Button>
                </Tooltip>
                {hasParameters &&
                    <Tooltip title="Download list of parameters report">
                        <Button
                            href={route("reportTemplates.export-parameters", data.report_template.id)}
                            target="_blank"
                            variant="outlined"
                            startIcon={<TuneIcon/>}
                            size="medium"
                            color="info"
                            sx={{borderRadius: 6, ml: 2}}
                        >
                            Download Parameters
                        </Button>
                    </Tooltip>
                }
            </Box>}

            {/* Error Messages */}
            {(Object.keys(errors).length > 0 || Object.keys(parameterErrors).length > 0) && (
                <Alert
                    severity="error"
                    sx={{mb: 3, borderRadius: 1}}
                >
                    Please correct the errors in the form before submitting.
                </Alert>
            )}

            <Grid container spacing={3} sx={{pt: 1}}>
                {/* Parameter Entry Section */}
                {hasParameters && <ParameterSection
                    data={data}
                    setData={setData}
                    activeParameters={activeParameters}
                    parameterErrors={parameterErrors}
                    handleParameterChange={handleParameterChange}
                    theme={theme}
                />}

                {/* Document Upload Sections */}
                <DocumentUploadSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    handleFileChange={handleFileChange}
                    patientID={patientID}
                    theme={theme}
                />

                {/* Submit Button */}
                <Grid container justifyContent="flex-end">
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        size="large"
                        startIcon={<CheckIcon/>}
                        sx={{
                            mt: 2,
                            borderRadius: 6,
                            px: 4,
                            py: 1
                        }}
                    >
                        Submit Report
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReportFormContent;
