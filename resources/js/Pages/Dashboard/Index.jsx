import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import Dashboard from "./Components/Dashboard.jsx";
import {Head} from "@inertiajs/react";

const Index = ({data}) => {
    return (
        <>
            <Head title="Dashboard" />
            <Dashboard data={data}/>
        </>
    );
}
Index.layout = page => <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={[]}/>

export default Index;
