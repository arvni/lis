import { Box, Typography, Table, TableCell, TableRow, Paper, Chip, styled } from '@mui/material';

// A5 paper dimensions - optimized for printing
export const A5_WIDTH = '148mm';
export const A5_HEIGHT = '210mm';

// Styled components optimized for A5 paper
export const InvoiceContainer = styled(Paper)(({ _theme }) => ({
    width: A5_WIDTH,
    maxHeight: A5_HEIGHT,
    margin: 'auto',
    padding: '5mm',
    lineHeight: '1.2',
    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontSize: '9pt',
    '@media print': {
        backgroundColor: 'white',
        boxShadow: 'none',
        margin: 0,
        width: '100%',
        height: '100%',
    },
}));

export const InvoiceHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
}));

export const SectionHeading = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
}));

export const StyledTable = styled(Table)(({ theme }) => ({
    '& .MuiTableCell-root': {
        padding: '2px 4px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        fontSize: '0.7rem',
    },
    '& .MuiTableRow-root.total td': {
        borderTop: `1px solid ${theme.palette.divider}`,
        fontWeight: 'bold',
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
        backgroundColor: theme.palette.grey[100],
        fontWeight: 'bold',
        padding: '3px 4px',
    },
}));

export const HeaderCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.grey[100],
    fontWeight: 'bold',
    fontSize: '0.7rem',
    padding: '3px 4px',
}));

export const RightAlignedCell = styled(TableCell)({
    textAlign: 'right !important',
    fontSize: '0.7rem',
    padding: '2px 4px',
});

export const LeftAlignedCell = styled(TableCell)({
    textAlign: 'left !important',
    fontSize: '0.7rem',
    padding: '2px 4px',
});

export const TotalRow = styled(TableRow)(({ theme }) => ({
    '& .MuiTableCell-root': {
        padding: '2px 4px',
        backgroundColor: theme.palette.grey[50],
        fontSize: '0.7rem',
    },
}));

export const FinalTotal = styled(TotalRow)(({ theme }) => ({
    '& .MuiTableCell-root': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        fontWeight: 'bold',
        fontSize: '0.75rem',
    },
}));

export const InfoLabel = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
    display: 'inline-block',
    fontSize: '0.7rem',
}));

export const InfoValue = styled(Typography)({
    display: 'inline-block',
    fontSize: '0.7rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

export const SmallChip = styled(Chip)({
    height: '16px',
    fontSize: '0.6rem',
    '& .MuiChip-label': {
        padding: '0 6px',
    },
});

export const ReceiptBadge = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: '5mm',
    right: '5mm',
    transform: 'rotate(15deg)',
    border: `1px solid ${theme.palette.secondary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.3, 0.8),
    color: theme.palette.secondary.main,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontSize: '0.6rem',
    '@media print': {
        display: 'block',
    },
}));

export const InvoiceFooter = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(1),
    textAlign: 'center',
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingTop: theme.spacing(0.5),
    fontSize: '0.6rem',
    color: theme.palette.text.secondary,
}));

export const InfoItem = ({ label, value, icon }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
        {icon && (
            <Box
                sx={{
                    mr: 0.5,
                    color: 'primary.main',
                    '& .MuiSvgIcon-root': { fontSize: '0.7rem' },
                }}
            >
                {icon}
            </Box>
        )}
        <InfoLabel variant="body2" component="span">
            {label}:
        </InfoLabel>
        <Box sx={{ ml: 0.5, maxWidth: '70%' }}>
            <InfoValue variant="body2" component="span">
                {value || 'N/A'}
            </InfoValue>
        </Box>
    </Box>
);
