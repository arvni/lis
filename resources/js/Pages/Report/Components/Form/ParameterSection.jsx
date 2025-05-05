import React from "react";
import {
    Box,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    alpha
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {
    Assignment as AssignmentIcon,
    Info as InfoIcon,
} from "@mui/icons-material";
import ExcelParameterImporter from "./ExcelParameterImporter";
import ParameterInput from "./ParameterInput";

/**
 * Component for the parameter entry section of the report form
 */
const ParameterSection = ({
                              data,
                              setData,
                              activeParameters,
                              parameterErrors,
                              handleParameterChange,
                              theme
                          }) => {
    return (
        <Grid size={{xs: 12}} id="parameter-section">
            <Box
                sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.warning.main, 0.04),
                    border: Object.keys(parameterErrors).length > 0
                        ? `1px solid ${theme.palette.error.main}`
                        : `1px solid ${theme.palette.divider}`,
                    mb: 3
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2
                }}>
                    <Typography
                        variant="subtitle1"
                        fontWeight="500"
                        color="primary"
                        sx={{display: 'flex', alignItems: 'center', gap: 1}}
                    >
                        <AssignmentIcon fontSize="small"/>
                        Template Parameters
                    </Typography>
                    <Box>
                        <ExcelParameterImporter
                            onImport={(importedValues) => {
                                setData(prevData => ({
                                    ...prevData,
                                    parameters: {
                                        ...(prevData.parameters || {}),
                                        ...importedValues
                                    }
                                }));
                            }}
                            currentValues={data.parameters || {}}
                        />
                        <Tooltip title="Fill in all required parameters marked with *">
                            <IconButton size="small" sx={{ml: 1}}>
                                <InfoIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Divider sx={{mb: 3}}/>

                <Grid container spacing={2}>
                    {activeParameters.map((param) => (
                        <Grid size={{
                            xs: 12,
                            sm: param.type === 'checkbox' || param.type === 'image' ? 12 : 6
                        }}
                              key={param.id}>
                            <ParameterInput
                                parameter={param}
                                value={data.parameters?.[`${param.title.toLowerCase().replace(/\s+/g, '_')}_${param.id}`]}
                                onChange={handleParameterChange}
                                errors={parameterErrors}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Grid>
    );
};

export default ParameterSection;
