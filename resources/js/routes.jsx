import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import TuneIcon from '@mui/icons-material/Tune';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BiotechIcon from '@mui/icons-material/Biotech';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import DescriptionIcon from '@mui/icons-material/Description';
import PostAddIcon from '@mui/icons-material/PostAdd';
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion';
import InterpreterModeIcon from '@mui/icons-material/InterpreterMode';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from "@mui/icons-material/Receipt";
import {Analytics} from "@mui/icons-material";
import {PercentDiamond, Stethoscope as Doctor, Hospital} from "lucide-react";

export const refactorRoute = (addr) => {
    if (!addr)
        return null;
    let id = null;
    let splitAddr = addr.split(".");
    if (splitAddr.length > 2) {
        id = addr.split(".")[2];
        splitAddr.pop();
    }
    return id != null ? route(splitAddr.join("."), id) : route(addr);
}

const routes = (sections = []) => {
    return [
        {
            title: "Dashboard",
            route: 'dashboard',
            permission: 'Dashboard',
            icon: <DashboardIcon/>
        },
        {
            title: "Reception",
            permission: 'Reception',
            icon: <ManageAccountsIcon/>,
            child: [
                {
                    title: "Patient List",
                    route: "patients.index",
                    permission: 'Reception.Patient.Index',
                    icon: <GroupsIcon/>,
                },
                {
                    title: "Add Patient",
                    route: "patients.create",
                    permission: 'Reception.Patient.Create',
                    icon: <PersonAddIcon/>
                },
                {
                    title: "Acceptance List",
                    route: "acceptances.index",
                    permission: 'Reception.Acceptance.Index',
                    icon: <GroupsIcon/>,
                },
            ]
        },
        {
            title: "Consultations",
            permission: 'Consultations',
            icon: <InterpreterModeIcon/>,
            child: [
                {
                    title: "Waiting Consultations",
                    route: "consultations.waiting-list",
                    permission: 'Consultation.Consultations.Waiting List Consultations',
                    icon: null,
                },
                {
                    title: "Consultations List",
                    route: "consultations.index",
                    permission: 'Consultation.Consultations.List Consultations',
                    icon: null,
                },
                {
                    title: "Consultants",
                    route: "consultants.index",
                    permission: 'Consultations.Consultation.Index',
                    icon: null,
                },
                {
                    title: "Reservations",
                    route: "times",
                    permission: 'Consultations.Consultation.Index',
                    icon: null,
                },
            ]
        },
        {
            title: "Sampling",
            permission: 'Sampling',
            icon: <VaccinesIcon/>,
            child: [
                {
                    title: "Sample Collection",
                    route: "sampleCollection",
                    permission: 'Sampling.Sample.SampleCollection',
                    icon: null,
                },
                {
                    title: "Samples List",
                    route: "samples.index",
                    permission: 'Sampling.Sample.Index',
                    icon: null,
                },
            ]
        },
        ...sections,
        {
            title: "Reports",
            permission: 'Report',
            icon: <DescriptionIcon/>,
            child: [
                {
                    title: "Waiting For Creating",
                    route: "reports.waitingList",
                    permission: 'Report.WaitingList',
                    icon: <PostAddIcon/>
                },
                //     {
                //         title: "Waiting For Approving",
                //         route: "reports.approving",
                //         permission: 'Report.Approve',
                //         icon: <FactCheckIcon/>
                //     },
                {
                    title: "List",
                    permission: 'Report.Index',
                    route: "reports.index",
                    icon: <AutoAwesomeMotionIcon/>
                }
            ]
        },
        {
            title: "Invoices",
            icon: <ReceiptIcon/>,
            route: "invoices.index",
            permission: 'Invoice.Index',
        },
        // {
        //     title: "Payments",
        //     icon: <PaymentsIcon/>,
        //     route: "payments.index",
        //     permission: 'Payment.Index',
        // },
        {
            title: "Statistics",
            icon: <Analytics/>,
            route: "acceptanceItems.index",
            permission: 'Statistics',
        },
        {
            title: "Advance Settings",
            permission: 'AdvanceSettings',
            icon: <TuneIcon/>,
            child: [
                {
                    title: "Section Groups",
                    route: "sectionGroups.index",
                    permission: 'Advance Settings.Section Groups.Index',
                    icon: <BusinessIcon/>
                },
                {
                    title: "Sections",
                    route: "sections.index",
                    permission: 'Advance Settings.Section.Index',
                    icon: <AccountTreeIcon/>
                },
                {
                    title: "Workflows",
                    route: "workflows.index",
                    permission: 'Advance Settings.Workflow.Index',
                    icon: <FlipCameraAndroidIcon/>
                },
                {
                    title: "SampleTypes",
                    route: "sampleTypes.index",
                    permission: 'Advance Settings.Sample Type.Index',
                    icon: <VaccinesIcon/>
                },
                {
                    title: "Barcode Groups",
                    route: "barcodeGroups.index",
                    permission: 'Advance Settings.Barcode Group.Index',
                    icon: <HorizontalSplitIcon/>
                },
                {
                    title: "Test Groups",
                    route: "testGroups.index",
                    permission: 'Advance Settings.Test Group.Index',
                    icon: <WorkspacesIcon/>
                },
                {
                    title: "Report Templates",
                    route: "reportTemplates.index",
                    permission: 'AdvanceSettings.ReportTemplate.Index',
                    icon: <SummarizeIcon/>
                },
                {
                    title: "Tests",
                    route: "tests.index",
                    permission: 'AdvanceSettings.Test.Index',
                    icon: <BiotechIcon/>
                },
                {
                    title: "Doctors",
                    route: "doctors.index",
                    permission: 'AdvanceSettings.Doctors.Index',
                    icon: <Doctor/>
                },
                {
                    title: "Offers List",
                    route: "offers.index",
                    permission: 'AdvanceSettings.Offers.Index',
                    icon: <PercentDiamond/>,
                },
                {
                    title: "Setting List",
                    route: "settings.index",
                    permission: 'AdvanceSettings.Setting.Index',
                    icon: <SettingsIcon/>,
                },
            ]
        },
        {
            title: "Referrers",
            route: "referrers.index",
            permission: 'AdvanceSettings.Referrer.Index',
            icon: <Hospital/>,
            child: [
                {
                    title: "Referrer Orders",
                    icon: <ReceiptIcon/>,
                    route: "referrer-orders.index",
                    permission: 'ReferrerOrder.Index',
                },
            ]
        },
        {
            title: "User Management",
            permission: 'UserManagement',
            icon: <ManageAccountsIcon/>,
            child: [
                {
                    title: "Users List",
                    route: "users.index",
                    permission: 'UserManagement.User.Index',
                    icon: <GroupsIcon/>,
                },
                {
                    title: "Add New User",
                    route: "users.create",
                    permission: 'UserManagement.User.Create',
                    icon: <PersonAddIcon/>
                },
                {
                    title: "Roles",
                    route: "roles.index",
                    permission: 'UserManagement.Role.Index',
                    icon: <AdminPanelSettingsIcon/>
                },
            ]
        },
    ]
};
export default routes;
