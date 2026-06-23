import { Autocomplete, Card, CardContent, CardHeader, Chip, TextField } from '@mui/material';

const MatchingConditionsCard = ({ data, setData, roles, urgencies }) => (
    <Card sx={{ mt: 2 }}>
        <CardHeader
            title="Matching Conditions"
            subheader="Leave both empty to match every request (use with Default enabled)."
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
                multiple
                options={urgencies}
                value={data.conditions.urgencies}
                onChange={(_, v) => setData('conditions', { ...data.conditions, urgencies: v })}
                renderTags={(val, getTagProps) =>
                    val.map((opt, idx) => (
                        <Chip key={opt} label={opt} size="small" {...getTagProps({ index: idx })} />
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
                fullWidth
                size="small"
                type="number"
                label="Min. estimated total"
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                value={data.conditions.min_total}
                onChange={(e) =>
                    setData('conditions', { ...data.conditions, min_total: e.target.value })
                }
                helperText="Apply when estimated PR total ≥ this amount (leave empty to ignore)"
            />
            <Autocomplete
                multiple
                options={roles}
                value={data.conditions.requester_roles}
                onChange={(_, v) =>
                    setData('conditions', { ...data.conditions, requester_roles: v })
                }
                renderTags={(val, getTagProps) =>
                    val.map((opt, idx) => (
                        <Chip
                            key={opt}
                            label={opt}
                            size="small"
                            color="primary"
                            variant="outlined"
                            {...getTagProps({ index: idx })}
                        />
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
);

export default MatchingConditionsCard;
