const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Debugging
router.get('/debug', (req, res) => {
  res.json({ message: 'Debug route works' });
});

// Get all tasks with filter
router.get('/', async (req, res) => {
  try {
    const filter = req.query.filter;
    let tasks;

    if (filter === 'completed') {
      tasks = await Task.find({ completed: true });
    } else if (filter === 'incomplete') {
      tasks = await Task.find({ completed: false });
    } else {
      tasks = await Task.find();
    }

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching filtered tasks:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new task
router.post('/', async (req, res) => {
  const newTask = new Task({ text: req.body.text });
  try {
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit a task
router.put('/:id/editTask', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.text = req.body.text;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a task
router.delete('/:id/deleteTask', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a task (mark complete/incomplete)
router.put('/:id/complete', async (req, res) => {
  console.log(`PUT request received for task ${req.params.id}/complete`);
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
