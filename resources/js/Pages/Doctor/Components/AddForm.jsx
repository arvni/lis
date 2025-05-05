import {Box, CircularProgress, TextField, Tooltip} from "@mui/material";
import Grid from "@mui/material/Grid2";

import { FormProvider, useFormState } from "@/Components/FormTemplate.jsx";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import React from "react";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

const AddForm = ({ open, onClose, defaultValue = {} }) => {

    const url = defaultValue?.id
        ? route("doctors.update", defaultValue.id)
        : route("doctors.store");

    return (
        <FormProvider
            open={open}
            generalTitle="Barcode Group"
            url={url}
            onClose={onClose}
            defaultValue={{ name: "", expertise: "", phone: "", license_no: "", ...defaultValue }}
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors, processing } = useFormState();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <>
            <Grid xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="name"
                        label="Name"
                        value={data?.name || ""}
                        onChange={handleChange}
                        fullWidth
                        placeholder="enter name"
                        slotProps={{
                            input: {
                                startAdornment: (<MedicalServicesIcon color="action" sx={{mr: 1}}/>),
                            }
                        }}
                    />
                    <Tooltip title="Doctor's area of specialization">
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>
            <Grid size={{xs:12,sm:6,md:3}}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="expertise"
                        label="Speciality"
                        value={data?.expertise || ""}
                        onChange={e => onDoctorChange('expertise', e.target.value)}
                        fullWidth
                        placeholder="e.g. Cardiology"
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

            <Grid size={{xs:12,sm:6,md:3}}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="phone"
                        label="Phone Number"
                        value={data?.phone || ""}
                        onChange={e => onDoctorChange('phone', e.target.value)}
                        fullWidth
                        placeholder="+968 1234 5678"
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

            <Grid size={{xs:12,sm:6,md:3}}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <TextField
                        name="license_no"
                        label="License Number"
                        value={data?.licenseNo || ""}
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
                        <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1, mt: 2 }} />
                    </Tooltip>
                </Box>
            </Grid>
        </>
    );
};

export default AddForm;
