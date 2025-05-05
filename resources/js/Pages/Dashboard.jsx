import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DashboardCard from "@/Components/DashbordCard";
import Grid from "@mui/material/Grid2";

const Dashboard = ({data={}}) => {
    return (
        <Grid container spacing={5}>
            {/*{Object.keys(data).map((key)=><DashboardCard title={key} value={data[key]}/>)}*/}
        </Grid>
    );
}
Dashboard.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={[]}/>

export default Dashboard;
