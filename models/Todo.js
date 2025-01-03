const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    text: { 
        type: String, 
        required: true 
    },
    completed: { 
        type: Boolean, 
        default: false 
    },
    priority: { 
        type: String, 
        enum: ['Low', 'Medium', 'High'], 
        default: 'Medium' 
    },
    dueDate: { 
        type: Date, 
        required: false 
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
