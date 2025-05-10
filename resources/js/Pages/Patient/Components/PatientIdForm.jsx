import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid2";
import { Box, InputAdornment, Typography, FormHelperText } from "@mui/material";
import { BadgeOutlined as BadgeIcon, SearchOutlined as SearchIcon } from "@mui/icons-material";
import { useState } from "react";

const PatientIdForm = ({ onChange, data, errors = {}, onKeyDown }) => {
    const [focused, setFocused] = useState(false);

    const handleFocus = () => setFocused(true);
    const handleBlur = () => setFocused(false);

    return (
        <Box sx={{ width: "100%" }}>
            <Typography
                variant="body2"
                color="text.primary"
                sx={{ mb: 1, fontWeight: focused ? 'medium' : 'regular' }}
            >
                Please enter the patient's identification number:
            </Typography>

            <Grid container spacing={2}>
                <Grid size={12}>
                    <TextField
                        fullWidth
                        value={data?.idNo || ""}
                        name="idNo"
                        label="ID Card No / Passport No"
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        required
                        error={!!errors?.idNo}
                        helperText={errors?.idNo || ""}
                        autoFocus
                        variant="outlined"
                        placeholder="Enter national ID or passport number"
                        slotProps={{
                            input:{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <BadgeIcon color={focused ? "primary" : "action"} />
                                    </InputAdornment>
                                ),
                                endAdornment: data?.idNo ? (
                                    <InputAdornment position="end">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ) : null
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused': {
                                    boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                                }
                            }
                        }}
                    />

                    {!errors?.idNo && (
                        <FormHelperText sx={{ mt: 1, ml: 1 }}>
                            This will be used to search for existing patient records
                        </FormHelperText>
                    )}
                </Grid>
            </Grid>

            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                    display: 'block',
                    mt: 3,
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}
            >
                Press Enter or click Next to search for existing records
            </Typography>
        </Box>
    );
};

export default PatientIdForm;
