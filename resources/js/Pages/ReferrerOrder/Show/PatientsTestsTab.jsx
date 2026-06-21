import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import { Person, PersonAdd, Description, Add, MergeType } from '@mui/icons-material';
import PatientCard from './PatientCard';
import TestOrderItem from './TestOrderItem';

const PatientsTestsTab = ({
    referrerOrder,
    patients,
    orderItems,
    loading,
    onAddPatient,
    onAddFromExist,
    onSelectPatient,
    gotoPage,
    onAddAcceptance,
    onAddSample,
    onOpenSelectAcceptance,
}) => (
    <>
        {/* Patients Section */}
        <Box sx={{ mb: 4 }}>
            <Stack
                direction="row"
                mb={3}
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Typography variant="h5" fontWeight={600}>
                    Patients ({patients.length})
                </Typography>
                {!referrerOrder.patient_id && (
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            onClick={onAddPatient}
                            startIcon={<PersonAdd />}
                        >
                            Add New Patient
                        </Button>
                        <Button variant="outlined" onClick={onAddFromExist} startIcon={<Person />}>
                            Select Existing
                        </Button>
                    </Stack>
                )}
                {referrerOrder.patient_id && (
                    <Button
                        variant="contained"
                        onClick={gotoPage(route('patients.show', referrerOrder.patient_id))}
                        startIcon={<Person />}
                    >
                        View Patient Details
                    </Button>
                )}
            </Stack>

            <Grid container spacing={3}>
                {patients.map((patientData, index) => (
                    <Grid
                        size={{ xs: 12, md: patients.length > 1 ? 6 : 12 }}
                        key={patientData.id || index}
                    >
                        <PatientCard
                            mainPatientID={referrerOrder.patient_id}
                            patient={patientData}
                            onSelectPatient={onSelectPatient}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>

        {/* Tests & Samples Section */}
        <Box>
            <Stack
                direction="row"
                mb={3}
                sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight={600}>
                        Tests & Samples ({orderItems.length})
                    </Typography>
                    {referrerOrder.pooling && (
                        <Chip
                            icon={<MergeType />}
                            label="Pooling Order"
                            color="info"
                            size="small"
                        />
                    )}
                </Stack>
                {referrerOrder.patient_id && (
                    <Stack direction="row" spacing={2}>
                        {referrerOrder.acceptance_id ? (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={gotoPage(
                                        route('acceptances.show', referrerOrder.acceptance_id),
                                    )}
                                    startIcon={<Description />}
                                >
                                    View Acceptance
                                </Button>
                                {referrerOrder.needs_add_sample && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={onAddSample}
                                        startIcon={
                                            loading ? <CircularProgress size={20} /> : <Add />
                                        }
                                        disabled={loading}
                                    >
                                        Add Samples
                                    </Button>
                                )}
                            </>
                        ) : referrerOrder.pooling ? (
                            <Button
                                variant="contained"
                                onClick={onOpenSelectAcceptance}
                                startIcon={<MergeType />}
                                color="info"
                            >
                                Select Existing Acceptance
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={onAddAcceptance}
                                startIcon={<Add />}
                            >
                                Create Acceptance
                            </Button>
                        )}
                    </Stack>
                )}
            </Stack>

            {orderItems.length > 0 ? (
                orderItems.map((orderItem, index) => (
                    <TestOrderItem key={orderItem.id || index} orderItem={orderItem} />
                ))
            ) : (
                <Alert severity="info">No tests have been ordered yet.</Alert>
            )}
        </Box>
    </>
);

export default PatientsTestsTab;
