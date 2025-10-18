const fs = require('fs');
const path = require('path');
const EventEmitter = require ('events');

const emitter = new EventEmitter();
const filepath = path.join(__dirname,'data.txt')

emitter.on('FileUpdated',(filepath) => {
    console.log (`file updated Successfully : ${filepath}`)
});

fs.readFile(filepath , 'utf-8' , (err , data ) =>{
    if (err) console.error ('ERROR Reading this file', err);
    console.log ('current file content \n', data)

const timespan = `updated\n at : ${ new Date().toLocaleString() }`;
fs.appendFile(filepath, timespan, (err , data ) =>{

if (err) console.error ('error appending this file :', err );
    emitter.emit('FileUpdated', filepath);

    });
    
});


async function checkFile() {
    try{
        await fs.access(filepath,fs.constants.F_OK);
        console.log('The file exists and is accessible');
    }
    catch (err){
        console.log('file does not exist and is not accessible', err);
    }
    
}