import React, {useCallback} from "react";
import update from 'immutability-helper'
import SectionCard from "./SectionCard";
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
export const CardsContainer = ({onEdit, onDelete, sections, setData}) => {
    const moveCard = useCallback((dragIndex, hoverIndex) => {
        setData((prevData) => ({
            ...prevData, section_workflows: update(prevData.section_workflows, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, prevData.section_workflows[dragIndex]],
                ],
            })
        }))
    }, [])
    const renderCard = useCallback((card, index) => {
        return (
            <SectionCard
                key={card.id}
                index={index}
                id={card.id}
                text={card.text}
                moveCard={moveCard}
                section={card}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        )
    }, [])
    return sections?.length ? <Basic>{sections.map((card, i) => renderCard(card, i))}</Basic> : null;
};
