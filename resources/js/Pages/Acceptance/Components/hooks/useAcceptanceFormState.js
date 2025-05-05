import { useState, useCallback } from "react";
import { makeId } from "@/Services/helper";

const useAcceptanceFormState = (initialData, maxDiscount) => {
    const [data, setData] = useState(initialData);

    // Test Modal State - properly initialized with safe defaults
    const [testModalState, setTestModalState] = useState({
        open: false,
        item: {
            method_test: { test: { type: '' } }, // Initialize with proper structure
            details: "",
            discount: 0,
            price: 0,
            sample_type: "",
            patients: [] // Ensure patients is always an array
        }
    });

    // Panel Modal State
    const [panelModalState, setPanelModalState] = useState({
        open: false,
        panel: {
            acceptanceItems: [],
            panel: "",
            price: 0,
            discount: 0
        }
    });

    // Delete Confirmation State
    const [deleteConfirmState, setDeleteConfirmState] = useState({
        open: false,
        item: null
    });

    // Generic form change handler
    const handleFormChange = useCallback((field, value) => {
        // Handle nested properties
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setData(prevData => ({
                ...prevData,
                [parent]: {
                    ...(prevData?.[parent] || {}),
                    [child]: value
                }
            }));
        } else {
            // Special cases for complete object replacements
            if (field === 'referred' && value === false) {
                setData(prevData => ({
                    ...prevData,
                    referred: value,
                    referrer: "",
                    howReport: {
                        who: "",
                        way: "print"
                    }
                }));
            } else {
                // Normal field update
                setData(prevData => ({
                    ...prevData,
                    [field]: value
                }));
            }
        }
    }, []);

    // Handlers for Doctor Info
    const handleDoctorChange = useCallback((field, value) => {
        setData(prevData => ({
            ...prevData,
            doctor: {
                ...(prevData?.doctor || {}),
                [field]: value
            }
        }));
    }, []);

    // Test Handlers
    const openAddTestModal = useCallback(() => {
        setTestModalState(prev => ({
            ...prev,
            open: true
        }));
    }, []);

    const closeTestModal = useCallback(() => {
        setTestModalState({
            open: false,
            item: {
                method_test: { test: { type: '' } },
                details: "",
                discount: 0,
                price: 0,
                sample_type: "",
                patients: [] // Explicitly set as empty array
            }
        });
    }, []);

    const handleEditTest = useCallback(id => {
        // Find the test by id and handle potential undefined values
        const test = data?.acceptanceItems?.tests?.find(item => item.id === id);

        if (test) {
            // Create safe item with guaranteed structure
            const safeItem = {
                ...test,
                method_test: {
                    ...(test.method_test || {}),
                    test: {
                        ...(test.method_test?.test || {}),
                        type: test.method_test?.test?.type || ''
                    }
                },
                patients: Array.isArray(test.patients) ? [...test.patients] : []
            };

            setTestModalState({
                open: true,
                item: safeItem
            });
        }
    }, [data?.acceptanceItems?.tests]);

    const handleDeleteTest = useCallback(id => {
        const item = data?.acceptanceItems?.tests?.find(item => item.id === id);
        if (item) {
            setDeleteConfirmState({
                open: true,
                item
            });
        }
    }, [data?.acceptanceItems?.tests]);

    const confirmDeleteTest = useCallback(() => {
        if (!deleteConfirmState.item || !data?.acceptanceItems?.tests) return;

        const updatedTests = data.acceptanceItems.tests.filter(
            item => item.id !== deleteConfirmState.item.id
        );

        setData(prevData => ({
            ...prevData,
            acceptanceItems: {
                ...prevData.acceptanceItems,
                tests: updatedTests
            }
        }));

        setDeleteConfirmState({
            open: false,
            item: null
        });
    }, [deleteConfirmState.item, data?.acceptanceItems?.tests]);

    const cancelDelete = useCallback(() => {
        setDeleteConfirmState({
            open: false,
            item: null
        });
    }, []);

    const handleTestChange = useCallback(updatedValue => {
        setTestModalState(prev => ({
            ...prev,
            item: {
                ...prev.item,
                ...updatedValue,
                ...(updatedValue.patients ? {
                    patients: Array.isArray(updatedValue.patients)
                        ? updatedValue.patients
                        : []
                } : {})
            }
        }));
    }, []);

    const submitTest = useCallback(() => {
        const { item } = testModalState;

        // Safely get the current tests array
        const currentTests = data?.acceptanceItems?.tests || [];
        const updatedTests = [...currentTests];

        const existingIndex = updatedTests.findIndex(test => test.id === item.id);

        if (existingIndex !== -1) {
            updatedTests[existingIndex] = item;
        } else {
            updatedTests.push({
                ...item,
                id: makeId(5)
            });
        }

        setData(prevData => ({
            ...prevData,
            acceptanceItems: {
                ...(prevData?.acceptanceItems || {}),
                tests: updatedTests
            }
        }));

        closeTestModal();
    }, [testModalState, data?.acceptanceItems?.tests, closeTestModal]);

    // Panel Handlers
    const openAddPanelModal = useCallback(() => {
        setPanelModalState(prev => ({
            ...prev,
            open: true
        }));
    }, []);

    const closePanelModal = useCallback(() => {
        setPanelModalState({
            open: false,
            panel: {
                acceptanceItems: [],
                panel: "",
                price: 0,
                discount: 0
            }
        });
    }, []);

    const handleEditPanel = useCallback(id => {
        const panel = data?.acceptanceItems?.panels?.find(item => item.id === id);
        if (panel) {
            setPanelModalState({
                open: true,
                panel
            });
        }
    }, [data?.acceptanceItems?.panels]);

    const handleDeletePanel = useCallback(id => {
        // Safely get the current panels array
        const currentPanels = data?.acceptanceItems?.panels || [];
        const updatedPanels = currentPanels.filter(panel => panel.id !== id);

        setData(prevData => ({
            ...prevData,
            acceptanceItems: {
                ...(prevData?.acceptanceItems || {}),
                panels: updatedPanels
            }
        }));
    }, [data?.acceptanceItems?.panels]);

    const handlePanelChange = useCallback(updatedValue => {
        setPanelModalState(prev => ({
            ...prev,
            panel: {
                ...prev.panel,
                ...updatedValue
            }
        }));
    }, []);

    const submitPanel = useCallback(() => {
        const { panel } = panelModalState;

        // Safely get the current panels array
        const currentPanels = data?.acceptanceItems?.panels || [];
        const updatedPanels = [...currentPanels];

        const existingIndex = updatedPanels.findIndex(p => p.id === panel.id);

        if (existingIndex !== -1) {
            updatedPanels[existingIndex] = panel;
        } else {
            updatedPanels.push({
                ...panel,
                id: makeId(6)
            });
        }

        setData(prevData => ({
            ...prevData,
            acceptanceItems: {
                ...(prevData?.acceptanceItems || {}),
                panels: updatedPanels
            }
        }));

        closePanelModal();
    }, [panelModalState, data?.acceptanceItems?.panels, closePanelModal]);

    return {
        data,
        testModalState,
        panelModalState,
        deleteConfirmState,
        handlers: {
            handleFormChange,
            handleDoctorChange,
            openAddTestModal,
            closeTestModal,
            handleEditTest,
            handleDeleteTest,
            confirmDeleteTest,
            cancelDelete,
            handleTestChange,
            submitTest,
            openAddPanelModal,
            closePanelModal,
            handleEditPanel,
            handleDeletePanel,
            handlePanelChange,
            submitPanel,
        }
    };
};

export default useAcceptanceFormState;
