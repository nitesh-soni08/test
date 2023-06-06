const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

require('dotenv').config();

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
mongoose.connect(process.env.MONGODB_SERVICE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{
    console.log("Db connected");
}).catch((e)=>{
    console.log("Error :",e);
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
app.post('/api/employees', async (req, res) => {
    try {
        // Validate request data
        const { error } = employeeSchemaJoi.validate(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
    
        const {
          employee_id,
          first_name,
          last_name,
          email_address,
          department_id,
        } = req.body;
    
        // Save or update the employee in the database
        let employee = await Employee.findOne({ employee_id });
    
        if (!employee) {
          employee = new Employee({
            employee_id,
            first_name,
            last_name,
            email_address,
            department_id,
          });
        } else {
          employee.first_name = first_name;
          employee.last_name = last_name;
          employee.email_address = email_address;
          employee.department_id = department_id;
        }
    
        await employee.save();
    
        employee = await Employee.findOne({ employee_id }).populate(
            'department_id',
            'department_name'
          );    
        res.json(employee);
      } catch (error) {
        console.log("Error ",error);

        res.status(500).json({ error: 'Failed to save employee.' });
      }
    });
// API endpoint to get all saved employees with department_name
app.get('/api/employees', async (req, res) => {
    try {
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

      // Check if the query object is empty
    if (Object.keys(query).length === 0) {
        return res.status(400).json({ error: 'Please provide valid query parameters.' });
      }
  
      // Perform the query to get the employees with department_name
      const employees = await Employee.findOne(query)
        .populate('department_id', 'department_name')
        .exec();
  
      res.json(employees);
    } catch (error) {
      console.log("Error: ", error);
      res.status(500).json({
        error: 'Failed to fetch employees.'
      });
    }
  });

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});