const fs = require('fs')
const path = require('path')

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('ali', {
      handle,
      name: '阿里图床',
      config: config
    })
  }
  const postOptions = (xman_t, image) => {
    return {
      method: 'POST',
      url: `https://filebroker.aliexpress.com/x/upload`,
      headers: {
        contentType: 'multipart/form-data',
        'Cookie': `xman_t=${xman_t}`
      },
      formData: {
        file: image,
        bizCode: 'ae_profile_avatar_upload'
      }
    }
  }
  const handle = async (ctx) => {
    let userConfig = ctx.getConfig('picBed.ali')
    if (!userConfig.xman_t) {
      ctx.emit('notification', {
        title: '请先配置xman_t,配置详细查看README.md',
      })
      return
    }
    try {
      const imgList = ctx.output
      for (let i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }
        const data = new Uint8Array(image)
        const fileName = imgList[i].fileName
        const filePath = path.join(__dirname, fileName)
        await fs.writeFileSync(filePath, data)
        const postConfig = postOptions(userConfig.xman_t, fs.createReadStream(filePath))
        let body = await ctx.Request.request(postConfig)
        fs.unlink(filePath, () => {})
        const res = JSON.parse(body)
        if (res && res.url) {
          delete imgList[i].base64Image
          delete imgList[i].buffer
          imgList[i]['imgUrl'] = res.url
        }
      }
    } catch (e) {
      ctx.emit('notification', {
        title: '上传失败',
        body: e.message
      })
      throw new Error(e.message)
    }
    return ctx
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.ali')
    if (!userConfig) {
      userConfig = {}
    }
    return [
      {
        name: 'xman_t',
        type: 'input',
        default: userConfig.xman_t,
        alias: 'xman_t'
      }
    ]
  }
  return {
    uploader: 'ali',
    register
  }
}
