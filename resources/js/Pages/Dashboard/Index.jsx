import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import Dashboard from "./Components/Dashboard.jsx";
import {Head, router} from "@inertiajs/react";

const Index = ({data,date}) => {

    const handleRefresh = (date = "") => router.visit(route("dashboard"),{data: {date},only:["data","date"]});

    return (
        <>
            <Head title="Dashboard"/>
            <Dashboard data={data} onRefresh={handleRefresh} date={date}/>
        </>
    );
}
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={[]}/>

export default Index;
