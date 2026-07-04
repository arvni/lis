import React, { useState } from 'react';
import {
    TableCell,
    TableRow,
    IconButton,
    Tooltip,
    Chip,
    Box,
    Divider,
    Typography,
    Collapse,
    Button,
    Alert,
} from '@mui/material';
import {
    PlaylistAddCheck as PlaylistAddCheckIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Link } from '@inertiajs/react';
import PatientChips from './PanelRow/PatientChips';
import DetailsCell from './PanelRow/DetailsCell';
import ActionButtons from './PanelRow/ActionButtons';
import PriceDisplay from './PanelRow/PriceDisplay';

const PanelRow = ({
    panel,
    testTypes,
    onEdit,
    onDelete,
    onRestore,
    onEject,
    hasSelectionColumn = false,
    showButton = false,
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
                        action={<ActionButtons panel={panel} onRestore={onRestore} />}
                    >
                        <Typography variant="body2">
                            Panel &quot;{panel?.panel?.name}&quot; has been removed
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
                                backgroundColor: isFirstItem
                                    ? 'rgba(25, 118, 210, 0.08)'
                                    : 'rgba(0, 0, 0, 0.04)',
                            },
                            '&:last-child td, &:last-child th': { border: 0 },
                        }}
                    >
                        {isFirstItem && (
                            <>
                                {hasSelectionColumn && (
                                    <TableCell
                                        padding="checkbox"
                                        rowSpan={collapsed ? 1 : acceptanceItems.length}
                                    />
                                )}
                                <TableCell
                                    rowSpan={collapsed ? 1 : acceptanceItems.length}
                                    sx={{
                                        borderLeft: '4px solid',
                                        borderLeftColor: 'primary.main',
                                        backgroundColor: 'rgba(25, 118, 210, 0.02)',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <PlaylistAddCheckIcon color="primary" sx={{ mr: 1 }} />
                                            <Box>
                                                <Typography fontWeight="600" color="primary.main">
                                                    {panel?.panel?.name}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {hasMultipleItems && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                        >
                                                            {acceptanceItems.length} tests
                                                        </Typography>
                                                    )}
                                                    {panel?.sampleless && (
                                                        <Chip
                                                            label="Sampleless"
                                                            size="small"
                                                            color="warning"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.65rem', height: 20 }}
                                                        />
                                                    )}
                                                    {(panel?.reportless || panel?.sampleless) && (
                                                        <Chip
                                                            label="Reportless"
                                                            size="small"
                                                            color="info"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.65rem', height: 20 }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                        {hasMultipleItems && (
                                            <Tooltip
                                                title={
                                                    collapsed ? 'Expand tests' : 'Collapse tests'
                                                }
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setCollapsed(!collapsed)}
                                                >
                                                    {collapsed ? (
                                                        <ExpandMoreIcon />
                                                    ) : (
                                                        <ExpandLessIcon />
                                                    )}
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
                            <Box display="flex" gap={1} sx={{ alignItems: 'center' }}>
                                {showButton ? (
                                    <Link
                                        href={route('acceptanceItems.show', {
                                            acceptanceItem: item.id,
                                            acceptance: item.acceptance_id,
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
                                    <Box
                                        key={sampleIndex}
                                        sx={{ mb: sampleIndex < item.samples.length - 1 ? 1 : 0 }}
                                    >
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
                                        color={
                                            Number(panel.discount) > 0
                                                ? 'success.main'
                                                : 'text.primary'
                                        }
                                        sx={{ textAlign: 'right' }}
                                    >
                                        {panel.discount}
                                    </Typography>
                                </TableCell>

                                <TableCell rowSpan={collapsed ? 1 : acceptanceItems.length}>
                                    <PriceDisplay price={panel.price} discount={panel.discount} />
                                </TableCell>

                                {(onEdit || onDelete || onRestore || onEject) && (
                                    <TableCell
                                        rowSpan={collapsed ? 1 : acceptanceItems.length}
                                        align="center"
                                    >
                                        <ActionButtons
                                            panel={panel}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onRestore={onRestore}
                                            onEject={onEject}
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
