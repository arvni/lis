import React from 'react';
import { Paper, Step, StepLabel, Stepper, Typography, Stack, Chip } from '@mui/material';
import { AccountCircleOutlined, GroupOutlined } from '@mui/icons-material';

const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(date));
};

/**
 * ApprovalFlowStepper - Visualizes a report's progress through its approval flow.
 *
 * @param {Object} props.report - Report with report_template.approval_flow.steps and approvals loaded
 */
const ApprovalFlowStepper = ({ report }) => {
    const flow = report.report_template?.approval_flow;
    if (!flow?.steps?.length) return null;

    const steps = flow.steps;
    const approvals = report.approvals || [];
    const approvalByStepId = {};
    approvals.forEach((approval) => {
        if (approval.approval_flow_step_id && approval.action === 'approved')
            approvalByStepId[approval.approval_flow_step_id] = approval;
    });
    const rejection = approvals.find((approval) => approval.action === 'rejected');

    const currentPosition = report.current_step_position ?? steps[0]?.position;
    const activeStep =
        report.approval_status === 'approved'
            ? steps.length
            : Math.max(
                  steps.findIndex((step) => step.position === currentPosition),
                  0,
              );

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 2, borderRadius: 1 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Approval Progress</Typography>
                <Chip label={flow.name} size="small" variant="outlined" />
                {report.approval_status === 'rejected' && (
                    <Chip label="Rejected" size="small" color="error" />
                )}
            </Stack>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((step) => {
                    const approval = approvalByStepId[step.id];
                    const rejectedHere = rejection?.approval_flow_step_id === step.id;
                    return (
                        <Step key={step.id} completed={Boolean(approval)}>
                            <StepLabel
                                error={rejectedHere}
                                optional={
                                    approval ? (
                                        <Typography variant="caption">
                                            by {approval.user?.name} at{' '}
                                            {formatDate(approval.created_at)}
                                        </Typography>
                                    ) : rejectedHere ? (
                                        <Typography variant="caption" color="error">
                                            rejected by {rejection.user?.name} at{' '}
                                            {formatDate(rejection.created_at)}
                                        </Typography>
                                    ) : step.role || step.user ? (
                                        <Stack
                                            direction="row"
                                            spacing={0.5}
                                            sx={{ alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            {step.role ? (
                                                <GroupOutlined sx={{ fontSize: 14 }} />
                                            ) : (
                                                <AccountCircleOutlined sx={{ fontSize: 14 }} />
                                            )}
                                            <Typography variant="caption">
                                                {step.role?.name ?? step.user?.name}
                                            </Typography>
                                        </Stack>
                                    ) : null
                                }
                            >
                                {step.name}
                            </StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
        </Paper>
    );
};

export default ApprovalFlowStepper;
