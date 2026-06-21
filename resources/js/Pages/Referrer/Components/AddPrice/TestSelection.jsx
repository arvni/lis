import { Paper, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import SelectSearch from '@/Components/SelectSearch';

// Test selection card
const TestSelection = ({ value, errors, onTestSelect }) => {
    return (
        <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" />
                Test Selection
            </Typography>
            <SelectSearch
                fullWidth
                value={value || ''}
                label="Select Test"
                url={route('api.tests.list')}
                onChange={onTestSelect}
                name="test"
                error={!!errors.test}
                helperText={errors.test || 'Search and select a test to configure pricing'}
            />
        </Paper>
    );
};

export default TestSelection;
