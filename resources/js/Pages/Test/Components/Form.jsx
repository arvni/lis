import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Paper,
    Radio,
    RadioGroup,
    Switch,
    Tab,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    ArrowBack,
    ArrowForward,
    Assignment,
    Biotech,
    Cancel,
    CheckCircle,
    Description,
    Error as ErrorIcon,
    Money,
    ReceiptLong,
    Save,
    Science,
    ViewInAr,
} from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Grid from "@mui/material/Grid";
import PageHeader from "@/Components/PageHeader.jsx";
import SelectSearch from "@/Components/SelectSearch";
import MethodFields from "./MethodFields";
import SampleTypeFields from "@/Pages/Test/Components/SampleTypesFields";
import Editor from "@/Components/Editor";
import PricingConfig from "./PricingConfig";

// ─── step config per type ─────────────────────────────────────────────────────

const STEPS = {
    TEST: [
        { key: "basic",       label: "Basic Info",   icon: <Assignment fontSize="small" />,  errorFields: ["fullName", "name", "code", "report_templates"] },
        { key: "samples",     label: "Sample Types", icon: <Biotech fontSize="small" />,     errorFields: ["sample_type_tests"] },
        { key: "methods",     label: "Methods",      icon: <Science fontSize="small" />,     errorFields: ["method_tests"] },
        { key: "description", label: "Description",  icon: <Description fontSize="small" />, errorFields: [] },
    ],
    SERVICE: [
        { key: "basic",       label: "Basic Info",  icon: <Assignment fontSize="small" />,  errorFields: ["fullName", "name", "code"] },
        { key: "methods",     label: "Methods",     icon: <ReceiptLong fontSize="small" />, errorFields: ["method_tests"] },
        { key: "description", label: "Description", icon: <Description fontSize="small" />, errorFields: [] },
    ],
    PANEL: [
        { key: "basic",       label: "Basic Info",  icon: <Assignment fontSize="small" />,  errorFields: ["fullName", "name", "code"] },
        { key: "pricing",     label: "Pricing",     icon: <Money fontSize="small" />,       errorFields: ["price", "referrer_price"] },
        { key: "methods",     label: "Tests",       icon: <ViewInAr fontSize="small" />,    errorFields: ["method_tests"] },
        { key: "description", label: "Description", icon: <Description fontSize="small" />, errorFields: [] },
    ],
};

const TYPE_META = {
    TEST:    { label: "Test",    Icon: Science,     color: "primary" },
    SERVICE: { label: "Service", Icon: ReceiptLong, color: "secondary" },
    PANEL:   { label: "Panel",   Icon: ViewInAr,    color: "info" },
};

// ─── main component ───────────────────────────────────────────────────────────

export default function TestForm({
    data = {},
    setData,
    submit,
    edit,
    cancel,
    errors = {},
    setError,
    clearErrors,
}) {
    const theme  = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

    const [step,       setStep]       = useState(0);
    const [pricingTab, setPricingTab] = useState("direct");

    const steps   = STEPS[data.type] ?? STEPS.TEST;
    const meta    = TYPE_META[data.type] ?? TYPE_META.TEST;
    const current = steps[step];
    const prev    = steps[step - 1];
    const next    = steps[step + 1];

    // ── data helpers ───────────────────────────────────────────────────────
    const set     = (key, val) => setData((p) => ({ ...p, [key]: val }));
    const onField = (e) => set(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);

    const stepHasError = (s) => (s.errorFields || []).some((f) => Boolean(errors?.[f]));

    // ── type change ────────────────────────────────────────────────────────
    const handleTypeChange = (_, v) => {
        setData((p) => ({ ...p, type: v, test_groups: [], report_templates: [], parameters: [], sampleTypes: [] }));
        setStep(0);
    };

    // ── validate + submit ──────────────────────────────────────────────────
    const handleSubmit = () => {
        clearErrors();
        let firstErrorStep = null;

        const fail = (field, msg, stepKey) => {
            setError(field, msg);
            if (firstErrorStep === null) {
                firstErrorStep = steps.findIndex((s) => s.key === stepKey);
            }
        };

        if (!data?.fullName) fail("fullName", "Required", "basic");
        if (!data?.name)     fail("name",     "Required", "basic");
        if (!data?.code)     fail("code",     "Required", "basic");

        if (data?.type === "TEST") {
            if (!data?.report_templates?.length)
                fail("report_templates", "Select at least one template", "basic");
            if (!data?.sample_type_tests?.length)
                fail("sample_type_tests", "Add at least one sample type", "samples");
        }

        if (!data?.method_tests?.length)
            fail("method_tests", "Add at least one method", "methods");

        if (firstErrorStep !== null) { setStep(firstErrorStep); return; }
        submit();
    };

    // ── sidebar (desktop) ──────────────────────────────────────────────────
    const renderSidebar = () => {
        const { Icon, label: typeLabel, color } = meta;
        return (
            <Paper elevation={0} variant="outlined" sx={{ overflow: "hidden", position: "sticky", top: 24 }}>
                {/* live test preview */}
                <Box sx={{ p: 2.5, bgcolor: `${color}.main`, color: `${color}.contrastText` }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                        <Icon sx={{ fontSize: 16, opacity: 0.9 }} />
                        <Typography variant="caption" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1, opacity: 0.85 }}>
                            {typeLabel}
                        </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight={600} sx={{ wordBreak: "break-word", lineHeight: 1.3 }}>
                        {data.fullName || <span style={{ opacity: 0.5, fontStyle: "italic" }}>Untitled</span>}
                    </Typography>
                    {(data.name || data.code) && (
                        <Typography variant="caption" sx={{ opacity: 0.75, mt: 0.5, display: "block" }}>
                            {[data.name, data.code].filter(Boolean).join(" · ")}
                        </Typography>
                    )}
                </Box>

                {/* step list */}
                <Box sx={{ py: 1 }}>
                    {steps.map((s, idx) => {
                        const hasError  = stepHasError(s);
                        const isActive  = idx === step;
                        const isDone    = idx < step && !hasError;

                        return (
                            <Box
                                key={s.key}
                                onClick={() => setStep(idx)}
                                sx={{
                                    display: "flex", alignItems: "center", gap: 1.5,
                                    px: 2, py: 1.25, cursor: "pointer",
                                    bgcolor: isActive ? `${color}.50` : "transparent",
                                    borderLeft: "3px solid",
                                    borderLeftColor: isActive ? `${color}.main` : "transparent",
                                    color: isActive ? `${color}.main` : hasError ? "error.main" : "text.primary",
                                    "&:hover": { bgcolor: isActive ? `${color}.50` : "action.hover" },
                                    transition: "all 0.15s",
                                }}
                            >
                                <Box sx={{
                                    width: 26, height: 26, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    bgcolor: isActive ? `${color}.main` : hasError ? "error.light" : isDone ? "success.light" : "grey.100",
                                    color: isActive ? "white" : hasError ? "error.main" : isDone ? "success.main" : "text.disabled",
                                }}>
                                    {hasError ? <ErrorIcon sx={{ fontSize: 14 }} /> : isDone ? <CheckCircle sx={{ fontSize: 14 }} /> : React.cloneElement(s.icon, { style: { fontSize: 14 } })}
                                </Box>
                                <Typography variant="body2" fontWeight={isActive ? 600 : 400}>
                                    {s.label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                <Divider />
                <Box sx={{ p: 1.5 }}>
                    <Button fullWidth size="small" color="inherit" startIcon={<Cancel />} onClick={cancel}>
                        Cancel
                    </Button>
                </Box>
            </Paper>
        );
    };

    // ── mobile step chips ──────────────────────────────────────────────────
    const renderMobileNav = () => (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 2, "&::-webkit-scrollbar": { display: "none" } }}>
            {steps.map((s, idx) => {
                const hasError = stepHasError(s);
                const isActive = idx === step;
                const isDone   = idx < step && !hasError;
                return (
                    <Chip
                        key={s.key}
                        icon={hasError ? <ErrorIcon /> : isDone ? <CheckCircle /> : s.icon}
                        label={s.label}
                        onClick={() => setStep(idx)}
                        color={isActive ? "primary" : hasError ? "error" : isDone ? "success" : "default"}
                        variant={isActive ? "filled" : "outlined"}
                        sx={{ flexShrink: 0, fontWeight: isActive ? 600 : 400 }}
                    />
                );
            })}
        </Box>
    );

    // ── nav bar (inside content) ───────────────────────────────────────────
    const renderNav = () => (
        <Box sx={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            pt: 3, mt: 3, borderTop: 1, borderColor: "divider",
        }}>
            <Button
                variant="outlined"
                color="inherit"
                startIcon={<ArrowBack />}
                onClick={prev ? () => setStep(step - 1) : cancel}
            >
                {prev ? prev.label : "Cancel"}
            </Button>

            <Box sx={{ display: "flex", gap: 1 }}>
                {edit && (
                    <Button variant="contained" color="success" startIcon={<Save />} onClick={handleSubmit}>
                        Save Changes
                    </Button>
                )}
                {next ? (
                    <Button variant="contained" endIcon={<ArrowForward />} onClick={() => setStep(step + 1)}>
                        {next.label}
                    </Button>
                ) : !edit ? (
                    <Button variant="contained" color="success" startIcon={<Save />} onClick={handleSubmit}>
                        Create {meta.label}
                    </Button>
                ) : null}
            </Box>
        </Box>
    );


    // ─── step content renderers ───────────────────────────────────────────

    const renderBasic = () => (
        <Box>
            {/* section: type */}
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Test Type
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <RadioGroup row value={data.type} onChange={handleTypeChange}>
                    {[
                        { value: "TEST",    label: "Test",    Icon: Science },
                        { value: "SERVICE", label: "Service", Icon: ReceiptLong },
                        { value: "PANEL",   label: "Panel",   Icon: ViewInAr },
                    ].map(({ value, label, Icon }) => (
                        <FormControlLabel
                            key={value}
                            value={value}
                            disabled={Boolean(data?.id)}
                            control={<Radio size="small" />}
                            label={<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Icon fontSize="small" />{label}</Box>}
                        />
                    ))}
                </RadioGroup>
                <FormHelperText>
                    {data?.id ? "Type cannot be changed after creation" : "Determines which fields and workflow apply"}
                </FormHelperText>
            </Paper>

            {/* section: identifiers */}
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Identifiers
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                        name="fullName" label="Full Name" value={data.fullName || ""} onChange={onField}
                        fullWidth required error={Boolean(errors?.fullName)}
                        helperText={errors?.fullName || "Shown on reports and invoices"}
                        placeholder="e.g. Complete Blood Count"
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField
                        name="name" label="Short Name" value={data.name || ""} onChange={onField}
                        fullWidth required error={Boolean(errors?.name)}
                        helperText={errors?.name || "Abbreviated label"}
                        placeholder="e.g. CBC"
                    />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <TextField
                        name="code" label="Test Code" value={data.code || ""} onChange={onField}
                        fullWidth required error={Boolean(errors?.code)}
                        helperText={errors?.code || "Unique code"}
                        placeholder="e.g. CBC-001"
                    />
                </Grid>
            </Grid>

            {/* section: settings */}
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Settings
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    <FormControlLabel
                        name="status"
                        control={<Switch checked={Boolean(data.status)} onChange={onField} color="success" />}
                        label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                Active
                                <Chip size="small" label={data.status ? "Yes" : "No"} color={data.status ? "success" : "default"} />
                            </Box>
                        }
                    />
                    <FormControlLabel
                        name="can_merge"
                        control={<Switch checked={Boolean(data.can_merge)} onChange={onField} color="success" />}
                        label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                Merge on Invoice
                                <Chip size="small" label={data.can_merge ? "Yes" : "No"} color={data.can_merge ? "success" : "default"} />
                            </Box>
                        }
                    />
                </Box>
            </Paper>

            {/* section: classification */}
            {(data.type === "TEST" || data.type === "PANEL") && (
                <>
                    <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                        Classification
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <SelectSearch
                                value={data.test_groups || []} onChange={onField}
                                name="test_groups" multiple fullWidth label="Test Groups"
                                url={route("api.testGroups.list")}
                                error={Boolean(errors?.test_groups)} helperText={errors?.test_groups}
                            />
                        </Grid>
                    </Grid>
                </>
            )}

            {/* section: TEST-specific documents */}
            {data.type === "TEST" && (
                <>
                    <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                        Reports & Documents
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <SelectSearch
                                value={data.report_templates || []} onChange={onField}
                                name="report_templates" multiple fullWidth label="Report Templates *"
                                url={route("api.reportTemplates.list")}
                                error={Boolean(errors?.report_templates)}
                                helperText={errors?.report_templates || "Templates used when generating results"}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                value={data.request_form || ""} onChange={onField}
                                name="request_form" fullWidth label="Request Form"
                                url={route("api.requestForms.list")}
                                error={Boolean(errors?.request_form)} helperText={errors?.request_form}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                value={data.consent_form || ""} onChange={onField}
                                name="consent_form" fullWidth label="Consent Form"
                                url={route("api.consentForms.list")}
                                error={Boolean(errors?.consent_form)} helperText={errors?.consent_form}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                value={data.instruction || ""} onChange={onField}
                                name="instruction" fullWidth label="Patient Instructions"
                                url={route("api.instructions.list")}
                                error={Boolean(errors?.instruction)} helperText={errors?.instruction}
                            />
                        </Grid>
                    </Grid>
                </>
            )}

            {renderNav()}
        </Box>
    );

    const renderSamples = () => (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Define the specimen types accepted for this test. At least one is required.
            </Typography>
            {errors?.sample_type_tests && <Alert severity="error" sx={{ mb: 2 }}>{errors.sample_type_tests}</Alert>}
            <SampleTypeFields
                onChange={set} name="sample_type_tests"
                error={errors?.sample_type_tests} sampleTypes={data.sample_type_tests || []}
            />
            {renderNav()}
        </Box>
    );

    const renderPricing = () => (
        <Box>
            <TabContext value={pricingTab}>
                <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                    <TabList onChange={(_, v) => setPricingTab(v)}>
                        {[
                            { value: "direct",   label: "Direct Patient", sub: "Walk-in pricing",        errKey: "price" },
                            { value: "referral", label: "Referral",       sub: "Doctor-referred pricing", errKey: "referrer_price" },
                        ].map(({ value, label, sub, errKey }) => (
                            <Tab
                                key={value} value={value}
                                sx={{ textTransform: "none", alignItems: "flex-start" }}
                                label={
                                    <Box sx={{ textAlign: "left" }}>
                                        <Typography variant="body2" fontWeight="medium">{label}</Typography>
                                        <Typography variant="caption" color={errors?.[errKey] ? "error" : "text.secondary"}>
                                            {errors?.[errKey] || sub}
                                        </Typography>
                                    </Box>
                                }
                            />
                        ))}
                    </TabList>
                </Box>

                <TabPanel value="direct" sx={{ p: 0 }}>
                    <PricingConfig
                        priceType={data?.price_type || "Fix"}
                        price={data?.price}
                        extra={data?.extra || {}}
                        onPriceTypeChange={(v) => set("price_type", v)}
                        onPriceChange={(v) => set("price", v)}
                        onExtraChange={(newExtra) => set("extra", newExtra)}
                        error={errors?.price}
                    />
                </TabPanel>

                <TabPanel value="referral" sx={{ p: 0 }}>
                    <PricingConfig
                        priceType={data?.referrer_price_type || "Fix"}
                        price={data?.referrer_price}
                        extra={data?.referrer_extra || {}}
                        onPriceTypeChange={(v) => set("referrer_price_type", v)}
                        onPriceChange={(v) => set("referrer_price", v)}
                        onExtraChange={(newExtra) => set("referrer_extra", newExtra)}
                        error={errors?.referrer_price}
                    />
                </TabPanel>
            </TabContext>

            {renderNav()}
        </Box>
    );

    const renderMethods = () => (
        <Box>
            <MethodFields
                onChange={set} methodTests={data?.method_tests || []}
                error={errors?.method_tests} name="method_tests"
                type={data.type} label={data.type === "PANEL" ? "Tests" : "Methods"}
            />
            {renderNav()}
        </Box>
    );

    const renderDescription = () => (
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Optional — patient preparation notes, clinical context, or any other relevant information.
            </Typography>
            <Editor value={data?.description || ""} name="description" onChange={onField} />
            {renderNav()}
        </Box>
    );

    const renderContent = () => {
        switch (current?.key) {
            case "basic":       return renderBasic();
            case "samples":     return renderSamples();
            case "pricing":     return renderPricing();
            case "methods":     return renderMethods();
            case "description": return renderDescription();
            default:            return null;
        }
    };

    // ── section header ─────────────────────────────────────────────────────
    const renderStepHeader = () => (
        <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
                width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: `${meta.color}.main`, color: "white",
            }}>
                {current?.icon && React.cloneElement(current.icon, { style: { fontSize: 18 } })}
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>{current?.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                    Step {step + 1} of {steps.length}
                </Typography>
            </Box>
        </Box>
    );

    // ─── shell ────────────────────────────────────────────────────────────

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            <PageHeader title={`${edit ? "Edit" : "New"} ${meta.label}`} sx={{ mb: 3 }} />

            <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                {/* sidebar — desktop only */}
                {isDesktop && (
                    <Box sx={{ width: 220, flexShrink: 0 }}>
                        {renderSidebar()}
                    </Box>
                )}

                {/* main content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* mobile chips */}
                    {!isDesktop && renderMobileNav()}

                    <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
                        {renderStepHeader()}
                        {renderContent()}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
