import React, {useRef, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import * as XLSX from 'xlsx';

/**
 * ExcelParameterImporter component
 *
 * Allows importing parameter values from an Excel file where:
 * - Row 2 contains parameter IDs in format ${parameter_name}
 * - Row 3 contains parameter values
 * - Column A is ignored (typically contains row headers)
 *
 * @param {Object} props Component props
 * @param {Function} props.onImport Callback when parameters are imported
 * @param {Object} props.currentValues Current parameter values for preview
 */
const ExcelParameterImporter = ({ onImport, currentValues = {} }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [importedValues, setImportedValues] = useState(null);
    const fileInputRef = useRef(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setError(null);
        setImportedValues(null);
    };

    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setImportedValues(null);

        try {
            // Read the file
            const data = await readFileAsArrayBuffer(file);

            // Parse the Excel file
            const workbook = XLSX.read(data, {
                type: 'array',
                cellDates: true,
                cellNF: true,
                cellStyles: true
            });

            // Get the first sheet
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                throw new Error('The Excel file does not contain any sheets');
            }

            const worksheet = workbook.Sheets[firstSheetName];
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

            // Check if the sheet has at least 3 rows
            if (range.e.r < 2) {
                throw new Error('The Excel file must have at least 3 rows (header, parameter IDs, values)');
            }

            // Extract parameter IDs from row 2 and values from row 3
            const extractedValues = {};
            for (let c = range.s.c; c <= range.e.c; c++) {
                // Skip first column (typically contains row headers)
                if (c === 0) continue;

                const paramCell = worksheet[XLSX.utils.encode_cell({ r: 1, c })]; // Row 2 (0-indexed)
                const valueCell = worksheet[XLSX.utils.encode_cell({ r: 2, c })]; // Row 3 (0-indexed)

                if (paramCell && paramCell.v) {
                    const paramId = String(paramCell.v);

                    // Check if parameter ID is in format ${param_name}
                    if (paramId.startsWith('${') && paramId.endsWith('}')) {
                        // Extract parameter name without ${ and }
                        const formattedParamId = paramId.substring(2, paramId.length - 1);
                        // Store the extracted value
                        extractedValues[formattedParamId] = valueCell ? valueCell.v : '';
                    }
                }
            }

            // Check if we found any parameters
            if (Object.keys(extractedValues).length === 0) {
                throw new Error('No valid parameters found in the Excel file');
            }

            // Set the imported values
            setImportedValues(extractedValues);
        } catch (err) {
            console.error('Error processing Excel file:', err);
            setError(err.message || 'Failed to process the Excel file');
        } finally {
            setLoading(false);
            resetFileInput();
        }
    };

    const handleImportConfirm = () => {
        if (importedValues) {
            onImport(importedValues);
            handleClose();
        }
    };

    // Helper function to read file as ArrayBuffer
    const readFileAsArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    };

    return (
        <>
            <Tooltip title="Fill parameters from Excel file">
                <IconButton onClick={handleOpen} size="small">
                    <FileUploadIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Import Parameters from Excel
                    <IconButton
                        onClick={handleClose}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Upload an Excel file containing parameter values. The file should have:
                        </Typography>
                        <ul>
                            <li>Row 2: Parameter identifiers in format {"${parameter_name}"}</li>
                            <li>Row 3: Parameter values</li>
                        </ul>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            The first column will be ignored (typically contains row headers).
                        </Alert>

                        {!importedValues && (
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<FileUploadIcon />}
                                sx={{ mt: 2 }}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Select Excel File'}
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    hidden
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    disabled={loading}
                                />
                            </Button>
                        )}

                        {loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <CircularProgress />
                            </Box>
                        )}

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {importedValues && (
                            <Box sx={{ mt: 3 }}>
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    Successfully extracted {Object.keys(importedValues).length} parameter values
                                </Alert>

                                <Typography variant="subtitle2" gutterBottom>
                                    Parameter Values Preview:
                                </Typography>

                                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Parameter</TableCell>
                                                <TableCell>Current Value</TableCell>
                                                <TableCell>New Value</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.keys(importedValues).map((paramId) => {
                                                // Extract parameter name for display
                                                const displayName = paramId.replace('param-', '').replace(/-/g, ' ');

                                                // Format values for display
                                                const formatValue = (value) => {
                                                    if (value === undefined || value === null) return '';
                                                    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
                                                    if (value instanceof Date) return value.toLocaleDateString();
                                                    return String(value);
                                                };

                                                return (
                                                    <TableRow key={paramId}>
                                                        <TableCell>{displayName}</TableCell>
                                                        <TableCell>{formatValue(currentValues[paramId])}</TableCell>
                                                        <TableCell>{formatValue(importedValues[paramId])}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImportConfirm}
                        color="primary"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        disabled={!importedValues}
                    >
                        Import Values
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ExcelParameterImporter;
