import { Alert, Autocomplete, Box, FormControl, Grid, TextField } from '@mui/material';
import { Flag, Home, LocationCity } from '@mui/icons-material';
import countries from '@/Data/Countries';

const LocationSection = ({
    data,
    errors,
    editable,
    hasError,
    governorateOptions,
    selectedGovernorate,
    wilayatOptions,
    onChange,
    onNationalityChange,
    onGovernorateChange,
    onWilayatChange,
}) => (
    <Grid container spacing={3}>
        {/* Nationality Field */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth variant="outlined" error={hasError('nationality')}>
                <Autocomplete
                    id="nationality"
                    fullWidth
                    options={countries}
                    value={data?.nationality || null}
                    onChange={onNationalityChange}
                    autoHighlight
                    disabled={!editable}
                    getOptionLabel={(option) => option.label}
                    renderOption={({ key, ...props }, option) => (
                        <Box
                            key={key}
                            component="li"
                            sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                            {...props}
                        >
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
                            error={hasError('nationality')}
                            helperText={errors?.nationality}
                            variant="outlined"
                            placeholder="Select nationality"
                        />
                    )}
                />
            </FormControl>
        </Grid>

        {data?.nationality?.code === 'OM' && (
            <>
                <Grid size={12}>
                    <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
                        Additional information required for Omani nationals
                    </Alert>
                </Grid>
                {/* Oman-specific fields */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl fullWidth sx={{ mb: 2 }} error={hasError('governorate')}>
                        <Autocomplete
                            id="governorate"
                            fullWidth
                            options={governorateOptions}
                            value={selectedGovernorate || null}
                            onChange={onGovernorateChange}
                            getOptionLabel={(option) => option || ''}
                            isOptionEqualToValue={(option, value) => option === value}
                            disabled={!editable}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label="Governorate"
                                    placeholder="Select governorate"
                                    error={hasError('governorate')}
                                    helperText={errors?.governorate}
                                    variant="outlined"
                                />
                            )}
                            renderOption={({ key, ...props }, option) => (
                                <li key={key} {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Flag fontSize="small" color="action" sx={{ mr: 1 }} />
                                        {option}
                                    </Box>
                                </li>
                            )}
                        />
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl fullWidth sx={{ mb: 2 }} error={hasError('wilayat')}>
                        <Autocomplete
                            id="wilayat"
                            fullWidth
                            options={wilayatOptions}
                            value={data?.wilayat || null}
                            onChange={onWilayatChange}
                            getOptionLabel={(option) => option || ''}
                            isOptionEqualToValue={(option, value) => option === value}
                            disabled={!editable || !selectedGovernorate}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    required
                                    label="Wilayat"
                                    placeholder={
                                        selectedGovernorate
                                            ? 'Search wilayat...'
                                            : 'Select governorate first'
                                    }
                                    error={hasError('wilayat')}
                                    helperText={errors?.wilayat}
                                    variant="outlined"
                                />
                            )}
                            renderOption={({ key, ...props }, option) => (
                                <li key={key} {...props}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocationCity
                                            fontSize="small"
                                            color="action"
                                            sx={{ mr: 1 }}
                                        />
                                        {option}
                                    </Box>
                                </li>
                            )}
                        />
                    </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl fullWidth variant="outlined" error={hasError('village')}>
                        <TextField
                            id="village"
                            error={hasError('village')}
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
                                input: {
                                    startAdornment: <Home color="primary" sx={{ mr: 1 }} />,
                                },
                            }}
                        />
                    </FormControl>
                </Grid>
            </>
        )}
    </Grid>
);

export default LocationSection;
