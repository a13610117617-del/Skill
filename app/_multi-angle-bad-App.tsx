import { useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent, type WheelEvent } from 'react'
import './App.css'
import { PreviewGallery } from './components/PreviewGallery'
import { ProjectsPanel } from './components/ProjectsPanel'

type Skill = {
  id: string
  displayName: string
  name: string
  description: string
  folder: string
  path?: string
  referencesCount: number
  guidance?: SkillGuidance
}

type DeliveryOption = {
  id: string
  title: string
  description: string
  selected: boolean
}

type LogoMockupGroup = {
  match: RegExp
  options: DeliveryOption[]
}

type SkillGuidance = {
  summary: string
  lead: string
  checklist: string[]
  placeholder: string
  deliveryOptions?: DeliveryOption[]
}

type SkillDeleteConfirm = {
  id: string
  displayName: string
}

type SettingsStatus = {
  reasoning: {
    baseURL: string
    model: string
    apiKeyMasked: string
    configured: boolean
  }
  openai: {
    baseURL: string
    imageModel: string
    apiKeyMasked: string
    configured: boolean
  }
}

type ReferenceChoice = {
  file: string
  title: string
  reason: string
  score: number
}

type InferredChoiceOption = {
  id: string
  label: string
  value: string
  description?: string
}

type InferredChoice = {
  id: string
  field: string
  title: string
  description?: string
  options: InferredChoiceOption[]
  allowCustom?: boolean
}

function ResetIcon() {
  return (
    <svg className="lightbox-action-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M4.2 5.1A5 5 0 1 1 3 8.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4.2 2.4v2.7h2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="lightbox-action-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m4.8 7.2 3.2 3.2 3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="lightbox-action-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path d="m4.2 4.2 7.6 7.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m11.8 4.2-7.6 7.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="skill-action-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path d="M2.8 4.2h10.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6.2 2.5h3.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M4.3 6.1v6.1c0 .75.55 1.3 1.3 1.3h4.8c.75 0 1.3-.55 1.3-1.3V6.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackToTopIcon() {
  return (
    <svg className="project-back-top-icon" aria-hidden="true" viewBox="0 0 18 18" fill="none">
      <path d="M9 13.5v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m5.2 8.1 3.8-3.8 3.8 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UploadChoiceIcon() {
  return (
    <svg className="choice-button-icon" aria-hidden="true" viewBox="0 0 14 14" fill="none">
      <path d="M7 9.3V2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.4 5.1 7 2.5l2.6 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 10.8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

type Analysis = {
  projectId: string
  message: string
  selectedReferences: ReferenceChoice[]
  inferredChoices?: InferredChoice[]
  deliveryOptions?: DeliveryOption[]
  confirmation?: {
    title?: string
    description?: string
    options?: string[]
  }
  providerError?: string
  imagePrompt?: {
    positive?: string
    negative?: string
    size?: string
  }
}

type DirectionOption = {
  id: string
  title: string
  description: string
}

type GenerationTarget = DirectionOption & {
  generationId?: string
  sourceDirectionId?: string
}

type GenerationScope = 'single' | 'multiple' | 'all'

type DirectionResult = {
  message: string
  directions: DirectionOption[]
  imagePrompt: {
    positive: string
    negative?: string
    size?: string
  }
  providerError?: string
  deliveryOptions?: DeliveryOption[]
}

type ImageResult = {
  imageUrl: string
  revisedPrompt?: string
}

type GeneratedImage = {
  id: string
  directionId: string
  title: string
  imageUrl: string
  size?: string
  revisedPrompt?: string
}

type GeneratedExpansion = {
  id: string
  directionId: string
  title: string
  description: string
  imageUrl: string
  size?: string
  baseTitle: string
}

type UploadedFile = {
  fileName: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

type MultiAngleSlot = {
  id: string
  label: string
  hint: string
}

type MultiAngleOutputMode = 'combined' | 'separate'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

type LightboxImage = {
  imageUrl: string
  title: string
}

type LightboxItem = LightboxImage

type LightboxPan = {
  x: number
  y: number
}

type LightboxDragState = LightboxPan & {
  startX: number
  startY: number
}

type FileSystemWritableFileStream = {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

type FileSystemFileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>
}

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

type WindowWithSaveFilePicker = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>
}

type DownloadImageItem = {
  imageUrl: string
  title: string
}

type PendingPreviewCard = {
  id: string
  title: string
}

type FailedDirection = DirectionOption & {
  reason?: string
}

type ExpansionField = {
  id: string
  label: string
  placeholder?: string
  options?: string[]
}

type LogoReuseState = {
  selectedDeliveryIds: string[]
  expansionSelections: string[]
  expansionDetails: Record<string, Record<string, string>>
  logoMockupSize: string
  mockupReferenceImages: File[]
}

type ProjectImage = {
  imageUrl: string
  title: string
  prompt?: string
  compactPrompt?: string
  imageModel?: string
  size?: string
  createdAt?: string
}

type ProjectItem = {
  id: string
  skillDisplayName: string
  brief: string
  createdAt?: string
  updatedAt?: string
  images: ProjectImage[]
}

type SkillCreateForm = {
  displayName: string
  name: string
  category: string
  purpose: string
  triggers: string
  knowledge: string
  outputFormat: string
  constraints: string
  modelNeeds: string
  referencesPlan: string
  referenceContent: string
}

const emptySkillCreateForm: SkillCreateForm = {
  displayName: '',
  name: '',
  category: '鑷畾涔?,
  purpose: '',
  triggers: '',
  knowledge: '',
  outputFormat: '',
  constraints: '',
  modelNeeds: '',
  referencesPlan: '',
  referenceContent: '',
}

const multiAngleSlots: MultiAngleSlot[] = [
  { id: 'front', label: '姝ｈ鍥?, hint: '鍟嗗搧姝ｉ潰銆佷富鍥捐搴? },
  { id: 'left', label: '宸︿晶瑙嗗浘', hint: '宸︿晶杞粨涓庡帤搴? },
  { id: 'back', label: '鑳岄潰', hint: '鑳岄儴缁撴瀯銆佹爣绛炬垨鎺ュ彛' },
  { id: 'right', label: '鍙充晶瑙嗗浘', hint: '鍙充晶杞粨涓庣粏鑺? },
  { id: 'top', label: '椤堕儴', hint: '椤堕儴鎸夐挳銆佸紑鍙ｆ垨绾圭悊' },
  { id: 'bottom', label: '搴曢儴', hint: '搴曟爣銆佽剼鍨垨搴曞骇' },
  { id: 'detail', label: '缁嗚妭鐗瑰啓', hint: 'Logo銆佹潗璐ㄣ€佺汗鐞嗐€佹帴鍙? },
  { id: 'package', label: '鍖呰/閰嶄欢', hint: '鍖呰鐩掋€侀厤浠躲€佸瑁? },
]

const multiAngleViewCounts = [3, 6, 9, 12]

const fallbackSkills: Skill[] = [
  {
    id: 'd932ec0765544a34afb11462ab1b6574',
    displayName: '鍝佺墝IP璁捐涓撳',
    name: 'one-click-ip-design',
    description: '瑕嗙洊鍝佺墝 IP 璁捐鐨勫畬鏁村伐浣滄祦锛屽皢鍝佺墝鐗硅川杞寲涓洪珮杈ㄨ瘑搴?IP 褰㈣薄銆?,
    folder: '',
    referencesCount: 19,
    guidance: {
      summary: '瑕嗙洊鍝佺墝 IP 璁捐鐨勫畬鏁村伐浣滄祦锛屽皢鍝佺墝鐗硅川杞寲涓哄叿鏈夎鲸璇嗗害鐨?IP 褰㈣薄銆?,
      lead: '鍏堣ˉ鍏呭搧鐗屽悕绉般€佽涓氥€佺洰鏍囩敤鎴枫€佸搧鐗屾晠浜嬪拰瑙掕壊鍏冪礌銆?,
      checklist: ['鍝佺墝鍚嶇О', '琛屼笟', '鐩爣鐢ㄦ埛', '鍝佺墝鏁呬簨', '瑙掕壊鍏冪礌'],
      placeholder:
        '渚嬪锛氭垜瑕佷负鑼跺皬灞卞仛鍝佺墝 IP锛岃涓氭槸鏂颁腑寮忚尪楗紝鐩爣鐢ㄦ埛鏄?18-30 宀佸コ鎬э紝甯屾湜瑙掕壊骞磋交銆佹澗寮涖€佷笢鏂广€佹湁鑼跺彾鍜屽皬灞卞厓绱犮€?,
    },
  },
]

function imageSizeToAspectRatio(size?: string) {
  const match = size?.match(/(\d+)\s*[x脳]\s*(\d+)/i)
  if (!match) return '1 / 1'
  const width = Number(match[1])
  const height = Number(match[2])
  return width > 0 && height > 0 ? `${width} / ${height}` : '1 / 1'
}

function productSetPageInstruction(directionId: string, title: string) {
  if (directionId === 'set-hero') {
    return '椤靛瀷瑕佹眰锛氫富瑙嗚闄堝垪椤点€傚晢鍝佸繀椤讳綔涓轰富瑙掓竻鏅板嚭鐜帮紝鍗犳嵁鏍稿績瑙嗚浣嶇疆锛屽缓绔嬫暣濂楀浘鐨勮儗鏅€佸厜褰便€佹枃瀛楀拰鍝佺墝瑙嗚姣嶇郴缁熴€?
  }
  if (directionId.startsWith('set-selling')) {
    return [
      `椤靛瀷瑕佹眰锛氬崠鐐硅瘉鏄庨〉锛屽洿缁曘€?{title}銆嶈瘉鏄庡埄鐩婄偣銆俙,
      '涓嶈榛樿鍋氣€滃晢鍝佹憜鎷?鏂囧瓧璇存槑鈥濄€傚鏋滃崠鐐规槸娑﹁偆銆佽垝閫傘€侀檷鍣€佹竻娲佸姏銆佹晥鏋滄彁鍗囩瓑缁撴灉鍨嬪埄鐩婏紝鍙互璁╀汉鐗╃毊鑲ょ姸鎬併€佷娇鐢ㄥ墠鍚庢劅鍙椼€佸眬閮ㄦ晥鏋溿€佺敓娲诲満鏅垨鎶借薄鍔熻兘鍙鍖栨垚涓虹敾闈富浣撱€?,
      '鍟嗗搧鍙互浣滀负鏃佷晶銆佸墠鏅€佹墜鎸併€佸寘瑁呭眬閮ㄦ垨瑙掕惤寮遍湶鍑猴紱鍙湁褰撹鍗栫偣蹇呴』灞曠ず浜у搧缁撴瀯鏃讹紝鎵嶈浜у搧鍗犱富瑙嗚銆?,
    ].join('\n')
  }
  if (directionId === 'set-scene') {
    return '椤靛瀷瑕佹眰锛氫娇鐢ㄥ満鏅〉銆備紭鍏堝睍绀虹湡瀹炰娇鐢ㄥ叧绯汇€佷汉鐗┿€佺幆澧冨拰鎯呯华锛屼笉瑕佸彧鍋氶潤鐗╀骇鍝佸浘锛涘晢鍝佸彲鑷劧鍑虹幇鍦ㄦ墜涓€佸彴闈€佸寘鍐呫€佹荡瀹ゃ€佸崸瀹ゃ€佹埛澶栫瓑鍚堢悊鍦烘櫙銆?
  }
  if (directionId === 'set-detail') {
    return '椤靛瀷瑕佹眰锛氱粏鑺?鏉愯川椤点€傚繀椤诲睍绀轰骇鍝佸眬閮ㄣ€佹潗璐ㄣ€佸寘瑁呫€佺粨鏋勩€佺汗鐞嗐€佹帴鍙ｆ垨浣跨敤缁嗚妭锛岄暅澶存洿杩戯紝淇℃伅鏇磋仛鐒︺€?
  }
  if (directionId === 'set-comparison') {
    return '椤靛瀷瑕佹眰锛氬姣?鍙傛暟椤点€傚彲閲囩敤宸﹀彸瀵规瘮銆佸垎鍖哄崱鐗囥€佸墠鍚庢晥鏋溿€佹暟鎹彲瑙嗗寲鎴栨竻鍗曠粨鏋勶紱鍙睍绀虹敤鎴峰凡纭鐨勪俊鎭紝涓嶇紪閫犲叿浣撳弬鏁般€?
  }
  if (directionId === 'set-package') {
    return '椤靛瀷瑕佹眰锛氶厤浠?娓呭崟椤点€傚睍绀哄寘瑁呫€佸瑁呫€侀厤浠舵垨缁勫悎闄堝垪锛涘鏋滄病鏈夋槑纭厤浠剁礌鏉愶紝灏辨敼涓哄晢鍝佺粍鍚堟皼鍥存垨璐拱鐞嗙敱娓呭崟锛屼笉缂栭€犱笉瀛樺湪鐨勯檮浠躲€?
  }
  return '椤靛瀷瑕佹眰锛氬湪鏁村鍟嗗搧鍥炬瘝绯荤粺鍐呭仛宸紓鍖栭〉闈紝涓嶈閲嶅涓婁竴寮犵殑鏋勫浘銆?
}

async function readJsonResponse(response: Response) {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed) return {}
  try {
    return JSON.parse(trimmed)
  } catch {
    const message = trimmed.startsWith('<')
      ? `鏈嶅姟杩斿洖浜嗙綉椤甸敊璇紝鍙兘鏄帴鍙ｅ湴鍧€鎴栦唬鐞嗛厤缃笉姝ｇ‘銆侶TTP ${response.status}`
      : trimmed
    throw new Error(message)
  }
}

function safeClientFileName(value: string) {
  const name = value.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, ' ')
  return name || 'skillcrew-image'
}

function fallbackBrowserDownload(imageUrl: string, title: string, suggestedName: string) {
  const url = `/api/download?file=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(title || 'skillcrew-image')}`
  const link = document.createElement('a')
  link.href = url
  link.download = suggestedName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

function cleanGenerationTitle(title: string) {
  return title.replace(/^绗琝s*\d+\s*灞廫s*/, '').trim() || title
}

function toUserFacingChineseError(value?: string) {
  if (!value) return ''
  let text = value
    .replace(/GPT-5\.5\s*鎺ㄧ悊\s*API/g, '鏅鸿兘鎺ㄧ悊鎺ュ彛')
    .replace(/GPT-5\.5\s*鎺ㄧ悊/g, '鏅鸿兘鎺ㄧ悊')
    .replace(/GPT-5\.5\s*/g, '鏅鸿兘鎺ㄧ悊')
    .replace(/OpenAI\s*/g, '鍥剧墖鐢熸垚鏈嶅姟')
    .replace(/\bAPI\b/g, '鎺ュ彛')
    .replace(/API Key/gi, '鎺ュ彛瀵嗛挜')
    .replace(/SKILL\.md/g, '鎶€鑳借鏄?)
    .replace(/Huaban\s+discovery|鑺辩摚\s+discovery|discovery/gi, '鑺辩摚鐏垫劅搴?)
    .replace(/\bJSON\b/g, '缁撴瀯鍖栨暟鎹?)
    .replace(/\bHTML\b/g, '缃戦〉閿欒')
    .replace(/\(request id[:锛歖?\s*[A-Za-z0-9_-]+\)/gi, '')
    .replace(/request id[:锛歖?\s*[A-Za-z0-9_-]+/gi, '')
    .replace(/Invalid token/gi, '瀵嗛挜鏃犳晥')
    .replace(/\breferences\b/gi, '鍙傝€冭祫鏂?)
    .replace(/\bSkill\b/g, '鎶€鑳?)
  text = text.replace(/\s+/g, ' ').trim()
  return text || '鏅鸿兘鎺ㄧ悊鏆傛椂涓嶅彲鐢紝宸叉敼鐢ㄦ湰鍦拌鍒欑户缁€?
}

const logoMockupGroups: LogoMockupGroup[] = [
  {
    match: /鑼秥鍜栧暋|楗畖濂惰尪|椁恷椋熷搧|鐢滃搧|鐑樼剻|閰抾鐢熼矞|璋冨懗/,
    options: [
      { id: 'logo-mockup-packaging', title: '绮惧搧鍖呰闄堝垪', description: '鑼跺寘銆佹澂濂椼€佺ぜ鐩掋€佽创绾稿拰澶栧崠琚嬬粍鍚堟垚楂樿川鎰熷搧鐗岄檲鍒椼€?, selected: true },
      { id: 'logo-mockup-cup', title: '鏉韩鎵嬫寔鍦烘櫙', description: '鏉韩銆佺摱韬€佸皝鍙ｈ创鍜屾墜鎸佸姩浣滐紝鎼厤鑷劧妗岄潰涓庨ギ鍝侀亾鍏枫€?, selected: false },
      { id: 'logo-mockup-storefront', title: '闂ㄥ簵鐏鎷涚墝', description: '闂ㄥご銆佺伅绠便€佺偣鍗曞彴銆佹煖鍙版嫑鐗岋紝鍛堢幇鐪熷疄搴楅摵绌洪棿姘涘洿銆?, selected: false },
      { id: 'logo-mockup-menu', title: '鑿滃崟涓庢鍗＄郴缁?, description: '鑿滃崟銆佹鍗°€佹澂鍨€佷环绛惧拰灏忕エ缁勬垚瀹屾暣椁愰ギ瑙嗚绯荤粺銆?, selected: false },
      { id: 'logo-mockup-social', title: '澶栧崠骞冲彴棣栧浘', description: '灏忕孩涔︺€佸叕浼楀彿銆佸鍗栧钩鍙板ご鍍忓拰灏侀潰涓殑楂樿瘑鍒搧鐗岄湶鍑恒€?, selected: false },
    ],
  },
  {
    match: /缇庡|鎶よ偆|棣欐皼|缇庡|涓姢|鍖荤編|鍋ュ悍|姣嶅┐/,
    options: [
      { id: 'logo-mockup-bottle', title: '楂樼骇鐡惰韩濂楃粍', description: '绮惧崕鐡躲€侀潰闇滅綈銆侀姘涚摱涓庡鐩掔粍鎴愯交濂骇鍝佸缁勩€?, selected: true },
      { id: 'logo-mockup-label', title: '鏍囩灏佺绯荤粺', description: '鎴愬垎鏍囩銆佸皝鍙ｈ创銆佽瘯鐢ㄨ銆佺ぜ鐩掑皝绛惧舰鎴愮簿鑷寸粏鑺傝繎鏅€?, selected: false },
      { id: 'logo-mockup-counter', title: '涓撴煖闄堝垪鍦烘櫙', description: '鍝佺墝鏌滃彴銆佷簹鍏嬪姏鎵樼洏銆佹煍鍏夐暅闈㈠拰浜у搧缁勫悎闄堝垪銆?, selected: false },
      { id: 'logo-mockup-ritual', title: '鎶よ偆浠紡鎰熷満鏅?, description: '娴村鍙伴潰銆佹⒊濡嗗彴銆佺粐鐗┿€佹鐗╁拰鏌斿厜钀ラ€犵敓娲绘柟寮忔皼鍥淬€?, selected: false },
    ],
  },
  {
    match: /绉戞妧|鏅鸿兘|AI|杞欢|鏁版嵁|SaaS|鑺墖|鏁扮爜|鐢靛瓙|浜掕仈缃憒App|搴旂敤/,
    options: [
      { id: 'logo-mockup-app-icon', title: 'App 鍥炬爣鐭╅樀', description: '鎵嬫満妗岄潰銆佸惎鍔ㄩ〉銆佸簲鐢ㄥ晢搴楀崱鐗囧拰閫氱煡鍥炬爣缁勬垚浜у搧鐭╅樀銆?, selected: true },
      { id: 'logo-mockup-device', title: '澶氳澶囩晫闈㈠満鏅?, description: '鎵嬫満銆佸钩鏉裤€佺數鑴戝睆骞曞睍绀虹櫥褰曢〉銆佷华琛ㄧ洏鎴栧搧鐗岄椤点€?, selected: false },
      { id: 'logo-mockup-office', title: '鍙戝竷浼氬姙鍏墿鏂?, description: '宸ョ墝銆佸悕鐗囥€丳PT 灏侀潰銆佷細璁儗鏅澘鍜屽睍鍙板睆骞曞簲鐢ㄣ€?, selected: false },
      { id: 'logo-mockup-dashboard', title: '鏁版嵁鍙鍖栦富灞?, description: '娣辨祬鐣岄潰灞忓箷銆佷俊鎭崱鐗囥€佸彂鍏夎竟缂樺拰楂樼绉戞妧灞曞巺鍦烘櫙銆?, selected: false },
    ],
  },
  {
    match: /鏈嶈|鏈嶉グ|娼墝|闉媩鍖厊鐝犲疂|閰嶉グ|鐢熸椿鏂瑰紡|瀹跺眳/,
    options: [
      { id: 'logo-mockup-tag', title: '鍚婄墝缁囧敍缁嗚妭', description: '鏈嶈鍚婄墝銆佺粐鍞涖€侀鏍囥€佸寘瑁呯焊浠ユ潗璐ㄨ繎鏅憟鐜般€?, selected: true },
      { id: 'logo-mockup-bag', title: '璐墿琚嬭鎷嶅満鏅?, description: '璐墿琚嬨€佸揩閫掕銆佺ぜ鍝佽鍜屽寘瑁呰创绾告斁鍏ヨ鎷嶆垨姗辩獥鍦烘櫙銆?, selected: false },
      { id: 'logo-mockup-storefront', title: '闂ㄥ簵姗辩獥绯荤粺', description: '闂ㄥご銆佹┍绐椼€佽瘯琛ｉ棿瀵艰銆佸簵鍐呭闈㈢粍鎴愬畬鏁撮浂鍞┖闂淬€?, selected: false },
      { id: 'logo-mockup-editorial', title: '鏃跺皻鏉傚織闄堝垪', description: '鍚婄墝銆侀潰鏂欍€佸崱鐗囥€侀厤楗板拰鏉傚織鐗堝紡鏋勬垚 editorial 闈欑墿鐢婚潰銆?, selected: false },
    ],
  },
  {
    match: /鏁欒偛|鍎跨|浜插瓙|鍩硅|瀛︽牎|鏂囧垱|涔﹀簵|鍑虹増/,
    options: [
      { id: 'logo-mockup-stationery', title: '鏂囧叿瀛︿範濂楃粍', description: '绗旇鏈€佽绋嬪崱銆佽创绾搞€佸竼甯冭鍜屾墜鍐屽皝闈㈢粍鎴愬涔犲瑁呫€?, selected: true },
      { id: 'logo-mockup-signage', title: '绌洪棿瀵艰绯荤粺', description: '鏁欏闂ㄧ墝銆佸墠鍙拌儗鏅銆佸睍鏋躲€佹椿鍔ㄧ墿鏂欏拰澧欓潰鍥惧舰搴旂敤銆?, selected: false },
      { id: 'logo-mockup-social', title: '璇剧▼鍐呭灏侀潰', description: '璇剧▼娴锋姤銆佸叕浼楀彿灏侀潰銆佺ぞ缇ゅご鍍忓拰鐭ヨ瘑鍗＄墖瑙嗚绯荤粺銆?, selected: false },
      { id: 'logo-mockup-workshop', title: '宸ヤ綔鍧婃闈㈠満鏅?, description: '涔︽湰銆佺敾绗斻€佷究绛俱€佹墜鍐屽拰鑷劧鍏夋闈㈡瀯鎴愭俯鏆栨暀鑲插満鏅€?, selected: false },
    ],
  },
  {
    match: /瀹犵墿|鐚珅鐙梶鐘瑋瀹犵伯|瀹犵墿鐢ㄥ搧|鍔ㄧ墿/,
    options: [
      { id: 'logo-mockup-pet-pack', title: '瀹犵墿鍖呰濂楃粍', description: '瀹犵伯琚嬨€侀浂椋熺綈銆佺帺鍏峰悐鐗屽拰璐寸焊缁勬垚鍙埍璐ф灦闄堝垪銆?, selected: true },
      { id: 'logo-mockup-pet-scene', title: '瀹犵墿鐢熸椿鍦烘櫙', description: '瀹犵墿绐濄€佺壍寮曠怀銆佺帺鍏枫€佸湴姣拰鑷劧鍏夊搴満鏅€?, selected: false },
      { id: 'logo-mockup-pet-store', title: '瀹犵墿搴楅棬澶撮檲鍒?, description: '搴楅摵闂ㄥご銆佹敹閾跺彴銆佽揣鏋朵环绛惧拰浼氬憳鍗″搧鐗屽簲鐢ㄣ€?, selected: false },
      { id: 'logo-mockup-pet-social', title: '钀屽疇绀惧獟灏侀潰', description: '澶村儚銆佸皝闈€佽创绾歌〃鎯呭拰鍝佺墝鍗＄墖缁勬垚绀惧獟瑙嗚銆?, selected: false },
    ],
  },
  {
    match: /杩愬姩|鍋ヨ韩|鐟滀冀|鎴峰|闇茶惀|楠戣|璺戞|鍋ュ悍绠＄悊/,
    options: [
      { id: 'logo-mockup-sport-gear', title: '杩愬姩瑁呭鏍囪瘑', description: '鐟滀冀鍨€佹按澹躲€佽繍鍔ㄥ寘銆佹瘺宸惧拰鏈嶈鍗版爣搴旂敤銆?, selected: true },
      { id: 'logo-mockup-gym-wall', title: '鍋ヨ韩绌洪棿澧欓潰', description: '鍋ヨ韩鎴垮闈€佸墠鍙般€佸偍鐗╂煖銆佽绋嬬墝鍜岀伅绠辨嫑鐗屻€?, selected: false },
      { id: 'logo-mockup-outdoor-kit', title: '鎴峰瑁呭鍦烘櫙', description: '闇茶惀妗岄潰銆佺櫥灞卞寘銆佹棗甯溿€佽创绾稿拰鑷劧鎴峰鍏夊奖銆?, selected: false },
      { id: 'logo-mockup-sport-app', title: '杩愬姩 App 鐣岄潰', description: '杩愬姩鏁版嵁鐣岄潰銆佷細鍛樺崱銆佽绋嬮绾﹂〉鍜屾櫤鑳芥墜琛ㄩ湶鍑恒€?, selected: false },
    ],
  },
  {
    match: /閰掑簵|姘戝|鏃呰|鏃呮父|鏂囨梾|搴﹀亣|鍜栧暋棣唡绌洪棿|鍦颁骇|绀惧尯/,
    options: [
      { id: 'logo-mockup-hospitality-sign', title: '绌洪棿闂ㄧ墝瀵艰', description: '闂ㄧ墝銆佸墠鍙拌儗鏅銆侀挜鍖欏崱銆佸瑙嗙墝鍜岀伅鍏夌┖闂存皼鍥淬€?, selected: true },
      { id: 'logo-mockup-hotel-amenity', title: '閰掑簵澶囧搧濂楃粍', description: '鎴垮崱銆佹礂鎶ゅ鍝併€佺焊琚嬨€佹杩庡崱鍜屽簥澶存闈㈤檲鍒椼€?, selected: false },
      { id: 'logo-mockup-travel-print', title: '鏃呰鍗板埛鐗╂枡', description: '鍦板浘銆佹槑淇＄墖銆佺エ鍒搞€佹姢鐓уす鍜岀邯蹇佃创绾哥粍鍚堛€?, selected: false },
      { id: 'logo-mockup-lobby-scene', title: '澶у爞姘涘洿鍦烘櫙', description: '鍓嶅彴銆佸ぇ鍫傚闈€佹闈㈣姳鑹哄拰鏌斿拰鐏厜鏋勬垚楂樼绌洪棿銆?, selected: false },
    ],
  },
  {
    match: /鑹烘湳|灞曡|鐢诲粖|鍗氱墿棣唡闊充箰|鍓у満|褰卞儚|娼帺|IP/,
    options: [
      { id: 'logo-mockup-exhibition-wall', title: '灞曡澧欓潰绯荤粺', description: '灞曞鏍囬銆佸瑙堢墝銆佺エ鍒搞€佹捣鎶ュ拰绾康鍝佸簲鐢ㄣ€?, selected: true },
      { id: 'logo-mockup-art-print', title: '鑹烘湳鍗板埛濂楃粍', description: '娴锋姤銆侀個璇峰嚱銆佺エ鏍广€佺敾鍐屽皝闈㈠拰鏀惰棌鍗＄墖闄堝垪銆?, selected: false },
      { id: 'logo-mockup-merch', title: '鍛ㄨ竟鍟嗗搧鏍锋満', description: '甯嗗竷琚嬨€佸窘绔犮€佽创绾搞€乀 鎭ゅ拰浜氬厠鍔涚墝缁勫悎灞曠ず銆?, selected: false },
      { id: 'logo-mockup-event-scene', title: '娲诲姩鐜板満鍦烘櫙', description: '绛惧埌鍙般€佽儗鏅澘銆佹墜鐜€佹寚绀虹墝鍜岀幇鍦虹伅鍏夋皼鍥淬€?, selected: false },
    ],
  },
]

const defaultLogoMockups: DeliveryOption[] = [
  { id: 'logo-mockup-packaging', title: '鍖呰鐗╂枡鏍锋満', description: '鍖呰鐩掋€佹墜鎻愯銆佽创绾搞€佸崱鐗囩瓑閫氱敤鍝佺墝鐗╂枡搴旂敤銆?, selected: true },
  { id: 'logo-mockup-signage', title: '绌洪棿鏍囪瘑鏍锋満', description: '闂ㄥご銆佽儗鏅銆佸瑙嗙墝鎴栨煖鍙版爣璇嗕腑鐨勫簲鐢ㄦ晥鏋溿€?, selected: false },
  { id: 'logo-mockup-social', title: '绾夸笂澶村儚鏍锋満', description: '绀惧獟澶村儚銆佸搧鐗屽皝闈€佸钩鍙板浘鏍囦腑鐨勫皬灏哄璇嗗埆鏁堟灉銆?, selected: false },
]

function inferLogoMockupOptions(brief: string): DeliveryOption[] {
  const matched = logoMockupGroups.find((group) => group.match.test(brief))
  return [
    ...(matched?.options || defaultLogoMockups),
    { id: 'custom-followup', title: '鑷畾涔夋牱鏈?, description: '鎸夊簳閮ㄨ緭鍏ョ殑鍏蜂綋鍦烘櫙缁х画鐢熸垚鏍锋満銆?, selected: false },
  ]
}

function logoMockupPromptNote(taskTitle: string, detailText: string, brief: string, size: string) {
  return [
    '杩欐槸 Logo 鏍锋満搴旂敤鍥撅紝涓嶆槸閲嶆柊璁捐 Logo銆?,
    '蹇呴』鎶婇€変腑鐨?Logo 鍥句綔涓哄敮涓€鍝佺墝鏍囪瘑鍙傝€冿紝淇濇寔 Logo 鐨勫浘褰㈢粨鏋勩€佹枃瀛椼€佹瘮渚嬨€侀鑹插叧绯诲拰璇嗗埆鐗瑰緛锛屼笉瑕佹敼瀛椼€侀敊瀛椼€侀噸缁樻垨鍙樺舰銆?,
    `鏍锋満鏂瑰悜锛?{taskTitle}銆俙,
    `鐢熸垚灏哄锛?{size}銆傚繀椤讳弗鏍兼寜杩欎釜鐢诲箙姣斾緥缁勭粐鏋勫浘锛屼笉瑕佺敓鎴愬叾浠栨瘮渚嬫垨鎶婂唴瀹硅鎴愭柟鍥俱€俙,
    `鏍锋満琛ュ厖锛?{detailText || '鎸夐粯璁よ涓氬簲鐢ㄥ満鏅墽琛屻€?}`,
    `鍝佺墝淇℃伅锛?{brief}`,
    '蹇呴』鐢熸垚瀹㈡埛鎻愭绾у搧鐗屾牱鏈哄浘锛氱湡瀹炲簲鐢ㄥ満鏅€佺簿鑷存瀯鍥俱€佽嚜鐒跺厜褰便€佹槑纭潗璐ㄣ€佺┖闂村眰娆″拰琛屼笟鐩稿叧閬撳叿閮借鍑虹幇銆?,
    '璁捐鎰熻姹傦細鐢婚潰瑕佹湁鏄庣‘瑙嗚涓绘銆佸搧鐗岃壊寤跺睍銆佹潗璐ㄥ姣斻€佺暀鐧借妭濂忋€佹垚缁勭墿鏂欑郴缁熷拰 editorial / campaign look锛屼笉瑕佸儚鏅€氭ā鏉挎埅鍥俱€?,
    '璇蜂富鍔ㄥ弬鑰冭姳鐡ｇ伒鎰熷簱甯歌鐨勫搧鐗屾牱鏈轰笌鍦烘櫙鍥剧粍缁囨柟寮忥細澶氱墿鏂欑粍鍚堛€佹枩鍚戞瀯鍥俱€佸眬閮ㄧ壒鍐欍€佺┖闂村瑙嗐€佺敓娲绘柟寮忓満鏅€佺簿鑷撮潤鐗┿€佺伅绠辨嫑鐗屻€佺ぞ濯掑皝闈㈢煩闃点€?,
    '涓嶈鐧借姳鑺辩┖鑳屾櫙锛屼笉瑕佸彧鎶?Logo 鏀惧湪鐧藉簳鐢诲竷涓婏紱鍙互浣跨敤鍖呰銆佹澂韬€侀棬搴椼€佸睆骞曘€佸悕鐗囥€佸悐鐗屻€佹煖鍙般€佹闈€佹┍绐椼€佸睍鏋舵垨绀惧獟澶村儚绛夎涓氬簲鐢ㄥ満鏅€?,
    '鐢婚潰搴斿綋骞插噣銆佸晢涓氬寲銆佺簿鑷淬€佹湁姘涘洿锛岃兘鐩存帴鏀捐繘鍝佺墝鎻愭锛涗絾 Logo 鏈綋蹇呴』娓呮櫚鍙涓斾笉琚伄鎸°€?,
    '鏍锋満鐏垫劅搴撳彲鍚庣画浠庤姳鐡ｇ伒鎰熷簱浜哄伐鏀跺綍涓嶅悓琛屼笟鍝佺被鐨勬牱鏈哄浘鍜屽満鏅浘锛涘綋鍓嶈鏍规嵁琛屼笟鍝佺被鐢熸垚鍚堢悊銆佺簿鑷淬€佸彲鐢ㄤ簬瀹㈡埛鎻愭鐨勬牱鏈哄浘銆?,
  ].join('\n')
}

function App() {
  const [skills, setSkills] = useState<Skill[]>(fallbackSkills)
  const [selectedSkill, setSelectedSkill] = useState(fallbackSkills[0].id)
  const [settings, setSettings] = useState<SettingsStatus | null>(null)
  const [brief, setBrief] = useState('')
  const [followUpText, setFollowUpText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [checkedReferences, setCheckedReferences] = useState<string[]>([])
  const [selectedInferredChoices, setSelectedInferredChoices] = useState<Record<string, string>>({})
  const [customInferredChoices, setCustomInferredChoices] = useState<Record<string, string>>({})
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([])
  const [selectedThemeDirection, setSelectedThemeDirection] = useState('')
  const [directionResult, setDirectionResult] = useState<DirectionResult | null>(null)
  const [selectedDirection, setSelectedDirection] = useState('')
  const [promptText, setPromptText] = useState('')
  const [promptConfirmed, setPromptConfirmed] = useState(false)
  const [imageResult, setImageResult] = useState<ImageResult | null>(null)
  const [imageResults, setImageResults] = useState<GeneratedImage[]>([])
  const [expansionResults, setExpansionResults] = useState<GeneratedExpansion[]>([])
  const [selectedBaseImageId, setSelectedBaseImageId] = useState('')
  const [generationScope, setGenerationScope] = useState<GenerationScope>('single')
  const [selectedGenerationIds, setSelectedGenerationIds] = useState<string[]>([])
  const [logoVariantCount, setLogoVariantCount] = useState(1)
  const [logoMockupSize, setLogoMockupSize] = useState('1024x1024')
  const [generationQueue, setGenerationQueue] = useState<string[]>([])
  const [pendingPreviewCards, setPendingPreviewCards] = useState<PendingPreviewCard[]>([])
  const [failedDirections, setFailedDirections] = useState<FailedDirection[]>([])
  const [expansionSelections, setExpansionSelections] = useState<string[]>([])
  const [expansionDetails, setExpansionDetails] = useState<Record<string, Record<string, string>>>({})
  const [viewStep, setViewStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [operationStatus, setOperationStatus] = useState('')
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [multiAngleFiles, setMultiAngleFiles] = useState<Record<string, File[]>>({})
  const [multiAngleViewCount, setMultiAngleViewCount] = useState(6)
  const [multiAngleOutputMode, setMultiAngleOutputMode] = useState<MultiAngleOutputMode>('combined')
  const [isDraggingReference, setIsDraggingReference] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [mockupReferenceImages, setMockupReferenceImages] = useState<File[]>([])
  const [isDraggingMockupReference, setIsDraggingMockupReference] = useState(false)
  const [logoReuseState, setLogoReuseState] = useState<LogoReuseState | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const [skillDeleteConfirm, setSkillDeleteConfirm] = useState<SkillDeleteConfirm | null>(null)
  const [deletingSkill, setDeletingSkill] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [createSkillOpen, setCreateSkillOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [skillCreateForm, setSkillCreateForm] = useState<SkillCreateForm>(emptySkillCreateForm)
  const [skillCreateOutline, setSkillCreateOutline] = useState('')
  const [skillCreateProviderError, setSkillCreateProviderError] = useState('')
  const [skillCreateStatus, setSkillCreateStatus] = useState('')
  const [draftingSkill, setDraftingSkill] = useState(false)
  const [creatingSkill, setCreatingSkill] = useState(false)
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [importingSkill, setImportingSkill] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'reasoning' | 'openai'>('reasoning')
  const [savingSettings, setSavingSettings] = useState(false)
  const [skillMenuOpen, setSkillMenuOpen] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<LightboxImage | null>(null)
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([])
  const [lightboxZoom, setLightboxZoom] = useState(1)
  const [lightboxPan, setLightboxPan] = useState<LightboxPan>({ x: 0, y: 0 })
  const [lightboxDrag, setLightboxDrag] = useState<LightboxDragState | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    reasoningApiKey: '',
    reasoningBaseURL: '',
    reasoningModel: '',
    openaiApiKey: '',
    openaiBaseURL: 'https://api.openai.com/v1',
    openaiImageModel: 'gpt-image-2',
  })

  const skill = useMemo(
    () => skills.find((item) => item.id === selectedSkill) ?? skills[0],
    [selectedSkill, skills],
  )
  const skillMenuRef = useRef<HTMLDivElement | null>(null)
  const plusMenuRef = useRef<HTMLDivElement | null>(null)
  const skillsPanelRef = useRef<HTMLElement | null>(null)
  const skillDirectoryInputRef = useRef<HTMLInputElement | null>(null)
  const briefInputRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const rightScrollRef = useRef<HTMLDivElement | null>(null)
  const workflowAbortRef = useRef<AbortController | null>(null)

  const isInitialThinking = loading && !analysis
  const canGenerateAllDirections = Boolean(directionResult?.directions && directionResult.directions.length > 1)
  const isDetailPageSkill = skill?.name === 'detail-page-assistant' || skill?.displayName === '鐢靛晢璇︽儏椤佃璁′笓瀹?
  const isLogoSkill =
    skill?.name === 'ai-brand-skill' ||
    skill?.displayName === '鍝佺墝logo璁捐' ||
    skill?.name === 'logook3' ||
    skill?.displayName === '鍝佺墝Logo璁捐涓撳'
  const isProductImageSetSkill =
    skill?.name === 'product-image-set-design-expert' || skill?.displayName === '鐢靛晢濂楀浘璁捐涓撳'
  const isMultiAngleSkill =
    skill?.name === 'ai-multi-angle-skill' ||
    skill?.id === 'ai-multi-angle-skill-local' ||
    /multi-angle/i.test(skill?.id || '') ||
    skill?.displayName === '浜у搧澶氳搴﹁鍥?
  const deliveryOptions = skill?.guidance?.deliveryOptions || []
  const activeDeliveryOptions = analysis?.deliveryOptions?.length ? analysis.deliveryOptions : deliveryOptions
  const logoStyleOptions = activeDeliveryOptions.filter((item) => item.id.startsWith('logo-style-'))
  const logoEmphasisOptions = activeDeliveryOptions.filter((item) => item.id.startsWith('logo-emphasis-'))
  const hasOptionStep = deliveryOptions.length > 0
  const stepIndex = {
    brief: 0,
    references: 1,
    options: hasOptionStep ? 2 : -1,
    direction: hasOptionStep ? 3 : 2,
    generate: hasOptionStep ? 4 : 3,
    expansion: hasOptionStep ? 5 : 4,
  }
  const previewAspectRatio = imageSizeToAspectRatio(directionResult?.imagePrompt.size)
  const selectedPreviewDirection = directionResult?.directions.find((direction) => direction.id === selectedDirection)
  const selectedGenerationDirections = directionResult?.directions.filter((direction) =>
    selectedGenerationIds.includes(direction.id),
  ) || []
  const generatedDirectionIds = new Set(imageResults.map((item) => item.directionId))
  const failedDirectionIds = new Set(failedDirections.map((item) => item.id))
  const previewSlots = generationScope === 'all'
    ? directionResult?.directions || []
    : generationScope === 'multiple'
      ? selectedGenerationDirections.length > 0
        ? selectedGenerationDirections
        : [{ id: 'pending', title: '閫夋嫨瑕佺敓鎴愮殑椤甸潰', description: '' }]
      : selectedPreviewDirection
        ? [selectedPreviewDirection]
        : directionResult?.directions?.[0]
          ? [directionResult.directions[0]]
          : [{ id: 'pending', title: 'Ready', description: '' }]
  const previewImages = [
    ...imageResults.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: item.title,
      aspectRatio: imageSizeToAspectRatio(item.size),
    })),
    ...expansionResults.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: `${item.title} 路 ${item.baseTitle}`,
      aspectRatio: imageSizeToAspectRatio(item.size),
    })),
  ]
  const previewItems = previewImages.length > 0
    ? [
        ...previewImages.map((item) => ({ ...item, kind: 'image' as const })),
        ...pendingPreviewCards.map((item) => ({ ...item, kind: 'pending' as const })),
      ]
    : pendingPreviewCards.length > 0
      ? pendingPreviewCards.map((item) => ({ ...item, kind: 'pending' as const }))
      : previewSlots.map((item) => ({
          ...item,
          kind: generationQueue.includes(item.id) ? ('pending' as const) : ('placeholder' as const),
        }))
  const adjustableImages = [
    ...imageResults.map((item) => ({
      id: item.id,
      directionId: item.directionId,
      imageUrl: item.imageUrl,
      title: item.title,
      badge: isLogoSkill ? 'Logo 鏂规' : '涓诲浘',
    })),
    ...(isLogoSkill ? [] : expansionResults.map((item) => ({
      id: item.id,
      directionId: item.directionId,
      imageUrl: item.imageUrl,
      title: item.title,
      badge: isLogoSkill ? `鏍锋満 路 ${item.baseTitle}` : `鎵╁睍 路 ${item.baseTitle}`,
    }))),
  ]

  const workflowStepLabels = [
    '闇€姹傜悊瑙?,
    '鍙傝€冮€夋嫨',
    ...(hasOptionStep ? ['閫夐」閰嶇疆'] : []),
    '鏂瑰悜纭',
    '鐢熷浘',
    ...(adjustableImages.length > 0 ? [isLogoSkill ? '鏍锋満閫夋嫨' : '鎵╁睍閫夋嫨'] : []),
  ]
  const activeStep = imageResult
    ? stepIndex.expansion
    : promptConfirmed
      ? stepIndex.generate
      : directionResult
        ? stepIndex.direction
        : analysis
          ? hasOptionStep
            ? stepIndex.options
            : stepIndex.references
          : stepIndex.brief
  const visibleStep = Math.min(viewStep, activeStep)

  useEffect(() => {
    async function boot() {
      try {
        const [skillsResponse, settingsResponse] = await Promise.all([
          fetch('/api/skills'),
          fetch('/api/settings'),
        ])
        if (!skillsResponse.ok) throw new Error('鏃犳硶璇诲彇鏈湴鎶€鑳藉垪琛ㄣ€?)
        const skillsData = (await skillsResponse.json()) as { skills: Skill[] }
        const nextSkills = skillsData.skills.length > 0 ? skillsData.skills : fallbackSkills
        setSkills(nextSkills)
        setSelectedSkill(nextSkills[0].id)

        if (settingsResponse.ok) {
          const settingsData = (await settingsResponse.json()) as SettingsStatus
          setSettings(settingsData)
          setSettingsForm((current) => ({
            ...current,
            reasoningBaseURL: settingsData.reasoning.baseURL,
            reasoningModel: settingsData.reasoning.model,
            openaiBaseURL: settingsData.openai.baseURL,
            openaiImageModel: settingsData.openai.imageModel,
          }))
        }
      } catch (bootError) {
        setError(bootError instanceof Error ? bootError.message : '鍚姩澶辫触銆?)
      }
    }
    boot()
  }, [])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!skillMenuRef.current?.contains(event.target as Node)) {
        setSkillMenuOpen(false)
      }
      if (!plusMenuRef.current?.contains(event.target as Node)) {
        setPlusMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!skill) return
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `宸查€夋嫨 ${skill.displayName}銆?{skill.guidance?.lead || '鍏堝憡璇夋垜浣犵殑鐩爣銆佺礌鏉愬拰椋庢牸鏂瑰悜銆?}`,
      },
    ])
    setAnalysis(null)
    setCheckedReferences([])
    setSelectedInferredChoices({})
    setCustomInferredChoices({})
    setSelectedDeliveryIds((skill.guidance?.deliveryOptions || []).filter((item) => item.selected).map((item) => item.id))
    setSelectedThemeDirection('')
    setDirectionResult(null)
    setSelectedDirection('')
    setGenerationScope('single')
    setSelectedGenerationIds([])
    setLogoVariantCount(1)
    setLogoMockupSize('1024x1024')
    setPromptText('')
    setPromptConfirmed(false)
    setImageResult(null)
    setImageResults([])
    setExpansionResults([])
    setSelectedBaseImageId('')
    setViewStep(stepIndex.brief)
    setReferenceImages([])
    setUploadedFiles([])
    setMockupReferenceImages([])
    setExpansionSelections([])
    setExpansionDetails({})
    setGenerationQueue([])
    setPendingPreviewCards([])
    setFailedDirections([])
    setLightboxImage(null)
    setError('')
    setOperationStatus('')
    setFollowUpText('')
  }, [skill])

  useEffect(() => {
    const input = briefInputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${input.scrollHeight}px`
  }, [brief])

  useEffect(() => {
    if (!lightboxImage) return
    function handleLightboxKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveLightbox(-1)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveLightbox(1)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        closeLightbox()
      }
    }

    window.addEventListener('keydown', handleLightboxKeyDown)
    return () => window.removeEventListener('keydown', handleLightboxKeyDown)
  }, [lightboxImage, lightboxItems])

  useEffect(() => {
    const scrollArea = rightScrollRef.current
    if (!scrollArea || visibleStep === stepIndex.brief) return
    scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' })
  }, [messages, analysis, directionResult, promptConfirmed, imageResult, visibleStep])

  async function refreshSkillList(selectSkillId?: string) {
    const response = await fetch('/api/skills')
    const data = await readJsonResponse(response)
    if (!response.ok) throw new Error(data.error || '鏃犳硶璇诲彇鏈湴鎶€鑳藉垪琛ㄣ€?)
    const nextSkills = Array.isArray(data.skills) && data.skills.length > 0 ? data.skills as Skill[] : fallbackSkills
    setSkills(nextSkills)
    setSelectedSkill(selectSkillId && nextSkills.some((item) => item.id === selectSkillId) ? selectSkillId : nextSkills[0].id)
    return nextSkills
  }

  async function openProjectsPanel() {
    setProjectsOpen(true)
    setProjectsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/projects')
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '鏃犳硶璇诲彇椤圭洰鍒楄〃銆?)
      setProjects(Array.isArray(data.projects) ? data.projects as ProjectItem[] : [])
    } catch (projectsError) {
      setError(projectsError instanceof Error ? projectsError.message : '鏃犳硶璇诲彇椤圭洰鍒楄〃銆?)
    } finally {
      setProjectsLoading(false)
    }
  }

  async function deleteProjects(projectIds: string[]) {
    if (projectIds.length === 0) return
    setError('')
    try {
      for (const projectId of projectIds) {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' })
        const data = await readJsonResponse(response)
        if (!response.ok) throw new Error(data.error || '鍒犻櫎椤圭洰澶辫触銆?)
      }
      setProjects((current) => current.filter((project) => !projectIds.includes(project.id)))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '鍒犻櫎椤圭洰澶辫触銆?)
      throw deleteError
    }
  }

  async function deleteSkill(skillToDelete: SkillDeleteConfirm) {
    setDeletingSkill(true)
    setError('')
    try {
      const response = await fetch(`/api/skills/${encodeURIComponent(skillToDelete.id)}`, { method: 'DELETE' })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '鍒犻櫎 Skill 澶辫触銆?)
      const nextSkills = await refreshSkillList(selectedSkill === skillToDelete.id ? undefined : selectedSkill)
      if (nextSkills.length === 0) {
        setSelectedSkill('')
      }
      setSkillDeleteConfirm(null)
      setOperationStatus(`宸插垹闄?Skill锛?{skillToDelete.displayName}`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '鍒犻櫎 Skill 澶辫触銆?)
    } finally {
      setDeletingSkill(false)
    }
  }

  function updateSkillCreateField(field: keyof SkillCreateForm, value: string) {
    setSkillCreateForm((current) => ({ ...current, [field]: value }))
  }

  function openCreateSkillPanel() {
    setCreateSkillOpen(true)
    setPlusMenuOpen(false)
    setSkillCreateForm(emptySkillCreateForm)
    setSkillCreateOutline('')
    setSkillCreateProviderError('')
    setSkillCreateStatus('')
  }

  async function importSkillFromDirectory(files: FileList | null) {
    if (!files || files.length === 0) return
    setImportingSkill(true)
    setPlusMenuOpen(false)
    setError('')
    setOperationStatus('')
    try {
      const selectedFiles = Array.from(files).filter((file) =>
        /(^|\/)(SKILL\.md|metadata\.json|README\.md|content\.md)$/i.test(file.webkitRelativePath || file.name) ||
        /\/references\/.+\.md$/i.test(file.webkitRelativePath || file.name)
      )
      if (!selectedFiles.some((file) => /(^|\/)SKILL\.md$/i.test(file.webkitRelativePath || file.name))) {
        throw new Error('閫夋嫨鐨勬枃浠跺す閲屾病鏈夋妧鑳借鏄庢枃浠躲€?)
      }
      const formData = new FormData()
      selectedFiles.forEach((file) => {
        formData.append('files', file, file.webkitRelativePath || file.name)
      })
      const response = await fetch('/api/skills/import', {
        method: 'POST',
        body: formData,
      })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '璇诲彇鏈湴鎶€鑳藉け璐ャ€?)
      await refreshSkillList(data.skill?.id)
      setSkillsOpen(true)
      setOperationStatus(`宸茶鍙栨妧鑳斤細${data.skill?.displayName || '鏈湴鎶€鑳?}`)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : '璇诲彇鏈湴鎶€鑳藉け璐ャ€?)
    } finally {
      setImportingSkill(false)
      if (skillDirectoryInputRef.current) skillDirectoryInputRef.current.value = ''
    }
  }

  async function draftSkillOutline() {
    if (!skillCreateForm.displayName.trim() || !skillCreateForm.purpose.trim()) {
      setSkillCreateStatus('璇峰厛濉啓 Skill 鍚嶇О鍜岀敤閫斻€?)
      return
    }
    setDraftingSkill(true)
    setSkillCreateStatus('')
    setSkillCreateProviderError('')
    try {
      const response = await fetch('/api/skills/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillCreateForm),
      })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '鐢熸垚澶х翰澶辫触銆?)
      setSkillCreateOutline(String(data.outline || ''))
      setSkillCreateProviderError(String(data.providerError || ''))
      setSkillCreateStatus('璁捐澶х翰宸茬敓鎴愩€傜‘璁ゆ棤璇悗鍐嶅垱寤烘湰鍦版妧鑳姐€?)
    } catch (draftError) {
      setSkillCreateStatus(draftError instanceof Error ? draftError.message : '鐢熸垚澶х翰澶辫触銆?)
    } finally {
      setDraftingSkill(false)
    }
  }

  async function createLocalSkill() {
    if (!skillCreateOutline.trim()) {
      setSkillCreateStatus('璇峰厛鐢熸垚骞剁‘璁よ璁″ぇ绾层€?)
      return
    }
    setCreatingSkill(true)
    setSkillCreateStatus('')
    try {
      const response = await fetch('/api/skills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: skillCreateForm,
          outline: skillCreateOutline,
        }),
      })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '鍒涘缓 Skill 澶辫触銆?)
      await refreshSkillList(data.skill?.id)
      setCreateSkillOpen(false)
      setSkillsOpen(true)
      setSkillCreateStatus('')
      setOperationStatus(`宸插垱寤?Skill锛?{data.skill?.displayName || skillCreateForm.displayName}`)
    } catch (createError) {
      setSkillCreateStatus(createError instanceof Error ? createError.message : '鍒涘缓 Skill 澶辫触銆?)
    } finally {
      setCreatingSkill(false)
    }
  }

  async function submitBrief() {
    if (!brief.trim() || !skill) {
      setError('璇峰厛杈撳叆闇€姹傘€?)
      return
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: effectiveBrief.trim(),
    }
    const reusableLogoSelections = isLogoSkill ? logoReuseState : null
    setMessages((current) => [...current, userMessage])
    setLoading(true)
    setError('')
    setAnalysis(null)
    setCheckedReferences([])
    setSelectedInferredChoices({})
    setCustomInferredChoices({})
    setSelectedInferredChoices({})
    setCustomInferredChoices({})
    setSelectedDeliveryIds(
      reusableLogoSelections?.selectedDeliveryIds.length
        ? reusableLogoSelections.selectedDeliveryIds
        : (skill.guidance?.deliveryOptions || []).filter((item) => item.selected).map((item) => item.id),
    )
    setSelectedThemeDirection('')
    setDirectionResult(null)
    setSelectedDirection('')
    setGenerationScope('single')
    setSelectedGenerationIds([])
    setLogoVariantCount(1)
    setLogoMockupSize(reusableLogoSelections?.logoMockupSize || '1024x1024')
    setPromptText('')
    setPromptConfirmed(false)
    setImageResult(null)
    setImageResults([])
    setExpansionResults([])
    setSelectedBaseImageId('')
    setUploadedFiles([])
    setMockupReferenceImages(reusableLogoSelections?.mockupReferenceImages || [])
    setExpansionSelections(reusableLogoSelections?.expansionSelections || [])
    setExpansionDetails(reusableLogoSelections?.expansionDetails || {})
    setGenerationQueue([])
    setPendingPreviewCards([])
    setFailedDirections([])
    setLightboxImage(null)
    setViewStep(stepIndex.references)

    const controller = startWorkflowRequest()
    try {
      const response = referenceImages.length
        ? await fetch('/api/run/analyze', {
            method: 'POST',
            body: (() => {
              const formData = new FormData()
              formData.append('skillId', skill.id)
              formData.append('brief', brief.trim())
              referenceImages.forEach((image) => formData.append('images', image))
              return formData
            })(),
            signal: controller.signal,
          })
        : await fetch('/api/run/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ skillId: skill.id, brief: effectiveBrief.trim() }),
            signal: controller.signal,
          })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '鍒嗘瀽澶辫触銆?)

      const nextAnalysis = data as Analysis
      setAnalysis(nextAnalysis)
      setUploadedFiles((data.uploadedFiles || []) as UploadedFile[])
      setCheckedReferences(nextAnalysis.selectedReferences.map((reference) => reference.file))
      setSelectedDeliveryIds(
        (nextAnalysis.deliveryOptions?.length ? nextAnalysis.deliveryOptions : skill.guidance?.deliveryOptions || [])
          .filter((item) => item.selected)
          .map((item) => item.id),
      )
      setSelectedInferredChoices(
        Object.fromEntries((nextAnalysis.inferredChoices || []).map((choice) => [choice.id, choice.options[0]?.id || ''])),
      )
      setCustomInferredChoices({})
      setSelectedThemeDirection(nextAnalysis.confirmation?.options?.[0] || '')
      setMessages((current) => [
        ...current.filter((message) => message.id !== 'thinking'),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: nextAnalysis.message,
        },
      ])
    } catch (submitError) {
      if (isAbortError(submitError)) {
        setError('')
        setViewStep(stepIndex.brief)
        return
      }
      setError(submitError instanceof Error ? submitError.message : '鍒嗘瀽澶辫触銆?)
      setViewStep(stepIndex.brief)
    } finally {
      setLoading(false)
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    setError('')
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          reasoning: {
            apiKey: settingsForm.reasoningApiKey,
            baseURL: settingsForm.reasoningBaseURL,
            model: settingsForm.reasoningModel,
          },
          openai: {
            apiKey: settingsForm.openaiApiKey,
            baseURL: settingsForm.openaiBaseURL,
            imageModel: settingsForm.openaiImageModel,
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '淇濆瓨澶辫触銆?)

      const statusResponse = await fetch('/api/settings')
      if (statusResponse.ok) {
        setSettings((await statusResponse.json()) as SettingsStatus)
      }
      setSettingsForm((current) => ({
        ...current,
        reasoningApiKey: '',
        openaiApiKey: '',
      }))
      setSettingsOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '淇濆瓨澶辫触銆?)
    } finally {
      setSavingSettings(false)
    }
  }

  function toggleReference(file: string) {
    setCheckedReferences((current) =>
      current.includes(file) ? current.filter((item) => item !== file) : [...current, file],
    )
  }

  function getSelectedInferredChoicePayload() {
    return (analysis?.inferredChoices || [])
      .map((choice) => {
        const selectedId = selectedInferredChoices[choice.id] || choice.options[0]?.id || ''
        const selectedOption = choice.options.find((option) => option.id === selectedId)
        const customValue = (customInferredChoices[choice.id] || '').trim()
        const value = selectedId === 'custom'
          ? customValue
          : selectedOption?.value || selectedOption?.label || ''
        return {
          id: choice.id,
          field: choice.field,
          optionId: selectedId,
          label: selectedOption?.label || '鍏朵粬',
          value,
        }
      })
      .filter((item) => item.value.trim())
  }

  function updateInferredChoice(choiceId: string, optionId: string) {
    setSelectedInferredChoices((current) => ({ ...current, [choiceId]: optionId }))
  }

  function updateCustomInferredChoice(choiceId: string, value: string) {
    setCustomInferredChoices((current) => ({ ...current, [choiceId]: value }))
  }

  function startWorkflowRequest() {
    workflowAbortRef.current?.abort()
    const controller = new AbortController()
    workflowAbortRef.current = controller
    return controller
  }

  function stopWorkflowGeneration() {
    workflowAbortRef.current?.abort()
    workflowAbortRef.current = null
    setLoading(false)
    setGenerating(false)
    setGenerationQueue([])
    setPendingPreviewCards([])
    setOperationStatus('宸叉殏鍋滅敓鎴愩€?)
  }

  function rememberLogoSelections(patch: Partial<LogoReuseState> = {}) {
    if (!isLogoSkill) return
    setLogoReuseState((current) => ({
      selectedDeliveryIds: patch.selectedDeliveryIds ?? current?.selectedDeliveryIds ?? selectedDeliveryIds,
      expansionSelections: patch.expansionSelections ?? current?.expansionSelections ?? expansionSelections,
      expansionDetails: patch.expansionDetails ?? current?.expansionDetails ?? expansionDetails,
      logoMockupSize: patch.logoMockupSize ?? current?.logoMockupSize ?? logoMockupSize,
      mockupReferenceImages: patch.mockupReferenceImages ?? current?.mockupReferenceImages ?? mockupReferenceImages,
    }))
  }

  function applyLogoReuseState(scope: 'options' | 'mockup' | 'all' = 'all') {
    if (!logoReuseState) return
    if (scope === 'options' || scope === 'all') {
      setSelectedDeliveryIds(logoReuseState.selectedDeliveryIds)
    }
    if (scope === 'mockup' || scope === 'all') {
      setExpansionSelections(logoReuseState.expansionSelections)
      setExpansionDetails(logoReuseState.expansionDetails)
      setLogoMockupSize(logoReuseState.logoMockupSize)
      setMockupReferenceImages(logoReuseState.mockupReferenceImages)
    }
  }

  function isAbortError(error: unknown) {
    return error instanceof DOMException && error.name === 'AbortError'
  }

  function hasRequirementField(label: string) {
    return brief.split('\n').some((line) => line.trimStart().startsWith(`${label}锛歚))
  }

  function toggleRequirementField(label: string) {
    const prefix = `${label}锛歚
    setBrief((current) => {
      const lines = current.split('\n')
      const existingIndex = lines.findIndex((line) => line.trimStart().startsWith(prefix))

      if (existingIndex >= 0) {
        const nextLines = lines.filter((_, index) => index !== existingIndex)
        return nextLines.join('\n').replace(/\n{3,}/g, '\n\n').trimStart()
      }

      const separator = current.trim().length > 0 && !current.endsWith('\n') ? '\n' : ''
      return `${current}${separator}${prefix}`
    })
  }

  function selectReferenceImages(files: FileList | File[] | null) {
    if (!files) return
    const pickedFiles = Array.from(files)
    const images = pickedFiles.filter((file) => file.type.startsWith('image/'))
    if (pickedFiles.length > 0 && images.length === 0) {
      setError('璇锋嫋鍏ュ浘鐗囨枃浠躲€?)
      return
    }
    setError('')
    setReferenceImages((current) => [...current, ...images].slice(0, 8))
  }

  function handleReferenceDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDraggingReference(true)
  }

  function handleReferenceDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingReference(false)
    }
  }

  function handleReferenceDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingReference(false)
    selectReferenceImages(event.dataTransfer.files)
  }

  function removeReferenceImage(indexToRemove: number) {
    setReferenceImages((current) => current.filter((_, index) => index !== indexToRemove))
  }

  function selectMultiAngleImages(slotId: string, files: FileList | File[] | null) {
    if (!files) return
    const pickedFiles = Array.from(files)
    const images = pickedFiles.filter((file) => file.type.startsWith('image/'))
    if (pickedFiles.length > 0 && images.length === 0) {
      setError('璇蜂笂浼犲浘鐗囨枃浠躲€?)
      return
    }
    setError('')
    setMultiAngleFiles((current) => ({
      ...current,
      [slotId]: [...(current[slotId] || []), ...images].slice(0, 4),
    }))
  }

  function removeMultiAngleImage(slotId: string, indexToRemove: number) {
    setMultiAngleFiles((current) => ({
      ...current,
      [slotId]: (current[slotId] || []).filter((_, index) => index !== indexToRemove),
    }))
  }

  function buildMultiAngleBrief(baseBrief: string) {
    if (!isMultiAngleSkill) return baseBrief
    const uploadedAngles = multiAngleSlots
      .filter((slot) => (multiAngleFiles[slot.id] || []).length > 0)
      .map((slot) => `${slot.label}: ${multiAngleFiles[slot.id].length} 寮燻)
      .join('\n')
    const modeText = multiAngleOutputMode === 'combined'
      ? '鐢熸垚鍦ㄥ悓涓€寮犲浘鐗囬噷锛屾帓鐗堜负澶氳搴﹁鍥惧悎闆?
      : '鍒嗗紑鐢熸垚锛屾瘡涓搴﹀崟鐙緭鍑哄浘鐗?
    const optionBrief = [
      '浜у搧澶氳搴﹁鍥句笓灞為厤缃細',
      `瀵煎嚭瑙嗗浘鏁伴噺锛?{multiAngleViewCount} 涓鍥綻,
      `杈撳嚭鏂瑰紡锛?{modeText}`,
      '宸蹭笂浼犺搴︼細',
      uploadedAngles || '鏈寜瑙掑害涓婁紶鍥剧墖锛屼絾鍙兘宸查€氳繃閫氱敤鍙傝€冨浘涓婁紶銆?,
      '涓€鑷存€х‖鎬ц姹傦細鐢熸垚缁撴灉蹇呴』涓ユ牸淇濇寔鍙傝€冧骇鍝佺殑鍚屼竴 SKU 澶栬锛屼笉鏀瑰彉棰滆壊銆佹潗璐ㄣ€佹瘮渚嬨€佺粨鏋勩€丩ogo銆佹爣绛俱€佹枃瀛椾綅缃€佺汗鐞嗐€佹帴鍙ｃ€侀厤浠跺拰鍖呰淇℃伅銆?,
      '濡傛灉缂哄皯鏌愪簺瑙掑害锛屽彧鑳戒繚瀹堟帹鏂紱闅愯棌缁撴瀯涓嶈兘纭畾鏃惰鍦ㄥ垎鏋愪腑鏍囨敞椋庨櫓銆?,
    ].join('\n')
    return [baseBrief.trim(), optionBrief].filter(Boolean).join('\n\n')
  }

  function selectMockupReferenceImages(files: FileList | File[] | null) {
    if (!files) return
    const pickedFiles = Array.from(files)
    const images = pickedFiles.filter((file) => file.type.startsWith('image/'))
    if (pickedFiles.length > 0 && images.length === 0) {
      setError('璇蜂笂浼犲浘鐗囦綔涓烘牱鏈哄弬鑰冨浘銆?)
      return
    }
    setError('')
    setMockupReferenceImages((current) => {
      const next = [...current, ...images].slice(0, 6)
      rememberLogoSelections({ mockupReferenceImages: next })
      return next
    })
  }

  function handleMockupReferenceDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDraggingMockupReference(true)
  }

  function handleMockupReferenceDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDraggingMockupReference(false)
    }
  }

  function handleMockupReferenceDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDraggingMockupReference(false)
    selectMockupReferenceImages(event.dataTransfer.files)
  }

  function removeMockupReferenceImage(indexToRemove: number) {
    setMockupReferenceImages((current) => {
      const next = current.filter((_, index) => index !== indexToRemove)
      rememberLogoSelections({ mockupReferenceImages: next })
      return next
    })
  }

  function showLightboxImage(item: LightboxItem) {
    setLightboxZoom(1)
    setLightboxPan({ x: 0, y: 0 })
    setLightboxDrag(null)
    setLightboxImage(item)
  }

  function openLightbox(imageUrl: string, title: string, items: LightboxItem[] = []) {
    const nextItems = items.length > 0 ? items : [{ imageUrl, title }]
    setLightboxItems(nextItems)
    showLightboxImage(nextItems.find((item) => item.imageUrl === imageUrl) || nextItems[0])
  }

  function resetLightboxView() {
    setLightboxZoom(1)
    setLightboxPan({ x: 0, y: 0 })
    setLightboxDrag(null)
  }

  function closeLightbox() {
    resetLightboxView()
    setLightboxImage(null)
    setLightboxItems([])
  }

  function moveLightbox(delta: number) {
    if (!lightboxImage || lightboxItems.length <= 1) return
    const currentIndex = lightboxItems.findIndex((item) => item.imageUrl === lightboxImage.imageUrl)
    const safeIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (safeIndex + delta + lightboxItems.length) % lightboxItems.length
    showLightboxImage(lightboxItems[nextIndex])
  }

  function zoomLightbox(nextZoom: number) {
    const clampedZoom = Math.min(5, Math.max(0.5, nextZoom))
    setLightboxZoom(clampedZoom)
    if (clampedZoom <= 1) {
      setLightboxPan({ x: 0, y: 0 })
      setLightboxDrag(null)
    }
  }

  function handleLightboxWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault()
    const direction = event.deltaY < 0 ? 1 : -1
    const step = event.ctrlKey ? 0.28 : 0.16
    zoomLightbox(lightboxZoom + direction * step)
  }

  function handleLightboxPointerDown(event: MouseEvent<HTMLDivElement>) {
    if (lightboxZoom <= 1) return
    event.preventDefault()
    setLightboxDrag({
      startX: event.clientX,
      startY: event.clientY,
      x: lightboxPan.x,
      y: lightboxPan.y,
    })
  }

  function handleLightboxPointerMove(event: MouseEvent<HTMLDivElement>) {
    if (!lightboxDrag) return
    setLightboxPan({
      x: lightboxDrag.x + event.clientX - lightboxDrag.startX,
      y: lightboxDrag.y + event.clientY - lightboxDrag.startY,
    })
  }

  function stopLightboxDrag() {
    setLightboxDrag(null)
  }

  function toggleGenerationTarget(directionId: string) {
    setSelectedGenerationIds((current) =>
      current.includes(directionId) ? current.filter((id) => id !== directionId) : [...current, directionId],
    )
  }

  function toggleDeliverySelection(optionId: string) {
    setSelectedDeliveryIds((current) => {
      const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      rememberLogoSelections({ selectedDeliveryIds: next })
      return next
    })
  }

  async function confirmReferences() {
    if (!analysis) return
    if (hasOptionStep && selectedDeliveryIds.length === 0) {
      setError('璇疯嚦灏戦€夋嫨涓€涓緭鍑烘柟鍚戙€?)
      setViewStep(stepIndex.options)
      return
    }
    setLoading(true)
    setError('')
    const controller = startWorkflowRequest()
    try {
      const response = await fetch('/api/run/confirm-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          projectId: analysis.projectId,
          selectedReferenceFiles: checkedReferences,
          selectedDeliveryIds,
          selectedThemeDirection,
          selectedInferredChoices: getSelectedInferredChoicePayload(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '纭澶辫触銆?)

      const nextDirection = data as DirectionResult
      setViewStep(stepIndex.direction)
      setDirectionResult(nextDirection)
      setSelectedDirection(nextDirection.directions[0]?.id || '')
      setGenerationScope('single')
      setSelectedGenerationIds([])
      setLogoVariantCount(1)
      setLogoMockupSize('1024x1024')
      setPromptText(nextDirection.imagePrompt.positive || '')
      setPromptConfirmed(false)
      setImageResult(null)
      setImageResults([])
      setExpansionResults([])
      setSelectedBaseImageId('')
      setExpansionSelections(isLogoSkill ? logoReuseState?.expansionSelections || expansionSelections : [])
      setExpansionDetails(isLogoSkill ? logoReuseState?.expansionDetails || expansionDetails : {})
      setMockupReferenceImages(isLogoSkill ? logoReuseState?.mockupReferenceImages || mockupReferenceImages : [])
      setGenerationQueue([])
      setPendingPreviewCards([])
      setFailedDirections([])
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            checkedReferences.length > 0
              ? `宸茬‘璁?${checkedReferences.length} 涓弬鑰冭祫鏂欍€傝閫夋嫨涓€涓柟鍚戝悗缁х画纭鎻愮ず璇嶃€俙
              : '浣犳病鏈夐€夋嫨鍙傝€冭祫鏂欍€傜幇鍦ㄥ皢浠呭熀浜庢妧鑳借鏄庡拰闇€姹傜户缁€?,
        },
      ])
    } catch (confirmError) {
      if (isAbortError(confirmError)) {
        setError('')
        return
      }
      setError(confirmError instanceof Error ? confirmError.message : '纭澶辫触銆?)
    } finally {
      setLoading(false)
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  function confirmPrompt() {
    setPromptConfirmed(true)
    setViewStep(stepIndex.generate)
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '鎻愮ず璇嶅凡纭銆傜幇鍦ㄥ彲浠ヨ皟鐢?gpt-image-2 鐢熷浘銆?,
      },
    ])
  }

  function getExpansionOptions() {
    if (isLogoSkill && (imageResults.length > 0 || expansionResults.length > 0)) {
      return inferLogoMockupOptions(brief)
    }
    const skillExpansions = skill?.guidance?.deliveryOptions || []
    const options = skillExpansions.filter((item) => !item.id.endsWith('-main') && !item.id.includes('hero'))
    if (imageResults.length > 0 || expansionResults.length > 0) {
      return [
        ...options,
        {
          id: 'custom-followup',
          title: '鏂囧瓧璋冩暣',
          description: '鐩存帴鎸夌収搴曢儴杈撳叆鐨勬枃瀛楋紝瀵归€変腑鍥剧墖缁х画璋冩暣銆?,
          selected: false,
        },
      ]
    }
    return options
  }

  function getSelectedExpansions() {
    return getExpansionOptions().filter((item) => expansionSelections.includes(item.id))
  }

  useEffect(() => {
    if (!isLogoSkill || imageResults.length === 0 || expansionSelections.length > 0) return
    const recommended = inferLogoMockupOptions(brief).find((item) => item.selected)
    if (recommended) setExpansionSelections([recommended.id])
  }, [brief, expansionSelections.length, imageResults.length, isLogoSkill])

  function getExpansionFields(optionId: string): ExpansionField[] {
    if (isLogoSkill && optionId.startsWith('logo-mockup-')) {
      return [
        {
          id: 'requirements',
          label: '鏍锋満瑕佹眰',
          placeholder: '渚嬪锛氭斁鍦ㄥザ鑼舵澂銆佸鍗栬鍜岄棬搴楃伅绠变笂锛屽姞鍏ヨ嚜鐒舵闈€佹殩鍏夈€佹潗璐ㄩ槾褰卞拰鍝佺墝鑹插欢灞曪紝Logo 娓呮櫚涓嶅彉褰€?,
        },
      ]
    }
    if (isLogoSkill && optionId === 'custom-followup') {
      return [
        {
          id: 'requirements',
          label: '鑷畾涔夋牱鏈哄満鏅?,
          placeholder: '渚嬪锛氱敓鎴愬疇鐗╃帺鍏峰搧鐗岀殑鍖呰鐩掋€佸悐鐗屽拰搴楅摵闂ㄥご鏍锋満锛岄鏍兼俯鏆栧彲鐖便€?,
        },
      ]
    }
    const fields: Record<string, ExpansionField[]> = {
      'icon-set': [
        {
          id: 'subjects',
          label: '瑕佺敓鎴愬摢浜涘浘鏍?,
          placeholder: '渚嬪锛氭悳绱€佽喘鐗╄溅銆佷紭鎯犲埜銆佸鏈嶃€佺墿娴併€佷細鍛樸€備細鎸夊垎闅旂鎷嗗紑锛屾瘡涓崟鐙敓鎴愪竴寮犮€?,
        },
      ],
      'icon-single': [
        {
          id: 'target',
          label: '瑕佺簿淇摢閲?,
          placeholder: '渚嬪锛氱幓鐠冭川鎰熸洿閫氶€忋€佽竟缂橀珮鍏夋洿鏄庢樉銆佷富浣撴洿绔嬩綋銆佸噺灏戣儗鏅楗?,
        },
        {
          id: 'strength',
          label: '绮句慨寮哄害',
          options: ['杞诲井璋冩暣', '鏄庢樉浼樺寲', '澶у箙閲嶅'],
        },
      ],
      'icon-angles': [
        {
          id: 'angle',
          label: '缁熶竴鎴愪粈涔堣搴?,
          options: ['绛夎酱渚?45掳', '姝ｈ瑙?, '杞讳刊瑙?, '宸﹀墠鏂?, '鍙冲墠鏂?],
        },
        {
          id: 'layout',
          label: '鍛堢幇鏂瑰紡',
          options: ['鍗曞紶涓诲浘', '澶氳搴﹀姣?, '涔濆鏍奸泦鍚?],
        },
      ],
      'icon-materials': [
        {
          id: 'material',
          label: '鏀规垚浠€涔堟潗璐?,
          options: ['姣涚幓鐠?, '閫忔槑鐜荤拑', '杞硸鍑濊兌', '閲戝睘閾?, '闄剁摲閲夐潰', '娑叉€侀噾灞?],
        },
        {
          id: 'color',
          label: '棰滆壊绯荤粺',
          placeholder: '渚嬪锛氳摑绱鎶€鎰熴€佽摑榛勯珮浜€侀摱鐧介€忔槑銆佺矇姗欐笎鍙?,
        },
      ],
      'custom-followup': [
        {
          id: 'requirements',
          label: '璋冩暣瑕佹眰',
          placeholder: '渚嬪锛氭妸褰撳墠鍥炬爣鏀规垚姣涚幓鐠冩潗璐紝淇濈暀钃濊壊绉戞妧鎰熷拰绛夎酱渚ц瑙掋€?,
        },
      ],
      'logo-symbol': [
        {
          id: 'requirements',
          label: '鍥惧舰鏍囪姹?,
          placeholder: '渚嬪锛氬彧淇濈暀灞辨按鍜屼簯闆惧厓绱狅紝涓嶈鏂囧瓧锛岄€傚悎澶村儚鍜?favicon銆?,
        },
      ],
      'logo-wordmark': [
        {
          id: 'requirements',
          label: '鏂囧瓧鏍囪姹?,
          placeholder: '渚嬪锛氫腑鏂囨洿鐜颁唬锛岃嫳鏂囨洿缁嗛暱锛屾暣浣撻珮绾х畝娲侊紝瀛楄窛鏇磋垝灞曘€?,
        },
      ],
      'logo-combination': [
        {
          id: 'layout',
          label: '缁勫悎鏂瑰紡',
          options: ['鍥惧乏瀛楀彸', '鍥句笂瀛椾笅', '鍦嗗舰寰界珷', '妯増缁勫悎', '绔栫増缁勫悎'],
        },
        {
          id: 'requirements',
          label: '缁勫悎瑕佹眰',
          placeholder: '渚嬪锛氫腑鏂囧湪涓娿€佽嫳鏂囧湪涓嬶紝鍥惧舰鍜屾枃瀛楀彲浠ユ媶寮€鐙珛浣跨敤銆?,
        },
      ],
      'logo-colorways': [
        {
          id: 'colorway',
          label: '閰嶈壊鐗堟湰',
          options: ['榛戠櫧鐗?, '涓昏壊鐗?, '鍙嶇櫧鐗?, '閲戣壊楂樼骇鐗?, '鑷劧缁胯壊鐗?, '绉戞妧钃濈増'],
        },
      ],
      'logo-usage': [
        {
          id: 'scene',
          label: '搴旂敤鍦烘櫙',
          options: ['闂ㄥご鎷涚墝', '鍖呰鐩?, '鏉韩/鐡惰韩', '鍚嶇墖', '绀惧獟澶村儚', 'App 鍥炬爣'],
        },
        {
          id: 'requirements',
          label: '棰勮瑕佹眰',
          placeholder: '渚嬪锛氭斁鍦ㄨ尪鍙跺寘瑁呭拰闂ㄥ簵鎷涚墝涓婏紝淇濇寔 Logo 鎵佸钩娓呮櫚銆?,
        },
      ],
      'ip-three-view': [
        {
          id: 'viewType',
          label: '涓夎鍥剧被鍨?,
          options: ['3D 涓夎鍥?, '2D 骞抽潰涓夎鍥?, '3D + 2D 閮借'],
        },
        {
          id: 'consistency',
          label: '涓€鑷存€ц姹?,
          placeholder: '渚嬪锛氫弗鏍间繚鎸佸綋鍓嶄富鍥剧殑澶磋韩姣斻€佺溂鐫涖€佹牳蹇冭瑙夐挬瀛愬拰閰嶈壊鍒嗗尯銆?,
        },
      ],
      'ip-expressions': [
        {
          id: 'style',
          label: '琛ㄦ儏鍖呴鏍?,
          options: ['3D 鍝戝厜娼帺', '2D 绮楅粦鎻忚竟', '3D + 2D 閮借'],
        },
        {
          id: 'expressions',
          label: '琛ㄦ儏娓呭崟',
          placeholder: '渚嬪锛氬偛濞囥€佸紑蹇冦€佷繌鐨€佹儕璁躲€佹劋鎬掋€佹偛浼ゃ€傜暀绌哄垯鎸夐粯璁?6 涓〃鎯呫€?,
        },
      ],
      'ip-pose-sheet': [
        {
          id: 'style',
          label: '鍔ㄤ綔搴撻鏍?,
          options: ['3D 鍝戝厜娼帺', '2D 绮楅粦鎻忚竟', '3D + 2D 閮借'],
        },
        {
          id: 'poses',
          label: '鍔ㄤ綔娓呭崟',
          placeholder: '渚嬪锛氭爣鍑嗙珯濮裤€佸弻鎵嬪弶鑵般€佽共鍧愩€佹尌鎵嬨€佸璺戙€佽洞鍦般€傜暀绌哄垯鎸夐粯璁?6 涓姩浣溿€?,
        },
      ],
      'ip-merch': [
        {
          id: 'industryGroup',
          label: '鍛ㄨ竟琛屼笟鍒嗙粍',
          options: ['鑷姩鍒ゆ柇', '绉戞妧/浜掕仈缃?, '鏂囧垱/鏁欒偛', '娼帺/鏀惰棌', '椁愰ギ/椋熷搧', '鏂囨梾/鍩庡競'],
        },
        {
          id: 'requirements',
          label: '鍛ㄨ竟瑕佹眰',
          placeholder: '渚嬪锛氬叚浠跺鍚堝浘锛岀瑪璁版湰灞呬腑锛屾墜鏈哄３銆佸挅鍟＄焊鏉€侀宸剧焊銆佹瘺缁掗挜鍖欐墸鍜屽埡缁ｈ创鍥寸粫灞曠ず銆?,
        },
      ],
      'ip-blind-box': [
        {
          id: 'theme',
          label: '鐩茬洅涓婚',
          options: ['鍥涘绯诲垪', '鑱屼笟绯诲垪', '鎯呯华绯诲垪', '鑺傛棩绯诲垪', '鑷畾涔変富棰?],
        },
        {
          id: 'mode',
          label: '鐢熷浘妯″紡',
          options: ['浜у搧闄堝垪鍥?, '鍦烘櫙鏁呬簨娴锋姤澧?, '涓よ€呴兘瑕?],
        },
        {
          id: 'requirements',
          label: '涓婚琛ュ厖',
          placeholder: '渚嬪锛氭槬鏃ヨ尪鍥€佸鏃ュ啺楗€佺鏃ユ鑺便€佸啲鏃ュ洿鐐夈€侀殣钘忔灞辩鑼剁伒銆?,
        },
      ],
      'ip-scenes': [
        {
          id: 'scene',
          label: '鏂板満鏅富棰?,
          placeholder: '渚嬪锛氶棬搴楁柊鍝佸彂甯冦€佽妭鏃ラ檺瀹氥€佸煄甯傛墦鍗°€佸寘瑁呬簰鍔ㄣ€佹埛澶栨椿鍔ㄣ€?,
        },
        {
          id: 'ratio',
          label: '鐢婚潰姣斾緥',
          options: ['9:16 绔栫増娴锋姤', '16:9 妯増娴锋姤', '1:1 绀惧獟鍥?],
        },
      ],
      'ip-html-proposal': [
        {
          id: 'scope',
          label: '鎻愭鑼冨洿',
          options: ['瀹屾暣鍝佺墝 IP 鎻愭', '鍙暣鐞嗗綋鍓嶅凡鐢熸垚鍐呭', '绛栫暐 + 搴旂敤鎷撳睍', '瀹㈡埛姹囨姤绠€鐗?],
        },
        {
          id: 'requirements',
          label: '鎻愭瑕佹眰',
          placeholder: '渚嬪锛氱幇浠ｇ畝娲侊紝鍖呭惈鍝佺墝鑳屾櫙銆両P绛栫暐銆佹柟妗堝睍绀恒€佷笁瑙嗗浘銆佽〃鎯呭寘銆佸懆杈瑰拰鏂规瀵规瘮銆?,
        },
      ],
      'set-add-selling-point': [
        {
          id: 'sellingPoint',
          label: '鏂板鍗栫偣',
          placeholder: '渚嬪锛氶槻婕忋€佸揩鍏呫€侀暱缁埅銆佷究鎼烘敹绾炽€傜暀绌哄垯鎸夐粯璁よˉ鍏呬竴寮犲崠鐐归〉銆?,
        },
        {
          id: 'pageType',
          label: '鐢婚潰椤靛瀷',
          options: ['鍗栫偣椤?, '鍔熻兘鐗瑰啓椤?, '浣跨敤鍦烘櫙椤?, '瀵规瘮璇存槑椤?, '閰嶄欢娓呭崟椤?],
        },
      ],
      'set-unify-style': [
        {
          id: 'style',
          label: '缁熶竴鏂瑰悜',
          placeholder: '渚嬪锛氱粺涓€鎴愯嚜鐒跺共鍑€鐨勬祬鑹叉鎷嶏紝淇濈暀鍟嗗搧鐪熷疄棰滆壊锛屾枃瀛楀眰绾ф洿娓呮櫚銆?,
        },
      ],
      'set-single-retouch': [
        {
          id: 'target',
          label: '浼樺寲閲嶇偣',
          placeholder: '渚嬪锛氬晢鍝佷富浣撴洿澶с€佹枃瀛楁洿娓呮櫚銆佸噺灏戣儗鏅楗般€佸姞寮烘潗璐ㄧ粏鑺傘€?,
        },
      ],
      'set-resize': [
        {
          id: 'ratio',
          label: '鐩爣姣斾緥',
          options: ['3:4', '4:3', '9:16', '16:9', '1:1', '1464脳600'],
        },
        {
          id: 'requirements',
          label: '閫傞厤瑕佹眰',
          placeholder: '渚嬪锛氶€傞厤浜氶┈閫?A+ 鍏ㄥ鍥撅紝淇濈暀涓诲晢鍝佸拰鏍稿績鍗栫偣锛屼笉瑁佹帀 logo銆?,
        },
      ],
    }
    return fields[optionId] || [
      {
        id: 'requirements',
        label: '琛ュ厖鎵╁睍瑕佹眰',
        placeholder: '璇存槑浣犲笇鏈涜繖娆℃墿灞曞叿浣撴敼鍙樹粈涔堛€佷繚鐣欎粈涔堛€?,
      },
    ]
  }

  function updateExpansionDetail(optionId: string, fieldId: string, value: string) {
    setExpansionDetails((current) => {
      const next = {
        ...current,
        [optionId]: {
          ...(current[optionId] || {}),
          [fieldId]: value,
        },
      }
      rememberLogoSelections({ expansionDetails: next })
      return next
    })
  }

  function getExpansionDetailText(optionId: string) {
    const values = expansionDetails[optionId] || {}
    return getExpansionFields(optionId)
      .map((field) => {
        const value = values[field.id]?.trim()
        return value ? `${field.label}: ${value}` : ''
      })
      .filter(Boolean)
      .join('\n')
  }

  function splitIconSubjects(value: string) {
    return value
      .split(/[銆?锛?锛沑n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function buildExpansionTasks(baseImage: GeneratedImage, expansions: DeliveryOption[]) {
    return expansions.flatMap((expansion) => {
      const detailText =
        getExpansionDetailText(expansion.id) ||
        `鎸夐粯璁ゆ墿灞曟柟鍚戞墽琛岋細${expansion.title}銆?{expansion.description}`

      if (expansion.id === 'icon-set') {
        const subjects = splitIconSubjects(expansionDetails[expansion.id]?.subjects || '')
        if (subjects.length === 0) {
          return [{
            id: `${baseImage.id}-${expansion.id}-${crypto.randomUUID()}`,
            directionId: `${baseImage.directionId}-${expansion.id}`,
            title: expansion.title,
            description: expansion.description,
            expansion,
            detailText,
          }]
        }
        return subjects.map((subject) => ({
          id: `${baseImage.id}-${expansion.id}-${subject}-${crypto.randomUUID()}`,
          directionId: `${baseImage.directionId}-${expansion.id}-${subject}`,
          title: `${subject}鍥炬爣`,
          description: expansion.description,
          expansion,
          detailText: [
            `鍗曠嫭鐢熸垚鍥炬爣: ${subject}`,
            '杩欐槸鎴愬鍥炬爣涓殑涓€涓嫭绔嬪浘鏍囷紝涓嶈鎶婂涓浘鏍囨斁鍦ㄥ悓涓€寮犲浘閲屻€?,
            `鏁村鍥炬爣娓呭崟: ${subjects.join('銆?)}`,
          ].join('\n'),
        }))
      }

      return [{
        id: `${baseImage.id}-${expansion.id}-${crypto.randomUUID()}`,
        directionId: `${baseImage.directionId}-${expansion.id}`,
        title: expansion.title,
        description: expansion.description,
        expansion,
        detailText,
      }]
    })
  }

  async function retryFailedDirectionsWithReasoning(text: string, userMessage: ChatMessage) {
    if (!analysis || failedDirections.length === 0) return false
    setGenerating(true)
    setError('')
    setOperationStatus('SkillCrew 姝ｅ湪鏍规嵁浣犵殑琛ュ厖瑕佹眰閲嶆柊鎬濊€冨け璐ュ浘鐗囥€?)
    const controller = startWorkflowRequest()
    try {
      let data: { message?: string; promptPatch?: string } = {}
      try {
        const response = await fetch('/api/run/reason-followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            projectId: analysis.projectId,
            userRequest: text,
            failedDirections,
            currentPrompt: promptText,
          }),
        })
        data = (await readJsonResponse(response)) as { message?: string; promptPatch?: string; error?: string }
        if (!response.ok) {
          data = {
            message: '鎺ㄧ悊鎺ュ彛鏆傛椂澶辫触锛屾垜浼氬厛鎸変綘鐨勬枃瀛楄姹傜洿鎺ラ噸璇曞け璐ュ浘鐗囥€?,
            promptPatch: text,
          }
        }
      } catch {
        data = {
          message: '鎺ㄧ悊鎺ュ彛鏆傛椂澶辫触锛屾垜浼氬厛鎸変綘鐨勬枃瀛楄姹傜洿鎺ラ噸璇曞け璐ュ浘鐗囥€?,
          promptPatch: text,
        }
      }
      const promptPatch = String(data.promptPatch || text)
      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || `鎴戜細鎸変綘鐨勮ˉ鍏呰姹傞噸璇?${failedDirections.length} 寮犲け璐ュ浘鐗囥€俙,
        },
      ])
      setGenerationQueue(failedDirections.map((direction) => direction.id))
      setPendingPreviewCards((current) => [
        ...current,
        ...failedDirections.map((direction) => ({ id: direction.id, title: direction.title })),
      ])
      const { results, failures } = await generateDirections(failedDirections, promptPatch, controller.signal)
      if (results.length > 0) {
        setImageResult({ imageUrl: results[0].imageUrl, revisedPrompt: results[0].revisedPrompt })
        setSelectedBaseImageId((current) => current || results[0].id)
      }
      setFailedDirections(failures)
      if (failures.length) {
        setError(`杩樻湁 ${failures.length} 寮犵敓鎴愬け璐ワ紝鍙互缁х画鍦ㄥ簳閮ㄦ弿杩拌姹傚悗閲嶈瘯銆俙)
      } else {
        setError('')
        setOperationStatus('澶辫触鍥剧墖宸查噸鏂扮敓鎴愬畬鎴愩€?)
      }
      return true
    } catch (retryError) {
      if (isAbortError(retryError)) {
        setError('')
        return true
      }
      setError(retryError instanceof Error ? retryError.message : '閲嶈瘯澶辫触銆?)
      return true
    } finally {
      setGenerating(false)
      setGenerationQueue([])
      setPendingPreviewCards([])
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  async function submitFollowUp() {
    const text = followUpText.trim()
    if (!text) return
    if (!skill) return
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }
    setFollowUpText('')
    setOperationStatus('')

    if (failedDirections.length > 0) {
      await retryFailedDirectionsWithReasoning(text, userMessage)
      return
    }

    if (adjustableImages.length > 0) {
      setExpansionSelections(['custom-followup'])
      setExpansionDetails({
        'custom-followup': {
          requirements: text,
        },
      })
      setViewStep(stepIndex.expansion)
      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '宸叉妸浣犵殑鏂囧瓧闇€姹傛斁鍏ャ€屾枃瀛楄皟鏁淬€嶃€傝閫夋嫨瑕佽皟鏁寸殑鍥剧墖鍚庯紝鍙互鐩存帴鐢熸垚鎵╁睍鍥俱€?,
        },
      ])
      return
    }

    setLoading(true)
    setViewStep(stepIndex.brief)
    setError('')
    setMessages((current) => [...current, userMessage])
    const controller = startWorkflowRequest()
    try {
      const response = await fetch('/api/run/brief-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          skillId: skill.id,
          currentBrief: brief,
          userMessage: text,
          history: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      })
      const data = await readJsonResponse(response) as {
        message?: string
        updatedBrief?: string
        readyToAnalyze?: boolean
        providerError?: string
        error?: string
      }
      if (!response.ok) throw new Error(data.error || '闇€姹傛暣鐞嗗け璐ャ€?)
      if (data.updatedBrief) setBrief(data.updatedBrief)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || '鎴戝凡鏍规嵁褰撳墠鎶€鑳芥暣鐞嗕簡浣犵殑闇€姹傦紝鍙互缁х画琛ュ厖鎴栧彂閫佺粰鎶€鑳姐€?,
        },
      ])
      setOperationStatus(
        data.providerError
          ? `鏅鸿兘鎺ㄧ悊鏆傛椂涓嶅彲鐢紝宸叉敼鐢ㄦ湰鍦拌鍒欐暣鐞嗭細${toUserFacingChineseError(data.providerError)}`
          : data.readyToAnalyze
            ? '闇€姹傚凡鏁寸悊瀹屾暣锛屽彲浠ョ偣鍑汇€屽彂閫佺粰鎶€鑳姐€嶈繘鍏ヤ笅涓€姝ャ€?
            : '宸叉洿鏂颁笂鏂归渶姹傝緭鍏ユ锛屼綘鍙互缁х画瀵硅瘽琛ュ厖銆?,
      )
    } catch (chatError) {
      if (isAbortError(chatError)) {
        setError('')
        return
      }
      const fallbackBrief = [brief.trim(), text].filter(Boolean).join('\n')
      setBrief(fallbackBrief)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: chatError instanceof Error
            ? `闇€姹傛帹鐞嗘殏鏃跺け璐ワ紝鎴戝厛鎶婁綘鐨勫唴瀹规暣鐞嗚繘杈撳叆妗嗭細${chatError.message}`
            : '闇€姹傛帹鐞嗘殏鏃跺け璐ワ紝鎴戝厛鎶婁綘鐨勫唴瀹规暣鐞嗚繘杈撳叆妗嗐€?,
        },
      ])
    } finally {
      setLoading(false)
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  async function generateImageForDirection(
    directionId: string,
    directionTitle: string,
    prompt?: string,
    referenceImageUrl?: string,
    signal?: AbortSignal,
    sizeOverride?: string,
    extraReferenceImages: File[] = [],
  ) {
    const promptSource = prompt || promptText.trim()
    if (!analysis || !promptSource) {
      throw new Error('璇峰厛纭鎻愮ず璇嶃€?)
    }
    const uploadReferenceNote = uploadedFiles.length
      ? `\n\n宸蹭笂浼?${uploadedFiles.length} 寮犲弬鑰冨浘銆傜敓鎴愭椂蹇呴』鎶婁笂浼犲浘浣滀负浜у搧涓讳綋/璁捐鍙傝€冿紝淇濈暀鐪熷疄浜у搧鐨勫褰€侀鑹层€佹潗璐ㄣ€佹瘮渚嬨€佹枃瀛楀拰鍏抽敭缁嗚妭銆俙
      : ''
    const requestSize = sizeOverride || directionResult?.imagePrompt.size || '1024x1024'
    const requestPrompt = `${promptSource}${uploadReferenceNote}`
    const response = extraReferenceImages.length
      ? await fetch('/api/run/generate-image', {
          method: 'POST',
          body: (() => {
            const formData = new FormData()
            formData.append('projectId', analysis.projectId)
            formData.append('prompt', requestPrompt)
            formData.append('size', requestSize)
            formData.append('directionId', directionId)
            formData.append('directionTitle', directionTitle)
            if (referenceImageUrl) formData.append('referenceImageUrl', referenceImageUrl)
            extraReferenceImages.forEach((image) => formData.append('images', image))
            return formData
          })(),
          signal,
        })
      : await fetch('/api/run/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: analysis.projectId,
            prompt: requestPrompt,
            size: requestSize,
            directionId,
            directionTitle,
            referenceImageUrl,
          }),
          signal,
        })
    const data = await readJsonResponse(response)
    if (!response.ok) throw new Error(data.error || '鐢熷浘澶辫触銆?)
    return data as ImageResult
  }

  function buildDirectionPrompt(direction: DirectionOption, extraInstruction = '') {
    const prompt = isDetailPageSkill
          ? [
              promptText.trim(),
              `鐢熸垚杩欎釜璇︽儏椤垫ā鍧楋細${direction.title}銆俙,
              direction.description,
              '杩欐槸涓€寮犳í鍚戠數鍟嗚鎯呴〉妯″潡銆備笂浼犱骇鍝佸浘蹇呴』浣滀负鐪熷疄鍟嗗搧鍙傝€冿紝鐗堝紡闇€瑕佸寘鍚爣棰樻垨鍗栫偣鏂囨绌洪棿銆佸晢鍝佸鍚戠殑鍟嗕笟涓昏瑙夈€佺粺涓€椋庢牸鍜屽畬鏁磋鎯呴〉妯″潡缁撴瀯銆?,
            ].join('\n')
      : isLogoSkill
        ? [
            promptText.trim(),
            `鐢熸垚杩欎竴濂?Logo 鏂瑰悜锛?{direction.title}銆俙,
            direction.description,
            '蹇呴』鏄墎骞崇煝閲忔爣蹇楋細骞插噣绾挎潯銆佹竻鏅拌竟缂樸€侀€傚悎缂╂斁銆佺鍚堜笓涓氬搧鐗岃瘑鍒郴缁熴€?,
            '蹇呴』浣跨敤绾櫧鑳屾櫙鎴栭€忔槑鑳屾櫙鏁堟灉锛孡ogo 灞呬腑灞曠ず锛屽懆鍥寸暀鍑哄共鍑€瀹夊叏杈硅窛锛涗笉瑕佺敓鎴愪换浣曡楗版€ц儗鏅€?,
            '涓嶈鏍锋満鍦烘櫙锛屼笉瑕佷笁缁存晥鏋滐紝涓嶈鐪熷疄鎽勫奖锛屼笉瑕佸鏉傞槾褰憋紝涓嶈娴洉锛屼笉瑕佸帤閲嶆潗璐紝涓嶈钃濊壊绉戞妧鑳屾櫙锛屼笉瑕佸彂鍏夊厜鏅曪紝涓嶈寰勫悜娓愬彉搴曡壊銆?,
            '濡傛灉鍖呭惈鏂囧瓧锛屽搧鐗屽悕绉板繀椤绘竻鏅板彲璇伙紝涓嶈兘鎷奸敊銆佸彉褰㈡垨鐢熸垚涔辩爜锛涗腑鏂囩瑪鐢荤粨鏋勮绋冲畾銆?,
            '鏋勫浘搴旈€傚悎鍝佺墝涓绘爣璇嗭紝鍙敤浜庡ご鍍忋€侀棬澶淬€佸寘瑁呫€佺綉绔欏拰鍗板埛銆?,
          ].join('\n')
      : isProductImageSetSkill
        ? [
            promptText.trim(),
            `鐢熸垚杩欎竴寮犵數鍟嗗鍥鹃〉闈細${direction.title}銆俙,
            direction.description,
            productSetPageInstruction(direction.id, direction.title),
            '杩欎竴寮犲繀椤绘槸鏁村鍟嗗搧鍥句腑鐨勭嫭绔嬮〉闈紝涓嶈鎶婂寮犲浘鎷艰繘鍚屼竴寮犻噷銆傚晢鍝佸瑙備互鐢ㄦ埛涓婁紶鍟嗗搧鍥句负鍑嗭紱涓昏瑙夈€佺粏鑺傘€佸寘瑁呯被椤甸潰蹇呴』寮鸿繕鍘熶骇鍝侊紝鏁堟灉璇佹槑銆佸満鏅€佷汉鐗╃被椤甸潰鍙互璁╀骇鍝佸急闇插嚭鎴栦笉浣滀负涓昏瑙夈€?,
            '缁х画娌跨敤鏁寸粍鍟嗗搧鍥剧殑缁熶竴鑳屾櫙浣撶郴銆佸厜褰辩郴缁熴€佹枃瀛楃郴缁熴€佽壊褰╃郴缁熷拰鍝佺墝姘旇川锛涗笉鍚岄〉鍨嬪彲浠ュ彉鍖栨瀯鍥撅紝浣嗕笉鑳借烦鎴愬彟涓€濂楅鏍笺€?,
            '鏁村鍥捐鏈夌湡瀹炵數鍟嗚妭濂忓彉鍖栵細鑷冲皯鍖呭惈浜у搧涓昏瑙夈€佺粨鏋?鍒╃泭璇佹槑銆佺敓娲绘垨浣跨敤鍦烘櫙銆佸眬閮ㄧ粏鑺傛垨瀵规瘮璇存槑锛屼笉瑕佽繛缁敓鎴愮浉鍚岀殑浜у搧闄堝垪鐗堝紡銆?,
            '鎻忚堪鍜岀敾闈㈡枃瀛椾娇鐢ㄧ敤鎴锋寚瀹氳瑷€锛涙病鏈夌‘璁ょ殑鍙傛暟銆佽璇併€佹帴鍙ｃ€侀厤浠朵笉瑕佺紪閫犮€?,
          ].join('\n')
        : promptText.trim()
    return [prompt, extraInstruction].filter(Boolean).join('\n\n')
  }

  function logoVariantInstruction(index: number, total: number) {
    if (total <= 1) {
      return 'This is one focused logo concept. Keep the selected direction clear and make the symbol, wordmark, spacing, and scalability feel production-ready.'
    }
    return [
      `This is logo variant ${index + 1} of ${total} for the same selected direction.`,
      'Keep the brand strategy and style direction consistent, but make this variant noticeably different from the others.',
      'Vary the composition, positive/negative space, symbol metaphor, letterform treatment, or icon-wordmark relationship.',
      'Do not create a mockup, 3D render, photo scene, textured background, or decorative presentation board.',
    ].join(' ')
  }

  async function generateDirections(targets: GenerationTarget[], extraInstruction = '', signal?: AbortSignal) {
    const concurrency = 1
    const settledResults: PromiseSettledResult<GeneratedImage>[] = []
    let cursor = 0
    async function worker() {
      while (cursor < targets.length) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        const index = cursor
        cursor += 1
        const direction = targets[index]
        try {
        const generationId = direction.generationId || direction.id
        const result = await generateImageForDirection(
          direction.sourceDirectionId || direction.id,
          direction.title,
          buildDirectionPrompt(direction, extraInstruction),
          '',
          signal,
        )
        const requestedSize = directionResult?.imagePrompt.size || '1024x1024'
        const item: GeneratedImage = {
          id: crypto.randomUUID(),
          directionId: generationId,
          title: direction.title,
          imageUrl: result.imageUrl,
          size: requestedSize,
          revisedPrompt: result.revisedPrompt,
        }
        setImageResults((current) => [...current, item])
        setPendingPreviewCards((current) => current.filter((card) => card.id !== generationId))
          settledResults[index] = { status: 'fulfilled', value: item }
        } catch (reason) {
          settledResults[index] = { status: 'rejected', reason }
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, () => worker()))
    const results = settledResults
      .filter((result): result is PromiseFulfilledResult<GeneratedImage> => result.status === 'fulfilled')
      .map((result) => result.value)
    const failures = settledResults.flatMap((result, index) => {
      if (result.status === 'fulfilled') return []
      const reason = result.reason instanceof Error ? result.reason.message : '鐢熷浘澶辫触銆?
      return [{ ...targets[index], id: targets[index].generationId || targets[index].id, reason }]
    })
    return { results, failures }
  }

  async function generateImage() {
    if (!analysis || !promptText.trim()) {
      setError('璇峰厛纭鎻愮ず璇嶃€?)
      return
    }
    setGenerating(true)
    setError('')
    const controller = startWorkflowRequest()
    try {
      const directions = directionResult?.directions || []
      const baseTargets = generationScope === 'all'
        ? directions
        : generationScope === 'multiple'
          ? directions.filter((direction) => selectedGenerationIds.includes(direction.id))
          : directions.filter((direction) => direction.id === (selectedDirection || directions[0]?.id))
      const targets: GenerationTarget[] = isLogoSkill && baseTargets.length
        ? Array.from({ length: logoVariantCount }, (_, index) => {
            const direction = baseTargets[0]
            return {
              ...direction,
              id: direction.id,
              generationId: `${direction.id}__variant_${index + 1}`,
              sourceDirectionId: direction.id,
              title: logoVariantCount > 1 ? `${direction.title} 路 Variant ${index + 1}` : direction.title,
              description: [
                direction.description,
                logoVariantInstruction(index, logoVariantCount),
              ].join('\n\n'),
            }
          })
        : baseTargets
      if (!targets.length) {
        throw new Error(generationScope === 'multiple' ? '璇疯嚦灏戦€夋嫨涓€涓鐢熸垚鐨勯〉闈€? : '娌℃湁鍙敓鎴愮殑鏂瑰悜銆?)
      }
      setImageResult(null)
      setImageResults([])
      setExpansionResults([])
      setSelectedBaseImageId('')
      setGenerationQueue(targets.map((direction) => direction.generationId || direction.id))
      setPendingPreviewCards(targets.map((direction) => ({ id: direction.generationId || direction.id, title: direction.title })))
      setFailedDirections([])
      const { results, failures } = await generateDirections(targets, '', controller.signal)
      if (failures.length && results.length === 0) {
        setFailedDirections(failures)
        setViewStep(stepIndex.generate)
        setError(`鏈 ${failures.length} 寮犻兘鐢熸垚澶辫触銆傚凡淇濈暀澶辫触鏂瑰悜锛屽彲浠ュ湪涓嬫柟杈撳叆鈥滅户缁敓鎴愬け璐ョ殑鍥锯€濆彧閲嶈瘯杩欎簺鏂瑰悜銆傚け璐ュ師鍥狅細${failures[0]?.reason || '鐢熷浘澶辫触銆?}`)
        return
      }
      if (failures.length) {
        setFailedDirections(failures)
        setError(`鏈?${failures.length} 寮犵敓鎴愬け璐ワ紝鎴愬姛鍥剧墖宸蹭繚鐣欏湪宸︿晶鐢诲粖銆傚彲浠ュ湪涓嬫柟杈撳叆鈥滅户缁敓鎴愬け璐ョ殑鍥锯€濊绯荤粺鍙噸璇曞け璐ユ柟鍚戙€俙)
      }
      setSelectedBaseImageId(results[0]?.id || '')
      setImageResult(results[0] ? { imageUrl: results[0].imageUrl, revisedPrompt: results[0].revisedPrompt } : null)
      setViewStep(stepIndex.expansion)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '鍥剧墖宸茬敓鎴愬苟淇濆瓨鍒板綋鍓嶉」鐩洰褰曘€?,
        },
      ])
    } catch (generateError) {
      if (isAbortError(generateError)) {
        setError('')
        return
      }
      setError(generateError instanceof Error ? generateError.message : '鐢熷浘澶辫触銆?)
    } finally {
      setGenerating(false)
      setGenerationQueue([])
      setPendingPreviewCards([])
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  function toggleExpansion(optionId: string) {
    setExpansionSelections((current) => {
      const next = current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId]
      rememberLogoSelections({ expansionSelections: next })
      return next
    })
  }

  async function downloadImage(imageUrl: string, title: string) {
    if (!imageUrl) throw new Error('娌℃湁鍙笅杞界殑鍥剧墖銆?)
    const suggestedName = `${safeClientFileName(title || 'skillcrew-image')}.png`
    const picker = (window as WindowWithSaveFilePicker).showSaveFilePicker
    if (picker) {
      let fileHandle: FileSystemFileHandle | null = null
      try {
        fileHandle = await picker({
          suggestedName,
          types: [
            {
              description: 'PNG 鍥剧墖',
              accept: { 'image/png': ['.png'] },
            },
          ],
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setOperationStatus('宸插彇娑堜笅杞姐€?)
          return
        }
        throw error
      }
      if (!fileHandle) return
      const url = `/api/download?file=${encodeURIComponent(imageUrl)}&name=${encodeURIComponent(title || 'skillcrew-image')}`
      const response = await fetch(url)
      if (!response.ok) {
        const data = await readJsonResponse(response)
        throw new Error(data.error || '涓嬭浇澶辫触銆?)
      }
      const blob = await response.blob()
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
      setOperationStatus('鍥剧墖宸蹭繚瀛樸€?)
      return
    }
    const response = await fetch('/api/save-image-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: imageUrl,
        name: title || 'skillcrew-image',
      }),
    })
    const data = await readJsonResponse(response)
    if (!response.ok) {
      fallbackBrowserDownload(imageUrl, title || 'skillcrew-image', suggestedName)
      throw new Error(data.error || '鏃犳硶鎵撳紑淇濆瓨绐楀彛锛屽凡灏濊瘯浣跨敤娴忚鍣ㄤ笅杞姐€?)
    }
    if (data.canceled) {
      setOperationStatus('宸插彇娑堜笅杞姐€?)
      return
    }
    setOperationStatus(`鍥剧墖宸蹭繚瀛樺埌锛?{data.path}`)
  }

  async function downloadImages(items: DownloadImageItem[]) {
    const downloadableItems = items.filter((item) => item.imageUrl)
    if (downloadableItems.length === 0) throw new Error('No images to download.')
    if (downloadableItems.length === 1) {
      await downloadImage(downloadableItems[0].imageUrl, downloadableItems[0].title)
      return
    }

    const response = await fetch('/api/save-images-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: downloadableItems.map((item) => ({
          file: item.imageUrl,
          name: item.title || 'skillcrew-image',
        })),
      }),
    })
    const data = await readJsonResponse(response)
    if (!response.ok) {
      throw new Error(data.error || '鎵归噺淇濆瓨澶辫触銆?)
    }
    if (data.canceled) {
      setOperationStatus('宸插彇娑堜笅杞姐€?)
      return
    }
    setOperationStatus(`宸蹭繚瀛?${data.count || downloadableItems.length} 寮犲浘鐗囧埌锛?{data.folder || '鎵€閫夋枃浠跺す'}`)
  }

  async function generateExpansions() {
    if (!analysis || !promptText.trim()) {
      setError('璇峰厛瀹屾垚涓诲浘鐢熸垚銆?)
      return
    }
    const baseImage = adjustableImages.find((item) => item.id === selectedBaseImageId) || adjustableImages[0]
    const expansions = getSelectedExpansions()
    if (!baseImage || expansions.length === 0) {
      setError('璇峰厛閫夋嫨涓€寮犱富鍥惧拰鑷冲皯涓€涓墿灞曢」銆?)
      return
    }
    const expansionTasks = buildExpansionTasks(baseImage, expansions)
    if (expansionTasks.length === 0) {
      setError('娌℃湁鍙敓鎴愮殑鎵╁睍浠诲姟銆?)
      return
    }
    const requestedExpansionSize = isLogoSkill ? logoMockupSize : directionResult?.imagePrompt.size || '1024x1024'
    const mockupReferenceNote = isLogoSkill && mockupReferenceImages.length > 0
      ? `宸蹭笂浼?${mockupReferenceImages.length} 寮犳牱鏈哄弬鑰冨浘銆傚繀椤婚珮搴﹀弬鑰冭繖浜涘浘鐨勬牱鏈哄満鏅€佹瀯鍥惧叧绯汇€佹潗璐ㄨ川鎰熴€佸厜褰辨皼鍥淬€侀亾鍏风粍鍚堝拰琛屼笟瑙嗚璇█锛汱ogo 浠嶄互褰撳墠閫変腑鐨?Logo 鏂规涓哄噯锛屼笉瑕佺収鎼弬鑰冨浘閲岀殑鍏朵粬鍝佺墝鏍囪瘑鎴栨枃瀛椼€俙
      : ''
    rememberLogoSelections()
    setGenerating(true)
    setError('')
    const pendingCards = expansionTasks.map((task) => ({
      id: task.id,
      title: `${task.title} 路 ${baseImage.title}`,
    }))
    setPendingPreviewCards((current) => [...current, ...pendingCards])
    const controller = startWorkflowRequest()
    try {
      let expansionReasoning: { message?: string; taskPrompts?: Array<{ id: string; promptPatch: string }> } = {}
      try {
        const response = await fetch('/api/run/reason-expansion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            projectId: analysis.projectId,
            currentPrompt: promptText,
            baseImage: {
              title: baseImage.title,
              directionId: baseImage.directionId,
            },
            expansionTasks: expansionTasks.map((task) => ({
              id: task.id,
              directionId: task.directionId,
              title: task.title,
              description: task.description,
              expansionId: task.expansion.id,
              detailText: task.detailText,
            })),
          }),
        })
        const data = await readJsonResponse(response)
        if (response.ok) {
          expansionReasoning = data as { message?: string; taskPrompts?: Array<{ id: string; promptPatch: string }> }
        }
      } catch {
        expansionReasoning = {}
      }
      const promptPatchByTask = new Map(
        (expansionReasoning.taskPrompts || []).map((item) => [item.id, item.promptPatch]),
      )
      const nextResults: GeneratedExpansion[] = []
      for (const [index, task] of expansionTasks.entries()) {
        if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')
        const reasonedPatch = promptPatchByTask.get(task.id)
        const expansionPrompt = [
          promptText.trim(),
          `鍩轰簬褰撳墠閫変腑鐨勭敓鎴愮粨鏋滅户缁欢灞曪細${baseImage.title}銆俙,
          `鐢熸垚鎵╁睍杈撳嚭锛?{task.title}銆?{task.description}`,
          `鎵╁睍瑕佹眰锛歕n${task.detailText}`,
          reasonedPatch ? `鎺ㄧ悊妯″瀷鏁寸悊鍚庣殑鎵╁睍琛ュ厖瑕佹眰锛歕n${reasonedPatch}` : '',
          mockupReferenceNote,
          isLogoSkill
            ? task.expansion.id.startsWith('logo-mockup-') || task.expansion.id === 'custom-followup'
              ? logoMockupPromptNote(task.title, task.detailText, brief, requestedExpansionSize)
              : task.expansion.id === 'logo-usage'
              ? '杩欐槸 Logo 搴旂敤棰勮锛屽彲浠ユ斁鍏ョ湡瀹炲搧鐗屽簲鐢ㄥ満鏅紝浣?Logo 鏈綋浠嶅繀椤讳繚鎸佹墎骞炽€佹竻鏅般€佸彲璇伙紝涓嶈鍙樺舰銆?
              : '杩欐槸 Logo 寤跺睍杈撳嚭锛屽繀椤讳繚鎸佹墎骞崇煝閲忋€佺嚎鏉″共鍑€銆侀€傚悎缂╂斁锛涗娇鐢ㄧ函鐧芥垨閫忔槑鑳屾櫙鏁堟灉锛屼笉瑕佷笁缁存晥鏋溿€佹牱鏈恒€佸鏉傞槾褰便€佸啓瀹炴晥鏋溿€佽摑鑹茬鎶€鑳屾櫙鎴栧彂鍏夊厜鏅曘€?
            : '',
          isProductImageSetSkill
            ? '淇濇寔鐢靛晢濂楀浘涓€鑷存€э細鍟嗗搧涓讳綋鎸夊師鍥惧拰閫変腑鍥剧墖寤跺睍锛岃儗鏅綋绯汇€佸厜褰辩郴缁熴€佹枃瀛楃郴缁熴€佽壊褰╃郴缁熴€佸搧鐗屾皵璐ㄤ笌鏁村鍥句竴鑷达紱涓嶈缂栭€犱笉瀛樺湪鐨勫弬鏁般€侀厤浠舵垨鍔熻兘銆?
            : '淇濇寔鍚屼竴涓搧鐗岃鑹叉垨涓讳綋鐨勪竴鑷存€э紝鍖呮嫭杞粨銆佽壊褰╃郴缁熴€佹潗璐ㄨ瑷€銆侀潰閮ㄧ壒寰佸拰鍟嗕笟瑙嗚椋庢牸銆?,
        ].join('\n')
        const result = await generateImageForDirection(
          task.directionId,
          task.title,
          expansionPrompt,
          baseImage.imageUrl,
          controller.signal,
          requestedExpansionSize,
          isLogoSkill ? mockupReferenceImages : [],
        )
        const nextItem = {
          id: crypto.randomUUID(),
          directionId: task.directionId,
          title: task.title,
          description: task.description,
          imageUrl: result.imageUrl,
          size: requestedExpansionSize,
          baseTitle: baseImage.title,
        }
        nextResults.push(nextItem)
        setExpansionResults((current) => [...current, nextItem])
        setPendingPreviewCards((current) => current.filter((card) => card.id !== pendingCards[index].id))
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: expansionReasoning.message || `宸插熀浜庛€?{baseImage.title}銆嶇敓鎴?${nextResults.length} 寮犳墿灞曞浘銆俙,
        },
      ])
    } catch (expandError) {
      if (isAbortError(expandError)) {
        setError('')
        return
      }
      setError(expandError instanceof Error ? expandError.message : '鎵╁睍鐢熸垚澶辫触銆?)
    } finally {
      setGenerating(false)
      setPendingPreviewCards((current) => current.filter((card) => !pendingCards.some((pending) => pending.id === card.id)))
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  return (
    <main className="app-frame">
      <section className="workspace" aria-label="Skill Runner">
        <header className="topbar">
          <div>
            <p className="brand">SkillCrew</p>
            <span>local workflow studio</span>
          </div>
          <nav aria-label="Workflow navigation">
            <button type="button" onClick={() => setSkillsOpen(true)}>鎶€鑳?/button>
            <button type="button" onClick={openProjectsPanel}>鐢熸垚璁板綍</button>
            <button type="button" onClick={() => setSettingsOpen(true)}>
              璁剧疆
            </button>
          </nav>
          <div className="plus-menu-wrap" ref={plusMenuRef}>
            <input
              ref={skillDirectoryInputRef}
              className="file-input"
              type="file"
              // @ts-expect-error webkitdirectory is supported by Chromium for folder selection.
              webkitdirectory=""
              multiple
              onChange={(event) => importSkillFromDirectory(event.currentTarget.files)}
            />
            <button
              className="close-button"
              type="button"
              aria-label="Open skill actions"
              aria-expanded={plusMenuOpen}
              onClick={() => setPlusMenuOpen((current) => !current)}
            >
              +
            </button>
            {plusMenuOpen && (
              <div className="plus-menu" role="menu" aria-label="Skill actions">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => skillDirectoryInputRef.current?.click()}
                  disabled={importingSkill}
                >
                  <strong>璇诲彇</strong>
                  <span>{importingSkill ? '璇诲彇涓? : '閫夋嫨鏈湴璺緞鍔犺浇 Skill'}</span>
                </button>
                <button type="button" role="menuitem" onClick={openCreateSkillPanel}>
                  <strong>鍒涘缓</strong>
                  <span>鍒涘缓灞炰簬鑷繁鐨?Skill</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="panels">
          <section className="left-panel">
            <div className="lime-band">
              <div className="skill-select-row">
                <label htmlFor="skill-select">SkillCrew</label>
                <div className="skill-dropdown" ref={skillMenuRef}>
                  <button
                    type="button"
                    className="skill-trigger"
                    aria-expanded={skillMenuOpen}
                    aria-haspopup="listbox"
                    onClick={() => setSkillMenuOpen((current) => !current)}
                  >
                    <span className="skill-trigger-copy">
                      <strong>{skill?.displayName}</strong>
                      <small>{skill?.name}</small>
                    </span>
                    <span className="skill-trigger-icon" aria-hidden="true">
                      鈻?                    </span>
                  </button>
                  {skillMenuOpen && (
                    <div className="skill-menu" role="listbox" aria-label="鎶€鑳介€夋嫨">
                      {skills.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          role="option"
                          aria-selected={item.id === selectedSkill}
                          className={item.id === selectedSkill ? 'selected' : ''}
                          onClick={() => {
                            setSelectedSkill(item.id)
                            setSkillMenuOpen(false)
                          }}
                        >
                          <span>
                            <strong>{item.displayName}</strong>
                            <small>{item.description}</small>
                          </span>
                          <em>{item.referencesCount}</em>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="skill-card">
                <span className="avatar">{skill?.displayName.slice(0, 2) || 'SK'}</span>
                <div>
                  <p>{skill?.displayName}</p>
                  <small>{skill?.name}</small>
                </div>
              </div>
              <h1>
                Every run
                <span> starts with a skill.</span>
              </h1>
            </div>

            <div className="left-content">
              <p className="description">{skill?.guidance?.summary || skill?.description}</p>
              <div className="summary-grid">
                <article>
                  <span>鍙傝€冭祫鏂?/span>
                  <strong>{skill?.referencesCount ?? 0}</strong>
                </article>
                <article>
                  <span>妯″紡</span>
                  <strong>鍒嗘纭</strong>
                </article>
              </div>
              <div className="step-list">
                {workflowStepLabels.map((label, index) => (
                  <button
                    type="button"
                    className={`step ${index < activeStep ? 'confirmed' : ''} ${
                      index === visibleStep ? 'active' : ''
                    }`}
                    key={label}
                    disabled={index > activeStep || loading}
                    onClick={() => setViewStep(index)}
                  >
                    <span>{index + 1}</span>
                    <p>{label}</p>
                  </button>
                ))}
              </div>
              {(promptConfirmed || imageResult) && (
                <PreviewGallery
                  items={previewItems}
                  previewAspectRatio={previewAspectRatio}
                  onOpenLightbox={openLightbox}
                  onDownload={(imageUrl, title) => downloadImage(imageUrl, title)}
                  onDownloadMany={downloadImages}
                  onError={setError}
                />
              )}
            </div>
          </section>

          <section className="right-panel">
            <div className="right-heading">
              <p>AI workflow</p>
              <h2>
                Tell the skill
                <span> what to make.</span>
              </h2>
            </div>

            <div className="right-scroll" ref={rightScrollRef}>
              <section className="chat-thread" aria-label="Skill conversation">
                {messages.map((message) => (
                  <div className={`message ${message.role}-message`} key={message.id}>
                    <span>{message.role === 'assistant' ? 'SkillCrew' : '浣?}</span>
                    <p>{toUserFacingChineseError(message.content)}</p>
                  </div>
                ))}

                {loading && (
                  <div className="message assistant-message thinking-message" key="thinking">
                    <span>SkillCrew</span>
                    <div className="thinking-row">
                      <i className="thinking-spinner" aria-hidden="true" />
                      <p>SkillCrew 姝ｅ湪璁＄畻涓?/p>
                      <button type="button" onClick={stopWorkflowGeneration}>
                        鏆傚仠鐢熸垚
                      </button>
                    </div>
                  </div>
                )}

                {skill?.guidance?.checklist && visibleStep === stepIndex.brief && !isInitialThinking && (
                  <div className="requirement-hints" aria-label="Skill requirement hints">
                    {skill.guidance.checklist.map((item) => (
                      <button
                        type="button"
                        className={hasRequirementField(item) ? 'active' : ''}
                        key={item}
                        onClick={() => toggleRequirementField(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                {visibleStep === stepIndex.brief && !isInitialThinking && (
                  <div
                    className={`message user-composer ${isDraggingReference ? 'drag-over' : ''}`}
                    onDragEnter={handleReferenceDragOver}
                    onDragOver={handleReferenceDragOver}
                    onDragLeave={handleReferenceDragLeave}
                    onDrop={handleReferenceDrop}
                  >
                    <label htmlFor="brief-input">杈撳叆浣犵殑闇€姹?/label>
                    <input
                      ref={fileInputRef}
                      className="file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        selectReferenceImages(event.target.files)
                        event.currentTarget.value = ''
                      }}
                    />
                    <textarea
                      id="brief-input"
                      ref={briefInputRef}
                      value={brief}
                      onChange={(event) => setBrief(event.target.value)}
                      placeholder={skill?.guidance?.placeholder || '渚嬪锛氳鏄庝綘鐨勫叿浣撻渶姹傘€佺敤閫斻€佺礌鏉愬拰椋庢牸瑕佹眰銆?}
                    />
                    {referenceImages.length > 0 && (
                      <div className="upload-list" aria-label="宸查€夋嫨鐨勫弬鑰冨浘">
                        {referenceImages.map((file, index) => (
                          <button type="button" key={`${file.name}-${index}`} onClick={() => removeReferenceImage(index)}>
                            <span>{file.name}</span>
                            <em>脳</em>
                          </button>
                        ))}
                      </div>
                    )}
                    {uploadedFiles.length > 0 && (
                      <div className="uploaded-note">宸蹭繚瀛?{uploadedFiles.length} 寮犲弬鑰冨浘锛岀敓鍥炬椂浼氫綔涓轰骇鍝佷富浣?瑙嗚鍙傝€冧竴璧蜂紶鍏ャ€?/div>
                    )}
                    {isMultiAngleSkill && (
                      <div className="multi-angle-inline-config">
                        <div className="multi-angle-upload-slots">
                          {multiAngleSlots.map((slot) => {
                            const slotFiles = multiAngleFiles[slot.id] || []
                            return (
                              <section className={`multi-angle-slot ${slotFiles.length ? 'has-file' : ''}`} key={slot.id}>
                                <label>
                                  <strong>{slot.label}</strong>
                                  <span>{slot.hint}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) => {
                                      selectMultiAngleImages(slot.id, event.currentTarget.files)
                                      event.currentTarget.value = ''
                                    }}
                                  />
                                </label>
                                {slotFiles.length > 0 && (
                                  <div className="slot-file-list">
                                    {slotFiles.map((file, index) => (
                                      <button
                                        type="button"
                                        key={`${slot.id}-${file.name}-${file.lastModified}-${index}`}
                                        onClick={() => removeMultiAngleImage(slot.id, index)}
                                      >
                                        <span>{file.name}</span>
                                        <em>x</em>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </section>
                            )
                          })}
                        </div>
                        <div className="multi-angle-options">
                          <section>
                            <strong>导出视图数量</strong>
                            <div className="segmented-options">
                              {multiAngleViewCounts.map((count) => (
                                <button
                                  type="button"
                                  className={multiAngleViewCount === count ? 'selected' : ''}
                                  key={count}
                                  onClick={() => setMultiAngleViewCount(count)}
                                >
                                  {count} 视图
                                </button>
                              ))}
                            </div>
                          </section>
                          <section>
                            <strong>输出方式</strong>
                            <div className="segmented-options output-options">
                              <button
                                type="button"
                                className={multiAngleOutputMode === 'combined' ? 'selected' : ''}
                                onClick={() => setMultiAngleOutputMode('combined')}
                              >
                                <strong>生成在同一张里</strong>
                                <span>适合主图、多角度合集</span>
                              </button>
                              <button
                                type="button"
                                className={multiAngleOutputMode === 'separate' ? 'selected' : ''}
                                onClick={() => setMultiAngleOutputMode('separate')}
                              >
                                <strong>分开生成</strong>
                                <span>适合单独导出每个角度</span>
                              </button>
                            </div>
                          </section>
                        </div>
                      </div>
                    )}
                    <div className="composer-actions">
                      <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                        <UploadChoiceIcon />
                        涓婁紶鍙傝€冨浘
                      </button>
                      <button type="button" className="primary" onClick={submitBrief} disabled={loading}>
                        {loading ? '鍒嗘瀽涓? : '鍙戦€佺粰鎶€鑳?}
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {error && <p className="error-text">{error}</p>}

              {analysis && visibleStep === stepIndex.references && (
                <section className="confirm-card">
                  <div>
                    <span className="status-dot" />
                    <p>{analysis.confirmation?.title || '纭杩欎簺鍙傝€冭祫鏂欏悗缁х画'}</p>
                  </div>
                  {analysis.confirmation?.description && (
                    <p className="confirm-description">閰嶇疆鏅鸿兘鎺ㄧ悊鍚庯紝杩欎竴姝ヤ細鑷姩鍒嗘瀽鍙傝€冭祫鏂欏苟缁欏嚭閫夋嫨鐞嗙敱锛涘綋鍓嶅凡鍏堢敤鏈湴瑙勫垯缁х画銆?/p>
                  )}
                  {analysis.providerError && (
                    <p className="provider-note">鏅鸿兘鎺ㄧ悊鏆傛椂涓嶅彲鐢紝宸叉敼鐢ㄦ湰鍦拌鍒欑户缁細{toUserFacingChineseError(analysis.providerError)}</p>
                  )}
                  {analysis.inferredChoices && analysis.inferredChoices.length > 0 && (
                    <div className="inferred-choice-list" aria-label="鏅鸿兘琛ュ叏纭">
                      {analysis.inferredChoices.map((choice) => {
                        const selectedId = selectedInferredChoices[choice.id] || choice.options[0]?.id || ''
                        return (
                          <section className="inferred-choice" key={choice.id}>
                            <div>
                              <strong>{choice.title}</strong>
                              {choice.description && <span>{choice.description}</span>}
                            </div>
                            <div className="choice-row">
                              {choice.options.map((option) => (
                                <button
                                  type="button"
                                  className={selectedId === option.id ? 'selected' : ''}
                                  key={option.id}
                                  onClick={() => updateInferredChoice(choice.id, option.id)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            {selectedId === 'custom' && (
                              <input
                                type="text"
                                value={customInferredChoices[choice.id] || ''}
                                onChange={(event) => updateCustomInferredChoice(choice.id, event.target.value)}
                                placeholder={`濉啓${choice.field}`}
                              />
                            )}
                            {choice.options.find((option) => option.id === selectedId)?.description && selectedId !== 'custom' && (
                              <small>{choice.options.find((option) => option.id === selectedId)?.description}</small>
                            )}
                          </section>
                        )
                      })}
                    </div>
                  )}
                  {analysis.confirmation?.options && analysis.confirmation.options.length > 0 && (
                    <div className="direction-list theme-list" aria-label="涓婚鏂瑰悜">
                      {analysis.confirmation.options.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={selectedThemeDirection === option ? 'selected' : ''}
                          onClick={() => setSelectedThemeDirection(option)}
                        >
                          <strong>{option}</strong>
                          <span>{option === '绋冲Ε涓绘柟鍚?
                            ? '浼樺厛杈撳嚭褰撳墠鎶€鑳芥渶绋崇殑涓婚鏂瑰悜銆?
                            : option === '寮哄寲璁板繂鐐规柟鍚?
                              ? '浼樺厛绐佸嚭鍝佺墝璇嗗埆鍏冪礌鍜屼紶鎾蹇嗙偣銆?
                              : '浼樺厛鑰冭檻鍙洿鎺ョ敤浜庤惤鍦版墽琛岀殑瑙嗚鏂瑰悜銆?}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="reference-section-title">
                    <strong>鍙傝€冭祫鏂欓€夋嫨</strong>
                    <span>鍕鹃€夎甯﹀叆鍚庣画鏂瑰悜鐢熸垚鐨勮祫鏂欙紱涓嶅嬀閫変篃鍙互缁х画銆?/span>
                  </div>
                  <div className="reference-list">
                    {analysis.selectedReferences.map((item) => (
                      <label key={item.file}>
                        <input
                          type="checkbox"
                          checked={checkedReferences.includes(item.file)}
                          onChange={() => toggleReference(item.file)}
                        />
                        <span>
                          <strong>{item.title}</strong>
                          <small>
                            {item.reason} 路 {item.score}%
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="actions">
                    <button type="button" className="secondary" onClick={submitBrief} disabled={loading}>
                      閲嶆柊閫夋嫨
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => {
                        if (hasOptionStep) {
                          setViewStep(stepIndex.options)
                          return
                        }
                        confirmReferences()
                      }}
                    >
                      {loading ? '鐢熸垚鏂瑰悜涓? : hasOptionStep ? '杩涘叆閫夐」閰嶇疆' : '纭骞剁户缁?}
                    </button>
                  </div>
                </section>
              )}

              {analysis && hasOptionStep && visibleStep === stepIndex.options && (
                <section className="confirm-card option-card">
                  <div>
                    <span className="status-dot" />
                    <p>閫夋嫨杩欐瑕佽蛋鐨勮緭鍑烘柟鍚?/p>
                  </div>
                  <p className="confirm-description">
                    杩欓噷鐨勯€夋嫨浼氬奖鍝嶅悗缁柟鍚戝拰鎻愮ず璇嶃€傚彲浠ュ彧閫変竴涓紝涔熷彲浠ュ閫夊悗鎵归噺鐢熸垚銆?                  </p>
                  {isLogoSkill && (
                    <div className="logo-option-groups">
                      {logoReuseState?.selectedDeliveryIds.length ? (
                        <button type="button" className="secondary reuse-choice-button" onClick={() => applyLogoReuseState('options')}>
                          娌跨敤涓婃椋庢牸鍜岄噸鐐?                        </button>
                      ) : null}
                      <section className="logo-option-group">
                        <h3>Logo 椋庢牸</h3>
                        <p>鍏堥€夎瑙夋皵璐紝鍙互澶氶€夛紝绯荤粺浼氭寜鍝佺墝琛屼笟绛涙帀涓嶅悎閫傜殑椋庢牸銆?/p>
                        <div className="delivery-list">
                          {logoStyleOptions.map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              className={selectedDeliveryIds.includes(item.id) ? 'selected' : ''}
                              onClick={() => toggleDeliverySelection(item.id)}
                            >
                              <strong>{item.title}</strong>
                              <span>{item.description}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                      <section className="logo-option-group emphasis">
                        <h3>淇℃伅閲嶇偣</h3>
                        <p>鍐嶉€?Logo 瑕佷紭鍏堜紶杈句粈涔堬紝鍚庣画鏂瑰悜浼氭妸杩欎簺閲嶇偣鍐欒繘鏂规鍜屾彁绀鸿瘝銆?/p>
                        <div className="delivery-list">
                          {logoEmphasisOptions.map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              className={selectedDeliveryIds.includes(item.id) ? 'selected' : ''}
                              onClick={() => toggleDeliverySelection(item.id)}
                            >
                              <strong>{item.title}</strong>
                              <span>{item.description}</span>
                            </button>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                  {!isLogoSkill && (
                  <div className="delivery-list">
                    {activeDeliveryOptions.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={selectedDeliveryIds.includes(item.id) ? 'selected' : ''}
                        onClick={() => toggleDeliverySelection(item.id)}
                      >
                        <strong>{isLogoSkill && item.id.startsWith('logo-emphasis-') ? `閲嶇偣锛?{item.title}` : isLogoSkill && item.id.startsWith('logo-style-') ? `椋庢牸锛?{item.title}` : item.title}</strong>
                        <span>{item.description}</span>
                      </button>
                    ))}
                  </div>
                  )}
                  <div className="actions">
                    <button type="button" className="secondary" onClick={() => setViewStep(stepIndex.references)}>
                      杩斿洖鍙傝€冭祫鏂?                    </button>
                    <button type="button" className="primary" onClick={confirmReferences} disabled={loading || selectedDeliveryIds.length === 0}>
                      {loading ? '鐢熸垚鏂瑰悜涓? : '鎸夎繖浜涢€夐」缁х画'}
                    </button>
                  </div>
                </section>
              )}

              {directionResult && visibleStep === stepIndex.direction && (
                <section className="confirm-card">
                  <div>
                    <span className="status-dot" />
                    <p>
                      {isDetailPageSkill
                        ? '纭璇︽儏椤?Section 鍜屾€绘彁绀鸿瘝'
                        : isProductImageSetSkill
                          ? '纭鏁村鍟嗗搧鍥惧拰鎬绘彁绀鸿瘝'
                          : '閫夋嫨鏂瑰悜骞剁‘璁ゆ彁绀鸿瘝'}
                    </p>
                  </div>
                  {directionResult.providerError && (
                    <p className="provider-note">鏅鸿兘鎺ㄧ悊鏆傛椂涓嶅彲鐢紝宸叉敼鐢ㄦ湰鍦拌鍒欑户缁細{toUserFacingChineseError(directionResult.providerError)}</p>
                  )}
                  <div className="direction-list">
                    {directionResult.directions.map((direction) => (
                      <button
                        type="button"
                        className={selectedDirection === direction.id ? 'selected' : ''}
                        key={direction.id}
                        onClick={() => setSelectedDirection(direction.id)}
                      >
                        <strong>{direction.title}</strong>
                        <span>{direction.description}</span>
                      </button>
                    ))}
                  </div>
                  <label className="prompt-editor">
                    {isDetailPageSkill
                      ? '璇︽儏椤垫€荤敓鎴愭彁绀鸿瘝'
                      : isProductImageSetSkill
                        ? '濂楀浘鎬荤敓鎴愭彁绀鸿瘝'
                        : isLogoSkill
                          ? 'Logo 鎬荤敓鎴愭彁绀鸿瘝'
                        : '鏈€缁堢敓鍥炬彁绀鸿瘝'}
                    <textarea value={promptText} onChange={(event) => setPromptText(event.target.value)} />
                  </label>
                  <div className="prompt-meta">
                    <span>灏哄锛歿directionResult.imagePrompt.size || '1024x1024'}</span>
                    <span>鍙嶅悜绾︽潫锛歿directionResult.imagePrompt.negative || '宸叉寜 Skill 榛樿绾︽潫澶勭悊'}</span>
                  </div>
                  <div className={isLogoSkill ? 'actions prompt-confirm-actions' : 'actions'}>
                    {isLogoSkill && (
                      <button
                        type="button"
                        className="secondary icon-back-button prompt-back-button"
                        onClick={() => setViewStep(stepIndex.options)}
                        aria-label="杩斿洖閲嶉€夐鏍煎拰閲嶇偣"
                        title="杩斿洖閲嶉€夐鏍?閲嶇偣"
                      >
                        杩斿洖閲嶉€夐鏍?閲嶇偣
                      </button>
                    )}
                    <button type="button" className="secondary" onClick={() => setPromptConfirmed(false)}>
                      璋冩暣鎻愮ず璇?                    </button>
                    <button type="button" className="primary" onClick={confirmPrompt}>
                      纭鎻愮ず璇?                    </button>
                  </div>
                </section>
              )}

              {promptConfirmed && visibleStep === stepIndex.generate && (
                <section className="confirm-card image-card">
                  <div>
                    <span className="status-dot" />
                    <p>{isDetailPageSkill ? '鐢熸垚璇︽儏椤垫ā鍧? : isProductImageSetSkill ? '鐢熸垚鏁村鍟嗗搧鍥? : isLogoSkill ? '鐢熸垚 Logo 鏂瑰悜' : '鐢熸垚鍥剧墖'}</p>
                  </div>
                  {isLogoSkill && (
                    <div className="generation-variant-panel">
                      <button
                        type="button"
                        className="secondary icon-back-button variant-back-button"
                        onClick={() => setViewStep(stepIndex.options)}
                        aria-label="杩斿洖閲嶉€夐鏍煎拰閲嶇偣"
                        title="杩斿洖閲嶉€夐鏍?閲嶇偣"
                      >
                        杩斿洖閲嶉€夐鏍?閲嶇偣
                      </button>
                      <div>
                        <span>閫夋嫨鐢熸垚寮犳暟</span>
                        <div className="generation-scope" aria-label="Logo variant count">
                          {[1, 2, 3, 4].map((count) => (
                            <button
                              type="button"
                              key={count}
                              className={logoVariantCount === count ? 'selected' : ''}
                              onClick={() => setLogoVariantCount(count)}
                            >
                              {count} 寮?                            </button>
                          ))}
                        </div>
                        <p>鍚屼竴涓?Logo 鏂瑰悜浼氱敓鎴愬涓樊寮傚寲鏂规锛岃 AI 鍦ㄦ瀯鍥俱€佺鍙烽殣鍠汇€佹璐熷舰鍜屽瓧鏍囧叧绯讳笂鍙戞暎銆?/p>
                      </div>
                    </div>
                  )}
                  {!isLogoSkill && (
                  <div className="generation-scope" aria-label="Generation scope">
                    <button
                      type="button"
                      className={generationScope === 'single' ? 'selected' : ''}
                      onClick={() => setGenerationScope('single')}
                    >
                      鍗曞紶
                    </button>
                    <button
                      type="button"
                      className={generationScope === 'multiple' ? 'selected' : ''}
                      onClick={() => setGenerationScope('multiple')}
                      disabled={!canGenerateAllDirections}
                    >
                      澶氬紶
                    </button>
                    <button
                      type="button"
                      className={generationScope === 'all' ? 'selected' : ''}
                      onClick={() => setGenerationScope('all')}
                      disabled={!canGenerateAllDirections}
                    >
                      鍏ㄩ儴
                    </button>
                  </div>
                  )}
                  {generationScope === 'single' && directionResult && (
                    <div className="generation-pick-list" aria-label="閫夋嫨鍗曞紶鐢熸垚椤甸潰">
                      {directionResult.directions.map((direction, index) => (
                        <button
                          type="button"
                          key={direction.id}
                          className={[
                            selectedDirection === direction.id ? 'selected' : '',
                            generatedDirectionIds.has(direction.id) ? 'generated' : '',
                            generationQueue.includes(direction.id) ? 'generating' : '',
                            failedDirectionIds.has(direction.id) ? 'failed' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => setSelectedDirection(direction.id)}
                        >
                          <strong>{isLogoSkill ? `绗?${index + 1} 涓柟鍚慲 : `绗?${index + 1} 灞廯}</strong>
                          <span>{cleanGenerationTitle(direction.title)}</span>
                          <em className="generation-status">
                            {generationQueue.includes(direction.id)
                              ? '鐢熸垚涓?
                              : generatedDirectionIds.has(direction.id)
                                ? '宸茬敓鎴?
                                : failedDirectionIds.has(direction.id)
                                  ? '澶辫触'
                                  : '鏈敓鎴?}
                          </em>
                        </button>
                      ))}
                    </div>
                  )}
                  {generationScope === 'multiple' && directionResult && (
                    <div className="generation-pick-list multi" aria-label="閫夋嫨澶氬紶鐢熸垚椤甸潰">
                      {directionResult.directions.map((direction, index) => (
                        <button
                          type="button"
                          key={direction.id}
                          className={[
                            selectedGenerationIds.includes(direction.id) ? 'selected' : '',
                            generatedDirectionIds.has(direction.id) ? 'generated' : '',
                            generationQueue.includes(direction.id) ? 'generating' : '',
                            failedDirectionIds.has(direction.id) ? 'failed' : '',
                          ].filter(Boolean).join(' ')}
                          onClick={() => toggleGenerationTarget(direction.id)}
                        >
                          <strong>{selectedGenerationIds.includes(direction.id) ? '宸查€? : isLogoSkill ? `绗?${index + 1} 涓柟鍚慲 : `绗?${index + 1} 灞廯}</strong>
                          <span>{cleanGenerationTitle(direction.title)}</span>
                          <em className="generation-status">
                            {generationQueue.includes(direction.id)
                              ? '鐢熸垚涓?
                              : generatedDirectionIds.has(direction.id)
                                ? '宸茬敓鎴?
                                : failedDirectionIds.has(direction.id)
                                  ? '澶辫触'
                                  : '鏈敓鎴?}
                          </em>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="actions single-action">
                    <button type="button" className="primary" onClick={generateImage} disabled={generating}>
                      {generating
                        ? `鐢熸垚涓?{generationQueue.length ? `锛?{generationQueue.length}锛塦 : ''}`
                        : isLogoSkill
                          ? `鐢熸垚 ${logoVariantCount} 寮?Logo 鏂规`
                        : isDetailPageSkill
                          ? generationScope === 'all'
                            ? `鐢熸垚鍏ㄩ儴 ${directionResult?.directions.length || 0} 涓鎯呴〉妯″潡`
                            : generationScope === 'multiple'
                              ? `鐢熸垚宸查€?${selectedGenerationIds.length} 涓鎯呴〉妯″潡`
                              : '鐢熸垚鍗曞紶璇︽儏椤垫ā鍧?
                          : isProductImageSetSkill
                            ? generationScope === 'all'
                              ? `鐢熸垚鍏ㄩ儴 ${directionResult?.directions.length || 0} 寮犲晢鍝佸浘`
                              : generationScope === 'multiple'
                                ? `鐢熸垚宸查€?${selectedGenerationIds.length} 寮犲晢鍝佸浘`
                                : '鐢熸垚鍗曞紶鍟嗗搧鍥?
                            : isLogoSkill
                              ? generationScope === 'all'
                                ? `鐢熸垚鍏ㄩ儴 ${directionResult?.directions.length || 0} 涓?Logo 鏂瑰悜`
                                : generationScope === 'multiple'
                                  ? `鐢熸垚宸查€?${selectedGenerationIds.length} 涓?Logo 鏂瑰悜`
                                  : '鐢熸垚褰撳墠 Logo 鏂瑰悜'
                              : generationScope === 'all'
                                ? `鐢熸垚鍏ㄩ儴 ${directionResult?.directions.length || 0} 寮犲浘鐗嘸
                                : generationScope === 'multiple'
                                  ? `鐢熸垚宸查€?${selectedGenerationIds.length} 寮犲浘鐗嘸
                                  : `璋冪敤 ${settings?.openai.imageModel || 'gpt-image-2'} 鐢熷浘`}
                    </button>
                    {generating && (
                      <button type="button" className="secondary" onClick={stopWorkflowGeneration}>
                        鏆傚仠鐢熸垚
                      </button>
                    )}
                  </div>
                  {imageResults.length > 0 && (
                    <p className="image-note">
                      {isDetailPageSkill
                        ? '璇︽儏椤垫ā鍧楀凡淇濈暀鍦ㄥ乏渚х敾寤娿€傚綋鍓嶉樁娈靛厛閫愬紶鐢熸垚璇︽儏椤垫ā鍧楋紝涓嬩竴姝ュ啀鍋氭暣椤垫嫾鎺ヤ氦浠樸€?
                        : isProductImageSetSkill
                          ? '鏁村鍟嗗搧鍥惧凡淇濈暀鍦ㄥ乏渚х敾寤娿€傛瘡寮犻兘鏄嫭绔嬮〉闈紝鍙户缁ˉ鍗栫偣鍥俱€佺粺涓€椋庢牸銆佹敼姣斾緥鎴栧崟寮犱紭鍖栥€?
                        : isLogoSkill
                          ? 'Logo 鏂规宸蹭繚鐣欏湪宸︿晶鐢诲粖銆備笅涓€姝ュ彲浠ラ€夋嫨鍏朵腑涓€寮犵户缁敓鎴愯涓氭牱鏈恒€?
                          : '宸茬敓鎴愮殑浣滃搧浼氫繚鐣欏湪宸︿晶鐢诲粖锛屽彲鐐瑰嚮鏀惧ぇ鎴栦笅杞姐€?}
                    </p>
                  )}
                </section>
              )}

              {adjustableImages.length > 0 && visibleStep === stepIndex.expansion && (
                <section className="confirm-card expansion-card">
                  <div>
                    <span className="status-dot" />
                    <p>{isLogoSkill ? '缁х画鐢熸垚鏍锋満' : '缁х画鎵╁睍'}</p>
                  </div>
                  {isLogoSkill && logoReuseState && (
                    <button type="button" className="secondary reuse-choice-button" onClick={() => applyLogoReuseState('mockup')}>
                      娌跨敤涓婃鏍锋満閫夋嫨
                    </button>
                  )}
                  <p className="confirm-description">
                    {isLogoSkill
                      ? '鍏堥€夋嫨涓€寮犲凡鐢熸垚鐨?Logo 鏂规锛屽啀閫夋嫨瑕佺敓鎴愮殑琛屼笟鏍锋満銆傛牱鏈洪鏍煎彲鍚庣画浠庤姳鐡ｇ伒鎰熷簱浜哄伐鏀跺綍鎵╁睍銆?
                      : '鍏堥€夋嫨涓€寮犲凡鐢熸垚鍥剧墖锛屽啀閫夋嫨瑕佺户缁墿灞曠殑鍐呭銆?}
                  </p>
                  <div className="base-image-strip" aria-label={isLogoSkill ? '閫夋嫨 Logo 鏂规' : '閫夋嫨鍩哄噯鍥剧墖'}>
                    {adjustableImages.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={selectedBaseImageId === item.id ? 'selected' : ''}
                        onClick={() => setSelectedBaseImageId(item.id)}
                      >
                        <img src={item.imageUrl} alt={item.title} />
                        <em>{item.badge}</em>
                        <span>{item.title}</span>
                      </button>
                    ))}
                  </div>
                  {failedDirections.length > 0 && (
                    <p className="image-note">
                      杩樻湁 {failedDirections.length} 寮犵敓鎴愬け璐ャ€傚簳閮ㄨ緭鍏ヨˉ鍏呰姹傚悗锛屼細鍏堣皟鐢ㄦ帹鐞嗘ā鍨嬮噸鍐欐彁绀鸿瘝锛屽苟鍙噸璇曞け璐ュ浘鐗囥€?                    </p>
                  )}
                  <div className="delivery-grid">
                    <p className="delivery-title">{isLogoSkill ? '閫夋嫨鏍锋満鍝佺被' : '缁х画鎵╁睍鍥?}</p>
                    <div className="delivery-list">
                      {getExpansionOptions().map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          className={expansionSelections.includes(item.id) ? 'selected' : ''}
                          onClick={() => toggleExpansion(item.id)}
                        >
                          <strong>{item.title}</strong>
                          <span>{item.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {isLogoSkill && (
                    <div className="logo-mockup-size-panel">
                      <p className="delivery-title">閫夋嫨鏍锋満灏哄</p>
                      <div className="mockup-size-options">
                        {[
                          { label: '1:1 鏂瑰浘', value: '1024x1024' },
                          { label: '4:3 妯浘', value: '1536x1152' },
                          { label: '3:4 绔栧浘', value: '1024x1365' },
                          { label: '16:9 鍦烘櫙妯浘', value: '1536x864' },
                        ].map((item) => (
                          <button
                            type="button"
                            key={item.value}
                            className={logoMockupSize === item.value ? 'selected' : ''}
                            onClick={() => {
                              setLogoMockupSize(item.value)
                              rememberLogoSelections({ logoMockupSize: item.value })
                            }}
                          >
                            <strong>{item.label}</strong>
                            <span>{item.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {getSelectedExpansions().length > 0 && (
                    <div className="expansion-detail-list">
                      {getSelectedExpansions().map((item) => (
                        <section className="expansion-detail" key={item.id}>
                          <p>{item.title} 鍙€夎ˉ鍏?/p>
                          {getExpansionFields(item.id).map((field) => (
                            <label key={field.id}>
                              <span>{field.label}</span>
                              {field.options ? (
                                <div className="choice-row">
                                  {field.options.map((option) => (
                                    <button
                                      type="button"
                                      key={option}
                                      className={expansionDetails[item.id]?.[field.id] === option ? 'selected' : ''}
                                      onClick={() => updateExpansionDetail(item.id, field.id, option)}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <textarea
                                  value={expansionDetails[item.id]?.[field.id] || ''}
                                  onChange={(event) => updateExpansionDetail(item.id, field.id, event.target.value)}
                                  placeholder={field.placeholder}
                                />
                              )}
                            </label>
                          ))}
                        </section>
                      ))}
                      {isLogoSkill && (
                        <section className="expansion-detail mockup-reference-uploader">
                          <p>鏍锋満鍙傝€冨浘</p>
                          <div
                            className={`mockup-upload-dropzone ${isDraggingMockupReference ? 'drag-over' : ''}`}
                            onDragEnter={handleMockupReferenceDragOver}
                            onDragOver={handleMockupReferenceDragOver}
                            onDragLeave={handleMockupReferenceDragLeave}
                            onDrop={handleMockupReferenceDrop}
                          >
                            <input
                              id="mockup-reference-input"
                              className="file-input"
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) => {
                                selectMockupReferenceImages(event.target.files)
                                event.currentTarget.value = ''
                              }}
                            />
                            <button type="button" className="secondary" onClick={() => document.getElementById('mockup-reference-input')?.click()}>
                              涓婁紶鍙傝€冨浘
                            </button>
                            <span>鐐瑰嚮涓婁紶锛屾垨鎶婃牱鏈?鍦烘櫙鍙傝€冨浘鎷栧埌杩欓噷銆傛渶澶?6 寮狅紝鍙弬鑰冨満鏅€佹潗璐ㄥ拰鏋勫浘銆?/span>
                          </div>
                          {mockupReferenceImages.length > 0 && (
                            <div className="upload-list mockup-upload-list" aria-label="宸查€夋嫨鐨勬牱鏈哄弬鑰冨浘">
                              {mockupReferenceImages.map((file, index) => (
                                <button type="button" key={`${file.name}-${index}`} onClick={() => removeMockupReferenceImage(index)}>
                                  <span>{file.name}</span>
                                  <em>脳</em>
                                </button>
                              ))}
                            </div>
                          )}
                        </section>
                      )}
                    </div>
                  )}
                  <div className={isLogoSkill ? 'actions logo-expansion-actions' : 'actions'}>
                    <button
                      type="button"
                      className={isLogoSkill ? 'secondary icon-back-button' : 'secondary'}
                      onClick={() => setViewStep(stepIndex.generate)}
                      disabled={generating}
                      aria-label={isLogoSkill ? '杩斿洖鐢熸垚 Logo' : undefined}
                      title={isLogoSkill ? '杩斿洖鐢熸垚 Logo' : undefined}
                    >
                      {isLogoSkill ? '' : '鐢熸垚鍏朵粬鐢婚潰'}
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={generateExpansions}
                      disabled={generating}
                    >
                      {generating ? (isLogoSkill ? '鏍锋満鐢熸垚涓? : '鎵╁睍鐢熸垚涓?) : (isLogoSkill ? '鐢熸垚鏍锋満鍥? : '鐢熸垚鎵╁睍鍥?)}
                    </button>
                    {generating && (
                      <button type="button" className="secondary" onClick={stopWorkflowGeneration}>
                        鏆傚仠鐢熸垚
                      </button>
                    )}
                  </div>
                  {expansionResults.length > 0 && <p className="image-note">{isLogoSkill ? '鏍锋満鍥惧凡杩藉姞鍒板乏渚х敾寤婏紝涓嶄細瑕嗙洊涔嬪墠鐨?Logo 鏂规銆? : '鎵╁睍鍥惧凡杩藉姞鍒板乏渚х敾寤婏紝涓嶄細瑕嗙洊涔嬪墠鐨勬柟鍚戝浘銆?}</p>}
                </section>
              )}
              {operationStatus && <p className="operation-status">{operationStatus}</p>}
            </div>
            <form
              className="followup-composer"
              onSubmit={(event) => {
                event.preventDefault()
                submitFollowUp()
              }}
            >
              <textarea
                value={followUpText}
                onChange={(event) => setFollowUpText(event.target.value)}
                placeholder={
                  failedDirections.length > 0
                    ? '琛ュ厖澶辫触鍥剧墖鐨勯噸璇曡姹傦紝渚嬪锛氭鼎鑲ゅ崠鐐圭敤浜虹墿鐨偆鐘舵€佽〃杈撅紝涓嶈浜у搧鎽嗘媿'
                    : adjustableImages.length === 0
                      ? '鍜?SkillCrew 瀵硅瘽鏁寸悊闇€姹傦紝渚嬪锛氭垜鎯充簡瑙ｄ綘鑳戒笉鑳藉仛鍋忔缇庝汉鐗╃殑浣╂埓鏁堟灉'
                    : '缁х画鎻忚堪闇€姹傦紝鎴栧閫変腑鐨勫浘鐗囧竷缃皟鏁翠换鍔?
                }
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    submitFollowUp()
                  }
                }}
              />
              <button type="submit" disabled={!followUpText.trim() || loading || generating}>
                鍙戦€?              </button>
            </form>
          </section>
        </div>
      </section>

      {skillsOpen && (
        <div className="settings-backdrop utility-backdrop" role="presentation">
          <section className="settings-panel utility-panel skills-panel" aria-label="Local skills" ref={skillsPanelRef}>
            <div className="settings-head">
              <div>
                <p>Skills</p>
                <h3>鏈湴鎶€鑳藉垪琛?/h3>
              </div>
              <button
                type="button"
                className="settings-close-button"
                aria-label="鍏抽棴"
                onClick={() => setSkillsOpen(false)}
              />
            </div>
            <div className="skill-directory-list">
              {skills.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.displayName}</strong>
                    <span>{item.name}</span>
                  </div>
                  <p>{item.description}</p>
                  <code>{item.path || item.folder}</code>
                  <footer>
                    <em>{item.referencesCount} 涓弬鑰冭祫鏂?/em>
                    <div className="skill-card-actions">
                      <button
                        type="button"
                        className="skill-delete-button"
                        onClick={() => setSkillDeleteConfirm({ id: item.id, displayName: item.displayName })}
                      >
                        <TrashIcon />
                        鍒犻櫎
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSkill(item.id)
                          setSkillsOpen(false)
                        }}
                      >
                        浣跨敤杩欎釜 Skill
                      </button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
            {skillDeleteConfirm && (
              <div className="skill-confirm-backdrop" role="presentation">
                <section className="skill-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="skill-delete-title">
                  <div>
                    <p>Confirm</p>
                    <h3 id="skill-delete-title">鍒犻櫎 Skill</h3>
                  </div>
                  <p>{`纭畾鍒犻櫎銆?{skillDeleteConfirm.displayName}銆嶅悧锛熷垹闄ゅ悗灏嗕粠鏈湴鎶€鑳藉垪琛ㄧЩ闄ゃ€俙}</p>
                  <div className="skill-confirm-actions">
                    <button
                      type="button"
                      className="skill-confirm-cancel"
                      disabled={deletingSkill}
                      onClick={() => setSkillDeleteConfirm(null)}
                    >
                      鍙栨秷
                    </button>
                    <button
                      type="button"
                      className="skill-confirm-delete"
                      disabled={deletingSkill}
                      onClick={() => deleteSkill(skillDeleteConfirm)}
                    >
                      <TrashIcon />
                      {deletingSkill ? '鍒犻櫎涓? : '纭鍒犻櫎'}
                    </button>
                  </div>
                </section>
              </div>
            )}
            <button
              type="button"
              className="project-back-top skill-back-top"
              aria-label="杩斿洖椤堕儴"
              onClick={() => skillsPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <BackToTopIcon />
            </button>
          </section>
        </div>
      )}

      <ProjectsPanel
        open={projectsOpen}
        loading={projectsLoading}
        projects={projects}
        onClose={() => setProjectsOpen(false)}
        onOpenLightbox={openLightbox}
        onDownload={(imageUrl, title) => downloadImage(imageUrl, title)}
        onDownloadMany={downloadImages}
        onDeleteProjects={deleteProjects}
        onError={setError}
      />

      {createSkillOpen && (
        <div className="settings-backdrop utility-backdrop" role="presentation">
          <section className="settings-panel utility-panel create-skill-panel" aria-label="鍒涘缓鎶€鑳?>
            <div className="settings-head">
              <div>
                <p>鍒涘缓鎶€鑳?/p>
                <h3>鍒涘缓鑷繁鐨勬妧鑳?/h3>
              </div>
              <button
                type="button"
                className="settings-close-button"
                aria-label="鍏抽棴"
                onClick={() => setCreateSkillOpen(false)}
              />
            </div>
            <div className="create-skill-layout">
              <div className="create-skill-form">
                <label>
                  鏄剧ず鍚嶇О
                  <input
                    value={skillCreateForm.displayName}
                    onChange={(event) => updateSkillCreateField('displayName', event.target.value)}
                    placeholder="渚嬪锛氬寘瑁呮枃妗堜笓瀹?
                  />
                </label>
                <label>
                  鎶€鏈悕
                  <input
                    value={skillCreateForm.name}
                    onChange={(event) => updateSkillCreateField('name', event.target.value)}
                    placeholder="鍙暀绌猴紝鑷姩鐢熸垚鑻辨枃杩炲瓧绗﹀悕绉?
                  />
                </label>
                <label>
                  鍒嗙被
                  <input
                    value={skillCreateForm.category}
                    onChange={(event) => updateSkillCreateField('category', event.target.value)}
                  />
                </label>
                <label>
                  鐢ㄩ€斾笌瑙﹀彂
                  <textarea
                    value={skillCreateForm.purpose}
                    onChange={(event) => updateSkillCreateField('purpose', event.target.value)}
                    placeholder="杩欎釜鎶€鑳藉叿浣撳府浣犲仛浠€涔堬紵浠€涔堟椂鍊欏簲璇ヨЕ鍙戯紵"
                  />
                </label>
                <label>
                  瑙﹀彂鍏抽敭璇?杈圭晫
                  <textarea
                    value={skillCreateForm.triggers}
                    onChange={(event) => updateSkillCreateField('triggers', event.target.value)}
                    placeholder="渚嬪锛氱敤鎴锋彁鍒板寘瑁呮枃妗堛€佸崠鐐规彁鐐笺€佸寘瑁呰儗鏍囨椂浣跨敤锛涙櫘閫?Logo 璁捐涓嶄娇鐢ㄣ€?
                  />
                </label>
                <label>
                  棰嗗煙鐭ヨ瘑
                  <textarea
                    value={skillCreateForm.knowledge}
                    onChange={(event) => updateSkillCreateField('knowledge', event.target.value)}
                    placeholder="鍐欏叆瀹冮渶瑕佺煡閬撶殑涓撲笟娴佺▼銆佸垽鏂爣鍑嗐€佽涓氳鍒欍€?
                  />
                </label>
                <label>
                  杈撳嚭鏍煎紡涓庣害鏉?                  <textarea
                    value={skillCreateForm.outputFormat}
                    onChange={(event) => updateSkillCreateField('outputFormat', event.target.value)}
                    placeholder="甯屾湜杈撳嚭 Markdown銆丣SON銆佹竻鍗曘€佹彁绀鸿瘝銆佹柟妗堣〃绛夈€?
                  />
                </label>
                <label>
                  闄愬埗涓庣鍖?                  <textarea
                    value={skillCreateForm.constraints}
                    onChange={(event) => updateSkillCreateField('constraints', event.target.value)}
                    placeholder="渚嬪锛氫笉瑕佽緭鍑烘硾娉涘缓璁紱涓嶈澶勭悊鏃犲叧浠诲姟锛涗俊鎭笉瓒虫椂鍏堢‘璁ゅ叧閿潯浠躲€?
                  />
                </label>
                <label>
                  妯″瀷/鑳藉姏闇€姹?                  <textarea
                    value={skillCreateForm.modelNeeds}
                    onChange={(event) => updateSkillCreateField('modelNeeds', event.target.value)}
                    placeholder="渚嬪锛氶渶瑕佽鍙栧弬鑰冭祫鏂欙紱闇€瑕佸浘鐗囩敓鎴愶紱鍙渶瑕佹枃鏈帹鐞嗐€?
                  />
                </label>
                <label>
                  鍙傝€冭祫鏂欒鍒掓垨鍐呭
                  <textarea
                    value={skillCreateForm.referenceContent || skillCreateForm.referencesPlan}
                    onChange={(event) => {
                      updateSkillCreateField('referencesPlan', event.target.value)
                      updateSkillCreateField('referenceContent', event.target.value)
                    }}
                    placeholder="鍙互绮樿创闀胯鑼冦€佹渚嬨€佹湳璇〃锛涘垱寤烘椂浼氫繚瀛樹负鍙傝€冭祫鏂欍€?
                  />
                </label>
                <button type="button" className="primary" onClick={draftSkillOutline} disabled={draftingSkill}>
                  {draftingSkill ? '鐢熸垚澶х翰涓? : '鐢熸垚璁捐澶х翰'}
                </button>
              </div>
              <div className="create-skill-outline">
                <div>
                  <strong>璁捐澶х翰</strong>
                  <span>纭鍚庢墠浼氬啓鍏ユ湰鍦版妧鑳芥枃浠跺す</span>
                </div>
                {skillCreateProviderError && <p className="provider-note">{skillCreateProviderError}</p>}
                <textarea
                  value={skillCreateOutline}
                  onChange={(event) => setSkillCreateOutline(event.target.value)}
                  placeholder="鍏堝～鍐欏乏渚т俊鎭紝鐒跺悗鐢熸垚璁捐澶х翰銆?
                />
                {skillCreateStatus && <p className="operation-status">{skillCreateStatus}</p>}
                <button type="button" className="primary" onClick={createLocalSkill} disabled={creatingSkill || !skillCreateOutline.trim()}>
                  {creatingSkill ? '鍒涘缓涓? : '纭鍒涘缓鏈湴鎶€鑳?}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="settings-backdrop" role="presentation">
          <section className="settings-panel" aria-label="鎺ュ彛璁剧疆">
            <div className="settings-head">
              <div>
                <p>璁剧疆</p>
                <h3>鎺ュ彛閰嶇疆</h3>
              </div>
              <button
                type="button"
                className="settings-close-button"
                aria-label="鍏抽棴"
                onClick={() => setSettingsOpen(false)}
              />
            </div>

            <div className="settings-status">
              <button
                type="button"
                className={settingsTab === 'reasoning' ? 'active' : ''}
                onClick={() => setSettingsTab('reasoning')}
              >
                <strong>鏅鸿兘鎺ㄧ悊</strong>
                <span>{settings?.reasoning.configured ? settings.reasoning.apiKeyMasked : '鏈厤缃?}</span>
              </button>
              <button
                type="button"
                className={settingsTab === 'openai' ? 'active' : ''}
                onClick={() => setSettingsTab('openai')}
              >
                <strong>GPT 鐢熷浘</strong>
                <span>{settings?.openai.configured ? settings.openai.apiKeyMasked : '鏈厤缃?}</span>
              </button>
            </div>

            {settingsTab === 'reasoning' && (
              <div className="settings-section">
                <div className="settings-copy">
                  <p>鏅鸿兘鎺ㄧ悊閰嶇疆</p>
                  <span>鐢ㄤ簬璇诲彇鎶€鑳借鏄庛€佽瘑鍒弬鑰冭祫鏂欍€佺敓鎴愮‘璁ゅ崱鍜屾彁绀鸿瘝鏂瑰悜銆?/span>
                </div>
                <div className="settings-grid single-provider">
                  <label>
                    鎺ュ彛瀵嗛挜
                    <input
                      type="password"
                      value={settingsForm.reasoningApiKey}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, reasoningApiKey: event.target.value }))
                      }
                      placeholder="鐣欑┖鍒欎繚鐣欏凡淇濆瓨鐨?Key"
                    />
                  </label>
                  <label>
                    Base URL
                    <input
                      value={settingsForm.reasoningBaseURL}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, reasoningBaseURL: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    妯″瀷
                    <input
                      value={settingsForm.reasoningModel}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, reasoningModel: event.target.value }))
                      }
                      placeholder="gpt-5.5..."
                    />
                  </label>
                </div>
              </div>
            )}

            {settingsTab === 'openai' && (
              <div className="settings-section">
                <div className="settings-copy">
                  <p>GPT 鐢熷浘閰嶇疆</p>
                  <span>鐢ㄤ簬鏈€缁堢‘璁ゆ彁绀鸿瘝鍚庤皟鐢ㄥ浘鐗囨ā鍨嬬敓鎴愬苟淇濆瓨缁撴灉銆?/span>
                </div>
                <div className="settings-grid single-provider">
                  <label>
                    鎺ュ彛瀵嗛挜
                    <input
                      type="password"
                      value={settingsForm.openaiApiKey}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, openaiApiKey: event.target.value }))
                      }
                      placeholder="鐣欑┖鍒欎繚鐣欏凡淇濆瓨鐨?Key"
                    />
                  </label>
                  <label>
                    Base URL
                    <input
                      value={settingsForm.openaiBaseURL}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, openaiBaseURL: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    鐢熷浘妯″瀷
                    <input
                      value={settingsForm.openaiImageModel}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, openaiImageModel: event.target.value }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}

            <button type="button" className="primary save-settings" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? '淇濆瓨涓? : '淇濆瓨閰嶇疆'}
            </button>
          </section>
        </div>
      )}

      {lightboxImage && (
        <div className="lightbox-backdrop" role="presentation" onClick={closeLightbox}>
          <section className="lightbox-panel" aria-label="Image preview" onClick={(event) => event.stopPropagation()}>
            <div className="lightbox-head">
              <p>
                {lightboxImage.title}
                {lightboxItems.length > 1 && (
                  <span>{` ${Math.max(1, lightboxItems.findIndex((item) => item.imageUrl === lightboxImage.imageUrl) + 1)} / ${lightboxItems.length}`}</span>
                )}
              </p>
              <div>
                <span className="lightbox-zoom-label">{Math.round(lightboxZoom * 100)}%</span>
                <button type="button" onClick={resetLightboxView}>
                  <ResetIcon />
                  閲嶇疆
                </button>
                <button type="button" onClick={() => downloadImage(lightboxImage.imageUrl, lightboxImage.title).catch((e) => setError(e instanceof Error ? e.message : '涓嬭浇澶辫触銆?))}>
                  <DownloadIcon />
                  涓嬭浇
                </button>
                <button type="button" className="lightbox-close-button" aria-label="鍏抽棴" onClick={closeLightbox}>
                  <CloseIcon />
                </button>
              </div>
            </div>
            <div
              className={`lightbox-image-stage ${lightboxZoom > 1 ? 'zoomed' : ''} ${lightboxDrag ? 'dragging' : ''}`}
              onWheel={handleLightboxWheel}
              onMouseDown={handleLightboxPointerDown}
              onMouseMove={handleLightboxPointerMove}
              onMouseUp={stopLightboxDrag}
              onMouseLeave={stopLightboxDrag}
              onDoubleClick={resetLightboxView}
            >
              {lightboxItems.length > 1 && (
                <>
                  <button
                    type="button"
                    className="lightbox-nav-button previous"
                    aria-label="Previous image"
                    onClick={(event) => {
                      event.stopPropagation()
                      moveLightbox(-1)
                    }}
                  >
                    鈥?                  </button>
                  <button
                    type="button"
                    className="lightbox-nav-button next"
                    aria-label="Next image"
                    onClick={(event) => {
                      event.stopPropagation()
                      moveLightbox(1)
                    }}
                  >
                    鈥?                  </button>
                </>
              )}
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.title}
                draggable={false}
                style={{
                  transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                }}
              />
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
