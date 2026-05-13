import React from "react";
import TestsTable from "./TestsTable";
import AddTestOrPanel from "../AddTestOrPanel.jsx";
import DeleteForm from "@/Components/DeleteForm.jsx";
import { Box, Typography, Paper, Alert, Button } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import AddIcon from "@mui/icons-material/Add";

const TestsSection = ({
    data,
    errors,
    modalState,
    deleteConfirmState,
    handlers,
    maxDiscount,
    requestedTests = [],
}) => {
    const hasTests = (data?.acceptanceItems?.tests || []).length > 0;
    const hasPanels = (data?.acceptanceItems?.panels || []).length > 0;
    const hasItems = hasTests || hasPanels;

    return (
        <>
            <Box sx={{ mb: 3 }}>
                {!hasItems && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 5,
                            textAlign: 'center',
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '1px dashed',
                            borderColor: 'grey.300',
                        }}
                    >
                        <ScienceIcon sx={{ fontSize: 56, color: 'primary.light', mb: 2 }} />
                        <Typography variant="h6" gutterBottom>No Tests Selected</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                            Add laboratory tests, services, or panels for this acceptance
                        </Typography>
                        <Button
                            onClick={handlers.openAddModal}
                            id="add-test"
                            startIcon={<AddIcon />}
                            color="primary"
                            variant="contained"
                            size="large"
                        >
                            Add Test or Panel
                        </Button>
                    </Paper>
                )}

                {hasItems && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Selected Tests & Panels</Typography>
                            <Button
                                onClick={handlers.openAddModal}
                                id="add-test"
                                startIcon={<AddIcon />}
                                color="primary"
                                variant="outlined"
                                size="medium"
                            >
                                Add Test or Panel
                            </Button>
                        </Box>

                        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <TestsTable
                                tests={data?.acceptanceItems?.tests || []}
                                panels={data?.acceptanceItems?.panels || []}
                                onEditTest={handlers.handleEditTest}
                                onDeleteTest={handlers.handleDeleteTest}
                                onEditPanel={handlers.handleEditPanel}
                                onRestoreTest={handlers.restoreDeleteTest}
                                onRestorePanel={handlers.handleRestorePanel}
                                onDeletePanel={handlers.handleDeletePanel}
                            />
                        </Paper>

                        {errors?.acceptanceItems && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {errors.acceptanceItems}
                            </Alert>
                        )}
                    </Box>
                )}
            </Box>

            {/* Unified Add/Edit Modal */}
            <AddTestOrPanel
                open={modalState.open}
                onClose={handlers.closeModal}
                onSubmitTest={handlers.submitTest}
                onSubmitPanel={handlers.submitPanel}
                initialTestData={modalState.mode === 'editTest' ? modalState.testItem : null}
                initialPanelData={modalState.mode === 'editPanel' ? modalState.panelItem : null}
                referrer={data?.referrer}
                maxDiscount={maxDiscount}
                patient={data?.patient}
                requestedTests={requestedTests}
            />

            {/* Delete Confirmation */}
            <DeleteForm
                openDelete={deleteConfirmState.open}
                agreeCB={handlers.confirmDeleteTest}
                disAgreeCB={handlers.cancelDelete}
                title={`${deleteConfirmState.item?.method_test?.test?.name || ""} Test`}
            />
        </>
    );
};

export default TestsSection;
