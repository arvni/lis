import SelectSearch from '@/Components/SelectSearch';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';

const SelectTestStep = ({
    testType,
    currentTest,
    loadingTestDetails,
    defaultReferrer,
    onTestTypeChange,
    onTestSelect,
}) => (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Select Test Type and Test
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                    <InputLabel>Test Type</InputLabel>
                    <Select value={testType} onChange={onTestTypeChange} label="Test Type">
                        <MenuItem value="">
                            <em>Select Type</em>
                        </MenuItem>
                        <MenuItem value="PANEL">Panel</MenuItem>
                        <MenuItem value="TEST">Test</MenuItem>
                        <MenuItem value="SERVICE">Service</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            {testType && (
                <Grid size={{ xs: 12, md: 6 }}>
                    <SelectSearch
                        value={null}
                        label={`Select ${testType === 'PANEL' ? 'Panel' : testType === 'SERVICE' ? 'Service' : 'Test'}`}
                        fullWidth
                        url={route('api.tests.list')}
                        defaultData={{
                            type: testType,
                            status: true,
                            ...(defaultReferrer?.id && {
                                referrer: {
                                    id: defaultReferrer.id,
                                },
                            }),
                        }}
                        onChange={onTestSelect}
                        name="test"
                        helperText="Search and select test to add"
                        disableFirst={true}
                    />
                </Grid>
            )}
        </Grid>

        {loadingTestDetails && (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 3,
                }}
            >
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">Loading test details...</Typography>
            </Box>
        )}

        {currentTest && !loadingTestDetails && (
            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Test Details
                </Typography>
                <Paper elevation={1} sx={{ p: 2, mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Name
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {currentTest.name}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                                Code
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {currentTest.code}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>
        )}
    </Paper>
);

export default SelectTestStep;
