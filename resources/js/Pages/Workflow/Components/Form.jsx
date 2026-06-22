import { useState } from 'react';
import { alpha, Box, Button, Card, CardContent, Grid, Stack, useTheme } from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PageHeader from '@/Components/PageHeader.jsx';
import SectionForm from './SectionForm';
import DeleteForm from '@/Components/DeleteForm';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableSection from './Form/SortableSection';
import WorkflowIdentityCard from './Form/WorkflowIdentityCard';
import PipelineHeader from './Form/PipelineHeader';
import EmptyPipeline from './Form/EmptyPipeline';

/* ── Main form ──────────────────────────────────────────────────────── */
export default function WorkflowForm({ data, setData, submit, cancel, errors }) {
    const theme = useTheme();
    const [sectionWorkflow, setSectionWorkflow] = useState({
        id: Date.now(),
        section: { id: '', name: '' },
        parameters: [],
    });
    const [openSection, setOpenSection] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const find = (id) => {
        const item = data.section_workflows.find((s) => s?.id + '' === id + '');
        return { section: item, index: data.section_workflows.indexOf(item) };
    };

    const editSection = (sectionId) => {
        setSectionWorkflow(find(sectionId).section);
        setOpenSection(true);
    };

    const deleteSection = (id) => {
        const tmp = [...data.section_workflows];
        tmp.splice(find(id).index, 1);
        setData((prev) => ({ ...prev, section_workflows: tmp }));
    };

    const sectionChange = () => {
        const tmp = [...data.section_workflows];
        const index = find(sectionWorkflow.id).index;
        if (index > -1) tmp[index] = sectionWorkflow;
        else tmp.push(sectionWorkflow);
        setData((prev) => ({ ...prev, section_workflows: tmp }));
        setOpenSection(false);
    };

    const addSection = () => {
        setSectionWorkflow({ id: Date.now(), section: { id: '', name: '' }, parameters: [] });
        setOpenSection(true);
    };

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const sws = data.section_workflows;
        const oldIndex = sws.findIndex((s) => s.id.toString() === active.id);
        const newIndex = sws.findIndex((s) => s.id.toString() === over.id);
        setData((prev) => ({
            ...prev,
            section_workflows: arrayMove(prev.section_workflows, oldIndex, newIndex),
        }));
    };

    const sections = data.section_workflows;
    const totalParams = sections.reduce((sum, sw) => sum + (sw.parameters?.length ?? 0), 0);
    const isEdit = !!data.id;

    return (
        <>
            <PageHeader
                title={isEdit ? 'Edit Workflow' : 'New Workflow'}
                subtitle={
                    isEdit
                        ? 'Modify sections and parameters of this workflow'
                        : 'Define the lab section pipeline for this workflow'
                }
                icon={<AccountTreeOutlinedIcon />}
                actions={
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={cancel} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={submit}
                            disableElevation
                            sx={{
                                px: 3,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            }}
                        >
                            {isEdit ? 'Save Changes' : 'Create Workflow'}
                        </Button>
                    </Stack>
                }
            />

            <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
                {/* ── Left: Workflow identity ─────────────────────────── */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <WorkflowIdentityCard
                        data={data}
                        setData={setData}
                        errors={errors}
                        isEdit={isEdit}
                        sections={sections}
                        totalParams={totalParams}
                    />
                </Grid>

                {/* ── Right: Section pipeline ─────────────────────────── */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card
                        sx={{
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.06)}`,
                            overflow: 'hidden',
                        }}
                    >
                        <PipelineHeader
                            count={sections.length}
                            openSection={openSection}
                            onAdd={addSection}
                        />

                        <CardContent sx={{ p: 3 }}>
                            {/* Inline section editor */}
                            {openSection && (
                                <SectionForm
                                    sectionWorkflow={sectionWorkflow}
                                    setSectionWorkflow={setSectionWorkflow}
                                    onSubmit={sectionChange}
                                    onClose={() => setOpenSection(false)}
                                />
                            )}

                            {/* Empty state */}
                            {sections.length === 0 && !openSection && (
                                <EmptyPipeline onAdd={addSection} />
                            )}

                            {/* Section nodes */}
                            {sections.length > 0 && (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={sections.map((s) => s.id.toString())}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <Box sx={{ pt: openSection ? 1 : 0 }}>
                                            {sections.map((sw, idx) => (
                                                <SortableSection
                                                    key={sw.id}
                                                    sw={sw}
                                                    idx={idx}
                                                    total={sections.length}
                                                    onEdit={editSection}
                                                    onRequestDelete={setDeleteTarget}
                                                />
                                            ))}
                                        </Box>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <DeleteForm
                title={`${deleteTarget?.section?.name} Section`}
                agreeCB={() => {
                    deleteSection(deleteTarget.id);
                    setDeleteTarget(null);
                }}
                disAgreeCB={() => setDeleteTarget(null)}
                openDelete={!!deleteTarget}
            />
        </>
    );
}
