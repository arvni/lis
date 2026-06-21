import React from 'react';
import { Box, Tab, Typography } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import PricingConfig from '../PricingConfig';

export default function PricingStep({ data, errors, set, pricingTab, setPricingTab, nav }) {
    return (
        <Box>
            <TabContext value={pricingTab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <TabList onChange={(_, v) => setPricingTab(v)}>
                        {[
                            {
                                value: 'direct',
                                label: 'Direct Patient',
                                sub: 'Walk-in pricing',
                                errKey: 'price',
                            },
                            {
                                value: 'referral',
                                label: 'Referral',
                                sub: 'Doctor-referred pricing',
                                errKey: 'referrer_price',
                            },
                        ].map(({ value, label, sub, errKey }) => (
                            <Tab
                                key={value}
                                value={value}
                                sx={{ textTransform: 'none', alignItems: 'flex-start' }}
                                label={
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography variant="body2" fontWeight="medium">
                                            {label}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color={errors?.[errKey] ? 'error' : 'text.secondary'}
                                        >
                                            {errors?.[errKey] || sub}
                                        </Typography>
                                    </Box>
                                }
                            />
                        ))}
                    </TabList>
                </Box>

                <TabPanel value="direct" sx={{ p: 0 }}>
                    <PricingConfig
                        priceType={data?.price_type || 'Fix'}
                        price={data?.price}
                        extra={data?.extra || {}}
                        onPriceTypeChange={(v) => set('price_type', v)}
                        onPriceChange={(v) => set('price', v)}
                        onExtraChange={(newExtra) => set('extra', newExtra)}
                        error={errors?.price}
                    />
                </TabPanel>

                <TabPanel value="referral" sx={{ p: 0 }}>
                    <PricingConfig
                        priceType={data?.referrer_price_type || 'Fix'}
                        price={data?.referrer_price}
                        extra={data?.referrer_extra || {}}
                        onPriceTypeChange={(v) => set('referrer_price_type', v)}
                        onPriceChange={(v) => set('referrer_price', v)}
                        onExtraChange={(newExtra) => set('referrer_extra', newExtra)}
                        error={errors?.referrer_price}
                    />
                </TabPanel>
            </TabContext>

            {nav}
        </Box>
    );
}
