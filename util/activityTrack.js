var trackActivity = async (data,db) =>{
    try{
        let activity_id
        console.error("data = ",data)
        if("activityId" in data){
            // update activity status
            console.error("Update Activity:: ")
            var newData = {status: "Success"}
            if("done_for" in data){
                var done_for = data.done_for
                var done_for_info = ""
                for(k=0;k<done_for.length;k++){
                    try{
                        var empId = Number(done_for[k])
                        console.error("empId:: ",empId)
                        if(("done_for_relative" in data) && data.done_for_relative){
                            var relData = await db.Relatives.findOne({
                                where:{
                                    id: empId
                                }
                            })
                            done_for_info += relData.name+","
                        }
                        else{
                            var empData = await db.Employees.findOne({
                                where:{
                                    id: empId
                                }
                            })
                            done_for_info += empData.name+","

                        }
                    }
                    catch(error){
                        console.error("done_for[k]:: ",done_for[k])
                        done_for_info += done_for[k]+","
                    } 
                }
                done_for_info = done_for_info.substring(0,done_for_info.length-1)
                console.error("done_by_info:: ",done_by)
                console.error("done_for_info:: ",done_for)
                console.error("done_by_info:: ",done_by_info)
                console.error("done_for_info:: ",done_for_info)
                newData["done_for"] = done_for_info
            }
            var updatedActivity = await db.ActivityLogs.update(newData,{
                where:{
                    id: data.activityId
                }
            })
            if(updatedActivity[0] > 0){
                activity_id = updatedActivity.id
            }
            else{
                throw DATABASE_ERROR
            }
        }
        else{
            // add new activity
            console.error("Insert Activity:: ")
            var done_by = data.done_by
            var done_for = data.done_for
            console.error("done_by:: ",done_by)
            console.error("done_for:: ",done_for)
            var done_by_info = ""
            for(i=0;i<done_by.length;i++){
                try{
                    var empId = Number(done_by[i])
                    console.error("empId:: ",empId)
                    
                    if(("done_by_relative" in data) && data.done_by_relative){
                        var relData = await db.Relatives.findOne({
                            where:{
                                id: empId
                            }
                        })
                        // console.error("empData:: ",empData)
                        done_by_info += relData.name+","
                    }
                    else{
                        var empData = await db.Employees.findOne({
                            where:{
                                id: empId
                            }
                        })
                        // console.error("empData:: ",empData)
                        done_by_info += empData.name+","
                    }
                }
                catch(error){
                    console.error("done_by[i]:: ",done_by[i])
                    done_by_info += done_by[i]+","
                }
            }
            done_by_info = done_by_info.substring(0,done_by_info.length-1)
            var done_for_info = ""
            for(j=0;j<done_for.length;j++){
                try{
                    var empId = Number(done_for[j])
                    console.error("empId:: ",empId)
                    if(("done_for_relative" in data) && data.done_for_relative){
                        var relData = await db.Relatives.findOne({
                            where:{
                                id: empId
                            }
                        })
                        // console.error("empData:: ",empData)
                        done_for_info += relData.name+","
                    }
                    else{
                        var empData = await db.Employees.findOne({
                            where:{
                                id: empId
                            }
                        })
                        // console.error("empData:: ",empData)
                        done_for_info += empData.name+","
                    }
                }
                catch(error){
                    console.error("done_for[j]:: ",done_for[j])
                    done_for_info += done_for[j]+","
                } 
            }
            done_for_info = done_for_info.substring(0,done_for_info.length-1)
            console.error("done_by_info:: ",done_by)
            console.error("done_for_info:: ",done_for)
            console.error("done_by_info:: ",done_by_info)
            console.error("done_for_info:: ",done_for_info)
            var newActivityData = {"activity": data.activity,"description": data.description,
            "done_by": done_by_info,"done_for": done_for_info,"status": "Fail"}
            if(data.hasOwnProperty("period")){
                newActivityData["period"] = data.period
            }
            var newActivity = await db.ActivityLogs.create(newActivityData)
            activity_id = newActivity.id
        }
        return activity_id
    }
    catch(error){
        console.error("trackActivity:: error: ",error)
        throw error
    }
};

module.exports ={
    trackActivity
} 