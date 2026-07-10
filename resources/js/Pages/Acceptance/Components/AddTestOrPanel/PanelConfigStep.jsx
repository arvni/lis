import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
    applyReportless,
    applySampleless,
    addSampleToItem,
    computePanelTotals,
    removeSampleFromItem,
    spreadPanelDiscount,
    spreadPanelPrice,
    updateItemSample,
} from './PanelConfigStep/helpers';
import PanelInfoBar from './PanelConfigStep/PanelInfoBar';
import PanelOptionsCard from './PanelConfigStep/PanelOptionsCard';
import TestSampleAccordion from './PanelConfigStep/TestSampleAccordion';
import PanelPricingSection from './PanelConfigStep/PanelPricingSection';
import PanelNotesSection from './PanelConfigStep/PanelNotesSection';

// ─── Panel Configure Step ──────────────────────────────────────────────────────
const PanelConfigStep = ({ panelData, errors, maxDiscount, patient, onChange }) => {
    const { panel, acceptanceItems = [], sampleless, reportless } = panelData;
    const [expandedItem, setExpandedItem] = useState(null);

    // Auto-expand the first item accordion that has errors
    useEffect(() => {
        if (!errors || !Object.keys(errors).length) return;
        const errorKey = Object.keys(errors).find((k) => k.startsWith('item'));
        if (errorKey) {
            const idx = parseInt(errorKey.replace('item', ''), 10);
            const item = acceptanceItems[idx];
            if (item) setExpandedItem(item.id);
        }
    }, [errors, acceptanceItems]);

    const handleItemSampleChange = (itemId, si, field, value, pi) =>
        onChange(updateItemSample(acceptanceItems, itemId, si, field, value, pi));

    const { totalPrice, totalDiscount } = computePanelTotals(acceptanceItems);
    const firstItem = acceptanceItems[0];
    const panelCustomParams = {
        ...(firstItem?.customParameters || {}),
        discounts: firstItem?.customParameters?.discounts || [],
    };
    const hasDynamicPricing =
        panel?.extra?.parameters?.length > 0 &&
        (panel?.price_type === 'Formulate' || panel?.price_type === 'Conditional');

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <PanelInfoBar panel={panel} itemCount={acceptanceItems.length} />

            <PanelOptionsCard
                sampleless={sampleless}
                reportless={reportless}
                onSamplelessChange={(e) =>
                    onChange(applySampleless(acceptanceItems, e.target.checked, patient))
                }
                onReportlessChange={(e) =>
                    onChange(applyReportless(acceptanceItems, e.target.checked))
                }
            />

            {/* Per-test Sample Config */}
            {!sampleless && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Sample Configuration per Test
                    </Typography>
                    {acceptanceItems.map((item, idx) => (
                        <TestSampleAccordion
                            key={item.id}
                            item={item}
                            itemIndex={idx}
                            errors={errors}
                            patient={patient}
                            expanded={expandedItem === item.id}
                            onToggle={() =>
                                setExpandedItem(expandedItem === item.id ? null : item.id)
                            }
                            onSampleChange={handleItemSampleChange}
                            onAddSample={(itemId) =>
                                onChange(addSampleToItem(acceptanceItems, itemId, patient))
                            }
                            onRemoveSample={(itemId, si) =>
                                onChange(removeSampleFromItem(acceptanceItems, itemId, si))
                            }
                        />
                    ))}
                </Box>
            )}

            <PanelPricingSection
                panel={panel}
                panelCustomParams={panelCustomParams}
                hasDynamicPricing={hasDynamicPricing}
                totalPrice={totalPrice}
                totalDiscount={totalDiscount}
                maxDiscount={maxDiscount}
                errors={errors}
                onPriceChange={(priceData) =>
                    onChange(spreadPanelPrice(acceptanceItems, priceData))
                }
                onDiscountChange={(discountData) =>
                    onChange(spreadPanelDiscount(acceptanceItems, discountData))
                }
            />

            <PanelNotesSection acceptanceItems={acceptanceItems} onChange={onChange} />
        </Box>
    );
};

export default PanelConfigStep;
