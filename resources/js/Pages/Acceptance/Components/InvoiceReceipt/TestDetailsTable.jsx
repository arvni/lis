import { Box, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Science } from '@mui/icons-material';
import { SectionHeading, StyledTable, HeaderCell } from './styled';

const nameCellSx = {
    maxWidth: '22mm',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const TestDetailsTable = ({ acceptance }) => {
    const panels = acceptance?.acceptanceItems?.panels || [];
    const tests = acceptance?.acceptanceItems?.tests || [];

    return (
        <>
            <SectionHeading>
                <Science sx={{ mr: 0.5, fontSize: '0.75rem' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    Test Details
                </Typography>
            </SectionHeading>

            <TableContainer component={Box} sx={{ mb: 1 }}>
                <StyledTable size="small" padding="none">
                    <TableHead>
                        <TableRow>
                            <HeaderCell>#</HeaderCell>
                            <HeaderCell>Test Name</HeaderCell>
                            <HeaderCell align="right">Price</HeaderCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {panels.length > 0 &&
                            panels.map((panel, index) => (
                                <TableRow key={`panel-${panel.id}-${index}`}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell align="left" sx={nameCellSx}>
                                        {panel?.panel?.name}
                                    </TableCell>
                                    <TableCell align="right">{panel.price}</TableCell>
                                </TableRow>
                            ))}

                        {tests.length > 0 &&
                            tests.map((item, index) => (
                                <TableRow key={`test-${item.id}-${index}`}>
                                    <TableCell>{index + panels.length + 1}</TableCell>
                                    <TableCell align="left" sx={nameCellSx}>
                                        {item?.method_test?.test?.name}
                                    </TableCell>
                                    <TableCell align="right">{item.price}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </StyledTable>
            </TableContainer>
        </>
    );
};

export default TestDetailsTable;
