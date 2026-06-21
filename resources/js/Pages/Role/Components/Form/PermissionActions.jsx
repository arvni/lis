import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Box, IconButton, InputAdornment, Stack, useTheme } from '@mui/material';
import { Check, ClearAll, Search } from '@mui/icons-material';
import { memo, useCallback } from 'react';

// Actions component for the permissions section
const PermissionActions = memo(
    ({ onSelectAll, onClearAll, searchTerm, onSearchChange, permissionCount, disabled = false }) => {
        const theme = useTheme();

        const handleSearchChange = useCallback(
            (e) => {
                onSearchChange(e.target.value);
            },
            [onSearchChange],
        );

        const handleClearSearch = useCallback(() => {
            onSearchChange('');
        }, [onSearchChange]);

        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', sm: 'center' },
                    mb: 3,
                    gap: 2,
                }}
            >
                <TextField
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    variant="outlined"
                    size="small"
                    fullWidth
                    disabled={disabled}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search color="action" fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={handleClearSearch}
                                        edge="end"
                                        aria-label="clear search"
                                    >
                                        <ClearAll fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                            sx: {
                                borderRadius: 2,
                                bgcolor: theme.palette.background.paper,
                            },
                        },
                    }}
                    sx={{ flexGrow: 1, maxWidth: { sm: 300 } }}
                />

                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                        flexShrink: 0,
                    }}
                >
                    <Button
                        onClick={onSelectAll}
                        variant="outlined"
                        size="small"
                        startIcon={<Check />}
                        disabled={disabled}
                        sx={{ borderRadius: 2 }}
                    >
                        Select All
                    </Button>
                    <Button
                        onClick={onClearAll}
                        variant="outlined"
                        color="secondary"
                        size="small"
                        startIcon={<ClearAll />}
                        disabled={disabled || permissionCount === 0}
                        sx={{ borderRadius: 2 }}
                    >
                        Clear All
                    </Button>
                </Stack>
            </Box>
        );
    },
);
PermissionActions.displayName = 'PermissionActions';

export default PermissionActions;
