import React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, MedicalServices } from '@mui/icons-material';
import PatientInfo from '@/Pages/Patient/Components/PatientInfo';

const PatientSection = ({ patients }) =>
    patients.map((patient, index) => (
        <React.Fragment key={`patient-${index}`}>
            <PatientInfo patient={patient} showDocuments defaultExpanded={false} />

            {/* Consultation Information */}
            {patient?.consultation?.information && (
                <Accordion
                    defaultExpanded={false}
                    elevation={2}
                    sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                            <MedicalServices color="primary" />
                            <Typography variant="h6">Consultation</Typography>
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                            {patient.consultation.information?.image && (
                                <Box
                                    component="img"
                                    src={patient.consultation.information?.image}
                                    alt="Consultation Image"
                                    sx={{
                                        width: '100%',
                                        mb: 2,
                                        borderRadius: 1,
                                        boxShadow: 1,
                                    }}
                                />
                            )}
                            <Box
                                sx={{
                                    '& img': { maxWidth: '100%' },
                                    '& table': { borderCollapse: 'collapse' },
                                    '& td, & th': {
                                        border: '1px solid #ddd',
                                        padding: '8px',
                                    },
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: patient?.consultation?.information?.report,
                                }}
                            />
                        </Paper>
                    </AccordionDetails>
                </Accordion>
            )}
        </React.Fragment>
    ));

export default PatientSection;
