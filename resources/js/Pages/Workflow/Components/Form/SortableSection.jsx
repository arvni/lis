import { alpha, Box, Chip, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TYPE_COLOR } from './constants';

/* ── Sortable section node ──────────────────────────────────────────── */
export default function SortableSection({ sw, idx, total, onEdit, onRequestDelete }) {
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
}
