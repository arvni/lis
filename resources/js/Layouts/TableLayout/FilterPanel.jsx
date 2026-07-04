import React from 'react';
import { Box, Paper, Typography, IconButton, useTheme, alpha, Fade } from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';

/**
 * Collapsible filter panel wrapping a caller-supplied Filter component.
 */
const FilterPanel = ({ Filter, defaultFilter, onFilter, onToggle }) => {
    const theme = useTheme();

    return (
        <Fade in={true} timeout={300}>
            <Paper
                elevation={0}
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    borderColor: theme.palette.divider,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={500}>
                        <FilterListIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Filter Records
                    </Typography>
                    <IconButton size="small" onClick={onToggle}>
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Filter defaultFilter={defaultFilter} onFilter={onFilter} />
            </Paper>
        </Fade>
    );
};

export default FilterPanel;
