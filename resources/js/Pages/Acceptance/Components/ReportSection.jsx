import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import { Print, WhatsApp, Sms, HelpOutlined } from '@mui/icons-material';
import { Box, Divider, Paper, Typography, Tooltip, Stack, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import Checkbox from '@mui/material/Checkbox';
import SelectSearch from '@/Components/SelectSearch.jsx';

const OutPatientToggle = ({ value, onChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

const WaitingForPoolingToggle = ({ value, onChange }) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
            label="Waiting for Pooling"
            control={
                <Switch
                    checked={Boolean(value)}
                    name="waiting_for_pooling"
                    onChange={(e, v) => onChange('waiting_for_pooling', v)}
                    color="primary"
                />
            }
            labelPlacement="start"
        />
        <Tooltip title="Select if this acceptance should wait for pooling by a referrer order">
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
const ReportOptions = ({
    howReport = {},
    onChange,
    errors = {},
    isReferred = false,
    referrer = null,
}) => {
    // Handler for delivery method selection with better performance
    const handleDeliveryMethodChange = (method, checked) => {
        onChange(`howReport.${method}`, checked);
    };

    const deliveryMethods = [
        { key: 'print', icon: <Print />, label: 'Print' },
        { key: 'sms', icon: <Sms />, label: 'SMS' },
        { key: 'whatsapp', icon: <WhatsApp />, label: 'WhatsApp' },
    ];

    return (
        <Paper
            elevation={2}
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: 4,
                },
            }}
        >
            <Box sx={{ bgcolor: 'primary.main', p: 2, color: 'white' }}>
                <Typography variant="h6" fontWeight="medium">
                    How to Notify
                </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Notification Methods Section */}
                    <Box>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                            Select Notification Method(s) *
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Choose one or more ways to be notified
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
                                {deliveryMethods.map((method) => (
                                    <FormControlLabel
                                        key={method.key}
                                        control={
                                            <Checkbox
                                                checked={Boolean(howReport?.[method.key])}
                                                onChange={(e) =>
                                                    handleDeliveryMethodChange(
                                                        method.key,
                                                        e.target.checked,
                                                    )
                                                }
                                                color="primary"
                                                size="medium"
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {method.icon}
                                                <Typography sx={{ ml: 1 }}>
                                                    {method.label}
                                                </Typography>
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
                                                onChange={(e) =>
                                                    onChange(
                                                        'howReport.sendToReferrer',
                                                        e.target.checked,
                                                    )
                                                }
                                                color="primary"
                                                size="medium"
                                            />
                                        }
                                        label={
                                            <Typography>
                                                Send a copy to Referrer (
                                                {referrer?.fullName || 'Unknown'})
                                            </Typography>
                                        }
                                        sx={{ mb: 1 }}
                                    />
                                )}
                            </FormGroup>
                        </FormControl>
                    </Box>
                </Stack>
            </Box>
        </Paper>
    );
};

const HOW_FOUND_OPTIONS = [
    { value: 'google', label: 'Google Search' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'friends', label: 'Friends / Family' },
    { value: 'doctor', label: "Doctor's Recommendation" },
    { value: 'website', label: 'Website / Online Ad' },
    { value: 'walk_in', label: 'Walk-in / Signboard' },
    { value: 'other', label: 'Other' },
];

const PREDEFINED_VALUES = HOW_FOUND_OPTIONS.filter((o) => o.value !== 'other').map((o) => o.value);

const HowFoundUs = ({ value, onChange, errors }) => {
    const isOther = value && !PREDEFINED_VALUES.includes(value);
    const [selected, setSelected] = useState(isOther ? 'other' : value || '');
    const [otherText, setOtherText] = useState(isOther ? value : '');

    const handleSelect = (e) => {
        const v = e.target.value;
        setSelected(v);
        if (v === 'other') {
            onChange('how_found_us', otherText);
        } else {
            onChange('how_found_us', v);
        }
    };

    const handleOtherText = (e) => {
        setOtherText(e.target.value);
        onChange('how_found_us', e.target.value);
    };

    return (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mt: 3 }}>
            <Box sx={{ bgcolor: 'secondary.main', p: 2, color: 'white' }}>
                <Typography variant="h6" fontWeight="medium">
                    How Did You Find Our Lab?
                </Typography>
            </Box>
            <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel id="how-found-us-label">Select an option</InputLabel>
                        <Select
                            labelId="how-found-us-label"
                            value={selected}
                            label="Select an option"
                            onChange={handleSelect}
                        >
                            <MenuItem value="">
                                <em>— Not specified —</em>
                            </MenuItem>
                            {HOW_FOUND_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {selected === 'other' && (
                        <TextField
                            fullWidth
                            label="Please specify"
                            placeholder="Tell us how you found out about us"
                            value={otherText}
                            onChange={handleOtherText}
                            error={Boolean(errors?.how_found_us)}
                            helperText={errors?.how_found_us || ''}
                            variant="outlined"
                        />
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
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                }}
            >
                <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <OutPatientToggle
                            value={data?.out_patient}
                            onChange={onChange}
                            errors={errors}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <WaitingForPoolingToggle
                            value={data?.waiting_for_pooling}
                            onChange={onChange}
                        />
                    </Grid>

                    {!data?.out_patient && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <SelectSearch
                                helperText={errors?.['sampler.id']}
                                onChange={(e) => onChange('sampler', e.target.value)}
                                error={Boolean(errors?.['sampler.id'])}
                                value={data?.sampler || null}
                                name="sampler"
                                url={route('api.users.list')}
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

            <HowFoundUs value={data?.how_found_us || ''} onChange={onChange} errors={errors} />
        </Box>
    );
};

export default ReportSection;
