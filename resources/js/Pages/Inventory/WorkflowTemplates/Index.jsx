import {router, usePage} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, Chip, IconButton, Stack,
    Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const StepBadge = ({step}) => {
    const label = step.approver_user
        ? step.approver_user.name
        : step.approver_role ?? "—";
    return (
        <Chip label={label} size="small" variant="outlined" sx={{mr: 0.5, mb: 0.5, fontSize: "0.7rem"}}/>
    );
};

const WorkflowTemplatesIndex = () => {
    const {templates, success, status} = usePage().props;

    const handleDelete = (id) => {
        if (!confirm("Delete this workflow template?")) return;
        router.delete(route("inventory.workflow-templates.destroy", id));
    };

    return (
        <>
            <PageHeader
                title="Workflow Templates"
                actions={
                    <Button
                        startIcon={<AddIcon/>}
                        variant="contained"
                        onClick={() => router.visit(route("inventory.workflow-templates.create"))}
                    >
                        New Template
                    </Button>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2}}>{status}</Alert>
            )}

            {templates.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center" py={3}>
                            No workflow templates yet. Create one to enable multi-step approval on purchase requests.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Conditions</TableCell>
                                <TableCell>Steps</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Used By</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {templates.map((tpl) => (
                                <TableRow key={tpl.id} hover>
                                    <TableCell>
                                        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                            {tpl.is_default && (
                                                <Tooltip title="Default / fallback template">
                                                    <StarIcon fontSize="small" color="warning"/>
                                                </Tooltip>
                                            )}
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{tpl.name}</Typography>
                                                {tpl.description && (
                                                    <Typography variant="caption" color="text.secondary">{tpl.description}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{minWidth: 200}}>
                                        {(!tpl.conditions?.urgencies?.length && !tpl.conditions?.requester_roles?.length) ? (
                                            <Typography variant="caption" color="text.disabled">
                                                {tpl.is_default ? "Fallback (any)" : "—"}
                                            </Typography>
                                        ) : (
                                            <Stack spacing={0.5}>
                                                {tpl.conditions?.urgencies?.length > 0 && (
                                                    <Box sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                                                        {tpl.conditions.urgencies.map((u) => (
                                                            <Chip key={u} label={u} size="small" variant="outlined" color="warning" sx={{fontSize: "0.65rem"}}/>
                                                        ))}
                                                    </Box>
                                                )}
                                                {tpl.conditions?.requester_roles?.length > 0 && (
                                                    <Box sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
                                                        {tpl.conditions.requester_roles.map((r) => (
                                                            <Chip key={r} label={r} size="small" variant="outlined" color="primary" sx={{fontSize: "0.65rem"}}/>
                                                        ))}
                                                    </Box>
                                                )}
                                            </Stack>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {tpl.steps.length === 0 ? (
                                            <Typography variant="caption" color="text.secondary">No steps</Typography>
                                        ) : (
                                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                {tpl.steps.map((s, i) => (
                                                    <Box key={s.id} sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                                        <Typography variant="caption" color="text.disabled">{i + 1}.</Typography>
                                                        <Chip
                                                            label={`${s.name}: ${s.approver_user?.name ?? s.approver_role ?? "—"}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{fontSize: "0.7rem"}}
                                                        />
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={tpl.priority} size="small" variant="outlined" sx={{fontFamily: "monospace"}}/>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{tpl.purchase_requests_count} PR{tpl.purchase_requests_count !== 1 ? "s" : ""}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tpl.is_active ? "Active" : "Inactive"}
                                            size="small"
                                            color={tpl.is_active ? "success" : "default"}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => router.visit(route("inventory.workflow-templates.edit", tpl.id))}>
                                            <EditIcon fontSize="small"/>
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(tpl.id)}>
                                            <DeleteIcon fontSize="small"/>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </>
    );
};

WorkflowTemplatesIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={[
        {title: "Inventory", link: null},
        {title: "Workflow Templates", link: null},
    ]}>{page}</AuthenticatedLayout>
);

export default WorkflowTemplatesIndex;
