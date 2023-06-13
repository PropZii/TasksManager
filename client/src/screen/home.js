import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getTasks, updateTask } from "../Redux/Actions/TaskActions";
import Header from "../components/header";
import Sidebar from "../components/sidebar";

export default function Home() {
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const listTasks = useSelector((state) => state.tasksList);
  const { tasks } = listTasks;

  const [selectedTask, setSelectedTask] = useState(null);
  const [updatedTasks, setUpdatedTasks] = useState({});
  const [filterType, setFilterType] = useState("all"); // "all", "inProgress", "completed"
  const [isModified, setIsModified] = useState(false);

  const newTasks = tasks.filter((task) => {
    const createdAt = new Date(task.createdAt);
    return createdAt >= yesterday && createdAt < today;
  });

  const numberOfNewTasks = newTasks.length;

  const inProgressTasks = tasks.filter((task) => {
    const hasUnchecked = task.checklist.some((item) => !item.isChecked);
    const hasChecked = task.checklist.some((item) => item.isChecked);
    return hasUnchecked && hasChecked;
  });

  const numberOfInProgressTasks = inProgressTasks.length;

  const displayCheckedPercentage = (checklist) => {
    const checkedItems = checklist.filter((item) => item.isChecked);
    const percentage = (checkedItems.length / checklist.length) * 100;
    return `${percentage.toFixed(2)}%`;
  };

  useEffect(() => {
    const filterQueryParam = queryParams.get("filter");
    if (
      filterQueryParam &&
      ["all", "inProgress", "completed"].includes(filterQueryParam)
    ) {
      setFilterType(filterQueryParam);
    } else {
      setFilterType("all"); // Default value
    }
  }, [queryParams]);

  useEffect(() => {
    if (selectedTask) {
      setUpdatedTasks((prevState) => ({
        ...prevState,
        [selectedTask._id]: selectedTask,
      }));
    }
  }, [selectedTask]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleCheckboxChange = (task, item, checked) => {
    const updatedTask = { ...task };
    const checklistItem = updatedTask.checklist.find(
      (checklist) => checklist._id === item._id
    );

    if (checklistItem) {
      checklistItem.isChecked = checked;
      setUpdatedTasks((prevState) => ({
        ...prevState,
        [task._id]: updatedTask,
      }));
      setIsModified(true); // Set isModified to true when checkbox is changed
    }
  };

  const saveChanges = useCallback(() => {
    Object.keys(updatedTasks).forEach((taskId) => {
      const updatedTask = updatedTasks[taskId];
      dispatch(updateTask(taskId, updatedTask));
    });
    setUpdatedTasks({});
  }, [dispatch, updatedTasks]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (Object.keys(updatedTasks).length > 0) {
        event.preventDefault();
        event.returnValue = "";
        saveChanges();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [updatedTasks, saveChanges]);

  const filterTasks = () => {
    switch (filterType) {
      case "inProgress":
        return tasks.filter((task) => {
          const checkedPercentage =
            (task.checklist.filter((item) => item.isChecked).length /
              task.checklist.length) *
            100;
          return checkedPercentage > 0 && checkedPercentage < 100;
        });
      case "completed":
        return tasks.filter((task) => {
          const checkedPercentage =
            (task.checklist.filter((item) => item.isChecked).length /
              task.checklist.length) *
            100;
          return checkedPercentage === 100;
        });
      default:
        return tasks;
    }
  };

  const handleFilterClick = (type) => {
    if (isModified) {
      saveChanges(); // Save the changes before switching filter
      setIsModified(false); // Reset isModified to false
    }
    setFilterType(type);
    queryParams.set("filter", type);
    const newSearch = queryParams.toString();
    const newPath = location.pathname + "?" + newSearch;
    dispatch(getTasks());
    navigate(newPath);
  };

  const filteredTasks = filterTasks();

  useEffect(() => {
    dispatch(getTasks());
  }, [dispatch]);

  return (
    <div>
      <Sidebar />
      <Header />

      <div className="home-container">
        <div className="home-header">
          <div className="all-tasks-w">
            <i className="fa-solid fa-list-ul"></i>
            <h3>All Tasks</h3>
            <Link to="/tasks">
              <i className="fa-solid fa-ellipsis-vertical"></i>{" "}
            </Link>
            <p>{tasks ? tasks.length : "Loading..."}</p>
            {numberOfNewTasks > 1 && (
              <p>+{numberOfNewTasks} news tasks from yesterday</p>
            )}
            {numberOfNewTasks === 1 && <p>1 new task from yesterday</p>}
            {numberOfNewTasks === 0 && <p>No new tasks from yesterday</p>}
          </div>
          <div className="in-progress-w">
            <i className="fa-solid fa-percent"></i>
            <h3>In Progress</h3>
            <Link to="/tasks?filter=inProgress">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </Link>
            <p>{numberOfInProgressTasks}</p>
            <p className="in-prog"></p>
          </div>
          <div className="completed-w">
            <i className="fa-solid fa-check"></i>
            <h3>Completed</h3>
            <Link to="/tasks?filter=completed">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </Link>
            <p></p>
          </div>
        </div>
        <div className="home-tasks-list-w">
          <div>
            <button onClick={() => handleFilterClick("all")}>All Tasks</button>
            <button onClick={() => handleFilterClick("inProgress")}>
              In Progress
            </button>
            <button onClick={() => handleFilterClick("completed")}>
              Completed
            </button>
          </div>
          <ul>
            {filteredTasks.map((task) => (
              <li key={task._id} onClick={() => handleTaskClick(task)}>
                {task.image}
                {task.title}
                {task.description}
                <span>
                  {task.checklist.length > 0 &&
                    `(${displayCheckedPercentage(task.checklist)})`}
                </span>
              </li>
            ))}
          </ul>
          {selectedTask && (
            <div>
              <h2>{selectedTask.title}</h2>
              <p>{selectedTask.description}</p>
              <ul>
                {selectedTask.checklist.map((item) => (
                  <li key={item._id}>
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={(e) =>
                        handleCheckboxChange(
                          selectedTask,
                          item,
                          e.target.checked
                        )
                      }
                    />
                    <label>{item.infoTask}</label>
                  </li>
                ))}
              </ul>
              <p>
                Percentage Checked:{" "}
                {displayCheckedPercentage(selectedTask.checklist)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
