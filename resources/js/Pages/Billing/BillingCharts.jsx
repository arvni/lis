import React from 'react';
import { Divider } from '@mui/material';
import IncomeByTestSection from './BillingCharts/IncomeByTestSection';
import IncomeByReferrerSection from './BillingCharts/IncomeByReferrerSection';
import PaymentMethodSection from './BillingCharts/PaymentMethodSection';
import IncomeTrendSection from './BillingCharts/IncomeTrendSection';
import ErrorBoundary from '@/Components/ErrorBoundary';

const BillingCharts = ({
    byTest,
    byReferrer,
    byMethod,
    chartsLoading,
    trendData,
    trendLoading,
    trendFilters,
    applyTrendFilters,
    trendReferrerObj,
    setTrendReferrerObj,
    trendTestObjs,
    setTrendTestObjs,
}) => (
    <ErrorBoundary
        variant="widget"
        title="The billing charts couldn't be displayed"
        description="An unexpected error occurred while rendering the analytics charts."
    >
        <Divider sx={{ mb: 3 }} />

        <IncomeByTestSection byTest={byTest} loading={chartsLoading} />
        <IncomeByReferrerSection byReferrer={byReferrer} loading={chartsLoading} />
        <PaymentMethodSection byMethod={byMethod} loading={chartsLoading} />

        <Divider sx={{ mb: 3 }} />
        <IncomeTrendSection
            trendData={trendData}
            trendLoading={trendLoading}
            trendFilters={trendFilters}
            applyTrendFilters={applyTrendFilters}
            trendReferrerObj={trendReferrerObj}
            setTrendReferrerObj={setTrendReferrerObj}
            trendTestObjs={trendTestObjs}
            setTrendTestObjs={setTrendTestObjs}
        />
    </ErrorBoundary>
);

export default BillingCharts;
