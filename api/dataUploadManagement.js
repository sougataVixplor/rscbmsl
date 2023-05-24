
const bcrypt = require('bcrypt');
var crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sequelize = require('sequelize')
var XLSX = require('xlsx')
const localUpload = require('../util/storageLocal').upload;
const localgetPublicUrl = require('../util/storageLocal').getPublicUrl;
const trackActivity = require('../util/activityTrack').trackActivity;
const env = process.env.NODE_ENV || 'development';
var accessTokenSecret = require('../config/config')[env]['accessTokenSecret']
var refreshAccessTokenSecret = require('../config/config')[env]['refreshAccessTokenSecret']
var config = require('../config/config')[env]
var expTime = config.expTime
var backendUrl = config.backendUrl
var fs = require('fs');
const Op = sequelize.Op;
var pattern = /(\d{2})\/(\d{2})\/(\d{4})/;
const pattern1 = /(\d{2})\-(\d{2})\-(\d{4})/;
process.env.SECRET_KEY = 'secret';



module.exports = (app, db) =>
{

    


    async function getDate(dateString){
        var newDate = new Date()
        if(dateString.includes("/")){
            newDate = new Date(new Date(dateString.replace(pattern,'$3-$2-$1')).setHours(0,0,0))
        }
        else{
            newDate = new Date(new Date(dateString.replace(pattern1,'$3-$2-$1')).setHours(0,0,0))
        }
        // offset = 5.5
        // newDate = newDate + (3600000 * offset)
        // newDate = new Date(newDate)
        return newDate
    }



    async function ExcelDateToJSDate(date) {
        var fileDate =  new Date(Math.round((date - 25569)*86400*1000));
        var mon = fileDate.getMonth() + 1
        if(mon < 9){
            mon ='0'+mon
        }
        var day = fileDate.getDate()
        if(day < 9){
            day ='0'+day
        }
        var fileStr = day+"/"+mon+"/"+fileDate.getFullYear()
        console.error("fileStr = ",fileStr)
        fileDate = await getDate(fileStr)
        return fileDate
    }


    async function getDateObj(dateString){
        var newDate = new Date()
        if(dateString.toString().includes("/")){
            console.log("upsiData created at = ",dateString)
            newDate = await getDate(dateString)
        }
        else{
            newDate = await ExcelDateToJSDate(dateString)
        }
        return newDate
    }


    app.post('/uploadUPSI',async (req, res) =>{
        let upsi = {};
        try
        {
            var out  =  await localUpload.fields([{ name: 'upsiData', maxCount: 1}])(req, res, async function(err) {
                // console.log("name", req.body.name);
                try
                {
                    if (err) {
                        console.log("Either no file selected or upload error", err);
                        throw "NO UPSI Data Excel"
                    } 
                    // console.log(req.files);
                    if (req.files)  {
                        try
                        {
                            req.body["upsiData"] = localgetPublicUrl( req.files['upsiData'][0].filename?req.files['upsiData'][0].filename:
                                                                    req.files['upsiData'][0].key?req.files['upsiData'][0].key:
                                                                    req.files['upsiData'][0].originalname);
                            const path =  req.body['upsiData']  
                            console.log("path>>>>>>>>",path);                                     
                            var workbook = XLSX.readFile(req.body['upsiData']);
                            var sheet_name_list = workbook.SheetNames;
                            upsiData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
                            for(i=0;i<upsiData.length;i++){
                                const result = await db.sequelize.transaction(async (t) => {
                                    try{
                                        var record = upsiData[i]
                                        upsiData[i].createdAt = await getDateObj(record.createdAt)
                                        const UPSILogsData = await db.UPSILogs.create(upsiData[i],{transaction: t})
                                    }
                                    catch(error){
                                        console.error("error in upsiData insert",error)
                                        // throw error
                                    }
                                })
                            }
                            // delete temp created files
                            try {
                                fs.unlinkSync(path);
                                console.log("File is deleted.");
                            }
                            catch(error){
                                console.log("File delete error:: ",error);
                            }
                            res.status(200).json({'message':"upsi Data uploaded"})
                        }
                        catch(error){
                            console.error("Error in upsiData upload and read",error)
                            throw error
                        }  
                    }
                    else{
                        console.error("NO upsiData Excel")
                        }
                }
                catch(error){
                    console.error("Error in upsiData processing")
                    res.status(500).json({'message': "cann't upload upsiData:: "+error})
                }    
            })
        }
        catch(error){
            console.error("Error in upsiData addition")
            res.status(500).json({'message': "cann't add upsiData:: "+error})
        }
    });




    app.post('/uploadRequests',async (req, res) =>{
        let upsi = {};
        try
        {
            var out  =  await localUpload.fields([{ name: 'requestData', maxCount: 1}])(req, res, async function(err) {
                // console.log("name", req.body.name);
                try
                {
                    if (err) {
                        console.log("Either no file selected or upload error", err);
                        throw "NO request Data Excel"
                    } 
                    // console.log(req.files);
                    if (req.files)  {
                        try
                        {
                            req.body["requestData"] = localgetPublicUrl( req.files['requestData'][0].filename?req.files['requestData'][0].filename:
                                                                    req.files['requestData'][0].key?req.files['requestData'][0].key:
                                                                    req.files['requestData'][0].originalname);
                            const path =  req.body['requestData']  
                            console.log("path>>>>>>>>",path);                                     
                            var workbook = XLSX.readFile(req.body['requestData']);
                            var sheet_name_list = workbook.SheetNames;
                            requestData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
                            for(i=0;i<requestData.length;i++){
                                const result = await db.sequelize.transaction(async (t) => {
                                    try{
                                        var record = requestData[i]
                                        requestData[i].date_requested_from = await getDateObj(record.date_requested_from)
                                        requestData[i].date_requested_to = await getDateObj(record.date_requested_to)
                                        requestData[i].request_date = await getDateObj(record.request_date)
                                        requestData[i].approval_date = await getDateObj(record.approval_date)
                                        requestData[i].createdAt = await getDateObj(record.createdAt)
                                        const reqData = await db.Requests.create(requestData[i],{transaction: t})
                                    }
                                    catch(error){
                                        console.error("error in requestData insert",error)
                                        // throw error
                                    }
                                })
                            }
                            // delete temp created files
                            try {
                                fs.unlinkSync(path);
                                console.log("File is deleted.");
                            }
                            catch(error){
                                console.log("File delete error:: ",error);
                            }
                            res.status(200).json({'message':"request Data uploaded"})
                        }
                        catch(error){
                            console.error("Error in requestData upload and read",error)
                            throw error
                        }  
                    }
                    else{
                        console.error("NO requestData Excel")
                        }
                }
                catch(error){
                    console.error("Error in requestData processing")
                    res.status(500).json({'message': "cann't upload requestData:: "+error})
                }    
            })
        }
        catch(error){
            console.error("Error in requestData addition")
            res.status(500).json({'message': "cann't add requestData:: "+error})
        }
    });
        
}

