export const LEAVE_STATUS_COLORS = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    CANCELLED: 'default',
};

export const APPROVAL_STATUS_COLORS = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
    SKIPPED: 'default',
};

export const formatLeavePeriod = (leave) => {
    if (leave.type === 'HOURLY') {
        return `${leave.start_date} · ${leave.start_time}–${leave.end_time}`;
    }

    return leave.start_date === leave.end_date
        ? leave.start_date
        : `${leave.start_date} → ${leave.end_date}`;
};

/** Who a pending request is waiting for; the decision once it is made. */
export const currentStepLabel = (leave) => {
    if (leave.status !== 'PENDING') return leave.status_label;
    const step = (leave.approvals ?? []).find((approval) => approval.status === 'PENDING');

    return step ? `Waiting for ${step.approver}` : leave.status_label;
};
