import express from "express";
import asyncHandler from "express-async-handler";
import Task from "../Models/TaskModel.js";
import protect from "../Middleware/authmiddleware.js";

const taskRouter = express.Router();

// CREATE a new task
taskRouter.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const {
        image,
        title,
        description,
        checklist,
        isChecked,
        infoTask,
        deadline,
      } = req.body;

      const task = await Task.create({
        image,
        title,
        description,
        checklist,
        isChecked,
        infoTask,
        deadline,
        user: req.user._id,
      });

      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid Task Data" });
    }
  })
);
// GET TASKS
taskRouter.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const tasks = await Task.find({ user: req.user._id });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  })
);
// UPDATE TASKS
taskRouter.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { isChecked, checklist, image, title, description, deadline } =
        req.body;
      const task = await Task.findById(req.params.id);

      if (task) {
        task.isChecked = isChecked !== undefined ? isChecked : task.isChecked;

        if (checklist && Array.isArray(checklist)) {
          checklist.forEach((checklistItem) => {
            const { _id, infoTask, isChecked } = checklistItem;
            const foundItem = task.checklist.find(
              (item) => item._id.toString() === _id
            );

            if (foundItem) {
              foundItem.infoTask =
                infoTask !== undefined ? infoTask : foundItem.infoTask;
              foundItem.isChecked =
                isChecked !== undefined ? isChecked : foundItem.isChecked;
            } else {
              task.checklist.push({ infoTask, isChecked });
            }
          });

          task.markModified("checklist"); // Mark the checklist property as modified
        }

        task.image = image !== undefined ? image : task.image;
        task.title = title !== undefined ? title : task.title;
        task.description =
          description !== undefined ? description : task.description;
        task.deadline = deadline !== undefined ? deadline : task.deadline;

        await task.save();
        res.json({ message: "Task updated successfully" });
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  })
);
// DELETE a task
taskRouter.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (task) {
        await task.deleteOne();
        res.json({ message: "Task deleted successfully" });
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  })
);
// DELETE an element from the checklist
taskRouter.delete(
  "/:taskId/checklist/:itemId",
  protect,
  asyncHandler(async (req, res) => {
    try {
      const { taskId, itemId } = req.params;
      const task = await Task.findById(taskId);

      if (task) {
        const checklistItem = task.checklist.find(
          (item) => item._id.toString() === itemId
        );

        if (checklistItem) {
          task.checklist.pull(checklistItem);
          await task.save();
          res.json({ message: "Checklist item deleted successfully" });
        } else {
          res.status(404).json({ message: "Checklist item not found" });
        }
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  })
);

export default taskRouter;
