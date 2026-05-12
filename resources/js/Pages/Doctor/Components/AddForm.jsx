import {Box, TextField, Tooltip} from "@mui/material";
import Grid from "@mui/material/Grid";

import { FormProvider, useFormState } from "@/Components/FormTemplate.jsx";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import PersonIcon from "@mui/icons-material/Person";
import React from "react";

const AddForm = ({ open, onClose, defaultValue = {} }) => {

    const url = defaultValue?.id
        ? route("doctors.update", defaultValue.id)
        : route("doctors.store");

    return (
        <FormProvider
            open={open}
            generalTitle="Doctor"
            url={url}
            onClose={onClose}
            defaultValue={{ name: "", expertise: "", phone: "", license_no: "", ...defaultValue }}
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="name"
                        label="Name"
                        value={data?.name || ""}
                        onChange={handleChange}
                        fullWidth
                        required
                        placeholder="e.g. Dr. John Smith"
                        error={!!errors?.name}
                        helperText={errors?.name}
                        slotProps={{
                            input: {
                                startAdornment: (<PersonIcon color="action" sx={{mr: 1}}/>),
                            }
                        }}
                    />
                    <Tooltip title="Full name of the doctor">
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>
            <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="expertise"
                        label="Speciality"
                        value={data?.expertise || ""}
                        onChange={handleChange}
                        fullWidth
                        placeholder="e.g. Cardiology"
                        error={!!errors?.expertise}
                        helperText={errors?.expertise}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <LocalHospitalIcon color="action" sx={{mr: 1}}/>
                                ),
                            }}}
                    />
                    <Tooltip title="Doctor's area of specialization">
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>

            <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="phone"
                        label="Phone Number"
                        value={data?.phone || ""}
                        onChange={handleChange}
                        fullWidth
                        placeholder="+968 1234 5678"
                        error={!!errors?.phone}
                        helperText={errors?.phone}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <PhoneIcon color="action" sx={{mr: 1}}/>
                                ),
                            }
                        }}
                    />
                    <Tooltip title="Contact number of the doctor">
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>

            <Grid size={{xs:12,sm:6}}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="license_no"
                        label="License Number"
                        value={data?.license_no || ""}
                        onChange={handleChange}
                        fullWidth
                        placeholder="e.g. MD12345"
                        error={!!errors?.license_no}
                        helperText={errors?.license_no}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <BadgeIcon color="action" sx={{mr: 1}}/>
                                ),
                            }
                        }}
                    />
                    <Tooltip title="Doctor's medical license or registration number">
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>
        </>
    );
};

export default AddForm;
