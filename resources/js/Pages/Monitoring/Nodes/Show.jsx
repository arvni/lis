import { Head, router, usePage } from '@inertiajs/react';
import { Alert, Box, Button, Card, CardContent, CardHeader, Grid } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import FetchButton from './Show/FetchButton';
import PeriodBar from './Show/PeriodBar';
import SectionForm from './Show/SectionForm';
import NodeInfoCard from './Show/NodeInfoCard';
import ReadingsCard from './Show/ReadingsCard';

const Show = () => {
    const {
        node,
        samples = [],
        sections = [],
        period = 'today',
        beginTime,
        endTime,
        success,
        status,
        appTimezone = 'UTC',
    } = usePage().props;

    const hasHumidity =
        node.info?.humidity !== undefined || samples.some((s) => s.humidity != null);

    const exportUrl = () => {
        const params = new URLSearchParams({ period });
        if (beginTime) params.set('beginTime', beginTime);
        if (endTime) params.set('endTime', endTime);
        return route('monitoring.nodes.samples.export', node.nodeId) + '?' + params.toString();
    };

    return (
        <>
            <Head title={`Node: ${node.name || node.nodeId}`} />
            <PageHeader
                title={node.name || node.nodeId}
                actions={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FetchButton nodeId={node.nodeId} />
                        <Button
                            startIcon={<ArrowBackIcon />}
                            variant="outlined"
                            size="small"
                            onClick={() => router.visit(route('monitoring.nodes.index'))}
                        >
                            All Nodes
                        </Button>
                    </Box>
                }
            />

            {status && (
                <Alert severity={success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left: node info + section assignment */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <NodeInfoCard node={node} />

                    <Card elevation={0} variant="outlined">
                        <CardHeader
                            title="Section Assignment"
                            subheader="Link this node to a lab section"
                        />
                        <CardContent>
                            <SectionForm
                                nodeId={node.nodeId}
                                sections={sections}
                                sectionId={node.section_id}
                                notes={node.notes}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right: period filter + chart + download */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <PeriodBar
                        nodeId={node.nodeId}
                        activePeriod={period}
                        beginTime={beginTime}
                        endTime={endTime}
                    />
                    <ReadingsCard
                        samples={samples}
                        hasHumidity={hasHumidity}
                        period={period}
                        tz={appTimezone}
                        exportUrl={exportUrl()}
                    />
                </Grid>
            </Grid>
        </>
    );
};

const breadcrumbs = (node) => [
    { title: 'Monitoring', link: null },
    { title: 'Sensor Nodes', link: route('monitoring.nodes.index') },
    { title: node?.name || node?.nodeId || 'Node', link: null },
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.node)}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
