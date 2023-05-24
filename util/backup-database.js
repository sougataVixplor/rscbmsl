const { exec } = require("child_process");
const env = process.env.NODE_ENV || 'development';
var nrc = require('node-run-cmd');
const fs = require('fs')
const config = require('../config/config')[env]
const username = config['username']
const password = config['password']
const port = config['port']
const database = config['database']
const host = config['host']
const path = require('path')
const backupLocation = path.join('.',config['backupLocation'])
const dotenv = require('dotenv');
dotenv.config();

async function getFileName(type) {
  try{
    if(type == 'backup'){
      var fileName = `database-backup.tar`;
      return path.join(process.cwd(),backupLocation,fileName)
    }
    else{
      var fileName = `database-backup.tar`;
      return path.join(process.cwd(),backupLocation,fileName)
    }
  }
  catch(error){
    console.error("getFileName:: ",error)
    throw error
  }
}


async function getBackup(fileName) {
  try{
    // Change the directory
    const basePath = process.cwd()
    // pgPath = path.join(process.cwd(),"pgDataLinux")
	//pgPath = "/usr/local/pgsql/bin"
    console.log("current directory = ",process.cwd())
	var files = await fs.readdirSync(process.cwd());
    console.log("files = ",files)
    var parentDir = await path.dirname(process.cwd());
    console.log("parentDir = ",parentDir)
    await process.chdir(parentDir);
    console.log("current directory = ",process.cwd())
	var files = await fs.readdirSync(process.cwd());
    console.log("files = ",files)
    var parentDir = await path.dirname(process.cwd());
    console.log("parentDir = ",parentDir)
    await process.chdir(parentDir);
    console.log("current directory = ",process.cwd())
	var files = await fs.readdirSync(process.cwd());
    console.log("files = ",files)
	for(var i = 0; i< files.length; i++){
		var currFile = files[i]
        console.log("currFile = ",currFile)
		try{
			var Lfiles = await fs.readdirSync(path.join(process.cwd(),currFile));
			console.log("Lfiles = ",Lfiles)
		}
		catch(error){
			console.error("error:: ",currFile)
		}
	}
    var parentDir = await path.dirname(process.cwd());
    console.log("parentDir = ",parentDir)
    await process.chdir(parentDir);
    console.log("current directory = ",process.cwd())
	var files = await fs.readdirSync(process.cwd());
    console.log("files = ",files)
	for(var i = 0; i< files.length; i++){
		var currFile = files[i]
        console.log("currFile = ",currFile)
		try{
			var Mfiles = await fs.readdirSync(path.join(process.cwd(),currFile));
			console.log("Mfiles = ",Mfiles)
		}
		catch(error){
			console.error("error:: ",currFile)
		}
	}
    //await process.chdir(pgPath);
    //console.log("current directory = ",process.cwd())

    dbLink = `postgresql://${username}:${password}@${host}:${port}/${database}`
    // pg_dump --dbname=postgresql://postgres:vixplor12345@127.0.0.1:5432/CBMSLDev -f backupDB.tar -F t
    // pg_dump --dbname=postgresql://postgres:vixplor12345@database-1.ccuvimy1g5m8.ap-south-1.rds.amazonaws.com:5432/CBMSL -f backupDB.tar -F t
    cmd = `pg_dump -d ${dbLink} -f ${fileName} -F t`
    // cmd = 'psql "dbname=CBMSL host=database-1.ccuvimy1g5m8.ap-south-1.rds.amazonaws.com user=postgres password=vixplor12345 port=5432 sslmode=require"'
    console.error("comand = ",cmd)
    //var resp = await nrc.run("cd ..")
    var resp = await nrc.run(cmd)
    console.log("resp = ",resp)
    // Revert the previous directory
    await process.chdir(basePath);
    console.log("current directory = ",process.cwd())
    //return resp
  }
  catch(error){
    console.error("getBackup:: ",error)
    throw error
  }
}

//pg_dump --dbname=postgresql://postgres:vixplor12345@database-1.ccuvimy1g5m8.ap-south-1.rds.amazonaws.com:5432/VixplorCloud -f backupDBVC.tar -F t
//pg_dump --dbname=postgresql://postgres:vixplor12345@127.0.0.1:5432/vums-dev -f backupPGCollegePracticalTest.tar -F t
//pg_restore --verbose --clean --no-acl --no-owner  -d postgresql://postgres:vixplor12345@database-1.ccuvimy1g5m8.ap-south-1.rds.amazonaws.com:5432/vums backupDBFormFillupData.tar
//pg_restore --verbose --clean --no-acl --no-owner  -d postgresql://postgres:vixplor12345@127.0.0.1:5432/vums-dev backupDBFormFillupData.tar

async function setRestore(fileNameGzip) {
  try{
    // Change the directory
    const basePath = process.cwd()
    //pgPath = path.join(process.cwd(),"pgDataLinux")
	pgPath = "/usr/local/pgsql/bin"
    console.log("current directory = ",process.cwd())
    await process.chdir(pgPath);
    console.log("current directory = ",process.cwd())

    dbLink = `postgresql://${username}:${password}@${host}:${port}/${database}`
    // pg_restore --verbose --clean --no-acl --no-owner  -d postgresql://postgres:vixplor12345@127.0.0.1:5432/CBMSLDev backupDB.tar
    cmd = `pg_restore --verbose --clean --no-acl --no-owner  -d ${dbLink}  ${fileNameGzip}`
    console.error("comand = ",cmd)
    var resp = await nrc.run(cmd)
    console.log("resp = ",resp)
    // Revert the previous directory
    await process.chdir(basePath);
    console.log("current directory = ",process.cwd())
    return resp
  }
  catch(error){
    console.error("setRestore:: ",error)
    throw error
  }
}

module.exports = {
  getBackup,
  setRestore,
  getFileName
}