import { Accordion, AccordionDetails, Box, Paper } from '@mui/material';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { ExpandMore as ExpandMoreIcon, Science, RequestQuote } from '@mui/icons-material';
import TestsTable from '@/Pages/Acceptance/Components/TestsSection/TestsTable.jsx';
import PromoteToPanelDialog from '@/Pages/Acceptance/Components/TestsSection/PromoteToPanelDialog.jsx';
import EditItemPricesForm from '@/Pages/Acceptance/Components/EditItemPricesForm.jsx';
import AddTestOrPanel from '@/Pages/Acceptance/Components/AddTestOrPanel.jsx';
import SectionTitle from './SectionTitle';

const TestItemsSection = ({
    acceptance,
    acceptanceItems,
    patient,
    totals,
    expanded,
    onChange,
    canEditItemPrices,
    maxDiscount,
    promotingTests,
    setPromotingTests,
    onPromoteToPanel,
    onEjectPanel,
    onEditTest,
    onEditPanel,
    editingPrices,
    setEditingPrices,
    editItem,
    closeEditItem,
    onSubmitTest,
    onSubmitPanel,
}) => (
    <Accordion
        expanded={expanded}
        onChange={onChange}
        sx={{
            mt: 2,
            borderRadius: 1,
            '&:before': { display: 'none' },
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
    >
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="acceptance-items"
            id="acceptance-items"
            sx={{
                backgroundColor: 'background.paper',
                borderRadius: '8px 8px 0 0',
            }}
        >
            <SectionTitle icon={Science} title="Test Items" />
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: 'background.default', p: 3 }}>
            {canEditItemPrices && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RequestQuote />}
                        onClick={() => setEditingPrices(true)}
                    >
                        Edit Prices
                    </Button>
                </Box>
            )}
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TestsTable
                    showButton
                    showTotal={false}
                    tests={acceptance?.acceptance_items?.tests || []}
                    panels={acceptance?.acceptance_items?.panels || []}
                    onEjectPanel={onEjectPanel}
                    onPromoteTest={setPromotingTests}
                    onEditTest={canEditItemPrices ? onEditTest : undefined}
                    onEditPanel={canEditItemPrices ? onEditPanel : undefined}
                />
            </Paper>

            <PromoteToPanelDialog
                open={Boolean(promotingTests?.length)}
                tests={promotingTests ?? []}
                onClose={() => setPromotingTests(null)}
                onConfirm={onPromoteToPanel}
            />

            {editingPrices && (
                <EditItemPricesForm
                    open={editingPrices}
                    acceptance={acceptance}
                    acceptanceItems={acceptanceItems}
                    onClose={() => setEditingPrices(false)}
                />
            )}

            {editItem.open && (
                <AddTestOrPanel
                    open={editItem.open}
                    onClose={closeEditItem}
                    onSubmitTest={onSubmitTest}
                    onSubmitPanel={onSubmitPanel}
                    initialTestData={editItem.mode === 'editTest' ? editItem.test : null}
                    initialPanelData={editItem.mode === 'editPanel' ? editItem.panel : null}
                    referrer={acceptance.referrer}
                    maxDiscount={maxDiscount}
                    patient={patient}
                />
            )}
            <Box
                sx={{
                    mt: 3,
                    p: 3,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Total Price:
                            <Box component="span" sx={{ ml: 1, color: 'text.primary' }}>
                                {totals.total.toFixed(2)}
                            </Box>
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Total Discount:
                            <Box component="span" sx={{ ml: 1, color: 'error.main' }}>
                                {totals.discount.toFixed(2)}
                            </Box>
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Net Amount:
                            <Box component="span" sx={{ ml: 1, color: 'success.main' }}>
                                {totals.netTotal.toFixed(2)}
                            </Box>
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
        </AccordionDetails>
    </Accordion>
);

export default TestItemsSection;
