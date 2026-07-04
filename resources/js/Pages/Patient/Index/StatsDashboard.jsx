import React, { useState } from 'react';
import {
    ExpandMore,
    KeyboardArrowRight,
    Male as MaleIcon,
    Female as FemaleIcon,
    QuestionMark as QuestionMarkIcon,
} from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Paper,
    Stack,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import countries from '@/Data/Countries.js';

const StatsCard = ({ title, children, elevation = 8 }) => (
    <Grid size={{ xs: 12, sm: 6, md: 4 }} p={1}>
        <Card elevation={elevation} sx={{ borderRadius: 2, height: '100%' }}>
            <CardHeader
                title={title}
                slotProps={{ titleTypography: { variant: 'h6' } }}
                sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText', py: 1 }}
            />
            <CardContent>{children}</CardContent>
        </Card>
    </Grid>
);

const NationalityList = ({ stats }) => {
    const [open, setOpen] = useState(false);
    const nationEntries = Object.entries(stats.patientsPerNation);
    const initialItems = nationEntries.slice(0, 5); // Show top 5 initially
    const remainingCount = nationEntries.length - initialItems.length;

    return (
        <>
            <List dense>
                {initialItems.map(([code, count], idx) => (
                    <React.Fragment key={code}>
                        <ListItem>
                            <ListItemAvatar>
                                <Box
                                    component="img"
                                    loading="lazy"
                                    width="32"
                                    src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                    alt={countries.find((c) => c.code === code)?.label || code}
                                    sx={{ border: '1px solid #eee', borderRadius: 1 }}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={countries.find((c) => c.code === code)?.label || code}
                                secondary={`${count} patients`}
                            />
                        </ListItem>
                        {idx < initialItems.length - 1 && (
                            <Divider variant="inset" component="li" />
                        )}
                    </React.Fragment>
                ))}
            </List>

            {remainingCount > 0 && (
                <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    endIcon={<KeyboardArrowRight />}
                    onClick={() => setOpen(true)}
                    sx={{ mt: 1 }}
                >
                    Show {remainingCount} more
                </Button>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    Patients by Nationality
                    <IconButton
                        aria-label="close"
                        onClick={() => setOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <List dense>
                        {nationEntries.map(([code, count], idx) => (
                            <React.Fragment key={code}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Box
                                            component="img"
                                            loading="lazy"
                                            width="32"
                                            src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                                            alt={
                                                countries.find((c) => c.code === code)?.label ||
                                                code
                                            }
                                            sx={{ border: '1px solid #eee', borderRadius: 1 }}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            countries.find((c) => c.code === code)?.label || code
                                        }
                                        secondary={`${count} patients`}
                                    />
                                </ListItem>
                                {idx < nationEntries.length - 1 && (
                                    <Divider variant="inset" component="li" />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>
        </>
    );
};

const getGenderInfo = (gender) => {
    switch (gender) {
        case 'male':
            return {
                icon: <MaleIcon sx={{ color: 'white' }} />,
                label: 'Male',
                color: 'primary',
            };
        case 'female':
            return {
                icon: <FemaleIcon sx={{ color: 'white' }} />,
                label: 'Female',
                color: 'secondary',
            };
        case 'ambiguous':
            return {
                icon: <QuestionMarkIcon />,
                label: 'Ambiguous',
                color: 'default',
            };
        case 'none':
            return {
                icon: <QuestionMarkIcon />,
                label: 'None',
                color: 'default',
            };
        default:
            return {
                icon: <QuestionMarkIcon />,
                label: 'Unspecified',
                color: 'default',
            };
    }
};

const GenderStats = ({ stats }) => {
    const genderColors = {
        male: 'primary.light',
        female: 'secondary.light',
        ambiguous: 'info.light',
        none: 'grey.300',
    };

    return (
        <Stack spacing={1}>
            {Object.entries(stats.patientsPerGender).map(([gender, count]) => (
                <Paper
                    key={gender}
                    sx={{
                        p: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        backgroundColor: genderColors[gender] || 'grey.200',
                    }}
                >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        {getGenderInfo(gender).icon}
                        <Typography variant="body2"> {getGenderInfo(gender).label}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight="bold">
                        {count}
                    </Typography>
                </Paper>
            ))}
        </Stack>
    );
};

const StatsDashboard = ({ stats, expanded, onToggle }) => (
    <Box mb={3}>
        <Accordion
            expanded={expanded}
            onChange={onToggle}
            elevation={6}
            sx={{
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">Statistics Dashboard</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={0}>
                    <StatsCard title="Total Patients">
                        <Box
                            display="flex"
                            sx={{ justifyContent: 'center', alignItems: 'center', p: 2 }}
                        >
                            <Typography variant="h3" color="primary.main">
                                {stats.patients}
                            </Typography>
                        </Box>
                    </StatsCard>

                    <StatsCard title="Patients by Nationality">
                        <NationalityList stats={stats} />
                    </StatsCard>

                    <StatsCard title="Patients by Gender">
                        <GenderStats stats={stats} />
                    </StatsCard>
                </Grid>
            </AccordionDetails>
        </Accordion>
    </Box>
);

export default StatsDashboard;
