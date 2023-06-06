const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

// Create an Express application
const app = express();

// Rate limit configuration (maximum 1 request every 5 seconds)
const limiter = rateLimit({
    windowMs: 5000,
    max: 1,
});

// Apply the rate limiter middleware to all routes
app.use(limiter);

// Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB (replace the connection string with your own)
mongoose.connect('uri', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define the Employee schema
const employeeSchema = new mongoose.Schema({
    employee_id: {
        type: String,
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String
    },
    email_address: {
        type: String,
        required: true
    },
    department_id: {
        type: String,
        required: true
    },
});

// Create the Employee model
const Employee = mongoose.model('Employee', employeeSchema);

// Validation schema using Joi
const employeeSchemaJoi = Joi.object({
    employee_id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().allow(''),
    email_address: Joi.string().email().required(),
    department_id: Joi.string().required(),
});

// API endpoint to save or update an employee
app.post('/api/employees', (req, res) => {
    // Validate request data
    const {
        error
    } = employeeSchemaJoi.validate(req.body);
    if (error) {
        return res.status(400).json({
            error: error.details[0].message
        });
    }

    const {
        employee_id,
        first_name,
        last_name,
        email_address,
        department_id,
    } = req.body;

    // Save or update the employee in the database
    Employee.findOneAndUpdate({
            employee_id
        }, {
            employee_id,
            first_name,
            last_name,
            email_address,
            department_id,
        }, {
            upsert: true,
            new: true
        },
        (err, employee) => {
            if (err) {
                return res.status(500).json({
                    error: 'Failed to save employee.'
                });
            }
            res.json(employee);
        }
    );
});

// API endpoint to get all saved employees with department_name
app.get('/api/employees', (req, res) => {
    const {
        first_name,
        last_name,
        email_address,
        department
    } = req.query;

    // Create the query object based on the provided query parameters
    const query = {};
    if (first_name) {
        query.first_name = {
            $regex: new RegExp(first_name, 'i')
        };
    }
    if (last_name) {
        query.last_name = {
            $regex: new RegExp(last_name, 'i')
        };
    }
    if (email_address) {
        query.email_address = {
            $regex: new RegExp(email_address, 'i')
        };
    }
    if (department) {
        query.department_id = department;
    }

    // Perform the query to get the employees with department_name
    Employee.find(query)
        .populate('department_id', 'department_name')
        .exec((err, employees) => {
            if (err) {
                return res.status(500).json({
                    error: 'Failed to fetch employees.'
                });
            }
            res.json(employees);
        });
});

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});