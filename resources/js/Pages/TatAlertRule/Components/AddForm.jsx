import React, { useMemo } from 'react';
import {
    Alert,
    Box,
    Divider,
    FormControlLabel,
    InputAdornment,
    Paper,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Biotech, CheckCircle, Group, NotificationsActive } from '@mui/icons-material';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const sectionSx = { p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0' };

const SectionTitle = ({ icon, children }) => (
    <>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {icon}
            {children}
        </Typography>
        <Divider sx={{ mb: 3 }} />
    </>
);

const AddForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('tat-alert-rules.update', defaultValue.id)
        : route('tat-alert-rules.store');

    // FormProvider resets the form whenever this object changes. A fresh object on every
    // render would wipe what the user typed as soon as a validation error re-renders the page.
    const defaultData = useMemo(
        () => ({
            name: '',
            days_left: 1,
            active: true,
            tests: [],
            users: [],
            roles: [],
            ...defaultValue,
        }),
        [defaultValue],
    );

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            maxWidth="md"
            generalTitle="TAT Alert"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors } = useFormState();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prevState) => ({ ...prevState, [name]: type === 'checkbox' ? checked : value }));
    };

    const recipientsError = errors?.users || errors?.roles;

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Paper elevation={0} sx={sectionSx}>
                <SectionTitle icon={<NotificationsActive sx={{ mr: 1 }} />}>Rule</SectionTitle>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 7 }}>
                        <TextField
                            label="Name"
                            name="name"
                            fullWidth
                            required
                            error={!!errors?.name}
                            helperText={errors?.name || 'e.g. Culture results due soon'}
                            onChange={handleChange}
                            value={data.name ?? ''}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                        <TextField
                            label="Notify when TAT left is at most"
                            name="days_left"
                            type="number"
                            fullWidth
                            required
                            error={!!errors?.days_left}
                            helperText={
                                errors?.days_left ||
                                '0 = due today. Overdue items are always included.'
                            }
                            onChange={handleChange}
                            value={data.days_left ?? ''}
                            slotProps={{
                                htmlInput: { min: 0, max: 60 },
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">working days</InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!data?.active}
                                    onChange={handleChange}
                                    name="active"
                                    color="success"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CheckCircle
                                        fontSize="small"
                                        color={data?.active ? 'success' : 'disabled'}
                                        sx={{ mr: 1 }}
                                    />
                                    <Typography>
                                        {data?.active
                                            ? 'Alert active'
                                            : 'Alert paused — no reminders are sent'}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
                <SectionTitle icon={<Biotech sx={{ mr: 1 }} />}>Tests</SectionTitle>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Every day at 08:00, each unreported acceptance item of these tests with this
                    many working days of TAT left (or fewer) sends a reminder. It repeats daily
                    until the item is reported.
                </Alert>

                <SelectSearch
                    value={data.tests ?? []}
                    onChange={handleChange}
                    name="tests"
                    multiple
                    fullWidth
                    url={route('api.tests.list')}
                    label="Tests"
                    error={!!(errors?.tests || errors?.['tests.0.id'])}
                    helperText={errors?.tests || errors?.['tests.0.id'] || 'Search tests by name'}
                />
            </Paper>

            <Paper elevation={0} sx={{ ...sectionSx, mb: 0 }}>
                <SectionTitle icon={<Group sx={{ mr: 1 }} />}>Recipients</SectionTitle>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <SelectSearch
                            value={data.users ?? []}
                            onChange={handleChange}
                            name="users"
                            multiple
                            fullWidth
                            url={route('api.users.list')}
                            label="Users"
                            error={!!recipientsError}
                            helperText={recipientsError || 'Specific people to notify'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <SelectSearch
                            value={data.roles ?? []}
                            onChange={handleChange}
                            name="roles"
                            multiple
                            fullWidth
                            url={route('api.roles.list')}
                            label="Roles"
                            error={!!recipientsError}
                            helperText={recipientsError || 'Everyone with these roles is notified'}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default AddForm;
