import React, {useCallback} from "react";
import {styled} from '@mui/material/styles';
import Box from "@mui/material/Box";
import SampleTypeCard from "./SampleTypeCard";

const Basic = styled(Box)`
  background-color: aliceblue;
  color: darkslategray;
  padding: 2rem;
  display: inline-flex;
  text-align: center;
`;
export const CardsContainer = ({onEdit, onDelete, sampleTypes}) => {
    const renderCard = useCallback((card, index) => {
        return (
            <SampleTypeCard
                key={card.id}
                index={index}
                id={card.id}
                text={card.text}
                section={card}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        )
    }, [])
    return sampleTypes.length ? <Basic>{sampleTypes.map((card, i) => renderCard(card, i))}</Basic> : null;
};
