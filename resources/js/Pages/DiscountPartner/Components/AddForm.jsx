import React from 'react';
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
import {
    Business,
    CheckCircle,
    Description,
    Email,
    Event,
    LocalOffer,
    Person,
    Phone,
} from '@mui/icons-material';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const AddForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('discount-partners.update', defaultValue.id)
        : route('discount-partners.store');

    const defaultData = {
        name: '',
        contract_no: '',
        contact: { person: '', phone: '', email: '', address: '' },
        starts_at: '',
        ends_at: '',
        active: true,
        notes: '',
        offers: [],
        ...defaultValue,
    };

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            maxWidth="md"
            generalTitle={defaultValue?.id ? 'Edit Discount Partner' : 'Discount Partner'}
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

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({
            ...prevState,
            contact: { ...(prevState.contact ?? {}), [name]: value },
        }));
    };

    const contact = data.contact ?? {};

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Paper
                elevation={0}
                sx={{ p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0' }}
            >
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                >
                    <Business sx={{ mr: 1 }} />
                    Contract
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Company Name"
                            name="name"
                            fullWidth
                            required
                            error={!!errors?.name}
                            helperText={errors?.name || 'The company the contract is with'}
                            onChange={handleChange}
                            value={data.name ?? ''}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Contract Number"
                            name="contract_no"
                            fullWidth
                            error={!!errors?.contract_no}
                            helperText={errors?.contract_no || 'Optional reference'}
                            onChange={handleChange}
                            value={data.contract_no ?? ''}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Starts At"
                            name="starts_at"
                            type="date"
                            fullWidth
                            error={!!errors?.starts_at}
                            helperText={errors?.starts_at}
                            onChange={handleChange}
                            value={data.starts_at ?? ''}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Ends At"
                            name="ends_at"
                            type="date"
                            fullWidth
                            error={!!errors?.ends_at}
                            helperText={errors?.ends_at}
                            onChange={handleChange}
                            value={data.ends_at ?? ''}
                            slotProps={{
                                inputLabel: { shrink: true },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event fontSize="small" />
                                        </InputAdornment>
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
                                            ? 'Contract active'
                                            : 'Contract inactive — cards will not discount'}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper
                elevation={0}
                sx={{ p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0' }}
            >
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                >
                    <LocalOffer sx={{ mr: 1 }} />
                    Discounts Granted
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Alert severity="info" sx={{ mb: 2 }}>
                    An offer decides which tests are discounted and by how much. Until one is
                    attached here, this partner&apos;s cards discount nothing. Only offers marked
                    contract-only can be granted &mdash; anything else is already applied to every
                    patient by reception.
                </Alert>

                <SelectSearch
                    value={data.offers ?? []}
                    onChange={handleChange}
                    name="offers"
                    multiple
                    fullWidth
                    url={route('api.contractOffers.list')}
                    label="Offers"
                    error={!!errors?.offers}
                    helperText={errors?.offers || 'Search contract offers by title'}
                />
            </Paper>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                >
                    <Person sx={{ mr: 1 }} />
                    Contact
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Contact Person"
                            name="person"
                            fullWidth
                            onChange={handleContactChange}
                            value={contact.person ?? ''}
                            error={!!errors?.['contact.person']}
                            helperText={errors?.['contact.person']}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Phone"
                            name="phone"
                            fullWidth
                            onChange={handleContactChange}
                            value={contact.phone ?? ''}
                            error={!!errors?.['contact.phone']}
                            helperText={errors?.['contact.phone']}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Email"
                            name="email"
                            fullWidth
                            onChange={handleContactChange}
                            value={contact.email ?? ''}
                            error={!!errors?.['contact.email']}
                            helperText={errors?.['contact.email']}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Address"
                            name="address"
                            fullWidth
                            onChange={handleContactChange}
                            value={contact.address ?? ''}
                            error={!!errors?.['contact.address']}
                            helperText={errors?.['contact.address']}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Notes"
                            name="notes"
                            fullWidth
                            multiline
                            rows={2}
                            onChange={handleChange}
                            value={data.notes ?? ''}
                            error={!!errors?.notes}
                            helperText={errors?.notes}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Description fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default AddForm;
