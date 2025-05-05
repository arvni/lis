import React, {useCallback} from "react";
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import SelectSearch from "@/Components/SelectSearch";
import {Box, Typography, Tooltip, CircularProgress} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";

const ReferredToggle = ({value, onChange}) => (
    <Box sx={{display: "flex", alignItems: "center"}}>
        <FormControlLabel
            label="Referred from another facility"
            control={
                <Switch
                    checked={value}
                    name="referred"
                    onChange={(e, v) => onChange('referred', v)}
                    color="primary"
                />
            }
            labelPlacement="start"
        />
        <Tooltip title="Select if this test was referred from another healthcare facility">
            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1}}/>
        </Tooltip>
    </Box>
);

const ReferrerOptions = ({referrer, referenceCode, onChange, errors}) => (
    <Box sx={{bgcolor: "secondary.50", p: 2, borderRadius: 2, mb: 4}}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{mb: 2}}>
            Referral Information
        </Typography>

        <Grid container spacing={3}>
            <Grid size={{xs: 12, md: 6}}>
                <SelectSearch
                    name="referrer"
                    value={referrer}
                    label="Referring Facility/Doctor"
                    fullWidth
                    url={route("api.referrers.list")}
                    id="referrer"
                    error={Boolean(errors?.referrer)}
                    onChange={e => onChange('referrer', e.target.value)}
                    helperText={errors?.referrer || "Select the facility or doctor that referred this test"}
                    variant="outlined"
                />
            </Grid>

            <Grid size={{xs: 12, md: 6}}>
                <TextField
                    value={referenceCode}
                    fullWidth
                    name="referenceCode"
                    id="reference-code"
                    error={Boolean(errors?.referenceCode)}
                    label="Reference Number"
                    placeholder="Enter the reference number from the referring facility"
                    onChange={e => onChange('referenceCode', e.target.value)}
                    helperText={errors?.referenceCode || "Optional: Enter reference number if available"}
                    variant="outlined"
                />
            </Grid>
        </Grid>
    </Box>
);

const DoctorSection = ({doctor, onDoctorChange}) => {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);


    const fetchData = useCallback((_, search) => {
        setLoading(true);
        onDoctorChange("name", search);
        fetch(route("api.doctors.list", {search}))
            .then(response => response.json())
            .then(data => {
                setOptions(data.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching doctors:", error);
                setLoading(false);
                setOptions([]);
            });

    }, [open])

    // Handle doctor selection
    const handleDoctorSelect = (event, newValue) => {
        if (newValue) {
            // If a doctor is selected from the dropdown, update all fields
            onDoctorChange('name', newValue.name || '');
            onDoctorChange('expertise', newValue.expertise || '');
            onDoctorChange('phone', newValue.phone || '');
            onDoctorChange('licenseNo', newValue.licenseNo || '');
            onDoctorChange('id', newValue.id || '');
        } else {
            onDoctorChange('name', '');
            onDoctorChange('expertise', '');
            onDoctorChange('phone', '');
            onDoctorChange('licenseNo', '');
            onDoctorChange('id', null);
        }
        console.log(newValue);
    };

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight="medium" sx={{mb: 2}}>
                Referring Doctor Information
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                        <Autocomplete
                            id="doctor-autocomplete"
                            open={open}
                            onOpen={() => setOpen(true)}
                            onClose={() => setOpen(false)}
                            value={doctor || ""}
                            onChange={handleDoctorSelect}
                            onInputChange={fetchData}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            getOptionLabel={(option) => option.name || ''}
                            options={options}
                            loading={loading}
                            fullWidth
                            freeSolo
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    name="name"
                                    label="Doctor's Name"
                                    value={doctor?.name || ""}
                                    placeholder="Search or enter name"
                                    slotProps={{
                                        input: {
                                            ...params.InputProps,
                                            startAdornment: <MedicalServicesIcon color="action" sx={{mr: 1}}/>,
                                            endAdornment: loading ? <CircularProgress size="small"/> : null
                                        },
                                    }}
                                />
                            )}
                        />
                        <Tooltip title="Search for an existing doctor or enter a new name">
                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                        </Tooltip>
                    </Box>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                        <TextField
                            name="expertise"
                            label="Speciality"
                            value={doctor?.expertise || ""}
                            onChange={e => onDoctorChange('expertise', e.target.value)}
                            fullWidth
                            placeholder="e.g. Cardiology"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <LocalHospitalIcon color="action" sx={{mr: 1}}/>
                                    ),
                                }
                            }}
                        />
                        <Tooltip title="Doctor's area of specialization">
                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                        </Tooltip>
                    </Box>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                        <TextField
                            name="phone"
                            label="Phone Number"
                            value={doctor?.phone || ""}
                            onChange={e => onDoctorChange('phone', e.target.value)}
                            fullWidth
                            placeholder="+1 (555) 123-4567"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <PhoneIcon color="action" sx={{mr: 1}}/>
                                    ),
                                }
                            }}
                        />
                        <Tooltip title="Contact number of the doctor">
                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                        </Tooltip>
                    </Box>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                        <TextField
                            name="license_no"
                            label="License Number"
                            value={doctor?.license_no || ""}
                            onChange={e => onDoctorChange('license_no', e.target.value)}
                            fullWidth
                            placeholder="e.g. MD12345"
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <BadgeIcon color="action" sx={{mr: 1}}/>
                                    ),
                                }
                            }}
                        />
                        <Tooltip title="Doctor's medical license or registration number">
                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                        </Tooltip>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

const DoctorReferralSection = ({data, doctor, errors, onChange, onDoctorChange}) => {
    return (
        <Box>
            <Box sx={{mb: 3}}>
                <ReferredToggle
                    value={data.referred}
                    onChange={onChange}
                />
            </Box>

            {data.referred && (
                <ReferrerOptions
                    referrer={data.referrer}
                    referenceCode={data?.referenceCode || ""}
                    onChange={onChange}
                    errors={errors}
                />
            )}

            <DoctorSection
                doctor={doctor}
                onDoctorChange={onDoctorChange}
            />
        </Box>
    );
};

export default DoctorReferralSection;
