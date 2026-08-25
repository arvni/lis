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
            number_template: 'DDDD-DDDD-DDDD-DDDD',
            serial_from: 1,
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

                {!data.discount_partner_id && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        No partner chosen, so this run is minted as <strong>stock</strong>. The cards
                        print and can be kept in hand, but they discount nothing until they are
                        assigned to a partner.
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <SelectSearch
                            value={data.partner}
                            onChange={handlePartnerChange}
                            name="partner"
                            fullWidth
                            url={route('api.discountPartners.list')}
                            label="Partner (optional)"
                            error={!!errors?.discount_partner_id}
                            helperText={
                                errors?.discount_partner_id ||
                                'Leave empty to mint stock and assign it later'
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
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                            label="Number Template"
                            name="number_template"
                            fullWidth
                            value={data.number_template ?? ''}
                            onChange={handleChange}
                            error={!!errors?.number_template}
                            helperText={
                                errors?.number_template ||
                                "D = digit, L = capital letter, D{1-9} or L{A-F} to narrow the range, 'quoted' text stays literal"
                            }
                        />
                        <Alert severity="info" variant="outlined" sx={{ mt: 1 }}>
                            Numbers are drawn at random inside the template and carry a check
                            character, so a card cannot be guessed from another one and a mistyped
                            number is caught at the scanner. Leave empty to keep the old
                            series-and-serial format.
                        </Alert>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                            label="Serials Start At"
                            name="serial_from"
                            type="number"
                            fullWidth
                            value={data.serial_from ?? ''}
                            onChange={handleChange}
                            error={!!errors?.serial_from}
                            helperText={
                                errors?.serial_from ||
                                'Continue where the last run stopped, so ranges stay meaningful'
                            }
                            slotProps={{ htmlInput: { min: 1 } }}
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
