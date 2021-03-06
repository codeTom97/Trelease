/**
 * @description 阿里云OSS操作
 * @author codeTom97
 */

const OSS = require('ali-oss');
const FsExtends = require('../core/fs-extend');
const { log } = require('../utils/log');
const Slog = require('../core/progress');


class AliOss extends FsExtends {
    constructor(options) {
        super(); // 继承文件系统的操作

        this.accessKeyId = options.access || '';
        this.accessKeySecret = options.password || '';
        this.bucket = options.bucket || '';
        this.region = options.region || ''; // 仓库归属区域

        this.isSave = options.isSave || false; // 是否写入package.json
        this.options = options; // 全部配置文件

        this.fileList = options.filesList; // 待上传目录
        this.finishList = []; // 上传成功
        this.unfinishList = []; // 上传失败

        this.pb = new Slog(`正在上传至${options.bucket}`); // 初始化进度条

        this.init();
    }

    /**
     * 实例化仓库
     */
    async init() {
        // 初始化OSS SDK
        this.client = new OSS({
            accessKeyId: this.accessKeyId,
            accessKeySecret: this.accessKeySecret,
            bucket: this.bucket,
            region: this.region
        });

    }

    /**
     * 获取仓库信息
     */
    async getBucketInfo() {
        try {
            const result = await this.client.getBucketInfo(this.bucket)
            return result.bucket
        } catch (error) {
            log('red', error.toString());

            // 指定的存储空间不存在。
            if (error.name === 'NoSuchBucketError') {
                return {}
            }
        }
    }

    async create() {
        // try {
        //     const result = await this.client.putBucket(this.bucket)
        //     console.log('bucketInfo: ', result.bucket)
        // } catch (error) {
        //     // 指定的存储空间不存在。
        //     if (error.name === 'NoSuchBucketError') {
        //         console.log
        //     } else {
        //         console.log(error)
        //     }
        // }
    }

    /**
     * 上传OSS仓库
     * @param {*} fileName 
     * @param {*} filePath 
     */
    async upload() {
        const bucketInfo = await this.getBucketInfo() // 通过OSS实例获取仓库地址

        if (!bucketInfo) {
            log('red', 'ERROR: 仓库不存在, 请查看')
            process.exit(); // 强制退出终端
        }
        
        for (let i = 0, len = this.fileList.length; i < len; i++) {
            const item = this.fileList[i];

            try {
                const { res } = await this.client.put(item.key, item.localFile);
    
                res.statusCode === 200 ? this.finishList.push(item) : this.unfinishList.push(item);

                this.pb.render({ completed: this.finishList.length, total: len }); // 进度条记录

            } catch (error) {
                log('red', JSON.stringify(error));
                process.exit(); // 强制退出终端
            }
        }
        
        if (this.isSave) {
            this.saveOptions(this.options);
        }

        return {
            finish: this.finishList, 
            finishLen: this.finishList.length,
            unfinish: this.unfinishList,
            unfinishLen: this.unfinishList.length,
        }
    }
}


module.exports = AliOss