import React from 'react';
import {
    Button,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { Refresh } from '@mui/icons-material';
import Excel from '../../../../../images/excel.svg';

const DashboardControls = ({
    date,
    maxDate,
    onDateChange,
    filter,
    onFilterChange,
    categoryFilter,
    onCategoryFilterChange,
    onRefresh,
    isRefreshing,
    onRefreshClick,
    refreshButtonText,
}) => (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Tooltip title="Export to Excel">
            <IconButton
                href={route('api.dailyCashReport.export', { date })}
                color="success"
                target="_blank"
                sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <img src={Excel} alt="Excel" width="24px" />
                    <Typography variant="button" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        Export
                    </Typography>
                </Stack>
            </IconButton>
        </Tooltip>
        <TextField
            onChange={onDateChange}
            value={date}
            size="small"
            type="date"
            sx={{ minWidth: 120 }}
            slotProps={{ htmlInput: { max: maxDate } }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select value={filter} label="Priority" onChange={onFilterChange}>
                <MenuItem value="all">All Metrics</MenuItem>
                <MenuItem value="high">High Priority</MenuItem>
                <MenuItem value="alerts">Alerts Only</MenuItem>
            </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={onCategoryFilterChange}>
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="operations">Operations</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="alerts">Alerts</MenuItem>
            </Select>
        </FormControl>

        {onRefresh && (
            <Button
                variant="outlined"
                startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
                onClick={onRefreshClick}
                disabled={isRefreshing}
            >
                {refreshButtonText}
            </Button>
        )}
    </Stack>
);

export default DashboardControls;
