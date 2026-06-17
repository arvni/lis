import { useState } from 'react';
import {
    alpha,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TuneIcon from '@mui/icons-material/Tune';
import PageHeader from '@/Components/PageHeader.jsx';
import SectionForm from './SectionForm';
import DeleteForm from '@/Components/DeleteForm';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Type chip colour map (mirrors SectionForm) ────────────────────── */
const TYPE_COLOR = {
    text: 'default',
    number: 'primary',
    date: 'info',
    time: 'secondary',
    options: 'warning',
    file: 'success',
};

/* ── Sortable section node ──────────────────────────────────────────── */
const SortableSection = ({ sw, idx, total, onEdit, onRequestDelete }) => {
    const theme = useTheme();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: sw.id.toString(),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <Box ref={setNodeRef} style={style}>
            {/* Node row */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                {/* Step badge + connector */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexShrink: 0,
                        mt: 0.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            bgcolor: isDragging ? 'primary.dark' : 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                            boxShadow: isDragging ? 6 : 2,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {idx + 1}
                    </Box>
                    {idx < total - 1 && (
                        <Box
                            sx={{
                                width: 2,
                                flex: 1,
                                minHeight: 20,
                                mt: 0.5,
                                background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.2)})`,
                                borderRadius: 1,
                            }}
                        />
                    )}
                </Box>

                {/* Section card */}
                <Box
                    sx={{
                        flex: 1,
                        mb: idx < total - 1 ? 1 : 0,
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isDragging ? 'primary.main' : 'divider',
                        bgcolor: isDragging
                            ? alpha(theme.palette.primary.main, 0.04)
                            : 'background.paper',
                        boxShadow: isDragging ? 6 : 1,
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 3,
                            height: '100%',
                            bgcolor: 'primary.main',
                            borderRadius: '2px 0 0 2px',
                            opacity: isDragging ? 1 : 0.5,
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Drag handle */}
                        <Box
                            {...attributes}
                            {...listeners}
                            sx={{
                                cursor: isDragging ? 'grabbing' : 'grab',
                                color: 'text.disabled',
                                display: 'flex',
                                alignItems: 'center',
                                '&:hover': { color: 'text.secondary' },
                                transition: 'color 0.15s',
                                flexShrink: 0,
                            }}
                        >
                            <DragIndicatorIcon sx={{ fontSize: 18 }} />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                                {sw.section?.name || 'Unnamed Section'}
                            </Typography>
                            {sw.section?.section_group?.name && (
                                <Typography variant="caption" color="text.disabled" noWrap>
                                    {sw.section.section_group.name}
                                </Typography>
                            )}
                        </Box>

                        <Chip
                            label={`${sw.parameters?.length ?? 0} param${sw.parameters?.length !== 1 ? 's' : ''}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20, flexShrink: 0 }}
                        />

                        <Tooltip title="Edit section">
                            <IconButton
                                size="small"
                                onClick={() => onEdit(sw.id)}
                                sx={{
                                    '&:hover': { color: 'warning.main' },
                                    color: 'text.disabled',
                                }}
                            >
                                <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove section">
                            <IconButton
                                size="small"
                                onClick={() => onRequestDelete(sw)}
                                sx={{ '&:hover': { color: 'error.main' }, color: 'text.disabled' }}
                            >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {sw.parameters?.length > 0 && (
                        <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.25, pl: 3.5 }}
                        >
                            {sw.parameters.map((p, i) => (
                                <Chip
                                    key={i}
                                    label={`${p.name}: ${p.type}`}
                                    size="small"
                                    color={TYPE_COLOR[p.type] ?? 'default'}
                                    variant="outlined"
                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Arrow connector between nodes */}
            {idx < total - 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', pl: '17px', py: 0.25 }}>
                    <ArrowDownwardIcon
                        sx={{ fontSize: 14, color: alpha(theme.palette.primary.main, 0.35) }}
                    />
                </Box>
            )}
        </Box>
    );
};

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
                    <Card
                        sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.06)}`,
                        }}
                    >
                        {/* Card hero */}
                        <Box
                            sx={{
                                px: 3,
                                pt: 3,
                                pb: 2.5,
                                background: `linear-gradient(135deg,
                                ${alpha(theme.palette.primary.main, 0.08)} 0%,
                                ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                                borderBottom: '1px solid',
                                borderColor: alpha(theme.palette.primary.main, 0.12),
                            }}
                        >
                            <Box
                                sx={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 2.5,
                                    mb: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <AccountTreeOutlinedIcon
                                    sx={{ fontSize: 26, color: 'primary.main' }}
                                />
                            </Box>
                            <Typography
                                variant="overline"
                                fontWeight={700}
                                color="primary.main"
                                letterSpacing="0.12em"
                                display="block"
                                sx={{ mb: 0.25 }}
                            >
                                {isEdit ? 'Editing' : 'New'} Workflow
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color="text.primary">
                                {data.name || 'Untitled'}
                            </Typography>
                        </Box>

                        <CardContent
                            sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}
                        >
                            {/* Name field */}
                            <TextField
                                fullWidth
                                label="Workflow Name"
                                placeholder="e.g. CBC Full Panel"
                                value={data.name}
                                name="name"
                                onChange={(e) =>
                                    setData((prev) => ({ ...prev, name: e.target.value }))
                                }
                                error={!!errors.name}
                                helperText={errors.name}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />

                            {/* Status toggle */}
                            <Box
                                onClick={() =>
                                    setData((prev) => ({ ...prev, status: !prev.status }))
                                }
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    p: 1.5,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: data.status
                                        ? alpha(theme.palette.success.main, 0.4)
                                        : alpha(theme.palette.divider, 1),
                                    bgcolor: data.status
                                        ? alpha(theme.palette.success.main, 0.05)
                                        : 'transparent',
                                    transition: 'all 0.25s ease',
                                    userSelect: 'none',
                                }}
                            >
                                <PowerSettingsNewIcon
                                    sx={{
                                        fontSize: 20,
                                        color: data.status ? 'success.main' : 'text.disabled',
                                        transition: 'color 0.25s',
                                    }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                        color={data.status ? 'success.main' : 'text.secondary'}
                                    >
                                        {data.status ? 'Active' : 'Inactive'}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled">
                                        {data.status
                                            ? 'Workflow is enabled'
                                            : 'Workflow is disabled'}
                                    </Typography>
                                </Box>
                                <Switch
                                    checked={data.status}
                                    size="small"
                                    color="success"
                                    name="status"
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        setData((prev) => ({ ...prev, status: e.target.checked }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Box>

                            {/* Pipeline summary */}
                            {sections.length > 0 && (
                                <>
                                    <Divider />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                textAlign: 'center',
                                                py: 1.5,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                fontWeight={800}
                                                color="primary.main"
                                            >
                                                {sections.length}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight={500}
                                            >
                                                Sections
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                flex: 1,
                                                textAlign: 'center',
                                                py: 1.5,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.secondary.main, 0.06),
                                            }}
                                        >
                                            <Typography
                                                variant="h5"
                                                fontWeight={800}
                                                color="secondary.main"
                                            >
                                                {totalParams}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                fontWeight={500}
                                            >
                                                Parameters
                                            </Typography>
                                        </Box>
                                    </Box>
                                </>
                            )}
                        </CardContent>
                    </Card>
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
                        {/* Pipeline header */}
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                bgcolor: alpha(theme.palette.background.default, 0.6),
                            }}
                        >
                            <HubOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Section Pipeline
                                    </Typography>
                                    {sections.length > 0 && (
                                        <Chip
                                            label={sections.length}
                                            size="small"
                                            color="primary"
                                            sx={{
                                                height: 18,
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                            }}
                                        />
                                    )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    Sections execute top-to-bottom · drag to reorder
                                </Typography>
                            </Box>
                            {!openSection && (
                                <Button
                                    startIcon={<AddIcon />}
                                    size="small"
                                    variant="contained"
                                    disableElevation
                                    onClick={addSection}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        flexShrink: 0,
                                    }}
                                >
                                    Add Section
                                </Button>
                            )}
                        </Box>

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
                                <Box
                                    sx={{
                                        py: 6,
                                        textAlign: 'center',
                                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                                        borderRadius: 3,
                                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '50%',
                                            mx: 'auto',
                                            mb: 2,
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <TuneIcon
                                            sx={{
                                                fontSize: 30,
                                                color: alpha(theme.palette.primary.main, 0.4),
                                            }}
                                        />
                                    </Box>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        color="text.secondary"
                                        sx={{ mb: 0.5 }}
                                    >
                                        Pipeline is empty
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.disabled"
                                        display="block"
                                        sx={{ mb: 2.5 }}
                                    >
                                        Add sections to define how samples flow through the lab
                                    </Typography>
                                    <Button
                                        startIcon={<AddIcon />}
                                        variant="outlined"
                                        size="small"
                                        onClick={addSection}
                                        sx={{ borderRadius: 2, textTransform: 'none' }}
                                    >
                                        Add first section
                                    </Button>
                                </Box>
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
