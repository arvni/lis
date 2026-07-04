import React from 'react';
import { Box, Button, Typography, Alert, Tooltip, Select, MenuItem } from '@mui/material';
import {
    FileDownload as FileDownloadIcon,
    Tune as TuneIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

const TemplateSelector = ({
    data,
    templates,
    errors,
    activeParameters,
    hasParameters,
    onTemplateChange,
}) => (
    <Box sx={{ mb: 4 }}>
        {data?.report_template?.template && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Tooltip title="Download document template for this report">
                    <Button
                        href={route(
                            'documents.download',
                            data.report_template?.template?.id ||
                                data.report_template?.template?.hash,
                        )}
                        target="_blank"
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        size="medium"
                        color="secondary"
                        sx={{ borderRadius: 6 }}
                    >
                        Download Template
                    </Button>
                </Tooltip>
            </Box>
        )}

        {hasParameters && data?.report_template?.id && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Tooltip title="Download the Excel parameters template">
                    <Button
                        href={route('reportTemplates.export-parameters', data.report_template.id)}
                        target="_blank"
                        variant="outlined"
                        startIcon={<TuneIcon />}
                        size="medium"
                        color="info"
                        sx={{ borderRadius: 6 }}
                    >
                        Download Parameters
                    </Button>
                </Tooltip>
            </Box>
        )}

        <Alert severity="info" icon={<AssignmentIcon />} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
                Selected Template: {data?.report_template?.name || 'None'}
            </Typography>
            <Typography variant="body2">
                {data?.report_template
                    ? `This template has ${activeParameters.length} parameters to fill.`
                    : 'Please select a template to proceed.'}
            </Typography>
        </Alert>

        {/* Template Selection (always visible) */}
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
                onChange={onTemplateChange}
            >
                {templates.map((template) => (
                    <MenuItem key={template?.id} value={template?.id}>
                        {template?.name}
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
);

export default TemplateSelector;
