import { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import axios from 'axios';
import { Box, Divider, Skeleton } from '@mui/material';
import SummaryCards from './Dashboard/SummaryCards';
import SectionBreakdown from './Dashboard/SectionBreakdown';
import ActiveItemsFilters from './Dashboard/ActiveItemsFilters';
import ActiveItemsTable from './Dashboard/ActiveItemsTable';
import AnalyticsControls from './Dashboard/AnalyticsControls';

const TATCharts = lazy(() => import('./TATCharts'));

// ── Main component ────────────────────────────────────────────────────────────
const Dashboard = () => {
    const { summary, items_count, filters: serverFilters } = usePage().props;

    // ── Active items state ────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        priority: serverFilters?.priority ?? '',
        section_id: serverFilters?.section_id ?? '',
        date_from: serverFilters?.date_from ?? '',
        date_to: serverFilters?.date_to ?? '',
    });
    // SelectSearch display object for section (holds {id, name})
    const [sectionObj, setSectionObj] = useState(null);

    const [itemsData, setItemsData] = useState({
        data: [],
        meta: { total: items_count, per_page: 20, current_page: 1, last_page: 1 },
    });
    const [itemsLoading, setItemsLoading] = useState(true);

    // ── Analytics state ───────────────────────────────────────────────────────
    const [af, setAf] = useState({ a_preset: 'last_30_days', a_from: '', a_to: '', a_test_id: '' });
    // SelectSearch display object for test (holds {id, name})
    const [testObj, setTestObj] = useState(null);
    const [analyticsData, setAnalyticsData] = useState([]);
    const [analyticsDates, setAnalyticsDates] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // abort controllers
    const itemsAbort = useRef(null);
    const analyticsAbort = useRef(null);

    // ── Fetch items ───────────────────────────────────────────────────────────
    const fetchItems = useCallback(
        (f = filters, page = 1) => {
            itemsAbort.current?.abort();
            itemsAbort.current = new AbortController();
            setItemsLoading(true);
            const params = { ...f, page, per_page: 20 };
            Object.keys(params).forEach((k) => !params[k] && delete params[k]);
            axios
                .get(route('api.tat.items'), { params, signal: itemsAbort.current.signal })
                .then((r) => {
                    setItemsData(r.data);
                    setItemsLoading(false);
                })
                .catch((e) => {
                    if (!axios.isCancel(e)) setItemsLoading(false);
                });
        },
        [filters],
    );

    // ── Fetch analytics ───────────────────────────────────────────────────────
    const fetchAnalytics = useCallback(
        (a = af) => {
            analyticsAbort.current?.abort();
            analyticsAbort.current = new AbortController();
            setAnalyticsLoading(true);
            const params = { ...a };
            Object.keys(params).forEach((k) => !params[k] && delete params[k]);
            axios
                .get(route('api.tat.analytics'), { params, signal: analyticsAbort.current.signal })
                .then((r) => {
                    setAnalyticsData(r.data.data);
                    setAnalyticsDates(r.data.dates);
                    setAnalyticsLoading(false);
                })
                .catch((e) => {
                    if (!axios.isCancel(e)) setAnalyticsLoading(false);
                });
        },
        [af],
    );

    // initial load (mount-only; both fetchers default to the current filter snapshot,
    // and explicit filter changes call them directly via applyFilters)
    useEffect(() => {
        fetchItems();
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyFilters = (newFilters) => {
        const f = { ...filters, ...newFilters };
        setFilters(f);
        // Also update URL params for summary refresh (Inertia)
        router.get(route('tat.dashboard'), f, {
            preserveState: true,
            replace: true,
            only: ['summary', 'items_count', 'filters'],
        });
        fetchItems(f, 1);
    };

    const applyAnalytics = (newAf) => {
        const a = { ...af, ...newAf };
        setAf(a);
        fetchAnalytics(a);
    };

    const handlePageChange = (_, page) => fetchItems(filters, page);

    const chartData = useMemo(
        () =>
            analyticsData.map((d) => ({
                ...d,
                short_name: d.test_name.length > 18 ? d.test_name.slice(0, 16) + '…' : d.test_name,
            })),
        [analyticsData],
    );

    return (
        <>
            <Head title="TAT Dashboard" />
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <PageHeader
                    title="TAT Dashboard"
                    subtitle="Turnaround time monitoring for active lab items"
                />

                {/* ── Summary cards ─────────────────────────────────────────── */}
                <SummaryCards summary={summary} />

                {/* ── Section breakdown ─────────────────────────────────────── */}
                <SectionBreakdown summary={summary} />

                {/* ── Active items filters ──────────────────────────────────── */}
                <ActiveItemsFilters
                    filters={filters}
                    sectionObj={sectionObj}
                    setSectionObj={setSectionObj}
                    applyFilters={applyFilters}
                />

                {/* ── Active items table ────────────────────────────────────── */}
                <ActiveItemsTable
                    itemsData={itemsData}
                    itemsLoading={itemsLoading}
                    onPageChange={handlePageChange}
                />

                <Divider sx={{ mb: 4 }} />

                {/* ── Analytics section ─────────────────────────────────────── */}
                <AnalyticsControls
                    af={af}
                    applyAnalytics={applyAnalytics}
                    testObj={testObj}
                    setTestObj={setTestObj}
                    analyticsDates={analyticsDates}
                    analyticsLoading={analyticsLoading}
                    onRefresh={() => fetchAnalytics(af)}
                />

                {/* Bar chart + analytics table (lazy-loaded) */}
                <Suspense
                    fallback={
                        <Skeleton
                            variant="rectangular"
                            height={320}
                            sx={{ borderRadius: 1, mb: 3 }}
                        />
                    }
                >
                    <TATCharts
                        chartData={chartData}
                        analyticsLoading={analyticsLoading}
                        analyticsData={analyticsData}
                    />
                </Suspense>
            </Box>
        </>
    );
};

Dashboard.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Reception', link: route('acceptances.index'), icon: null },
            { title: 'TAT Dashboard', link: '', icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Dashboard;
