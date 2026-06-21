import {
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import { Info } from '@mui/icons-material';

const RelationshipSection = ({
    editable,
    relationOptions,
    currentRelationship,
    showCustomInput,
    customRelationship,
    setCustomRelationship,
    onChange,
    onAddCustom,
    onCustomKeyDown,
}) => (
    <>
        <FormControl fullWidth variant="outlined">
            <InputLabel id="relationship-select-label">Relationship *</InputLabel>
            <Select
                id="relationship"
                labelId="relationship-select-label"
                value={currentRelationship}
                label="Relationship *"
                onChange={onChange}
                name="relationship"
                disabled={!editable}
                variant="outlined"
                multiple
                startAdornment={<Info color="primary" sx={{ mr: 1 }} />}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected
                            .filter((v) => v !== 'other')
                            .map((value) => (
                                <Chip key={value} label={value} size="small" />
                            ))}
                        {selected.includes('other') && (
                            <Chip label="Other" size="small" color="warning" />
                        )}
                    </Box>
                )}
                MenuProps={{
                    slotProps: {
                        paper: {
                            style: {
                                maxHeight: 224,
                            },
                        },
                    },
                }}
            >
                {relationOptions.map((relation) => (
                    <MenuItem key={relation.value} value={relation.value} role="option">
                        {relation.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
        {showCustomInput && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Custom Relationship"
                    placeholder="e.g. step mother, guardian..."
                    value={customRelationship}
                    onChange={(e) => setCustomRelationship(e.target.value)}
                    onKeyDown={onCustomKeyDown}
                    disabled={!editable}
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={onAddCustom}
                    disabled={!customRelationship.trim() || !editable}
                >
                    Add
                </Button>
            </Stack>
        )}
    </>
);

export default RelationshipSection;
