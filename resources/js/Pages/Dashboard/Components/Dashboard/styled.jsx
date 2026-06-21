import { Box, Card, Typography, alpha, styled } from '@mui/material';

// Styled components for enhanced UI
export const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isAlert' && prop !== 'priority',
})(({ theme, priority, isAlert }) => ({
    height: '100%',
    transition: 'all 0.3s ease-in-out',
    borderRadius: theme.spacing(2),
    position: 'relative',
    overflow: 'visible',
    borderLeft: `4px solid ${
        isAlert
            ? theme.palette.warning.main
            : priority === 'high'
              ? theme.palette.primary.main
              : theme.palette.grey[300]
    }`,
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    },
    ...(priority === 'high' && {
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    }),
}));

export const MetricValue = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isAlert',
})(({ theme, isAlert }) => ({
    fontWeight: 'bold',
    fontSize: '2rem',
    background: isAlert
        ? `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`
        : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    transition: 'all 0.3s ease',
}));

export const IconContainer = styled(Box)(({ theme, color = 'primary' }) => ({
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(theme.palette[color].main, 0.1),
    color: theme.palette[color].main,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
        backgroundColor: alpha(theme.palette[color].main, 0.2),
    },
}));
