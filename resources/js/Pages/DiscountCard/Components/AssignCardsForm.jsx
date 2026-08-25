import React, { useState } from 'react';
import {
    Alert,
    Box,
    Divider,
    Paper,
    Tab,
    Tabs,
    TextField,
    Typography,
    Chip,
    Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AssignmentInd, Numbers } from '@mui/icons-material';

import SelectSearch from '@/Components/SelectSearch';
import { FormProvider, useFormState } from '@/Components/FormTemplate.jsx';

/**
 * Hands stock cards to a partner: a whole serial range at once, or the cards
 * ticked in the list. The two are mutually exclusive — the server refuses both
 * at once rather than guessing which was meant.
 */
const AssignCardsForm = ({ open, onClose, selectedCards = [] }) => (
    <FormProvider
        onClose={onClose}
        open={open}
        url={route('discountCards.assign')}
        maxWidth="sm"
        generalTitle="Assign Cards"
        defaultValue={{
            partner: null,
            discount_partner_id: '',
            card_ids: selectedCards.map((card) => card.id),
            discount_card_batch_id: '',
            serial_from: '',
            serial_to: '',
        }}
    >
        <FormContent selectedCards={selectedCards} />
    </FormProvider>
);

const FormContent = ({ selectedCards }) => {
    const { data, setData, errors } = useFormState();
    const [mode, setMode] = useState(selectedCards.length ? 'cards' : 'range');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handlePartnerChange = (e) => {
        const partner = e.target.value;
        setData((prevState) => ({
            ...prevState,
            partner,
            discount_partner_id: partner?.id ?? '',
        }));
    };

    // Only one selection travels to the server; the other is blanked on switch.
    const handleModeChange = (_event, next) => {
        setMode(next);
        setData((prevState) => ({
            ...prevState,
            ...(next === 'range'
                ? { card_ids: [] }
                : {
                      discount_card_batch_id: '',
                      serial_from: '',
                      serial_to: '',
                      card_ids: selectedCards.map((card) => card.id),
                  }),
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
                    <AssignmentInd sx={{ mr: 1 }} />
                    Assign to Partner
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                    Assigning is what gives a card its discount — until then it discounts nothing. A
                    card that has already been used cannot change partner.
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
                            helperText={errors?.discount_partner_id || 'Who these cards go to'}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Tabs value={mode} onChange={handleModeChange} sx={{ mb: 2 }}>
                            <Tab value="range" label="A serial range" />
                            <Tab
                                value="cards"
                                label={`Selected cards (${selectedCards.length})`}
                                disabled={!selectedCards.length}
                            />
                        </Tabs>
                    </Grid>

                    {mode === 'range' ? (
                        <>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    label="Batch ID"
                                    name="discount_card_batch_id"
                                    type="number"
                                    fullWidth
                                    value={data.discount_card_batch_id ?? ''}
                                    onChange={handleChange}
                                    error={!!errors?.discount_card_batch_id}
                                    helperText={
                                        errors?.discount_card_batch_id ||
                                        'The batch the range belongs to'
                                    }
                                    slotProps={{
                                        htmlInput: { min: 1 },
                                        input: {
                                            startAdornment: <Numbers fontSize="small" />,
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="From Serial"
                                    name="serial_from"
                                    type="number"
                                    fullWidth
                                    value={data.serial_from ?? ''}
                                    onChange={handleChange}
                                    error={!!errors?.serial_from}
                                    helperText={errors?.serial_from || 'Inclusive'}
                                    slotProps={{ htmlInput: { min: 1 } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="To Serial"
                                    name="serial_to"
                                    type="number"
                                    fullWidth
                                    value={data.serial_to ?? ''}
                                    onChange={handleChange}
                                    error={!!errors?.serial_to}
                                    helperText={errors?.serial_to || 'Inclusive'}
                                    slotProps={{ htmlInput: { min: 1 } }}
                                />
                            </Grid>
                        </>
                    ) : (
                        <Grid size={{ xs: 12 }}>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                                {selectedCards.map((card) => (
                                    <Chip key={card.id} label={card.number} size="small" />
                                ))}
                            </Stack>
                        </Grid>
                    )}

                    {errors?.card_ids && (
                        <Grid size={{ xs: 12 }}>
                            <Alert severity="error">{errors.card_ids}</Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Box>
    );
};

export default AssignCardsForm;
