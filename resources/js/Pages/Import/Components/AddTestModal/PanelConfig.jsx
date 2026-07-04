import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';

const PanelConfig = ({ currentTest, panelSampleTypes, onPanelSampleTypeChange }) => (
    <Box sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
                <strong>Panel Test:</strong> This panel includes multiple tests. Please select sample
                type for each test.
            </Typography>
        </Alert>

        {/* Panel Details */}
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                        Panel Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {currentTest.name}
                    </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                        Total Price
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="primary">
                        {currentTest.price || 0} OMR
                    </Typography>
                </Grid>
            </Grid>
        </Paper>

        {/* Test Methods List */}
        {currentTest.method_tests && currentTest.method_tests.length > 0 ? (
            <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <strong>Test Name</strong>
                            </TableCell>
                            <TableCell>
                                <strong>Sample Type</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentTest.method_tests.map((methodTest, index) => (
                            <TableRow key={index} hover>
                                <TableCell>
                                    <Typography variant="body2">
                                        {methodTest.method?.test?.name || 'N/A'}
                                    </Typography>
                                </TableCell>
                                <TableCell sx={{ width: '50%' }}>
                                    {methodTest.method?.test?.sample_types &&
                                    methodTest.method.test.sample_types.length > 0 ? (
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={panelSampleTypes[methodTest.id] || ''}
                                                onChange={(e) =>
                                                    onPanelSampleTypeChange(
                                                        methodTest.id,
                                                        e.target.value,
                                                    )
                                                }
                                                displayEmpty
                                            >
                                                <MenuItem value="">
                                                    <em>Select Sample Type</em>
                                                </MenuItem>
                                                {methodTest.method.test.sample_types.map(
                                                    (sampleType) => (
                                                        <MenuItem
                                                            key={sampleType.id}
                                                            value={sampleType.id}
                                                        >
                                                            {sampleType.name}
                                                        </MenuItem>
                                                    ),
                                                )}
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No sample types available
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        ) : (
            <Alert severity="warning">No test methods found in this panel.</Alert>
        )}
    </Box>
);

export default PanelConfig;
