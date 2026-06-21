import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Styled Components ---
export const UploadBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isDragOver' && prop !== 'error',
})(({ theme, isDragOver, error }) => ({
    border: `2px dashed ${
        error
            ? theme.palette.error.main
            : isDragOver
              ? theme.palette.primary.main
              : theme.palette.divider
    }`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '120px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: isDragOver ? `${theme.palette.primary.light}20` : 'transparent',
    outline: 'none', // Remove default outline
    '&:hover': {
        backgroundColor: `${theme.palette.primary.light}10`,
        borderColor: theme.palette.primary.main,
    },
    '&:focus-visible': {
        // Style for keyboard focus
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
}));

export const FileTypeInfo = styled(Typography)(({ theme }) => ({
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
}));
