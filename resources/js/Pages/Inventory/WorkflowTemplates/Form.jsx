import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import {
    Alert, Autocomplete, Box, Button, Card, CardContent, CardHeader,
    Chip, Divider, FormControlLabel, Grid, IconButton, MenuItem,
    Stack, Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const emptyStep = (sortOrder = 0) => ({
    name: "",
    sort_order: sortOrder,
    deadline_days: "",
    approver_type: "role",  // "role" | "user"
    approver_user_id: null,
    approver_role: null,
    _user: null,
});

const WorkflowTemplateForm = () => {
    const {template, users, roles, urgencies, success, status} = usePage().props;
    const isEdit = !!template;

    const buildSteps = () => {
        if (!template?.steps?.length) return [];
        return template.steps.map((s) => ({
            name:             s.name,
            sort_order:       s.sort_order,
            deadline_days:    s.deadline_days ?? "",
            approver_type:    s.approver_user_id ? "user" : "role",
            approver_user_id: s.approver_user_id ?? null,
            approver_role:    s.approver_role ?? null,
            _user:            s.approver_user ?? null,
        }));
    };

    const {data, setData, post, put, processing, errors} = useForm({
        name:        template?.name ?? "",
        description: template?.description ?? "",
        is_active:   template?.is_active ?? true,
        is_default:  template?.is_default ?? false,
        priority:    template?.priority ?? 0,
        conditions:  {
            urgencies:       template?.conditions?.urgencies       ?? [],
            requester_roles: template?.conditions?.requester_roles ?? [],
            min_total:       template?.conditions?.min_total       ?? "",
        },
        steps: buildSteps(),
    });

    const [localSteps, setLocalSteps] = useState(buildSteps);

    const syncSteps = (updated) => {
        const withOrder = updated.map((s, i) => ({...s, sort_order: i}));
        setLocalSteps(withOrder);
        setData("steps", withOrder.map(({_user, approver_type, ...rest}) => rest));
    };

    const addStep = () => syncSteps([...localSteps, emptyStep(localSteps.length)]);

    const removeStep = (idx) => syncSteps(localSteps.filter((_, i) => i !== idx));

    const moveStep = (idx, dir) => {
        const next = [...localSteps];
        const swap = idx + dir;
        if (swap < 0 || swap >= next.length) return;
        [next[idx], next[swap]] = [next[swap], next[idx]];
        syncSteps(next);
    };

    const updateStep = (idx, field, value) => {
        syncSteps(localSteps.map((s, i) => i !== idx ? s : {...s, [field]: value}));
    };

    const setStepUser = (idx, user) => {
        syncSteps(localSteps.map((s, i) => i !== idx ? s : {
            ...s,
            _user: user,
            approver_user_id: user?.id ?? null,
        }));
    };

    const submit = () => {
        if (isEdit) {
            put(route("inventory.workflow-templates.update", template.id));
        } else {
            post(route("inventory.workflow-templates.store"));
        }
    };

    return (
        <>
            <PageHeader
                title={isEdit ? `Edit: ${template.name}` : "New Workflow Template"}
                actions={
                    <Box sx={{display: "flex", gap: 1}}>
                        <Button variant="outlined" onClick={() => router.visit(route("inventory.workflow-templates.index"))}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={submit} disabled={processing}>
                            {isEdit ? "Save Changes" : "Create Template"}
                        </Button>
                    </Box>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2}}>{status}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Template info */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardHeader title="Template Info"/>
                        <CardContent sx={{display: "flex", flexDirection: "column", gap: 2}}>
                            <TextField
                                fullWidth required size="small" label="Name"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                error={!!errors.name}
                                helperText={errors.name}
                            />
                            <TextField
                                fullWidth multiline rows={3} size="small" label="Description (optional)"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.is_active}
                                        onChange={(e) => setData("is_active", e.target.checked)}
                                    />
                                }
                                label="Active"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={data.is_default}
                                        onChange={(e) => setData("is_default", e.target.checked)}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body2">Default / fallback</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Used when no other template matches
                                        </Typography>
                                    </Box>
                                }
                            />
                            <TextField
                                fullWidth size="small" type="number" label="Priority"
                                inputProps={{min: 0}}
                                value={data.priority}
                                onChange={(e) => setData("priority", parseInt(e.target.value) || 0)}
                                helperText="Lower number = evaluated first (0 = highest priority)"
                            />
                        </CardContent>
                    </Card>

                    <Card sx={{mt: 2}}>
                        <CardHeader
                            title="Matching Conditions"
                            subheader="Leave both empty to match every request (use with Default enabled)."
                        />
                        <CardContent sx={{display: "flex", flexDirection: "column", gap: 2}}>
                            <Autocomplete
                                multiple
                                options={urgencies}
                                value={data.conditions.urgencies}
                                onChange={(_, v) => setData("conditions", {...data.conditions, urgencies: v})}
                                renderTags={(val, getTagProps) =>
                                    val.map((opt, idx) => (
                                        <Chip key={opt} label={opt} size="small" {...getTagProps({index: idx})}/>
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        label="Urgency levels"
                                        helperText="Empty = match any urgency"
                                    />
                                )}
                            />
                            <TextField
                                fullWidth size="small" type="number" label="Min. estimated total"
                                inputProps={{min: 0, step: 0.01}}
                                value={data.conditions.min_total}
                                onChange={(e) => setData("conditions", {...data.conditions, min_total: e.target.value})}
                                helperText="Apply when estimated PR total ≥ this amount (leave empty to ignore)"
                            />
                            <Autocomplete
                                multiple
                                options={roles}
                                value={data.conditions.requester_roles}
                                onChange={(_, v) => setData("conditions", {...data.conditions, requester_roles: v})}
                                renderTags={(val, getTagProps) =>
                                    val.map((opt, idx) => (
                                        <Chip key={opt} label={opt} size="small" color="primary" variant="outlined" {...getTagProps({index: idx})}/>
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        size="small"
                                        label="Requester roles"
                                        helperText="Empty = match any role"
                                    />
                                )}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Steps */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardHeader
                            title="Approval Steps"
                            subheader="Steps are executed top-to-bottom. All must be approved for the PR to be approved."
                            action={
                                <Button startIcon={<AddIcon/>} size="small" onClick={addStep} sx={{mt: 1, mr: 1}}>
                                    Add Step
                                </Button>
                            }
                        />
                        <CardContent sx={{pt: 0}}>
                            {localSteps.length === 0 ? (
                                <Box sx={{py: 4, textAlign: "center"}}>
                                    <Typography color="text.secondary" variant="body2">
                                        No steps yet. Add steps to define the approval chain.
                                    </Typography>
                                    <Typography color="text.secondary" variant="caption">
                                        Without steps, submitting a PR will skip workflow approval.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {localSteps.map((step, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: "flex", gap: 1, alignItems: "flex-start",
                                                p: 1.5, border: "1px solid", borderColor: "divider",
                                                borderRadius: 1, bgcolor: "background.default",
                                            }}
                                        >
                                            {/* Order controls */}
                                            <Box sx={{display: "flex", flexDirection: "column", gap: 0}}>
                                                <Chip
                                                    label={idx + 1}
                                                    size="small"
                                                    sx={{mb: 0.5, minWidth: 32, fontWeight: 700}}
                                                />
                                                <IconButton size="small" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                                                    <ArrowUpwardIcon fontSize="small"/>
                                                </IconButton>
                                                <IconButton size="small" onClick={() => moveStep(idx, 1)} disabled={idx === localSteps.length - 1}>
                                                    <ArrowDownwardIcon fontSize="small"/>
                                                </IconButton>
                                            </Box>

                                            {/* Step fields */}
                                            <Box sx={{flex: 1, display: "flex", flexDirection: "column", gap: 1.5}}>
                                                <TextField
                                                    fullWidth required size="small" label="Step Name"
                                                    placeholder="e.g. Department Head Approval"
                                                    value={step.name}
                                                    onChange={(e) => updateStep(idx, "name", e.target.value)}
                                                    error={!!errors[`steps.${idx}.name`]}
                                                    helperText={errors[`steps.${idx}.name`]}
                                                />

                                                <Grid container spacing={1}>
                                                    <Grid item xs={12} sm={4}>
                                                        <TextField
                                                            fullWidth size="small" type="number" label="Deadline (days)"
                                                            inputProps={{min: 1}}
                                                            value={step.deadline_days}
                                                            onChange={(e) => updateStep(idx, "deadline_days", e.target.value ? parseInt(e.target.value) : "")}
                                                            helperText="Leave empty for no deadline"
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={4}>
                                                        <TextField
                                                            select fullWidth size="small" label="Approver Type"
                                                            value={step.approver_type}
                                                            onChange={(e) => {
                                                                const t = e.target.value;
                                                                syncSteps(localSteps.map((s, i) => i !== idx ? s : {
                                                                    ...s,
                                                                    approver_type:    t,
                                                                    approver_user_id: null,
                                                                    approver_role:    null,
                                                                    _user:            null,
                                                                }));
                                                            }}
                                                        >
                                                            <MenuItem value="role">By Role</MenuItem>
                                                            <MenuItem value="user">Specific User</MenuItem>
                                                        </TextField>
                                                    </Grid>

                                                    <Grid item xs={12} sm={4}>
                                                        {step.approver_type === "role" ? (
                                                            <Autocomplete
                                                                size="small"
                                                                options={roles}
                                                                value={step.approver_role ?? null}
                                                                onChange={(_, v) => updateStep(idx, "approver_role", v)}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        label="Role"
                                                                        required
                                                                        error={!!errors[`steps.${idx}.approver_role`]}
                                                                        helperText={errors[`steps.${idx}.approver_role`] ?? "Any user with this role can approve"}
                                                                    />
                                                                )}
                                                            />
                                                        ) : (
                                                            <Autocomplete
                                                                size="small"
                                                                options={users}
                                                                getOptionLabel={(u) => u.name}
                                                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                                                value={step._user ?? null}
                                                                onChange={(_, u) => setStepUser(idx, u)}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        label="User"
                                                                        required
                                                                        error={!!errors[`steps.${idx}.approver_user_id`]}
                                                                        helperText={errors[`steps.${idx}.approver_user_id`]}
                                                                    />
                                                                )}
                                                            />
                                                        )}
                                                    </Grid>
                                                </Grid>
                                            </Box>

                                            <IconButton size="small" color="error" onClick={() => removeStep(idx)} sx={{mt: 0.5}}>
                                                <DeleteIcon fontSize="small"/>
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

WorkflowTemplateForm.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={[
        {title: "Inventory", link: null},
        {title: "Workflow Templates", link: route("inventory.workflow-templates.index")},
        {title: page.props.template ? "Edit" : "New", link: null},
    ]}>{page}</AuthenticatedLayout>
);

export default WorkflowTemplateForm;
