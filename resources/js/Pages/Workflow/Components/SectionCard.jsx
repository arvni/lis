import React, {useState, useRef} from "react";
import {useDrag, useDrop} from 'react-dnd'
import {ItemTypes} from './ItemTypes.js'
import {Card, CardActions, CardContent, ListItem} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import IconButton from "@mui/material/IconButton";
import DeleteForm from "@/Components/DeleteForm";

const SectionCard = ({id, text, index, moveCard, findCard, section, onEdit, onDelete, ...props}) => {
    const [openDelete, setOpenDelete] = useState(false);
    const listParameters = () => {
        let output = [];
        for (let parameter in section.parameters) {
            output.push(<ListItem key={parameter}>{section.parameters[parameter]["name"]}</ListItem>)
        }
        return output;
    }
    const handleDelete = () => setOpenDelete(true);
    const closeOpenDelete = () => setOpenDelete(false);
    const handleEdit = () => onEdit(id);
    const destroy = () => onDelete(id);

    const ref = useRef(null)
    const [{handlerId}, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
            }
        },
        hover(item, monitor) {
            if (!ref.current) {
                return
            }
            const dragIndex = item.index
            const hoverIndex = index
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect()
            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            // Determine mouse position
            const clientOffset = monitor.getClientOffset()
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return
            }
            // Time to actually perform the action
            moveCard(dragIndex, hoverIndex)
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex
        },
    })
    const [{isDragging}, drag] = useDrag({
        type: ItemTypes.CARD,
        item: () => {
            return {id, index}
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })
    const opacity = isDragging ? 0 : 1
    drag(drop(ref))


    return <Card variant={"outlined"} {...props} sx={{opacity, minWidth:"250px"}} ref={ref} data-handler-id={handlerId}>
        <CardContent>
            <Typography variant={"h4"}maxHeight={"100px"} height={"100px"}>{section?.section.name}</Typography>
            <List dense sx={{overflow:"auto", height:"150px", maxHeight:"150px"}}>
                {section?.parameters ? listParameters() : null}
            </List>
        </CardContent>
        <CardActions>
            <IconButton onClick={handleEdit} type={"button"} color={"warning"}><EditIcon/></IconButton>
            <IconButton onClick={handleDelete} type={"button"} color={"error"}><DeleteIcon/></IconButton>
        </CardActions>
        <DeleteForm title={`${section?.section.name} Section`} agreeCB={destroy} disAgreeCB={closeOpenDelete}
                    openDelete={openDelete}/>
    </Card>
};
export default SectionCard;
