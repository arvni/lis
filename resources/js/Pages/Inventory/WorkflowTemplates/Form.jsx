import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import { Alert, Box, Button, Grid } from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { emptyStep } from './Form/constants';
import TemplateInfoCard from './Form/TemplateInfoCard';
import MatchingConditionsCard from './Form/MatchingConditionsCard';
import ApprovalStepsCard from './Form/ApprovalStepsCard';

const WorkflowTemplateForm = () => {
    const { template, users, roles, urgencies, success, status } = usePage().props;
    const isEdit = !!template;

    const buildSteps = () => {
        if (!template?.steps?.length) return [];
        return template.steps.map((s) => ({
            name: s.name,
            sort_order: s.sort_order,
            deadline_days: s.deadline_days ?? '',
            approver_type: s.approver_user_id ? 'user' : 'role',
            approver_user_id: s.approver_user_id ?? null,
            approver_role: s.approver_role ?? null,
            _user: s.approver_user ?? null,
            _id: crypto.randomUUID(),
        }));
    };

    const { data, setData, post, put, processing, errors } = useForm({
        name: template?.name ?? '',
        description: template?.description ?? '',
        is_active: template?.is_active ?? true,
        is_default: template?.is_default ?? false,
        priority: template?.priority ?? 0,
        conditions: {
            urgencies: template?.conditions?.urgencies ?? [],
            requester_roles: template?.conditions?.requester_roles ?? [],
            min_total: template?.conditions?.min_total ?? '',
        },
        steps: buildSteps(),
    });

    const [localSteps, setLocalSteps] = useState(buildSteps);

    const syncSteps = (updated) => {
        const withOrder = updated.map((s, i) => ({ ...s, sort_order: i }));
        setLocalSteps(withOrder);
        setData(
            'steps',
            withOrder.map(({ _user, approver_type: _approver_type, _id, ...rest }) => rest),
        );
    };

    const addStep = () => syncSteps([...localSteps, emptyStep(localSteps.length)]);

    const removeStep = (idx) => syncSteps(localSteps.filter((_, i) => i !== idx));

    const updateStep = (idx, field, value) => {
        if (field === '_approver_type_reset') {
            syncSteps(
                localSteps.map((s, i) =>
                    i !== idx
                        ? s
                        : {
                              ...s,
                              approver_type: value,
                              approver_user_id: null,
                              approver_role: null,
                              _user: null,
                          },
                ),
            );
        } else {
            syncSteps(localSteps.map((s, i) => (i !== idx ? s : { ...s, [field]: value })));
        }
    };

    const setStepUser = (idx, user) => {
        syncSteps(
            localSteps.map((s, i) =>
                i !== idx
                    ? s
                    : {
                          ...s,
                          _user: user,
                          approver_user_id: user?.id ?? null,
                      },
            ),
        );
    };

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIdx = localSteps.findIndex((s) => s._id === active.id);
        const newIdx = localSteps.findIndex((s) => s._id === over.id);
        syncSteps(arrayMove(localSteps, oldIdx, newIdx));
    };

    const submit = () => {
        if (isEdit) {
            put(route('inventory.workflow-templates.update', template.id));
        } else {
            post(route('inventory.workflow-templates.store'));
        }
    };

    return (
        <>
            <Head title={isEdit ? `Edit: ${template.name}` : 'New Workflow Template'} />
            <PageHeader
                title={isEdit ? `Edit: ${template.name}` : 'New Workflow Template'}
                actions={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() =>
                                router.visit(route('inventory.workflow-templates.index'))
                            }
                        >
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={submit} disabled={processing}>
                            {isEdit ? 'Save Changes' : 'Create Template'}
                        </Button>
                    </Box>
                }
            />

            {status && (
                <Alert severity={success ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Template info */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <TemplateInfoCard data={data} setData={setData} errors={errors} />
                    <MatchingConditionsCard
                        data={data}
                        setData={setData}
                        roles={roles}
                        urgencies={urgencies}
                    />
                </Grid>

                {/* Steps timeline */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <ApprovalStepsCard
                        localSteps={localSteps}
                        sensors={sensors}
                        errors={errors}
                        roles={roles}
                        users={users}
                        onDragEnd={handleDragEnd}
                        addStep={addStep}
                        updateStep={updateStep}
                        setStepUser={setStepUser}
                        removeStep={removeStep}
                    />
                </Grid>
            </Grid>
        </>
    );
};

WorkflowTemplateForm.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Inventory', link: null },
            { title: 'Workflow Templates', link: route('inventory.workflow-templates.index') },
            { title: page.props.template ? 'Edit' : 'New', link: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default WorkflowTemplateForm;
