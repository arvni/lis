import React, { useState } from "react";
import {
    TableCell,
    TableRow,
    IconButton,
    Stack,
    Tooltip,
    Chip,
    Box,
    Divider,
    Typography,
    Collapse,
    Button,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from "@mui/material";
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    PlaylistAddCheck as PlaylistAddCheckIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Restore as RestoreIcon,
    Visibility as VisibilityIcon
} from "@mui/icons-material";
import { Link } from "@inertiajs/react";

const PatientChips = ({ patients, maxVisible = 3 }) => {
    const [showAll, setShowAll] = useState(false);

    if (!patients?.length) return null;

    const visiblePatients = showAll ? patients : patients.slice(0, maxVisible);
    const remainingCount = patients.length - maxVisible;

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
            {visiblePatients.map((patient, index) => (
                <Chip
                    key={index}
                    label={patient.fullName || patient.name}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                />
            ))}
            {remainingCount > 0 && !showAll && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAll(true)}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                >
                    +{remainingCount} more
                </Button>
            )}
            {showAll && patients.length > maxVisible && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowAll(false)}
                    sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                >
                    Show less
                </Button>
            )}
        </Box>
    );
};

const DetailsCell = ({ details, maxLength = 100 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!details) {
        return (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No details available
            </Typography>
        );
    }

    const shouldTruncate = details.length > maxLength;
    const displayText = expanded || !shouldTruncate
        ? details
        : `${details.substring(0, maxLength)}...`;

    return (
        <Box>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {displayText}
            </Typography>
            {shouldTruncate && (
                <Button
                    size="small"
                    variant="text"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ minWidth: 'auto', p: 0, mt: 0.5, fontSize: '0.75rem' }}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                    {expanded ? 'Show less' : 'Read more'}
                </Button>
            )}
        </Box>
    );
};

const DeleteConfirmDialog = ({ open, onClose, onConfirm, panelName }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Panel Removal</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to remove the panel "{panelName}"?
                This action will remove all associated acceptance items.
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} variant="outlined">
                Cancel
            </Button>
            <Button onClick={onConfirm} variant="contained" color="error">
                Remove Panel
            </Button>
        </DialogActions>
    </Dialog>
);

const ActionButtons = ({ panel, onEdit, onDelete, onRestore }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        onDelete();
        setDeleteDialogOpen(false);
    };

    if (panel?.deleted) {
        return (
            <Tooltip title="Restore panel">
                <IconButton
                    onClick={onRestore}
                    size="small"
                    color="success"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'success.main',
                            color: 'white'
                        }
                    }}
                >
                    <RestoreIcon />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <>
            <Stack direction="row" spacing={1} justifyContent="center">
                {onEdit && (
                    <Tooltip title="Edit panel">
                        <IconButton
                            onClick={onEdit}
                            size="small"
                            color="primary"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                }
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {onDelete && (
                    <Tooltip title="Remove panel">
                        <IconButton
                            onClick={handleDeleteClick}
                            size="small"
                            color="error"
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'error.main',
                                    color: 'white'
                                }
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                panelName={panel?.panel?.name}
            />
        </>
    );
};

const PriceDisplay = ({ price, discount }) => {
    const hasDiscount = Number(discount) > 0;

    return (
        <Box sx={{ textAlign: 'right' }}>
            <Typography
                variant="body2"
                fontWeight="medium"
                color={hasDiscount ? "success.main" : "text.primary"}
            >
                {price}
            </Typography>
            {hasDiscount && (
                <Typography
                    variant="caption"
                    color="success.main"
                    sx={{ display: 'block' }}
                >
                    -{discount} discount
                </Typography>
            )}
        </Box>
    );
};

const PanelRow = ({
                      panel,
                      testTypes,
                      onEdit,
                      onDelete,
                      onRestore,
                      showButton = false
                  }) => {
    const [collapsed, setCollapsed] = useState(false);
    const acceptanceItems = panel?.acceptanceItems || [];
    const hasMultipleItems = acceptanceItems.length > 1;

    // Show warning for deleted panels
    if (panel?.deleted) {
        return (
            <TableRow>
                <TableCell colSpan={9}>
                    <Alert
                        severity="warning"
                        variant="outlined"
                        action={
                            <ActionButtons
                                panel={panel}
                                onRestore={onRestore}
                            />
                        }
                    >
                        <Typography variant="body2">
                            Panel "{panel?.panel?.name}" has been removed
                        </Typography>
                    </Alert>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <>
            {acceptanceItems.map((item, itemIndex) => {
                const isFirstItem = itemIndex === 0;
                const shouldShowRow = !collapsed || isFirstItem;

                if (!shouldShowRow) return null;

                return (
                    <TableRow
                        key={item.id}
                        hover
                        sx={{
                            backgroundColor: isFirstItem ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                            '&:hover': {
                                backgroundColor: isFirstItem ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                            },
                            '&:last-child td, &:last-child th': { border: 0 }
                        }}
                    >
                        {isFirstItem && (
                            <>
                                <TableCell
                                    rowSpan={collapsed ? 1 : acceptanceItems.length}
                                    sx={{
                                        borderLeft: '4px solid',
                                        borderLeftColor: 'primary.main',
                                        backgroundColor: 'rgba(25, 118, 210, 0.02)'
                                    }}
                                >
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box display="flex" alignItems="center">
                                            <PlaylistAddCheckIcon color="primary" sx={{ mr: 1 }} />
                                            <Box>
                                                <Typography fontWeight="600" color="primary.main">
                                                    {panel?.panel?.name}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {hasMultipleItems && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {acceptanceItems.length} tests
                                                        </Typography>
                                                    )}
                                                    {panel?.sampleless && (
                                                        <Chip label="Sampleless" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                                    )}
                                                    {(panel?.reportless || panel?.sampleless) && (
                                                        <Chip label="Reportless" size="small" color="info" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                        {hasMultipleItems && (
                                            <Tooltip title={collapsed ? "Expand tests" : "Collapse tests"}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setCollapsed(!collapsed)}
                                                >
                                                    {collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>

                                <TableCell rowSpan={collapsed ? 1 : acceptanceItems.length}>
                                    <Chip
                                        label={panel?.panel?.code}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
                                    />
                                </TableCell>

                                <TableCell rowSpan={collapsed ? 1 : acceptanceItems.length}>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                        {panel?.panel?.fullName}
                                    </Typography>
                                </TableCell>

                                <TableCell rowSpan={collapsed ? 1 : acceptanceItems.length}>
                                    <Chip
                                        label={testTypes[panel?.panel?.type] || 'Unknown'}
                                        size="small"
                                        color="secondary"
                                        variant="filled"
                                    />
                                </TableCell>
                            </>
                        )}

                        <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                                {showButton ? (
                                    <Link
                                        href={route("acceptanceItems.show", {
                                            acceptanceItem: item.id,
                                            acceptance: item.acceptance_id
                                        })}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <Button
                                            variant="text"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            sx={{ justifyContent: 'flex-start' }}
                                        >
                                            {item?.method_test?.method?.name}
                                        </Button>
                                    </Link>
                                ) : (
                                    <Typography variant="body2">
                                        {item?.method_test?.method?.name}
                                    </Typography>
                                )}
                            </Box>
                        </TableCell>

                        <TableCell>
                            {!item?.patients?.length ? (
                                item?.samples?.map((sample, sampleIndex) => (
                                    <Box key={sampleIndex} sx={{ mb: sampleIndex < item.samples.length - 1 ? 1 : 0 }}>
                                        <PatientChips patients={sample.patients} />
                                        {sampleIndex < item.samples.length - 1 && (
                                            <Divider sx={{ my: 1 }} />
                                        )}
                                    </Box>
                                ))
                            ) : (
                                <PatientChips patients={item?.patients} />
                            )}
                        </TableCell>

                        <TableCell sx={{ maxWidth: 250 }}>
                            <DetailsCell details={item?.details} />
                        </TableCell>

                        {isFirstItem && (
                            <>
                                <TableCell rowSpan={collapsed ? 1 : acceptanceItems.length}>
                                    <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                        color={Number(panel.discount) > 0 ? "success.main" : "text.primary"}
                                        sx={{ textAlign: 'right' }}
                                    >
                                        {panel.discount}
                                    </Typography>
                                </TableCell>

                                <TableCell rowSpan={collapsed ? 1 : acceptanceItems.length}>
                                    <PriceDisplay price={panel.price} discount={panel.discount} />
                                </TableCell>

                                {(onEdit || onDelete || onRestore) && (
                                    <TableCell
                                        rowSpan={collapsed ? 1 : acceptanceItems.length}
                                        align="center"
                                    >
                                        <ActionButtons
                                            panel={panel}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onRestore={onRestore}
                                        />
                                    </TableCell>
                                )}
                            </>
                        )}
                    </TableRow>
                );
            })}

            {collapsed && hasMultipleItems && (
                <TableRow>
                    <TableCell colSpan={9} sx={{ py: 0 }}>
                        <Collapse in={false}>
                            <Box sx={{ p: 1, backgroundColor: 'grey.50' }}>
                                <Typography variant="caption" color="text.secondary">
                                    {acceptanceItems.length - 1} additional tests hidden
                                </Typography>
                            </Box>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default PanelRow;
