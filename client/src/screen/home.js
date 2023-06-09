import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getTasks } from '../Redux/Actions/TaskActions';
import Header from '../components/header';

export default function Home() {
    const dispatch = useDispatch();

    const listTasks = useSelector((state) => state.tasksList);
    const { tasks } = listTasks;

    useEffect(() => {
        dispatch(getTasks());
    }, [dispatch]);


    return (
        <div>
            <Header />
            <p>Total Tasks: {tasks ? tasks.length : 'Loading...'}</p>
            <Link to="/tasks">task list</Link>
        </div>
    )
}