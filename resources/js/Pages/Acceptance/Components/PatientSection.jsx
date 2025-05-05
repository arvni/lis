import React from "react";
import Grid from "@mui/material/Grid";
import { Box, Divider, Typography, Avatar } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const PatientSection = ({ patient }) => (
    <Box>
        <Box display="flex" alignItems="center" mb={2}>
            <Avatar
                sx={{
                    bgcolor: "primary.main",
                    width: 56,
                    height: 56,
                    mr: 2
                }}
            >
                <PersonIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5">{patient.fullName}</Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">ID/Passport No.</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.idNo}</Typography>
                </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Nationality</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.nationality}</Typography>
                </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Date Of Birth</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.dateOfBirth}</Typography>
                </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                    <Typography variant="body1" fontWeight="medium">{patient.gender.toUpperCase()}</Typography>
                </Box>
            </Grid>
        </Grid>
    </Box>
);

export default PatientSection;
