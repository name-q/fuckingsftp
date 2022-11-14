#!/usr/bin/env node

const ora = require("ora");
const Client = require("ssh2-sftp-client");
const program = require("commander");
const pkg = require("./package.json");
const { getFilesInfo, getSftpConfig, formatSftpConfig } = require("./utils");
const copy = require("./copy");
const remove = require("./remove");
const inquirer = require('inquirer');
const {exec} = require('child_process');
const ProgressBar = require('progress')

// 选择执行脚本
let selects = {
  packageNames: [
    {
      type: 'checkbox',
      name: 'packageNames',
      message: '请选择要上传至服务器端的项目------------>',
      choices: ['mini-program', 'supplier', 'mall', 'boss', 'provider'],
    },
  ],
  needYarn: [
    {
      type: 'list',
      name: 'needYarn',
      message: '项目是否需要重新安装依赖(yarn)?',
      choices: ['Yes', 'No'],
    },
  ],
  needBuild: [
    {
      type: 'list',
      name: 'needBuild',
      message: '项目是否需要重新构建(yarn build ...)?',
      choices: ['Yes', 'No'],
    },
  ],
  miniH5orWechat: [
    {
      type: 'list',
      name: 'miniH5orWechat',
      message: 'mini-program打包成H5还是小程序?',
      choices: ['H5', 'Weapp'],
    },
  ],
};

(async () => {
  const { packageNames } = await inquirer.prompt(selects.packageNames);
  const { needYarn } = await inquirer.prompt(selects.needYarn);
  const { needBuild } = await inquirer.prompt(selects.needBuild);
  // console.log(packageNames,needYarn,needBuild,'<<<<<XXXX')
  // [ 'mini-program', 'supplier', 'boss' ] No Yes <<<<<XXXX
  let h5OrWechat = ''
  if (packageNames.includes('mini-program')) {
    const { miniH5orWechat } = await inquirer.prompt(selects.miniH5orWechat);
    h5OrWechat = miniH5orWechat
  }

  // 终端命令
  const proExec = reallyFuckingHi => new Promise((resolve, reject) => {
    if(!reallyFuckingHi) return 'whatareyoudoingman!'
    exec(reallyFuckingHi,{maxBuffer:1024*1024*10*packageNames.length},(error,stdout,stderr)=>{
      if(!error) {
        // success
        stderr ? resolve(stderr) : resolve(stdout)
      } else {
        reject(error)
      }
    })
  })

  // 执行选区命令
  // 1.拼接选区命令
  const terminal = 'cd .. && cd '
  let promiseallParams = []
  for (const iterator of packageNames) {
    let terminalItem = `${terminal}${iterator} && `
    // let terminalItem = `${terminal}demo && `
    if(needYarn === 'Yes') terminalItem += `yarn && `
    if(needBuild === 'Yes') {
      terminalItem += `yarn build `
      if(iterator === 'mini-program'){
        if(h5OrWechat === 'H5'){
          terminalItem += `h5 sass && `

        }else{
          terminalItem += `weapp cs && `
        }
      }else{
        terminalItem += `cs && `
      }
    }
    terminalItem += 'exit'
    // console.log(terminalItem,'<<<< DEBUG')
  // 载入promiseall
    promiseallParams.push(proExec(terminalItem))
  }
  let bar = new ProgressBar('[>:bar<]',{total:1000*promiseallParams.length})
  let timer = setInterval(()=>{
    bar.tick()
  },100)
  // 2.执行选区命令
  await Promise.all(promiseallParams)
  clearInterval(timer)
  if(h5OrWechat === 'Weapp') return console.log('finish')

  // 建立服务器链接
  console.log('命令行执行完成! 建立服务器链接...')
  const sftp = new Client();
  const spinner = ora();
  const sftpConfig = getSftpConfig();

    
  require('events').EventEmitter.defaultMaxListeners = 666;

  async function handle() {
    // 根据 packageNames 补充config中的
    // "localPath": "./dist",                       dist文件目录
    // "remotePath": "/export/App/xxx",             上传到服务器端目录
    // "protectedRemotePath": "/export/App/xxx",    服务器禁止操作的目录 防呆
    for (const iterator of packageNames) {
      sftpConfig.localPath = `../${iterator}/dist`
      sftpConfig.protectedRemotePath = ""
      // 小程序做额外处理
      if(iterator === 'mini-program'){
        sftpConfig.localPath = `../${iterator}/dist/h5`
        sftpConfig.remotePath = `/data/www/s2b/mobile/dist/h5`
      }else{
        sftpConfig.remotePath = `/data/www/s2b/${iterator}/dist`
      }
      const fmtSftpConfig = formatSftpConfig(
        sftpConfig,
        program.remove || program.copy
      );
      const options = {
        iterator,
        sftp,
        sftpConfig: fmtSftpConfig,
        filesInfo: getFilesInfo(fmtSftpConfig.localPath)
      };
      await remove(options);
      await copy(options);
    }
    sftp.end()
  }

  sftp.on("ready", () => {
    spinner.succeed(" SFTP: 已经连接 !");
  });

  sftp.on("end", () => {
    spinner.succeed(" SFTP: 断开连接 !");
  });

  sftp
    .connect(sftpConfig.connect)
    .then(handle)
    .catch(err => {
      throw err
    });

})()
