import { useState, useCallback } from "react";
import { makeId } from "@/Services/helper";

const useAcceptanceFormState = (initialData) => {
    const [data, setData] = useState(initialData);

    // Unified modal for add/edit test or panel
    const [modalState, setModalState] = useState({
        open: false,
        mode: 'add', // 'add' | 'editTest' | 'editPanel'
        testItem: null,
        panelItem: null,
    });

    // Delete Confirmation State
    const [deleteConfirmState, setDeleteConfirmState] = useState({
        open: false,
        item: null,
    });

    // ─── Generic form change handler ────────────────────────────────────────────
    const handleFormChange = useCallback((field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setData(prev => ({
                ...prev,
                [parent]: { ...(prev?.[parent] || {}), [child]: value },
            }));
        } else if (field === 'referred' && value === false) {
            setData(prev => ({
                ...prev,
                referred: false,
                referrer: "",
                howReport: { who: "", way: "print" },
            }));
        } else {
            setData(prev => ({ ...prev, [field]: value }));
        }
    }, []);

    const handleDoctorChange = useCallback((field, value) => {
        setData(prev => ({
            ...prev,
            doctor: { ...(prev?.doctor || {}), [field]: value },
        }));
    }, []);

    // ─── Unified Modal Handlers ──────────────────────────────────────────────────
    const openAddModal = useCallback(() => {
        setModalState({ open: true, mode: 'add', testItem: null, panelItem: null });
    }, []);

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, open: false, testItem: null, panelItem: null }));
    }, []);

    const handleEditTest = useCallback((id) => {
        const test = data?.acceptanceItems?.tests?.find(t => t.id === id);
        if (!test) return;
        setModalState({ open: true, mode: 'editTest', testItem: test, panelItem: null });
    }, [data?.acceptanceItems?.tests]);

    const handleEditPanel = useCallback((id) => {
        const panel = data?.acceptanceItems?.panels?.find(p => p.id === id);
        if (!panel) return;
        setModalState({ open: true, mode: 'editPanel', testItem: null, panelItem: panel });
    }, [data?.acceptanceItems?.panels]);

    // ─── Test Submit ─────────────────────────────────────────────────────────────
    const submitTest = useCallback((testItem) => {
        setData(prev => {
            const currentTests = prev?.acceptanceItems?.tests || [];
            const updatedTests = [...currentTests];
            const idx = updatedTests.findIndex(t => t.id === testItem.id);
            if (idx !== -1) {
                updatedTests[idx] = testItem;
            } else {
                updatedTests.push({ ...testItem, id: makeId(5) });
            }
            return {
                ...prev,
                acceptanceItems: { ...(prev?.acceptanceItems || {}), tests: updatedTests },
            };
        });
    }, []);

    // ─── Panel Submit ─────────────────────────────────────────────────────────────
    const submitPanel = useCallback((panelItem) => {
        setData(prev => {
            const currentPanels = prev?.acceptanceItems?.panels || [];
            const updatedPanels = [...currentPanels];
            const idx = updatedPanels.findIndex(p => p.id === panelItem.id);
            if (idx !== -1) {
                updatedPanels[idx] = panelItem;
            } else {
                updatedPanels.push({ ...panelItem, id: makeId(6) });
            }
            return {
                ...prev,
                acceptanceItems: { ...(prev?.acceptanceItems || {}), panels: updatedPanels },
            };
        });
    }, []);

    // ─── Delete Test ──────────────────────────────────────────────────────────────
    const handleDeleteTest = useCallback((id) => {
        const item = data?.acceptanceItems?.tests?.find(t => t.id === id);
        if (item) setDeleteConfirmState({ open: true, item });
    }, [data?.acceptanceItems?.tests]);

    const confirmDeleteTest = useCallback(() => {
        if (!deleteConfirmState.item) return;
        const updatedTests = (data?.acceptanceItems?.tests || []).map(t =>
            t.id === deleteConfirmState.item.id ? { ...t, deleted: true } : t
        );
        setData(prev => ({
            ...prev,
            acceptanceItems: { ...(prev?.acceptanceItems || {}), tests: updatedTests },
        }));
        setDeleteConfirmState({ open: false, item: null });
    }, [deleteConfirmState.item, data?.acceptanceItems?.tests]);

    const cancelDelete = useCallback(() => {
        setDeleteConfirmState({ open: false, item: null });
    }, []);

    const restoreDeleteTest = useCallback((id) => {
        const updatedTests = (data?.acceptanceItems?.tests || []).map(t =>
            t.id === id ? { ...t, deleted: false } : t
        );
        setData(prev => ({
            ...prev,
            acceptanceItems: { ...(prev?.acceptanceItems || {}), tests: updatedTests },
        }));
    }, [data?.acceptanceItems?.tests]);

    // ─── Delete/Restore Panel ─────────────────────────────────────────────────────
    const handleDeletePanel = useCallback((id) => {
        const updatedPanels = (data?.acceptanceItems?.panels || []).map(p =>
            p.id === id ? { ...p, deleted: true } : p
        );
        setData(prev => ({
            ...prev,
            acceptanceItems: { ...(prev?.acceptanceItems || {}), panels: updatedPanels },
        }));
    }, [data?.acceptanceItems?.panels]);

    const handleRestorePanel = useCallback((id) => {
        const updatedPanels = (data?.acceptanceItems?.panels || []).map(p =>
            p.id === id ? { ...p, deleted: false } : p
        );
        setData(prev => ({
            ...prev,
            acceptanceItems: { ...(prev?.acceptanceItems || {}), panels: updatedPanels },
        }));
    }, [data?.acceptanceItems?.panels]);

    return {
        data,
        modalState,
        deleteConfirmState,
        handlers: {
            handleFormChange,
            handleDoctorChange,
            openAddModal,
            closeModal,
            handleEditTest,
            handleEditPanel,
            handleDeleteTest,
            confirmDeleteTest,
            cancelDelete,
            restoreDeleteTest,
            submitTest,
            submitPanel,
            handleDeletePanel,
            handleRestorePanel,
        },
    };
};

export default useAcceptanceFormState;
