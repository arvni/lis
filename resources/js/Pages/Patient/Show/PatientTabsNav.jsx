import { Box, Tab, Tabs, Badge, useTheme, alpha } from '@mui/material';

const PatientTabsNav = ({ tabs, tabValue, onChange, loadingTabs }) => {
    const theme = useTheme();

    return (
        <Tabs
            value={tabValue}
            onChange={onChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Patient details tabs"
            sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.primary.main, 0.02), // Subtle background
                '& .MuiTab-root': {
                    minHeight: 56, // Slightly smaller height
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    px: 2, // Adjust padding
                },
                '& .Mui-selected': {
                    color: 'primary.main',
                    fontWeight: 600,
                },
                '& .MuiTabs-indicator': {
                    height: 3,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                },
            }}
        >
            {tabs.map((tab, index) => (
                <Tab
                    key={index}
                    label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {tab.icon}
                            <Badge
                                badgeContent={tab.count ?? 0} // Use count from memoized tabs state
                                color={tabValue === index ? 'primary' : 'default'}
                                invisible={tab.count === null || tab.count === 0} // Hide if null or 0
                                max={99}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.65rem',
                                        height: 18,
                                        minWidth: 18,
                                        right: -8, // Adjust position
                                        top: -2,
                                    },
                                    // Apply badge directly to the label text container
                                    '& .MuiBox-root': { pr: tab.count ? 2 : 0 }, // Add padding only if badge is potentially visible
                                }}
                            >
                                {tab.label}
                            </Badge>
                        </Box>
                    }
                    id={`patient-tab-${index}`}
                    aria-controls={`patient-tabpanel-${index}`}
                    disabled={loadingTabs[tab.dataKey]} // Disable tab while its data is loading
                />
            ))}
        </Tabs>
    );
};

export default PatientTabsNav;
