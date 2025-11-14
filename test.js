const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req,res) => res.send('HELLO WORLD'));
app.post('/api/auth/register', (req,res) => res.json({status:"OK", body:req.body}));

app.listen(3000, () => console.log('TEST SERVER RUNNING ON 3000'));
