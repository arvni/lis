import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardActions, CardContent, ListItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import DeleteForm from '@/Components/DeleteForm';

const SectionCard = ({ id, section, onEdit, onDelete }) => {
    const [openDelete, setOpenDelete] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: id.toString(),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const listParameters = () => {
        let output = [];
        for (let parameter in section.parameters) {
            output.push(
                <ListItem key={parameter}>{section.parameters[parameter]['name']}</ListItem>,
            );
        }
        return output;
    };

    const handleDelete = () => setOpenDelete(true);
    const closeOpenDelete = () => setOpenDelete(false);
    const handleEdit = () => onEdit(id);
    const destroy = () => onDelete(id);

    return (
        <Card
            variant={'outlined'}
            ref={setNodeRef}
            style={style}
            sx={{ minWidth: '250px' }}
            {...attributes}
        >
            <CardContent {...listeners} sx={{ cursor: 'grab' }}>
                <Typography variant={'h4'} maxHeight={'100px'} height={'100px'}>
                    {section?.section.name}
                </Typography>
                <List dense sx={{ overflow: 'auto', height: '150px', maxHeight: '150px' }}>
                    {section?.parameters ? listParameters() : null}
                </List>
            </CardContent>
            <CardActions>
                <IconButton onClick={handleEdit} type={'button'} color={'warning'}>
                    <EditIcon />
                </IconButton>
                <IconButton onClick={handleDelete} type={'button'} color={'error'}>
                    <DeleteIcon />
                </IconButton>
            </CardActions>
            <DeleteForm
                title={`${section?.section.name} Section`}
                agreeCB={destroy}
                disAgreeCB={closeOpenDelete}
                openDelete={openDelete}
            />
        </Card>
    );
};
export default SectionCard;
