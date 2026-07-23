import { angle01 } from './angle-01'

export const angle01TwoProductPrompt = [
  angle01.prompt,
  'Angle 1 two-product shoe-side lock, only when exactly two product shoe images are uploaded: Product image 1 = shoe OUTER side. Product image 2 = shoe INNER side. Follow the angle-01 marked reference labels: the FRONT FOOT / lower-left planted leg shows the medial ankle / INNER-ANKLE side, so its visible shoe side must use Product image 2 / INNER side. The REAR FOOT / upper-right lifted-heel leg shows the lateral ankle / OUTER-ANKLE side, so its visible shoe side must use Product image 1 / OUTER side. Do not assign by generic screen-left/screen-right. Do not swap Product 1/Product 2, do not swap inner/outer sides, do not generate two same-side shoes, and do not treat Product 2 as an extra shoe or generic supplementary reference. Preserve the angle-01 walking-left foot positions, toe-left direction, rear heel lift, close shoe-focused crop, and lower-body-only framing.',
].join('\n')

export const angle01TwoProductFinalPrompt = 'Final angle-1 two-product check: front/lower-left planted shoe = Product 2 inner side on the medial ankle; rear/upper-right lifted-heel shoe = Product 1 outer side on the lateral ankle. Swapped products, wrong ankle side, or two same-side shoes = failed result.'
