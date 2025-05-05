import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import TestRow from "./TestRow";
import PanelRow from "./PanelRow";
import useTotalCalculations from "../hooks/useTotalCalculations";

const TEST_TYPE = {
    'TEST': "Test",
    'SERVICE': "Service",
    'PANEL': "Panel"
};

const TestsTable = ({
                        tests,
                        panels,
                        onEditTest,
                        onDeleteTest,
                        onEditPanel,
                        onDeletePanel
                    }) => {
    const { totalDiscount, totalPrice, hasItems } = useTotalCalculations(tests, panels);

    if (!hasItems) {
        return null;
    }

    return (
        <TableContainer>
            <Table aria-label="tests table" sx={{ minWidth: 700 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Full Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Details</TableCell>
                        <TableCell align="right">Discount</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {panels.map(panel => (
                        <PanelRow
                            key={panel.id}
                            panel={panel}
                            testTypes={TEST_TYPE}
                            onEdit={() => onEditPanel(panel.id)}
                            onDelete={() => onDeletePanel(panel.id)}
                        />
                    ))}

                    {tests.map(test => (
                        <TestRow
                            key={test.id}
                            test={test}
                            testTypes={TEST_TYPE}
                            onEdit={() => onEditTest(test.id)}
                            onDelete={() => onDeleteTest(test.id)}
                        />
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={7} align="right">
                            <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                                {totalDiscount}
                            </Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                {totalPrice}
                            </Typography>
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
};

export default TestsTable;
