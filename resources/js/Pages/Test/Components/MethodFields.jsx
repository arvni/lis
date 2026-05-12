import React, { startTransition, useState } from "react";
import {
    Alert, Avatar, Box, Button, Chip,
    IconButton, Paper, Switch, Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import AddMethodForm    from "@/Pages/Test/Components/AddMethodForm";
import SelectMethodForm from "@/Pages/Test/Components/SelectMethodForm.jsx";
import DeleteForm       from "@/Components/DeleteForm";
import { makeId }       from "@/Services/helper";

const BLANK_METHOD = { price_type: "Fix", referrer_price_type: "Fix" };
const newDraft = () => ({ method: { ...BLANK_METHOD }, status: true });

const MethodFields = ({
    onChange,
    error,
    name,
    label       = "Methods",
    methodTests = [],
    type        = "TEST",
}) => {
    const [draft,      setDraft]      = useState(newDraft());
    const [formErrors, setFormErrors] = useState({});
    const [showAdd,    setShowAdd]    = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const findIndex = (id) => methodTests.findIndex((m) => m.id === id);
    const emit      = (list) => onChange(name, list);

    const openAdd = () => { setDraft(newDraft()); setFormErrors({}); setShowAdd(true); };

    const openEdit = (id) => {
        const i = findIndex(id);
        if (i >= 0) { setDraft(methodTests[i]); setFormErrors({}); setShowAdd(true); }
    };

    const closeAdd = () => { setShowAdd(false); setFormErrors({}); };

    const openDelete = (id) => {
        const i = findIndex(id);
        if (i >= 0) { setDraft(methodTests[i]); setShowDelete(true); }
    };

    const closeDelete = () => { setShowDelete(false); };

    const onMethodChange = (key, value) =>
        setDraft((prev) => ({ ...prev, method: { ...(prev.method || {}), [key]: value } }));

    const onDraftChange = (key, value) =>
        setDraft((prev) => ({ ...prev, [key]: value }));

    const validate = () => {
        const m    = draft?.method || {};
        const errs = {};

        if (type === "PANEL") {
            if (!m.id) errs.method = "Please select a method";
        } else {
            if (!m.name?.trim())               errs.name = "Method name is required";
            else if (m.name.trim().length < 2) errs.name = "Name must be at least 2 characters";

            if ((m.price_type ?? "Fix") === "Fix") {
                if (!m.price || m.price < 1) errs.price = "Enter a price greater than 0";
            }
            if ((m.referrer_price_type ?? "Fix") === "Fix") {
                if (!m.referrer_price || m.referrer_price < 1)
                    errs.referrer_price = "Enter a referral price greater than 0";
            }
            if (type === "TEST") {
                if (!m.turnaround_time || m.turnaround_time < 1) errs.turnaround_time = "Turnaround time is required";
                if (!m.workflow?.id)                              errs.workflow        = "Workflow is required";
                if (!m.barcode_group?.id)                         errs.barcode_group   = "Barcode group is required";
            }
        }

        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const save = () => {
        if (!validate()) return;
        const list = [...methodTests];
        if (draft.id) {
            const i = findIndex(draft.id);
            if (i >= 0) list[i] = draft;
        } else {
            list.push({ ...draft, id: makeId(5) });
        }
        closeAdd();
        startTransition(() => emit(list));
    };

    const confirmDelete = () => {
        const i    = findIndex(draft.id);
        const list = [...methodTests];
        if (i >= 0) list.splice(i, 1);
        closeDelete();
        startTransition(() => emit(list));
    };

    const toggleStatus = (id) => (e) => {
        const i = findIndex(id);
        if (i >= 0) {
            const list  = [...methodTests];
            list[i]     = { ...list[i], status: e.target.checked };
            emit(list);
        }
    };

    const addLabel = type === "PANEL" ? "Add Test" : "Add Method";

    return (
        <Box>
            {/* ── header ── */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Typography variant="h6" fontWeight={600}>{label}</Typography>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={openAdd}>
                    {addLabel}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* ── empty state ── */}
            {methodTests.length === 0 && (
                <Box
                    sx={{
                        border: "2px dashed",
                        borderColor: "divider",
                        borderRadius: 2,
                        py: 5,
                        textAlign: "center",
                        color: "text.secondary",
                    }}
                >
                    <Typography variant="body2">
                        No {type === "PANEL" ? "tests" : "methods"} added yet.
                    </Typography>
                    <Button size="small" startIcon={<Add />} sx={{ mt: 1 }} onClick={openAdd}>
                        {addLabel}
                    </Button>
                </Box>
            )}

            {/* ── timeline ── */}
            <Box>
                {methodTests.map((item, index) => {
                    const m      = item.method || {};
                    const isLast = index === methodTests.length - 1;
                    const price  = (m.price_type ?? "Fix") === "Fix"
                        ? (m.price ? `$${m.price}` : "—")
                        : "Variable";
                    const refPrice = (m.referrer_price_type ?? "Fix") === "Fix"
                        ? (m.referrer_price ? `$${m.referrer_price}` : "—")
                        : "Variable";

                    return (
                        <Box key={item.id} sx={{ display: "flex", gap: 1.5 }}>
                            {/* step indicator + connector line */}
                            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 0.5 }}>
                                <Avatar
                                    sx={{
                                        width: 30,
                                        height: 30,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                        bgcolor: item.status ? "primary.main" : "action.disabledBackground",
                                        color:   item.status ? "primary.contrastText" : "text.disabled",
                                    }}
                                >
                                    {index + 1}
                                </Avatar>
                                {!isLast && (
                                    <Box sx={{ width: 2, flex: 1, minHeight: 20, bgcolor: "divider", my: 0.5 }} />
                                )}
                            </Box>

                            {/* card */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    flex: 1,
                                    mb: isLast ? 0 : 1.5,
                                    p: 1.5,
                                    opacity:    item.status ? 1 : 0.5,
                                    transition: "opacity .2s",
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                                    {/* info */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                                            {m.name || m.test_name || "Unnamed"}
                                        </Typography>

                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                                            <Chip label={`Price: ${price}`}   size="small" variant="outlined" />
                                            <Chip label={`Ref: ${refPrice}`}  size="small" variant="outlined" />
                                            {type === "TEST" && m.turnaround_time && (
                                                <Chip label={`TAT: ${m.turnaround_time}h`} size="small" variant="outlined" />
                                            )}
                                            {m.workflow?.name && (
                                                <Chip label={m.workflow.name} size="small" color="primary" variant="outlined" />
                                            )}
                                        </Box>
                                    </Box>

                                    {/* actions */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                                        <Switch
                                            size="small"
                                            checked={!!item.status}
                                            onChange={toggleStatus(item.id)}
                                        />
                                        <IconButton size="small" onClick={() => openEdit(item.id)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => openDelete(item.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    );
                })}
            </Box>

            {/* ── dialogs ── */}
            {type !== "PANEL" ? (
                <AddMethodForm
                    open={showAdd}
                    method={draft.method}
                    onChange={onMethodChange}
                    onSubmit={save}
                    onClose={closeAdd}
                    errors={formErrors}
                    type={type}
                />
            ) : (
                <SelectMethodForm
                    open={showAdd}
                    method={draft.method}
                    onChange={onDraftChange}
                    onSubmit={save}
                    onClose={closeAdd}
                    errors={formErrors}
                />
            )}

            <DeleteForm
                title={`Delete ${draft?.method?.name || "Method"}`}
                confirmText={`Delete "${draft?.method?.name || ""}"? This cannot be undone.`}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                agreeCB={confirmDelete}
                disAgreeCB={closeDelete}
                openDelete={showDelete}
            />
        </Box>
    );
};

export default MethodFields;
