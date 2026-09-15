import { v4 as uuidv4 } from 'uuid';

export const emptyStep = (sortOrder = 0) => ({
    name: '',
    sort_order: sortOrder,
    deadline_days: '',
    approver_type: 'role',
    approver_user_id: null,
    approver_role: null,
    _user: null,
    _id: uuidv4(),
});
