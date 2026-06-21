import { Avatar, Box, Divider, Paper, Stack, Typography } from '@mui/material';
import { Person, Science, CheckCircle, Timeline, AssignmentTurnedIn } from '@mui/icons-material';

// Status Timeline Component
const StatusTimeline = ({ referrerOrder }) => {
    // Determine current step based on actual order state
    const getCurrentStep = () => {
        const samplesCollected = !referrerOrder.needs_add_sample;
        const hasAcceptance = Boolean(referrerOrder.acceptance_id);
        const hasPatient = Boolean(referrerOrder.patient_id);

        if (samplesCollected) return 'samples_collected';
        if (hasAcceptance) return 'acceptance_created';
        if (hasPatient) return 'patient_added';
        return 'finalize';
    };

    const getStepStatus = (step) => {
        const stepKeys = ['finalize', 'patient_added', 'acceptance_created', 'samples_collected'];
        const currentStep = getCurrentStep();
        const currentStepIndex = stepKeys.indexOf(currentStep);
        const stepIndex = stepKeys.indexOf(step);

        // If we're at the last step (samples_collected), mark it as completed
        if (currentStep === 'samples_collected' && step === 'samples_collected') return 'completed';

        if (stepIndex < currentStepIndex) return 'completed';
        if (stepIndex === currentStepIndex) return 'active';
        return 'pending';
    };

    const steps = [
        { key: 'finalize', label: 'Order Finalized', icon: <CheckCircle /> },
        { key: 'patient_added', label: 'Patient Added', icon: <Person /> },
        { key: 'acceptance_created', label: 'Acceptance Created', icon: <AssignmentTurnedIn /> },
        { key: 'samples_collected', label: 'Samples Collected', icon: <Science /> },
    ];

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
                <Timeline color="primary" />
                Order Progress
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 3, position: 'relative' }}>
                {steps.map((step, index) => {
                    const status = getStepStatus(step.key);
                    return (
                        <Box key={step.key} sx={{ flex: 1, position: 'relative' }}>
                            <Stack spacing={1} sx={{ alignItems: 'center' }}>
                                <Avatar
                                    sx={{
                                        bgcolor:
                                            status === 'completed'
                                                ? 'success.main'
                                                : status === 'active'
                                                  ? 'primary.main'
                                                  : 'grey.300',
                                        width: 48,
                                        height: 48,
                                    }}
                                >
                                    {step.icon}
                                </Avatar>
                                <Typography
                                    variant="caption"
                                    align="center"
                                    fontWeight={status === 'active' ? 600 : 400}
                                    color={status === 'pending' ? 'text.secondary' : 'text.primary'}
                                >
                                    {step.label}
                                </Typography>
                            </Stack>
                            {index < steps.length - 1 && (
                                <Divider
                                    sx={{
                                        position: 'absolute',
                                        top: 24,
                                        left: '50%',
                                        right: '-50%',
                                        bgcolor:
                                            status === 'completed' ? 'success.main' : 'grey.300',
                                        height: 2,
                                        zIndex: 0,
                                    }}
                                />
                            )}
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
};

export default StatusTimeline;
