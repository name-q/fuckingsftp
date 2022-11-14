

### Usage
> 在根目录增加连接SSH的配置文件
```
// ./config.json
{
    "connect": {
        "host": "xxx.xxx.xxx.xxx",
        "port": 22,
        "username": "root",
        "password": "123456"
    }
}
```

> yarn安装依赖后 yarn start启动服务
```
脚本作用：
将本地项目并发 安装依赖或执行打包 后上传至服务器

脚本执行：<index.js>
选择同级目录中的[mini-program,supplier,mall,boss,provider]目录
选择执行 安装依赖🚌 
选择执行 打包命令📦 <可放开<<<< DEBUG查看执行命令>

将服务器中对应生产目录删除 <sftpConfig.remotePath,await remove(options);>

将打包后的文件上传至服务器SFTP <sftpConfig.remotePath,await copy(options);>
```

> 为何要做这个东西
```
叼毛公司Jenkins没配好
测试说没东西测了让我改一个打包一个上测试环境
```

> 为何不把目录结构拆好一点
```
等你呢
```