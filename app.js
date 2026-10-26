// Task1: initiate app and run server at 3000
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path=require('path');
app.use(express.static(path.join(__dirname+'/dist/FrontEnd')));
app.use(express.static(path.join(__dirname, 'dist/Frontend')));

// Task2: create mongoDB connection 
const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    mongoose.connect(mongoURI)
        .then(() => {
            console.log('Connected to MongoDB Atlas');
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err.message);
        });
} else {
    console.warn('Warning: MONGODB_URI is not defined in environment variables.');
}

//Task 2 : write api with error handling and appropriate api mentioned in the TODO below

// Employee Schema & Model
const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true
    },
    salary: {
        type: Number,
        required: [true, 'Salary is required']
    }
}, { versionKey: false });

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);

//TODO: get data from db  using api '/api/employeelist'
app.get('/api/employeelist', async (req, res) => {
    try {
        const employees = await Employee.find();
        return res.status(200).json(employees);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch employees', message: err.message });
    }
});

//TODO: get single data from db  using api '/api/employeelist/:id'
app.get('/api/employeelist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid employee ID format' });
        }
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        return res.status(200).json(employee);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch employee', message: err.message });
    }
});

//TODO: send data from db using api '/api/employeelist'
//Request body format:{name:'',location:'',position:'',salary:''}
app.post('/api/employeelist', async (req, res) => {
    try {
        const { name, location, position, salary } = req.body;
        if (!name || !location || !position || salary === undefined || salary === null || salary === '') {
            return res.status(400).json({ error: 'All fields (name, location, position, salary) are required' });
        }
        const numericSalary = Number(salary);
        if (isNaN(numericSalary)) {
            return res.status(400).json({ error: 'Salary must be a valid number' });
        }
        const newEmployee = new Employee({
            name: typeof name === 'string' ? name.trim() : name,
            location: typeof location === 'string' ? location.trim() : location,
            position: typeof position === 'string' ? position.trim() : position,
            salary: numericSalary
        });
        const savedEmployee = await newEmployee.save();
        return res.status(201).json(savedEmployee);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to add employee', message: err.message });
    }
});

//TODO: delete a employee data from db by using api '/api/employeelist/:id'
app.delete('/api/employeelist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid employee ID format' });
        }
        const deletedEmployee = await Employee.findByIdAndDelete(id);
        if (!deletedEmployee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        return res.status(200).json({ message: 'Employee deleted successfully', employee: deletedEmployee });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete employee', message: err.message });
    }
});

//TODO: Update  a employee data from db by using api '/api/employeelist'
//Request body format:{name:'',location:'',position:'',salary:''}
const handleUpdateEmployee = async (req, res) => {
    try {
        const id = req.params.id || req.body._id || req.body.id;
        if (!id) {
            return res.status(400).json({ error: 'Employee ID is required (_id in body or id in URL)' });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid employee ID format' });
        }

        const updateData = {};
        if (req.body.name !== undefined) updateData.name = typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name;
        if (req.body.location !== undefined) updateData.location = typeof req.body.location === 'string' ? req.body.location.trim() : req.body.location;
        if (req.body.position !== undefined) updateData.position = typeof req.body.position === 'string' ? req.body.position.trim() : req.body.position;
        if (req.body.salary !== undefined && req.body.salary !== null && req.body.salary !== '') {
            const numericSalary = Number(req.body.salary);
            if (isNaN(numericSalary)) {
                return res.status(400).json({ error: 'Salary must be a valid number' });
            }
            updateData.salary = numericSalary;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json(updatedEmployee);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update employee', message: err.message });
    }
};

app.put('/api/employeelist', handleUpdateEmployee);
app.put('/api/employeelist/:id', handleUpdateEmployee);

//! dont delete this code. it connects the front end file.
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/Frontend/index.html'));
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server };
