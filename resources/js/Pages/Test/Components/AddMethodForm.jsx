import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Drawer,
    IconButton,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { Close, Save } from "@mui/icons-material";
import Grid from "@mui/material/Grid";
import SelectSearch from "@/Components/SelectSearch";
import PricingConfig from "./PricingConfig";

const SectionHeading = ({ children }) => (
    <Typography
        variant="overline"
        sx={{
            display: "block",
            mb: 2,
            pl: 1.5,
            lineHeight: 1.2,
            letterSpacing: 1.5,
            color: "text.secondary",
            borderLeft: 3,
            borderColor: "primary.main",
        }}
    >
        {children}
    </Typography>
);

const AddMethodForm = ({ method = {}, onChange, onSubmit, onClose, open, errors, type = "TEST" }) => {
    const [pricingTab, setPricingTab] = useState("direct");
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const set = (name, value) => onChange(name, value);
    const isEdit = Boolean(method?.id);

    const blurActive = () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };

    const handleClose = () => { blurActive(); onClose(); };
    const handleSubmit = () => { blurActive(); onSubmit(); };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={handleClose}
            transitionDuration={{ enter: 280, exit: 220 }}
            slotProps={{
                paper: {
                    elevation: 4,
                    sx: {
                        width: isMobile ? "100%" : 520,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    },
                },
            }}
        >
            {/* ── sticky header ── */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {isEdit ? "Edit Method" : "Add Method"}
                        </Typography>
                        {type !== "TEST" && (
                            <Chip label={type} size="small" variant="outlined" color="secondary" />
                        )}
                    </Box>
                    {isEdit && method?.name && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                            {method.name}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={handleClose} size="small" sx={{ ml: 1, flexShrink: 0 }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            {/* ── scrollable body ── */}
            <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>
                <Stack spacing={4}>

                    {/* name */}
                    <Box>
                        <SectionHeading>Identification</SectionHeading>
                        <TextField
                            label="Method Name"
                            value={method?.name || ""}
                            onChange={(e) => set("name", e.target.value)}
                            fullWidth
                            required
                            autoFocus={open && !isEdit}
                            error={Boolean(errors?.name)}
                            helperText={errors?.name || "Shown on reports and invoices"}
                            placeholder="e.g. Complete Blood Count"
                        />
                    </Box>

                    {/* TEST-only: workflow + barcode + timing */}
                    {type === "TEST" && (
                        <Box>
                            <SectionHeading>Workflow & Processing</SectionHeading>
                            <Stack spacing={2.5}>
                                <SelectSearch
                                    value={method?.workflow || ""}
                                    onChange={(e) => set("workflow", e.target.value)}
                                    name="workflow"
                                    fullWidth
                                    label="Workflow *"
                                    url={route("api.workflows.list")}
                                    error={Boolean(errors?.workflow)}
                                    helperText={errors?.workflow}
                                />
                                <SelectSearch
                                    value={method?.barcode_group || ""}
                                    onChange={(e) => set("barcode_group", e.target.value)}
                                    name="barcode_group"
                                    fullWidth
                                    label="Barcode Group *"
                                    url={route("api.barcodeGroups.list")}
                                    error={Boolean(errors?.barcode_group)}
                                    helperText={errors?.barcode_group}
                                />
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <TextField
                                            type="number"
                                            label="Turnaround (days) *"
                                            value={method?.turnaround_time || ""}
                                            onChange={(e) => set("turnaround_time", e.target.value)}
                                            fullWidth
                                            error={Boolean(errors?.turnaround_time)}
                                            helperText={errors?.turnaround_time}
                                            slotProps={{ htmlInput: { min: 1 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <TextField
                                            type="number"
                                            label="Samples / Run"
                                            value={method?.no_sample ?? 1}
                                            onChange={(e) => set("no_sample", e.target.value)}
                                            fullWidth
                                            error={Boolean(errors?.no_sample)}
                                            helperText={errors?.no_sample}
                                            slotProps={{ htmlInput: { min: 1 } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 4 }}>
                                        <TextField
                                            type="number"
                                            label="Patients / Sample"
                                            value={method?.no_patient ?? 1}
                                            onChange={(e) => set("no_patient", e.target.value)}
                                            fullWidth
                                            error={Boolean(errors?.no_patient)}
                                            helperText={errors?.no_patient}
                                            slotProps={{ htmlInput: { min: 1 } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Box>
                    )}

                    {/* SERVICE-only: samples/patients */}
                    {type === "SERVICE" && (
                        <Box>
                            <SectionHeading>Processing</SectionHeading>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        type="number"
                                        label="Samples / Run"
                                        value={method?.no_sample ?? 1}
                                        onChange={(e) => set("no_sample", e.target.value)}
                                        fullWidth
                                        error={Boolean(errors?.no_sample)}
                                        helperText={errors?.no_sample}
                                        slotProps={{ htmlInput: { min: 1 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        type="number"
                                        label="Patients / Sample"
                                        value={method?.no_patient ?? 1}
                                        onChange={(e) => set("no_patient", e.target.value)}
                                        fullWidth
                                        error={Boolean(errors?.no_patient)}
                                        helperText={errors?.no_patient}
                                        slotProps={{ htmlInput: { min: 1 } }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {/* pricing */}
                    <Box>
                        <SectionHeading>Pricing</SectionHeading>

                        <Tabs
                            value={pricingTab}
                            onChange={(_, v) => setPricingTab(v)}
                            variant="fullWidth"
                            sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
                        >
                            <Tab
                                value="direct"
                                disableRipple
                                sx={{ textTransform: "none", py: 1.5 }}
                                label={
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            Direct Patient
                                        </Typography>
                                        <Typography variant="caption" color={errors?.price ? "error" : "text.secondary"}>
                                            {errors?.price || "Walk-in pricing"}
                                        </Typography>
                                    </Box>
                                }
                            />
                            <Tab
                                value="referral"
                                disableRipple
                                sx={{ textTransform: "none", py: 1.5 }}
                                label={
                                    <Box sx={{ textAlign: "center" }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            Referral
                                        </Typography>
                                        <Typography variant="caption" color={errors?.referrer_price ? "error" : "text.secondary"}>
                                            {errors?.referrer_price || "Doctor-referred"}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Tabs>

                        {pricingTab === "direct" ? (
                            <PricingConfig
                                key="direct"
                                priceType={method?.price_type || "Fix"}
                                price={method?.price}
                                extra={method?.extra || {}}
                                onPriceTypeChange={(v) => set("price_type", v)}
                                onPriceChange={(v) => set("price", v)}
                                onExtraChange={(newExtra) => set("extra", newExtra)}
                                error={errors?.price}
                            />
                        ) : (
                            <PricingConfig
                                key="referral"
                                priceType={method?.referrer_price_type || "Fix"}
                                price={method?.referrer_price}
                                extra={method?.referrer_extra || {}}
                                onPriceTypeChange={(v) => set("referrer_price_type", v)}
                                onPriceChange={(v) => set("referrer_price", v)}
                                onExtraChange={(newExtra) => set("referrer_extra", newExtra)}
                                error={errors?.referrer_price}
                            />
                        )}
                    </Box>
                </Stack>
            </Box>

            {/* ── sticky footer ── */}
            <Box
                sx={{
                    px: 3,
                    py: 2,
                    flexShrink: 0,
                    display: "flex",
                    gap: 1.5,
                    justifyContent: "flex-end",
                    borderTop: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                }}
            >
                <Button onClick={handleClose} color="inherit" variant="outlined">
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={<Save />}
                    disableElevation
                >
                    {isEdit ? "Save Changes" : "Add Method"}
                </Button>
            </Box>
        </Drawer>
    );
};

export default AddMethodForm;
