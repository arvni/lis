import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

import ScienceIcon from '@mui/icons-material/Science';
import CloseIcon from '@mui/icons-material/Close';

import SelectTestStep from './AddTestModal/SelectTestStep';
import ConfigureStep from './AddTestModal/ConfigureStep';
import ModalFooter from './AddTestModal/ModalFooter';

const AddTestModal = ({
    open,
    modalStep,
    testType,
    currentTest,
    currentMethod,
    currentSampleType,
    panelSampleTypes,
    currentPrice,
    loadingTestDetails,
    defaultReferrer,
    onClose,
    onTestTypeChange,
    onTestSelect,
    onModalStepChange,
    onSelectMethod,
    onSampleTypeChange,
    onPanelSampleTypeChange,
    onPriceChange,
    onAddTest,
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', p: 2 }}>
            <Box display="flex" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" sx={{ alignItems: 'center' }}>
                    <ScienceIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" component="span">
                        Add Test
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>
        </DialogTitle>

        {/* Stepper */}
        <Box sx={{ width: '100%', px: 3, pt: 3 }}>
            <Stepper activeStep={modalStep} alternativeLabel>
                <Step>
                    <StepLabel>Select Test</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Configure</StepLabel>
                </Step>
            </Stepper>
        </Box>

        <DialogContent sx={{ p: 3 }}>
            {modalStep === 0 && (
                <SelectTestStep
                    testType={testType}
                    currentTest={currentTest}
                    loadingTestDetails={loadingTestDetails}
                    defaultReferrer={defaultReferrer}
                    onTestTypeChange={onTestTypeChange}
                    onTestSelect={onTestSelect}
                />
            )}

            {modalStep === 1 && currentTest && (
                <ConfigureStep
                    testType={testType}
                    currentTest={currentTest}
                    currentMethod={currentMethod}
                    currentSampleType={currentSampleType}
                    panelSampleTypes={panelSampleTypes}
                    currentPrice={currentPrice}
                    onSelectMethod={onSelectMethod}
                    onSampleTypeChange={onSampleTypeChange}
                    onPanelSampleTypeChange={onPanelSampleTypeChange}
                    onPriceChange={onPriceChange}
                />
            )}
        </DialogContent>

        <ModalFooter
            modalStep={modalStep}
            testType={testType}
            currentTest={currentTest}
            currentMethod={currentMethod}
            currentSampleType={currentSampleType}
            onClose={onClose}
            onModalStepChange={onModalStepChange}
            onAddTest={onAddTest}
        />
    </Dialog>
);

export default AddTestModal;
