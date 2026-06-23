import { Autocomplete, Box, Grid, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableStep = ({
    step,
    idx,
    total,
    errors,
    roles,
    users,
    updateStep,
    setStepUser,
    removeStep,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: step._id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box ref={setNodeRef} style={style} sx={{ display: 'flex', gap: 0 }}>
            {/* Timeline spine */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mr: 2,
                    minWidth: 40,
                }}
            >
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                        boxShadow: isDragging ? 3 : 1,
                    }}
                >
                    {idx + 1}
                </Box>
                {idx < total - 1 && (
                    <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', mt: 0.5, minHeight: 16 }} />
                )}
            </Box>

            {/* Step card */}
            <Box
                sx={{
                    flex: 1,
                    mb: idx < total - 1 ? 2 : 0,
                    p: 2,
                    border: '1px solid',
                    borderColor: isDragging ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    boxShadow: isDragging ? 4 : 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            cursor: 'grab',
                            color: 'text.disabled',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <DragIndicatorIcon fontSize="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                        Step {idx + 1}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => removeStep(idx)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                        fullWidth
                        required
                        size="small"
                        label="Step Name"
                        placeholder="e.g. Department Head Approval"
                        value={step.name}
                        onChange={(e) => updateStep(idx, 'name', e.target.value)}
                        error={!!errors[`steps.${idx}.name`]}
                        helperText={errors[`steps.${idx}.name`]}
                    />

                    <Grid container spacing={1}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Deadline (days)"
                                slotProps={{ htmlInput: { min: 1 } }}
                                value={step.deadline_days}
                                onChange={(e) =>
                                    updateStep(
                                        idx,
                                        'deadline_days',
                                        e.target.value ? parseInt(e.target.value) : '',
                                    )
                                }
                                helperText="Leave empty for no deadline"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Approver Type"
                                value={step.approver_type}
                                onChange={(e) =>
                                    updateStep(idx, '_approver_type_reset', e.target.value)
                                }
                            >
                                <MenuItem value="role">By Role</MenuItem>
                                <MenuItem value="user">Specific User</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            {step.approver_type === 'role' ? (
                                <Autocomplete
                                    size="small"
                                    options={roles}
                                    value={step.approver_role ?? null}
                                    onChange={(_, v) => updateStep(idx, 'approver_role', v)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Role"
                                            required
                                            error={!!errors[`steps.${idx}.approver_role`]}
                                            helperText={
                                                errors[`steps.${idx}.approver_role`] ??
                                                'Any user with this role can approve'
                                            }
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
            </Box>
        </Box>
    );
};

export default SortableStep;
