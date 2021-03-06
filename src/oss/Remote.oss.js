/**
 * @description 自定义服务器 操作
 * @author codeTom97
 */

const FormData = require('form-data');
const FsExtends = require('../core/fs-extend');
const { log } = require('../utils/log');
const Slog = require('../core/progress');


class RemoteOss extends FsExtends {
    constructor(options = {}) {
        super();
        
        this.remoteUrl = options.url; // 上传地址
        this.bucket = options.bucket || ''; // 远端项目

        this.isSave = options.isSave; // 是否保存

        this.options = options; // 缓存配置

        this.fileList = options.filesList; // 待上传目录
        this.finishList = []; // 上传成功
        this.unfinishList = []; // 上传失败

        this.pb = new Slog(`正在上传至${options.bucket}`); // 初始化进度条

        this.init();
    }

    /**
     * 初始化
     */
    init () {
        // TODO
    }

    /**
     * 上传
     */
    async upload () {
        for (let i = 0, len = this.fileList.length; i < len; i++) {
            try {
                const fileItem = this.fileList[i];
                
                const { code } = await this.putFile(fileItem);
                
                code === 200 ? this.finishList.push(fileItem) : this.unfinishList.push(fileItem);

                this.pb.render({ completed: this.finishList.length, total: len }); // 进度条记录

            } catch (err) {
                log('red', JSON.stringify(err));
                process.exit();
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


    /**
     * 组装FormData格式 上传
     * @param {*} file 文件格式
     */
    putFile (file) {
        return new Promise((reslove, reject) => {
            const formData = new FormData();
            formData.append('file', this.getFileStream(file.localFile), file.key);
            formData.append('bucket', this.bucket);
            formData.append('resource', file.resource);
    
            formData.submit(this.remoteUrl, (err, response) => {
                if (err) {
                    reject({ code: err.statusCode , message: err.statusMessage });
                }
                
                if (response.statusCode == 200) {
                    reslove({ code: response.statusCode });
                } else {
                    reject({ code: response.statusCode , message: response.statusMessage });
                }
            });
        })
        
    }
}


module.exports = RemoteOss