import { angle01 } from './angles/angle-01'
import { angle02 } from './angles/angle-02'
import { angle03 } from './angles/angle-03'
import { angle04 } from './angles/angle-04'
import { angle05 } from './angles/angle-05'
import { angle06 } from './angles/angle-06'
import { angle08 } from './angles/angle-08'
import { angle09 } from './angles/angle-09'
import { angle10 } from './angles/angle-10'
import { angle11 } from './angles/angle-11'
import { angle12 } from './angles/angle-12'
import { angle13 } from './angles/angle-13'
import { angle14 } from './angles/angle-14'
import { angle15 } from './angles/angle-15'
import { angle17 } from './angles/angle-17'
import { angle18 } from './angles/angle-18'
import { angle19 } from './angles/angle-19'
import { angle20 } from './angles/angle-20'
import { angle21 } from './angles/angle-21'
import { angle22 } from './angles/angle-22'
import { angle23 } from './angles/angle-23'

export type MergeAngleLibraryItem = {
  id: string
  label: string
  url: string
}

export const mergeAngleConfigs = [angle01, angle02, angle03, angle04, angle05, angle06, angle08, angle09, angle10, angle11, angle12, angle13, angle14, angle15, angle17, angle18, angle19, angle20, angle21, angle22, angle23] as const

export const mergeAnglePosePrompts: Record<string, string> = Object.fromEntries(
  mergeAngleConfigs.map((angle) => [angle.id, angle.prompt]),
)

export const mergeAngleAddedPosePrompts: Record<string, string> = Object.fromEntries(
  mergeAngleConfigs
    .filter((angle) => angle.addedPrompt)
    .map((angle) => [angle.id, angle.addedPrompt]),
)

export const mergeAngleLibrary: MergeAngleLibraryItem[] = mergeAngleConfigs.map((angle, index) => ({
  id: angle.id,
  label: `角度 ${index + 1}`,
  url: `/assets/merge-angle-library/angle-${String(angle.imageNumber).padStart(2, '0')}.png`,
}))
