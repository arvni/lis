import {
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import { Science, Add, Remove, Numbers } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';

const SampleTypeSection = ({ data, errors, onChange, onIncrement, onDecrement }) => (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Science sx={{ mr: 1 }} />
            Sample Type & Quantity
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 8 }}>
                <SelectSearch
                    value={data.sample_type}
                    label="Sample Type (Kit Type)"
                    fullWidth
                    required
                    error={!!errors?.sample_type}
                    helperText={errors?.sample_type || 'Select the type of sample kit'}
                    onChange={onChange}
                    name="sample_type"
                    defaultData={{ orderable: true }}
                    url={route('api.sampleTypes.list')}
                    variant="outlined"
                    placeholder="Search and select sample type..."
                    getOptionLabel={(option) => option?.name || ''}
                />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                    label="Number of Tubes"
                    name="number_of_tubes"
                    fullWidth
                    required
                    type="number"
                    variant="outlined"
                    error={!!errors?.number_of_tubes}
                    helperText={errors?.number_of_tubes || 'How many tubes?'}
                    onChange={onChange}
                    value={data.number_of_tubes || 1}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Numbers fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={onDecrement}
                                        disabled={data.number_of_tubes <= 1}
                                    >
                                        <Remove fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={onIncrement}
                                        disabled={data.number_of_tubes >= 100}
                                    >
                                        <Add fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        },
                        htmlInput: { min: 1, max: 100 },
                    }}
                />
            </Grid>
        </Grid>
    </Paper>
);

export default SampleTypeSection;
