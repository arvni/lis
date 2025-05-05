import React, {useCallback, useEffect, useState} from "react";
import {
    Alert,
    AppBar,
    Box,
    Button,
    Chip, CircularProgress,
    Fade,
    IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import * as XLSX from "xlsx";
import {Search} from "@mui/icons-material";

const ExcelViewer = ({ fileUrl, fullScreen = false }) => {
    const [sheets, setSheets] = useState([]);
    const [activeSheetName, setActiveSheetName] = useState('');
    const [sheetData, setSheetData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [workbook, setWorkbook] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Function to parse a specific sheet
    const parseSheet = useCallback((wb, sheetName) => {
        if (!wb || !wb.SheetNames.includes(sheetName)) return [];
        const ws = wb.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    }, []);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setSheets([]);
        setActiveSheetName('');
        setSheetData([]);
        setWorkbook(null);
        setSearchText('');
        setSearchResults([]);

        const readExcel = async () => {
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();

                // Use full options for better Excel parsing
                const wb = XLSX.read(arrayBuffer, {
                    type: 'array',
                    cellStyles: true,
                    cellFormulas: true,
                    cellDates: true,
                    cellNF: true,
                    sheetStubs: true
                });

                if (isMounted) {
                    const sheetNames = wb.SheetNames;
                    if (sheetNames.length > 0) {
                        const firstSheetName = sheetNames[0];
                        const firstSheetData = parseSheet(wb, firstSheetName);
                        setWorkbook(wb);
                        setSheets(sheetNames);
                        setActiveSheetName(firstSheetName);
                        setSheetData(firstSheetData);
                    } else {
                        setError("Excel file contains no sheets.");
                    }
                }
            } catch (err) {
                console.error("Excel Load Error:", err);
                if (isMounted) {
                    setError(`Failed to load or parse Excel file: ${err.message || 'Unknown error'}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        readExcel();

        return () => { isMounted = false; };
    }, [fileUrl, parseSheet]);

    const handleSheetChange = (sheetName) => {
        if (sheetName === activeSheetName || !workbook) return;

        setLoading(true);
        setError(null);
        setSearchText('');
        setSearchResults([]);

        setTimeout(() => {
            try {
                const data = parseSheet(workbook, sheetName);
                setActiveSheetName(sheetName);
                setSheetData(data);
            } catch (err) {
                console.error("Sheet Change Error:", err);
                setError(`Failed to parse sheet '${sheetName}': ${err.message || 'Unknown error'}`);
            } finally {
                setLoading(false);
            }
        }, 50);
    };

    // Function to search in the sheet data
    const handleSearch = () => {
        if (!searchText || !sheetData.length) {
            setSearchResults([]);
            return;
        }

        const searchLower = searchText.toLowerCase();
        const results = [];

        // Search in all cells
        sheetData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell && String(cell).toLowerCase().includes(searchLower)) {
                    results.push({ row: rowIndex, col: colIndex, value: cell });
                }
            });
        });

        setSearchResults(results);
    };

    // Navigate to a specific cell from search results
    const goToCell = (rowIndex, colIndex) => {
        // We could implement scrolling to the specific cell here
        // For now, just close the search to make sure the table is visible
        setShowSearch(false);
    };

    // Find the maximum number of columns
    const maxCols = sheetData.reduce((max, row) => Math.max(max, row.length), 0);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: fullScreen ? 'calc(100vh - 48px)' : 500,
            width: '100%',
            overflow: 'hidden'
        }}>
            <AppBar position="static" color="default" elevation={0}>
                <Toolbar variant="dense">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', overflow: 'auto' }}>
                        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, overflow: 'auto', py: 0.5 }}>
                            {sheets.map(sheet => (
                                <Chip
                                    key={sheet}
                                    label={sheet}
                                    size="small"
                                    color={activeSheetName === sheet ? "primary" : "default"}
                                    onClick={() => handleSheetChange(sheet)}
                                    disabled={loading}
                                    sx={{
                                        textTransform: 'none',
                                        whiteSpace: 'nowrap',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </Box>

                        {!isMobile && (
                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                                <Tooltip title={showSearch ? "Hide search" : "Search in sheet"}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowSearch(!showSearch)}
                                        color={showSearch ? "primary" : "default"}
                                    >
                                        <Search />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Search bar */}
            {showSearch && (
                <Fade in={showSearch}>
                    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <input
                                type="text"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Search in sheet..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{
                                    flexGrow: 1,
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleSearch}
                                disabled={!searchText}
                            >
                                Search
                            </Button>
                        </Box>

                        {/* Search results */}
                        {searchResults.length > 0 && (
                            <Box sx={{ mt: 1, maxHeight: 150, overflow: 'auto' }}>
                                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    Found {searchResults.length} matches
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                    {searchResults.map((result, index) => (
                                        <Button
                                            key={index}
                                            size="small"
                                            onClick={() => goToCell(result.row, result.col)}
                                            sx={{
                                                justifyContent: 'flex-start',
                                                textTransform: 'none',
                                                py: 0.5,
                                                textAlign: 'left',
                                                lineHeight: 1.2
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
                                                {`R${result.row + 1}:C${result.col + 1}`}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {String(result.value)}
                                            </Typography>
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Fade>
            )}

            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    bgcolor: 'white',
                    position: 'relative'
                }}
            >
                {loading && (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }}>
                        <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CircularProgress size={40} sx={{ mb: 2 }} />
                            <Typography variant="body2">Loading spreadsheet...</Typography>
                        </Paper>
                    </Box>
                )}
                {error && !loading && (
                    <Box sx={{ p: 2, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}
                {!loading && !error && sheetData.length > 0 && (
                    <TableContainer sx={{ height: '100%' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    {sheetData[0].map((cell, i) => (
                                        <TableCell
                                            key={i}
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1
                                            }}
                                        >
                                            {cell !== null && cell !== undefined ? cell : ''}
                                        </TableCell>
                                    ))}
                                    {Array.from({ length: Math.max(0, maxCols - sheetData[0].length) }).map((_, i) => (
                                        <TableCell
                                            key={`empty-th-${i}`}
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: '#f5f5f5',
                                                position: 'sticky',
                                                top: 0,
                                                zIndex: 1
                                            }}
                                        />
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sheetData.slice(1).map((row, rowIndex) => (
                                    <TableRow
                                        key={rowIndex}
                                        sx={{
                                            '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                                            '&:hover': { backgroundColor: '#f0f7ff' }
                                        }}
                                    >
                                        {row.map((cell, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                {cell !== null && cell !== undefined ? cell : ''}
                                            </TableCell>
                                        ))}
                                        {Array.from({ length: Math.max(0, maxCols - row.length) }).map((_, i) => (
                                            <TableCell key={`empty-td-${rowIndex}-${i}`} />
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {!loading && !error && sheetData.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1">Sheet is empty.</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};
export default ExcelViewer;
