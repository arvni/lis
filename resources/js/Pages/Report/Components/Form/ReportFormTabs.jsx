import React from 'react';
import { Box, Typography, Alert, Tabs, Tab, Badge } from '@mui/material';
import { Article as ArticleIcon, Tune as TuneIcon } from '@mui/icons-material';
import { TabContext, TabPanel } from '@mui/lab';

import ParameterSection from './ParameterSection';
import DocumentUploadSection from './DocumentUploadSection';

const TAB_META = [
    { label: 'Documents', icon: <ArticleIcon /> },
    { label: 'Parameters', icon: <TuneIcon /> },
];

const TabLabel = ({ tab, errorCount }) => {
    const content = (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {tab.icon}
            <Typography sx={{ ml: 1 }}>{tab.label}</Typography>
        </Box>
    );
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {errorCount > 0 ? (
                <Badge badgeContent={errorCount} color="error">
                    {content}
                </Badge>
            ) : (
                content
            )}
        </Box>
    );
};

const ReportFormTabs = ({
    activeTab,
    onTabChange,
    countErrors,
    data,
    setData,
    errors,
    handleFileChange,
    patientID,
    isSubmitting,
    hasParameters,
    activeParameters,
    parameterErrors,
    handleParameterChange,
    theme,
}) => (
    <Box sx={{ width: '100%', mb: 3 }}>
        <TabContext value={activeTab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={onTabChange}
                    aria-label="report form tabs"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    {TAB_META.map((tab, index) => (
                        <Tab
                            key={index}
                            label={<TabLabel tab={tab} errorCount={countErrors(index)} />}
                            id={`report-tab-${index}`}
                            aria-controls={`report-tabpanel-${index}`}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Document Upload Tab */}
            <TabPanel value={0}>
                <DocumentUploadSection
                    data={data}
                    setData={setData}
                    errors={errors}
                    handleFileChange={handleFileChange}
                    patientID={patientID}
                    isSubmitting={isSubmitting}
                />
            </TabPanel>

            {/* Parameters Tab */}
            <TabPanel value={1}>
                {hasParameters ? (
                    <ParameterSection
                        data={data}
                        setData={setData}
                        activeParameters={activeParameters}
                        parameterErrors={parameterErrors}
                        handleParameterChange={handleParameterChange}
                        theme={theme}
                        isSubmitting={isSubmitting}
                    />
                ) : (
                    <Alert severity="info" sx={{ my: 2 }}>
                        This template doesn&apos;t have any parameters to fill.
                    </Alert>
                )}
            </TabPanel>
        </TabContext>
    </Box>
);

export default ReportFormTabs;
