import { Box, Typography, CircularProgress } from '@mui/material';

// Loading component to show while lazy components are loading
const LoadingComponent = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
        }}
    >
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
            Loading viewer...
        </Typography>
    </Box>
);

export default LoadingComponent;
