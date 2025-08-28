import React from "react";
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import { Print, Email, WhatsApp, HelpOutline } from "@mui/icons-material";
import { Box, Divider, Paper, Typography, Tooltip, Stack, IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Checkbox from "@mui/material/Checkbox";
import SelectSearch from "@/Components/SelectSearch.jsx";

const OutPatientToggle = ({ value, onChange }) => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
        <FormControlLabel
            label="Out Patient"
            control={
                <Switch
                    checked={Boolean(value)}
                    name="out_patient"
                    onChange={(e, v) => onChange('out_patient', v)}
                    color="primary"
                />
            }
            labelPlacement="start"
        />
        <Tooltip title="Select if the patient is not staying at the facility">
            <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1 }} />
        </Tooltip>
    </Box>
);

/**
 * ReportOptions Component - Allows users to select and configure report delivery methods
 *
 * @param {Object} props - Component props
 * @param {Object} props.howReport - Current report delivery configuration
 * @param {Function} props.onChange - Function to update configuration
 * @param {Object} props.errors - Validation errors
 * @param {boolean} props.isReferred - Whether the patient was referred
 * @param {Object} props.referrer - Referrer information
 * @returns {JSX.Element}
 */
const ReportOptions = ({ howReport = {}, onChange, errors = {}, isReferred = false, referrer = null }) => {
    // Handler for delivery method selection with better performance
    const handleDeliveryMethodChange = (method, checked) => {
        onChange(`howReport.${method}`, checked);
    };

    const deliveryMethods = [
        { key: 'print', icon: <Print />, label: 'Print Report' },
        { key: 'email', icon: <Email />, label: 'Email Report' },
        { key: 'whatsapp', icon: <WhatsApp />, label: 'WhatsApp Report' }
    ];

    const hasSelectedMethods = deliveryMethods.some(method => howReport?.[method.key]);

    return (
        <Paper
            elevation={2}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: 4
                }
            }}
        >
            <Box sx={{ bgcolor: "primary.main", p: 2, color: "white" }}>
                <Typography variant="h6" fontWeight="medium">
                    How Would You Like to Receive Your Report?
                </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Delivery Methods Section */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Select Delivery Method(s) *
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Choose one or more ways to receive your report
                        </Typography>

                        {errors?.howReport && (
                            <Typography
                                color="error"
                                variant="caption"
                                sx={{ display: 'block', mt: 1, mb: 2 }}
                            >
                                {errors.howReport}
                            </Typography>
                        )}

                        <FormControl
                            component="fieldset"
                            fullWidth
                            sx={{ mt: 2 }}
                            error={Boolean(errors?.howReport)}
                        >
                            <FormGroup row>
                                {deliveryMethods.map(method => (
                                    <FormControlLabel
                                        key={method.key}
                                        control={
                                            <Checkbox
                                                checked={Boolean(howReport?.[method.key])}
                                                onChange={e => handleDeliveryMethodChange(method.key, e.target.checked)}
                                                color="primary"
                                                size="medium"
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {method.icon}
                                                <Typography sx={{ ml: 1 }}>{method.label}</Typography>
                                            </Box>
                                        }
                                        sx={{ mr: 4, mb: 1 }}
                                    />
                                ))}

                                {/* Referrer option with improved conditional rendering */}
                                {isReferred && referrer && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={Boolean(howReport?.sendToReferrer)}
                                                onChange={e => onChange('howReport.sendToReferrer', e.target.checked)}
                                                color="primary"
                                                size="medium"
                                            />
                                        }
                                        label={
                                            <Typography>
                                                Send a copy to Referrer ({referrer?.fullName || 'Unknown'})
                                            </Typography>
                                        }
                                        sx={{ mb: 1 }}
                                    />
                                )}
                            </FormGroup>
                        </FormControl>
                    </Box>

                    {/* Only show divider and inputs if at least one method is selected */}
                    {hasSelectedMethods && <Divider />}

                    {/* Conditional Input Fields based on selection */}
                    {hasSelectedMethods && (
                        <Stack spacing={3}>
                            {howReport?.print && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            Print Pickup Details
                                        </Typography>
                                        <Tooltip title="Please provide the name of the person who will collect the printed report">
                                            <IconButton size="small" sx={{ ml: 1 }}>
                                                <HelpOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <TextField
                                        value={howReport?.printReceiver || ''}
                                        required
                                        fullWidth
                                        name="printReceiver"
                                        error={Boolean(errors?.["howReport.printReceiver"])}
                                        id="how-report-print-receiver"
                                        label="Recipient's Full Name"
                                        placeholder="Enter the name of the person collecting the report"
                                        onChange={e => onChange('howReport.printReceiver', e.target.value)}
                                        helperText={errors?.["howReport.printReceiver"] || ""}
                                        variant="outlined"
                                        size="medium"
                                        inputProps={{
                                            'aria-describedby': 'print-receiver-helper'
                                        }}
                                    />
                                </Box>
                            )}

                            {howReport?.email && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            Email Delivery
                                        </Typography>
                                        <Tooltip title="We'll send your test results to this email address">
                                            <IconButton size="small" sx={{ ml: 1 }}>
                                                <HelpOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <TextField
                                        value={howReport?.emailAddress || ''}
                                        required
                                        fullWidth
                                        name="emailAddress"
                                        error={Boolean(errors?.["howReport.emailAddress"])}
                                        id="how-report-email"
                                        label="Email Address"
                                        placeholder="example@email.com"
                                        onChange={e => onChange('howReport.emailAddress', e.target.value)}
                                        helperText={errors?.["howReport.emailAddress"] || ""}
                                        variant="outlined"
                                        type="email"
                                        size="medium"
                                        inputProps={{
                                            'aria-describedby': 'email-helper',
                                            autoComplete: 'email'
                                        }}
                                    />
                                </Box>
                            )}

                            {howReport?.whatsapp && (
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" fontWeight="medium">
                                            WhatsApp Delivery
                                        </Typography>
                                        <Tooltip title="We'll send your test results to this WhatsApp number">
                                            <IconButton size="small" sx={{ ml: 1 }}>
                                                <HelpOutline fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    <TextField
                                        value={howReport?.whatsappNumber || ''}
                                        required
                                        fullWidth
                                        name="whatsappNumber"
                                        error={Boolean(errors?.["howReport.whatsappNumber"])}
                                        id="how-report-whatsapp"
                                        label="WhatsApp Number"
                                        placeholder="+968 1234 5678"
                                        onChange={e => onChange('howReport.whatsappNumber', e.target.value)}
                                        helperText={errors?.["howReport.whatsappNumber"] || "Include country code (e.g., +968)"}
                                        variant="outlined"
                                        size="medium"
                                        inputProps={{
                                            'aria-describedby': 'whatsapp-helper',
                                            autoComplete: 'tel'
                                        }}
                                    />
                                </Box>
                            )}
                        </Stack>
                    )}
                </Stack>
            </Box>
        </Paper>
    );
};

const ReportSection = ({ data, errors, onChange }) => {
    return (
        <Box>
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <OutPatientToggle
                            value={data?.out_patient}
                            onChange={onChange}
                            errors={errors}
                        />
                    </Grid>

                    {!data?.out_patient && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <SelectSearch
                                helperText={errors?.["sampler.id"]}
                                onChange={(e) => onChange("sampler", e.target.value)}
                                error={Boolean(errors?.["sampler.id"])}
                                value={data?.sampler || null}
                                name="sampler"
                                url={route("api.users.list")}
                                required
                                label="Sampler"
                                fullWidth
                            />
                        </Grid>
                    )}
                </Grid>
            </Paper>

            <Divider sx={{ my: 3 }} />

            <ReportOptions
                howReport={data?.howReport || {}}
                onChange={onChange}
                errors={errors}
                isReferred={Boolean(data?.referred)}
                referrer={data?.referrer || null}
            />
        </Box>
    );
};

export default ReportSection;
