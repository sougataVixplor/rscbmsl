const sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development';
const sentMail = require('../util/SentMail').sentMail;
const pdfGeneration = require('../util/pdfGeneration');
const getAnnexure4  = require('../util/pdfGeneration').getAnnexure4;
const getAnnexure6  = require('../util/pdfGeneration').getAnnexure6;
const getAnnexure5  = require('../util/pdfGeneration').getAnnexure5;
const {getAnnexure1And2} = require('../util/pdfGeneration');
const {getAnnexure3} = require('../util/pdfGeneration');
const getUpdatedText = require('../util/common').getUpdatedText;
var config = require('../config/config')[env]
var backendUrl = config.backendUrl
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

    
    async function getEmpDetails(empPAN){
        try{
            var empData = await db.Employees.findAll({
                where:{
                    pan: empPAN,
                    is_active: true,
                    isManagement: false
                }
            })
            return empData
        }
        catch(error){
            console.error("getEmpDetails:: error: ",error)
            throw error
        }
    }

    
    async function getEmpRelDetails(empPAN){
        try{
            var empData = await db.Relatives.findAll({
                where:{
                    pan: empPAN,
                    is_active: true
                }
            })
            return empData
        }
        catch(error){
            console.error("getEmpRelDetails:: error: ",error)
            throw error
        }
    }


    async function getDateString(refDate){
       try{
            refDateStr = (refDate.getDate())+"-"+(refDate.getMonth()+1)+"-"+(refDate.getFullYear())
            return refDateStr
       }
       catch(error){
           console.error("getDateString:: error: ",error)
           throw error
       }
    }


    app.post('/sendMail/:type',async (req, res) =>{
        let weeklyData = {};
        try
        {
            var mailIds = []
            var mailresponses = []
            var subject = ""
            var text = ""
            try
            {
                var allFiles = []
                if (req.params.type == 'New_cp_added'){

                    // fetch data
                    var admin = await db.Employees.findOne({
                        include:[{
                            model:db.Company
                        }],
                        where:{
                            is_compliance:true,
                            isManagement: false
                        },
                        required:false
                    })
                    var data = await db.Employees.findOne({
                        include:[{
                            model:db.Relatives,
                            include:[{
                                model:db.Folios,
                                where: {
                                    is_active: true
                                },
                                required:false
                            }],
                            where: {
                                is_active: true
                            },
                            required:false
                        },
                        {
                            model:db.Folios,
                            where: {
                                is_active: true
                            },
                            required:false
                        }],
                        where:{
                            id:req.query.user_id,
                            isManagement: false
                        }
                    })
                    mailIds.push(admin.email)

                    // forming Mail
                    var templateData = await db.Templates.findOne({
                        where:{
                            type: "New_cp_added"
                        }
                    })
                    var variables = [admin.name,data.name]
                    subject = templateData.subject
                    text = await getUpdatedText(templateData.body,variables)
                    console.error("text = ")
                    console.error(text)

                    // generate pdf
                    data["emp"] = data
                    data["folios"] = data.Folios
                    data["admin"] = admin
                    var anex6 = await getAnnexure6(data)
                    allFiles.push({
                        filename:'annexure-6-primary.pdf',
                        content:anex6
                    })

                    data["relatives"] = data.Relatives
                    var anex5 = await getAnnexure5(data)
                    allFiles.push({
                        filename:'annexure-5-primary.pdf',
                        content:anex5
                    })
                    var relData = []
                    if(data.Relatives){
                        for(var i=0;i<data.Relatives.length;i++){
                            var rel = data.Relatives[i]
                            rel["admin"] = admin
                            rel["folios"] = rel.Folios
                            rel["emp"] = []
                            var anex = await getAnnexure6(rel)
                            relData.push({
                                filename:'annexure-6-rel-'+i+'-.pdf',
                                content:anex
                            })
                        }
                    }

                    // add file to attachments of Mail
                    allFiles = allFiles.concat(relData)
                }
                else if (req.params.type == 'New_cp_login_details'){

                    // fetch data
                    var admin = await db.Employees.findOne({
                        include:[{
                            model:db.Company
                        }],
                        where:{
                            is_compliance:true,
                            isManagement: false
                        },
                        required:false
                    })
                    var data = await db.Employees.findOne({
                        where:{
                            id:req.query.user_id,
                            isManagement: false
                        }
                    })
                    mailIds.push(data.email)

                    // forming Mail
                    var templateData = await db.Templates.findOne({
                        where:{
                            type: "New_cp_login_details"
                        }
                    })
                    var variables = [data.name, backendUrl, data.email, data.pan, admin.Company.name, admin.name]
                    subject = templateData.subject
                    text = await getUpdatedText(templateData.body,variables)
                    console.error("subject = ")
                    console.error(subject)
                    console.error("text = ")
                    console.error(text)

                }
                else if(req.params.type == 'Cp_update_request'){
                    
                    // fetch data
                    var admin = await db.Employees.findOne({
                        include:[{
                            model:db.Company
                        }],
                        where:{
                            is_compliance:true,
                            isManagement: false
                        },
                        required:false
                    })
                    var empData = await db.Employees.findOne({
                        include:[{
                            model:db.Relatives,
                            include:[{
                                model:db.Folios,
                                where: {
                                    is_active: true
                                },
                                required:false
                            }],
                            where: {
                                is_active: true
                            },
                            required:false
                        },
                        {
                            model:db.Folios,
                            where: {
                                is_active: true
                            },
                            required:false
                        }],
                        where:{
                            id:req.query.user_id,
                            isManagement: false
                        }
                    })
                    
                    // forming Mail
                    mailIds.push(admin.email)
                    var templateData = await db.Templates.findOne({
                        where:{
                            type: "Cp_update_request"
                        }
                    })
                    var variables = [admin.name,empData.name]
                    subject = templateData.subject
                    text = await getUpdatedText(templateData.body,variables)
                    console.error("text = ")
                    console.error(text)

                    // generate pdf
                    var data = empData.temp_info
                    // var data = JSON.parse(empData.temp_info)
                    data["emp"] = empData
                    data["folios"] = empData.Folios
                    data["admin"] = admin
                    var anex6 = await getAnnexure6(data)
                    allFiles.push({
                        filename:'annexure-6-primary.pdf',
                        content:anex6
                    })
                    data["relatives"] = empData.Relatives
                    var anex5 = await getAnnexure5(data)
                    allFiles.push({
                        filename:'annexure-5-primary.pdf',
                        content:anex5
                    })
                    var relData = []
                    if(data.relatives){
                        for(var i=0;i<data.relatives.length;i++){
                            var rel = data.relatives[i]
                            rel["admin"] = admin
                            rel["folios"] = rel.Folios
                            rel["emp"] = []
                            var anex = await getAnnexure6(rel)
                            relData.push({
                                filename:'annexure-6-rel-'+i+'-.pdf',
                                content:anex
                            })
                        }
                    }
                    
                    // add file to attachments of Mail
                    allFiles = allFiles.concat(relData)
                }
                else if(req.params.type == 'New_transaction_request'){
                    
                    // fetch data 
                    var EmployeeData = await db.Employees.findAll({ 
                            where:{
                                is_compliance:true,
								isManagement: false
                            }   
                    })
                    for(e=0;e<EmployeeData.length;e++){
                        mailIds.push(EmployeeData[e].email)
                    }
                    var requestId = req.query.request_id
                    var requestData = await db.Requests.findOne({
                            where:{
                                id: requestId
                            },
                            include:[{
                                model:db.Folios,
                                include:[{
                                    model:db.Employees,    
                                }]   
                            }]
                        })
                    var empName = requestData.Folio.Employee.name
                    requestData.date_requested_from = await getDateString(requestData.date_requested_from)
                    requestData.date_requested_to = await getDateString(requestData.date_requested_to)
                    
                    // forming Mail 
                    var templateData = await db.Templates.findOne({
                        where:{
                            type: "New_transaction_request"
                        }
                    })
                    var variables = [EmployeeData[0].name,empName]
                    subject = templateData.subject
                    text = await getUpdatedText(templateData.body,variables)
                    console.error("text = ")
                    console.error(text)
                    
                    // generate pdf 
                    var EmployeeData = await db.Employees.findOne({ 
                                include:[{
                                            model:db.Company, 
                                            include:[
                                                {
                                                    model:db.Employees,
                                                    where:{
                                                        is_compliance:true
                                                    },
                                                    required:false 
                                                }
                                            ]   
                                        },
                                        {
                                            model:db.Relatives,
                                            where: {
                                                is_active: true,  
                                            },
                                            required:false     
                                        },
                                        {
                                            model:db.Folios   
                                        }],
                                where: {
                                    id: req.user.userId,
                                    isManagement: false
                                }   
                            })        
                    var FolioData = await db.Folios.findOne({ 
                        where: {
                            id: requestData.Folio.id ,  
                        }
                    })
                    var r_data = {} 
                    r_data["body"] = requestData
                    folio_id = requestData.Folio.id 
                    r_data["body"]["folio_id"] = folio_id 
                    var reqPDF = await getAnnexure1And2(r_data, EmployeeData, FolioData, db,requestId)

                    // add file to attachments of Mail 
                    allFiles.push({
                        filename:'annexure1&2.pdf',
                        content:reqPDF
                    })
                    
                }
                else if(req.params.type == 'Transaction_request_appoved'){
                    if("request_id" in req.query){

                        // fetch data 
                        var requestData = await db.Requests.findOne({
                            where:{
                                id: req.query.request_id
                            },
                            include:[{
                                model:db.Folios,
                                include:[{
                                    model:db.Employees,   
                                    where:{
                                        isManagement: false
                                    },
                                    include:[{
                                            model:db.Company,    
                                    }] 
                                }]   
                            }]
                        })
                        mailIds.push(requestData.Folio.Employee.email)
                        var coData = await db.Employees.findOne({ 
                                where:{
                                    is_compliance:true,
                                    isManagement: false
                                }   
                        })
                        var CompanyData = requestData.Folio.Employee.Company

                        // forming Mail 
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Transaction_request_appoved"
                            }
                        })
                        var variables = [requestData.Folio.Employee.name,CompanyData.name,coData.name]
                        subject = templateData.subject
                        text = await getUpdatedText(templateData.body,variables)
                        console.error("text = ")
                        console.error(text)

                        // generate pdf
                        var EmployeeData = requestData.Folio.Employee
                        var KMP_Name = EmployeeData.name
                        var designation = EmployeeData.designation
                        var company = EmployeeData.Company.name
                        var add = EmployeeData.address
                        var request_quantity = Number(requestData.request_quantity)
                        var request_date = requestData.request_date
                        var request_status = requestData.request_status
                        
                        var date_requested_to = requestData.date_requested_to
                        data = {KMP_Name: KMP_Name,designation: designation,
                                add: add,requestData_id: requestData.id,company: company,
                                request_status: request_status,date_requested_to: date_requested_to,
                                request_quantity: request_quantity,request_date: request_date, reason: requestData.reason}
                        
                        var reqPDF = await getAnnexure3(data)               

                        // add file to attachments of Mail 
                        allFiles.push({
                            filename: 'annexure3.pdf',
                            content: reqPDF
                        })
                    }
                    else{
                        console.error("No request_id received")
                        res.status(500).json({'message': "No request_id received"})
                    }
                }
                else if(req.params.type == 'Transaction_request_rejected'){

                    // fetch data 
                    if("request_id" in req.query){
                        var requestData = await db.Requests.findOne({
                            where:{
                                id: req.query.request_id
                            },
                            include:[{
                                model:db.Folios,
                                include:[{
                                    model:db.Employees,   
                                    where:{
                                        isManagement: false
                                    },
                                    include:[{
                                            model:db.Company,    
                                    }] 
                                }]   
                            }]
                        })
                        mailIds.push(requestData.Folio.Employee.email)
                        var coData = await db.Employees.findOne({ 
                                where:{
                                    is_compliance:true,
                                    isManagement: false
                                }   
                        })
                        var CompanyData = requestData.Folio.Employee.Company

                        // forming Mail 
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Transaction_request_rejected"
                            }
                        })
                        var variables = [requestData.Folio.Employee.name,CompanyData.name,coData.name]
                        subject = templateData.subject
                        text = await getUpdatedText(templateData.body,variables)
                        console.error("text = ")
                        console.error(text)

                        // generate pdf
                        var EmployeeData = requestData.Folio.Employee
                        var KMP_Name = EmployeeData.name
                        var designation = EmployeeData.designation
                        var company = EmployeeData.Company.name
                        var add = EmployeeData.address
                        var request_quantity = Number(requestData.request_quantity)
                        var request_date = requestData.request_date
                        var request_status = requestData.request_status
                        
                        var date_requested_to = requestData.date_requested_to
                        data = {KMP_Name: KMP_Name,designation: designation,
                                add: add,requestData_id: requestData.id,company: company,
                                request_status: request_status,date_requested_to: date_requested_to,
                                request_quantity: request_quantity,request_date: request_date, reason: requestData.reason}
                        var reqPDF = await getAnnexure3(data)             

                        // add file to attachments of Mail 
                        allFiles.push({
                            filename: 'annexure3.pdf',
                            content: reqPDF
                        })
                    }
                    else{
                        console.error("No request_id received")
                        res.status(500).json({'message': "No request_id received"})
                    }
                }
                else if(req.params.type == 'Transaction_details_submit'){

                    // fetch data
                    var EmployeeData = await db.Employees.findAll({ 
                        where:{
                            is_compliance:true,
                            isManagement: false
                        }   
                    })
                    for(e=0;e<EmployeeData.length;e++){
                        mailIds.push(EmployeeData[e].email)
                    }
                    var reqData = await db.Requests.findOne({
                        where:{
                            id: req.query.request_id
                        },
                        include:[{
                            model:db.Folios,
                            include:[{
                                model:db.Employees,   
                                where:{
    								isManagement: false
                                },
                                include:[{
                                        model:db.Company,    
                                }] 
                            }]   
                        }]
                    })

                    // forming Mail 
                    var templateData = await db.Templates.findOne({
                        where:{
                            type: "Transaction_details_submit"
                        }
                    })
                    var variables = [EmployeeData[0].name,reqData.Folio.Employee.name]
                    subject = templateData.subject
                    text = await getUpdatedText(templateData.body,variables)
                    console.error("text = ")
                    console.error(text)

                    // generation Pdf
                    var company = reqData.Folio.Employee.Company.name
                    console.log("company = ",company)
                    var pan = reqData.pan
                    var security_type = reqData.security_type
                    var request_type = reqData.request_type
                    var trans_folio = reqData.trans_folio
                    var transaction_price = reqData.transaction_price
                    var transaction_quantity = reqData.transaction_quantity
                    var transaction_date = reqData.transaction_date
                    let empData = []
                    empData = await getEmpDetails(pan)
                    if(empData.length == 0){
                        empData = await getEmpRelDetails(pan)
                    }
                    var name = empData[0].name

                    data = {reqId: req.query.request_id,name: name,transaction_quantity: transaction_quantity,
                        request_type: request_type,trans_folio: trans_folio,transaction_date: transaction_date,
                        transaction_price: transaction_price,company: company}
                    doc = await getAnnexure4(data)

                    // add file to attachments of Mail 
                    allFiles.push({
                        filename: 'Annexure4.pdf',
                        content: doc
                    })
                }
                else if(req.params.type == 'Cp_update_approved'){
                    if("user_id" in req.query){

                        // fetch data
                        var EmployeeData = await db.Employees.findAll({ 
                                where:{
                                    id: req.query.user_id,
                                    isManagement: false
                                }   
                        })
                        for(e=0;e<EmployeeData.length;e++){
                            mailIds.push(EmployeeData[e].email)
                        }
                        var admin = await db.Employees.findOne({
                            include:[{
                                model:db.Company
                            }],
                            where:{
                                is_compliance:true,
								isManagement: false
                            },
                            required:false
                        })
                        var CompanyData = admin.Company

                        // forming mail
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Cp_update_approved"
                            }
                        })
                        var variables = [EmployeeData[0].name,CompanyData.name,admin.name]
                        subject = templateData.subject
                        text = await getUpdatedText(templateData.body,variables)
                        console.error("text = ")
                        console.error(text)
                    }
                    else{
                        console.error("No user_id received")
                        res.status(500).json({'message': "No user_id received"})
                    }
                }
                else if(req.params.type == 'Cp_update_rejected'){
                    if("user_id" in req.query){

                        // fetch data
                        var EmployeeData = await db.Employees.findAll({ 
                                where:{
                                    id: req.query.user_id
                                }   
                        })
                        for(e=0;e<EmployeeData.length;e++){
                            mailIds.push(EmployeeData[e].email)
                        }
                        var admin = await db.Employees.findOne({
                            include:[{
                                model:db.Company
                            }],
                            where:{
                                is_compliance:true,
								isManagement: false
                            },
                            required:false
                        })
                        var CompanyData = admin.Company

                        // forming mail
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Cp_update_rejected"
                            }
                        })
                        var variables = [EmployeeData[0].name,EmployeeData[0].reason,CompanyData.name,admin.name]
                        subject = templateData.subject
                        text = await getUpdatedText(templateData.body,variables)
                        console.error("text = ")
                        console.error(text)
                    }
                    else{
                        console.error("No user_id received")
                        res.status(500).json({'message': "No user_id received"})
                    }
                }
                else if(req.params.type == 'Window_closure'){

                    // fetch data
                    var emps = await db.Employees.findAll({
                        where:{
                            is_active: true,
                            is_compliance: false,
                            isManagement: false
                        },
                        include:[{model:db.Company}]
                    })
                    console.error("emps = ",emps)
                    if(emps.length > 0){
                        // var mailIds = []
                        for(e=0;e<emps.length;e++){
                            mailIds.push(emps[e].email)
                        }
                        var coData = await db.Employees.findOne({
                            where:{
                                is_active: true,
                                is_compliance: true,
								isManagement: false
                            }
                        })

                        // forming mail
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Window_closure"
                            }
                        })
                        var window_close_from = emps[0].Company.window_close_from
                        var window_close_from_str = window_close_from.getDate()+"-"+(window_close_from.getMonth()+1)+"-"+window_close_from.getFullYear()
                        var window_close_to = emps[0].Company.window_close_to
                        var window_close_to_str = window_close_to.getDate()+"-"+(window_close_to.getMonth()+1)+"-"+window_close_to.getFullYear()
                        var variables = [window_close_from_str, window_close_to_str,emps[0].Company.purpose, emps[0].Company.name, coData.name]
                        subject = templateData.subject
                        text = await getUpdatedText(templateData.body,variables)
                        console.error("text = ")
                        console.error(text)
                    }
                    else{
                        console.error("No CP added yet !!")
                    }
                }
                else if(req.params.type == 'Cp_annual_declaration'){

                    // fetch data
                    var emps = await db.Employees.findAll({
                        where:{
                            is_active: true,
                            is_compliance: false,
                            isManagement: false
                        },
                        include:[{model:db.Company}]
                    })
                    console.error("emps = ",emps)
                    if(emps.length > 0){
                        // var mailIds = []
                        var coData = await db.Employees.findOne({
                            where:{
                                is_active: true,
                                is_compliance: true,
								isManagement: false
                            }
                        })

                        // forming mail
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Cp_annual_declaration"
                            }
                        })
                        subject = templateData.subject
                        for(e=0;e<emps.length;e++){
                            var variables = [emps[0].Company.name, backendUrl,emps[0].Company.meta_tag,emps[e].email,emps[e].pan,coData.name, emps[0].Company.name]
                            text = await getUpdatedText(templateData.body,variables)
                            console.error("text = ")
                            console.error(text)
                            mailIds.push({email: emps[e].email,text: text})
                        }
                    }
                    else{
                        console.error("No CP added yet !!")
                    }
                }
                else if(req.params.type == 'Co_annual_declaration'){

                    // fetch data
                    var emps = await db.Employees.findAll({
                        where:{
                            is_active: true,
                            is_compliance: true,
                            isManagement: false
                        },
                        include:[{model:db.Company}]
                    })
                    console.error("emps = ",emps)
                    if(emps.length > 0){
                        // var mailIds = []
                        var coData = await db.Employees.findOne({
                            where:{
                                is_active: true,
                                is_compliance: true,
								isManagement: false
                            }
                        })

                        // forming mail
                        var templateData = await db.Templates.findOne({
                            where:{
                                type: "Cp_annual_declaration"
                            }
                        })
                        subject = templateData.subject
                        for(e=0;e<emps.length;e++){
                            var variables = [emps[0].Company.name, backendUrl,emps[0].Company.meta_tag,emps[e].email,emps[e].pan,coData.name, emps[0].Company.name]
                            text = await getUpdatedText(templateData.body,variables)
                            console.error("text = ")
                            console.error(text)
                            mailIds.push({email: emps[e].email,text: text})
                        }
                    }
                    else{
                        console.error("No CO added yet !!")
                    }
                }
                else{
                    console.error("unlisted type")
                    res.status(500).json({'message': "unlisted type"})
                }

                // sending mail
                if(req.params.type == "Cp_annual_declaration" || req.params.type == "Co_annual_declaration"){
                    for(x=0; x<mailIds.length; x++){
                        var mailRes = await sentMail({
                            to: mailIds[x].email,
                            subject: subject,
                            text: mailIds[x].text,
                            attachments:allFiles
                        })
                        mailresponses.push(mailRes)
                    }
                }
                else{
                    for(x=0; x<mailIds.length; x++){
                        var mailRes = await sentMail({
                            to: mailIds[x],
                            subject: subject,
                            text: text,
                            attachments:allFiles
                        })
                        mailresponses.push(mailRes)
                    }
                }
                // var mailRes = await sentMail({
                //     to: mailIds,
                //     subject: subject,
                //     text: text,
                //     attachments:allFiles
                // })
                res.status(200).json({message:"mail sent",  "mailresponses": mailresponses})
            }
            catch(error){
                console.error("Error while processing mail info:: ",error)
                throw error
            }
        }
        catch(error){
            console.error("Error while sending mail:: ",error)
            res.status(500).json({'message': "Error while sending mail:: "+error})
        }
    })      
}