import { Box, TableBody, TableCell, TableContainer, Typography } from '@mui/material';
import { StyledTable, TotalRow, FinalTotal, LeftAlignedCell, RightAlignedCell } from './styled';

const TotalsTable = ({ subtotal, totalDiscount, totalPayment, finalTotal }) => (
    <TableContainer component={Box} sx={{ mb: 1 }}>
        <StyledTable size="small" padding="none">
            <TableBody>
                <TotalRow>
                    <TableCell width="60%"></TableCell>
                    <LeftAlignedCell>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            Sub Total:
                        </Typography>
                    </LeftAlignedCell>
                    <RightAlignedCell>
                        <Typography variant="caption">OMR {subtotal.toFixed(2)}</Typography>
                    </RightAlignedCell>
                </TotalRow>
                {totalDiscount > 0 && (
                    <TotalRow>
                        <TableCell></TableCell>
                        <LeftAlignedCell>
                            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Discount:
                            </Typography>
                        </LeftAlignedCell>
                        <RightAlignedCell>
                            <Typography variant="caption">
                                - OMR {totalDiscount.toFixed(2)}
                            </Typography>
                        </RightAlignedCell>
                    </TotalRow>
                )}
                <TotalRow>
                    <TableCell></TableCell>
                    <LeftAlignedCell>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            Payments:
                        </Typography>
                    </LeftAlignedCell>
                    <RightAlignedCell>
                        <Typography variant="caption">- OMR {totalPayment.toFixed(2)}</Typography>
                    </RightAlignedCell>
                </TotalRow>
                <FinalTotal>
                    <TableCell></TableCell>
                    <LeftAlignedCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Balance Due:
                        </Typography>
                    </LeftAlignedCell>
                    <RightAlignedCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            OMR {finalTotal.toFixed(2)}
                        </Typography>
                    </RightAlignedCell>
                </FinalTotal>
            </TableBody>
        </StyledTable>
    </TableContainer>
);

export default TotalsTable;
