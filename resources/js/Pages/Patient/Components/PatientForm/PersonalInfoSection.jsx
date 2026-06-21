import {
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import {
    Man2,
    Woman2,
    Transgender,
    Block,
    CalendarMonth,
    Phone,
    Badge,
    Person,
    Wc,
    AccessibilityNew,
    Cake,
} from '@mui/icons-material';

const PersonalInfoSection = ({
    data,
    errors,
    editable,
    hasError,
    isOmani,
    age,
    onChange,
    onDOBChange,
    onAgeChange,
    onGenderChange,
}) => (
    <Grid container spacing={3}>
        {/* ID/Passport Number Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('idNo')}>
                <TextField
                    id="idNo"
                    error={hasError('idNo')}
                    helperText={errors?.idNo}
                    value={data?.idNo || ''}
                    disabled={!editable}
                    fullWidth
                    name="idNo"
                    onChange={onChange}
                    required
                    placeholder="Enter ID or passport number"
                    variant="outlined"
                    label="ID/Passport Number"
                    slotProps={{
                        input: {
                            startAdornment: <Badge color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* First Name Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('firstName')}>
                <TextField
                    id="firstName"
                    error={hasError('firstName')}
                    helperText={errors?.firstName}
                    value={data?.firstName || ''}
                    disabled={!editable}
                    fullWidth
                    name="firstName"
                    onChange={onChange}
                    required
                    placeholder="Enter first name"
                    variant="outlined"
                    label="First Name"
                    slotProps={{
                        input: {
                            startAdornment: <Person color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* Second Name Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('secondName')}>
                <TextField
                    id="secondName"
                    error={hasError('secondName')}
                    helperText={errors?.secondName}
                    value={data?.secondName || ''}
                    disabled={!editable}
                    fullWidth
                    name="secondName"
                    onChange={onChange}
                    required={isOmani}
                    placeholder="Enter second name"
                    variant="outlined"
                    label={isOmani ? 'Second Name' : 'Second Name (optional)'}
                    slotProps={{
                        input: {
                            startAdornment: <Person color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* Third Name Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('thirdName')}>
                <TextField
                    id="thirdName"
                    error={hasError('thirdName')}
                    helperText={errors?.thirdName}
                    value={data?.thirdName || ''}
                    disabled={!editable}
                    fullWidth
                    name="thirdName"
                    onChange={onChange}
                    required={isOmani}
                    placeholder="Enter third name"
                    variant="outlined"
                    label={isOmani ? 'Third Name' : 'Third Name (optional)'}
                    slotProps={{
                        input: {
                            startAdornment: <Person color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* Last Name Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('lastName')}>
                <TextField
                    id="lastName"
                    error={hasError('lastName')}
                    helperText={errors?.lastName}
                    value={data?.lastName || ''}
                    disabled={!editable}
                    fullWidth
                    name="lastName"
                    onChange={onChange}
                    required
                    placeholder="Enter last name"
                    variant="outlined"
                    label="Last Name"
                    slotProps={{
                        input: {
                            startAdornment: <Person color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* Tribe Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('tribe')}>
                <TextField
                    id="tribe"
                    error={hasError('tribe')}
                    helperText={errors?.tribe}
                    value={data?.tribe || ''}
                    disabled={!editable}
                    fullWidth
                    name="tribe"
                    onChange={onChange}
                    placeholder="Enter tribe"
                    variant="outlined"
                    label="Tribe"
                    slotProps={{
                        input: {
                            startAdornment: <AccessibilityNew color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* Gender Field */}
        <Grid size={{ xs: 12, sm: 7 }}>
            <FormControlLabel
                labelPlacement="start"
                label={
                    <Stack direction="row" sx={{ alignItems: 'center' }}>
                        <Wc color="primary" sx={{ mr: 1 }} />
                        <span style={{ minWidth: 70 }}>Gender *</span>
                    </Stack>
                }
                control={
                    <ToggleButtonGroup
                        exclusive
                        disabled={!editable}
                        onChange={onGenderChange}
                        value={data?.gender || ''}
                        aria-label="Gender"
                        fullWidth
                        color="primary"
                        sx={{
                            '& .MuiToggleButton-root': {
                                py: 1,
                                borderRadius: '4px',
                                '&.Mui-selected': {
                                    bgcolor: 'primary.light',
                                    color: 'primary.dark',
                                    fontWeight: 'bold',
                                    '&:hover': {
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                    },
                                },
                            },
                        }}
                    >
                        <ToggleButton value="female" aria-label="Female">
                            <Woman2 sx={{ mr: 1 }} /> Female
                        </ToggleButton>
                        <ToggleButton value="male" aria-label="Male">
                            <Man2 sx={{ mr: 1 }} /> Male
                        </ToggleButton>
                        <ToggleButton value="ambiguous" aria-label="Ambiguous">
                            <Transgender sx={{ mr: 1 }} /> Ambiguous
                        </ToggleButton>
                        <ToggleButton value="none" aria-label="None">
                            <Block sx={{ mr: 1 }} /> None
                        </ToggleButton>
                    </ToggleButtonGroup>
                }
            >
                {hasError('gender') && <FormHelperText error>{errors?.gender}</FormHelperText>}
            </FormControlLabel>
        </Grid>

        {/* Date of Birth Field */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
                id="dateOfBirth"
                type="date"
                value={data?.dateOfBirth || ''}
                required
                disabled={!editable}
                fullWidth
                variant="outlined"
                error={hasError('dateOfBirth')}
                helperText={errors?.dateOfBirth}
                name="dateOfBirth"
                onChange={onDOBChange}
                label="Date of Birth"
                sx={{ textAlign: 'right' }}
                slotProps={{
                    input: {
                        startAdornment: <CalendarMonth color="primary" sx={{ mr: 1 }} />,
                        slotProps: {},
                    },
                    inputLabel: { shrink: true },
                    htmlInput: { style: { textAlign: 'right' } },
                }}
            />
        </Grid>

        {/* Age Field */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth variant="outlined" error={hasError('age')}>
                <TextField
                    id="age"
                    type="number"
                    value={age}
                    disabled={!editable}
                    fullWidth
                    name="age"
                    onChange={onAgeChange}
                    placeholder="Enter age"
                    variant="outlined"
                    label="Age"
                    slotProps={{
                        htmlInput: { min: 0, max: 120 },
                        input: {
                            startAdornment: <Cake color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>

        {/* Phone Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('phone')}>
                <TextField
                    id="phone"
                    value={data?.phone || ''}
                    required
                    disabled={!editable}
                    variant="outlined"
                    error={hasError('phone')}
                    helperText={errors?.phone}
                    name="phone"
                    onChange={onChange}
                    placeholder="Enter phone number"
                    label="Phone Number"
                    slotProps={{
                        input: {
                            startAdornment: <Phone color="primary" sx={{ mr: 1 }} />,
                        },
                    }}
                />
            </FormControl>
        </Grid>
    </Grid>
);

export default PersonalInfoSection;
