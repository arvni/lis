import React, {useEffect, useState, useMemo} from "react";
import {RemoveRedEye} from "@mui/icons-material";
import {useSnackbar} from "notistack";
import {Tab, Box} from "@mui/material";
import {TabContext, TabList, TabPanel} from "@mui/lab";

// Layouts and Components
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ReferrerInfo from "./Components/ReferrerInfo";
import LoadMore from "@/Components/LoadMore";

import ReferrerTestsTab from "./Components/ReferrerTestsTab";

const Show = ({
                  referrer,
                  success,
                  status,
                  errors
              }) => {
    const {enqueueSnackbar} = useSnackbar();
    const [activeTab, setActiveTab] = useState("1");

    // Memoized columns to prevent unnecessary re-renders
    const invoiceColumns = useMemo(() => [
        {
            field: 'price',
            headerName: 'Price',
            type: 'number',
            width: 50,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'discount',
            headerName: 'Discount',
            type: 'number',
            width: 100,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'status',
            headerName: 'Status',
            type: 'string',
            width: 200,
            align: 'center',
            headerAlign: 'center'
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'string',
            width: 200,
            align: 'center',
            headerAlign: 'center',
            renderCell: ({row}) => (
                <a
                    href={route("invoices.show", row.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RemoveRedEye/>
                </a>
            )
        }
    ], []);

    const acceptanceColumns = useMemo(() => [
        {
            field: 'id',
            headerName: 'ID',
            type: 'number',
            width: 70,
            align: 'center',
            headerAlign: 'center',
            sortable: false
        },
        {
            field: 'patient',
            headerName: 'Patient',
            width: 200,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            renderCell: ({row}) => row.patient?.fullName || 'N/A'
        },
        {
            field: 'status',
            headerName: 'Status',
            type: 'string',
            width: 200,
            align: 'center',
            headerAlign: 'center',
            sortable: false
        },
        {
            field: "created_at",
            headerName: 'Action',
            type: 'string',
            width: 200,
            align: 'center',
            headerAlign: 'center',
            sortable: false,
            renderCell: ({row}) => (
                <a
                    href={route("acceptances.show", row.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <RemoveRedEye/>
                </a>
            )
        }
    ], []);

    // Handle notifications for success and errors
    useEffect(() => {
        if (success) {
            enqueueSnackbar(status || 'Success', {
                variant: "success"
            });
        }

        if (errors) {
            Object.entries(errors).forEach(([_, message]) =>
                enqueueSnackbar(message, {
                    variant: "error"
                })
            );
        }
    }, [success, errors, enqueueSnackbar, status]);

    // Tab change handler
    const handleTabChange = (_event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <div>
            <ReferrerInfo
                referrer={referrer}
                editable
                defaultExpanded
            />
            <TabContext value={activeTab}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <TabList onChange={handleTabChange}>
                        <Tab label="Acceptances" value="1"/>
                        <Tab label="Invoices" value="2"/>
                        <Tab label="Test Prices" value="3"/>
                    </TabList>
                </Box>
                <TabPanel value="1">
                    <LoadMore
                        title="Acceptances"
                        items={referrer.acceptances}
                        columns={acceptanceColumns}
                        defaultExpanded
                        loadMoreLink={route("acceptances.index", {referrer_id: referrer.id})}
                    />
                </TabPanel>
                <TabPanel value="2">
                    <LoadMore
                        title="Invoices"
                        items={referrer.invoices}
                        columns={invoiceColumns}
                        defaultExpanded
                        loadMoreLink={route("invoices.index", {
                            id: referrer.id,
                            owner: "Referrer"
                        })}
                    />
                </TabPanel>
                <TabPanel value="3">
                    <ReferrerTestsTab referrer={referrer}/>
                </TabPanel>
            </TabContext>
        </div>
    );
};

// Breadcrumb's configuration
const breadCrumbs = [
    {
        title: "Referrer",
        link: route("referrers.index"),
        icon: null,
    }
];

// Layout wrapper
Show.layout = (page) => {
    const {props} = page;
    return (
        <AuthenticatedLayout
            auth={props.auth}
            breadcrumbs={[
                ...breadCrumbs,
                {
                    title: props.referrer.fullName,
                    link: null,
                    icon: null,
                }
            ]}
        >
            {page}
        </AuthenticatedLayout>
    );
};

export default Show;
