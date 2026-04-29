import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import Dashboard from "./Components/Dashboard.jsx";
import {Head, router} from "@inertiajs/react";
import {Box, Button, Card, CardContent, Chip, Typography} from "@mui/material";
import HowToVoteIcon from "@mui/icons-material/HowToVote";

const PendingApprovalsWidget = ({count}) => {
    if (!count) return null;
    return (
        <Card sx={{mb: 3, borderLeft: "4px solid", borderColor: "warning.main", cursor: "pointer"}}
            onClick={() => router.visit(route("inventory.purchase-requests.index", {filters: {view: "approval"}}))}>
            <CardContent sx={{display: "flex", alignItems: "center", justifyContent: "space-between", py: "12px !important"}}>
                <Box sx={{display: "flex", alignItems: "center", gap: 1.5}}>
                    <HowToVoteIcon color="warning"/>
                    <Box>
                        <Typography variant="body2" fontWeight={600}>Purchase Requests Awaiting Your Approval</Typography>
                        <Typography variant="caption" color="text.secondary">Click to review</Typography>
                    </Box>
                </Box>
                <Chip label={count} color="warning" size="small" sx={{fontWeight: 700, minWidth: 32}}/>
            </CardContent>
        </Card>
    );
};

const Index = ({data, date, pendingPRApprovals}) => {
    const handleRefresh = (date = "") => router.visit(route("dashboard"), {data: {date}, only: ["data", "date"]});
    return (
        <>
            <Head title="Dashboard"/>
            <PendingApprovalsWidget count={pendingPRApprovals}/>
            <Dashboard data={data} onRefresh={handleRefresh} date={date}/>
        </>
    );
}
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={[]}/>

export default Index;
