import {
    Alert,
    Avatar,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Person, PersonAdd } from '@mui/icons-material';

const PatientActionDialog = ({
    open,
    onClose,
    selectedPatient,
    onAddNewPatient,
    onSelectFromExisting,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Person />
                </Avatar>
                <Box>
                    <Typography variant="h6" component="span">
                        Add Patient to System
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {selectedPatient?.fullName}
                    </Typography>
                </Box>
            </Stack>
        </DialogTitle>
        <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
                This patient from the order needs to be added to the system. Choose an option below.
            </Alert>

            <Stack spacing={2}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                    }}
                    onClick={onAddNewPatient}
                >
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                            <PersonAdd />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Add New Patient
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Create a new patient record with the information from this order
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>

                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        border: '2px solid',
                        borderColor: 'secondary.main',
                        bgcolor: 'secondary.50',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                    }}
                    onClick={onSelectFromExisting}
                >
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                            <Person />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Select Existing Patient
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Link this order to an existing patient in the system
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
    </Dialog>
);

export default PatientActionDialog;
