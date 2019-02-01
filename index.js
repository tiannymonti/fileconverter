const multer = require('multer');
const express = require('express');
const app = express();
const exceltojson = require('xlsx-to-json-lc');
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './data/')
    },
    filename: (req, file, cb) => {
      const date = Date.now();
      cb(null, file.originalname);
    }
});

const upload = multer({storage: storage}).single('file');

function convertToCSV(result){
    const header = Object.keys(result[0]);
    let csv = result.map(row => header.map(fieldName => JSON.stringify(row[fieldName])).join(','));
    csv.unshift(header.join(','));
    csv = csv.join('\r\n');
    return csv;
}

app.post('/fileUpload', (req, res) => {
    upload(req, res, (err) => {
        if(err){
            res.json({'message': err});
            return;
        }
        if(!req.file){
            res.json({'message': 'there is no file'});
            return;
        }
        try{
            exceltojson({
                input: req.file.path,
                output:  null,
                lowerCaseHeaders:true
            }, (err, result) => {
                if(err){return res.json({'message': err})}
                result.forEach(element => {
                    element.title = element.title.split(" ")
                        .map(wrd => wrd = wrd.replace(/(\r\n|\n|\r)/gm, '')
                        .replace(/[^a-z_-]/gi,''))
                        .filter(wrd => wrd !== '')
                        .filter(wrd => wrd !== '-')
                        .join('|');
                });

                const csv = convertToCSV(result);
                fs.unlinkSync(req.file.path, (err) => {
                    if (err) {return res.json({'message': err})};
                });
                fs.writeFile(`./converteddata/${req.file.originalname.split('.')[0]}.csv`, csv, (err) => { 
                    if (err) {return res.json({'message': err})};
                }); 
                res.json({'message': 'file was correcly loaded'})}

            )
        }catch (e){
            res.json({'message': e})
        }
    });
});

app.listen('3000', function(){
    console.log('running on 3000...');
});

