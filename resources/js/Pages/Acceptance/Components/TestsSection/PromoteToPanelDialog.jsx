import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Chip,
    Stack,
    Autocomplete,
    TextField,
} from '@mui/material';
import {
    PlaylistAddCheck as PanelIcon,
    Science as TestIcon,
    CheckCircle as MatchIcon,
    RadioButtonUnchecked as NoMatchIcon,
} from '@mui/icons-material';
import axios from 'axios';

const checkCoverage = (panelMethodTests, selectedMethodIds) => {
    const panelMethodIdSet = new Set(panelMethodTests.map((mt) => mt.method_id));
    const matched = new Set(selectedMethodIds.filter((id) => panelMethodIdSet.has(id)));
    const missing = new Set(selectedMethodIds.filter((id) => !panelMethodIdSet.has(id)));
    return { matched, missing };
};

const PromoteToPanelDialog = ({ open, onClose, onConfirm, tests = [] }) => {
    const [panels, setPanels] = useState([]);
    const [loadingPanels, setLoadingPanels] = useState(false);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [panelDetails, setPanelDetails] = useState(null);
    const [loadingPanel, setLoadingPanel] = useState(false);
    const [error, setError] = useState(null);

    const selectedMethodIds = tests.map((t) => t.method_test?.method_id).filter(Boolean);

    // Fetch and filter panels when dialog opens
    useEffect(() => {
        if (!open) {
            setSelectedPanel(null);
            setPanelDetails(null);
            setPanels([]);
            setError(null);
            return;
        }
        if (!selectedMethodIds.length) return;

        setLoadingPanels(true);
        axios
            .get(route('api.tests.list'), { params: { type: 'PANEL' } })
            .then((res) => {
                const allPanels = Array.isArray(res.data.data) ? res.data.data : [];
                // Keep only panels that contain ALL selected method_ids
                const filtered = allPanels.filter((panel) => {
                    const panelMethodIdSet = new Set(panel.method_ids ?? []);
                    return selectedMethodIds.every((mid) => panelMethodIdSet.has(mid));
                });
                setPanels(filtered);
            })
            .catch(() => setError('Failed to load panels.'))
            .finally(() => setLoadingPanels(false));
    }, [open]);

    // Fetch panel details (method_tests) when a panel is selected
    useEffect(() => {
        if (!selectedPanel?.id) {
            setPanelDetails(null);
            return;
        }
        setLoadingPanel(true);
        setError(null);

        axios
            .get(route('api.tests.show', selectedPanel.id))
            .then((res) => setPanelDetails(res.data.data ?? res.data))
            .catch(() => setError('Failed to load panel details.'))
            .finally(() => setLoadingPanel(false));
    }, [selectedPanel]);

    const panelMethodTests = panelDetails?.method_tests ?? [];
    const { matched, missing } = checkCoverage(panelMethodTests, selectedMethodIds);
    const allCovered = missing.size === 0 && selectedMethodIds.length > 0;

    const handleConfirm = () => {
        onConfirm(panelMethodTests.map((mt) => mt.id));
    };

    const getTestName = (methodId) => {
        const t = tests.find((t) => t.method_test?.method_id === methodId);
        return t?.method_test?.test?.name ?? `Method #${methodId}`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PanelIcon color="secondary" />
                Promote to Panel
            </DialogTitle>

            <DialogContent dividers>
                {/* Show selected tests */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Selected tests to promote ({tests.length}):
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {tests.map((t) => (
                            <Chip
                                key={t.id}
                                icon={<TestIcon />}
                                label={t.method_test?.test?.name}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {loadingPanels
                        ? 'Loading compatible panels…'
                        : panels.length === 0
                          ? 'No panels found that contain all selected tests.'
                          : `${panels.length} compatible panel${panels.length > 1 ? 's' : ''} found. Choose one:`}
                </Typography>

                {loadingPanels ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <Autocomplete
                        options={panels}
                        value={selectedPanel}
                        onChange={(_, v) => setSelectedPanel(v)}
                        getOptionLabel={(opt) => opt?.name ?? ''}
                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                        renderInput={(params) => (
                            <TextField {...params} label="Select panel" size="small" />
                        )}
                        noOptionsText="No compatible panels"
                        disabled={panels.length === 0}
                    />
                )}

                {loadingPanel && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                )}

                {panelDetails && !loadingPanel && (
                    <Box sx={{ mt: 2 }}>
                        {allCovered ? (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                All {matched.size} selected test{matched.size > 1 ? 's' : ''} found
                                in this panel.
                            </Alert>
                        ) : (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {missing.size} selected test{missing.size > 1 ? 's are' : ' is'} not
                                in this panel: {[...missing].map(getTestName).join(', ')}.
                            </Alert>
                        )}

                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Panel tests ({panelMethodTests.length}):
                        </Typography>
                        <List
                            dense
                            disablePadding
                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                        >
                            {panelMethodTests.map((mt, idx) => {
                                const isSelected = selectedMethodIds.includes(mt.method_id);
                                return (
                                    <React.Fragment key={mt.id}>
                                        {idx > 0 && <Divider />}
                                        <ListItem>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                {isSelected ? (
                                                    <MatchIcon fontSize="small" color="success" />
                                                ) : (
                                                    <NoMatchIcon fontSize="small" color="action" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={mt.test_name || mt.method?.name}
                                                secondary={mt.method?.name}
                                                primaryTypographyProps={{
                                                    fontWeight: isSelected ? 600 : 400,
                                                    color: isSelected
                                                        ? 'success.main'
                                                        : 'text.primary',
                                                }}
                                            />
                                            {isSelected && (
                                                <Chip
                                                    label="matched"
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            )}
                                        </ListItem>
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="secondary"
                    disabled={!panelDetails || loadingPanel || !allCovered}
                    startIcon={<PanelIcon />}
                >
                    Promote {tests.length > 1 ? `${tests.length} tests` : 'test'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PromoteToPanelDialog;
