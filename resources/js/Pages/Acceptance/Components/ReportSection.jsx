import React from "react";
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import {Man2, Woman2, Print, Email, WhatsApp, HelpOutline} from "@mui/icons-material";
import {Box, Divider, Paper, Typography, Tooltip, Stack, IconButton} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Checkbox from "@mui/material/Checkbox";

const OutPatientToggle = ({value, onChange, errors}) => (
    <Box sx={{display: "flex", alignItems: "center"}}>
        <FormControlLabel
            label="Out Patient"
            control={
                <Switch
                    checked={value}
                    name="out_patient"
                    onChange={(e, v) => onChange('out_patient', v)}
                    color="primary"
                />
            }
            labelPlacement="start"
        />
        <Tooltip title="Select if the patient is not staying at the facility">
            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
        </Tooltip>
    </Box>
);

const SamplerGenderToggle = ({value, onChange, errors}) => (
    <FormGroup sx={{alignItems: "flex-start"}}>
        <Box sx={{display: "flex", alignItems: "center", mb: 1}}>
            <Typography variant="body1">Sampler Gender</Typography>
            <Tooltip title="Select the preferred gender of the person taking the sample">
                <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
            </Tooltip>
        </Box>
        <ToggleButtonGroup
            exclusive
            value={value}
            onChange={(e, v) => onChange('samplerGender', v)}
            aria-label="Gender"
            size="medium"
            color="primary"
        >
            <ToggleButton
                name="gender"
                value={0}
                aria-label="Female"
            >
                <Woman2 sx={{mr: 1}}/> Female
            </ToggleButton>
            <ToggleButton
                name="gender"
                value={1}
                aria-label="Male"
            >
                <Man2 sx={{mr: 1}}/> Male
            </ToggleButton>
        </ToggleButtonGroup>
        {errors?.samplerGender && (
            <FormHelperText error>{errors.samplerGender}</FormHelperText>
        )}
    </FormGroup>
);


/**
 * ReportOptions Component - Allows users to select and configure report delivery methods
 *
 * @param {Object} props - Component props
 * @param {Object} props.howReport - Current report delivery configuration
 * @param {Function} props.onChange - Function to update configuration
 * @param {Object} props.errors - Validation errors
 * @param {boolean} props.isReferred - Whether the patient was referred
 * @returns {JSX.Element}
 */
const ReportOptions = ({howReport = {}, onChange, errors = {}, isReferred = false, referrer = null}) => {
    // Handler for delivery method selection
    const handleDeliveryMethodChange = (method, checked) => {
        onChange(`howReport.${method}`, checked);
    };

    return (
        <Paper elevation={2} sx={{borderRadius: 2, overflow: 'hidden'}}>
            <Box sx={{bgcolor: "primary.main", p: 2, color: "white"}}>
                <Typography variant="h6" fontWeight="medium">
                    How Would You Like to Receive Your Report?
                </Typography>
            </Box>
            <Box sx={{p: 3}}>
                <Stack spacing={3}>
                    {/* Delivery Methods Section */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Select Delivery Method(s)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Choose one or more ways to receive your report
                        </Typography>
                        {errors?.howReport && (
                            <Typography color="error">{errors.howReport}</Typography>
                        )}

                        <FormControl component="fieldset" fullWidth sx={{mt: 2}}>
                            <FormGroup row>
                                {[
                                    {key: 'print', icon: <Print/>, label: 'Print Report'},
                                    {key: 'email', icon: <Email/>, label: 'Email Report'},
                                    {key: 'whatsapp', icon: <WhatsApp/>, label: 'WhatsApp Report'}
                                ].map(method => (
                                    <FormControlLabel
                                        key={method.key}
                                        control={
                                            <Checkbox
                                                checked={!!howReport?.[method.key]}
                                                onChange={e => handleDeliveryMethodChange(method.key, e.target.checked)}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                {method.icon}
                                                <Typography sx={{ml: 1}}>{method.label}</Typography>
                                            </Box>
                                        }
                                        sx={{mr: 4, mb: 1}}
                                    />
                                ))}

                                {/* Referrer option */}
                                {isReferred && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!howReport?.sendToReferrer}
                                                    onChange={e => onChange('howReport.sendToReferrer', e.target.checked)}
                                                    color="primary"
                                                />
                                            }
                                            label={
                                                <Typography>
                                                    Send a copy to Referrer({referrer.fullName})
                                                </Typography>
                                            }
                                        />
                                )}

                            </FormGroup>
                        </FormControl>
                    </Box>

                    <Divider/>

                    {/* Conditional Input Fields based on selection */}
                    <Stack spacing={3}>
                        {howReport?.print && (
                            <Box>
                                <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                    <Typography variant="subtitle2">Print Pickup Details</Typography>
                                    <Tooltip
                                        title="Please provide the name of the person who will collect the printed report">
                                        <IconButton size="small" sx={{ml: 1}}>
                                            <HelpOutline fontSize="small"/>
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
                                />
                            </Box>
                        )}

                        {howReport?.email && (
                            <Box>
                                <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                    <Typography variant="subtitle2">Email Delivery</Typography>
                                    <Tooltip title="We'll send your test results to this email address">
                                        <IconButton size="small" sx={{ml: 1}}>
                                            <HelpOutline fontSize="small"/>
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
                                />
                            </Box>
                        )}

                        {howReport?.whatsapp && (
                            <Box>
                                <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                                    <Typography variant="subtitle2">WhatsApp Delivery</Typography>
                                    <Tooltip title="We'll send your test results to this WhatsApp number">
                                        <IconButton size="small" sx={{ml: 1}}>
                                            <HelpOutline fontSize="small"/>
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
                                />
                            </Box>
                        )}
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    );
};


const ReportSection = ({data, errors, onChange}) => {
    return (
        <Box>
            <Paper elevation={0} sx={{p: 2, mb: 3, bgcolor: "grey.50", borderRadius: 2}}>
                <Grid container spacing={3}>
                    <Grid size={{xs: 12, md: 6}}>
                        <OutPatientToggle
                            value={data?.out_patient}
                            onChange={onChange}
                            errors={errors}
                        />
                    </Grid>

                    <Grid size={{xs: 12, md: 6}}>
                        <SamplerGenderToggle
                            value={data?.samplerGender}
                            onChange={onChange}
                            errors={errors}
                        />
                    </Grid>
                </Grid>
            </Paper>
            <Divider sx={{my: 3}}/>
            <ReportOptions
                howReport={data.howReport}
                onChange={onChange}
                errors={errors}
                isReferred={data.referred}
                referrer={data.referrer}
            />
        </Box>
    );
};

export default ReportSection;
