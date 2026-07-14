import { useState } from 'react'
import { Upload, Modal, Input, Button, Image, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { fileToDataUrl } from '../../api'
import type { ChatScreenshot } from './constants'
import './ScreenshotUpload.css'

interface Props {
  value?: ChatScreenshot[]
  onChange?: (screenshots: ChatScreenshot[]) => void
  maxCount?: number
  disabled?: boolean
}

export default function ScreenshotUpload({
  value = [],
  onChange,
  maxCount = 5,
  disabled = false,
}: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [captionEditing, setCaptionEditing] = useState<number | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')

  const handleBeforeUpload = async (file: File) => {
    if (value.length >= maxCount) {
      message.warning(`最多上传 ${maxCount} 张截图`)
      return Upload.LIST_IGNORE
    }
    if (!file.type.startsWith('image/')) {
      message.error('仅支持图片格式')
      return Upload.LIST_IGNORE
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('单张图片不超过 5MB')
      return Upload.LIST_IGNORE
    }
    try {
      const dataUrl = await fileToDataUrl(file)
      const next: ChatScreenshot = {
        url: dataUrl,
        caption: '',
        uploadedAt: new Date().toISOString(),
      }
      onChange?.([...value, next])
    } catch (e) {
      message.error('图片处理失败')
      console.error(e)
    }
    return Upload.LIST_IGNORE
  }

  const handleRemove = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange?.(next)
  }

  const openCaptionEdit = (index: number) => {
    setCaptionEditing(index)
    setCaptionDraft(value[index]?.caption || '')
  }

  const saveCaption = () => {
    if (captionEditing === null) return
    const next = value.map((item, i) =>
      i === captionEditing ? { ...item, caption: captionDraft } : item,
    )
    onChange?.(next)
    setCaptionEditing(null)
  }

  const fileList: UploadFile[] = []

  return (
    <div className="screenshot-upload">
      <div className="screenshot-thumbs">
        {value.map((item, index) => (
          <div className="screenshot-item" key={index}>
            <div
              className="screenshot-thumb-wrapper"
              onClick={() => {
                setPreviewIndex(index)
                setPreviewOpen(true)
              }}
            >
              <img src={item.url} alt={item.caption || `screenshot-${index}`} />
              {!disabled && (
                <Popconfirm
                  title="确认删除这张截图？"
                  onConfirm={(e) => {
                    e?.stopPropagation()
                    handleRemove(index)
                  }}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    className="thumb-delete-btn"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              )}
            </div>
            <div className="screenshot-caption" onClick={() => !disabled && openCaptionEdit(index)}>
              {item.caption ? (
                <span className="caption-text">{item.caption}</span>
              ) : (
                <span className="caption-placeholder">
                  {disabled ? '(无说明)' : '+ 添加说明'}
                </span>
              )}
            </div>
          </div>
        ))}

        {!disabled && value.length < maxCount && (
          <Upload
            fileList={fileList}
            beforeUpload={handleBeforeUpload}
            showUploadList={false}
            accept="image/*"
          >
            <div className="upload-btn">
              <PlusOutlined />
              <div>上传截图</div>
              <div className="upload-hint">
                {value.length}/{maxCount}
              </div>
            </div>
          </Upload>
        )}
      </div>

      {/* 大图预览 */}
      <Modal
        open={previewOpen}
        title={
          <span>
            <PictureOutlined /> 截图预览 ({previewIndex + 1} / {value.length})
          </span>
        }
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        centered
        getContainer={() => document.body}
      >
        {value[previewIndex] && (
          <div className="preview-wrapper">
            <Image
              src={value[previewIndex].url}
              alt="preview"
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
              preview={false}
            />
            {value[previewIndex].caption && (
              <div className="preview-caption">
                <strong>说明：</strong>
                {value[previewIndex].caption}
              </div>
            )}
            <div className="preview-nav">
              <Button
                disabled={previewIndex === 0}
                onClick={() => setPreviewIndex(previewIndex - 1)}
              >
                上一张
              </Button>
              <span>
                {previewIndex + 1} / {value.length}
              </span>
              <Button
                disabled={previewIndex === value.length - 1}
                onClick={() => setPreviewIndex(previewIndex + 1)}
              >
                下一张
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 编辑说明 */}
      <Modal
        open={captionEditing !== null}
        title="添加/编辑截图说明"
        onOk={saveCaption}
        onCancel={() => setCaptionEditing(null)}
        okText="保存"
        cancelText="取消"
        getContainer={() => document.body}
      >
        <Input.TextArea
          rows={3}
          maxLength={200}
          showCount
          placeholder="简要说明本张截图对应的沟通内容"
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
        />
      </Modal>
    </div>
  )
}
