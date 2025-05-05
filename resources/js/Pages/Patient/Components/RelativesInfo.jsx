import React, { useState } from "react";
import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    Paper,
    Tooltip,
    Box
} from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import {
    ExpandMore as ExpandMoreIcon,
    FamilyRestroom as FamilyIcon,
    Edit as EditIcon,
    Cancel as CancelIcon
} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import RelativeForm from "./RelativeForm";

const RelativesInfo = ({
                           relatives,
                           patientId,
                           defaultExpanded = false,
                           canAddPatient = false
                       }) => {
    const [edit, setEdit] = useState(false);

    const handleCancel = () => {
        setEdit(false);
    };

    const handleEdit = () => {
        setEdit(true);
    };

    return (
        <Paper elevation={1} sx={{ mb: 3, overflow: 'hidden' }}>
            <Accordion
                defaultExpanded={defaultExpanded}
                disableGutters
                elevation={0}
                sx={{
                    '&:before': {
                        display: 'none',
                    },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="relatives-information"
                    id="relatives-information"
                    sx={{
                        backgroundColor: 'primary.lighter',
                        '&.Mui-expanded': {
                            minHeight: 56,
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FamilyIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            Family Members
                        </Typography>
                        {relatives && relatives.length > 0 && (
                            <Tooltip title={`${relatives.length} family member${relatives.length !== 1 ? 's' : ''}`}>
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        bgcolor: 'primary.main',
                                        color: 'primary.contrastText',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        ml: 1
                                    }}
                                >
                                    {relatives.length}
                                </Box>
                            </Tooltip>
                        )}
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                    <RelativeForm
                        relatives={relatives}
                        edit={edit}
                        patientId={patientId}
                        canEdit={canAddPatient}
                    />

                    {relatives && relatives.length === 0 && !edit && (
                        <Box
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                bgcolor: 'background.default',
                                borderRadius: 1
                            }}
                        >
                            <Typography variant="body1" color="text.secondary">
                                No family members have been added yet.
                            </Typography>
                            {canAddPatient && (
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={handleEdit}
                                    sx={{ mt: 2 }}
                                >
                                    Add Family Member
                                </Button>
                            )}
                        </Box>
                    )}
                </AccordionDetails>

                {canAddPatient && (
                    <AccordionActions
                        sx={{
                            justifyContent: 'flex-end',
                            p: 2,
                            backgroundColor: 'background.default'
                        }}
                    >
                        {edit ? (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleCancel}
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelIcon />}
                                >
                                    Cancel
                                </Button>
                            </Stack>
                        ) : (
                            relatives && relatives.length > 0 && (
                                <Tooltip title="Add or edit family members">
                                    <Button
                                        onClick={handleEdit}
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        color="primary"
                                    >
                                        Manage Family Members
                                    </Button>
                                </Tooltip>
                            )
                        )}
                    </AccordionActions>
                )}
            </Accordion>
        </Paper>
    );
};

export default RelativesInfo;
