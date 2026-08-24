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
import { CardMembership, Event, Numbers, Repeat } from '@mui/icons-material';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

const IssueBatchForm = ({ open, onClose }) => (
    <FormProvider
        onClose={onClose}
        open={open}
        url={route('discountCards.issue')}
        maxWidth="sm"
        generalTitle="Card Batch"
        defaultValue={{
            partner: null,
            discount_partner_id: '',
            quantity: 50,
            prefix: '',
            expires_at: '',
            usage_limit: '',
            notes: '',
            activate_immediately: false,
        }}
    >
        <FormContent />
    </FormProvider>
);

const FormContent = () => {
    const { data, setData, errors } = useFormState();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData((prevState) => ({ ...prevState, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePartnerChange = (e) => {
        const partner = e.target.value;
        setData((prevState) => ({
            ...prevState,
            partner,
            discount_partner_id: partner?.id ?? '',
        }));
    };

    return (
        <Box sx={{ p: 1, width: '100%' }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                >
                    <CardMembership sx={{ mr: 1 }} />
                    Issue Cards
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                    Cards are bearer cards — anyone presenting one gets the discount. An expiry date
                    and a usage limit are the only brakes available later, so set them now unless
                    the contract says otherwise.
                </Alert>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <SelectSearch
                            value={data.partner}
                            onChange={handlePartnerChange}
                            name="partner"
                            required
                            fullWidth
                            url={route('api.discountPartners.list')}
                            label="Partner"
                            error={!!errors?.discount_partner_id}
                            helperText={
                                errors?.discount_partner_id ||
                                'Whose contract these cards belong to'
                            }
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Quantity"
                            name="quantity"
                            type="number"
                            fullWidth
                            required
                            value={data.quantity ?? ''}
                            onChange={handleChange}
                            error={!!errors?.quantity}
                            helperText={errors?.quantity || 'How many cards to mint'}
                            slotProps={{
                                htmlInput: { min: 1, max: 5000 },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Numbers fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Series Prefix"
                            name="prefix"
                            fullWidth
                            value={data.prefix ?? ''}
                            onChange={handleChange}
                            error={!!errors?.prefix}
                            helperText={errors?.prefix || 'Printed on the card, e.g. ACME'}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Expires At"
                            name="expires_at"
                            type="date"
                            fullWidth
                            value={data.expires_at ?? ''}
                            onChange={handleChange}
                            error={!!errors?.expires_at}
                            helperText={errors?.expires_at || 'Blank means never'}
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
                            label="Usage Limit"
                            name="usage_limit"
                            type="number"
                            fullWidth
                            value={data.usage_limit ?? ''}
                            onChange={handleChange}
                            error={!!errors?.usage_limit}
                            helperText={errors?.usage_limit || 'Blank means unlimited'}
                            slotProps={{
                                htmlInput: { min: 1 },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Repeat fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Notes"
                            name="notes"
                            fullWidth
                            multiline
                            rows={2}
                            value={data.notes ?? ''}
                            onChange={handleChange}
                            error={!!errors?.notes}
                            helperText={errors?.notes}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!data.activate_immediately}
                                    onChange={handleChange}
                                    name="activate_immediately"
                                    color="success"
                                />
                            }
                            label={
                                data.activate_immediately
                                    ? 'Cards are live the moment they are printed'
                                    : 'Cards start inactive and are activated on handover'
                            }
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default IssueBatchForm;
