import { Chip, IconButton, Tooltip } from '@mui/material';
import { RemoveRedEye } from '@mui/icons-material';

// Helper for consistent currency formatting (using OMR for Oman)
export const formatCurrency = (value) => {
    if (typeof value !== 'number') return '-';
    return new Intl.NumberFormat('en-OM', {
        // Using locale for Oman
        style: 'currency',
        currency: 'OMR', // Omani Rial
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// Helper for formatting dates consistently
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: undefined,
    };
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

// Helper for rendering status chips consistently
export const renderStatusChip = (value, colorMap) => {
    if (!value) return null;
    return (
        <Chip
            label={value}
            size="small"
            color={colorMap[value] || 'default'}
            sx={{ fontWeight: 500 }}
        />
    );
};

// Helper for rendering the view button consistently
export const renderViewButton = (href, onClickHandler) => (
    <Tooltip title="View Details">
        {/* Use span to avoid Tooltip warning if IconButton is disabled */}
        <span>
            <IconButton
                href={href}
                onClick={onClickHandler}
                size="small"
                color="primary"
                disabled={!href} // Disable if no link
            >
                <RemoveRedEye fontSize="small" />
            </IconButton>
        </span>
    </Tooltip>
);
