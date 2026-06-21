import { Box } from '@mui/material';

// Custom Tab Panel Component
export default function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`sample-tabpanel-${index}`}
            aria-labelledby={`sample-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}
