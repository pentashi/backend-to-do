const express = require('express');
const Todo = require('../models/Todo');
const User = require('../models/Users');
const authenticateToken = require("../middleware/auth")
const router = express.Router();

// Create a new to-do
router.post("/todos", authenticateToken, async (req, res) => {
    try {
        const { text, priority, dueDate } = req.body;

        const todo = new Todo({
            text,
            priority: priority || "Medium",
            dueDate,
            userId: req.user.id, // Associate todo with logged-in user
        });

        const savedTodo = await todo.save();
        res.status(201).json(savedTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/', async (req, res) => {
    res.send("welcome to mern-to-do ")
})
//trash
router.post('/user/signup', async (req, res) => {
    
    try {
        const { name, password } = req.body;
        const user = new User({
            name,password
        })
        
        const saveUser = await user.save();
        res.status(201).json(saveUser)
    }
    catch (err) {
        res.status(400).json({ message: err.message });

    }
})

router.post('user/signin', async (req, res)=> {
    try {
        const { name, password } = req.body;

        const compare = await User.findOne({ name: req.body(name) })
        if (compare) {
            res.status(400).json({message: "user already exists"})
        }
        else {
            res.status(200).json({message: "succesfull login"})
        }
        
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
})
// Get all to-dos
router.get("/todos", authenticateToken, async (req, res) => {
    try {
        // Fetch todos specific to the logged-in user
        const todos = await Todo.find({ userId: req.user.id });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Update a to-do
router.patch('/todos/:id', authenticateToken, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (req.body.text) {
            todo.text = req.body.text;
        }
        if (req.body.completed !== undefined) {
            todo.completed = req.body.completed;
        }
        const updatedTodo = await todo.save();
        res.json(updatedTodo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.delete('/todos/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).json({ message: 'Todo not found' });
        }
        await Todo.deleteOne({ _id: req.params.id });
        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
