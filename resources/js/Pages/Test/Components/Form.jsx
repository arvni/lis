import React, { useState } from 'react';
import { Box, Paper, useMediaQuery, useTheme } from '@mui/material';
import PageHeader from '@/Components/PageHeader.jsx';
import { STEPS, TYPE_META } from './Form/constants';
import Sidebar from './Form/Sidebar';
import MobileNav from './Form/MobileNav';
import StepNav from './Form/StepNav';
import StepHeader from './Form/StepHeader';
import BasicStep from './Form/BasicStep';
import SamplesStep from './Form/SamplesStep';
import PricingStep from './Form/PricingStep';
import MethodsStep from './Form/MethodsStep';
import DescriptionStep from './Form/DescriptionStep';

export default function TestForm({
    data = {},
    setData,
    submit,
    edit,
    cancel,
    errors = {},
    setError,
    clearErrors,
}) {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [step, setStep] = useState(0);
    const [pricingTab, setPricingTab] = useState('direct');

    const steps = STEPS[data.type] ?? STEPS.TEST;
    const meta = TYPE_META[data.type] ?? TYPE_META.TEST;
    const current = steps[step];
    const prev = steps[step - 1];
    const next = steps[step + 1];

    // ── data helpers ───────────────────────────────────────────────────────
    const set = (key, val) => setData((p) => ({ ...p, [key]: val }));
    const onField = (e) =>
        set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

    const stepHasError = (s) => (s.errorFields || []).some((f) => Boolean(errors?.[f]));

    // ── type change ────────────────────────────────────────────────────────
    const handleTypeChange = (_, v) => {
        setData((p) => ({
            ...p,
            type: v,
            test_groups: [],
            report_templates: [],
            parameters: [],
            sampleTypes: [],
        }));
        setStep(0);
    };

    // ── validate + submit ──────────────────────────────────────────────────
    const handleSubmit = () => {
        clearErrors();
        let firstErrorStep = null;

        const fail = (field, msg, stepKey) => {
            setError(field, msg);
            if (firstErrorStep === null) {
                firstErrorStep = steps.findIndex((s) => s.key === stepKey);
            }
        };

        if (!data?.fullName) fail('fullName', 'Required', 'basic');
        if (!data?.name) fail('name', 'Required', 'basic');
        if (!data?.code) fail('code', 'Required', 'basic');

        if (data?.type === 'TEST') {
            if (!data?.report_templates?.length)
                fail('report_templates', 'Select at least one template', 'basic');
            if (!data?.sample_type_tests?.length)
                fail('sample_type_tests', 'Add at least one sample type', 'samples');
        }

        if (!data?.method_tests?.length) fail('method_tests', 'Add at least one method', 'methods');

        if (firstErrorStep !== null) {
            setStep(firstErrorStep);
            return;
        }
        submit();
    };

    const nav = (
        <StepNav
            prev={prev}
            next={next}
            step={step}
            setStep={setStep}
            edit={edit}
            cancel={cancel}
            meta={meta}
            onSubmit={handleSubmit}
        />
    );

    const renderContent = () => {
        switch (current?.key) {
            case 'basic':
                return (
                    <BasicStep
                        data={data}
                        errors={errors}
                        onField={onField}
                        handleTypeChange={handleTypeChange}
                        nav={nav}
                    />
                );
            case 'samples':
                return <SamplesStep data={data} errors={errors} set={set} nav={nav} />;
            case 'pricing':
                return (
                    <PricingStep
                        data={data}
                        errors={errors}
                        set={set}
                        pricingTab={pricingTab}
                        setPricingTab={setPricingTab}
                        nav={nav}
                    />
                );
            case 'methods':
                return <MethodsStep data={data} errors={errors} set={set} nav={nav} />;
            case 'description':
                return <DescriptionStep data={data} onField={onField} nav={nav} />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <PageHeader title={`${edit ? 'Edit' : 'New'} ${meta.label}`} sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                {/* sidebar — desktop only */}
                {isDesktop && (
                    <Box sx={{ width: 220, flexShrink: 0 }}>
                        <Sidebar
                            meta={meta}
                            steps={steps}
                            step={step}
                            setStep={setStep}
                            data={data}
                            stepHasError={stepHasError}
                            cancel={cancel}
                        />
                    </Box>
                )}

                {/* main content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* mobile chips */}
                    {!isDesktop && (
                        <MobileNav
                            steps={steps}
                            step={step}
                            setStep={setStep}
                            stepHasError={stepHasError}
                        />
                    )}

                    <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
                        <StepHeader meta={meta} current={current} step={step} steps={steps} />
                        {renderContent()}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
