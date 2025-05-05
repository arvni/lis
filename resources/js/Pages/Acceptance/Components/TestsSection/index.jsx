import React from "react";
import TestsTable from "./TestsTable";
import AddTest from "../AddTest.jsx";
import AddPanel from "../AddPanel.jsx";
import DeleteForm from "@/Components/DeleteForm.jsx";
import { Box, Typography, Paper, Alert, Button } from "@mui/material";
import ScienceIcon from "@mui/icons-material/Science";
import AddIcon from "@mui/icons-material/Add";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";

const TestsSection = ({
                          data,
                          errors,
                          testModalState,
                          panelModalState,
                          deleteConfirmState,
                          handlers,
                          maxDiscount
                      }) => {
    const hasTests = (data?.acceptanceItems?.tests || []).length > 0;
    const hasPanels = (data?.acceptanceItems?.panels || []).length > 0;
    const hasItems = hasTests || hasPanels;

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                    Add laboratory tests or panels for this acceptance
                </Typography>

                {!hasItems && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            textAlign: 'center',
                            bgcolor: 'grey.50',
                            borderRadius: 2,
                            border: '1px dashed grey.300'
                        }}
                    >
                        <ScienceIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
                        <Typography variant="h6">No Tests Selected</Typography>
                        <Typography variant="body2" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                            Click one of the buttons below to add laboratory tests or test panels for this patient
                        </Typography>

                        <Box>
                            <Button
                                onClick={handlers.openAddTestModal}
                                id="add-test"
                                startIcon={<AddIcon />}
                                color="primary"
                                variant="contained"
                                size="large"
                                sx={{ mr: 2 }}
                            >
                                Add Individual Test
                            </Button>
                            <Button
                                onClick={handlers.openAddPanelModal}
                                id="add-panel"
                                startIcon={<PlaylistAddCheckIcon />}
                                color="secondary"
                                variant="contained"
                                size="large"
                            >
                                Add Test Panel
                            </Button>
                        </Box>
                    </Paper>
                )}

                {hasItems && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Selected Tests & Panels
                            </Typography>
                            <Box>
                                <Button
                                    onClick={handlers.openAddTestModal}
                                    id="add-test"
                                    startIcon={<AddIcon />}
                                    color="primary"
                                    variant="outlined"
                                    size="medium"
                                    sx={{ mr: 2 }}
                                >
                                    Add Test
                                </Button>
                                <Button
                                    onClick={handlers.openAddPanelModal}
                                    id="add-panel"
                                    startIcon={<PlaylistAddCheckIcon />}
                                    color="secondary"
                                    variant="outlined"
                                    size="medium"
                                >
                                    Add Panel
                                </Button>
                            </Box>
                        </Box>

                        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                            <TestsTable
                                tests={data?.acceptanceItems?.tests || []}
                                panels={data?.acceptanceItems?.panels || []}
                                onAddTest={handlers.openAddTestModal}
                                onAddPanel={handlers.openAddPanelModal}
                                onEditTest={handlers.handleEditTest}
                                onDeleteTest={handlers.handleDeleteTest}
                                onEditPanel={handlers.handleEditPanel}
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

            {/* Test Modal */}
            {testModalState.open && (
                <AddTest
                    open={testModalState.open}
                    initialData={testModalState.item}
                    onClose={handlers.closeTestModal}
                    onSubmit={handlers.submitTest}
                    referrer={data?.referrer}
                    maxDiscount={maxDiscount}
                    patient={data?.patient}
                    onChange={handlers.handleTestChange}
                />
            )}

            {/* Panel Modal */}
            {panelModalState.open && (
                <AddPanel
                    open={panelModalState.open}
                    data={panelModalState.panel}
                    onClose={handlers.closePanelModal}
                    onChange={handlers.handlePanelChange}
                    onSubmit={handlers.submitPanel}
                    referrer={data?.referrer}
                    maxDiscount={maxDiscount}
                    patient={data?.patient}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirmState.open && (
                <DeleteForm
                    openDelete={deleteConfirmState.open}
                    agreeCB={handlers.confirmDeleteTest}
                    disAgreeCB={handlers.cancelDelete}
                    title={`${deleteConfirmState.item?.method_test?.test?.name || ""} Test`}
                />
            )}
        </>
    );
};

export default TestsSection;
