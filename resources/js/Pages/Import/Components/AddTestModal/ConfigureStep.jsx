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
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import FormHelperText from '@mui/material/FormHelperText';

import PanelConfig from './PanelConfig';

const ConfigureStep = ({
    testType,
    currentTest,
    currentMethod,
    currentSampleType,
    panelSampleTypes,
    currentPrice,
    onSelectMethod,
    onSampleTypeChange,
    onPanelSampleTypeChange,
    onPriceChange,
}) => (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Configure Test Parameters
        </Typography>

        {/* Panel Information */}
        {testType === 'PANEL' && (
            <PanelConfig
                currentTest={currentTest}
                panelSampleTypes={panelSampleTypes}
                onPanelSampleTypeChange={onPanelSampleTypeChange}
            />
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Method Selection for TEST and SERVICE */}
            {(testType === 'TEST' || testType === 'SERVICE') &&
                currentTest.method_tests &&
                currentTest.method_tests.length > 0 && (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Method Selection
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Method Name</TableCell>
                                            <TableCell align="center">Turnaround Time</TableCell>
                                            <TableCell align="center">Price</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {currentTest.method_tests.map((method) => (
                                            <TableRow
                                                key={method.id}
                                                hover
                                                onClick={() => onSelectMethod(method)}
                                                selected={currentMethod?.id === method.id}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&.Mui-selected': {
                                                        backgroundColor: 'primary.light',
                                                    },
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography
                                                        fontWeight={
                                                            currentMethod?.id === method.id
                                                                ? 'medium'
                                                                : 'normal'
                                                        }
                                                    >
                                                        {method.method?.name || method.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    {method.method?.turnaround_time ||
                                                        method.turnaround_time ||
                                                        '-'}{' '}
                                                    days
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Typography fontWeight="medium">
                                                        {method.price ||
                                                            method.method?.price ||
                                                            0}{' '}
                                                        OMR
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </>
                )}

            {/* Sample Type Selection (only for TEST, not PANEL or SERVICE) */}
            {testType === 'TEST' &&
                currentMethod &&
                currentMethod.method?.test?.sample_types &&
                currentMethod.method.test.sample_types.length > 0 && (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Sample Type
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>Select Sample Type</InputLabel>
                                <Select
                                    value={currentSampleType}
                                    onChange={(e) => onSampleTypeChange(e.target.value)}
                                    label="Select Sample Type"
                                >
                                    {currentMethod.method.test.sample_types.map((sampleType) => (
                                        <MenuItem key={sampleType.id} value={sampleType.id}>
                                            {sampleType.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    Type of biological sample to collect
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                    </>
                )}

            {/* No methods available message */}
            {(testType === 'TEST' || testType === 'SERVICE') &&
                (!currentTest.method_tests || currentTest.method_tests.length === 0) && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="warning">
                            <Typography variant="body2">
                                No methods are configured for this {testType.toLowerCase()}. Please
                                contact administration.
                            </Typography>
                        </Alert>
                    </Grid>
                )}

            {/* Price Input - Always show in configure step */}
            <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="primary" gutterBottom>
                    Price
                </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <TextField
                    fullWidth
                    type="number"
                    label="Test Price"
                    value={currentPrice}
                    onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                    OMR
                                </Typography>
                            ),
                        },
                    }}
                    helperText="You can modify the test price"
                />
            </Grid>
        </Grid>
    </Paper>
);

export default ConfigureStep;
