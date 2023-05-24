const decryptData = require('../util/common').decryptData;
const encryptData = require('../util/common').encryptData;

module.exports = (app, db) =>
{


    async function getAllFolios(empPAN){
        try{
            var fol = []
            var empData = await db.Employees.findAll({
                include:[{
                    model:db.Folios,
                    where: {
                        is_active: true,
                        emp_relative_pan: null
                    },
                    required:false     
                }],
                where:{
                    pan: empPAN,
                    is_active: true,
                    isManagement: false
                },
                required:false
            })
            console.error("empData:: ",empData.length)
            if(empData.length > 0){
                for(o=0;o<empData[0].Folios.length;o++){
                    fol.push(empData[0].Folios[o].dataValues)
                }
            }
            else{
                var empRelativesData = await db.Relatives.findAll({
                    include:[{
                        model:db.Folios,    
                        where: {
                            is_active: true
                        },
                        required:false 
                    }],
                    where:{
                        pan: empPAN,
                        is_active: true
                    },
                    required:false
                })
                console.error("empRelativesData:: ",empRelativesData)
                for(o=0;o<empRelativesData[0].Folios.length;o++){
                    fol.push(empRelativesData[0].Folios[o].dataValues)
                }
                console.error("fol:: ",fol)
                // this to push employee folio for relatives request
                // emp_pan = empRelativesData[0].emp_pan
                // var empData = await db.Employees.findAll({
                //     include:[{
                //         model:db.Folios,   
                //         where: {
                //             is_active: true,
                //             emp_relative_pan: null
                //         },
                //         required:false  
                //     }],
                //     where:{
                //         pan: emp_pan,
                //         is_active: true
                //     },
                //     required:false
                // })
                // for(p=0;p<empData[0].Folios.length;p++){
                //     fol.push(empData[0].Folios[p].dataValues)
                // }
            }
            return fol
        }
        catch(error){
            console.error("getAllFolios:: error: ",error)
            throw error
        }
    }

 
    

    app.get('/request/:id/folios', async (req,res) => {
        try{
            var reqData = await db.Requests.findOne({
                where:{
                    id: req.params.id
                }
            })
            console.log("reqData = ",reqData)
            var allFolios = await getAllFolios(reqData.pan)
            console.log("allFolios = ",allFolios)
            var respData = reqData.dataValues
            console.log("respData = ",respData)
            respData["allFolios"] = allFolios
            console.log("respData = ",respData)
            
            res.status(200).json({
                data: await encryptData(JSON.stringify({
                    'message':'Request Folio list fetched',
                    "data": respData
                }))
            })
            // res.status(200).json({data: respData})
        }
        catch(error){
            console.error("request fetch error", error);
            res.status(500).json({message:"request fetch error:: "+error})
        }    
    })


    app.get('/folios', (req,res) => {
        console.error("req user", req.user)
        db.Employees.findByPk(req.user.userPAN,{
            attributes:[],
            include:[
                {
                    model:db.Folios,
                    where: {
                        is_active: true,
                        emp_relative_pan: null
                    },
                    required:false 
                },
                {
                    model:db.Relatives,
                    include:[
                        {
                            model:db.Folios,
                            where:{
                                ...req.query
                            },
                            required:false
                        }
                    ],
                    where: {
                        is_active: true,
                        status: "Active"
                    },
                    required:false
                }
            ]
        }) 
        .then(async data => {
            console.log("folio list fetched");
            res.status(200).json({
                data: await encryptData(JSON.stringify({
                    'message':'Folio list fetched',
                    "data": data
                }))
            })
            // res.status(200).json({message:'Folio list fetched', data})
        }) 
        .catch(err => {
            console.error("Folio list fetch error", err);
            res.status(500).json({message:"Db error:: "+err})
        })
    })


}

