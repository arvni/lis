import {useState} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Stack,
    Typography,
    Box,
} from "@mui/material";
import {MergeType as MergeTypeIcon, Science as ScienceIcon, PlaylistAddCheck as PanelIcon} from "@mui/icons-material";
import {router} from "@inertiajs/react";
import AddTest from "@/Pages/Acceptance/Components/AddTest.jsx";
import AddPanel from "@/Pages/Acceptance/Components/AddPanel.jsx";

const AddPoolingDialog = ({open, onClose, acceptance}) => {
    const [mode, setMode] = useState(null); // null | 'test' | 'panel'
    const [panelData, setPanelData] = useState({});

    const handleClose = () => {
        setMode(null);
        setPanelData({});
        onClose();
    };

    const submit = (acceptanceItems) => {
        router.post(
            route('acceptances.addPooling', acceptance.id),
            {acceptanceItems},
            {
                preserveState: false,
                onSuccess: handleClose,
            }
        );
    };

    const handleTestSubmit = (testData) => {
        submit({
            tests: [{...testData, sampleless: true, reportless: true}],
        });
    };

    const handlePanelSubmit = (data) => {
        submit({
            panels: [{...data, sampleless: true, reportless: true}],
        });
    };

    return (
        <>
            {/* Type selector dialog */}
            <Dialog open={open && !mode} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <MergeTypeIcon color="secondary"/>
                        <Typography variant="h6" fontWeight={600}>Add Pooling</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Choose what to add to this pooling acceptance
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <Stack spacing={2} py={1}>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            startIcon={<ScienceIcon/>}
                            onClick={() => setMode('test')}
                            sx={{justifyContent: 'flex-start', py: 1.5}}
                        >
                            <Box textAlign="left">
                                <Typography variant="body1" fontWeight={600}>Add Test</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Add a single test to this acceptance
                                </Typography>
                            </Box>
                        </Button>

                        <Button
                            variant="outlined"
                            color="secondary"
                            size="large"
                            startIcon={<PanelIcon/>}
                            onClick={() => setMode('panel')}
                            sx={{justifyContent: 'flex-start', py: 1.5}}
                        >
                            <Box textAlign="left">
                                <Typography variant="body1" fontWeight={600}>Add Panel</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Add a test panel (multiple tests) to this acceptance
                                </Typography>
                            </Box>
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* AddTest dialog */}
            <AddTest
                open={mode === 'test'}
                onClose={() => setMode(null)}
                onSubmit={handleTestSubmit}
                patient={acceptance ? {id: acceptance.patient_id, fullName: acceptance.patient_fullname} : null}
            />

            {/* AddPanel dialog */}
            <AddPanel
                open={mode === 'panel'}
                onClose={() => setMode(null)}
                onSubmit={handlePanelSubmit}
                data={panelData}
                onChange={setPanelData}
                patient={acceptance ? {id: acceptance.patient_id, fullName: acceptance.patient_fullname} : null}
            />
        </>
    );
};

export default AddPoolingDialog;
