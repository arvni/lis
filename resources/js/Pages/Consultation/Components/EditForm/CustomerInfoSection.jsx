import { Box, CircularProgress, Grid, TextField, Tooltip, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BadgeIcon from '@mui/icons-material/Badge';

const CustomerInfoSection = ({
    data,
    errors,
    options,
    loading,
    open,
    setOpen,
    onCustomerSelect,
    onInputChange,
    onCustomerChange,
}) => (
    <Box>
        <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
            Customer Information
        </Typography>

        <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Autocomplete
                        id="customer-autocomplete"
                        open={open}
                        onOpen={() => setOpen(true)}
                        onClose={() => setOpen(false)}
                        value={data.customer?.id ? data.customer : null}
                        onChange={onCustomerSelect}
                        onInputChange={onInputChange}
                        isOptionEqualToValue={(option, value) => option?.id === value?.id}
                        getOptionLabel={(option) => option?.phone || ''}
                        options={options}
                        loading={loading}
                        fullWidth
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                name="phone"
                                label="Phone Number"
                                placeholder="Search or enter phone"
                                error={Boolean(errors['customer.phone'])}
                                helperText={errors?.['customer.phone']}
                                slotProps={{
                                    ...params.slotProps,
                                    htmlInput:
                                        params.slotProps?.htmlInput ?? params.inputProps,
                                    input: {
                                        ...(params.slotProps?.input ?? params.InputProps),
                                        startAdornment: (
                                            <>
                                                <MedicalServicesIcon
                                                    color="action"
                                                    sx={{ mr: 1 }}
                                                />
                                                {
                                                    (
                                                        params.slotProps?.input ??
                                                        params.InputProps
                                                    )?.startAdornment
                                                }
                                            </>
                                        ),
                                        endAdornment: (
                                            <>
                                                {loading && <CircularProgress size={16} />}
                                                {
                                                    (
                                                        params.slotProps?.input ??
                                                        params.InputProps
                                                    )?.endAdornment
                                                }
                                            </>
                                        ),
                                    },
                                }}
                            />
                        )}
                    />
                    <Tooltip title="Search for an existing customer or enter a new phone">
                        <HelpOutlineIcon
                            fontSize="small"
                            color="action"
                            sx={{ ml: 1, mt: 2 }}
                        />
                    </Tooltip>
                </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <TextField
                        name="name"
                        label="Name"
                        value={data?.customer?.name || ''}
                        onChange={(e) => onCustomerChange('name', e.target.value)}
                        fullWidth
                        required
                        placeholder="e.g. Ali"
                        error={Boolean(errors['customer.name'])}
                        helperText={errors?.['customer.name']}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <LocalHospitalIcon color="action" sx={{ mr: 1 }} />
                                ),
                            },
                        }}
                    />
                    <Tooltip title="Customer Full Name">
                        <HelpOutlineIcon
                            fontSize="small"
                            color="action"
                            sx={{ ml: 1, mt: 2 }}
                        />
                    </Tooltip>
                </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <TextField
                        name="email"
                        label="Email"
                        value={data.customer?.email || ''}
                        onChange={(e) => onCustomerChange('email', e.target.value)}
                        fullWidth
                        placeholder="example@example.com"
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <BadgeIcon color="action" sx={{ mr: 1 }} />
                                ),
                            },
                        }}
                    />
                    <Tooltip title="Customer Email">
                        <HelpOutlineIcon
                            fontSize="small"
                            color="action"
                            sx={{ ml: 1, mt: 2 }}
                        />
                    </Tooltip>
                </Box>
            </Grid>
        </Grid>
    </Box>
);

export default CustomerInfoSection;
