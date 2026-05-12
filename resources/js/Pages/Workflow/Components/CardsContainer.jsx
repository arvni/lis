import React from "react";
import SectionCard from "./SectionCard";
import {SortableContext, horizontalListSortingStrategy} from '@dnd-kit/sortable';
import {styled} from '@mui/material/styles';
import Box from "@mui/material/Box";

const Basic = styled(Box)`
  background-color: aliceblue;
  color: darkslategray;
  padding: 2rem;
  display: inline-flex;
  text-align: center;
  & div[draggable=true]:not(:last-child){
      margin-right:2em;
      &:after{
        content:'→';
        width:2em;
        font-size:4em;
        }
  }
  & div[draggable=true]:last-child:after{
    content:' "End" ';
    width:2em;
    font-size:4em;
  }
`;

export const CardsContainer = ({onEdit, onDelete, sections}) => {
    if (!sections?.length) return null;
    const ids = sections.map(s => s.id.toString());
    return (
        <Basic>
            <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
                {sections.map((card) => (
                    <SectionCard
                        key={card.id}
                        id={card.id}
                        section={card}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </SortableContext>
        </Basic>
    );
};
