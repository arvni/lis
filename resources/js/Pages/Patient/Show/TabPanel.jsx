import { Box, Fade, CircularProgress } from '@mui/material';

// TabPanel component with minHeight via sx prop and optional loading state
export default function TabPanel(props) {
    const { children, value, index, loading, ...other } = props;
    const isActive = value === index;

    return (
        <div
            role="tabpanel"
            hidden={!isActive}
            id={`patient-tabpanel-${index}`}
            aria-labelledby={`patient-tab-${index}`}
            {...other}
            style={{ position: 'relative' }}
        >
            {loading && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 200,
                        py: 3,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
            <Fade in={isActive && !loading}>
                <Box sx={{ py: 3, minHeight: 200 }}>{isActive && !loading ? children : null}</Box>
            </Fade>
        </div>
    );
}
