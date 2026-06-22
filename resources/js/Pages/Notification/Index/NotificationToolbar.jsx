import {
    Box,
    Button,
    Grid as Grid,
    InputAdornment,
    Menu,
    MenuItem,
    TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';

const NotificationToolbar = ({
    searchQuery,
    onSearchChange,
    selectMode,
    onToggleSelectMode,
    filterAnchorEl,
    onFilterOpen,
    onFilterClose,
    filterType,
    onFilterChange,
}) => (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                    placeholder="Search notifications..."
                    variant="outlined"
                    fullWidth
                    size="small"
                    value={searchQuery}
                    onChange={onSearchChange}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                        gap: 1,
                    }}
                >
                    <Button
                        variant="outlined"
                        color={selectMode ? 'primary' : 'inherit'}
                        onClick={onToggleSelectMode}
                        startIcon={<CheckCircleOutlineIcon />}
                        size="small"
                    >
                        {selectMode ? 'Cancel' : 'Select'}
                    </Button>

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onFilterOpen}
                        startIcon={<FilterListIcon />}
                    >
                        Filter
                    </Button>

                    <Menu
                        anchorEl={filterAnchorEl}
                        open={Boolean(filterAnchorEl)}
                        onClose={onFilterClose}
                    >
                        <MenuItem
                            onClick={() => onFilterChange('all')}
                            selected={filterType === 'all'}
                        >
                            All Types
                        </MenuItem>
                        <MenuItem
                            onClick={() => onFilterChange('system')}
                            selected={filterType === 'system'}
                        >
                            System
                        </MenuItem>
                        <MenuItem
                            onClick={() => onFilterChange('alert')}
                            selected={filterType === 'alert'}
                        >
                            Alerts
                        </MenuItem>
                        <MenuItem
                            onClick={() => onFilterChange('message')}
                            selected={filterType === 'message'}
                        >
                            Messages
                        </MenuItem>
                    </Menu>
                </Box>
            </Grid>
        </Grid>
    </Box>
);

export default NotificationToolbar;
