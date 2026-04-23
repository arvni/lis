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
import {Analytics, AttachMoney, FactCheck, Payments, Publish, BugReport, Inventory as InventoryIcon} from "@mui/icons-material";
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {PercentDiamond, Stethoscope as Doctor, Hospital, ClipboardCheck, Truck, FlaskConical, Package, ShoppingCart} from "lucide-react";

export const refactorRoute = (addr) => {
    if (!addr)
        return null;
    if (route().has(addr))
        return route(addr);
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
                    title: "Financial Check",
                    route: "acceptances.financialCheck",
                    permission: 'Report.Financial Check',
                    icon: <AttachMoney/>
                },
                {
                    title: "Waiting For Publishing",
                    route: "reports.publishing",
                    permission: 'Report.Publish Report',
                    icon: <Publish/>
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
            title: "Inventory",
            permission: 'Inventory.Items.List Items',
            icon: <InventoryIcon/>,
            child: [
                {
                    title: "Items",
                    route: "inventory.items.index",
                    permission: 'Inventory.Items.List Items',
                    icon: null,
                },
                {
                    title: "Current Stock",
                    route: "inventory.stock.index",
                    permission: 'Inventory.Stock.View Stock',
                    icon: null,
                },
                {
                    title: "Transactions",
                    route: "inventory.transactions.index",
                    permission: 'Inventory.Transactions.List Transactions',
                    icon: null,
                },
                {
                    title: "Purchase Requests",
                    route: "inventory.purchase-requests.index",
                    permission: 'Inventory.PurchaseRequests.List Purchase Requests',
                    icon: null,
                },
                {
                    title: "Reorder Alerts",
                    route: "inventory.reorder-alerts.index",
                    permission: 'Inventory.ReorderAlerts.View Reorder Alerts',
                    icon: null,
                },
                {
                    title: "Suppliers",
                    route: "inventory.suppliers.index",
                    permission: 'Inventory.Suppliers.List Suppliers',
                    icon: null,
                },
                {
                    title: "Stores",
                    route: "inventory.stores.index",
                    permission: 'Inventory.Stores.List Stores',
                    icon: null,
                },
                {
                    title: "Units",
                    route: "inventory.units.index",
                    permission: null,
                    icon: null,
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
                    icon: <ClipboardCheck size={20}/>,
                    route: "referrer-orders.index",
                    permission: 'Referrer.Referrer Orders.List Referrer Orders',
                },
                {
                    title: "Collect Requests",
                    icon: <Truck size={20}/>,
                    route: "collect-requests.index",
                    permission: 'Referrer.Collect Request.List Collect Requests',
                },
                {
                    title: "Sample Collector",
                    icon: <FlaskConical size={20}/>,
                    route: "sample-collectors.index",
                    permission: 'Referrer.Sample Collector.List Sample Collectors',
                },
                {
                    title: "Materials",
                    icon: <Package size={20}/>,
                    route: "materials.index",
                    permission: 'Referrer.Materials.List Materials',
                },
                {
                    title: "Order Materials",
                    icon: <ShoppingCart size={20}/>,
                    route: "orderMaterials.index",
                    permission: 'Referrer.Order Materials.List Order Materials',
                },
            ]
        },
        {
            title: "System",
            permission: 'System',
            icon: <BugReport/>,
            child: [
                {
                    title: "Failed Jobs",
                    route: "system.failed-jobs",
                    permission: 'System.Failed Jobs.List Failed Jobs',
                    icon: <BugReport fontSize="small"/>,
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
