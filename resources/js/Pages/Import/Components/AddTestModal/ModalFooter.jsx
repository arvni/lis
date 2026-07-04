import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';

const ModalFooter = ({
    modalStep,
    testType,
    currentTest,
    currentMethod,
    currentSampleType,
    onClose,
    onModalStepChange,
    onAddTest,
}) => (
    <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        {modalStep > 0 ? (
            <Button
                onClick={() => onModalStepChange(0)}
                variant="outlined"
                startIcon={<ArrowBackIcon />}
            >
                Back
            </Button>
        ) : (
            <Button onClick={onClose} variant="outlined">
                Cancel
            </Button>
        )}

        {modalStep === 0 ? (
            <Button
                onClick={() => onModalStepChange(1)}
                variant="contained"
                disabled={!currentTest}
                endIcon={<ArrowForwardIcon />}
            >
                Continue
            </Button>
        ) : (
            <Button
                onClick={onAddTest}
                variant="contained"
                disabled={
                    !currentTest ||
                    ((testType === 'TEST' || testType === 'SERVICE') && !currentMethod) ||
                    (testType === 'TEST' &&
                        currentMethod &&
                        currentMethod.method?.test?.sample_types?.length > 0 &&
                        !currentSampleType)
                }
                startIcon={<CheckIcon />}
            >
                Add Test
            </Button>
        )}
    </DialogActions>
);

export default ModalFooter;
