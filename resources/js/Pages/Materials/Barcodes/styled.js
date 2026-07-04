import { Box, Typography, Paper, Container, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export const BarcodeContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    margin: '0 auto',
    '@media print': {
        padding: 0,
    },
}));

export const BarcodeItem = styled(Paper)(({ theme, printOnlyBarcode }) => ({
    paddingTop: '0mm',
    textAlign: 'center',
    margin: theme.spacing(1),
    display: printOnlyBarcode ? 'block' : 'flex',
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    pageBreakAfter: 'always',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    width: '36mm',
    height: '24mm',
    border: '1px dashed #ddd',
    position: 'relative',
    overflow: 'hidden',
    '@media print': {
        margin: printOnlyBarcode ? 'auto' : 0,
        boxShadow: 'none',
        border: 'none',
        width: '100%',
        height: '100%',
    },
}));

export const BarcodeText = styled(Typography)(({ printOnlyBarcode = false, scale = 1 }) => ({
    margin: '0.5px',
    lineHeight: printOnlyBarcode ? '3.5mm' : '2.5mm',
    fontWeight: 'bold',
    fontSize: printOnlyBarcode ? '3.5mm' : `${2.5 * scale}mm`,
    fontFamily: 'monospace',
    letterSpacing: '.15mm',
    textTransform: 'uppercase',
    zIndex: 1,
    background: '#fff',
    padding: printOnlyBarcode ? 'unset' : '0 1mm',
    width: '100%',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '@media print': {
        fontSize: printOnlyBarcode ? '3.5mm' : `${2.5 * scale}mm`,
    },
}));

export const PrintButton = styled(IconButton)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
    '&:hover': {
        backgroundColor: theme.palette.primary.dark,
    },
    '@media print': {
        display: 'none',
    },
}));

export const BackButton = styled(IconButton)(({ theme }) => ({
    position: 'fixed',
    bottom: theme.spacing(3),
    left: theme.spacing(3),
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    boxShadow: '0 3px 5px rgba(0,0,0,0.2)',
    '&:hover': {
        backgroundColor: theme.palette.grey[300],
    },
    '@media print': {
        display: 'none',
    },
}));

export const HeaderBar = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '@media print': {
        display: 'none',
    },
}));
