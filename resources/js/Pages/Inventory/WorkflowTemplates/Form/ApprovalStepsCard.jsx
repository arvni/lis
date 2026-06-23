import { Box, Button, Card, CardContent, CardHeader, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableStep from './SortableStep';

const ApprovalStepsCard = ({
    localSteps,
    sensors,
    errors,
    roles,
    users,
    onDragEnd,
    addStep,
    updateStep,
    setStepUser,
    removeStep,
}) => (
    <Card>
        <CardHeader
            title="Approval Steps"
            subheader="Steps are executed top-to-bottom. Drag to reorder."
            action={
                <Button startIcon={<AddIcon />} size="small" onClick={addStep} sx={{ mt: 1, mr: 1 }}>
                    Add Step
                </Button>
            }
        />
        <CardContent sx={{ pt: 0 }}>
            {localSteps.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary" variant="body2">
                        No steps yet. Add steps to define the approval chain.
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                        Without steps, submitting a PR will skip workflow approval.
                    </Typography>
                </Box>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={localSteps.map((s) => s._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <Box sx={{ pt: 1 }}>
                            {localSteps.map((step, idx) => (
                                <SortableStep
                                    key={step._id}
                                    step={step}
                                    idx={idx}
                                    total={localSteps.length}
                                    errors={errors}
                                    roles={roles}
                                    users={users}
                                    updateStep={updateStep}
                                    setStepUser={setStepUser}
                                    removeStep={removeStep}
                                />
                            ))}
                        </Box>
                    </SortableContext>
                </DndContext>
            )}
        </CardContent>
    </Card>
);

export default ApprovalStepsCard;
