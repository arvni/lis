import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import countries from "@/Data/Countries";
import {
    Autocomplete,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    InputLabel,
    Paper,
    Select,
    Switch,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Card,
    CardContent,
    Button,
    Chip,
    Collapse,
    Alert, Stack
} from "@mui/material";
import {
    Man2,
    QuestionMark,
    Woman2,
    CalendarMonth,
    Phone,
    Badge,
    Person,
    Flag,
    Info,
    Wc,
    Home,
    LocationCity,
    AccessibilityNew,
    ArrowDropDown,
    ArrowDropUp,
    Cake
} from "@mui/icons-material";
import AvatarUpload from "@/Components/AvatarUpload";
import MenuItem from "@mui/material/MenuItem";
import React, {useState} from "react";
import Typography from "@mui/material/Typography";
import {omanWilayats} from "@/Data/omanWilayats.js";

const PatientForm = ({onChange, data, errors, editable = true, withRelative = false}) => {
    const [unknownAvatar, setUnknownAvatar] = useState(null);
    const [expandedSection, setExpandedSection] = useState('personal');
    const [age, setAge] = useState(calculateAge(data?.dateOfBirth));

    // Calculate age from date of birth
    function calculateAge(dob) {
        if (!dob) return '';

        const birthDate = new Date(dob);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age.toString();
    }

    // Calculate date of birth from age
    function calculateDOB(ageValue) {
        if (!ageValue || isNaN(parseInt(ageValue))) return '';

        const today = new Date();
        const birthYear = today.getFullYear() - parseInt(ageValue);

        // Set to current month and day
        const dob = new Date(birthYear, today.getMonth(), today.getDate());

        // Format date as YYYY-MM-DD for input field
        return dob.toISOString().split('T')[0];
    }

    // Handle date of birth change
    const handleDOBChange = (e) => {
        const newDOB = e.target.value;
        onChange(e);

        // Update age field
        if (newDOB) {
            setAge(calculateAge(newDOB));
        } else {
            setAge('');
        }
    };

    // Handle age change
    const handleAgeChange = (e) => {
        const newAge = e.target.value;
        setAge(newAge);

        // Update date of birth field
        if (newAge && !isNaN(parseInt(newAge))) {
            const newDOB = calculateDOB(newAge);
            onChange({
                target: {
                    name: "dateOfBirth",
                    value: newDOB
                }
            });
        }
    };

    const handleUnknownAvatarChange = (e, v) => {
        setUnknownAvatar(v);
        onChange({target: {name: "avatar", value: e.target.src}});
    };

    const switchChange = (e, v) => onChange({target: {name: e.target.name, value: !v}});
    const nationalityChanged = (e, v) => onChange({...e, target: {...e.target, name: "nationality", value: v}});
    const handleGenderChange = (e, v) => onChange({...e, target: {...e.target, name: "gender", value: v + ""}});
    const handleAvatarChange = ({data}) => onChange({target: {name: "avatar", value: data}});

    // Helper function to check if a field has an error
    const hasError = (fieldName) => !!errors && errors.hasOwnProperty(fieldName);

    // Toggle section expansion
    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const relationOptions = [
        {value: "-", label: "-"},
        ...(data.gender === "male" ?
                [
                    {value: "father", label: "Father"},
                    {value: "grandfather", label: "Grandfather"},
                    {value: "uncle", label: "Uncle"},
                    {value: "brother", label: "Brother"},
                    {value: "husband", label: "Husband"},
                ]
                :
                [
                    {value: "mother", label: "Mother"},
                    {value: "sister", label: "Sister"},
                    {value: "wife", label: "Wife"},
                    {value: "grandmother", label: "Grandmother"},
                    {value: "aunt", label: "Aunt"},
                ]
        ),
        {value: "child", label: "Child"},
        {value: "first cousin", label: "First Cousin"},
        {value: "second cousin", label: "Second Cousin"},
    ]

    return (
        <Card elevation={3} sx={{borderRadius: 2, overflow: 'visible'}}>
            <CardContent sx={{p: 3}}>
                {/* Header with Avatar */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4,
                    position: 'relative'
                }}>
                    <Typography variant="h5" component="h1" gutterBottom color="primary"
                                sx={{fontWeight: 'bold', mb: 3}}>
                        Patient Registration
                    </Typography>

                    <AvatarUpload
                        value={data.avatar}
                        name="avatar"
                        tag="AVATAR"
                        label="Choose Avatar"
                        onChange={handleAvatarChange}
                        error={hasError("avatar")}
                        helperText={errors?.avatar}
                        uploadUrl={route("documents.store")}
                        disabled={!editable}
                        sx={{
                            width: 150,
                            height: 150,
                            '& .MuiAvatar-root': {
                                width: 150,
                                height: 150,
                                fontSize: '3.5rem',
                                border: '4px solid #f5f5f5',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                            }
                        }}
                    />

                    {editable && (
                        <Box sx={{width: '100%', maxWidth: 500, mt: 3}}>
                            <FormGroup sx={{mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            color="primary"
                                            checked={!data.idCardInstAvailable}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{fontWeight: 'medium'}}>
                                            ID Card Not Available
                                        </Typography>
                                    }
                                    name="idCardInstAvailable"
                                    onChange={switchChange}
                                />
                            </FormGroup>

                            <Collapse in={data.idCardInstAvailable}>
                                <Card variant="outlined" sx={{
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Typography variant="subtitle1" gutterBottom color="primary"
                                                sx={{fontWeight: 'medium', textAlign: 'center'}}>
                                        Select Avatar Type
                                    </Typography>
                                    <ToggleButtonGroup
                                        exclusive
                                        onChange={handleUnknownAvatarChange}
                                        value={unknownAvatar}
                                        aria-label="avatar selection"
                                        sx={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            '& .MuiToggleButton-root': {
                                                borderRadius: 2,
                                                m: 0.5,
                                                transition: 'transform 0.2s ease',
                                                '&:hover': {
                                                    transform: 'scale(1.05)'
                                                }
                                            },
                                            '& .Mui-selected': {
                                                border: '2px solid',
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                    >
                                        <Tooltip title="Female">
                                            <ToggleButton value="female" sx={{p: 1}}>
                                                <img
                                                    src="/images/female.png"
                                                    height={70}
                                                    width={70}
                                                    alt="Female avatar"
                                                />
                                            </ToggleButton>
                                        </Tooltip>
                                        <Tooltip title="Male">
                                            <ToggleButton value="male" sx={{p: 1}}>
                                                <img
                                                    src="/images/male.png"
                                                    height={70}
                                                    width={70}
                                                    alt="Male avatar"
                                                />
                                            </ToggleButton>
                                        </Tooltip>
                                        <Tooltip title="Child">
                                            <ToggleButton value="baby" sx={{p: 1}}>
                                                <img
                                                    src="/images/baby.png"
                                                    height={70}
                                                    width={70}
                                                    alt="Baby avatar"
                                                />
                                            </ToggleButton>
                                        </Tooltip>
                                    </ToggleButtonGroup>
                                </Card>
                            </Collapse>
                        </Box>
                    )}
                </Box>

                {/* Foldable Sections */}
                {/* Personal Information Section */}
                <Paper
                    elevation={1}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Button
                        fullWidth
                        onClick={() => toggleSection('personal')}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            py: 1.5,
                            px: 2,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                                bgcolor: 'primary.main',
                            },
                        }}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            <Person sx={{mr: 1}}/>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Personal Information
                            </Typography>
                        </Box>
                        {expandedSection === 'personal' ? <ArrowDropUp/> : <ArrowDropDown/>}
                    </Button>

                    <Collapse in={expandedSection === 'personal'}>
                        <Box sx={{p: 3}}>
                            <Grid container spacing={3}>
                                {/* ID/Passport Number Field */}
                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <FormControl fullWidth variant="outlined" error={hasError("idNo")}>
                                        <TextField
                                            id="idNo"
                                            error={hasError("idNo")}
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
                                                input: {startAdornment: <Badge color="primary" sx={{mr: 1}}/>}
                                            }}
                                        />
                                    </FormControl>
                                </Grid>

                                {/* Full Name Field */}
                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <FormControl fullWidth variant="outlined" error={hasError("fullName")}>
                                        <TextField
                                            id="fullName"
                                            error={hasError("fullName")}
                                            helperText={errors?.fullName}
                                            value={data?.fullName || ''}
                                            disabled={!editable}
                                            fullWidth
                                            name="fullName"
                                            onChange={onChange}
                                            required
                                            placeholder="Enter full name"
                                            variant="outlined"
                                            label="Full Name"
                                            slotProps={{
                                                input: {startAdornment: <Person color="primary" sx={{mr: 1}}/>}
                                            }}
                                        />
                                    </FormControl>
                                </Grid>

                                {/* Tribe Field */}
                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <FormControl fullWidth variant="outlined" error={hasError("tribe")}>
                                        <TextField
                                            id="tribe"
                                            error={hasError("tribe")}
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
                                                    startAdornment: <AccessibilityNew color="primary" sx={{mr: 1}}/>
                                                }
                                            }}
                                        />
                                    </FormControl>
                                </Grid>

                                {/* Gender Field */}
                                <Grid size={{xs: 12, sm: 7}}>
                                    <FormControlLabel labelPlacement="start"
                                                      label={<Stack direction="row" alignItems="center">
                                                          <Wc color="primary" sx={{mr: 1}}/>
                                                          <span style={{minWidth: 70}}>Gender *</span>
                                                      </Stack>}
                                                      control={
                                                          <ToggleButtonGroup
                                                              exclusive
                                                              disabled={!editable}
                                                              onChange={handleGenderChange}
                                                              value={data?.gender || ""}
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
                                                                              color: 'white'
                                                                          }
                                                                      }
                                                                  }
                                                              }}
                                                          >
                                                              <ToggleButton value="female" aria-label="Female">
                                                                  <Woman2 sx={{mr: 1}}/> Female
                                                              </ToggleButton>
                                                              <ToggleButton value="male" aria-label="Male">
                                                                  <Man2 sx={{mr: 1}}/> Male
                                                              </ToggleButton>
                                                              <ToggleButton value="unknown" aria-label="Other">
                                                                  <QuestionMark sx={{mr: 1}}/> Other
                                                              </ToggleButton>
                                                          </ToggleButtonGroup>
                                                      }
                                                      fullWidth variant="outlined" error={hasError("gender")}>
                                        {hasError("gender") && (
                                            <FormHelperText error>{errors?.gender}</FormHelperText>
                                        )}
                                    </FormControlLabel>
                                </Grid>

                                {/* Date of Birth Field */}
                                <Grid size={{xs: 12, sm: 6, md: 3}}>
                                    <TextField
                                        id="dateOfBirth"
                                        type="date"
                                        value={data?.dateOfBirth || ''}
                                        required
                                        disabled={!editable}
                                        fullWidth
                                        variant="outlined"
                                        error={hasError("dateOfBirth")}
                                        helperText={errors?.dateOfBirth}
                                        name="dateOfBirth"
                                        onChange={handleDOBChange}
                                        label="Date of Birth"
                                        sx={{textAlign: "right"}}
                                        slotProps={{
                                            input: {
                                                startAdornment: <CalendarMonth color="primary" sx={{mr: 1}}/>,
                                                slotProps: {}
                                            },
                                            inputLabel: {shrink: true},
                                            htmlInput: {style: {textAlign: "right"}}
                                        }}
                                    />
                                </Grid>

                                {/* Age Field - NEW */}
                                <Grid size={{xs: 12, sm: 6, md: 2}}>
                                    <FormControl fullWidth variant="outlined" error={hasError("age")}>
                                        <TextField
                                            id="age"
                                            type="number"
                                            value={age}
                                            disabled={!editable}
                                            fullWidth
                                            name="age"
                                            onChange={handleAgeChange}
                                            placeholder="Enter age"
                                            variant="outlined"
                                            label="Age"
                                            slotProps={{
                                                htmlInput: {min: 0, max: 120}
                                                ,
                                                input: {startAdornment: <Cake color="primary" sx={{mr: 1}}/>}
                                            }}
                                        />
                                    </FormControl>
                                </Grid>

                                {/* Phone Field */}
                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <FormControl fullWidth variant="outlined" error={hasError("phone")}>
                                        <TextField
                                            id="phone"
                                            value={data?.phone || ''}
                                            required
                                            disabled={!editable}
                                            variant="outlined"
                                            error={hasError("phone")}
                                            helperText={errors?.phone}
                                            name="phone"
                                            onChange={onChange}
                                            placeholder="Enter phone number"
                                            label="Phone Number"
                                            slotProps={{
                                                input: {startAdornment: <Phone color="primary" sx={{mr: 1}}/>}
                                            }}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Nationality & Location Section */}
                <Paper
                    elevation={1}
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Button
                        fullWidth
                        onClick={() => toggleSection('location')}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            textAlign: 'left',
                            py: 1.5,
                            px: 2,
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                                bgcolor: 'primary.main',
                            },
                        }}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            <Flag sx={{mr: 1}}/>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Nationality & Location
                            </Typography>
                        </Box>
                        {expandedSection === 'location' ? <ArrowDropUp/> : <ArrowDropDown/>}
                    </Button>

                    <Collapse in={expandedSection === 'location'}>
                        <Box sx={{p: 3}}>
                            <Grid container spacing={3}>
                                {/* Nationality Field */}
                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <FormControl fullWidth variant="outlined" error={hasError("nationality")}>
                                        <Autocomplete
                                            id="nationality"
                                            fullWidth
                                            options={countries}
                                            value={data?.nationality || null}
                                            onChange={nationalityChanged}
                                            autoHighlight
                                            disabled={!editable}
                                            getOptionLabel={(option) => option.label}
                                            renderOption={(props, option) => (
                                                <Box component="li" sx={{'& > img': {mr: 2, flexShrink: 0}}} {...props}>
                                                    <img
                                                        loading="lazy"
                                                        width="20"
                                                        src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                                                        srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                                                        alt=""
                                                    />
                                                    {option.label} ({option.code})
                                                </Box>
                                            )}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    required
                                                    error={hasError("nationality")}
                                                    helperText={errors?.nationality}
                                                    variant="outlined"
                                                    placeholder="Select nationality"
                                                />
                                            )}
                                        />
                                    </FormControl>
                                </Grid>

                                {data?.nationality?.code === "OM" && (
                                    <>
                                        <Grid size={12}>
                                            <Alert
                                                severity="info"
                                                variant="outlined"
                                                sx={{mb: 2}}
                                            >
                                                Additional information required for Omani nationals
                                            </Alert>
                                        </Grid>
                                        {/* Oman-specific fields */}
                                        <Grid size={{xs: 12, sm: 6, md: 4}}>
                                            <FormControl fullWidth sx={{mb: 2}} error={hasError("wilayat")}>
                                                <Autocomplete
                                                    id="wilayat"
                                                    lablel="Wilayat"
                                                    fullWidth
                                                    options={Object.entries(omanWilayats).flatMap(([governorate, cities]) =>
                                                        cities.map(city => ({city, governorate}))
                                                    )}
                                                    value={data?.wilayat ?
                                                        Object.entries(omanWilayats)
                                                            .flatMap(([governorate, cities]) =>
                                                                cities.includes(data.wilayat) ? {
                                                                    city: data.wilayat,
                                                                    governorate
                                                                } : null
                                                            )
                                                            .filter(Boolean)[0] || null
                                                        : null
                                                    }
                                                    onChange={(e, newValue) => {
                                                        onChange({
                                                            target: {
                                                                name: "wilayat",
                                                                value: newValue ? newValue.city : ""
                                                            }
                                                        });
                                                    }}
                                                    groupBy={(option) => option.governorate}
                                                    getOptionLabel={(option) => option.city || ''}
                                                    isOptionEqualToValue={(option, value) => option.city === value.city}
                                                    disabled={!editable}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            required
                                                            placeholder="Search wilayat..."
                                                            error={hasError("wilayat")}
                                                            helperText={errors?.wilayat}
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    renderOption={(props, option) => (
                                                        <li {...props}>
                                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                                <LocationCity fontSize="small" color="action"
                                                                              sx={{mr: 1}}/>
                                                                {option.city}
                                                            </Box>
                                                        </li>
                                                    )}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{xs: 12, sm: 6, md: 4}}>
                                            <FormControl fullWidth variant="outlined" error={hasError("village")}>
                                                <TextField
                                                    id="village"
                                                    error={hasError("village")}
                                                    helperText={errors?.village}
                                                    value={data?.village || ''}
                                                    disabled={!editable}
                                                    fullWidth
                                                    name="village"
                                                    onChange={onChange}
                                                    required
                                                    placeholder="Enter village name"
                                                    variant="outlined"
                                                    label="Village"
                                                    slotProps={{
                                                        input: {startAdornment: <Home color="primary" sx={{mr: 1}}/>}
                                                    }}
                                                />
                                            </FormControl>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Relationship Field (for relatives) */}
                {withRelative && (
                    <Paper
                        elevation={1}
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Button
                            fullWidth
                            onClick={() => toggleSection('relationship')}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                textAlign: 'left',
                                py: 1.5,
                                px: 2,
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                '&:hover': {
                                    bgcolor: 'primary.main',
                                },
                            }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Info sx={{mr: 1}}/>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Relationship Information
                                </Typography>
                            </Box>
                            {expandedSection === 'relationship' ? <ArrowDropUp/> : <ArrowDropDown/>}
                        </Button>

                        <Collapse in={expandedSection === 'relationship'}>
                            <Box sx={{p: 3}}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="relationship-select-label">Relationship *</InputLabel>
                                    <Select
                                        id="relationship"
                                        labelId="relationship-select-label"
                                        value={data.relationship ? (Array.isArray(data.relationship) ? data.relationship : data.relationship.split(",")) : []}
                                        label="Relationship *"
                                        onChange={onChange}
                                        name="relationship"
                                        disabled={!editable}
                                        variant="outlined"
                                        multiple
                                        startAdornment={<Info color="primary" sx={{mr: 1}}/>}
                                        MenuProps={{
                                            PaperProps: {
                                                style: {
                                                    maxHeight: 224,
                                                },
                                            },
                                        }}
                                    >
                                        {relationOptions.map(relation => <MenuItem value={relation.value}
                                                                                   role="option">{relation.label}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                        </Collapse>
                    </Paper>
                )}

                {/* Form Submission Hint */}
                <Box sx={{mt: 4, display: 'flex', justifyContent: 'center'}}>
                    <Chip
                        icon={<Info/>}
                        label="Fields marked with * are required"
                        variant="outlined"
                        color="primary"
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default PatientForm;
