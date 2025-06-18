import React, {useEffect, useState} from 'react';
import {
    Box,
    Typography,
    Paper,
    Container,
    Snackbar,
    Alert,
    Tooltip,
    IconButton,
    Grid2 as Grid,
    Chip, Stack, Divider
} from '@mui/material';
import {styled} from '@mui/material/styles';
import JsBarcode from 'jsbarcode';
import {
    Print as PrintIcon,
    LocalHospital as LocalHospitalIcon,
    CalendarToday as CalendarTodayIcon,
    Close as CloseIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

// Styled components with enhanced styling
const BarcodeContainer = styled(Container)(({theme}) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
    margin: '0 auto',
    '@media print': {
        padding: 0
    }
}));

const BarcodeItem = styled(Paper)(({theme, printOnlyBarcode}) => ({
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
    height: '26mm',
    border: '1px dashed #ddd',
    position: 'relative',
    overflow: 'hidden',
    '@media print': {
        margin: printOnlyBarcode?'auto':0,
        boxShadow: 'none',
        border: 'none',
    }
}));

const BarcodeText = styled(Typography)(({printOnlyBarcode = false}) => ({
    margin: '0.5px',
    lineHeight: printOnlyBarcode ? '3.5mm' : '2.5mm',
    fontWeight: 'bold',
    fontSize: printOnlyBarcode ? '3.5' : '2.5mm',
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
        fontSize: printOnlyBarcode ? '3.5mm' : '2.5mm',
    }
}));

const PrintButton = styled(IconButton)(({theme}) => ({
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
        display: 'none'
    }
}));

const BackButton = styled(IconButton)(({theme}) => ({
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
        display: 'none'
    }
}));

const HeaderBar = styled(Box)(({theme}) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '@media print': {
        display: 'none'
    }
}));

const BarcodeComponent = ({materials}) => {
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [printOnlyBarcode, setPrintOnlyBarcode] = useState(false);
    const handleChange = (e) => setPrintOnlyBarcode(e.target.checked)

    useEffect(() => {
        // Initialize barcodes after component mounts
        if (!printOnlyBarcode) {
            materials.forEach(material => {
                JsBarcode(`#barcode-${material.barcode}`, material.barcode, {
                    format: 'CODE128',
                    width: 1,
                    height: 35,
                    displayValue: false,
                    background: '#ffffff',
                    lineColor: '#000000'
                });
            });
        }
        // Trigger print when component is loaded
        const printTimeout = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(printTimeout);
    }, [materials, printOnlyBarcode]);

    // Format date function with enhanced formatting
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        window.history.back();
    };

    const handleSnackbarClose = () => {
        setShowSnackbar(false);
    };

    return (
        <>
            <HeaderBar>
                <Typography variant="h6">
                    <LocalHospitalIcon sx={{mr: 1, verticalAlign: 'middle'}}/>
                    Barcode Labels Packing Series ({materials.length ? materials[0].packing_series : ""})
                </Typography>
                <Box>
                    <FormControlLabel sx={{mt: 1}}
                                      label="Print The Barcode"
                                      control={<Checkbox checked={printOnlyBarcode}
                                                         name="printBarcode"
                                                         onChange={handleChange}/>}/>
                </Box>
                <Chip
                    icon={<PrintIcon fontSize="small"/>}
                    label="Ready for Printing"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{display: 'flex'}}
                />
            </HeaderBar>
            <BarcodeContainer>
                <Grid container spacing={1} justifyContent="center">
                    {materials.map((material) => (
                        <Grid key={material.id}
                              size={12}
                              sx={{display: printOnlyBarcode ? "block" : "flex", justifyContent: "center"}}
                              className="page-break">
                            <BarcodeItem printOnlyBarcode={printOnlyBarcode}>
                                {printOnlyBarcode ? <Stack direction="column"
                                                           sx={{height:"100%"}}
                                                           justifyContent="space-around">
                                    <BarcodeText printOnlyBarcode>{material.barcode}</BarcodeText>
                                    <Divider/>
                                    <BarcodeText printOnlyBarcode>{material.barcode}</BarcodeText>
                                    <Divider/>
                                    <BarcodeText printOnlyBarcode>{material.barcode}</BarcodeText>
                                </Stack> : <>
                                    <Box sx={{
                                        width: '100%',
                                        pt: '0mm',
                                        display: "flex",
                                        "& svg ": {width: "100% !important"}
                                    }}>
                                        <svg id={`barcode-${material.barcode}`}
                                             style={{width: "100% !important"}}></svg>
                                    </Box>
                                    <Stack spacing={.5} sx={{mt: "-3mm", zIndex: 1}}>
                                        <BarcodeText>{material.barcode}</BarcodeText>
                                        <BarcodeText>
                                            <Box component="span"
                                                 sx={{display: 'inline-flex', alignItems: 'center', mr: 0.5}}>
                                                {formatDate(material.expire_date || material.created_at)}
                                            </Box>
                                        </BarcodeText>
                                        <BarcodeText title={material.sample_type_name}>
                                            {material.sample_type_name}
                                        </BarcodeText>
                                    </Stack>
                                </>}
                            </BarcodeItem>
                        </Grid>
                    ))}
                </Grid>
            </BarcodeContainer>

            <Tooltip title="Print Barcodes">
                <PrintButton size="large" onClick={handlePrint}>
                    <PrintIcon/>
                </PrintButton>
            </Tooltip>

            <Tooltip title="Go Back">
                <BackButton size="large" onClick={handleBack}>
                    <ArrowBackIcon/>
                </BackButton>
            </Tooltip>

            <Snackbar
                open={showSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity="success"
                    sx={{width: '100%'}}
                    action={
                        <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
                            <CloseIcon fontSize="small"/>
                        </IconButton>
                    }
                >
                    Barcodes ready! Printing will start automatically...
                </Alert>
            </Snackbar>
        </>
    );
};

// Define custom print styles globally
const GlobalStyles = () => {
    useEffect(() => {
        // Create a style element
        const style = document.createElement('style');
        style.innerHTML = `
      @page {
        margin: 0;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
        .MuiGrid-container {
          display: block !important;
        }
        .MuiGrid-item {
          display: block !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .page-break {
          break-before: page;   /* or 'auto', 'avoid', etc. */
          break-after: page;
          break-inside: avoid;
        }
      }
    `;
        document.head.appendChild(style);

        // Clean up
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return null;
};

const BarcodePageComponent = ({materials}) => {
    return (
        <>
            <GlobalStyles/>
            <BarcodeComponent materials={materials}/>
        </>
    );
};

export default BarcodePageComponent;
