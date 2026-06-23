import { useForm } from '@inertiajs/react';
import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';

const SectionForm = ({ nodeId, sections, sectionId, notes }) => {
    const { data, setData, put, processing, errors } = useForm({
        section_id: sectionId ?? '',
        notes: notes ?? '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('monitoring.nodes.updateSection', nodeId));
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Section</InputLabel>
                <Select
                    label="Section"
                    value={data.section_id}
                    onChange={(e) => setData('section_id', e.target.value)}
                    error={!!errors.section_id}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {sections.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                            {s.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                fullWidth
                size="small"
                label="Notes"
                multiline
                rows={2}
                value={data.notes}
                onChange={(e) => setData('notes', e.target.value)}
                error={!!errors.notes}
                helperText={errors.notes}
                sx={{ mb: 2 }}
            />
            <Button type="submit" size="small" variant="contained" disabled={processing}>
                Save
            </Button>
        </Box>
    );
};

export default SectionForm;
