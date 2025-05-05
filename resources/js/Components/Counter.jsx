import { useEffect, useRef, useState } from "react";
import Stack from "@mui/material/Stack";

const useInterval = (callback, delay) => {
    const savedCallback = useRef();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        if (delay !== null) {
            const id = setInterval(() => savedCallback.current(), delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

const getReturnValues = (timer) => {
    const day = Math.floor(timer / (1000 * 60 * 60 * 24));
    const hour = Math.floor((timer % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minute = Math.floor((timer % (1000 * 60 * 60)) / (1000 * 60));
    const second = Math.floor((timer % (1000 * 60)) / 1000);
    return { day, hour, minute, second };
};

const formatTime = (val) => String(val).padStart(2, "0");

const Counter = ({ date }) => {
    const [time, setTime] = useState(getReturnValues(0));

    const updateTime = () => {
        const diff = new Date().getTime() - new Date(date).getTime();
        setTime(getReturnValues(diff));
    };

    useEffect(() => {
        updateTime(); // initial update
    }, [date]);

    useInterval(updateTime, 1000);

    return (
        <Stack direction="row" spacing={1}>
            {time.day > 0 && <span>{formatTime(time.day)}d</span>}
            <span>{formatTime(time.hour)}</span>:
            <span>{formatTime(time.minute)}</span>:
            <span>{formatTime(time.second)}</span>
        </Stack>
    );
};

export default Counter;
