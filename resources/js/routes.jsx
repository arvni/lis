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
import {Analytics, FactCheck, Payments} from "@mui/icons-material";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {PercentDiamond, Stethoscope as Doctor, Hospital, PillBottle, ClipboardList} from "lucide-react";

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
                    permission: 'Reception.Patients.List Patients',
                    icon: <GroupsIcon/>,
                },
                {
                    title: "Add Patient",
                    route: "patients.create",
                    permission: 'Reception.Patient.Create Patient',
                    icon: <PersonAddIcon/>
                },
                {
                    title: "Acceptance List",
                    route: "acceptances.index",
                    permission: 'Reception.Acceptances.List Acceptance',
                    icon: <GroupsIcon/>,
                },
            ]
        },
        {
            title: "Consultations",
            permission: 'Consultation',
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
                    permission: 'Consultation.Consultants.List Consultants',
                    icon: null,
                },
                {
                    title: "Reservations",
                    route: "times.index",
                    permission: 'Consultation.Reservations.List Reservations',
                    icon: null,
                },
            ]
        },
        {
            title: "Sampling",
            permission: 'Sample Collection',
            icon: <VaccinesIcon/>,
            child: [
                {
                    title: "Sample Collection",
                    route: "sampleCollection",
                    permission: 'Sample Collection',
                    icon: null,
                },
                {
                    title: "Samples List",
                    route: "samples.index",
                    permission: 'Sample Collection.Samples.List Samples',
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
                    permission: 'Report.Create Report',
                    icon: <PostAddIcon/>
                },
                {
                    title: "Waiting For Approving",
                    route: "reports.approvingList",
                    permission: 'Report.Approve Report',
                    icon: <FactCheck/>
                },
                {
                    title: "List",
                    permission: 'Report.List Report',
                    route: "reports.index",
                    icon: <AutoAwesomeMotionIcon/>
                }
            ]
        },
        {
            title: "Billing",
            permission: "Billing",
            icon: <ReceiptIcon/>,
            child: [
                {
                    title: "Invoices",
                    icon: <ReceiptIcon/>,
                    route: "invoices.index",
                    permission: 'Billing.Invoices.List Invoices',
                },
                {
                    title: "Payments",
                    icon: <Payments/>,
                    route: "payments.index",
                    permission: 'Billing.Payments.List Payments',
                },
                {
                    title: "Statements",
                    icon: <ReceiptLongIcon/>,
                    route: "statements.index",
                    permission: 'Billing.Statements.List Statements',
                },
            ]
        },
        {
            title: "Statistics",
            icon: <Analytics/>,
            route: "acceptanceItems.index",
            permission: 'Statistics',
        },
        {
            title: "Test Lists",
            route: "test-list",
            permission: null,
            icon: <VaccinesIcon/>
        },
        {
            title: "Advance Settings",
            permission: 'Advance Settings',
            icon: <TuneIcon/>,
            child: [
                {
                    title: "Section Groups",
                    route: "sectionGroups.index",
                    permission: 'Advance Settings.Section Groups.List Section Groups',
                    icon: <BusinessIcon/>
                },
                {
                    title: "Sections",
                    route: "sections.index",
                    permission: 'Advance Settings.Sections.List Sections',
                    icon: <AccountTreeIcon/>
                },
                {
                    title: "Workflows",
                    route: "workflows.index",
                    permission: 'Advance Settings.Workflows.List Workflows',
                    icon: <FlipCameraAndroidIcon/>
                },
                {
                    title: "Sample Types",
                    route: "sampleTypes.index",
                    permission: 'Advance Settings.Sample Types.List Sample Types',
                    icon: <VaccinesIcon/>
                },
                {
                    title: "Barcode Groups",
                    route: "barcodeGroups.index",
                    permission: 'Advance Settings.Barcode Groups.List Barcode Groups',
                    icon: <HorizontalSplitIcon/>
                },
                {
                    title: "Test Groups",
                    route: "testGroups.index",
                    permission: 'Advance Settings.Test Groups.List Test Groups',
                    icon: <WorkspacesIcon/>
                },
                {
                    title: "Request Forms",
                    route: "requestForms.index",
                    permission: 'Advance Settings.Request Form.List Request Forms',
                    icon: <WorkspacesIcon/>
                },
                {
                    title: "Consent Forms",
                    route: "consentForms.index",
                    permission: 'Advance Settings.Consent Form.List Consent Forms',
                    icon: <WorkspacesIcon/>
                },
                {
                    title: "Instruction",
                    route: "instructions.index",
                    permission: 'Advance Settings.Instruction.List Instructions',
                    icon: <WorkspacesIcon/>
                },
                {
                    title: "Report Templates",
                    route: "reportTemplates.index",
                    permission: 'Advance Settings.Report Templates.List Report Templates',
                    icon: <SummarizeIcon/>
                },
                {
                    title: "Tests",
                    route: "tests.index",
                    permission: 'Advance Settings.Test.List Tests',
                    icon: <BiotechIcon/>
                },
                {
                    title: "Doctors",
                    route: "doctors.index",
                    permission: 'Advance Settings.Doctors.List Doctors',
                    icon: <Doctor/>
                },
                {
                    title: "Offers List",
                    route: "offers.index",
                    permission: 'Advance Settings.Offers.List Offers',
                    icon: <PercentDiamond/>,
                },
                {
                    title: "Setting List",
                    route: "settings.index",
                    permission: 'Advance Settings.Settings.List Settings',
                    icon: <SettingsIcon/>,
                },
            ]
        },
        {
            title: "Referrers",
            route: "referrers.index",
            permission: 'Referrer.List Referrers',
            icon: <Hospital/>,
            child: [
                {
                    title: "Referrer Orders",
                    icon: <ReceiptIcon/>,
                    route: "referrer-orders.index",
                    permission: 'Referrer.Referrer Orders.List Referrer Orders',
                },
                {
                    title: "Materials",
                    icon: <PillBottle/>,
                    route: "materials.index",
                    permission: 'Referrer.Materials.List Materials',
                },
                {
                    title: "Order Materials",
                    icon: <ClipboardList/>,
                    route: "orderMaterials.index",
                    permission: 'Referrer.Order Materials.List Order Materials',
                },
            ]
        },
        {
            title: "User Management",
            permission: 'User Management',
            icon: <ManageAccountsIcon/>,
            child: [
                {
                    title: "Users List",
                    route: "users.index",
                    permission: 'User Management.Users.List Users',
                    icon: <GroupsIcon/>,
                },
                {
                    title: "Add New User",
                    route: "users.create",
                    permission: 'User Management.Users.Create User',
                    icon: <PersonAddIcon/>
                },
                {
                    title: "Roles",
                    route: "roles.index",
                    permission: 'User Management.Roles.List Roles',
                    icon: <AdminPanelSettingsIcon/>
                },
            ]
        },
    ]
};
export default routes;
