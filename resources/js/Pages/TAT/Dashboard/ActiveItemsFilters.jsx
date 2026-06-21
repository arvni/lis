import {
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch.jsx';

const ActiveItemsFilters = ({ filters, sectionObj, setSectionObj, applyFilters }) => (
    <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" spacing={1} mb={1.5} sx={{ alignItems: 'center' }}>
            <FilterList fontSize="small" color="action" />
            <Typography variant="subtitle2" color="text.secondary">
                Active Items Filters
            </Typography>
        </Stack>
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                        label="Priority"
                        value={filters.priority}
                        onChange={(e) => applyFilters({ priority: e.target.value })}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="stat">STAT</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="routine">Routine</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SelectSearch
                    value={sectionObj}
                    onChange={(e) => {
                        const obj = e.target.value;
                        setSectionObj(obj ?? null);
                        applyFilters({ section_id: obj?.id ?? '' });
                    }}
                    name="section"
                    label="Section"
                    url={route('api.sections.list')}
                    fullWidth
                    size="small"
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                    label="From"
                    type="date"
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={filters.date_from}
                    onChange={(e) => applyFilters({ date_from: e.target.value })}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                    label="To"
                    type="date"
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={filters.date_to}
                    onChange={(e) => applyFilters({ date_to: e.target.value })}
                />
            </Grid>
        </Grid>
    </Paper>
);

export default ActiveItemsFilters;
