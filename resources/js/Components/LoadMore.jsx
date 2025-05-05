import React, { useState, useEffect } from "react";
import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Typography,
    Button,
    Box,
    Skeleton,
    Tooltip,
    IconButton,
    useTheme,
    alpha
} from "@mui/material";
import {
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon,
    OpenInNew as OpenInNewIcon
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";

/**
 * Enhanced LoadMore component for displaying data with expandable accordion
 *
 * @param {Object[]} items - Data items to display in the grid
 * @param {Object[]} columns - Column configuration for the DataGrid
 * @param {string} loadMoreLink - URL to load more items
 * @param {string} title - Title of the accordion
 * @param {boolean} defaultExpanded - Whether the accordion is expanded by default
 * @param {boolean} loading - Loading state for the data
 * @param {Function} onRefresh - Optional callback for refresh button
 * @param {number} pageSize - Number of rows per page in the grid
 * @param {string} emptyMessage - Message to display when there are no items
 */
const LoadMore = ({
                      items = [],
                      columns = [],
                      loadMoreLink,
                      title,
                      defaultExpanded = false,
                      loading = false,
                      onRefresh,
                      pageSize = 5,
                      emptyMessage = "No items to display"
                  }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [pageModel, setPageModel] = useState({ pageSize, page: 0 });
    const [gridReady, setGridReady] = useState(false);

    // Set grid as ready after a short delay to ensure smooth accordion animation
    useEffect(() => {
        if (expanded) {
            const timer = setTimeout(() => setGridReady(true), 150);
            return () => clearTimeout(timer);
        } else {
            setGridReady(false);
        }
    }, [expanded]);

    // Handle accordion expansion state
    const handleChange = (_, isExpanded) => {
        setExpanded(isExpanded);
    };

    // Custom rendering for empty state
    const customNoRowsOverlay = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 2,
                color: 'text.secondary'
            }}
        >
            <Typography variant="body1">{emptyMessage}</Typography>
        </Box>
    );

    return (
        <Accordion
            expanded={expanded}
            onChange={handleChange}
            defaultExpanded={defaultExpanded}
            elevation={2}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                '&:before': {
                    display: 'none',
                },
                mb: 2,
                overflow: 'hidden'
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="load-more-content"
                id={`load-more-header-${title?.replace(/\s+/g, '-').toLowerCase() || 'panel'}`}
                sx={{
                    backgroundColor: expanded ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                    borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    }
                }}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'space-between'
                }}>
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: expanded ? 600 : 500,
                            color: expanded ? 'primary.main' : 'text.primary',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {title}
                    </Typography>

                    {onRefresh && (
                        <Tooltip title="Refresh data">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRefresh();
                                }}
                                sx={{ ml: 2 }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
                {loading ? (
                    <Box sx={{ p: 2 }}>
                        <Skeleton variant="rectangular" height={40} />
                        {[...Array(3)].map((_, index) => (
                            <Skeleton
                                key={index}
                                variant="rectangular"
                                height={52}
                                sx={{ mt: 1 }}
                            />
                        ))}
                    </Box>
                ) : (
                    gridReady && (
                        <DataGrid
                            rows={items}
                            columns={columns}
                            autoHeight
                            disableColumnMenu
                            disableColumnSelector
                            disableDensitySelector
                            disableSelectionOnClick
                            disableColumnFilter
                            hideFooterSelectedRowCount
                            pagination
                            paginationMode="client"
                            pageSize={pageModel.pageSize}
                            onPageSizeChange={(newPageSize) =>
                                setPageModel({ ...pageModel, pageSize: newPageSize })
                            }
                            page={pageModel.page}
                            onPageChange={(newPage) =>
                                setPageModel({ ...pageModel, page: newPage })
                            }
                            rowsPerPageOptions={[5, 10, 25]}
                            components={{
                                NoRowsOverlay: customNoRowsOverlay,
                            }}
                            sx={{
                                border: 'none',
                                '& .MuiDataGrid-columnHeaders': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                },
                                '& .MuiDataGrid-row:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                },
                            }}
                        />
                    )
                )}
            </AccordionDetails>

            {loadMoreLink && (
                <AccordionActions sx={{
                    justifyContent: 'flex-end',
                    borderTop: `1px solid ${theme.palette.divider}`,
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    py: 1,
                    px: 2
                }}>
                    <Button
                        href={loadMoreLink}
                        target="_blank"
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewIcon fontSize="small" />}
                        sx={{
                            borderRadius: 4,
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        View More
                    </Button>
                </AccordionActions>
            )}
        </Accordion>
    );
};

export default LoadMore;
