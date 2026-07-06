import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent, type PointerEvent as ReactPointerEvent, type WheelEvent } from 'react'
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

type SkillDragState = {
  skillId: string
  pointerId: number
  timer: number | null
  dragging: boolean
  originalSkills: Skill[]
  currentSkills: Skill[]
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

function SvgConvertIcon() {
  return (
    <svg className="lightbox-action-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 4.2c0-.9.7-1.6 1.6-1.6h3.4l4 4v5.2c0 .9-.7 1.6-1.6 1.6H5.1c-.9 0-1.6-.7-1.6-1.6V4.2Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
      <path d="M8.5 2.8v3.8h3.8" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
      <path d="M5.7 10.7c.7.5 1.4.7 2.3.7s1.6-.2 2.3-.7" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M6.2 8.7h3.6" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  )
}

function CutoutIcon() {
  return (
    <svg className="lightbox-action-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path
        d="M5.2 3.1c1.4-1 3.7-.8 5 .5 1.7 1.7 1.4 4.7-.6 6.7-1.8 1.8-4.7 2.8-7.1 2.9"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.4 5.2c-.9 1.7-.9 3.7.3 5"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeDasharray="1.2 2.1"
      />
      <path d="m9.8 9.9 3.2 3.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      <path d="m12.7 9.8-2.8 3.4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
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

function ClearSelectionIcon() {
  return (
    <svg className="merge-clear-icon" aria-hidden="true" viewBox="0 0 16 16" fill="none">
      <path d="M4.4 4.4 11.6 11.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11.6 4.4 4.4 11.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function MoveIcon() {
  return (
    <svg className="skill-move-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m8.75 6.25 3.25-3.25 3.25 3.25" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m8.75 17.75 3.25 3.25 3.25-3.25" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m6.25 8.75-3.25 3.25 3.25 3.25" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m17.75 8.75 3.25 3.25-3.25 3.25" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PinTopIcon() {
  return (
    <svg className="skill-move-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M3.75 3.75h12.5" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="M10 17V6.25" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="m5.8 10.45 4.2-4.2 4.2 4.2" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MoveUpIcon() {
  return (
    <svg className="skill-move-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M10 17V3" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="m5.3 7.7 4.7-4.7 4.7 4.7" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MoveDownIcon() {
  return (
    <svg className="skill-move-icon" aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M10 3v14" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
      <path d="m5.3 12.3 4.7 4.7 4.7-4.7" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
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
  svgUrl?: string
  revisedPrompt?: string
}

type GeneratedImage = {
  id: string
  directionId: string
  title: string
  imageUrl: string
  svgUrl?: string
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

type MergeImageSlot = {
  id: 'product' | 'background' | 'angle' | 'model'
  label: string
  hint: string
}

type MultiAngleOutputMode = 'combined' | 'separate'

type MergeImageResolution = '1k' | '2k' | '4k'

type ChatMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

type LightboxImage = {
  imageUrl: string
  title: string
  svgUrl?: string
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
  svgUrl?: string
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
  category: '自定义',
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
  { id: 'front', label: '正视图', hint: '商品正面、主图角度' },
  { id: 'left', label: '左侧视图', hint: '左侧轮廓与厚度' },
  { id: 'back', label: '背面', hint: '背部结构、标签或接口' },
  { id: 'right', label: '右侧视图', hint: '右侧轮廓与细节' },
  { id: 'top', label: '顶部', hint: '顶部按钮、开口或纹理' },
  { id: 'bottom', label: '底部', hint: '底标、脚垫或底座' },
  { id: 'detail', label: '细节特写', hint: 'Logo、材质、纹理、接口' },
  { id: 'package', label: '包装/配件', hint: '包装盒、配件、套装' },
]

const multiAngleViewCounts = [3, 6, 9, 12]

const mergeImageSlots: MergeImageSlot[] = [
  { id: 'product', label: '产品鞋图', hint: '锁定鞋款、颜色、材质、扣环、鞋跟和所有细节' },
  { id: 'background', label: '背景图', hint: '锁定墙面、地面、空间、光线和阴影方向' },
  { id: 'angle', label: '角度参考图', hint: '黄=鞋子角度，蓝=腿，红=衣服，黑=背景区域' },
  { id: 'model', label: '模特参考图', hint: '可选：按蓝/红区域参考腿部和穿搭' },
]

const mergeAnglePosePrompts: Record<string, string> = {
  'angle-01': 'Selected pose prompt: walking-left product-shoe pose. The person is moving toward the left side of the frame. The front foot points left and leads the step; the rear foot follows behind with the heel slightly lifted from the ground, creating a natural walking motion. Preserve the leftward walking direction, shoe toe pointing left, raised rear heel, side-view shoe angle, and low product-focused camera framing.',
  'angle-02': 'Selected pose prompt: seated-feeling lower-right-to-center crossed stacked-feet product-shoe focus pose. The model should read as seated or supported outside the frame, never sitting on the floor. The legs extend from the lower-right corner of the frame toward the center, guiding attention to the feet wearing the product shoes. The feet are crossed and stacked, with one foot clearly resting or layered on top of the other foot rather than simply standing side by side. The camera focus should be on the shoes worn on the feet, with the product shoes as the clearest main subject. Preserve the seated-feeling lower-body posture, lower-right entry direction, diagonal leg extension toward the center, overlapping crossed-foot relationship, one-foot-on-top-of-the-other structure, product-shoe focal point, close lower-body crop, and selected angle image perspective.',
  'angle-03': 'Selected pose prompt: hands-only product shoe display. Do not show the person body, torso, legs, face, or head. Only the person hands extend into the frame to hold and present the product shoe toward the camera as the main subject. The shoe is supported by the hands, with fingers naturally wrapping or cupping around it without covering key shoe details. For the red region in this angle mask: it does not always need to become clothing. If a model reference image is uploaded and the model is wearing sleeveless clothing or no visible sleeve in the corresponding area, do not force sleeves or extra clothing into the red region; follow the uploaded model reference clothing only where it naturally applies. If no model reference image is uploaded, follow the angle-03 region layout itself completely for the red region and composition. Preserve the hands-entering-the-frame display feeling, hand-held product presentation, close product focus, and clean presentation angle.',
  'angle-04': 'Selected pose prompt: left-facing raised-foot heel-adjusting pose. The person faces or moves toward the left side of the frame. One foot is lifted backward or upward, and one hand reaches toward the lifted foot to adjust or tidy the shoe heel. Preserve the left-facing body direction, raised foot, hand reaching to the shoe heel, side-view low-camera perspective, and natural try-on adjustment action.',
  'angle-05': 'Selected pose prompt: seated cross-leg shoe-try-on pose. The model should read as a seated cross-leg try-on posture, as if supported outside the frame, never sitting on the floor, with one leg crossed over the other or one lower leg resting across the opposite leg. Do not add a visible stool, bench, chair, platform, or support object unless it is clearly required by the selected angle image. Follow the selected angle image for camera angle and crop: if the angle image only shows skirt hem, legs, and shoes, do not force a full upper body unless the output is horizontal and needs extra framing. One product shoe is the main display foot and the other leg only supports the crossed-leg posture. Preserve the seated posture feeling, ankle overlap, bent-knee relationship, shoe angle, and low side/front product-camera view from the angle image.',
  'angle-06': 'Selected pose prompt: seated shoe-holding product display pose. The model should read as seated, as if supported outside the frame, never sitting on the floor. One foot wears the product shoe while a hand holds another product shoe for display, creating a seated try-on and handheld-shoe presentation. Do not add a visible stool, bench, chair, platform, or support object unless clearly required by the selected angle image. Preserve the seated posture feeling, worn-shoe and handheld-shoe contrast, hand-held shoe position, and product-focused framing.',
  'angle-08': 'Selected pose prompt: seated cross-leg shoe-try-on pose. The model should read as seated on the left side of the frame and facing or turning toward the right, as if supported outside the frame, never sitting on the floor. The legs are crossed, with one lower leg laid over or in front of the other. Do not add a visible stool, bench, chair, platform, or support object unless it is clearly required by the selected angle image. Follow the selected angle image for camera angle and crop: if the angle image only shows skirt hem, legs, and shoes, do not force a full upper body unless the output is horizontal and needs extra framing. The product shoe on the raised or forward foot is the main focus, and the shoe exterior must be generated from the uploaded product shoe image, not from the angle-library image. Preserve the left-side seated position, right-facing body direction, crossed ankles, bent leg silhouette, shoe direction, side/front camera angle, and try-on posture visible in the angle image.',
  'angle-09': 'Selected pose prompt: seated shoe display pose with one worn shoe and one handheld shoe. The model should read as seated on the left side of the frame and facing or turning toward the right, as if supported outside the frame, never sitting on the floor. One foot is planted or extended while wearing the product shoe, and one hand holds a second product shoe for display. Do not add a visible stool, bench, chair, platform, or support object unless clearly required by the selected angle image. Preserve the left-side seated position, right-facing body direction, seated try-on feeling, handheld shoe display, worn-shoe contrast, and frontal-side product camera view.',
  'angle-10': 'Selected pose prompt: first-person lower-body shoe display pose. One foot extends into the frame from the bottom edge, as if viewed from the model own first-person perspective. Beside the foot, one hand holds a product shoe for display. Preserve the bottom-entry foot direction, first-person try-on feeling, hand-held shoe beside the foot, close lower-body framing, product-focused composition, and the selected angle image camera angle, crop, spacing, and perspective.',
  'angle-11': 'Selected pose prompt: centered side-view one-leg-back pose. The support foot is planted near the lower-left. The other leg bends backward toward the right-middle, with the raised shoe pointing slightly down. Preserve the single support foot, backward lifted shoe, bent-knee silhouette, and low side-view framing.',
  'angle-12': 'Selected pose prompt: right-side seated-feeling two-feet shoe display with foreground pick-up action. The model is positioned on the right side of the frame and faces or turns toward the left. The posture should read as seated or supported outside the frame, never sitting on the floor; the support object does not need to appear. Both feet are displayed in the upper area of the composition, following the selected angle image for foot placement, shoe direction, camera angle, and crop. Use a close high-angle oblique top-down camera view, like the camera is above and in front of the model feet at about a 45-degree downward angle. The view is not a flat overhead view and not an eye-level view; it must be a perspective-rich diagonal top-down product angle. One hand reaches toward or prepares to pick up the foreground display shoes. The foreground display shoes are a pair, not a single shoe, and they are only ground/display shoes with no extra legs. Preserve the right-to-left body direction, seated-feeling posture, two upper-frame feet, hand-reaching action, paired foreground display-shoe relationship, close oblique top-down perspective, and product-focused camera view from the angle image.',
  'angle-13': 'Selected pose prompt: right-edge entry with lower worn shoe and upper handheld shoe. The lower area shows one foot wearing the product shoe for display; this lower worn shoe should tilt upward at the front/toe area, with the shoe front clearly raised and only the heel touching the ground. The upper area shows one hand holding another product shoe horizontally for display, and the handheld display shoe must stay very close to the worn shoe on the foot rather than being far away from it. The two visible shoes must form a left-right pair, not two shoes from the same side: if the worn shoe is the left-foot shoe, the handheld shoe must be the matching right-foot shoe; if the worn shoe is the right-foot shoe, the handheld shoe must be the matching left-foot shoe. For both the worn shoe on the foot and the handheld display shoe, the shoe toe/front must point toward the left side of the frame. The handheld shoe must be held sideways and horizontally across the frame; its front/top face should face the camera for product display, while its toe still points left. Do not show the handheld shoe sole or back as the main facing surface. Both the foot and the hand enter from the right side of the frame. Preserve the right-side entry direction, lower-foot shoe display, matching left-right shoe pair, both shoe toes pointing left, upward front/toe shoe presentation with heel contact only, tight spacing between the handheld display shoe and the worn shoe, upper-handheld shoe held-horizontal presentation, front-facing horizontal shoe view, high/side product-view relationship, and layered composition.',
  'angle-14': 'Selected pose prompt: left-side seated shoe display with oblique high-angle foot view. The model should be seated on the left side of the frame, as if supported outside the frame, never sitting on the floor. The product shoe toe/front should point toward the right side of the frame. Use a medium-high oblique top-down camera view: the camera is above and slightly in front of the model feet, shooting downward at about a 35-45 degree angle. The view is not a frontal eye-level view and not a flat overhead view; it must feel like a realistic perspective-rich oblique top-down foot/shoe product shot. Do not force a full upper body if the selected angle image only shows lower body, legs, shoes, and foreground display shoes. Any shoes in the foreground are only ground/display shoes and must not receive extra legs. Preserve the left-side seated position, shoe toe pointing right, real perspective from the 35-45 degree high oblique camera angle, foreground depth, product-shoe focus, and selected angle image crop.',
  'angle-15': 'Selected pose prompt: seated cross-leg shoe-try-on pose with scattered foreground shoes. The model should read as a seated cross-leg try-on posture, as if supported outside the frame, never sitting on the floor, with one leg crossed over the other, creating a bent-knee try-on posture. Do not add a visible stool, bench, chair, platform, or support object unless it is clearly required by the selected angle image. Follow the selected angle image for camera angle and crop: if the angle image only shows skirt hem, legs, shoes, and scattered foreground shoes, do not force a full upper body unless the output is horizontal and needs extra framing. The worn product shoe on the main crossed or forward foot is the key display shoe; any scattered foreground shoes are only ground/display shoes and must not create additional legs. Preserve the seated posture feeling, leg crossing, ankle relationship, shoe angle, low side/front camera view, and spatial relationship shown in the angle image.',
}

const mergeAngleLibrary = Array.from({ length: 15 }, (_, index) => index + 1)
  .filter((angleNumber) => angleNumber !== 7)
  .map((angleNumber, displayIndex) => ({
    id: `angle-${String(angleNumber).padStart(2, '0')}`,
    label: `角度 ${displayIndex + 1}`,
    url: `/assets/merge-angle-library/angle-${String(angleNumber).padStart(2, '0')}.png`,
  }))
const mergeAngleBatchLimit = 10

const mergeImageSizeOptions = [
  { label: '智能尺寸', detail: '按背景图比例', value: 'auto' },
  { label: '方图', detail: '1:1 主图', value: '1024x1024' },
  { label: '竖图', detail: '3:4 场景', value: '1024x1365' },
  { label: '横图', detail: '4:3 展示', value: '1536x1152' },
  { label: '宽屏', detail: '16:9 海报', value: '1536x864' },
  { label: '竖屏', detail: '9:16 内容流', value: '864x1536' },
  { label: '横版', detail: '3:2 商品图', value: '1536x1024' },
  { label: '竖版', detail: '2:3 商品图', value: '1024x1536' },
]

const mergeImageResolutionOptions: { label: string; detail: string; value: MergeImageResolution; longSide: number }[] = [
  { label: '1K', detail: '长边 1024px', value: '1k', longSide: 1024 },
  { label: '2K', detail: '长边 2048px', value: '2k', longSide: 2048 },
  { label: '4K', detail: '长边 4096px', value: '4k', longSide: 4096 },
]

const mergeImageStrictReferenceLogic = [
  'STRICT MULTI-REFERENCE RULES FOR AI PRODUCT BACKGROUND FUSION:',
  'The angle reference or selected angle-library image itself is the primary pose and composition control, not the text notes. Directly observe this image for body pose, foot/shoe spatial relationship, camera angle, perspective, scale, and occlusion. Any pose text or region analysis is only auxiliary explanation; if text conflicts with the angle image, follow the angle image.',
  'The angle reference or selected angle-library image is a semantic region mask, not a style image. Read its visual regions from the image itself, then replace each region with content from the correct reference.',
  'Yellow regions = shoe angle and placement reference only. Yellow regions only indicate where shoes appear and how they are placed, including shoe position, size, orientation, toe direction, heel direction, left-foot/right-foot side inference, body-facing direction inference, heel position, and perspective. Do not use the angle-library image or yellow mask as shoe appearance, shoe silhouette, shoe design, shoe color, material, style, shape, toe shape, heel shape, sole shape, strap/lace/buckle design, or product proportions. Generate the uploaded product shoe in each yellow region, using the product shoe image as the only and 100% authoritative source for shoe shape, color, material, texture, straps, buckle, heel, sole, toe shape, stitching, lining, and proportions. A yellow region connected to a blue leg/ankle/foot region is a worn shoe on the foot; a yellow region not connected to any blue limb is a ground or foreground display shoe only, so generate only the product shoe there and do not add an extra leg or foot.',
  'Blue regions = body limb regions. Identify each blue region by its silhouette and position: it may be a leg, foot/ankle segment, arm, hand, or wrist. Generate the matching natural female body part in every blue region. Limb pose, joint direction, occlusion, and body angle must follow the angle mask, while skin tone and styling can come from the model reference.',
  'Red regions = clothing support regions. Generate the real outfit type from the uploaded model reference only as supporting styling around the product shoes. Match the model reference clothing category, color, fabric, drape, silhouette, waistband/hem details, and styling, but the clothing must not become the main visual subject or occupy attention beyond the red mask intent. Do not invent a skirt/dress if the model reference is wearing pants, jeans, shorts, or a top. Do not copy the model reference shoes.',
  'Black regions = background regions. Generate the uploaded background image environment in all black/empty regions, including wall, floor, baseboard, light direction, atmosphere, and shadows.',
  'Priority order: product shoe as the main visual subject > angle mask pose/composition and yellow shoe placement/angle reference > body limbs that support the shoe display > model outfit as secondary styling only > background realism. Product shoe appearance must come 100% from the product shoe image only; the angle-library image and yellow mask control only placement, angle, scale, perspective, and occlusion, never shoe exterior design or silhouette.',
  'Final image: one realistic ecommerce product-shoe hero scene focused on the lower body only. The uploaded product shoes must be the clearest main subject and visual focus. Body limbs, clothing, camera angle, perspective, scale, and occlusion follow the angle mask, but clothing stays secondary and must not dominate the image. Background comes only from the background image.',
  'Lower-body crop rule: do not generate the model face, head, portrait, or full upper body. Show only the lower body needed for the shoe display, such as legs, feet, hands, skirt hem, pants hem, or partial waist when required by the angle mask. If the angle mask does not show the upper body, keep the upper body outside the frame.',
  'Forbidden: any visible semantic mask colors or color-block shapes from the angle reference, including yellow blocks, blue blocks, red blocks, black blocks, flat colored silhouettes, tinted mask remnants, yellow shoes from the mask, blue limbs, red block clothing, black mask background, model face, head, portrait, full upper body, model reference shoes, model reference background/wall/floor/shadows/watermark/props, extra shoes, extra limbs, deformed hands or feet, wrong toes or fingers, text, watermark, logo, collage look.',
].join('\n')

function buildUploadedAngleGenerationPrompt(uploadedAngleAnalysis = '') {
  const analysisBlock = uploadedAngleAnalysis.trim()
    ? [
        '【上传角度图分析结果（由上传角度分析提示词生成，必须融入本套专用提示词执行）】',
        '',
        '以下分析结果用于把上传角度参考图里的构图、姿势、色块边界、脚尖方向、鞋跟方向、身体朝向、透视关系和裁切关系加入本套上传角度图专用生成提示词中。',
        '分析结果不能覆盖产品鞋图的产品外观控制，不能覆盖背景图的环境控制，不能把角度图当作鞋款、服装、背景或材质参考。',
        '',
        uploadedAngleAnalysis.trim(),
        '',
        '执行方式：最终生成时，先遵守本套上传角度图专用提示词的固定规则，再把以上分析结果作为构图与姿势细化说明一起执行。若分析文字与上传角度图本身冲突，以上传角度图视觉内容为准；若与产品鞋图冲突，以产品鞋图为准。',
      ].join('\n')
    : [
        '【上传角度图分析结果】',
        '',
        '未获得额外智能分析结果。直接按照上传角度参考图本身的色块区域、构图、姿势、脚部角度、透视关系和裁切关系执行。',
      ].join('\n')

  return [
  'USER-UPLOADED ANGLE REFERENCE GENERATION PROMPT: this block applies only when the user uploads an angle reference image. It must not change the angle-library prompts or the common global merge prompt.',
  'Universal uploaded-angle rule: the uploaded angle reference image is the hard visual template for pose, composition, shoe count, shoe placement, shoe direction, camera angle, crop, perspective, scale, overlap, occlusion, and body-to-shoe relationship. The final generation must visually follow the uploaded angle image itself, not a guessed pose from text alone.',
  'The uploaded angle reference may be a color-block semantic mask, a real photo, a sketch, a layout guide, or a mixed reference. Always read it as a layout/pose template only. Never use it as the source of product shoe design, shoe material, clothing design, background style, color palette, brand, text, or final visual texture.',
  'If the uploaded angle reference is a color-block mask, use this mapping strictly: yellow = product shoe area and shoe placement/angle, blue = visible body limb area such as leg/foot/ankle/hand/arm, red = clothing area, black = background/empty environment area. If the image is not a color-block mask, infer the same roles from the visible shoes, feet, legs, clothing, hands, crop, and camera perspective.',
  'Object-count rule: determine the number of real shoe objects by the whole visual intent of the uploaded angle image, not by the number of disconnected color fragments. Shoe straps, buckles, openings, toe gaps, heel gaps, lace gaps, stitching lines, inner shadows, black holes inside a yellow shoe, and separated yellow accessory pieces belong to their nearest main shoe object and must not be counted as extra shoes. Do not invent extra shoes beyond the uploaded angle image. Do not delete a main shoe that is clearly present.',
  'Region-boundary rule for masks: preserve the main outline, bounding box, placement, direction, scale, and overlap of each semantic region. Internal black marks or holes enclosed by a yellow shoe region are shoe openings, strap gaps, inner shadows, or product-detail gaps, not background zones. Only the large exterior black/empty canvas areas are background. Thin dividing lines inside yellow, blue, or red areas should guide detail/occlusion but must not split one object into multiple objects.',
  'Shoe-direction lock: infer toe direction, heel direction, shoe rotation, left-foot/right-foot identity, worn-vs-display status, contact point, perspective, and whether each shoe is connected to a blue limb or independent. The generated product shoes must keep the same direction and perspective as the uploaded angle reference. Do not flip, reverse, rotate, swap left/right, change camera side, or reinterpret the body-facing direction.',
  'Body relationship rule: if a yellow shoe region touches or is visually connected to blue leg/ankle/foot geometry, generate it as a worn shoe connected to that limb. If a yellow shoe region is not connected to a blue limb, generate it as a display/ground/foreground/handheld product shoe according to the uploaded angle image; do not add an extra leg or foot unless the uploaded angle image clearly requires one. If blue regions represent hands or arms rather than legs, generate hands/arms only in those regions and keep the shoe relationship from the reference.',
  'Product lock: every generated shoe must come from the uploaded product shoe image as the only source of shoe identity, shape, color, material, toe, heel, sole, straps, buckles, stitching, lining, and proportions. The uploaded angle image controls only where and how that product appears. Adapt the product shoe only through rotation, perspective, scale, side mirroring, occlusion, and contact required by the uploaded angle reference.',
  'Reference separation: clothing must come from the uploaded model reference image if provided and stay within the role/area indicated by the uploaded angle image. Background must come from the uploaded background image and fill only the environment/empty areas. Final output must not show mask colors, color-block edges, flat semantic silhouettes, labels, text, watermark, or collage artifacts.',
  '',
  analysisBlock,
  '',
  '【参考图优先级规则】',
  '',
  '产品鞋图控制产品外观',
  '角度参考图 控制构图与姿势',
  '背景图控制背景环境',
  '',
  '严格按照以下优先级执行：',
  '',
  '产品 > 构图 > 服装 > 背景',
  '',
  '————————————————————————',
  '',
  '【产品约束（最高优先级）】',
  '',
  '以产品鞋图作为唯一产品参考，',
  '',
  '严格保留产品设计，',
  '',
  '保持鞋头形状、',
  '鞋跟形状、',
  '鞋口形状、',
  '绑带结构、',
  '扣件位置、',
  '鞋底比例、',
  '材质结构、',
  '整体轮廓完全一致。',
  '',
  '不得重新设计产品，',
  '不得新增结构，',
  '不得删减结构，',
  '不得改变鞋型，',
  '不得改变产品识别特征。',
  '',
  '确保生成结果与参考产品保持同款关系。',
  '',
  '————————————————————————',
  '',
  '【构图约束（强制执行）】',
  '',
  '严格遵循用户上传角度参考图的整体视觉构图生成，',
  '',
  '角度参考图可能是色块图、真实照片、草图或混合参考图；',
  '无论是哪一种，都只用来控制构图、姿势、鞋子数量、鞋子位置、脚尖方向、鞋跟方向、透视、裁切、遮挡和主体比例。',
  '',
  '红色区域 = 服装区域',
  '蓝色区域 = 腿部区域',
  '黄色区域 = 产品区域',
  '黑色区域 = 背景区域',
  '',
  '服装仅允许出现在红色区域内。',
  '',
  '腿部仅允许出现在蓝色区域内。',
  '',
  '鞋子仅允许出现在黄色区域内。',
  '',
  '背景仅允许出现在黑色区域内。',
  '',
  '如果上传角度图不是标准色块图，',
  '则根据图中真实鞋子、脚部、腿部、服装、手部、主体轮廓、相机角度和裁切关系推断以上区域角色。',
  '',
  '鞋子数量必须按照角度参考图里的真实主鞋对象数量生成，',
  '不得把鞋带、扣件、鞋口、鞋面开口、鞋内黑影、缝隙、细线或分离的小色块误判成额外鞋子。',
  '',
  '黄色鞋区内部的黑色线条、黑色洞口、镂空、阴影和分割线，',
  '属于鞋子内部结构或遮挡关系，',
  '不是背景区域，',
  '不得因此拆分鞋子数量或改变鞋子角度。',
  '',
  '保持色块边界一致，',
  '保持人物姿态一致，',
  '保持脚部角度一致，',
  '保持画面比例一致，',
  '保持主体位置一致。',
  '',
  '不得修改色块轮廓，',
  '不得改变构图结构，',
  '不得改变透视关系。',
  '',
  '————————————————————————',
  '',
  '【服装约束】',
  '',
  '根据模特参考图生成服装，',
  '',
  '保持服装颜色、',
  '面料纹理、',
  '垂坠感、',
  '面料厚度、',
  '裙摆长度、',
  '裙摆轮廓、',
  '褶皱分布特征。',
  '',
  '服装必须严格限制在红色区域内部。',
  '',
  '不得超出红色区域边界。',
  '',
  '————————————————————————',
  '',
  '【腿部约束】',
  '',
  '根据蓝色区域生成真实女性腿部，',
  '',
  '自然肤色，',
  '真实皮肤质感，',
  '比例正确，',
  '结构准确，',
  '姿态自然优雅。',
  '',
  '不出现上半身，',
  '不出现头部，',
  '',
  '————————————————————————',
  '',
  '【背景约束】',
  '',
  '根据背景图生成背景，',
  '',
  '保持墙面颜色，',
  '保持地面颜色，',
  '保持踢脚线位置，',
  '保持透视关系，',
  '保持地平线高度，',
  '保持空间结构，',
  '保持光线方向。',
  '',
  '背景仅允许出现在黑色区域内。',
  '',
  '允许轻微材质变化，',
  '但整体风格必须一致。',
  '',
  '————————————————————————',
  '',
  '【摄影风格】',
  '',
  '高端女鞋商业广告摄影，',
  '',
  '高级电商详情页风格，',
  '',
  '极简摄影棚场景，',
  '',
  '柔光箱布光，',
  '',
  '高Key光照，',
  '',
  '自然阴影，',
  '',
  '85mm镜头，',
  '',
  '真实皮革质感，',
  '',
  '真实接触阴影，',
  '',
  '高端商业摄影，',
  '',
  '超写实，',
  '',
  '照片级真实感，',
  '',
  '8K高清细节，',
  '',
  '专业产品摄影。',
  '',
  'photorealistic,',
  'luxury footwear advertising,',
  'commercial product photography,',
  'editorial fashion photography,',
  'soft studio lighting,',
  'high key lighting,',
  'premium leather texture,',
  'realistic shadow,',
  '85mm lens,',
  'ultra realistic,',
  '8k,',
  'sharp focus,',
  'professional catalog photography',
  ].join('\n')
}

const fallbackSkills: Skill[] = [
  {
    id: 'ai-merge-image-skill-local',
    displayName: '产品控制融合专家',
    name: 'ai-merge-image-skill',
    description: '上传产品鞋图、背景图和角度参考图，一键融合成自然场景图。',
    folder: 'ai-merge-image-skill',
    referencesCount: 4,
    guidance: {
      summary: '产品鞋图控制产品外观，角度参考图控制构图姿势，背景图控制背景环境。',
      lead: '上传产品鞋图、背景图和角度参考图，我会按三图角色一键融合成自然场景图。',
      checklist: ['产品鞋图', '背景图', '角度参考图', '融合要求'],
      placeholder:
        '例如：把我的产品鞋融合到这张室内背景里，姿态参考上传角度图，只借角度，不复制角度图里的颜色、人体、服装或鞋款设计。',
    },
  },
]

function imageSizeToAspectRatio(size?: string) {
  const match = size?.match(/(\d+)\s*[x×]\s*(\d+)/i)
  if (!match) return '1 / 1'
  const width = Number(match[1])
  const height = Number(match[2])
  return width > 0 && height > 0 ? `${width} / ${height}` : '1 / 1'
}

function productSetPageInstruction(directionId: string, title: string) {
  if (directionId === 'set-hero') {
    return '页型要求：主视觉陈列页。商品必须作为主角清晰出现，占据核心视觉位置，建立整套图的背景、光影、文字和品牌视觉母系统。'
  }
  if (directionId.startsWith('set-selling')) {
    return [
      `页型要求：卖点证明页，围绕「${title}」证明利益点。`,
      '不要默认做“商品摆拍+文字说明”。如果卖点是润肤、舒适、降噪、清洁力、效果提升等结果型利益，可以让人物皮肤状态、使用前后感受、局部效果、生活场景或抽象功能可视化成为画面主体。',
      '商品可以作为旁侧、前景、手持、包装局部或角落弱露出；只有当该卖点必须展示产品结构时，才让产品占主视觉。',
    ].join('\n')
  }
  if (directionId === 'set-scene') {
    return '页型要求：使用场景页。优先展示真实使用关系、人物、环境和情绪，不要只做静物产品图；商品可自然出现在手中、台面、包内、浴室、卧室、户外等合理场景。'
  }
  if (directionId === 'set-detail') {
    return '页型要求：细节/材质页。必须展示产品局部、材质、包装、结构、纹理、接口或使用细节，镜头更近，信息更聚焦。'
  }
  if (directionId === 'set-comparison') {
    return '页型要求：对比/参数页。可采用左右对比、分区卡片、前后效果、数据可视化或清单结构；只展示用户已确认的信息，不编造具体参数。'
  }
  if (directionId === 'set-package') {
    return '页型要求：配件/清单页。展示包装、套装、配件或组合陈列；如果没有明确配件素材，就改为商品组合氛围或购买理由清单，不编造不存在的附件。'
  }
  return '页型要求：在整套商品图母系统内做差异化页面，不要重复上一张的构图。'
}

async function readJsonResponse(response: Response) {
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed) return {}
  try {
    return JSON.parse(trimmed)
  } catch {
    const message = trimmed.startsWith('<')
      ? `服务返回了网页错误，可能是接口地址或代理配置不正确。HTTP ${response.status}`
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
  return title.replace(/^第\s*\d+\s*屏\s*/, '').trim() || title
}

function toUserFacingChineseError(value?: string) {
  if (!value) return ''
  let text = value
    .replace(/GPT-5\.5\s*推理\s*API/g, '智能推理接口')
    .replace(/GPT-5\.5\s*推理/g, '智能推理')
    .replace(/GPT-5\.5\s*/g, '智能推理')
    .replace(/OpenAI\s*/g, '图片生成服务')
    .replace(/\bAPI\b/g, '接口')
    .replace(/API Key/gi, '接口密钥')
    .replace(/SKILL\.md/g, '技能说明')
    .replace(/Huaban\s+discovery|花瓣\s+discovery|discovery/gi, '花瓣灵感库')
    .replace(/\bJSON\b/g, '结构化数据')
    .replace(/\bHTML\b/g, '网页错误')
    .replace(/\(request id[:：]?\s*[A-Za-z0-9_-]+\)/gi, '')
    .replace(/request id[:：]?\s*[A-Za-z0-9_-]+/gi, '')
    .replace(/Invalid token/gi, '密钥无效')
    .replace(/\breferences\b/gi, '参考资料')
    .replace(/\bSkill\b/g, '技能')
  text = text.replace(/\s+/g, ' ').trim()
  return text || '智能推理暂时不可用，已改用本地规则继续。'
}

const logoMockupGroups: LogoMockupGroup[] = [
  {
    match: /茶|咖啡|饮|奶茶|餐|食品|甜品|烘焙|酒|生鲜|调味/,
    options: [
      { id: 'logo-mockup-packaging', title: '精品包装陈列', description: '茶包、杯套、礼盒、贴纸和外卖袋组合成高质感品牌陈列。', selected: true },
      { id: 'logo-mockup-cup', title: '杯身手持场景', description: '杯身、瓶身、封口贴和手持动作，搭配自然桌面与饮品道具。', selected: false },
      { id: 'logo-mockup-storefront', title: '门店灯箱招牌', description: '门头、灯箱、点单台、柜台招牌，呈现真实店铺空间氛围。', selected: false },
      { id: 'logo-mockup-menu', title: '菜单与桌卡系统', description: '菜单、桌卡、杯垫、价签和小票组成完整餐饮视觉系统。', selected: false },
      { id: 'logo-mockup-social', title: '外卖平台首图', description: '小红书、公众号、外卖平台头像和封面中的高识别品牌露出。', selected: false },
    ],
  },
  {
    match: /美妆|护肤|香氛|美容|个护|医美|健康|母婴/,
    options: [
      { id: 'logo-mockup-bottle', title: '高级瓶身套组', description: '精华瓶、面霜罐、香氛瓶与外盒组成轻奢产品套组。', selected: true },
      { id: 'logo-mockup-label', title: '标签封签系统', description: '成分标签、封口贴、试用装、礼盒封签形成精致细节近景。', selected: false },
      { id: 'logo-mockup-counter', title: '专柜陈列场景', description: '品牌柜台、亚克力托盘、柔光镜面和产品组合陈列。', selected: false },
      { id: 'logo-mockup-ritual', title: '护肤仪式感场景', description: '浴室台面、梳妆台、织物、植物和柔光营造生活方式氛围。', selected: false },
    ],
  },
  {
    match: /科技|智能|AI|软件|数据|SaaS|芯片|数码|电子|互联网|App|应用/,
    options: [
      { id: 'logo-mockup-app-icon', title: 'App 图标矩阵', description: '手机桌面、启动页、应用商店卡片和通知图标组成产品矩阵。', selected: true },
      { id: 'logo-mockup-device', title: '多设备界面场景', description: '手机、平板、电脑屏幕展示登录页、仪表盘或品牌首页。', selected: false },
      { id: 'logo-mockup-office', title: '发布会办公物料', description: '工牌、名片、PPT 封面、会议背景板和展台屏幕应用。', selected: false },
      { id: 'logo-mockup-dashboard', title: '数据可视化主屏', description: '深浅界面屏幕、信息卡片、发光边缘和高端科技展厅场景。', selected: false },
    ],
  },
  {
    match: /服装|服饰|潮牌|鞋|包|珠宝|配饰|生活方式|家居/,
    options: [
      { id: 'logo-mockup-tag', title: '吊牌织唛细节', description: '服装吊牌、织唛、领标、包装纸以材质近景呈现。', selected: true },
      { id: 'logo-mockup-bag', title: '购物袋街拍场景', description: '购物袋、快递袋、礼品袋和包装贴纸放入街拍或橱窗场景。', selected: false },
      { id: 'logo-mockup-storefront', title: '门店橱窗系统', description: '门头、橱窗、试衣间导视、店内墙面组成完整零售空间。', selected: false },
      { id: 'logo-mockup-editorial', title: '时尚杂志陈列', description: '吊牌、面料、卡片、配饰和杂志版式构成 editorial 静物画面。', selected: false },
    ],
  },
  {
    match: /教育|儿童|亲子|培训|学校|文创|书店|出版/,
    options: [
      { id: 'logo-mockup-stationery', title: '文具学习套组', description: '笔记本、课程卡、贴纸、帆布袋和手册封面组成学习套装。', selected: true },
      { id: 'logo-mockup-signage', title: '空间导视系统', description: '教室门牌、前台背景墙、展架、活动物料和墙面图形应用。', selected: false },
      { id: 'logo-mockup-social', title: '课程内容封面', description: '课程海报、公众号封面、社群头像和知识卡片视觉系统。', selected: false },
      { id: 'logo-mockup-workshop', title: '工作坊桌面场景', description: '书本、画笔、便签、手册和自然光桌面构成温暖教育场景。', selected: false },
    ],
  },
  {
    match: /宠物|猫|狗|犬|宠粮|宠物用品|动物/,
    options: [
      { id: 'logo-mockup-pet-pack', title: '宠物包装套组', description: '宠粮袋、零食罐、玩具吊牌和贴纸组成可爱货架陈列。', selected: true },
      { id: 'logo-mockup-pet-scene', title: '宠物生活场景', description: '宠物窝、牵引绳、玩具、地毯和自然光家庭场景。', selected: false },
      { id: 'logo-mockup-pet-store', title: '宠物店门头陈列', description: '店铺门头、收银台、货架价签和会员卡品牌应用。', selected: false },
      { id: 'logo-mockup-pet-social', title: '萌宠社媒封面', description: '头像、封面、贴纸表情和品牌卡片组成社媒视觉。', selected: false },
    ],
  },
  {
    match: /运动|健身|瑜伽|户外|露营|骑行|跑步|健康管理/,
    options: [
      { id: 'logo-mockup-sport-gear', title: '运动装备标识', description: '瑜伽垫、水壶、运动包、毛巾和服装印标应用。', selected: true },
      { id: 'logo-mockup-gym-wall', title: '健身空间墙面', description: '健身房墙面、前台、储物柜、课程牌和灯箱招牌。', selected: false },
      { id: 'logo-mockup-outdoor-kit', title: '户外装备场景', description: '露营桌面、登山包、旗帜、贴纸和自然户外光影。', selected: false },
      { id: 'logo-mockup-sport-app', title: '运动 App 界面', description: '运动数据界面、会员卡、课程预约页和智能手表露出。', selected: false },
    ],
  },
  {
    match: /酒店|民宿|旅行|旅游|文旅|度假|咖啡馆|空间|地产|社区/,
    options: [
      { id: 'logo-mockup-hospitality-sign', title: '空间门牌导视', description: '门牌、前台背景墙、钥匙卡、导视牌和灯光空间氛围。', selected: true },
      { id: 'logo-mockup-hotel-amenity', title: '酒店备品套组', description: '房卡、洗护备品、纸袋、欢迎卡和床头桌面陈列。', selected: false },
      { id: 'logo-mockup-travel-print', title: '旅行印刷物料', description: '地图、明信片、票券、护照夹和纪念贴纸组合。', selected: false },
      { id: 'logo-mockup-lobby-scene', title: '大堂氛围场景', description: '前台、大堂墙面、桌面花艺和柔和灯光构成高端空间。', selected: false },
    ],
  },
  {
    match: /艺术|展览|画廊|博物馆|音乐|剧场|影像|潮玩|IP/,
    options: [
      { id: 'logo-mockup-exhibition-wall', title: '展览墙面系统', description: '展墙标题、导览牌、票券、海报和纪念品应用。', selected: true },
      { id: 'logo-mockup-art-print', title: '艺术印刷套组', description: '海报、邀请函、票根、画册封面和收藏卡片陈列。', selected: false },
      { id: 'logo-mockup-merch', title: '周边商品样机', description: '帆布袋、徽章、贴纸、T 恤和亚克力牌组合展示。', selected: false },
      { id: 'logo-mockup-event-scene', title: '活动现场场景', description: '签到台、背景板、手环、指示牌和现场灯光氛围。', selected: false },
    ],
  },
]

const defaultLogoMockups: DeliveryOption[] = [
  { id: 'logo-mockup-packaging', title: '包装物料样机', description: '包装盒、手提袋、贴纸、卡片等通用品牌物料应用。', selected: true },
  { id: 'logo-mockup-signage', title: '空间标识样机', description: '门头、背景墙、导视牌或柜台标识中的应用效果。', selected: false },
  { id: 'logo-mockup-social', title: '线上头像样机', description: '社媒头像、品牌封面、平台图标中的小尺寸识别效果。', selected: false },
]

function inferLogoMockupOptions(brief: string): DeliveryOption[] {
  const matched = logoMockupGroups.find((group) => group.match.test(brief))
  return [
    ...(matched?.options || defaultLogoMockups),
    { id: 'custom-followup', title: '自定义样机', description: '按底部输入的具体场景继续生成样机。', selected: false },
  ]
}

function logoMockupPromptNote(taskTitle: string, detailText: string, brief: string, size: string) {
  return [
    '这是 Logo 样机应用图，不是重新设计 Logo。',
    '必须把选中的 Logo 图作为唯一品牌标识参考，保持 Logo 的图形结构、文字、比例、颜色关系和识别特征，不要改字、错字、重绘或变形。',
    `样机方向：${taskTitle}。`,
    `生成尺寸：${size}。必须严格按这个画幅比例组织构图，不要生成其他比例或把内容裁成方图。`,
    `样机补充：${detailText || '按默认行业应用场景执行。'}`,
    `品牌信息：${brief}`,
    '必须生成客户提案级品牌样机图：真实应用场景、精致构图、自然光影、明确材质、空间层次和行业相关道具都要出现。',
    '设计感要求：画面要有明确视觉主次、品牌色延展、材质对比、留白节奏、成组物料系统和 editorial / campaign look，不要像普通模板截图。',
    '请主动参考花瓣灵感库常见的品牌样机与场景图组织方式：多物料组合、斜向构图、局部特写、空间导视、生活方式场景、精致静物、灯箱招牌、社媒封面矩阵。',
    '不要白花花空背景，不要只把 Logo 放在白底画布上；可以使用包装、杯身、门店、屏幕、名片、吊牌、柜台、桌面、橱窗、展架或社媒头像等行业应用场景。',
    '画面应当干净、商业化、精致、有氛围，能直接放进品牌提案；但 Logo 本体必须清晰可读且不被遮挡。',
    '样机灵感库可后续从花瓣灵感库人工收录不同行业品类的样机图和场景图；当前请根据行业品类生成合理、精致、可用于客户提案的样机图。',
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
  const [mergeImageFiles, setMergeImageFiles] = useState<Record<string, File[]>>({})
  const [draggingMergeImageSlot, setDraggingMergeImageSlot] = useState('')
  const [mergeReferenceModalSlot, setMergeReferenceModalSlot] = useState<'angle' | ''>('')
  const [selectedMergeAngleIds, setSelectedMergeAngleIds] = useState<string[]>([])
  const [mergeAngleLibraryAnalyses, setMergeAngleLibraryAnalyses] = useState<Record<string, string>>({})
  const [mergeImageSize, setMergeImageSize] = useState('auto')
  const [mergeImageResolution, setMergeImageResolution] = useState<MergeImageResolution>('1k')
  const [mergeCustomWidth, setMergeCustomWidth] = useState('1536')
  const [mergeCustomHeight, setMergeCustomHeight] = useState('1152')
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
  const [openSkillMoveId, setOpenSkillMoveId] = useState('')
  const [movingSkillId, setMovingSkillId] = useState('')
  const [draggingSkillId, setDraggingSkillId] = useState('')
  const [skillDragDropIndex, setSkillDragDropIndex] = useState<number | null>(null)
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
  const [cutoutLoadingUrl, setCutoutLoadingUrl] = useState('')
  const [svgConvertingUrl, setSvgConvertingUrl] = useState('')
  const [lightboxConvertedSvgUrl, setLightboxConvertedSvgUrl] = useState('')
  const [lightboxStatus, setLightboxStatus] = useState('')
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
  const skillDragRef = useRef<SkillDragState | null>(null)
  const skillDragClickBlockedRef = useRef(false)
  const skillDragDropIndexRef = useRef<number | null>(null)

  const canGenerateAllDirections = Boolean(directionResult?.directions && directionResult.directions.length > 1)
  const isDetailPageSkill = skill?.name === 'detail-page-assistant' || skill?.displayName === '电商详情页设计专家'
  const isLogoSkill =
    skill?.name === 'ai-brand-skill' ||
    skill?.displayName === '品牌logo设计' ||
    skill?.name === 'logook3' ||
    skill?.displayName === '品牌Logo设计专家'
  const isProductImageSetSkill =
    skill?.name === 'product-image-set-design-expert' || skill?.displayName === '电商套图设计专家'
  const isMultiAngleSkill =
    skill?.name === 'ai-multi-angle-skill' ||
    skill?.id === 'ai-multi-angle-skill-local' ||
    /multi-angle/i.test(skill?.id || '') ||
    skill?.displayName === '产品多角度视图'
  const isMergeImageSkill =
    skill?.name === 'ai-merge-image-skill' ||
    skill?.id === 'ai-merge-image-skill-local' ||
    /merge-image/i.test(skill?.id || '') ||
    skill?.displayName === 'AI产品背景融合' ||
    skill?.displayName === '产品控制融合专家'
  const isInitialThinking = loading && !analysis && !isMergeImageSkill
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
        : [{ id: 'pending', title: '选择要生成的页面', description: '' }]
      : selectedPreviewDirection
        ? [selectedPreviewDirection]
        : directionResult?.directions?.[0]
          ? [directionResult.directions[0]]
          : [{ id: 'pending', title: 'Ready', description: '' }]
  const previewImages = [
    ...imageResults.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      svgUrl: item.svgUrl,
      title: item.title,
      aspectRatio: imageSizeToAspectRatio(item.size),
    })),
    ...expansionResults.map((item) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      title: `${item.title} · ${item.baseTitle}`,
      aspectRatio: imageSizeToAspectRatio(item.size),
    })),
  ]
  const mergeImagePreviewUrls = useMemo(() => {
    const entries = Object.entries(mergeImageFiles).flatMap(([slotId, files]) =>
      files.map((file, index) => [`${slotId}-${index}`, URL.createObjectURL(file)] as const),
    )
    return Object.fromEntries(entries)
  }, [mergeImageFiles])
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
      badge: isLogoSkill ? 'Logo 方案' : '主图',
    })),
    ...(isLogoSkill ? [] : expansionResults.map((item) => ({
      id: item.id,
      directionId: item.directionId,
      imageUrl: item.imageUrl,
      title: item.title,
      badge: isLogoSkill ? `样机 · ${item.baseTitle}` : `扩展 · ${item.baseTitle}`,
    }))),
  ]

  const workflowStepLabels = [
    '需求理解',
    '参考选择',
    ...(hasOptionStep ? ['选项配置'] : []),
    '方向确认',
    '生图',
    ...(adjustableImages.length > 0 ? [isLogoSkill ? '样机选择' : '扩展选择'] : []),
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
        if (!skillsResponse.ok) throw new Error('无法读取本地技能列表。')
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
        setError(bootError instanceof Error ? bootError.message : '启动失败。')
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
        content: `已选择 ${skill.displayName}。${skill.guidance?.lead || '先告诉我你的目标、素材和风格方向。'}`,
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
    setMergeImageFiles({})
    setDraggingMergeImageSlot('')
    setSelectedMergeAngleIds([])
    setMergeImageSize('auto')
    setMergeCustomWidth('1536')
    setMergeCustomHeight('1152')
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
    return () => {
      Object.values(mergeImagePreviewUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [mergeImagePreviewUrls])

  useEffect(() => {
    if (mergeReferenceModalSlot === 'angle' && (mergeImageFiles.angle || []).length === 0) {
      setMergeReferenceModalSlot('')
    }
  }, [mergeImageFiles.angle, mergeReferenceModalSlot])

  useEffect(() => {
    if (!isMergeImageSkill) return
    let cancelled = false
    async function analyzeLibrary() {
      const entries = await Promise.all(mergeAngleLibrary.map(async (item) => {
        if (mergeAngleLibraryAnalyses[item.id]) return [item.id, mergeAngleLibraryAnalyses[item.id]] as const
        try {
          const file = await fileFromAsset(item.url, `${item.id}.png`)
          const analysis = await describeAngleColorBlocks(file, `${item.label} / ${item.id}`)
          return [item.id, analysis] as const
        } catch {
          return [item.id, ''] as const
        }
      }))
      if (!cancelled) {
        setMergeAngleLibraryAnalyses((current) => ({
          ...current,
          ...Object.fromEntries(entries.filter(([, analysis]) => analysis)),
        }))
      }
    }
    analyzeLibrary()
    return () => {
      cancelled = true
    }
  }, [isMergeImageSkill])

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
    if (!response.ok) throw new Error(data.error || '无法读取本地技能列表。')
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
      if (!response.ok) throw new Error(data.error || '无法读取项目列表。')
      setProjects(Array.isArray(data.projects) ? data.projects as ProjectItem[] : [])
    } catch (projectsError) {
      setError(projectsError instanceof Error ? projectsError.message : '无法读取项目列表。')
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
        if (!response.ok) throw new Error(data.error || '删除项目失败。')
      }
      setProjects((current) => current.filter((project) => !projectIds.includes(project.id)))
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除项目失败。')
      throw deleteError
    }
  }

  async function deleteSkill(skillToDelete: SkillDeleteConfirm) {
    setDeletingSkill(true)
    setError('')
    try {
      const response = await fetch(`/api/skills/${encodeURIComponent(skillToDelete.id)}`, { method: 'DELETE' })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '删除 Skill 失败。')
      const nextSkills = await refreshSkillList(selectedSkill === skillToDelete.id ? undefined : selectedSkill)
      if (nextSkills.length === 0) {
        setSelectedSkill('')
      }
      setSkillDeleteConfirm(null)
      setOperationStatus(`已删除 Skill：${skillToDelete.displayName}`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除 Skill 失败。')
    } finally {
      setDeletingSkill(false)
    }
  }

  async function reorderSkill(skillId: string, action: 'top' | 'up' | 'down') {
    const currentIndex = skills.findIndex((item) => item.id === skillId)
    if (currentIndex < 0) return
    const nextSkills = [...skills]
    const [skillToMove] = nextSkills.splice(currentIndex, 1)
    if (!skillToMove) return
    const targetIndex = action === 'top'
      ? 0
      : action === 'up'
        ? Math.max(0, currentIndex - 1)
        : Math.min(skills.length - 1, currentIndex + 1)
    if (targetIndex === currentIndex) return

    nextSkills.splice(targetIndex, 0, skillToMove)
    setMovingSkillId(skillId)
    setError('')
    try {
      setSkills(nextSkills)
      const response = await fetch('/api/skills/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: nextSkills.map((item) => item.id) }),
      })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || '无法保存技能排序。')
      if (Array.isArray(data.skills)) setSkills(data.skills as Skill[])
      setOpenSkillMoveId('')
      setOperationStatus('技能排序已保存。')
    } catch (reorderError) {
      setSkills(skills)
      setError(reorderError instanceof Error ? reorderError.message : '无法保存技能排序。')
    } finally {
      setMovingSkillId('')
    }
  }

  async function saveSkillOrder(nextSkills: Skill[], previousSkills: Skill[], statusText = 'Skill order saved.') {
    setMovingSkillId('skill-drag')
    setError('')
    try {
      setSkills(nextSkills)
      const response = await fetch('/api/skills/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: nextSkills.map((item) => item.id) }),
      })
      const data = await readJsonResponse(response)
      if (!response.ok) throw new Error(data.error || 'Unable to save skill order.')
      if (Array.isArray(data.skills)) setSkills(data.skills as Skill[])
      setOpenSkillMoveId('')
      setOperationStatus(statusText)
    } catch (reorderError) {
      setSkills(previousSkills)
      setError(reorderError instanceof Error ? reorderError.message : 'Unable to save skill order.')
    } finally {
      setMovingSkillId('')
    }
  }

  function findSkillDropIndex(clientY: number, movingSkillIdForDrop: string) {
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.skill-directory-list article[data-skill-id]'))
      .filter((row) => row.dataset.skillId !== movingSkillIdForDrop)
    let targetIndex = rows.length
    rows.some((row, index) => {
      const rect = row.getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) {
        targetIndex = index
        return true
      }
      return false
    })
    return targetIndex
  }

  function moveSkillToIndex(skillId: string, targetIndex: number, sourceSkills: Skill[]) {
    const nextSkills = [...sourceSkills]
    const currentIndex = nextSkills.findIndex((item) => item.id === skillId)
    if (currentIndex < 0) return nextSkills
    const [skillToMove] = nextSkills.splice(currentIndex, 1)
    if (!skillToMove) return nextSkills
    nextSkills.splice(Math.max(0, Math.min(targetIndex, nextSkills.length)), 0, skillToMove)
    return nextSkills
  }

  function beginSkillPointerMove(skillId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || movingSkillId) return
    const button = event.currentTarget
    const originalSkills = [...skills]
    const pointerId = event.pointerId
    const timer = window.setTimeout(() => {
      const dragState = skillDragRef.current
      if (!dragState || dragState.pointerId !== pointerId) return
      dragState.dragging = true
      setDraggingSkillId(skillId)
      const currentIndex = originalSkills.findIndex((item) => item.id === skillId)
      skillDragDropIndexRef.current = currentIndex
      setSkillDragDropIndex(currentIndex)
      setOpenSkillMoveId('')
      button.setPointerCapture(pointerId)
    }, 260)
    skillDragRef.current = {
      skillId,
      pointerId,
      timer,
      dragging: false,
      originalSkills,
      currentSkills: originalSkills,
    }
  }

  function updateSkillPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = skillDragRef.current
    if (!dragState || dragState.pointerId !== event.pointerId || !dragState.dragging) return
    event.preventDefault()
    const targetIndex = findSkillDropIndex(event.clientY, dragState.skillId)
    if (targetIndex === skillDragDropIndexRef.current) return
    skillDragDropIndexRef.current = targetIndex
    setSkillDragDropIndex(targetIndex)
  }

  async function finishSkillPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = skillDragRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    if (dragState.timer !== null) window.clearTimeout(dragState.timer)
    skillDragRef.current = null
    if (dragState.dragging) {
      event.preventDefault()
      skillDragClickBlockedRef.current = true
      const targetIndex = skillDragDropIndexRef.current ?? dragState.originalSkills.findIndex((item) => item.id === dragState.skillId)
      const nextSkills = moveSkillToIndex(dragState.skillId, targetIndex, dragState.originalSkills)
      dragState.currentSkills = nextSkills
      setDraggingSkillId('')
      skillDragDropIndexRef.current = null
      setSkillDragDropIndex(null)
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Pointer capture may already be released by the browser.
      }
      const changed = nextSkills.map((item) => item.id).join('|') !== dragState.originalSkills.map((item) => item.id).join('|')
      if (changed) {
        setSkills(nextSkills)
        await saveSkillOrder(nextSkills, dragState.originalSkills)
      }
      window.setTimeout(() => {
        skillDragClickBlockedRef.current = false
      }, 0)
    }
  }

  function cancelSkillPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = skillDragRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    if (dragState.timer !== null) window.clearTimeout(dragState.timer)
    if (dragState.dragging) setSkills(dragState.originalSkills)
    skillDragRef.current = null
    setDraggingSkillId('')
    skillDragDropIndexRef.current = null
    setSkillDragDropIndex(null)
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
        throw new Error('选择的文件夹里没有技能说明文件。')
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
      if (!response.ok) throw new Error(data.error || '读取本地技能失败。')
      await refreshSkillList(data.skill?.id)
      setSkillsOpen(true)
      setOperationStatus(`已读取技能：${data.skill?.displayName || '本地技能'}`)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : '读取本地技能失败。')
    } finally {
      setImportingSkill(false)
      if (skillDirectoryInputRef.current) skillDirectoryInputRef.current.value = ''
    }
  }

  async function draftSkillOutline() {
    if (!skillCreateForm.displayName.trim() || !skillCreateForm.purpose.trim()) {
      setSkillCreateStatus('请先填写 Skill 名称和用途。')
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
      if (!response.ok) throw new Error(data.error || '生成大纲失败。')
      setSkillCreateOutline(String(data.outline || ''))
      setSkillCreateProviderError(String(data.providerError || ''))
      setSkillCreateStatus('设计大纲已生成。确认无误后再创建本地技能。')
    } catch (draftError) {
      setSkillCreateStatus(draftError instanceof Error ? draftError.message : '生成大纲失败。')
    } finally {
      setDraftingSkill(false)
    }
  }

  async function createLocalSkill() {
    if (!skillCreateOutline.trim()) {
      setSkillCreateStatus('请先生成并确认设计大纲。')
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
      if (!response.ok) throw new Error(data.error || '创建 Skill 失败。')
      await refreshSkillList(data.skill?.id)
      setCreateSkillOpen(false)
      setSkillsOpen(true)
      setSkillCreateStatus('')
      setOperationStatus(`已创建 Skill：${data.skill?.displayName || skillCreateForm.displayName}`)
    } catch (createError) {
      setSkillCreateStatus(createError instanceof Error ? createError.message : '创建 Skill 失败。')
    } finally {
      setCreatingSkill(false)
    }
  }

  async function submitBrief() {
    const multiAngleEntries = multiAngleSlots.flatMap((slot) =>
      (multiAngleFiles[slot.id] || []).map((file, index) => ({ slot, file, index })),
    )
    const mergeImageEntries = mergeImageSlots.flatMap((slot) =>
      (mergeImageFiles[slot.id] || []).map((file) => ({ slot, file })),
    )
    const effectiveBrief = buildMergeImageBrief(buildMultiAngleBrief(brief))
    if (!skill) {
      setError('请先选择技能。')
      return
    }
    if (!effectiveBrief.trim()) {
      setError('请先输入需求。')
      return
    }
    if (isMultiAngleSkill && multiAngleEntries.length === 0 && referenceImages.length === 0) {
      setError('请先上传产品角度图。')
      return
    }
    if (isMergeImageSkill && mergeImageEntries.length < 3) {
      setError('请分别上传产品鞋图、背景图和角度参考图。')
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
      const allUploadFiles = [
        ...(!isMergeImageSkill ? referenceImages.map((image) => ({ image, name: image.name })) : []),
        ...mergeImageEntries.map(({ slot, file }) => ({
          image: file,
          name: `merge-${slot.id}-${file.name}`,
        })),
        ...multiAngleEntries.map(({ slot, file, index }) => ({
          image: file,
          name: `product-view-${slot.id}-${index + 1}-${file.name}`,
        })),
      ]
      const response = allUploadFiles.length
        ? await fetch('/api/run/analyze', {
            method: 'POST',
            body: (() => {
              const formData = new FormData()
              formData.append('skillId', skill.id)
              formData.append('brief', effectiveBrief.trim())
              allUploadFiles.forEach(({ image, name }) => formData.append('images', image, name))
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
      if (!response.ok) throw new Error(data.error || '分析失败。')

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
      setError(submitError instanceof Error ? submitError.message : '分析失败。')
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
      if (!response.ok) throw new Error(data.error || '保存失败。')

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
      setError(saveError instanceof Error ? saveError.message : '保存失败。')
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
          label: selectedOption?.label || '其他',
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
    setOperationStatus('已暂停生成。')
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
    return brief.split('\n').some((line) => line.trimStart().startsWith(`${label}：`))
  }

  function toggleRequirementField(label: string) {
    const prefix = `${label}：`
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
      setError('请拖入图片文件。')
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
      setError('请上传图片文件。')
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

  function selectMergeImage(slotId: string, files: FileList | File[] | null) {
    if (!files) return
    const pickedFiles = Array.from(files)
    const images = pickedFiles.filter((file) => file.type.startsWith('image/'))
    if (pickedFiles.length > 0 && images.length === 0) {
      setError('请上传图片文件。')
      return
    }
    if (images.length === 0) return
    setError('')
    setMergeImageFiles((current) => ({
      ...current,
      [slotId]: slotId === 'angle'
        ? [...(current[slotId] || []), ...images].slice(0, mergeAngleBatchLimit)
        : [images[0]],
    }))
    if (slotId === 'angle') setSelectedMergeAngleIds([])
  }

  function handleMergeImageDragOver(event: DragEvent<HTMLElement>, slotId: string) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDraggingMergeImageSlot(slotId)
  }

  function handleMergeImageDragLeave(event: DragEvent<HTMLElement>, slotId: string) {
    if (draggingMergeImageSlot === slotId && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setDraggingMergeImageSlot('')
    }
  }

  function handleMergeImageDrop(event: DragEvent<HTMLElement>, slotId: string) {
    event.preventDefault()
    setDraggingMergeImageSlot('')
    selectMergeImage(slotId, event.dataTransfer.files)
  }

  function removeMergeImage(slotId: string, indexToRemove = 0) {
    setMergeImageFiles((current) => ({
      ...current,
      [slotId]: (current[slotId] || []).filter((_, index) => index !== indexToRemove),
    }))
  }

  function buildMergeImageBrief(baseBrief: string) {
    if (!isMergeImageSkill) return baseBrief
    const uploadedRoles = mergeImageSlots
      .map((slot) => `${slot.label}: ${(mergeImageFiles[slot.id] || []).length ? 'uploaded' : 'not uploaded'}`)
      .join('\n')
    const optionBrief = [
      'AI Product Background Fusion configuration:',
      uploadedRoles,
      'Product image only controls the shoe identity and all shoe details.',
      'Background image only controls the room, wall, floor, baseboard, lighting, and shadows.',
      'Angle reference / angle-library image is a semantic region mask: yellow=shoes, blue=body limbs identified by silhouette as legs/ankles/feet or arms/hands/wrists, red=clothing, black=background. It controls pose, composition, occlusion, and camera angle.',
      'Model reference only controls actual outfit category/color/fabric, clothing drape, body limbs, skin tone, lower-body proportions, and elegant styling as secondary support for the product shoes. Never copy the model reference shoes, background, wall, floor, props, watermark, or lighting pattern.',
      'Generate one final realistic lower-body-only composite, not a triptych or explanation. Do not generate the model face, head, portrait, or full upper body. Replace every semantic mask region with realistic content from the assigned reference.',
    ].join('\n')
    return [baseBrief.trim(), optionBrief].filter(Boolean).join('\n\n')
  }

  function buildMergeImageUserDemand(baseBrief: string) {
    const trimmed = baseBrief.trim()
    if (!trimmed) return ''
    const looksLikeCopiedRuleBlock = /STRICT MULTI-REFERENCE|semantic region mask|yellow\s*=|blue\s*=|red\s*=|black\s*=|请严格按照以下多图参考逻辑|黄色区域|蓝色区域|红色区域|黑色区域/i.test(trimmed)
    if (looksLikeCopiedRuleBlock && trimmed.length > 800) return ''
    return trimmed.length > 500 ? trimmed.slice(0, 500) : trimmed
  }

  async function fileFromAsset(url: string, fileName: string) {
    const response = await fetch(url)
    if (!response.ok) throw new Error('读取角度库图片失败。')
    const blob = await response.blob()
    return new File([blob], fileName, { type: blob.type || 'image/png' })
  }

  async function describeAngleColorBlocks(file: File, sourceLabel = '?????') {
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return ''
      context.drawImage(bitmap, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height).data
      const masks = {
        yellow: new Uint8Array(width * height),
        blue: new Uint8Array(width * height),
        red: new Uint8Array(width * height),
        black: new Uint8Array(width * height),
      }
      for (let index = 0; index < width * height; index += 1) {
        const offset = index * 4
        const r = pixels[offset]
        const g = pixels[offset + 1]
        const b = pixels[offset + 2]
        const a = pixels[offset + 3]
        if (a < 24) continue
        if (r > 150 && g > 125 && b < 135 && r + g > b * 2 + 110) masks.yellow[index] = 1
        else if (b > 110 && r < 135 && g < 170 && b > r * 1.15 && b > g * 1.05) masks.blue[index] = 1
        else if (r > 135 && g < 130 && b < 130 && r > g * 1.2 && r > b * 1.2) masks.red[index] = 1
        else if (r < 48 && g < 48 && b < 48) masks.black[index] = 1
      }

      type AngleComponent = { minX: number; minY: number; maxX: number; maxY: number; count: number }
      const findComponents = (mask: Uint8Array, minRatio = 0.0015) => {
        const visited = new Uint8Array(mask.length)
        const components: AngleComponent[] = []
        const queue: number[] = []
        for (let startIndex = 0; startIndex < mask.length; startIndex += 1) {
          if (!mask[startIndex] || visited[startIndex]) continue
          let minX = width
          let minY = height
          let maxX = 0
          let maxY = 0
          let count = 0
          queue.length = 0
          queue.push(startIndex)
          visited[startIndex] = 1
          for (let head = 0; head < queue.length; head += 1) {
            const current = queue[head]
            const x = current % width
            const y = Math.floor(current / width)
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
            count += 1
            const neighbors = [current - 1, current + 1, current - width, current + width]
            for (const next of neighbors) {
              if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue
              const nx = next % width
              if ((next === current - 1 || next === current + 1) && Math.abs(nx - x) !== 1) continue
              visited[next] = 1
              queue.push(next)
            }
          }
          if (count > width * height * minRatio) components.push({ minX, minY, maxX, maxY, count })
        }
        return components.sort((a, b) => b.count - a.count).slice(0, 8)
      }

      const metrics = (component: AngleComponent) => {
        const left = Math.round((component.minX / width) * 100)
        const top = Math.round((component.minY / height) * 100)
        const boxWidth = Math.round(((component.maxX - component.minX + 1) / width) * 100)
        const boxHeight = Math.round(((component.maxY - component.minY + 1) / height) * 100)
        const centerX = Math.round((((component.minX + component.maxX) / 2) / width) * 100)
        const centerY = Math.round((((component.minY + component.maxY) / 2) / height) * 100)
        return { left, top, boxWidth, boxHeight, centerX, centerY }
      }
      const positionName = (centerX: number, centerY: number) => {
        const horizontal = centerX < 34 ? 'left' : centerX > 66 ? 'right' : 'center'
        const vertical = centerY < 34 ? 'upper' : centerY > 66 ? 'lower' : 'middle'
        return vertical + '-' + horizontal
      }

      const describeShoe = (component: AngleComponent, index: number) => {
        const box = metrics(component)
        const orientation = box.boxWidth >= box.boxHeight * 1.15 ? 'horizontal / side-view shoe silhouette' : box.boxHeight >= box.boxWidth * 1.15 ? 'vertical / front-back shoe silhouette' : 'three-quarter shoe silhouette'
        const placement = positionName(box.centerX, box.centerY)
        return 'shoe placement reference region ' + (index + 1) + ': ' + placement + ', bbox left ' + box.left + '%, top ' + box.top + '%, width ' + box.boxWidth + '%, height ' + box.boxHeight + '%, center (' + box.centerX + '%, ' + box.centerY + '%). Use this yellow region only as placement, angle, size, toe direction, heel direction, left-foot/right-foot side inference, body-facing direction inference, heel contact point, and perspective reference. Generate the actual shoe appearance from the uploaded product shoe image only. Interpret as ' + orientation + '.'
      }

      const describeBlueLimb = (component: AngleComponent, index: number) => {
        const box = metrics(component)
        const isLongVertical = box.boxHeight >= box.boxWidth * 1.35
        const isWideHorizontal = box.boxWidth >= box.boxHeight * 1.2
        const likelyPart = box.boxWidth <= 14 && box.boxHeight <= 14
          ? 'small joint segment, likely hand/wrist/ankle depending on nearby red clothing and yellow shoe'
          : isLongVertical
            ? 'long vertical limb, likely leg or arm depending on whether it connects to shoe or clothing'
            : isWideHorizontal
              ? 'horizontal/bent limb segment, likely arm/hand if near clothing or lower-leg/ankle if near shoe'
              : 'diagonal or bent limb segment, identify as leg or arm from surrounding regions'
        const axis = isLongVertical ? 'mostly vertical limb' : isWideHorizontal ? 'mostly horizontal/bent limb' : 'diagonal or bent limb'
        const placement = positionName(box.centerX, box.centerY)
        const action = box.top < 12 && box.centerY > 40 ? 'limb enters from upper frame and extends downward' : box.centerY < 40 ? 'raised or upper limb segment' : 'lower limb / wrist / ankle segment connected to nearby region'
        return 'blue limb region ' + (index + 1) + ': ' + placement + ', bbox left ' + box.left + '%, top ' + box.top + '%, width ' + box.boxWidth + '%, height ' + box.boxHeight + '%, center (' + box.centerX + '%, ' + box.centerY + '%). Generate the matching natural female body part here after reading the silhouette: leg/ankle/foot if it connects to yellow shoe, or arm/hand/wrist if it connects to red clothing or upper body. Shape reading: ' + likelyPart + '. Motion reading: ' + axis + ', ' + action + '; preserve this region shape, joint direction, pose, and occlusion.'
      }

      const describeClothing = (component: AngleComponent, index: number) => {
        const box = metrics(component)
        const placement = positionName(box.centerX, box.centerY)
        const areaReading = box.boxWidth > box.boxHeight ? 'wide clothing area / upper-body garment or lower garment span' : 'vertical clothing panel / garment side'
        return 'clothing support region ' + (index + 1) + ': ' + placement + ', bbox left ' + box.left + '%, top ' + box.top + '%, width ' + box.boxWidth + '%, height ' + box.boxHeight + '%, center (' + box.centerX + '%, ' + box.centerY + '%). Fill with the actual clothing category from the model reference, interpreted as ' + areaReading + '. Preserve model-reference clothing color, fabric, silhouette, waistband/hem details, and styling, but keep clothing secondary to the product shoes; do not invent a skirt/dress if the model reference wears pants, jeans, shorts, or a top. Keep clothing position aligned to this red area.'
      }

      const yellow = findComponents(masks.yellow)
      const blue = findComponents(masks.blue)
      const red = findComponents(masks.red)
      const black = findComponents(masks.black, 0.01).slice(0, 3)
      const mainShoe = yellow[0] ? metrics(yellow[0]) : null
      const mainLimb = blue[0] ? metrics(blue[0]) : null
      const cameraNotes = [
        mainShoe && mainShoe.centerY > 58 ? 'camera frames shoes in the lower half with feet as foreground priority' : 'camera keeps shoes around mid-frame',
        mainLimb && mainLimb.top < 10 ? 'blue limbs enter from upper edge, implying cropped fashion/product photo framing' : 'blue limbs are partially visible and cropped by the composition',
        yellow.length >= 2 ? 'detected ' + yellow.length + ' yellow connected components, but connected-component count may be larger than the real shoe count when straps, buckles, openings, stitching, lace gaps, inner shadows, or separated detail pieces split one shoe into fragments. Read the uploaded angle image visually and merge nearby yellow fragments that belong to the same shoe object. Use the final main shoe objects only for shoe count, placement, angle, size, orientation, toe direction, heel contact, scale, and perspective. Generate shoe appearance only from the uploaded product shoe image. Only yellow main shoe objects connected to blue leg/ankle/foot regions are worn shoes; yellow main shoe objects not connected to blue limbs are ground, display, foreground, or handheld shoes and must not create extra legs or feet' : 'single main shoe placement reference region dominates the composition',
        red.length ? 'model outfit must occupy the red clothing support region and align with the body-limb origin; use the actual clothing type from the model reference but keep it secondary to the product shoes' : 'no large clothing block detected; keep clothing minimal or cropped out unless model reference requires it',
      ].filter(Boolean)

      const blackText = black.length ? black.map((component, index) => { const box = metrics(component); return 'background region ' + (index + 1) + ': ' + positionName(box.centerX, box.centerY) + ', bbox left ' + box.left + '%, top ' + box.top + '%, width ' + box.boxWidth + '%, height ' + box.boxHeight + '%' }).join(' | ') + '. Fill all black/empty areas with the uploaded background image environment.' : 'Black background region: fill all non-colored empty areas with uploaded background image environment.'
      const resultLines = [
        'Uploaded-angle semantic analysis for ' + sourceLabel + ': this image is a semantic pose/composition template, not a style/color/material reference. If this is a color-block image, use the color mapping below; if it is a real photo, sketch, or mixed reference, infer equivalent shoe/body/clothing/background roles from the visible layout.',
        'Color meaning for masks: yellow=shoe angle/placement reference only, blue=body limb region that must be identified by silhouette as leg/ankle/foot or arm/hand/wrist, red=secondary model outfit/clothing support area, black=background from uploaded background image. No visible yellow/blue/red/black color blocks or tinted mask remnants may appear in the final image.',
        'Universal object-count rule: count real main shoe objects from the overall visual intent, not from disconnected color fragments. Shoe straps, buckles, openings, toe gaps, heel gaps, lace gaps, stitching, internal black holes, inner shadows, and thin dividing lines belong to the nearest main shoe and must not become extra shoes. Internal black marks inside a shoe are shoe openings/details, not background.',
        yellow.length ? 'Yellow shoe placement reference components detected: ' + yellow.map(describeShoe).join(' | ') + ' Merge nearby components into the same main shoe when they are straps, openings, buckles, or detail fragments of one shoe.' : 'Yellow shoe placement reference regions: none detected; do not invent extra shoes beyond visible uploaded-angle intent.',
        blue.length ? 'Blue body-limb regions: ' + blue.map(describeBlueLimb).join(' | ') : 'Blue body-limb regions: none detected; do not invent extra limbs unless required by shoe-on-foot context.',
        red.length ? 'Red clothing regions: ' + red.map(describeClothing).join(' | ') : 'Red clothing regions: none detected; if model is uploaded, use only cropped/minimal outfit consistent with the mask.',
        'Black background regions: ' + blackText,
        'Pose and camera interpretation: ' + cameraNotes.join('; ') + '. Use these notes to decide generated angle, body pose, shoe placement, and lens framing.',
        'Hard rule: final output must not show any pure yellow, blue, red, or black mask colors, flat color-block silhouettes, or tinted mask remnants; replace each semantic region with realistic content from its assigned reference.',
      ]
      return resultLines.join('\n')
    } catch {
      return ''
    }
  }

  async function buildCleanedAngleControl(file: File) {
    try {
      const bitmap = await createImageBitmap(file)
      const width = bitmap.width
      const height = bitmap.height
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return null
      context.drawImage(bitmap, 0, 0, width, height)
      const pixels = context.getImageData(0, 0, width, height).data
      const masks = {
        yellow: new Uint8Array(width * height),
        blue: new Uint8Array(width * height),
        red: new Uint8Array(width * height),
        black: new Uint8Array(width * height),
      }
      for (let index = 0; index < width * height; index += 1) {
        const offset = index * 4
        const r = pixels[offset]
        const g = pixels[offset + 1]
        const b = pixels[offset + 2]
        const a = pixels[offset + 3]
        if (a < 24) continue
        if (r > 150 && g > 125 && b < 135 && r + g > b * 2 + 110) masks.yellow[index] = 1
        else if (b > 110 && r < 135 && g < 170 && b > r * 1.15 && b > g * 1.05) masks.blue[index] = 1
        else if (r > 135 && g < 130 && b < 130 && r > g * 1.2 && r > b * 1.2) masks.red[index] = 1
        else if (r < 55 && g < 55 && b < 55) masks.black[index] = 1
      }

      type AngleComponent = { minX: number; minY: number; maxX: number; maxY: number; count: number }
      const findComponents = (mask: Uint8Array, minRatio = 0.0015) => {
        const visited = new Uint8Array(mask.length)
        const components: AngleComponent[] = []
        const queue: number[] = []
        for (let startIndex = 0; startIndex < mask.length; startIndex += 1) {
          if (!mask[startIndex] || visited[startIndex]) continue
          let minX = width
          let minY = height
          let maxX = 0
          let maxY = 0
          let count = 0
          queue.length = 0
          queue.push(startIndex)
          visited[startIndex] = 1
          for (let head = 0; head < queue.length; head += 1) {
            const current = queue[head]
            const x = current % width
            const y = Math.floor(current / width)
            minX = Math.min(minX, x)
            minY = Math.min(minY, y)
            maxX = Math.max(maxX, x)
            maxY = Math.max(maxY, y)
            count += 1
            const neighbors = [current - 1, current + 1, current - width, current + width]
            for (const next of neighbors) {
              if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue
              const nx = next % width
              if ((next === current - 1 || next === current + 1) && Math.abs(nx - x) !== 1) continue
              visited[next] = 1
              queue.push(next)
            }
          }
          if (count > width * height * minRatio) components.push({ minX, minY, maxX, maxY, count })
        }
        return components.sort((a, b) => b.count - a.count)
      }

      const expandBox = (component: AngleComponent, ratio = 0.08): AngleComponent => {
        const boxWidth = component.maxX - component.minX + 1
        const boxHeight = component.maxY - component.minY + 1
        const growX = Math.round(boxWidth * ratio)
        const growY = Math.round(boxHeight * ratio)
        return {
          minX: Math.max(0, component.minX - growX),
          minY: Math.max(0, component.minY - growY),
          maxX: Math.min(width - 1, component.maxX + growX),
          maxY: Math.min(height - 1, component.maxY + growY),
          count: component.count,
        }
      }
      const boxesOverlap = (a: AngleComponent, b: AngleComponent) => {
        return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY)
      }
      const unionBox = (a: AngleComponent, b: AngleComponent): AngleComponent => ({
        minX: Math.min(a.minX, b.minX),
        minY: Math.min(a.minY, b.minY),
        maxX: Math.max(a.maxX, b.maxX),
        maxY: Math.max(a.maxY, b.maxY),
        count: a.count + b.count,
      })
      const mergeNearby = (components: AngleComponent[]) => {
        const merged: AngleComponent[] = []
        for (const component of components) {
          let current = component
          let didMerge = true
          while (didMerge) {
            didMerge = false
            for (let index = 0; index < merged.length; index += 1) {
              if (boxesOverlap(expandBox(current, 0.18), expandBox(merged[index], 0.18))) {
                current = unionBox(current, merged[index])
                merged.splice(index, 1)
                didMerge = true
                break
              }
            }
          }
          merged.push(current)
        }
        return merged.sort((a, b) => b.count - a.count)
      }
      const mergeShoeFragments = (components: AngleComponent[]) => {
        const main = components.filter((component) => {
          const boxWidth = component.maxX - component.minX + 1
          const boxHeight = component.maxY - component.minY + 1
          return component.count > width * height * 0.006 || (boxWidth > width * 0.12 && boxHeight > height * 0.10)
        })
        const fallback = components.filter((component) => {
          const boxWidth = component.maxX - component.minX + 1
          const boxHeight = component.maxY - component.minY + 1
          return component.count > width * height * 0.0025 && boxWidth > width * 0.06 && boxHeight > height * 0.06
        })
        const seed = (main.length ? main : fallback).slice(0, 4)
        return seed.sort((a, b) => {
          const ay = (a.minY + a.maxY) / 2
          const by = (b.minY + b.maxY) / 2
          if (Math.abs(ay - by) > height * 0.08) return ay - by
          return a.minX - b.minX
        })
      }
      const metrics = (component: AngleComponent) => {
        const left = Math.round((component.minX / width) * 100)
        const top = Math.round((component.minY / height) * 100)
        const boxWidth = Math.round(((component.maxX - component.minX + 1) / width) * 100)
        const boxHeight = Math.round(((component.maxY - component.minY + 1) / height) * 100)
        const centerX = Math.round((((component.minX + component.maxX) / 2) / width) * 100)
        const centerY = Math.round((((component.minY + component.maxY) / 2) / height) * 100)
        return { left, top, boxWidth, boxHeight, centerX, centerY }
      }
      const touchesAny = (component: AngleComponent, others: AngleComponent[], ratio = 0.1) => {
        const expanded = expandBox(component, ratio)
        return others.some((other) => boxesOverlap(expanded, expandBox(other, ratio)))
      }
      const drawCoordinateGrid = (ctx: CanvasRenderingContext2D) => {
        ctx.save()
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.lineWidth = Math.max(1, Math.round(Math.max(width, height) * 0.002))
        ctx.font = `bold ${Math.max(12, Math.round(width * 0.022))}px Arial`
        ;[0, 25, 50, 75, 100].forEach((value) => {
          const x = Math.round((value / 100) * width)
          const y = Math.round((value / 100) * height)
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
          ctx.stroke()
          ctx.fillText(`X${value}`, Math.min(width - 42, x + 4), 4)
          ctx.fillText(`Y${value}`, 4, Math.min(height - 20, y + 4))
        })
        ctx.restore()
      }
      const inferCameraView = (shoes: AngleComponent[], limbs: AngleComponent[], clothes: AngleComponent[]) => {
        const shoeBoxes = shoes.map(metrics)
        const limbBoxes = limbs.map(metrics)
        const clothingBoxes = clothes.map(metrics)
        const weightedCenter = (boxes: ReturnType<typeof metrics>[]) => {
          const weighted = boxes.reduce((acc, box) => {
            const weight = Math.max(1, box.boxWidth * box.boxHeight)
            return {
              x: acc.x + box.centerX * weight,
              y: acc.y + box.centerY * weight,
              weight: acc.weight + weight,
            }
          }, { x: 0, y: 0, weight: 0 })
          return weighted.weight ? { x: Math.round(weighted.x / weighted.weight), y: Math.round(weighted.y / weighted.weight) } : null
        }
        const bodyBoxes = [...limbBoxes, ...clothingBoxes]
        const bodyOrigin = weightedCenter(bodyBoxes.length ? bodyBoxes : limbBoxes)
        const shoeTarget = weightedCenter(shoeBoxes)
        const edgeLabel = (point: { x: number; y: number } | null) => {
          if (!point) return 'unknown'
          const horizontal = point.x < 34 ? 'left' : point.x > 66 ? 'right' : 'center'
          const vertical = point.y < 34 ? 'upper' : point.y > 66 ? 'lower' : 'middle'
          return `${vertical}-${horizontal}`
        }
        const directionFromDelta = (dx: number, dy: number) => {
          const horizontal = dx < -8 ? 'left' : dx > 8 ? 'right' : ''
          const vertical = dy < -8 ? 'upper' : dy > 8 ? 'lower' : ''
          if (vertical && horizontal) return `${vertical}-${horizontal}`
          return vertical || horizontal || 'center'
        }
        const dx = bodyOrigin && shoeTarget ? shoeTarget.x - bodyOrigin.x : 0
        const dy = bodyOrigin && shoeTarget ? shoeTarget.y - bodyOrigin.y : 0
        const extensionDirection = directionFromDelta(dx, dy)
        const bodyOriginLabel = edgeLabel(bodyOrigin)
        const shoeTargetLabel = edgeLabel(shoeTarget)
        const vectorLength = Math.round(Math.sqrt(dx * dx + dy * dy))
        const largeShoePresence = shoeBoxes.some((box) => box.boxWidth >= 18 || box.boxHeight >= 18)
        const bodyAtFrameEdge = bodyBoxes.some((box) => box.left < 8 || box.top < 8 || box.left + box.boxWidth > 92 || box.top + box.boxHeight > 92)
        const diagonalPose = Math.abs(dx) >= 10 && Math.abs(dy) >= 8
        const verticalStanding = Math.abs(dx) < 14 && dy > 12
        const cameraLabel = largeShoePresence && (diagonalPose || bodyAtFrameEdge)
          ? 'downward oblique / high-angle coordinate view'
          : verticalStanding
            ? 'standing lower-body front or three-quarter coordinate view'
            : 'coordinate-preserved angle-reference view'
        const instruction = [
          `Coordinate inference by code: body origin is ${bodyOriginLabel}${bodyOrigin ? ` at (${bodyOrigin.x}%, ${bodyOrigin.y}%)` : ''}; shoe target is ${shoeTargetLabel}${shoeTarget ? ` at (${shoeTarget.x}%, ${shoeTarget.y}%)` : ''}; extension vector from body to shoes is dx=${dx}, dy=${dy}, direction=${extensionDirection}, length=${vectorLength}.`,
          `Camera inference by code: ${cameraLabel}. Preserve this computed body-origin-to-shoe-target direction and camera relationship from the uploaded angle reference.`,
          `Generated body/clothing must stay near the computed body origin (${bodyOriginLabel}); generated legs/shoes must extend toward ${extensionDirection}; do not recenter, flip, rotate, straighten into a generic vertical standing pose, or replace with an eye-level view unless the computed direction is vertical standing.`,
        ].join(' ')
        return {
          label: `${cameraLabel}; body ${bodyOriginLabel} to shoes ${shoeTargetLabel}; direction ${extensionDirection}`,
          instruction,
        }
      }
      const drawMaskOutline = (ctx: CanvasRenderingContext2D, mask: Uint8Array, components: AngleComponent[], strokeStyle: string, lineWidthRatio = 0.004) => {
        const imageData = ctx.createImageData(width, height)
        const data = imageData.data
        for (const component of components) {
          for (let y = component.minY; y <= component.maxY; y += 1) {
            for (let x = component.minX; x <= component.maxX; x += 1) {
              const index = y * width + x
              if (!mask[index]) continue
              const offset = index * 4
              data[offset] = 255
              data[offset + 1] = 255
              data[offset + 2] = 255
              data[offset + 3] = 230
            }
          }
        }
        const tmp = document.createElement('canvas')
        tmp.width = width
        tmp.height = height
        const tmpCtx = tmp.getContext('2d')
        if (!tmpCtx) return
        tmpCtx.putImageData(imageData, 0, 0)
        ctx.save()
        ctx.globalAlpha = 0.24
        ctx.drawImage(tmp, 0, 0)
        ctx.globalAlpha = 1
        ctx.strokeStyle = strokeStyle
        ctx.lineWidth = Math.max(2, Math.round(Math.max(width, height) * lineWidthRatio))
        ctx.setLineDash([])
        for (const component of components) {
          const box = expandBox(component, 0.018)
          ctx.strokeRect(box.minX, box.minY, box.maxX - box.minX + 1, box.maxY - box.minY + 1)
        }
        ctx.restore()
      }

      const yellowComponents = mergeShoeFragments(findComponents(masks.yellow, 0.0012)).slice(0, 6)
      const blueComponents = mergeNearby(findComponents(masks.blue, 0.0015)).slice(0, 6)
      const redComponents = mergeNearby(findComponents(masks.red, 0.002)).slice(0, 4)
      const cameraInference = inferCameraView(yellowComponents, blueComponents, redComponents)
      const controlCanvas = document.createElement('canvas')
      controlCanvas.width = width
      controlCanvas.height = height
      const control = controlCanvas.getContext('2d')
      if (!control) return null
      control.fillStyle = '#050505'
      control.fillRect(0, 0, width, height)
      drawCoordinateGrid(control)
      drawMaskOutline(control, masks.red, redComponents, '#b8b8b8', 0.003)
      drawMaskOutline(control, masks.blue, blueComponents, '#d8d8d8', 0.004)
      drawMaskOutline(control, masks.yellow, yellowComponents, '#ffffff', 0.005)
      control.fillStyle = '#ffffff'
      control.font = `bold ${Math.max(18, Math.round(width * 0.035))}px Arial`
      control.textBaseline = 'top'
      yellowComponents.forEach((component, index) => {
        control.fillText(`S${index + 1}`, component.minX + 8, component.minY + 8)
      })
      const blob = await canvasToBlob(controlCanvas, 'image/png')
      if (!blob) return null
      const fileName = file.name.replace(/\.[^.]+$/, '') || 'uploaded-angle'
      const controlFile = new File([blob], `${fileName}-clean-control.png`, { type: 'image/png' })
      const shoeLines = yellowComponents.map((component, index) => {
        const box = metrics(component)
        const orientation = box.boxWidth >= box.boxHeight * 1.15 ? 'mostly horizontal / side-view' : box.boxHeight >= box.boxWidth * 1.15 ? 'mostly vertical / front-back' : 'diagonal or three-quarter'
        const connectedToLimb = touchesAny(component, blueComponents, 0.08)
        const status = connectedToLimb ? 'WORN SHOE connected to a blue foot/ankle/leg region' : 'DISPLAY SHOE with no foot or leg inside it'
        return `S${index + 1}: ${status}; bbox left ${box.left}%, top ${box.top}%, width ${box.boxWidth}%, height ${box.boxHeight}%, center (${box.centerX}%, ${box.centerY}%), orientation ${orientation}. If DISPLAY SHOE, generate only the product shoe at this coordinate and do not add a foot, ankle, leg, or body limb to wear it.`
      })
      const limbLines = blueComponents.map((component, index) => {
        const box = metrics(component)
        return `B${index + 1}: body limb region, bbox left ${box.left}%, top ${box.top}%, width ${box.boxWidth}%, height ${box.boxHeight}%, center (${box.centerX}%, ${box.centerY}%).`
      })
      const clothingLines = redComponents.map((component, index) => {
        const box = metrics(component)
        return `R${index + 1}: clothing region, bbox left ${box.left}%, top ${box.top}%, width ${box.boxWidth}%, height ${box.boxHeight}%, center (${box.centerX}%, ${box.centerY}%).`
      })
      const layout = [
        'CLEANED ANGLE CONTROL HARD CONSTRAINT:',
        'The cleaned control image is a black/gray/white coordinate guide only. It is not a visual style reference. Do not render any control colors, mask colors, labels, grid lines, boxes, outlines, or flat guide marks in the final image.',
        'Coordinate system: use the uploaded/cleaned angle image as a 2D canvas. X axis goes left-to-right from X0 to X100. Y axis goes top-to-bottom from Y0 to Y100. Keep every shoe, limb, clothing area, and background boundary at the same relative X/Y coordinates and scale.',
        `Camera inference by code: ${cameraInference.label}. ${cameraInference.instruction}`,
        `The cleaned control image is generated from the uploaded angle reference and must be used as the strongest layout control. Main shoe count is exactly ${yellowComponents.length}. Do not create more or fewer main shoes.`,
        'Use yellow S regions as main product shoe objects. Internal holes, straps, buckles, openings, shadows, and thin lines from the original angle reference have been merged into their nearest main shoe object and must not become extra shoes.',
        'Worn/display rule: only yellow S regions touching a blue body-limb region are worn shoes. Any yellow S region not touching blue is a standalone display shoe and must not have a foot, ankle, leg, or body limb generated inside or attached to it.',
        shoeLines.join('\n'),
        limbLines.length ? 'Blue body-limb regions:\n' + limbLines.join('\n') : 'No major blue body-limb region detected; do not invent extra limbs unless required by a yellow worn-shoe object.',
        clothingLines.length ? 'Red clothing regions:\n' + clothingLines.join('\n') : 'No major red clothing region detected; keep clothing minimal or cropped out.',
        'Black/empty areas in the cleaned control are background/environment areas from the uploaded background reference.',
        'Final image must not show labels S1/S2, mask colors, boxes, outlines, or flat color-block artifacts.',
      ].filter(Boolean).join('\n')
      return { file: controlFile, layout }
    } catch {
      return null
    }
  }

  function clampMergeDimension(value: string, fallback: number) {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isFinite(parsed)) return fallback
    return Math.min(4096, Math.max(256, parsed))
  }

  function getImageNaturalSize(file: File) {
    return new Promise<{ width: number; height: number }>((resolve) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        const width = image.naturalWidth || 1024
        const height = image.naturalHeight || 1024
        URL.revokeObjectURL(url)
        resolve({ width, height })
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ width: 1024, height: 1024 })
      }
      image.src = url
    })
  }

  function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, quality)
    })
  }

  async function compressMergeReferenceFile(file: File, role: MergeImageSlot['id']) {
    const profile = {
      product: { maxSide: 1600, quality: 0.88, type: 'image/jpeg' },
      background: { maxSide: 1400, quality: 0.84, type: 'image/jpeg' },
      model: { maxSide: 1400, quality: 0.84, type: 'image/jpeg' },
      angle: { maxSide: 768, quality: 0.92, type: 'image/png' },
    }[role]
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, profile.maxSide / Math.max(bitmap.width, bitmap.height))
      const width = Math.max(1, Math.round(bitmap.width * scale))
      const height = Math.max(1, Math.round(bitmap.height * scale))
      if (scale === 1 && file.size <= 900 * 1024 && role !== 'angle') return file
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) return file
      if (profile.type === 'image/jpeg') {
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
      }
      context.drawImage(bitmap, 0, 0, width, height)
      bitmap.close?.()
      const blob = await canvasToBlob(canvas, profile.type, profile.quality)
      if (!blob || blob.size <= 0) return file
      if (blob.size >= file.size && scale === 1) return file
      const extension = profile.type === 'image/png' ? '.png' : '.jpg'
      const baseName = file.name.replace(/\.[^.]+$/, '') || role
      return new File([blob], `${baseName}-compressed${extension}`, { type: blob.type || profile.type })
    } catch {
      return file
    }
  }

  function snapMergeDimension(value: number) {
    return Math.max(256, Math.min(4096, Math.round(value / 8) * 8))
  }

  function scaleMergeSizeToResolution(width: number, height: number, resolution: MergeImageResolution) {
    const ratio = width > 0 && height > 0 ? width / height : 1
    const longSide = mergeImageResolutionOptions.find((item) => item.value === resolution)?.longSide || 1024
    const outputWidth = ratio >= 1 ? longSide : longSide * ratio
    const outputHeight = ratio >= 1 ? longSide / ratio : longSide
    return `${snapMergeDimension(outputWidth)}x${snapMergeDimension(outputHeight)}`
  }

  function normalizeMergeAutoSize(width: number, height: number) {
    return scaleMergeSizeToResolution(width, height, mergeImageResolution)
  }

  async function resolveMergeOutputSize(backgroundFile: File) {
    if (mergeImageSize === 'custom') {
      const width = clampMergeDimension(mergeCustomWidth, 1536)
      const height = clampMergeDimension(mergeCustomHeight, 1152)
      return scaleMergeSizeToResolution(width, height, mergeImageResolution)
    }
    if (mergeImageSize === 'auto') {
      const naturalSize = await getImageNaturalSize(backgroundFile)
      return normalizeMergeAutoSize(naturalSize.width, naturalSize.height)
    }
    const match = mergeImageSize.match(/(\d+)\s*[x×]\s*(\d+)/i)
    if (match) {
      return scaleMergeSizeToResolution(Number(match[1]), Number(match[2]), mergeImageResolution)
    }
    return scaleMergeSizeToResolution(1024, 1365, mergeImageResolution)
  }
  async function oneClickMergeImage() {
    if (!skill) return
    const productFile = (mergeImageFiles.product || [])[0]
    const backgroundFile = (mergeImageFiles.background || [])[0]
    const uploadedAngleFiles = (mergeImageFiles.angle || []).slice(0, mergeAngleBatchLimit)
    const modelFile = (mergeImageFiles.model || [])[0]
    const selectedLibraryAngles = selectedMergeAngleIds
      .map((id) => mergeAngleLibrary.find((item) => item.id === id))
      .filter((item): item is (typeof mergeAngleLibrary)[number] => Boolean(item))
      .slice(0, mergeAngleBatchLimit)
    if (!productFile || !backgroundFile || (uploadedAngleFiles.length === 0 && selectedLibraryAngles.length === 0)) {
      setError('请上传产品鞋图、背景图，并上传或选择一个角度参考图。')
      return
    }
    if (uploadedAngleFiles.length === 0 && selectedMergeAngleIds.length > mergeAngleBatchLimit) {
      setError(`一次最多选择 ${mergeAngleBatchLimit} 个角度生成。`)
      return
    }
    const outputSize = await resolveMergeOutputSize(backgroundFile)
    const userDemand = buildMergeImageUserDemand(brief)
    const effectiveBrief = buildMergeImageBrief(userDemand || 'Generate one final realistic product shoe-on-foot composite.')
    const controller = startWorkflowRequest()
    setLoading(true)
    setGenerating(true)
    setError('')
    setOperationStatus(isMergeImageSkill ? '' : '正在调用后台 GPT 生图 API，一键生成融合图...')
    setAnalysis(null)
    setDirectionResult(null)
    setImageResult(null)
    setImageResults([])
    setUploadedFiles([])
    const generationAngles = uploadedAngleFiles.length > 0
      ? uploadedAngleFiles.map((file, index) => ({ id: `uploaded-angle-${index + 1}`, label: uploadedAngleFiles.length > 1 ? `上传角度参考图 ${index + 1}` : '上传角度参考图', url: '', uploadedFile: file }))
      : selectedLibraryAngles.map((item) => ({ ...item, uploadedFile: null as File | null }))
    setPendingPreviewCards(generationAngles.map((item) => ({ id: item.id, title: `${item.label} 生图中` })))
    try {
      const sharedFiles = [
        { image: await compressMergeReferenceFile(productFile, 'product'), name: `merge-product-${productFile.name}` },
        { image: await compressMergeReferenceFile(backgroundFile, 'background'), name: `merge-background-${backgroundFile.name}` },
        ...(modelFile ? [{ image: await compressMergeReferenceFile(modelFile, 'model'), name: `merge-model-${modelFile.name}` }] : []),
      ]
      const generatedImages: GeneratedImage[] = []
      let lastGenerated: ImageResult | null = null
      for (const angleItem of generationAngles) {
        const angleFile = angleItem.uploadedFile || await fileFromAsset(angleItem.url, `${angleItem.id}.png`)
        const cleanedAngleControl = angleItem.uploadedFile ? await buildCleanedAngleControl(angleFile) : null
        const angleLayoutBrief = angleItem.uploadedFile
          ? [cleanedAngleControl?.layout, await describeAngleColorBlocks(angleFile, 'uploaded angle reference')].filter(Boolean).join('\n\n')
          : await describeAngleColorBlocks(angleFile, `${angleItem.label} / ${angleItem.id}`)
        const uploadedAngleSmartAnalysis = ''
        const uploadedAnglePrompt = angleItem.uploadedFile
          ? buildUploadedAngleGenerationPrompt(uploadedAngleSmartAnalysis)
          : ''
        const prompt = [
          mergeImageStrictReferenceLogic,
          angleItem.uploadedFile ? uploadedAnglePrompt : `Selected angle-library template: ${angleItem.label} (${angleItem.id}.png). This merge-angle image is the only pose/composition/semantic-mask template for this generation.`,
          angleItem.uploadedFile ? '' : mergeAnglePosePrompts[angleItem.id],
          modelFile ? 'A model reference image is uploaded. Use the model reference only for actual outfit category/color/fabric, clothing material, body-limb appearance, skin tone where visible, lower-body proportion, and elegant styling as secondary support for the product shoes. Put this outfit into red regions and the matching natural body parts into blue regions after identifying each blue silhouette as leg/ankle/foot or arm/hand/wrist, but do not let clothing become the main subject. Do not copy model shoes, model background, wall, floor, props, basket, flowers, watermark, or lighting pattern.' : 'No model reference image is uploaded. Generate simple natural body limbs/clothing only as required by the angle mask.',
          'Lower-body-only framing: never generate the model face, head, portrait, or full upper body. Keep the crop focused on shoes, feet, legs, hands if present in the angle mask, and only the clothing portion required around the lower body.',
          'The angle mask must dominate pose and shoe layout: shoe count, shoe placement, shoe direction, toe direction, heel direction, shoe angle, inferred body-facing direction, foot/leg/hand/arm pose, camera angle, scale relationship, and occlusion must follow the selected angle mask rather than the product photo or model photo. Once the body-facing direction is inferred from the angle reference, keep that direction fixed and do not generate a different facing direction. If the angle reference shows shoes facing left, right, toward camera, or away from camera, the generated shoes and body must keep exactly that same direction.',
          'The product shoe image must dominate shoe identity: redraw the exact uploaded product shoe according to the yellow placement/angle reference regions. Yellow only controls shoe placement, angle, size, toe direction, heel position, perspective, and whether it is worn or displayed; yellow and the angle-library image never control shoe exterior appearance, silhouette, color, material, shape, style, sole, heel, toe, straps, buckles, laces, or details. The final shoe must match the uploaded product shoe image 100%. Yellow regions connected to blue leg/ankle/foot regions are worn shoes; yellow regions not connected to blue limbs are ground or foreground display shoes only, and must not create extra legs or feet.',
          'The background image must dominate environment: use its wall, floor, baseboard, lighting direction, color temperature, and soft shadows. Do not use the model reference background.',
          userDemand ? 'Secondary user text demand, obey only when it does not conflict with the angle mask, model reference, product shoe lock, or background lock: ' + userDemand : '',
        ].filter(Boolean).join('\n')
        const generateForm = new FormData()
        generateForm.append('skillId', skill.id)
        generateForm.append('brief', effectiveBrief)
        generateForm.append('prompt', prompt)
        generateForm.append('size', outputSize)
        generateForm.append('angleSource', angleItem.uploadedFile ? 'User uploaded angle reference' : `${angleItem.label} / ${angleItem.id}`)
        generateForm.append('angleLayout', angleLayoutBrief)
        sharedFiles.forEach(({ image, name }) => generateForm.append('images', image, name))
        if (cleanedAngleControl?.file) {
          generateForm.append('images', cleanedAngleControl.file, `merge-angle-control-${cleanedAngleControl.file.name}`)
        }
        generateForm.append('images', await compressMergeReferenceFile(angleFile, 'angle'), `merge-angle-${angleFile.name}`)
        const generateResponse = await fetch('/api/run/merge-image-generate', {
          method: 'POST',
          body: generateForm,
          signal: controller.signal,
        })
        const generated = await readJsonResponse(generateResponse) as ImageResult & { uploadedFiles?: UploadedFile[]; error?: string }
        if (!generateResponse.ok) throw new Error(generated.error || `${angleItem.label} 生图失败。`)
        lastGenerated = generated
        generatedImages.push({
          id: crypto.randomUUID(),
          directionId: angleItem.id,
          imageUrl: generated.imageUrl,
          svgUrl: generated.svgUrl || '',
          title: angleItem.uploadedFile ? '上传角度参考图' : angleItem.label,
          size: outputSize,
        })
        setImageResults([...generatedImages])
        setPendingPreviewCards(generationAngles.slice(generatedImages.length).map((item) => ({ id: item.id, title: `${item.label} 生图中` })))
      }
      if (lastGenerated) setImageResult(lastGenerated)
      setPendingPreviewCards([])
      setPromptConfirmed(false)
      setOperationStatus('')
    } catch (mergeError) {
      if (isAbortError(mergeError)) {
        setError('')
        return
      }
      setError(mergeError instanceof Error ? mergeError.message : '一键生图失败。')
      setPendingPreviewCards([])
    } finally {
      setLoading(false)
      setGenerating(false)
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  function buildMultiAngleBrief(baseBrief: string) {
    if (!isMultiAngleSkill) return baseBrief
    const uploadedAngles = multiAngleSlots
      .filter((slot) => (multiAngleFiles[slot.id] || []).length > 0)
      .map((slot) => `${slot.label}: ${multiAngleFiles[slot.id].length} 张`)
      .join('\n')
    const modeText =
      multiAngleOutputMode === 'combined'
        ? '生成在同一张图片里，排版为多角度视图合集'
        : '分开生成，每个角度单独输出图片'
    const optionBrief = [
      '产品多角度视图专属配置：',
      `导出视图数量：${multiAngleViewCount} 个视图`,
      `输出方式：${modeText}`,
      '已上传角度：',
      uploadedAngles || '未按角度上传图片，但可能已通过通用参考图上传。',
      '一致性硬性要求：生成结果必须严格保持参考产品的同一 SKU 外观，不改变颜色、材质、比例、结构、Logo、标签、文字位置、纹理、接口、配件和包装信息。',
      '如果缺少某些角度，只能保守推断；隐藏结构不能确定时请在分析中标注风险。',
    ].join('\n')
    return [baseBrief.trim(), optionBrief].filter(Boolean).join('\n\n')
  }

  function selectMockupReferenceImages(files: FileList | File[] | null) {
    if (!files) return
    const pickedFiles = Array.from(files)
    const images = pickedFiles.filter((file) => file.type.startsWith('image/'))
    if (pickedFiles.length > 0 && images.length === 0) {
      setError('请上传图片作为样机参考图。')
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
    setLightboxConvertedSvgUrl('')
    setLightboxStatus('')
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
    setLightboxConvertedSvgUrl('')
    setLightboxStatus('')
    setLightboxImage(null)
    setLightboxItems([])
  }

  function updateLightboxSvgUrl(imageUrl: string, svgUrl: string) {
    setLightboxImage((current) => current?.imageUrl === imageUrl ? { ...current, svgUrl } : current)
    setLightboxItems((current) => current.map((item) => item.imageUrl === imageUrl ? { ...item, svgUrl } : item))
    setImageResults((current) => current.map((item) => item.imageUrl === imageUrl ? { ...item, svgUrl } : item))
    setProjects((current) =>
      current.map((project) => ({
        ...project,
        images: project.images.map((image) => image.imageUrl === imageUrl ? { ...image, svgUrl } : image),
      })),
    )
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
      setError('请至少选择一个输出方向。')
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
      if (!response.ok) throw new Error(data.error || '确认失败。')

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
              ? `已确认 ${checkedReferences.length} 个参考资料。请选择一个方向后继续确认提示词。`
              : '你没有选择参考资料。现在将仅基于技能说明和需求继续。',
        },
      ])
    } catch (confirmError) {
      if (isAbortError(confirmError)) {
        setError('')
        return
      }
      setError(confirmError instanceof Error ? confirmError.message : '确认失败。')
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
        content: '提示词已确认。现在可以调用 gpt-image-2 生图。',
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
          title: '文字调整',
          description: '直接按照底部输入的文字，对选中图片继续调整。',
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
          label: '样机要求',
          placeholder: '例如：放在奶茶杯、外卖袋和门店灯箱上，加入自然桌面、暖光、材质阴影和品牌色延展，Logo 清晰不变形。',
        },
      ]
    }
    if (isLogoSkill && optionId === 'custom-followup') {
      return [
        {
          id: 'requirements',
          label: '自定义样机场景',
          placeholder: '例如：生成宠物玩具品牌的包装盒、吊牌和店铺门头样机，风格温暖可爱。',
        },
      ]
    }
    const fields: Record<string, ExpansionField[]> = {
      'icon-set': [
        {
          id: 'subjects',
          label: '要生成哪些图标',
          placeholder: '例如：搜索、购物车、优惠券、客服、物流、会员。会按分隔符拆开，每个单独生成一张。',
        },
      ],
      'icon-single': [
        {
          id: 'target',
          label: '要精修哪里',
          placeholder: '例如：玻璃质感更通透、边缘高光更明显、主体更立体、减少背景装饰',
        },
        {
          id: 'strength',
          label: '精修强度',
          options: ['轻微调整', '明显优化', '大幅重塑'],
        },
      ],
      'icon-angles': [
        {
          id: 'angle',
          label: '统一成什么角度',
          options: ['等轴侧 45°', '正视角', '轻俯视', '左前方', '右前方'],
        },
        {
          id: 'layout',
          label: '呈现方式',
          options: ['单张主图', '多角度对比', '九宫格集合'],
        },
      ],
      'icon-materials': [
        {
          id: 'material',
          label: '改成什么材质',
          options: ['毛玻璃', '透明玻璃', '软糖凝胶', '金属铬', '陶瓷釉面', '液态金属'],
        },
        {
          id: 'color',
          label: '颜色系统',
          placeholder: '例如：蓝紫科技感、蓝黄高亮、银白透明、粉橙渐变',
        },
      ],
      'custom-followup': [
        {
          id: 'requirements',
          label: '调整要求',
          placeholder: '例如：把当前图标改成毛玻璃材质，保留蓝色科技感和等轴侧视角。',
        },
      ],
      'logo-symbol': [
        {
          id: 'requirements',
          label: '图形标要求',
          placeholder: '例如：只保留山水和云雾元素，不要文字，适合头像和 favicon。',
        },
      ],
      'logo-wordmark': [
        {
          id: 'requirements',
          label: '文字标要求',
          placeholder: '例如：中文更现代，英文更细长，整体高级简洁，字距更舒展。',
        },
      ],
      'logo-combination': [
        {
          id: 'layout',
          label: '组合方式',
          options: ['图左字右', '图上字下', '圆形徽章', '横版组合', '竖版组合'],
        },
        {
          id: 'requirements',
          label: '组合要求',
          placeholder: '例如：中文在上、英文在下，图形和文字可以拆开独立使用。',
        },
      ],
      'logo-colorways': [
        {
          id: 'colorway',
          label: '配色版本',
          options: ['黑白版', '主色版', '反白版', '金色高级版', '自然绿色版', '科技蓝版'],
        },
      ],
      'logo-usage': [
        {
          id: 'scene',
          label: '应用场景',
          options: ['门头招牌', '包装盒', '杯身/瓶身', '名片', '社媒头像', 'App 图标'],
        },
        {
          id: 'requirements',
          label: '预览要求',
          placeholder: '例如：放在茶叶包装和门店招牌上，保持 Logo 扁平清晰。',
        },
      ],
      'ip-three-view': [
        {
          id: 'viewType',
          label: '三视图类型',
          options: ['3D 三视图', '2D 平面三视图', '3D + 2D 都要'],
        },
        {
          id: 'consistency',
          label: '一致性要求',
          placeholder: '例如：严格保持当前主图的头身比、眼睛、核心视觉钩子和配色分区。',
        },
      ],
      'ip-expressions': [
        {
          id: 'style',
          label: '表情包风格',
          options: ['3D 哑光潮玩', '2D 粗黑描边', '3D + 2D 都要'],
        },
        {
          id: 'expressions',
          label: '表情清单',
          placeholder: '例如：傲娇、开心、俏皮、惊讶、愤怒、悲伤。留空则按默认 6 个表情。',
        },
      ],
      'ip-pose-sheet': [
        {
          id: 'style',
          label: '动作库风格',
          options: ['3D 哑光潮玩', '2D 粗黑描边', '3D + 2D 都要'],
        },
        {
          id: 'poses',
          label: '动作清单',
          placeholder: '例如：标准站姿、双手叉腰、蹲坐、挥手、奔跑、趴地。留空则按默认 6 个动作。',
        },
      ],
      'ip-merch': [
        {
          id: 'industryGroup',
          label: '周边行业分组',
          options: ['自动判断', '科技/互联网', '文创/教育', '潮玩/收藏', '餐饮/食品', '文旅/城市'],
        },
        {
          id: 'requirements',
          label: '周边要求',
          placeholder: '例如：六件套合图，笔记本居中，手机壳、咖啡纸杯、餐巾纸、毛绒钥匙扣和刺绣贴围绕展示。',
        },
      ],
      'ip-blind-box': [
        {
          id: 'theme',
          label: '盲盒主题',
          options: ['四季系列', '职业系列', '情绪系列', '节日系列', '自定义主题'],
        },
        {
          id: 'mode',
          label: '生图模式',
          options: ['产品陈列图', '场景故事海报墙', '两者都要'],
        },
        {
          id: 'requirements',
          label: '主题补充',
          placeholder: '例如：春日茶园、夏日冰饮、秋日桂花、冬日围炉、隐藏款山神茶灵。',
        },
      ],
      'ip-scenes': [
        {
          id: 'scene',
          label: '新场景主题',
          placeholder: '例如：门店新品发布、节日限定、城市打卡、包装互动、户外活动。',
        },
        {
          id: 'ratio',
          label: '画面比例',
          options: ['9:16 竖版海报', '16:9 横版海报', '1:1 社媒图'],
        },
      ],
      'ip-html-proposal': [
        {
          id: 'scope',
          label: '提案范围',
          options: ['完整品牌 IP 提案', '只整理当前已生成内容', '策略 + 应用拓展', '客户汇报简版'],
        },
        {
          id: 'requirements',
          label: '提案要求',
          placeholder: '例如：现代简洁，包含品牌背景、IP策略、方案展示、三视图、表情包、周边和方案对比。',
        },
      ],
      'set-add-selling-point': [
        {
          id: 'sellingPoint',
          label: '新增卖点',
          placeholder: '例如：防漏、快充、长续航、便携收纳。留空则按默认补充一张卖点页。',
        },
        {
          id: 'pageType',
          label: '画面页型',
          options: ['卖点页', '功能特写页', '使用场景页', '对比说明页', '配件清单页'],
        },
      ],
      'set-unify-style': [
        {
          id: 'style',
          label: '统一方向',
          placeholder: '例如：统一成自然干净的浅色棚拍，保留商品真实颜色，文字层级更清晰。',
        },
      ],
      'set-single-retouch': [
        {
          id: 'target',
          label: '优化重点',
          placeholder: '例如：商品主体更大、文字更清晰、减少背景装饰、加强材质细节。',
        },
      ],
      'set-resize': [
        {
          id: 'ratio',
          label: '目标比例',
          options: ['3:4', '4:3', '9:16', '16:9', '1:1', '1464×600'],
        },
        {
          id: 'requirements',
          label: '适配要求',
          placeholder: '例如：适配亚马逊 A+ 全宽图，保留主商品和核心卖点，不裁掉 logo。',
        },
      ],
    }
    return fields[optionId] || [
      {
        id: 'requirements',
        label: '补充扩展要求',
        placeholder: '说明你希望这次扩展具体改变什么、保留什么。',
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
      .split(/[、,，;；\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function buildExpansionTasks(baseImage: GeneratedImage, expansions: DeliveryOption[]) {
    return expansions.flatMap((expansion) => {
      const detailText =
        getExpansionDetailText(expansion.id) ||
        `按默认扩展方向执行：${expansion.title}。${expansion.description}`

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
          title: `${subject}图标`,
          description: expansion.description,
          expansion,
          detailText: [
            `单独生成图标: ${subject}`,
            '这是成套图标中的一个独立图标，不要把多个图标放在同一张图里。',
            `整套图标清单: ${subjects.join('、')}`,
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
    setOperationStatus('Skills Expert 正在根据你的补充要求重新思考失败图片。')
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
            message: '推理接口暂时失败，我会先按你的文字要求直接重试失败图片。',
            promptPatch: text,
          }
        }
      } catch {
        data = {
          message: '推理接口暂时失败，我会先按你的文字要求直接重试失败图片。',
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
          content: data.message || `我会按你的补充要求重试 ${failedDirections.length} 张失败图片。`,
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
        setError(`还有 ${failures.length} 张生成失败，可以继续在底部描述要求后重试。`)
      } else {
        setError('')
        setOperationStatus('失败图片已重新生成完成。')
      }
      return true
    } catch (retryError) {
      if (isAbortError(retryError)) {
        setError('')
        return true
      }
      setError(retryError instanceof Error ? retryError.message : '重试失败。')
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
          content: '已把你的文字需求放入「文字调整」。请选择要调整的图片后，可以直接生成扩展图。',
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
      if (!response.ok) throw new Error(data.error || '需求整理失败。')
      if (data.updatedBrief) setBrief(data.updatedBrief)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || '我已根据当前技能整理了你的需求，可以继续补充或发送给技能。',
        },
      ])
      setOperationStatus(
        data.providerError
          ? `智能推理暂时不可用，已改用本地规则整理：${toUserFacingChineseError(data.providerError)}`
          : data.readyToAnalyze
            ? '需求已整理完整，可以点击「发送给技能」进入下一步。'
            : '已更新上方需求输入框，你可以继续对话补充。',
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
            ? `需求推理暂时失败，我先把你的内容整理进输入框：${chatError.message}`
            : '需求推理暂时失败，我先把你的内容整理进输入框。',
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
      throw new Error('请先确认提示词。')
    }
    const uploadReferenceNote = uploadedFiles.length
      ? `\n\n已上传 ${uploadedFiles.length} 张参考图。生成时必须把上传图作为产品主体/设计参考，保留真实产品的外形、颜色、材质、比例、文字和关键细节。`
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
    if (!response.ok) throw new Error(data.error || '生图失败。')
    return data as ImageResult
  }

  function buildDirectionPrompt(direction: DirectionOption, extraInstruction = '') {
    const prompt = isDetailPageSkill
          ? [
              promptText.trim(),
              `生成这个详情页模块：${direction.title}。`,
              direction.description,
              '这是一张横向电商详情页模块。上传产品图必须作为真实商品参考，版式需要包含标题或卖点文案空间、商品导向的商业主视觉、统一风格和完整详情页模块结构。',
            ].join('\n')
      : isLogoSkill
        ? [
            promptText.trim(),
            `生成这一套 Logo 方向：${direction.title}。`,
            direction.description,
            '必须是扁平矢量标志：干净线条、清晰边缘、适合缩放、符合专业品牌识别系统。',
            '必须使用纯白背景或透明背景效果，Logo 居中展示，周围留出干净安全边距；不要生成任何装饰性背景。',
            '不要样机场景，不要三维效果，不要真实摄影，不要复杂阴影，不要浮雕，不要厚重材质，不要蓝色科技背景，不要发光光晕，不要径向渐变底色。',
            '如果包含文字，品牌名称必须清晰可读，不能拼错、变形或生成乱码；中文笔画结构要稳定。',
            '构图应适合品牌主标识，可用于头像、门头、包装、网站和印刷。',
          ].join('\n')
      : isProductImageSetSkill
        ? [
            promptText.trim(),
            `生成这一张电商套图页面：${direction.title}。`,
            direction.description,
            productSetPageInstruction(direction.id, direction.title),
            '这一张必须是整套商品图中的独立页面，不要把多张图拼进同一张里。商品外观以用户上传商品图为准；主视觉、细节、包装类页面必须强还原产品，效果证明、场景、人物类页面可以让产品弱露出或不作为主视觉。',
            '继续沿用整组商品图的统一背景体系、光影系统、文字系统、色彩系统和品牌气质；不同页型可以变化构图，但不能跳成另一套风格。',
            '整套图要有真实电商节奏变化：至少包含产品主视觉、结果/利益证明、生活或使用场景、局部细节或对比说明，不要连续生成相同的产品陈列版式。',
            '描述和画面文字使用用户指定语言；没有确认的参数、认证、接口、配件不要编造。',
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
          svgUrl: result.svgUrl,
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
      const reason = result.reason instanceof Error ? result.reason.message : '生图失败。'
      return [{ ...targets[index], id: targets[index].generationId || targets[index].id, reason }]
    })
    return { results, failures }
  }

  async function generateImage() {
    if (!analysis || !promptText.trim()) {
      setError('请先确认提示词。')
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
              title: logoVariantCount > 1 ? `${direction.title} · Variant ${index + 1}` : direction.title,
              description: [
                direction.description,
                logoVariantInstruction(index, logoVariantCount),
              ].join('\n\n'),
            }
          })
        : baseTargets
      if (!targets.length) {
        throw new Error(generationScope === 'multiple' ? '请至少选择一个要生成的页面。' : '没有可生成的方向。')
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
        setError(`本次 ${failures.length} 张都生成失败。已保留失败方向，可以在下方输入“继续生成失败的图”只重试这些方向。失败原因：${failures[0]?.reason || '生图失败。'}`)
        return
      }
      if (failures.length) {
        setFailedDirections(failures)
        setError(`有 ${failures.length} 张生成失败，成功图片已保留在左侧画廊。可以在下方输入“继续生成失败的图”让系统只重试失败方向。`)
      }
      setSelectedBaseImageId(results[0]?.id || '')
      setImageResult(results[0] ? { imageUrl: results[0].imageUrl, revisedPrompt: results[0].revisedPrompt } : null)
      setViewStep(stepIndex.expansion)
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '图片已生成并保存到当前项目目录。',
        },
      ])
    } catch (generateError) {
      if (isAbortError(generateError)) {
        setError('')
        return
      }
      setError(generateError instanceof Error ? generateError.message : '生图失败。')
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
    if (!imageUrl) throw new Error('没有可下载的图片。')
    const downloadExt = 'png'
    const suggestedName = `${safeClientFileName(title || 'skillcrew-image')}.${downloadExt}`
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
      throw new Error(data.error || '无法打开保存窗口，已尝试使用浏览器下载。')
    }
    if (data.canceled) {
      setOperationStatus('已取消下载。')
      return
    }
    setOperationStatus(`图片已保存到：${data.path}`)
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
      throw new Error(data.error || '批量保存失败。')
    }
    if (data.canceled) {
      setOperationStatus('已取消下载。')
      return
    }
    setOperationStatus(`已保存 ${data.count || downloadableItems.length} 张图片到：${data.folder || '所选文件夹'}`)
  }

  async function removeLightboxBackground() {
    if (!lightboxImage?.imageUrl) return
    if (lightboxImage.imageUrl.toLowerCase().split('?')[0].endsWith('.svg')) {
      setLightboxStatus('SVG 包装图暂不支持抠图，请打开原始 PNG/JPG 图片。')
      return
    }
    const sourceImage = lightboxImage
    setCutoutLoadingUrl(sourceImage.imageUrl)
    setLightboxStatus('正在抠图并导出透明 PNG...')
    setError('')
    try {
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: sourceImage.imageUrl,
          name: sourceImage.title || 'skillcrew-image',
        }),
      })
      const data = await readJsonResponse(response) as {
        imageUrl?: string
        title?: string
        error?: string
      }
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error || '抠图失败。')
      }
      const nextItem = {
        imageUrl: data.imageUrl,
        title: data.title || `${sourceImage.title || '图片'} 透明 PNG`,
      }
      setLightboxItems((current) => {
        const baseItems = current.length > 0 ? current : [sourceImage]
        return baseItems.some((item) => item.imageUrl === nextItem.imageUrl) ? baseItems : [...baseItems, nextItem]
      })
      showLightboxImage(nextItem)
      setLightboxStatus('已生成透明 PNG，可以直接下载。')
      setOperationStatus('透明 PNG 抠图已生成。')
      if (projectsOpen) {
        const projectsResponse = await fetch('/api/projects')
        const projectsData = await readJsonResponse(projectsResponse)
        if (projectsResponse.ok) {
          setProjects(Array.isArray(projectsData.projects) ? projectsData.projects as ProjectItem[] : [])
        }
      }
    } catch (cutoutError) {
      const message = cutoutError instanceof Error ? cutoutError.message : '抠图失败。'
      setLightboxStatus(message)
      setError(message)
    } finally {
      setCutoutLoadingUrl('')
    }
  }

  async function convertLightboxToSvg() {
    if (!lightboxImage?.imageUrl) return
    if (lightboxImage.imageUrl.toLowerCase().split('?')[0].endsWith('.svg')) {
      setLightboxStatus('当前已经是 SVG 文件。')
      return
    }
    const sourceImage = lightboxImage
    setSvgConvertingUrl(sourceImage.imageUrl)
    setLightboxStatus('正在转换 SVG...')
    setError('')
    try {
      const response = await fetch('/api/convert-svg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: sourceImage.imageUrl,
          name: sourceImage.title || 'skillcrew-image',
        }),
      })
      const data = await readJsonResponse(response) as {
        svgUrl?: string
        error?: string
      }
      if (!response.ok || !data.svgUrl) {
        throw new Error(data.error || 'SVG 转换失败。')
      }
      updateLightboxSvgUrl(sourceImage.imageUrl, data.svgUrl)
      setLightboxConvertedSvgUrl(data.svgUrl)
      setLightboxStatus('SVG 已转换完成，可以下载。')
      setOperationStatus('SVG 已转换完成。')
    } catch (svgError) {
      const message = svgError instanceof Error ? svgError.message : 'SVG 转换失败。'
      setLightboxStatus(message)
      setError(message)
    } finally {
      setSvgConvertingUrl('')
    }
  }

  async function generateExpansions() {
    if (!analysis || !promptText.trim()) {
      setError('请先完成主图生成。')
      return
    }
    const baseImage = adjustableImages.find((item) => item.id === selectedBaseImageId) || adjustableImages[0]
    const expansions = getSelectedExpansions()
    if (!baseImage || expansions.length === 0) {
      setError('请先选择一张主图和至少一个扩展项。')
      return
    }
    const expansionTasks = buildExpansionTasks(baseImage, expansions)
    if (expansionTasks.length === 0) {
      setError('没有可生成的扩展任务。')
      return
    }
    const requestedExpansionSize = isLogoSkill ? logoMockupSize : directionResult?.imagePrompt.size || '1024x1024'
    const mockupReferenceNote = isLogoSkill && mockupReferenceImages.length > 0
      ? `已上传 ${mockupReferenceImages.length} 张样机参考图。必须高度参考这些图的样机场景、构图关系、材质质感、光影氛围、道具组合和行业视觉语言；Logo 仍以当前选中的 Logo 方案为准，不要照搬参考图里的其他品牌标识或文字。`
      : ''
    rememberLogoSelections()
    setGenerating(true)
    setError('')
    const pendingCards = expansionTasks.map((task) => ({
      id: task.id,
      title: `${task.title} · ${baseImage.title}`,
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
          `基于当前选中的生成结果继续延展：${baseImage.title}。`,
          `生成扩展输出：${task.title}。${task.description}`,
          `扩展要求：\n${task.detailText}`,
          reasonedPatch ? `推理模型整理后的扩展补充要求：\n${reasonedPatch}` : '',
          mockupReferenceNote,
          isLogoSkill
            ? task.expansion.id.startsWith('logo-mockup-') || task.expansion.id === 'custom-followup'
              ? logoMockupPromptNote(task.title, task.detailText, brief, requestedExpansionSize)
              : task.expansion.id === 'logo-usage'
              ? '这是 Logo 应用预览，可以放入真实品牌应用场景，但 Logo 本体仍必须保持扁平、清晰、可读，不要变形。'
              : '这是 Logo 延展输出，必须保持扁平矢量、线条干净、适合缩放；使用纯白或透明背景效果，不要三维效果、样机、复杂阴影、写实效果、蓝色科技背景或发光光晕。'
            : '',
          isProductImageSetSkill
            ? '保持电商套图一致性：商品主体按原图和选中图片延展，背景体系、光影系统、文字系统、色彩系统、品牌气质与整套图一致；不要编造不存在的参数、配件或功能。'
            : '保持同一个品牌角色或主体的一致性，包括轮廓、色彩系统、材质语言、面部特征和商业视觉风格。',
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
          content: expansionReasoning.message || `已基于「${baseImage.title}」生成 ${nextResults.length} 张扩展图。`,
        },
      ])
    } catch (expandError) {
      if (isAbortError(expandError)) {
        setError('')
        return
      }
      setError(expandError instanceof Error ? expandError.message : '扩展生成失败。')
    } finally {
      setGenerating(false)
      setPendingPreviewCards((current) => current.filter((card) => !pendingCards.some((pending) => pending.id === card.id)))
      if (workflowAbortRef.current === controller) workflowAbortRef.current = null
    }
  }

  return (
    <main
      className="app-frame"
      data-current-skill-id={skill?.id || ''}
      data-current-skill-name={skill?.name || ''}
      data-current-skill-display-name={skill?.displayName || ''}
    >
      <section className="workspace" aria-label="Skill Runner">
        <header className="topbar">
          <div>
            <p className="brand">燃点Skill</p>
            <span>local workflow studio</span>
          </div>
          <nav aria-label="Workflow navigation">
            <button type="button" onClick={() => setSkillsOpen(true)}>技能</button>
            <button type="button" onClick={openProjectsPanel}>生成记录</button>
            <button type="button" onClick={() => setSettingsOpen(true)}>
              设置
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
                  <strong>读取</strong>
                  <span>{importingSkill ? '读取中' : '选择本地路径加载 Skill'}</span>
                </button>
                <button type="button" role="menuitem" onClick={openCreateSkillPanel}>
                  <strong>创建</strong>
                  <span>创建属于自己的 Skill</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="panels">
          <section className="left-panel">
            <div className="lime-band">
              <div className="skill-select-row">
                <label htmlFor="skill-select">Skills Expert</label>
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
                      ▾
                    </span>
                  </button>
                  {skillMenuOpen && (
                    <div className="skill-menu" role="listbox" aria-label="技能选择">
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

            <div className={`left-content ${isMergeImageSkill ? 'merge-left-content' : ''}`}>
              {isMergeImageSkill ? (
                <>
                  <p className="description">{skill?.guidance?.summary || skill?.description}</p>
                  <div className="summary-grid">
                    <article>
                      <span>参考资料</span>
                      <strong>{skill?.referencesCount ?? 0}</strong>
                    </article>
                    <article>
                      <span>模式</span>
                      <strong>分步确认</strong>
                    </article>
                  </div>
                  <div className="step-list merge-step-list">
                    <button type="button" className="step active">
                      <span>1</span>
                      <p>生图</p>
                    </button>
                  </div>
                  {(imageResults.length > 0 || pendingPreviewCards.length > 0) && (
                    <div className="merge-left-result-strip" aria-label="AI产品背景融合生成结果">
                      {imageResults.map((item) => (
                        <button
                          type="button"
                          className="merge-left-result"
                          key={item.id}
                          onClick={() => openLightbox(item.imageUrl, item.title, imageResults.map((image) => ({ imageUrl: image.imageUrl, title: image.title, svgUrl: image.svgUrl })))}
                        >
                          <img src={item.imageUrl} alt={item.title} />
                        </button>
                      ))}
                      {pendingPreviewCards.map((item) => (
                        <div className="merge-left-result merge-left-pending" key={item.id}>
                          <span className="merge-left-spinner" aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="description">{skill?.guidance?.summary || skill?.description}</p>
                  <div className="summary-grid">
                    <article>
                      <span>参考资料</span>
                      <strong>{skill?.referencesCount ?? 0}</strong>
                    </article>
                    <article>
                      <span>模式</span>
                      <strong>分步确认</strong>
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
                </>
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
                {messages
                  .filter((message) => !(isMergeImageSkill && message.role === 'assistant' && /已完成一键|角度参考|参考图|角色锁定/.test(message.content)))
                  .map((message) => (
                  <div className={`message ${message.role}-message`} key={message.id}>
                    <span>{message.role === 'assistant' ? 'Skills Expert' : '你'}</span>
                    <p>{toUserFacingChineseError(message.content)}</p>
                  </div>
                ))}

                {loading && !isMergeImageSkill && (
                  <div className="message assistant-message thinking-message" key="thinking">
                    <span>{isMergeImageSkill ? 'GPT 生图' : 'Skills Expert'}</span>
                    <div className="thinking-row">
                      <i className="thinking-spinner" aria-hidden="true" />
                      <p>{isMergeImageSkill ? '正在调用后台 GPT 生图 API' : 'Skills Expert 正在计算中'}</p>
                      <button type="button" onClick={stopWorkflowGeneration}>
                        暂停生成
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
                    <label htmlFor="brief-input">输入你的需求</label>
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
                      placeholder={skill?.guidance?.placeholder || '例如：说明你的具体需求、用途、素材和风格要求。'}
                    />
                    {!isMergeImageSkill && referenceImages.length > 0 && (
                      <div className="upload-list" aria-label="已选择的参考图">
                        {referenceImages.map((file, index) => (
                          <button type="button" key={`${file.name}-${index}`} onClick={() => removeReferenceImage(index)}>
                            <span>{file.name}</span>
                            <em>×</em>
                          </button>
                        ))}
                      </div>
                    )}
                    {!isMergeImageSkill && uploadedFiles.length > 0 && (
                      <div className="uploaded-note">
                        已保存 {uploadedFiles.length} 张{isMergeImageSkill ? '融合角色图' : '参考图'}，生图时会作为{isMergeImageSkill ? '产品/背景/角度硬参考' : '产品主体/视觉参考'}一起传入。
                      </div>
                    )}
                    {isMergeImageSkill && (
                      <div className="multi-angle-composer merge-image-composer">
                        <div className="multi-angle-upload-grid merge-image-upload-grid">
                          {mergeImageSlots.map((slot) => {
                            const slotFiles = mergeImageFiles[slot.id] || []
                            return (
                              <section
                                className={`multi-angle-slot merge-image-slot ${slotFiles.length ? 'has-files' : ''} ${draggingMergeImageSlot === slot.id ? 'drag-over' : ''}`}
                                key={slot.id}
                                onDragEnter={(event) => handleMergeImageDragOver(event, slot.id)}
                                onDragOver={(event) => handleMergeImageDragOver(event, slot.id)}
                                onDragLeave={(event) => handleMergeImageDragLeave(event, slot.id)}
                                onDrop={(event) => handleMergeImageDrop(event, slot.id)}
                              >
                                <label>
                                  <span className="slot-plus" aria-hidden="true" />
                                  <span className="slot-copy">
                                    <strong>{slot.label}</strong>
                                    <small>{slot.hint}</small>
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple={slot.id === 'angle'}
                                    onChange={(event) => {
                                      selectMergeImage(slot.id, event.currentTarget.files)
                                      event.currentTarget.value = ''
                                    }}
                                  />
                                </label>
                                {slotFiles.length > 0 && (
                                  <button
                                    type="button"
                                    className={`slot-preview ${slot.id === 'angle' && slotFiles.length > 1 ? 'slot-preview-stack' : ''}`}
                                    onClick={() => {
                                      if (slot.id === 'angle' && slotFiles.length > 1) setMergeReferenceModalSlot('angle')
                                    }}
                                    aria-label={slot.id === 'angle' && slotFiles.length > 1 ? '查看全部角度参考图' : `${slot.label}预览`}
                                  >
                                    {slotFiles.map((file, index) => (
                                      <figure className="slot-preview-item" key={`${file.name}-${index}`}>
                                        <img
                                          src={mergeImagePreviewUrls[`${slot.id}-${index}`]}
                                          alt={`${slot.label}预览 ${index + 1}`}
                                        />
                                        {(slot.id !== 'angle' || slotFiles.length === 1) && (
                                          <span
                                            className="slot-preview-remove"
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`删除${slot.label} ${index + 1}`}
                                            title="删除"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              removeMergeImage(slot.id, index)
                                            }}
                                            onKeyDown={(event) => {
                                              if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault()
                                                event.stopPropagation()
                                                removeMergeImage(slot.id, index)
                                              }
                                            }}
                                          >
                                            ×
                                          </span>
                                        )}
                                      </figure>
                                    ))}
                                    {slot.id === 'angle' && slotFiles.length > 1 && <span className="slot-preview-count">{slotFiles.length}</span>}
                                  </button>
                                )}
                              </section>
                            )
                          })}
                        </div>
                        <div className="merge-angle-library">
                          <div className="merge-angle-library-head">
                            <div>
                              <strong>角度库</strong>
                              <span>可多选角度批量生成；上传多张角度参考图时会共用产品、背景和模特图分别生成。</span>
                            </div>
                            <button
                              type="button"
                              className="merge-clear-selection"
                              disabled={selectedMergeAngleIds.length === 0}
                              onClick={() => setSelectedMergeAngleIds([])}
                              title="取消选择"
                            >
                              <ClearSelectionIcon />
                              <span>取消选择</span>
                            </button>
                          </div>
                          <div className="merge-angle-grid">
                            {mergeAngleLibrary.map((item) => (
                              <button
                                type="button"
                                className={selectedMergeAngleIds.includes(item.id) ? 'selected' : ''}
                                key={item.id}
                                onClick={() => {
                                  setSelectedMergeAngleIds((current) =>
                                    current.includes(item.id)
                                      ? current.filter((id) => id !== item.id)
                                      : current.length >= mergeAngleBatchLimit
                                        ? current
                                        : [...current, item.id],
                                  )
                                  setMergeImageFiles((current) => ({ ...current, angle: [] }))
                                }}
                              >
                                <img src={item.url} alt={item.label} />
                                <span>{item.label}</span>
                                <em>{mergeAngleLibraryAnalyses[item.id] ? '已解析' : '解析中'}</em>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="merge-size-panel">
                          <div>
                            <strong>输出尺寸</strong>
                            <span>选择一键生图的画幅，生成时会传给后台 GPT 生图接口。</span>
                          </div>
                          <div className="segmented-options merge-size-options">
                            {mergeImageSizeOptions.map((item) => (
                              <button
                                type="button"
                                className={mergeImageSize === item.value ? 'selected' : ''}
                                key={item.value}
                                onClick={() => setMergeImageSize(item.value)}
                              >
                                <strong>{item.label}</strong>
                                <span>{item.detail}</span>
                                <em>{item.value === 'auto' ? '自动' : item.value === 'custom' ? '输入' : item.value}</em>
                              </button>
                            ))}
                          </div>
                          {mergeImageSize === 'custom' && (
                            <div className="merge-custom-size">
                              <label>
                                <span>宽度</span>
                                <input
                                  type="number"
                                  min="256"
                                  max="4096"
                                  step="8"
                                  value={mergeCustomWidth}
                                  onChange={(event) => setMergeCustomWidth(event.currentTarget.value)}
                                />
                              </label>
                              <span className="merge-custom-size-separator">x</span>
                              <label>
                                <span>高度</span>
                                <input
                                  type="number"
                                  min="256"
                                  max="4096"
                                  step="8"
                                  value={mergeCustomHeight}
                                  onChange={(event) => setMergeCustomHeight(event.currentTarget.value)}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                        <div className="merge-resolution-panel">
                          <div>
                            <strong>输出分辨率</strong>
                            <span>保持上方画幅比例，按所选长边像素生成并保存。</span>
                          </div>
                          <div className="segmented-options merge-resolution-options">
                            {mergeImageResolutionOptions.map((item) => (
                              <button
                                type="button"
                                className={mergeImageResolution === item.value ? 'selected' : ''}
                                key={item.value}
                                onClick={() => setMergeImageResolution(item.value)}
                              >
                                <strong>{item.label}</strong>
                                <span>{item.detail}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {isMultiAngleSkill && (
                      <div className="multi-angle-composer">
                        <div className="multi-angle-upload-grid">
                          {multiAngleSlots.map((slot) => {
                            const slotFiles = multiAngleFiles[slot.id] || []
                            return (
                              <section className={`multi-angle-slot ${slotFiles.length ? 'has-files' : ''}`} key={slot.id}>
                                <label>
                                  <span className="slot-plus">+</span>
                                  <strong>{slot.label}</strong>
                                  <small>{slot.hint}</small>
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
                      {!isMergeImageSkill && (
                        <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
                          <UploadChoiceIcon />
                          上传参考图
                        </button>
                      )}
                      <button type="button" className="primary" onClick={isMergeImageSkill ? oneClickMergeImage : submitBrief} disabled={loading || generating}>
                        {isMergeImageSkill ? (loading || generating ? '生图中' : '一键生图') : loading ? '分析中' : '发送给技能'}
                      </button>
                      {isMergeImageSkill && (
                        <button type="button" className="secondary" onClick={stopWorkflowGeneration} disabled={!loading && !generating}>
                          暂停生成
                        </button>
                      )}
                    </div>
                    {isMergeImageSkill && (generating || pendingPreviewCards.length > 0 || imageResults.length > 0) && (
                      <div className="merge-inline-result">
                        <div className="merge-inline-progress">
                          <div>
                            {generating || pendingPreviewCards.length > 0 ? <span className="merge-inline-spinner" aria-hidden="true" /> : null}
                            <strong>{generating || pendingPreviewCards.length > 0 ? '正在生成融合图' : '生成完成'}</strong>
                          </div>
                          <em>{imageResults.length}/{imageResults.length + pendingPreviewCards.length}</em>
                        </div>
                        {imageResults.length > 0 ? (
                          <div className="merge-inline-grid">
                            {imageResults.map((item) => (
                              <button
                                type="button"
                                className="merge-inline-preview"
                                key={item.id}
                                onClick={() => openLightbox(item.imageUrl, item.title, imageResults.map((image) => ({ imageUrl: image.imageUrl, title: image.title, svgUrl: image.svgUrl })))}
                              >
                                <img src={item.imageUrl} alt={item.title} />
                                <span>{item.title}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="merge-inline-empty">
                            <p>等待第一张图片生成...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {error && <p className="error-text">{error}</p>}

              {analysis && visibleStep === stepIndex.references && (
                <section className="confirm-card">
                  <div>
                    <span className="status-dot" />
                    <p>{analysis.confirmation?.title || '确认这些参考资料后继续'}</p>
                  </div>
                  {analysis.confirmation?.description && (
                    <p className="confirm-description">配置智能推理后，这一步会自动分析参考资料并给出选择理由；当前已先用本地规则继续。</p>
                  )}
                  {analysis.providerError && (
                    <p className="provider-note">智能推理暂时不可用，已改用本地规则继续：{toUserFacingChineseError(analysis.providerError)}</p>
                  )}
                  {analysis.inferredChoices && analysis.inferredChoices.length > 0 && (
                    <div className="inferred-choice-list" aria-label="智能补全确认">
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
                                placeholder={`填写${choice.field}`}
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
                    <div className="direction-list theme-list" aria-label="主题方向">
                      {analysis.confirmation.options.map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={selectedThemeDirection === option ? 'selected' : ''}
                          onClick={() => setSelectedThemeDirection(option)}
                        >
                          <strong>{option}</strong>
                          <span>{option === '稳妥主方向'
                            ? '优先输出当前技能最稳的主题方向。'
                            : option === '强化记忆点方向'
                              ? '优先突出品牌识别元素和传播记忆点。'
                              : '优先考虑可直接用于落地执行的视觉方向。'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="reference-section-title">
                    <strong>参考资料选择</strong>
                    <span>勾选要带入后续方向生成的资料；不勾选也可以继续。</span>
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
                            {item.reason} · {item.score}%
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="actions">
                    <button type="button" className="secondary" onClick={submitBrief} disabled={loading}>
                      重新选择
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
                      {loading ? '生成方向中' : hasOptionStep ? '进入选项配置' : '确认并继续'}
                    </button>
                  </div>
                </section>
              )}

              {analysis && hasOptionStep && visibleStep === stepIndex.options && (
                <section className="confirm-card option-card">
                  <div>
                    <span className="status-dot" />
                    <p>选择这次要走的输出方向</p>
                  </div>
                  <p className="confirm-description">
                    这里的选择会影响后续方向和提示词。可以只选一个，也可以多选后批量生成。
                  </p>
                  {isLogoSkill && (
                    <div className="logo-option-groups">
                      {logoReuseState?.selectedDeliveryIds.length ? (
                        <button type="button" className="secondary reuse-choice-button" onClick={() => applyLogoReuseState('options')}>
                          沿用上次风格和重点
                        </button>
                      ) : null}
                      <section className="logo-option-group">
                        <h3>Logo 风格</h3>
                        <p>先选视觉气质，可以多选，系统会按品牌行业筛掉不合适的风格。</p>
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
                        <h3>信息重点</h3>
                        <p>再选 Logo 要优先传达什么，后续方向会把这些重点写进方案和提示词。</p>
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
                        <strong>{isLogoSkill && item.id.startsWith('logo-emphasis-') ? `重点：${item.title}` : isLogoSkill && item.id.startsWith('logo-style-') ? `风格：${item.title}` : item.title}</strong>
                        <span>{item.description}</span>
                      </button>
                    ))}
                  </div>
                  )}
                  <div className="actions">
                    <button type="button" className="secondary" onClick={() => setViewStep(stepIndex.references)}>
                      返回参考资料
                    </button>
                    <button type="button" className="primary" onClick={confirmReferences} disabled={loading || selectedDeliveryIds.length === 0}>
                      {loading ? '生成方向中' : '按这些选项继续'}
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
                        ? '确认详情页 Section 和总提示词'
                        : isProductImageSetSkill
                          ? '确认整套商品图和总提示词'
                          : '选择方向并确认提示词'}
                    </p>
                  </div>
                  {directionResult.providerError && (
                    <p className="provider-note">智能推理暂时不可用，已改用本地规则继续：{toUserFacingChineseError(directionResult.providerError)}</p>
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
                      ? '详情页总生成提示词'
                      : isProductImageSetSkill
                        ? '套图总生成提示词'
                        : isLogoSkill
                          ? 'Logo 总生成提示词'
                        : '最终生图提示词'}
                    <textarea value={promptText} onChange={(event) => setPromptText(event.target.value)} />
                  </label>
                  <div className="prompt-meta">
                    <span>尺寸：{directionResult.imagePrompt.size || '1024x1024'}</span>
                    <span>反向约束：{directionResult.imagePrompt.negative || '已按 Skill 默认约束处理'}</span>
                  </div>
                  <div className={isLogoSkill ? 'actions prompt-confirm-actions' : 'actions'}>
                    {isLogoSkill && (
                      <button
                        type="button"
                        className="secondary icon-back-button prompt-back-button"
                        onClick={() => setViewStep(stepIndex.options)}
                        aria-label="返回重选风格和重点"
                        title="返回重选风格/重点"
                      >
                        返回重选风格/重点
                      </button>
                    )}
                    <button type="button" className="secondary" onClick={() => setPromptConfirmed(false)}>
                      调整提示词
                    </button>
                    <button type="button" className="primary" onClick={confirmPrompt}>
                      确认提示词
                    </button>
                  </div>
                </section>
              )}

              {promptConfirmed && visibleStep === stepIndex.generate && (
                <section className="confirm-card image-card">
                  <div>
                    <span className="status-dot" />
                    <p>{isDetailPageSkill ? '生成详情页模块' : isProductImageSetSkill ? '生成整套商品图' : isLogoSkill ? '生成 Logo 方向' : '生成图片'}</p>
                  </div>
                  {isLogoSkill && (
                    <div className="generation-variant-panel">
                      <button
                        type="button"
                        className="secondary icon-back-button variant-back-button"
                        onClick={() => setViewStep(stepIndex.options)}
                        aria-label="返回重选风格和重点"
                        title="返回重选风格/重点"
                      >
                        返回重选风格/重点
                      </button>
                      <div>
                        <span>选择生成张数</span>
                        <div className="generation-scope" aria-label="Logo variant count">
                          {[1, 2, 3, 4].map((count) => (
                            <button
                              type="button"
                              key={count}
                              className={logoVariantCount === count ? 'selected' : ''}
                              onClick={() => setLogoVariantCount(count)}
                            >
                              {count} 张
                            </button>
                          ))}
                        </div>
                        <p>同一个 Logo 方向会生成多个差异化方案，让 AI 在构图、符号隐喻、正负形和字标关系上发散。</p>
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
                      单张
                    </button>
                    <button
                      type="button"
                      className={generationScope === 'multiple' ? 'selected' : ''}
                      onClick={() => setGenerationScope('multiple')}
                      disabled={!canGenerateAllDirections}
                    >
                      多张
                    </button>
                    <button
                      type="button"
                      className={generationScope === 'all' ? 'selected' : ''}
                      onClick={() => setGenerationScope('all')}
                      disabled={!canGenerateAllDirections}
                    >
                      全部
                    </button>
                  </div>
                  )}
                  {generationScope === 'single' && directionResult && (
                    <div className="generation-pick-list" aria-label="选择单张生成页面">
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
                          <strong>{isLogoSkill ? `第 ${index + 1} 个方向` : `第 ${index + 1} 屏`}</strong>
                          <span>{cleanGenerationTitle(direction.title)}</span>
                          <em className="generation-status">
                            {generationQueue.includes(direction.id)
                              ? '生成中'
                              : generatedDirectionIds.has(direction.id)
                                ? '已生成'
                                : failedDirectionIds.has(direction.id)
                                  ? '失败'
                                  : '未生成'}
                          </em>
                        </button>
                      ))}
                    </div>
                  )}
                  {generationScope === 'multiple' && directionResult && (
                    <div className="generation-pick-list multi" aria-label="选择多张生成页面">
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
                          <strong>{selectedGenerationIds.includes(direction.id) ? '已选' : isLogoSkill ? `第 ${index + 1} 个方向` : `第 ${index + 1} 屏`}</strong>
                          <span>{cleanGenerationTitle(direction.title)}</span>
                          <em className="generation-status">
                            {generationQueue.includes(direction.id)
                              ? '生成中'
                              : generatedDirectionIds.has(direction.id)
                                ? '已生成'
                                : failedDirectionIds.has(direction.id)
                                  ? '失败'
                                  : '未生成'}
                          </em>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="actions single-action">
                    <button type="button" className="primary" onClick={generateImage} disabled={generating}>
                      {generating
                        ? `生成中${generationQueue.length ? `（${generationQueue.length}）` : ''}`
                        : isLogoSkill
                          ? `生成 ${logoVariantCount} 张 Logo 方案`
                        : isDetailPageSkill
                          ? generationScope === 'all'
                            ? `生成全部 ${directionResult?.directions.length || 0} 个详情页模块`
                            : generationScope === 'multiple'
                              ? `生成已选 ${selectedGenerationIds.length} 个详情页模块`
                              : '生成单张详情页模块'
                          : isProductImageSetSkill
                            ? generationScope === 'all'
                              ? `生成全部 ${directionResult?.directions.length || 0} 张商品图`
                              : generationScope === 'multiple'
                                ? `生成已选 ${selectedGenerationIds.length} 张商品图`
                                : '生成单张商品图'
                            : isLogoSkill
                              ? generationScope === 'all'
                                ? `生成全部 ${directionResult?.directions.length || 0} 个 Logo 方向`
                                : generationScope === 'multiple'
                                  ? `生成已选 ${selectedGenerationIds.length} 个 Logo 方向`
                                  : '生成当前 Logo 方向'
                              : generationScope === 'all'
                                ? `生成全部 ${directionResult?.directions.length || 0} 张图片`
                                : generationScope === 'multiple'
                                  ? `生成已选 ${selectedGenerationIds.length} 张图片`
                                  : `调用 ${settings?.openai.imageModel || 'gpt-image-2'} 生图`}
                    </button>
                    {generating && (
                      <button type="button" className="secondary" onClick={stopWorkflowGeneration}>
                        暂停生成
                      </button>
                    )}
                  </div>
                  {imageResults.length > 0 && (
                    <p className="image-note">
                      {isDetailPageSkill
                        ? '详情页模块已保留在左侧画廊。当前阶段先逐张生成详情页模块，下一步再做整页拼接交付。'
                        : isProductImageSetSkill
                          ? '整套商品图已保留在左侧画廊。每张都是独立页面，可继续补卖点图、统一风格、改比例或单张优化。'
                        : isLogoSkill
                          ? 'Logo 方案已保留在左侧画廊。下一步可以选择其中一张继续生成行业样机。'
                          : '已生成的作品会保留在左侧画廊，可点击放大或下载。'}
                    </p>
                  )}
                </section>
              )}

              {adjustableImages.length > 0 && visibleStep === stepIndex.expansion && (
                <section className="confirm-card expansion-card">
                  <div>
                    <span className="status-dot" />
                    <p>{isLogoSkill ? '继续生成样机' : '继续扩展'}</p>
                  </div>
                  {isLogoSkill && logoReuseState && (
                    <button type="button" className="secondary reuse-choice-button" onClick={() => applyLogoReuseState('mockup')}>
                      沿用上次样机选择
                    </button>
                  )}
                  <p className="confirm-description">
                    {isLogoSkill
                      ? '先选择一张已生成的 Logo 方案，再选择要生成的行业样机。样机风格可后续从花瓣灵感库人工收录扩展。'
                      : '先选择一张已生成图片，再选择要继续扩展的内容。'}
                  </p>
                  <div className="base-image-strip" aria-label={isLogoSkill ? '选择 Logo 方案' : '选择基准图片'}>
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
                      还有 {failedDirections.length} 张生成失败。底部输入补充要求后，会先调用推理模型重写提示词，并只重试失败图片。
                    </p>
                  )}
                  <div className="delivery-grid">
                    <p className="delivery-title">{isLogoSkill ? '选择样机品类' : '继续扩展图'}</p>
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
                      <p className="delivery-title">选择样机尺寸</p>
                      <div className="mockup-size-options">
                        {[
                          { label: '1:1 方图', value: '1024x1024' },
                          { label: '4:3 横图', value: '1536x1152' },
                          { label: '3:4 竖图', value: '1024x1365' },
                          { label: '16:9 场景横图', value: '1536x864' },
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
                          <p>{item.title} 可选补充</p>
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
                          <p>样机参考图</p>
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
                            <button
                              type="button"
                              className="mockup-upload-button"
                              aria-label="上传样机参考图"
                              title="上传样机参考图"
                              onClick={() => document.getElementById('mockup-reference-input')?.click()}
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                            <span>点击上传，或把样机/场景参考图拖到这里。最多 6 张，只参考场景、材质和构图。</span>
                          </div>
                          {mockupReferenceImages.length > 0 && (
                            <div className="upload-list mockup-upload-list" aria-label="已选择的样机参考图">
                              {mockupReferenceImages.map((file, index) => (
                                <button type="button" key={`${file.name}-${index}`} onClick={() => removeMockupReferenceImage(index)}>
                                  <span>{file.name}</span>
                                  <em>×</em>
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
                      aria-label={isLogoSkill ? '返回生成 Logo' : undefined}
                      title={isLogoSkill ? '返回生成 Logo' : undefined}
                    >
                      {isLogoSkill ? '' : '生成其他画面'}
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={generateExpansions}
                      disabled={generating}
                    >
                      {generating ? (isLogoSkill ? '样机生成中' : '扩展生成中') : (isLogoSkill ? '生成样机图' : '生成扩展图')}
                    </button>
                    {generating && (
                      <button type="button" className="secondary" onClick={stopWorkflowGeneration}>
                        暂停生成
                      </button>
                    )}
                  </div>
                  {expansionResults.length > 0 && <p className="image-note">{isLogoSkill ? '样机图已追加到左侧画廊，不会覆盖之前的 Logo 方案。' : '扩展图已追加到左侧画廊，不会覆盖之前的方向图。'}</p>}
                </section>
              )}
              {!isMergeImageSkill && operationStatus && <p className="operation-status">{operationStatus}</p>}
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
                    ? '补充失败图片的重试要求，例如：润肤卖点用人物皮肤状态表达，不要产品摆拍'
                    : adjustableImages.length === 0
                      ? '和 Skills Expert 对话整理需求，例如：我想了解你能不能做偏欧美人物的佩戴效果'
                    : '继续描述需求，或对选中的图片布置调整任务'
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
                发送
              </button>
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
                <h3>本地技能列表</h3>
              </div>
              <button
                type="button"
                className="settings-close-button"
                aria-label="关闭"
                onClick={() => setSkillsOpen(false)}
              />
            </div>
            <div className="skill-directory-list">
              {skills.map((item, index) => (
                <Fragment key={item.id}>
                  {draggingSkillId && skillDragDropIndex === index && (
                    <div className="skill-drop-marker" aria-hidden="true" />
                  )}
                  <article
                  className={draggingSkillId === item.id ? 'skill-card-dragging' : ''}
                  data-skill-id={item.id}
                >
                  <div>
                    <strong>{item.displayName}</strong>
                    <span>{item.name}</span>
                  </div>
                  <p>{item.description}</p>
                  <code>{item.path || item.folder}</code>
                  <footer>
                    <em>{item.referencesCount} 个参考资料</em>
                    <div className="skill-card-actions">
                      <div className={`skill-sort-actions ${openSkillMoveId === item.id ? 'open' : ''}`}>
                        <button
                          type="button"
                          className="skill-icon-button skill-move-toggle"
                          aria-label="移动"
                          title="移动"
                          aria-expanded={openSkillMoveId === item.id}
                          onPointerDown={(event) => beginSkillPointerMove(item.id, event)}
                          onPointerMove={updateSkillPointerMove}
                          onPointerUp={finishSkillPointerMove}
                          onPointerCancel={cancelSkillPointerMove}
                          onClick={(event) => {
                            if (skillDragClickBlockedRef.current) {
                              event.preventDefault()
                              skillDragClickBlockedRef.current = false
                              return
                            }
                            setOpenSkillMoveId((current) => current === item.id ? '' : item.id)
                          }}
                        >
                          <MoveIcon />
                        </button>
                        {openSkillMoveId === item.id && (
                          <div className="skill-sort-expanded" aria-label="技能排序">
                            <button
                              type="button"
                              className="skill-icon-button"
                              aria-label="一键置顶"
                              title="一键置顶"
                              disabled={index === 0 || movingSkillId === item.id}
                              onClick={() => reorderSkill(item.id, 'top')}
                            >
                              <PinTopIcon />
                            </button>
                            <button
                              type="button"
                              className="skill-icon-button"
                              aria-label="上移"
                              title="上移"
                              disabled={index === 0 || movingSkillId === item.id}
                              onClick={() => reorderSkill(item.id, 'up')}
                            >
                              <MoveUpIcon />
                            </button>
                            <button
                              type="button"
                              className="skill-icon-button"
                              aria-label="下移"
                              title="下移"
                              disabled={index === skills.length - 1 || movingSkillId === item.id}
                              onClick={() => reorderSkill(item.id, 'down')}
                            >
                              <MoveDownIcon />
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="skill-delete-button"
                        onClick={() => setSkillDeleteConfirm({ id: item.id, displayName: item.displayName })}
                      >
                        <TrashIcon />
                        删除
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSkill(item.id)
                          setSkillsOpen(false)
                        }}
                      >
                        使用这个 Skill
                      </button>
                    </div>
                  </footer>
                  </article>
                  {draggingSkillId && skillDragDropIndex === skills.length && index === skills.length - 1 && (
                    <div className="skill-drop-marker" aria-hidden="true" />
                  )}
                </Fragment>
              ))}
            </div>
            {skillDeleteConfirm && (
              <div className="skill-confirm-backdrop" role="presentation">
                <section className="skill-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="skill-delete-title">
                  <div>
                    <p>Confirm</p>
                    <h3 id="skill-delete-title">删除 Skill</h3>
                  </div>
                  <p>{`确定删除「${skillDeleteConfirm.displayName}」吗？删除后将从本地技能列表移除。`}</p>
                  <div className="skill-confirm-actions">
                    <button
                      type="button"
                      className="skill-confirm-cancel"
                      disabled={deletingSkill}
                      onClick={() => setSkillDeleteConfirm(null)}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      className="skill-confirm-delete"
                      disabled={deletingSkill}
                      onClick={() => deleteSkill(skillDeleteConfirm)}
                    >
                      <TrashIcon />
                      {deletingSkill ? '删除中' : '确认删除'}
                    </button>
                  </div>
                </section>
              </div>
            )}
            <button
              type="button"
              className="project-back-top skill-back-top"
              aria-label="返回顶部"
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
          <section className="settings-panel utility-panel create-skill-panel" aria-label="创建技能">
            <div className="settings-head">
              <div>
                <p>创建技能</p>
                <h3>创建自己的技能</h3>
              </div>
              <button
                type="button"
                className="settings-close-button"
                aria-label="关闭"
                onClick={() => setCreateSkillOpen(false)}
              />
            </div>
            <div className="create-skill-layout">
              <div className="create-skill-form">
                <label>
                  显示名称
                  <input
                    value={skillCreateForm.displayName}
                    onChange={(event) => updateSkillCreateField('displayName', event.target.value)}
                    placeholder="例如：包装文案专家"
                  />
                </label>
                <label>
                  技术名
                  <input
                    value={skillCreateForm.name}
                    onChange={(event) => updateSkillCreateField('name', event.target.value)}
                    placeholder="可留空，自动生成英文连字符名称"
                  />
                </label>
                <label>
                  分类
                  <input
                    value={skillCreateForm.category}
                    onChange={(event) => updateSkillCreateField('category', event.target.value)}
                  />
                </label>
                <label>
                  用途与触发
                  <textarea
                    value={skillCreateForm.purpose}
                    onChange={(event) => updateSkillCreateField('purpose', event.target.value)}
                    placeholder="这个技能具体帮你做什么？什么时候应该触发？"
                  />
                </label>
                <label>
                  触发关键词/边界
                  <textarea
                    value={skillCreateForm.triggers}
                    onChange={(event) => updateSkillCreateField('triggers', event.target.value)}
                    placeholder="例如：用户提到包装文案、卖点提炼、包装背标时使用；普通 Logo 设计不使用。"
                  />
                </label>
                <label>
                  领域知识
                  <textarea
                    value={skillCreateForm.knowledge}
                    onChange={(event) => updateSkillCreateField('knowledge', event.target.value)}
                    placeholder="写入它需要知道的专业流程、判断标准、行业规则。"
                  />
                </label>
                <label>
                  输出格式与约束
                  <textarea
                    value={skillCreateForm.outputFormat}
                    onChange={(event) => updateSkillCreateField('outputFormat', event.target.value)}
                    placeholder="希望输出 Markdown、JSON、清单、提示词、方案表等。"
                  />
                </label>
                <label>
                  限制与禁区
                  <textarea
                    value={skillCreateForm.constraints}
                    onChange={(event) => updateSkillCreateField('constraints', event.target.value)}
                    placeholder="例如：不要输出泛泛建议；不要处理无关任务；信息不足时先确认关键条件。"
                  />
                </label>
                <label>
                  模型/能力需求
                  <textarea
                    value={skillCreateForm.modelNeeds}
                    onChange={(event) => updateSkillCreateField('modelNeeds', event.target.value)}
                    placeholder="例如：需要读取参考资料；需要图片生成；只需要文本推理。"
                  />
                </label>
                <label>
                  参考资料计划或内容
                  <textarea
                    value={skillCreateForm.referenceContent || skillCreateForm.referencesPlan}
                    onChange={(event) => {
                      updateSkillCreateField('referencesPlan', event.target.value)
                      updateSkillCreateField('referenceContent', event.target.value)
                    }}
                    placeholder="可以粘贴长规范、案例、术语表；创建时会保存为参考资料。"
                  />
                </label>
                <button type="button" className="primary" onClick={draftSkillOutline} disabled={draftingSkill}>
                  {draftingSkill ? '生成大纲中' : '生成设计大纲'}
                </button>
              </div>
              <div className="create-skill-outline">
                <div>
                  <strong>设计大纲</strong>
                  <span>确认后才会写入本地技能文件夹</span>
                </div>
                {skillCreateProviderError && <p className="provider-note">{skillCreateProviderError}</p>}
                <textarea
                  value={skillCreateOutline}
                  onChange={(event) => setSkillCreateOutline(event.target.value)}
                  placeholder="先填写左侧信息，然后生成设计大纲。"
                />
                {skillCreateStatus && <p className="operation-status">{skillCreateStatus}</p>}
                <button type="button" className="primary" onClick={createLocalSkill} disabled={creatingSkill || !skillCreateOutline.trim()}>
                  {creatingSkill ? '创建中' : '确认创建本地技能'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="settings-backdrop" role="presentation">
          <section className="settings-panel" aria-label="接口设置">
            <div className="settings-head">
              <div>
                <p>设置</p>
                <h3>接口配置</h3>
              </div>
              <button
                type="button"
                className="settings-close-button"
                aria-label="关闭"
                onClick={() => setSettingsOpen(false)}
              />
            </div>

            <div className="settings-status">
              <button
                type="button"
                className={settingsTab === 'reasoning' ? 'active' : ''}
                onClick={() => setSettingsTab('reasoning')}
              >
                <strong>智能推理</strong>
                <span>{settings?.reasoning.configured ? settings.reasoning.apiKeyMasked : '未配置'}</span>
              </button>
              <button
                type="button"
                className={settingsTab === 'openai' ? 'active' : ''}
                onClick={() => setSettingsTab('openai')}
              >
                <strong>GPT 生图</strong>
                <span>{settings?.openai.configured ? settings.openai.apiKeyMasked : '未配置'}</span>
              </button>
            </div>

            {settingsTab === 'reasoning' && (
              <div className="settings-section">
                <div className="settings-copy">
                  <p>智能推理配置</p>
                  <span>用于读取技能说明、识别参考资料、生成确认卡和提示词方向。</span>
                </div>
                <div className="settings-grid single-provider">
                  <label>
                    接口密钥
                    <input
                      type="password"
                      value={settingsForm.reasoningApiKey}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, reasoningApiKey: event.target.value }))
                      }
                      placeholder="留空则保留已保存的 Key"
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
                    模型
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
                  <p>GPT 生图配置</p>
                  <span>用于最终确认提示词后调用图片模型生成并保存结果。</span>
                </div>
                <div className="settings-grid single-provider">
                  <label>
                    接口密钥
                    <input
                      type="password"
                      value={settingsForm.openaiApiKey}
                      onChange={(event) =>
                        setSettingsForm((current) => ({ ...current, openaiApiKey: event.target.value }))
                      }
                      placeholder="留空则保留已保存的 Key"
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
                    生图模型
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
              {savingSettings ? '保存中' : '保存配置'}
            </button>
          </section>
        </div>
      )}

      {mergeReferenceModalSlot === 'angle' && (
        <div className="merge-reference-modal-backdrop" role="presentation" onClick={() => setMergeReferenceModalSlot('')}>
          <section className="merge-reference-modal" role="dialog" aria-modal="true" aria-label="角度参考图管理" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <strong>角度参考图</strong>
                <span>{(mergeImageFiles.angle || []).length} 张参考图，将共用产品鞋图、背景图和模特参考图分别生成。</span>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setMergeReferenceModalSlot('')}>
                ×
              </button>
            </header>
            <div className="merge-reference-modal-grid">
              {(mergeImageFiles.angle || []).map((file, index) => (
                <figure key={`${file.name}-${index}`}>
                  <img src={mergeImagePreviewUrls[`angle-${index}`]} alt={`角度参考图 ${index + 1}`} />
                  <button type="button" onClick={() => removeMergeImage('angle', index)}>
                    ×
                  </button>
                  <figcaption>角度 {index + 1}</figcaption>
                </figure>
              ))}
              {(mergeImageFiles.angle || []).length < mergeAngleBatchLimit && (
                <label
                  className={`merge-reference-add ${draggingMergeImageSlot === 'angle-modal' ? 'drag-over' : ''}`}
                  onDragEnter={(event) => handleMergeImageDragOver(event, 'angle-modal')}
                  onDragOver={(event) => handleMergeImageDragOver(event, 'angle-modal')}
                  onDragLeave={(event) => handleMergeImageDragLeave(event, 'angle-modal')}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDraggingMergeImageSlot('')
                    selectMergeImage('angle', event.dataTransfer.files)
                  }}
                >
                  <span className="slot-plus" aria-hidden="true" />
                  <strong>添加角度图</strong>
                  <small>点击上传或拖入图片</small>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      selectMergeImage('angle', event.currentTarget.files)
                      event.currentTarget.value = ''
                    }}
                  />
                </label>
              )}
            </div>
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
                  重置
                </button>
                <button
                  type="button"
                  className="lightbox-svg-button"
                  aria-describedby="svg-convert-tip"
                  disabled={Boolean(svgConvertingUrl)}
                  onClick={() => convertLightboxToSvg()}
                >
                  <SvgConvertIcon />
                  {svgConvertingUrl === lightboxImage.imageUrl ? '转换中' : '转 SVG'}
                  <span id="svg-convert-tip" className="lightbox-button-tip" role="tooltip">
                    如当前图片中有比较小的文字，识别会不够完美，需手动调整。
                  </span>
                </button>
                {lightboxConvertedSvgUrl && (
                  <button
                    type="button"
                    className="lightbox-svg-button"
                    onClick={() =>
                      downloadImage(lightboxConvertedSvgUrl, `${lightboxImage.title} SVG`).catch((e) =>
                        setError(e instanceof Error ? e.message : 'SVG 下载失败。'),
                      )
                    }
                  >
                    <DownloadIcon />
                    下载 SVG
                  </button>
                )}
                <button
                  type="button"
                  className="lightbox-cutout-button"
                  disabled={Boolean(cutoutLoadingUrl)}
                  onClick={() => removeLightboxBackground()}
                >
                  <CutoutIcon />
                  {cutoutLoadingUrl === lightboxImage.imageUrl ? '抠图中' : '抠图'}
                </button>
                <button type="button" onClick={() => downloadImage(lightboxImage.imageUrl, lightboxImage.title).catch((e) => setError(e instanceof Error ? e.message : '下载失败。'))}>
                  <DownloadIcon />
                  下载
                </button>
                <button type="button" className="lightbox-close-button" aria-label="关闭" onClick={closeLightbox}>
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
              {lightboxStatus && <div className="lightbox-status">{lightboxStatus}</div>}
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
                    ‹
                  </button>
                  <button
                    type="button"
                    className="lightbox-nav-button next"
                    aria-label="Next image"
                    onClick={(event) => {
                      event.stopPropagation()
                      moveLightbox(1)
                    }}
                  >
                    ›
                  </button>
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
