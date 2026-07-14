/**
 * 截图上传处理
 * 客户端将图片压缩为 base64 dataURL，存 jsonb 字段。
 * 大图片自动压缩到 <150KB，避免 postgres jsonb 超限。
 */

const MAX_WIDTH = 1200
const QUALITY = 0.7

/**
 * 将 File 压缩为 dataURL
 */
export async function fileToDataUrl(file: File): Promise<string> {
  if (file.size < 100 * 1024) {
    // 小文件直接读
    return readAsDataURL(file)
  }
  return compressImage(file)
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressImage(file: File): Promise<string> {
  const dataUrl = await readAsDataURL(file)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_WIDTH / img.width)
      const w = Math.floor(img.width * scale)
      const h = Math.floor(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      try {
        const output = canvas.toDataURL('image/jpeg', QUALITY)
        resolve(output)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
