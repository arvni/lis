import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Box, Button, Chip } from '@mui/material';
import { PlaylistAdd as PromoteIcon } from '@mui/icons-material';
import TestRow from './TestRow';
import PanelRow from './PanelRow';
import useTotalCalculations from '../hooks/useTotalCalculations';

const TEST_TYPE = {
    TEST: 'Test',
    SERVICE: 'Service',
    PANEL: 'Panel',
};

const TestsTable = ({
    tests,
    panels,
    onEditTest,
    onDeleteTest,
    onEditPanel,
    onDeletePanel,
    onRestoreTest,
    onRestorePanel,
    onEjectPanel,
    onPromoteTest,
    showButton = false,
    showTotal = true,
}) => {
    const { totalDiscount, totalPrice, hasItems } = useTotalCalculations(tests, panels);

    // Selection state — only active when onPromoteTest is provided
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelect = (test, checked) => {
        setSelectedIds((prev) =>
            checked ? [...prev, test.id] : prev.filter((id) => id !== test.id),
        );
    };

    const selectedTests = (tests || []).filter((t) => selectedIds.includes(t.id));

    const handlePromoteSelected = () => {
        if (onPromoteTest && selectedTests.length > 0) {
            onPromoteTest(selectedTests);
        }
    };

    const hasActions =
        onEditPanel || onDeletePanel || onEditTest || onDeleteTest || onEjectPanel || onPromoteTest;

    if (!hasItems) return null;

    return (
        <>
            {/* Promote toolbar — shown when ≥1 test selected */}
            {onPromoteTest && selectedTests.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1,
                        bgcolor: 'secondary.50',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Chip
                        label={`${selectedTests.length} test${selectedTests.length > 1 ? 's' : ''} selected`}
                        color="secondary"
                        size="small"
                    />
                    <Button
                        size="small"
                        variant="contained"
                        color="secondary"
                        startIcon={<PromoteIcon />}
                        onClick={handlePromoteSelected}
                    >
                        Promote to Panel
                    </Button>
                    <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        onClick={() => setSelectedIds([])}
                    >
                        Clear
                    </Button>
                </Box>
            )}

            <TableContainer>
                <Table aria-label="tests table" sx={{ minWidth: 700 }}>
                    <TableHead>
                        <TableRow>
                            {/* Checkbox column header — only for test rows */}
                            {onPromoteTest && <TableCell padding="checkbox" />}
                            <TableCell>Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Patient</TableCell>
                            <TableCell>Tags</TableCell>
                            <TableCell>Details</TableCell>
                            <TableCell align="right">Discount</TableCell>
                            <TableCell align="right">Price</TableCell>
                            {hasActions && <TableCell align="center">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {panels.map((panel) => (
                            <PanelRow
                                key={panel.id}
                                showButton={showButton}
                                panel={panel}
                                testTypes={TEST_TYPE}
                                onEdit={onEditPanel ? () => onEditPanel(panel.id) : null}
                                onDelete={onDeletePanel ? () => onDeletePanel(panel.id) : null}
                                onRestore={onRestorePanel ? () => onRestorePanel(panel.id) : null}
                                onEject={onEjectPanel ? () => onEjectPanel(panel) : null}
                                hasSelectionColumn={Boolean(onPromoteTest)}
                            />
                        ))}

                        {tests.map((test) => (
                            <TestRow
                                key={test.id}
                                showButton={showButton}
                                test={test}
                                testTypes={TEST_TYPE}
                                onEdit={onEditTest ? () => onEditTest(test.id) : null}
                                onDelete={onDeleteTest ? () => onDeleteTest(test.id) : null}
                                onRestore={onRestoreTest ? () => onRestoreTest(test.id) : null}
                                selected={selectedIds.includes(test.id)}
                                onSelect={onPromoteTest ? handleSelect : null}
                            />
                        ))}
                    </TableBody>

                    {showTotal && (
                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={onPromoteTest ? 9 : 8} align="right">
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        Total:
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        color="success.main"
                                    >
                                        {totalDiscount}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        color="primary.main"
                                    >
                                        {totalPrice}
                                    </Typography>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>
        </>
    );
};

export default TestsTable;
