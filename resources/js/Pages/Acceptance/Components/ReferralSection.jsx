import React from "react";
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import SelectSearch from "@/Components/SelectSearch";
import { Box, Typography, Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const ReferredToggle = ({ value, onChange }) => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
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
            <HelpOutlineIcon fontSize="small" color="action" sx={{ ml: 1 }} />
        </Tooltip>
    </Box>
);

const ReferrerOptions = ({ referrer, referenceCode, onChange, errors }) => (
    <Box sx={{ bgcolor: "secondary.50", p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
            Referral Information
        </Typography>

        <Grid container spacing={3}>
            <Grid size={{xs:12,md:6}}>
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

            <Grid size={{xs:12,md:6}}>
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

const ReferralSection = ({ data, errors, onChange }) => {
    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <ReferredToggle
                    value={data.referred}
                    onChange={onChange}
                />
            </Box>

            {data.referred && (
                <ReferrerOptions
                    referrer={data.referrer}
                    referenceCode={data?.referenceCode||""}
                    onChange={onChange}
                    errors={errors}
                />
            )}
        </Box>
    );
};

export default ReferralSection;
