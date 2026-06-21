import { Box } from '@mui/material';

// Custom Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`order-tabpanel-${index}`}
        aria-labelledby={`order-tab-${index}`}
        {...other}
    >
        {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
);

export default TabPanel;
