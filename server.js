const express = require('express');
var bodyParser = require('body-parser')
app = express();

const employee = [];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/employ', (req, res) => {
    employee.push(req.body);
    res.send('Record Saved Sucessfully!')
})

app.get('/employ/list', (req, res) => {
    res.send(employee)
})


app.listen(3000);