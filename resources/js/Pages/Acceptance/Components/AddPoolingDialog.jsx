import {useEffect, useState} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    List,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    Chip,
    CircularProgress,
    Alert,
    Divider,
} from "@mui/material";
import {
    MergeType as MergeTypeIcon,
    Science as ScienceIcon,
    PlaylistAddCheck as PanelIcon,
    ArrowForwardIos as ArrowIcon,
} from "@mui/icons-material";
import {router} from "@inertiajs/react";
import axios from "axios";
import AddTest from "@/Pages/Acceptance/Components/AddTest.jsx";
import AddPanel from "@/Pages/Acceptance/Components/AddPanel.jsx";

const AddPoolingDialog = ({open, onClose, acceptance}) => {
    const [step, setStep] = useState('list');
    const [items, setItems] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingItem, setLoadingItem] = useState(null); // item id being fetched
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [panelData, setPanelData] = useState({});

    useEffect(() => {
        if (!open || !acceptance?.id) return;
        setStep('list');
        setSelectedItem(null);
        setPanelData({});
        setError(null);
        setLoadingList(true);
        axios.get(route('api.acceptances.poolingItems', acceptance.id))
            .then(res => setItems(res.data.items ?? []))
            .catch(() => setError('Failed to load tests. Please try again.'))
            .finally(() => setLoadingList(false));
    }, [open, acceptance?.id]);

    const handleClose = () => {
        setStep('list');
        setSelectedItem(null);
        setPanelData({});
        onClose();
    };

    const backToList = () => {
        setStep('list');
        setSelectedItem(null);
        setPanelData({});
    };

    const handleItemSelect = async (item) => {
        const testId = item.type === 'test' ? item.id : item.panelData?.panel?.id;
        if (!testId) return;

        setLoadingItem(item.id);
        setError(null);

        try {
            const {data: {data: testData}} = await axios.get(route('api.tests.show', testId));

            if (item.type === 'test') {
                // Find the specific method_test that matches the acceptance item
                const methodTests = testData.method_tests ?? [];
                const matchedMt = methodTests.find(mt => mt.id === item.initialData.method_test.id)
                    ?? methodTests[0];

                const fullInitialData = {
                    method_test: {
                        id: matchedMt?.id ?? null,
                        test: testData,                       // full test with method_tests array
                        method: matchedMt?.method ?? null,    // full method with price params
                    },
                    price:            item.initialData.price,
                    discount:         item.initialData.discount,
                    customParameters: {
                        ...(item.initialData.customParameters ?? {}),
                        sampleType: item.initialData.customParameters?.sampleType ?? '',
                    },
                    no_sample: 1,
                    sampleless: true,   // pooling items are always sampleless
                };

                setSelectedItem({...item, initialData: fullInitialData});
                setStep('test');
            } else {
                // Panel: mirror what AddPanel.fetchTestDetails does
                const {method_tests: methodTests, ...panelTestData} = testData;
                const panelId    = item.panelData.id;
                const totalPrice = item.panelData.price ?? 0;
                const totalDisc  = item.panelData.discount ?? 0;
                const count      = methodTests?.length || 1;

                const formattedItems = (methodTests ?? []).map(mt => ({
                    id: String(Math.random()),
                    panel_id: panelId,
                    method_test: mt,
                    details: '',
                    price:    totalPrice / count,
                    discount: totalDisc  / count,
                    no_sample: 1,
                    customParameters: {samples: [], sampleType: ''},
                }));

                setPanelData({
                    panel:          {...panelTestData, method_tests: methodTests},
                    price:          totalPrice,
                    discount:       totalDisc,
                    id:             panelId,
                    acceptanceItems: formattedItems,
                    sampleless:     true,
                    reportless:     true,
                });
                setSelectedItem(item);
                setStep('panel');
            }
        } catch {
            setError('Failed to load test details. Please try again.');
        } finally {
            setLoadingItem(null);
        }
    };

    const submit = (acceptanceItems) => {
        router.post(
            route('acceptances.addPooling', acceptance.id),
            {acceptanceItems},
            {preserveState: false, onSuccess: handleClose}
        );
    };

    const handleTestSubmit = (testData) => {
        submit({tests: [{...testData, sampleless: true, reportless: true}]});
    };

    const handlePanelSubmit = () => {
        submit({panels: [{...panelData, sampleless: true, reportless: true}]});
    };

    const patient = acceptance
        ? {id: acceptance.patient_id, fullName: acceptance.patient_fullname}
        : null;

    return (
        <>
            {/* Step 1 – Item selection list */}
            <Dialog open={open && step === 'list'} onClose={handleClose} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <MergeTypeIcon color="secondary"/>
                        <Typography variant="h6" fontWeight={600}>Add Pooling</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Select a test or panel to add a pooling item for
                    </Typography>
                </DialogTitle>

                <DialogContent dividers sx={{p: 0}}>
                    {loadingList && (
                        <Box display="flex" justifyContent="center" py={4}>
                            <CircularProgress size={32}/>
                        </Box>
                    )}

                    {error && (
                        <Box p={2}>
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    )}

                    {!loadingList && !error && items.length === 0 && (
                        <Box p={3}>
                            <Typography color="text.secondary" variant="body2">
                                No tests or panels found for this acceptance.
                            </Typography>
                        </Box>
                    )}

                    {!loadingList && items.length > 0 && (
                        <List disablePadding>
                            {items.map((item, idx) => (
                                <Box key={`${item.type}-${item.id}`}>
                                    {idx > 0 && <Divider/>}
                                    <ListItemButton
                                        onClick={() => handleItemSelect(item)}
                                        disabled={loadingItem !== null}
                                        sx={{py: 1.5, px: 2}}
                                    >
                                        <ListItemIcon sx={{minWidth: 36}}>
                                            {loadingItem === item.id
                                                ? <CircularProgress size={18}/>
                                                : item.type === 'panel'
                                                    ? <PanelIcon color="secondary" fontSize="small"/>
                                                    : <ScienceIcon color="primary" fontSize="small"/>
                                            }
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {item.name}
                                                    </Typography>
                                                    <Chip
                                                        label={item.type === 'panel' ? 'Panel' : 'Test'}
                                                        size="small"
                                                        color={item.type === 'panel' ? 'secondary' : 'primary'}
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                        />
                                        <ArrowIcon fontSize="small" color="action"/>
                                    </ListItemButton>
                                </Box>
                            ))}
                        </List>
                    )}
                </DialogContent>

                <Box sx={{p: 2, display: 'flex', justifyContent: 'flex-end'}}>
                    <Button onClick={handleClose}>Cancel</Button>
                </Box>
            </Dialog>

            {/* Step 2a – AddTest with full pre-filled data */}
            <AddTest
                open={step === 'test'}
                onClose={backToList}
                onSubmit={handleTestSubmit}
                initialData={selectedItem?.type === 'test' ? selectedItem.initialData : null}
                patient={patient}
                initialStep={1}
            />

            {/* Step 2b – AddPanel with full pre-filled data */}
            <AddPanel
                open={step === 'panel'}
                onClose={backToList}
                onSubmit={handlePanelSubmit}
                data={panelData}
                onChange={(updates) => setPanelData(prev => ({...prev, ...updates}))}
                patient={patient}
            />
        </>
    );
};

export default AddPoolingDialog;
