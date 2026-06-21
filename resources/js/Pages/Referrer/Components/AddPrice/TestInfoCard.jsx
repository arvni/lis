import {
    Box,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';

// Read-only test information card + available methods table
const TestInfoCard = ({ test, priceType }) => {
    return (
        <Paper elevation={1} sx={{ p: 3, bgcolor: 'primary.50' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Test Information
            </Typography>
            <Grid container spacing={2}>
                <Grid size={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                            Full Name:
                        </Typography>
                        <Typography variant="body2">{test.fullName}</Typography>
                    </Box>
                </Grid>
                <Grid size={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                            Test Code:
                        </Typography>
                        <Chip label={test.code} size="small" color="primary" />
                    </Box>
                </Grid>
                <Grid size={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                            Category:
                        </Typography>
                        <Typography variant="body2">{test.testGroup?.name}</Typography>
                    </Box>
                </Grid>
                {test.type === 'PANEL' && priceType == 'Fix' && (
                    <Grid size={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                                Price:
                            </Typography>
                            <Chip label={`${test.price} OMR`} size="small" color="secondary" />
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Methods Table */}
            <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Available Methods
                </Typography>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Method Name</TableCell>
                                {test.type === 'TEST' && (
                                    <>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Turnaround Time
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Base Price</TableCell>
                                    </>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {test.method_tests?.map(({ method, id }) => (
                                <TableRow key={id} hover>
                                    <TableCell>{method?.name}</TableCell>
                                    {test.type === 'TEST' && (
                                        <>
                                            <TableCell>
                                                <Chip
                                                    label={`${method.turnaround_time} days`}
                                                    size="small"
                                                    color="info"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${method.price} OMR`}
                                                    size="small"
                                                    color="secondary"
                                                />
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Box>
        </Paper>
    );
};

export default TestInfoCard;
