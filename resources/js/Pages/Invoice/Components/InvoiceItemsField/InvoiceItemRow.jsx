import React from 'react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    AutoAwesome as AutoIcon,
    Delete as DeleteIcon,
    Lock as LockIcon,
    Notes as NotesIcon,
    RestartAlt as ResetIcon,
    Undo as UndoIcon,
} from '@mui/icons-material';
import { KIND_COLOR, KIND_LABEL, num } from './constants.js';

const KindChip = ({ item }) => (
    <Chip
        size="small"
        label={KIND_LABEL[item.kind] ?? item.kind}
        color={KIND_COLOR[item.kind] ?? 'default'}
        variant="outlined"
    />
);

const LockBadge = ({ item }) =>
    item.locked ? (
        <Tooltip title="Locked — composer won't overwrite this row">
            <LockIcon fontSize="small" sx={{ color: 'warning.main' }} />
        </Tooltip>
    ) : (
        <Tooltip title="Auto-managed by composer">
            <AutoIcon fontSize="small" sx={{ color: 'text.disabled' }} />
        </Tooltip>
    );

const InvoiceItemRow = ({
    item,
    descriptionOpen,
    canReset,
    onField,
    onDelete,
    onUndoDelete,
    onToggleDescription,
    onResetToAuto,
}) => {
    const key = item.id ?? item._new_id;
    const isDeleting = !!item._destroy;

    if (isDeleting) {
        return (
            <TableRow sx={{ backgroundColor: 'error.50', opacity: 0.7 }}>
                <TableCell colSpan={6}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <DeleteIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error.main">
                            <strong>{item.title}</strong> will be removed on save
                            {item.kind !== 'manual_fee' &&
                                item.kind !== 'adjustment' &&
                                ' (the test stays on the acceptance; use “Rebuild from acceptance” to bring it back)'}
                            .
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Button
                            size="small"
                            startIcon={<UndoIcon />}
                            onClick={() => onUndoDelete(key)}
                        >
                            Undo
                        </Button>
                    </Stack>
                </TableCell>
            </TableRow>
        );
    }

    const hasDescription = Boolean(item.description);

    return (
        <React.Fragment>
            <TableRow
                hover
                sx={{
                    '& > td': {
                        verticalAlign: 'middle',
                        borderBottom: descriptionOpen ? 0 : undefined,
                    },
                }}
            >
                <TableCell sx={{ minWidth: 260 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <KindChip item={item} />
                        <LockBadge item={item} />
                        <TextField
                            size="small"
                            value={item.code || ''}
                            placeholder="Code"
                            onChange={(e) => onField(key, 'code', e.target.value)}
                            sx={{ width: 110, flexShrink: 0 }}
                            slotProps={{
                                htmlInput: {
                                    style: { fontFamily: 'monospace', fontSize: '0.8125rem' },
                                },
                            }}
                        />
                        <TextField
                            size="small"
                            fullWidth
                            value={item.title || ''}
                            placeholder="Item title"
                            onChange={(e) => onField(key, 'title', e.target.value)}
                        />
                    </Stack>
                    {hasDescription && !descriptionOpen && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            onClick={() => onToggleDescription(key)}
                            sx={{
                                display: 'block',
                                mt: 0.5,
                                ml: 0.5,
                                cursor: 'pointer',
                                fontStyle: 'italic',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 380,
                                '&:hover': { color: 'primary.main' },
                            }}
                        >
                            {item.description}
                        </Typography>
                    )}
                </TableCell>

                <TableCell align="right" sx={{ width: 90 }}>
                    <TextField
                        size="small"
                        type="number"
                        value={item.qty ?? 1}
                        onChange={(e) => onField(key, 'qty', e.target.value)}
                        slotProps={{
                            htmlInput: { min: 1, step: 1, style: { textAlign: 'right' } },
                        }}
                        fullWidth
                    />
                </TableCell>

                <TableCell align="right" sx={{ width: 130 }}>
                    <TextField
                        size="small"
                        type="number"
                        value={item.unit_price ?? 0}
                        onChange={(e) => onField(key, 'unit_price', e.target.value)}
                        slotProps={{
                            htmlInput: { min: 0, step: 0.001, style: { textAlign: 'right' } },
                        }}
                        fullWidth
                    />
                </TableCell>

                <TableCell align="right" sx={{ width: 130 }}>
                    <TextField
                        size="small"
                        type="number"
                        value={item.discount ?? 0}
                        onChange={(e) => onField(key, 'discount', num(e.target.value))}
                        slotProps={{
                            htmlInput: { min: 0, step: 0.001, style: { textAlign: 'right' } },
                        }}
                        fullWidth
                    />
                </TableCell>

                <TableCell align="right" sx={{ width: 120 }}>
                    <Typography variant="body2" fontWeight="medium" color="primary.main">
                        {(num(item.price) - num(item.discount)).toFixed(3)}
                    </Typography>
                </TableCell>

                <TableCell align="center" sx={{ width: 130 }}>
                    <Stack direction="row" spacing={0.25} justifyContent="center">
                        <Tooltip
                            title={
                                descriptionOpen
                                    ? 'Hide description'
                                    : hasDescription
                                      ? 'Edit description'
                                      : 'Add description'
                            }
                        >
                            <IconButton
                                size="small"
                                color={hasDescription ? 'primary' : 'default'}
                                onClick={() => onToggleDescription(key)}
                            >
                                <NotesIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {canReset && (
                            <Tooltip title="Reset to auto">
                                <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => onResetToAuto(item)}
                                >
                                    <ResetIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Remove">
                            <IconButton size="small" color="error" onClick={() => onDelete(key)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </TableCell>
            </TableRow>

            {descriptionOpen && (
                <TableRow>
                    <TableCell sx={{ pt: 0, pb: 1.5 }} colSpan={6}>
                        <Box sx={{ pl: 6 }}>
                            <TextField
                                size="small"
                                fullWidth
                                multiline
                                minRows={1}
                                maxRows={3}
                                value={item.description || ''}
                                placeholder="Description (optional)"
                                onChange={(e) => onField(key, 'description', e.target.value)}
                            />
                        </Box>
                    </TableCell>
                </TableRow>
            )}
        </React.Fragment>
    );
};

export default InvoiceItemRow;
