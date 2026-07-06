import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import './App.css'

type Skill = {
  id: string
  displayName: string
  name: string
  description: string
}

type UploadSlot = {
  id: string
  label: string
  hint: string
}

type Direction = {
  id: string
  title: string
  description: string
}

type AnalyzeResult = {
  projectId: string
  message?: string
  providerError?: string
  directions?: Direction[]
  imagePrompt?: {
    positive?: string
    negative?: string
    size?: string
  }
  uploadedFiles?: Array<{
    originalName: string
    url: string
  }>
}

type GeneratedImage = {
  imageUrl: string
  title: string
}

const uploadSlots: UploadSlot[] = [
  { id: 'front', label: '正视图', hint: '商品正面、主图角度' },
  { id: 'left', label: '左侧视图', hint: '左侧轮廓与厚度' },
  { id: 'back', label: '背面', hint: '背部结构、标签或接口' },
  { id: 'right', label: '右侧视图', hint: '右侧轮廓与细节' },
  { id: 'top', label: '顶部', hint: '顶部按钮、开口或纹理' },
  { id: 'bottom', label: '底部', hint: '底标、脚垫或底座' },
  { id: 'detail', label: '细节特写', hint: 'Logo、材质、纹理、接口' },
  { id: 'package', label: '包装/配件', hint: '包装盒、配件、套装' },
]

const viewCounts = [3, 6, 9, 12]

function App() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [skill, setSkill] = useState<Skill | null>(null)
  const [filesBySlot, setFilesBySlot] = useState<Record<string, File[]>>({})
  const [viewCount, setViewCount] = useState(6)
  const [outputMode, setOutputMode] = useState<'combined' | 'separate'>('combined')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generating, setGenerating] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const uploadedEntries = useMemo(
    () =>
      uploadSlots.flatMap((slot) =>
        (filesBySlot[slot.id] || []).map((file) => ({
          slot,
          file,
          key: `${slot.id}-${file.name}-${file.lastModified}`,
        })),
      ),
    [filesBySlot],
  )

  useEffect(() => {
    async function loadSkills() {
      try {
        const response = await fetch('/api/skills')
        const data = await response.json()
        const nextSkills = Array.isArray(data.skills) ? data.skills : []
        setSkills(nextSkills)
        const multiAngleSkill = nextSkills.find((item: Skill) => item.name === 'ai-multi-angle-skill') || null
        setSkill(multiAngleSkill)
        setStatus(multiAngleSkill ? '已打开 ai-Multi-angle-skill。' : '没有找到 ai-Multi-angle-skill。')
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '加载技能失败')
      }
    }
    loadSkills()
  }, [])

  function addFiles(slotId: string, fileList: FileList | File[]) {
    const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith('image/'))
    if (!imageFiles.length) return
    setFilesBySlot((current) => ({
      ...current,
      [slotId]: [...(current[slotId] || []), ...imageFiles],
    }))
    setAnalysis(null)
    setGeneratedImages([])
    setError('')
  }

  function removeFile(slotId: string, fileIndex: number) {
    setFilesBySlot((current) => {
      const nextSlotFiles = [...(current[slotId] || [])]
      nextSlotFiles.splice(fileIndex, 1)
      return { ...current, [slotId]: nextSlotFiles }
    })
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, slotId: string) {
    event.preventDefault()
    addFiles(slotId, event.dataTransfer.files)
  }

  function buildBrief() {
    const uploadedAngles = uploadSlots
      .filter((slot) => (filesBySlot[slot.id] || []).length > 0)
      .map((slot) => `${slot.label}: ${filesBySlot[slot.id].length} 张`)
      .join('\n')

    const modeText = outputMode === 'combined' ? '生成在同一张图片里，排版为多角度视图合集' : '分开生成，每个角度单独输出图片'

    return [
      '任务：根据用户上传的产品图片生成电商产品多角度视图。',
      '不要要求用户输入文字。请只根据上传图片、视图数量和输出方式分析并规划生图。',
      `用户选择导出：${viewCount} 个视图。`,
      `输出方式：${modeText}。`,
      '已上传角度：',
      uploadedAngles || '用户未指定角度，但已上传产品图片。',
      '一致性硬性要求：生成结果必须严格保持参考产品的同一 SKU 外观，不改变颜色、材质、比例、结构、Logo、标签、文字位置、纹理、接口、配件和包装信息。',
      '如果缺少某些角度，只能保守推断；隐藏结构不能确定时请在分析中标注风险。',
      '适用平台：中国电商平台和 Amazon。主图风格应干净、产品居中、完整可见、背景简洁。',
    ].join('\n')
  }

  async function analyze() {
    if (!skill) {
      setError('没有找到 ai-Multi-angle-skill。')
      return
    }
    if (!uploadedEntries.length) {
      setError('请至少上传一张产品图片。')
      return
    }

    setError('')
    setStatus('正在分析上传图片和输出选项...')
    const formData = new FormData()
    formData.append('skillId', skill.id)
    formData.append('brief', buildBrief())
    uploadedEntries.forEach(({ slot, file }) => {
      formData.append('images', file, `${slot.id}-${file.name}`)
    })

    try {
      const response = await fetch('/api/run/analyze', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '分析失败')
      setAnalysis(data)
      setStatus('分析完成，可以继续生成图片。')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '分析失败')
      setStatus('')
    }
  }

  async function generateImages() {
    if (!analysis?.projectId) return
    const prompt = analysis.imagePrompt?.positive || buildBrief()
    const directions = analysis.directions?.length
      ? analysis.directions
      : [{ id: 'multi-angle-output', title: `${viewCount}视图输出`, description: outputMode === 'combined' ? '多角度合集图' : '多角度分图输出' }]

    setGenerating(true)
    setError('')
    setStatus('正在生成图片...')
    setGeneratedImages([])

    try {
      const results: GeneratedImage[] = []
      for (const direction of directions.slice(0, outputMode === 'combined' ? 1 : viewCount)) {
        const formData = new FormData()
        formData.append('projectId', analysis.projectId)
        formData.append('prompt', `${prompt}\n\n当前输出：${direction.title}\n${direction.description}`)
        formData.append('size', analysis.imagePrompt?.size || '1024x1024')
        formData.append('directionId', direction.id)
        formData.append('directionTitle', direction.title)

        const response = await fetch('/api/run/generate-image', {
          method: 'POST',
          body: formData,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || '生成图片失败')
        results.push({ imageUrl: data.imageUrl, title: direction.title })
        setGeneratedImages([...results])
      }
      setStatus('图片生成完成。')
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : '生成图片失败')
      setStatus('')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <main className="multi-angle-app">
      <section className="multi-angle-header">
        <div>
          <p>当前 Skill</p>
          <h1>{skill?.displayName || 'ai-Multi-angle-skill'}</h1>
        </div>
        <span>{skills.length} 个 skill 已加载</span>
      </section>

      <section className="multi-angle-board">
        <div className="multi-angle-panel">
          <div className="panel-title">
            <div>
              <p>上传产品角度图</p>
              <h2>只需要图片，不需要文字需求</h2>
            </div>
            <strong>{uploadedEntries.length} 张</strong>
          </div>

          <div className="angle-upload-grid">
            {uploadSlots.map((slot) => {
              const slotFiles = filesBySlot[slot.id] || []
              return (
                <div
                  key={slot.id}
                  className={`angle-upload-card ${slotFiles.length ? 'has-file' : ''}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, slot.id)}
                >
                  <input
                    ref={(node) => {
                      inputRefs.current[slot.id] = node
                    }}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => addFiles(slot.id, event.target.files || [])}
                  />
                  <button type="button" onClick={() => inputRefs.current[slot.id]?.click()}>
                    <span>{slot.label}</span>
                    <small>{slot.hint}</small>
                    <em>点击上传或拖入图片</em>
                  </button>
                  {slotFiles.length > 0 && (
                    <div className="angle-file-list">
                      {slotFiles.map((file, index) => (
                        <span key={`${file.name}-${file.lastModified}`}>
                          {file.name}
                          <button type="button" onClick={() => removeFile(slot.id, index)}>
                            移除
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="multi-angle-panel options-panel">
          <div className="panel-title">
            <div>
              <p>输出设置</p>
              <h2>选择视图数量和生成方式</h2>
            </div>
          </div>

          <div className="option-group">
            <label>导出视图数量</label>
            <div className="segmented-control">
              {viewCounts.map((count) => (
                <button key={count} type="button" className={viewCount === count ? 'active' : ''} onClick={() => setViewCount(count)}>
                  {count} 视图
                </button>
              ))}
            </div>
          </div>

          <div className="option-group">
            <label>输出方式</label>
            <div className="mode-control">
              <button type="button" className={outputMode === 'combined' ? 'active' : ''} onClick={() => setOutputMode('combined')}>
                <strong>生成在同一张里</strong>
                <span>适合主图、平台对比图、多角度合集</span>
              </button>
              <button type="button" className={outputMode === 'separate' ? 'active' : ''} onClick={() => setOutputMode('separate')}>
                <strong>分开生成</strong>
                <span>适合分别导出每个角度素材</span>
              </button>
            </div>
          </div>

          <button type="button" className="primary-action" onClick={analyze} disabled={!uploadedEntries.length}>
            分析并生成方案
          </button>
          <button type="button" className="secondary-action" onClick={generateImages} disabled={!analysis?.projectId || generating}>
            {generating ? '生成中...' : '开始生图'}
          </button>

          {status && <p className="status-text">{status}</p>}
          {error && <p className="error-text">{error}</p>}
        </aside>
      </section>

      {analysis && (
        <section className="multi-angle-result">
          <h2>分析结果</h2>
          {analysis.providerError && <p className="error-text">模型接口提示：{analysis.providerError}</p>}
          <p>{analysis.message || '已根据上传图片生成多角度视图方案。'}</p>
          {analysis.directions?.length ? (
            <div className="direction-grid">
              {analysis.directions.map((direction) => (
                <article key={direction.id}>
                  <h3>{direction.title}</h3>
                  <p>{direction.description}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {generatedImages.length > 0 && (
        <section className="multi-angle-result">
          <h2>生成图片</h2>
          <div className="generated-grid">
            {generatedImages.map((image) => (
              <figure key={image.imageUrl}>
                <img src={image.imageUrl} alt={image.title} />
                <figcaption>{image.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default App
