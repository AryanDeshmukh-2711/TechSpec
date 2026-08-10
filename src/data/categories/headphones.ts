import type { Category, Product } from '@/types'
import { accentFor, commercialSpecs } from '../shared'

const FORM = ['Over-ear', 'In-ear']
const DRIVER = ['Planar magnetic', 'Dynamic + planar', 'Dynamic']
// A wired analogue connection is lossless, so it outranks every Bluetooth
// codec for fidelity — ordering it last would punish reference headphones.
const CODECS = ['Wired only', 'LDAC + aptX Adaptive', 'LDAC', 'aptX Adaptive', 'AAC + SBC']
const WATER = ['IP57', 'IPX4', 'None']

export const headphonesCategory: Category = {
  id: 'headphones',
  label: 'Headphones',
  singular: 'headphone',
  plural: 'headphones',
  icon: 'Headphones',
  blurb: 'Over-ears and earbuds ranked on sound, silence and stamina.',
  groupOrder: ['sound', 'features', 'battery', 'build', 'connectivity', 'price'],
  cardSpecs: ['form', 'soundScore', 'ancScore', 'batteryHrsAnc'],
  headlineSpecs: ['form', 'driverSize', 'batteryHrsAnc', 'codecs'],

  specs: [
    { key: 'form', label: 'Form factor', group: 'sound', kind: 'enum', enumOrder: FORM, higherIsBetter: null },
    { key: 'driverSize', label: 'Driver size', group: 'sound', kind: 'number', unit: 'mm', higherIsBetter: true, bar: true },
    { key: 'driverType', label: 'Driver type', group: 'sound', kind: 'enum', enumOrder: DRIVER, higherIsBetter: true },
    { key: 'freqLow', label: 'Frequency floor', group: 'sound', kind: 'number', unit: 'Hz', higherIsBetter: false, hint: 'How low the driver is rated to reach. Lower means more sub-bass extension.' },
    { key: 'freqHigh', label: 'Frequency ceiling', group: 'sound', kind: 'number', unit: 'kHz', higherIsBetter: true },
    { key: 'codecs', label: 'Best audio link', group: 'sound', kind: 'enum', enumOrder: CODECS, higherIsBetter: true, hint: 'Ranked by how much of the signal survives the trip. Wired is lossless; LDAC and aptX Adaptive carry more than AAC.' },
    { key: 'hiRes', label: 'Hi-Res Audio certified', group: 'sound', kind: 'bool', higherIsBetter: true },
    { key: 'soundScore', label: 'Sound quality score', group: 'sound', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Our aggregate of measured frequency response accuracy and published listening panels.' },

    { key: 'anc', label: 'Active noise cancelling', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'ancScore', label: 'ANC effectiveness', group: 'features', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Measured attenuation weighted towards low-frequency rumble — planes, trains, HVAC.' },
    { key: 'transparency', label: 'Transparency mode', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'micScore', label: 'Call quality', group: 'features', kind: 'number', unit: '/100', higherIsBetter: true, bar: true },
    { key: 'multipoint', label: 'Multipoint pairing', group: 'features', kind: 'bool', higherIsBetter: true, hint: 'Connected to your laptop and phone at once, switching automatically.' },
    { key: 'spatial', label: 'Spatial audio', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'eqApp', label: 'Companion EQ app', group: 'features', kind: 'bool', higherIsBetter: true },

    { key: 'batteryHrsAnc', label: 'Battery (ANC on)', group: 'battery', kind: 'number', unit: 'h', higherIsBetter: true, bar: true },
    { key: 'batteryHrsOff', label: 'Battery (ANC off)', group: 'battery', kind: 'number', unit: 'h', higherIsBetter: true, bar: true },
    { key: 'caseHrs', label: 'With charging case', group: 'battery', kind: 'number', unit: 'h', higherIsBetter: true },
    { key: 'quickCharge', label: '5 hours from', group: 'battery', kind: 'number', unit: 'min', higherIsBetter: false, hint: 'Charge time needed for roughly five hours of playback.' },

    { key: 'weight', label: 'Weight', group: 'build', kind: 'number', unit: 'g', precision: 1, higherIsBetter: false, bar: true },
    { key: 'comfortScore', label: 'Comfort score', group: 'build', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Clamping force, pad material and weight distribution over a three-hour session.' },
    { key: 'foldable', label: 'Folds flat', group: 'build', kind: 'bool', higherIsBetter: true },
    { key: 'waterRating', label: 'Water resistance', group: 'build', kind: 'enum', enumOrder: WATER, higherIsBetter: true },
    { key: 'replaceablePads', label: 'Replaceable pads/tips', group: 'build', kind: 'bool', higherIsBetter: true },

    { key: 'bluetooth', label: 'Bluetooth', group: 'connectivity', kind: 'number', precision: 1, higherIsBetter: true },
    { key: 'wiredMode', label: 'Wired listening', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'usbAudio', label: 'USB-C audio', group: 'connectivity', kind: 'bool', higherIsBetter: true },

    ...commercialSpecs,
  ],

  pillars: [
    { id: 'sound', label: 'Sound', short: 'Sound', hint: 'Measured tonality, driver hardware and codec support.', weights: { soundScore: 0.55, driverSize: 0.1, driverType: 0.1, codecs: 0.15, hiRes: 0.1 } },
    { id: 'noise', label: 'Noise cancelling', short: 'ANC', hint: 'How much of the world it actually removes.', weights: { ancScore: 0.8, anc: 0.1, transparency: 0.1 } },
    { id: 'battery', label: 'Battery', short: 'Power', hint: 'Runtime with ANC engaged, plus top-up speed.', weights: { batteryHrsAnc: 0.55, batteryHrsOff: 0.2, quickCharge: 0.15, caseHrs: 0.1 } },
    { id: 'comfort', label: 'Comfort & build', short: 'Fit', hint: 'Weight, long-session comfort and serviceability.', weights: { comfortScore: 0.55, weight: 0.25, replaceablePads: 0.1, waterRating: 0.1 } },
    { id: 'features', label: 'Features', short: 'Extras', hint: 'Calls, multipoint, spatial audio and app control.', weights: { micScore: 0.35, multipoint: 0.25, eqApp: 0.2, spatial: 0.2 } },
    { id: 'value', label: 'Value', short: 'Value', hint: 'Price against everything above.', weights: { price: 1 } },
  ],

  personas: [
    { id: 'budget', label: 'Budget buyers', icon: 'PiggyBank', blurb: 'Most sound per dollar', weights: { value: 10, sound: 2, noise: 1 } },
    { id: 'audiophile', label: 'Critical listening', icon: 'AudioLines', blurb: 'Tonal accuracy above all', weights: { sound: 10, comfort: 4 } },
    { id: 'commute', label: 'Commute & flights', icon: 'Plane', blurb: 'Silence and stamina', weights: { noise: 10, battery: 8, comfort: 5 } },
    { id: 'calls', label: 'Calls & meetings', icon: 'Mic', blurb: 'Mic quality and multipoint', weights: { features: 10, comfort: 5, noise: 4 } },
    { id: 'workout', label: 'Workouts', icon: 'Dumbbell', blurb: 'Light, secure, sweat-proof', weights: { comfort: 10, battery: 4, sound: 3 } },
    { id: 'endurance', label: 'Battery life', icon: 'BatteryCharging', blurb: 'Charge it monthly', weights: { battery: 10, value: 2 } },
  ],

  quickFilters: [
    { id: 'under-200', label: 'Under $200', test: (p) => p.price < 200 },
    { id: 'over-ear', label: 'Over-ear', test: (p) => p.specs.form === 'Over-ear' },
    { id: 'in-ear', label: 'Earbuds', test: (p) => p.specs.form === 'In-ear' },
    { id: 'anc', label: 'Has ANC', test: (p) => p.specs.anc === true },
    { id: 'hifi-link', label: 'LDAC / aptX / wired', test: (p) => p.specs.codecs !== 'AAC + SBC' },
    { id: 'multipoint', label: 'Multipoint', test: (p) => p.specs.multipoint === true },
    { id: 'longlife', label: '30h+ with ANC', test: (p) => Number(p.specs.batteryHrsAnc ?? 0) >= 30 },
  ],
}

const p = (
  id: string, name: string, brand: string, price: number, releaseYear: number,
  rating: number, tagline: string, specs: Product['specs'],
): Product => ({ id, name, brand, category: 'headphones', price, releaseYear, rating, tagline, accent: accentFor(brand), specs })

export const headphoneProducts: Product[] = [
  p('sony-wh1000xm6', 'WH-1000XM6', 'Sony', 449, 2025, 4.7,
    'The all-rounder to beat: class-leading ANC, LDAC, and it folds again.', {
      form: 'Over-ear', driverSize: 30, driverType: 'Dynamic', freqLow: 4, freqHigh: 40, codecs: 'LDAC', hiRes: true, soundScore: 90,
      anc: true, ancScore: 96, transparency: true, micScore: 88, multipoint: true, spatial: true, eqApp: true,
      batteryHrsAnc: 30, batteryHrsOff: 40, caseHrs: null, quickCharge: 3,
      weight: 254, comfortScore: 90, foldable: true, waterRating: 'None', replaceablePads: true,
      bluetooth: 5.3, wiredMode: true, usbAudio: true,
    }),
  p('bose-qc-ultra', 'QuietComfort Ultra Headphones', 'Bose', 429, 2023, 4.5,
    'The most comfortable over-ear here, with immersive audio nobody else matches.', {
      form: 'Over-ear', driverSize: 35, driverType: 'Dynamic', freqLow: 10, freqHigh: 20, codecs: 'aptX Adaptive', hiRes: false, soundScore: 86,
      anc: true, ancScore: 95, transparency: true, micScore: 82, multipoint: true, spatial: true, eqApp: true,
      batteryHrsAnc: 24, batteryHrsOff: 27, caseHrs: null, quickCharge: 15,
      weight: 250, comfortScore: 95, foldable: true, waterRating: 'None', replaceablePads: true,
      bluetooth: 5.3, wiredMode: true, usbAudio: false,
    }),
  p('airpods-max-usbc', 'AirPods Max (USB-C)', 'Apple', 549, 2024, 4.2,
    'Beautiful, heavy, and only fully itself inside Apple’s ecosystem.', {
      form: 'Over-ear', driverSize: 40, driverType: 'Dynamic', freqLow: 5, freqHigh: 21, codecs: 'AAC + SBC', hiRes: false, soundScore: 88,
      anc: true, ancScore: 90, transparency: true, micScore: 86, multipoint: true, spatial: true, eqApp: false,
      batteryHrsAnc: 20, batteryHrsOff: 20, caseHrs: null, quickCharge: 5,
      weight: 386.2, comfortScore: 76, foldable: false, waterRating: 'None', replaceablePads: true,
      bluetooth: 5, wiredMode: true, usbAudio: true,
    }),
  p('sennheiser-momentum-4', 'Momentum 4 Wireless', 'Sennheiser', 349, 2022, 4.4,
    'Sixty hours of battery and the most tunable sound of the mainstream over-ears.', {
      form: 'Over-ear', driverSize: 42, driverType: 'Dynamic', freqLow: 6, freqHigh: 22, codecs: 'aptX Adaptive', hiRes: true, soundScore: 89,
      anc: true, ancScore: 84, transparency: true, micScore: 74, multipoint: true, spatial: false, eqApp: true,
      batteryHrsAnc: 60, batteryHrsOff: 60, caseHrs: null, quickCharge: 10,
      weight: 293, comfortScore: 88, foldable: false, waterRating: 'None', replaceablePads: false,
      bluetooth: 5.2, wiredMode: true, usbAudio: false,
    }),
  p('beyerdynamic-dt700', 'DT 700 PRO X', 'Beyerdynamic', 299, 2021, 4.5,
    'No battery, no app, no ANC — just the most accurate sound on this list.', {
      form: 'Over-ear', driverSize: 45, driverType: 'Dynamic', freqLow: 5, freqHigh: 40, codecs: 'Wired only', hiRes: true, soundScore: 95,
      anc: false, ancScore: 20, transparency: false, micScore: null, multipoint: false, spatial: false, eqApp: false,
      batteryHrsAnc: null, batteryHrsOff: null, caseHrs: null, quickCharge: null,
      weight: 350, comfortScore: 85, foldable: false, waterRating: 'None', replaceablePads: true,
      bluetooth: null, wiredMode: true, usbAudio: false,
    }),
  p('airpods-pro-3', 'AirPods Pro 3', 'Apple', 249, 2025, 4.6,
    'The best earbuds for iPhone owners, and now they track your heart rate.', {
      form: 'In-ear', driverSize: 11, driverType: 'Dynamic', freqLow: 20, freqHigh: 20, codecs: 'AAC + SBC', hiRes: false, soundScore: 84,
      anc: true, ancScore: 93, transparency: true, micScore: 90, multipoint: true, spatial: true, eqApp: false,
      batteryHrsAnc: 8, batteryHrsOff: 10, caseHrs: 30, quickCharge: 5,
      weight: 5.6, comfortScore: 90, foldable: false, waterRating: 'IP57', replaceablePads: true,
      bluetooth: 5.3, wiredMode: false, usbAudio: true,
    }),
  p('sony-wf1000xm5', 'WF-1000XM5', 'Sony', 299, 2023, 4.5,
    'The most complete Android earbuds: LDAC, strong ANC, tiny shells.', {
      form: 'In-ear', driverSize: 8.4, driverType: 'Dynamic', freqLow: 20, freqHigh: 40, codecs: 'LDAC', hiRes: true, soundScore: 87,
      anc: true, ancScore: 92, transparency: true, micScore: 84, multipoint: true, spatial: true, eqApp: true,
      batteryHrsAnc: 8, batteryHrsOff: 12, caseHrs: 24, quickCharge: 5,
      weight: 5.9, comfortScore: 88, foldable: false, waterRating: 'IPX4', replaceablePads: true,
      bluetooth: 5.3, wiredMode: false, usbAudio: false,
    }),
  p('bose-qc-ultra-buds', 'QuietComfort Ultra Earbuds', 'Bose', 299, 2023, 4.4,
    'The quietest earbuds made, at the cost of battery life.', {
      form: 'In-ear', driverSize: 9.3, driverType: 'Dynamic', freqLow: 20, freqHigh: 20, codecs: 'aptX Adaptive', hiRes: false, soundScore: 85,
      anc: true, ancScore: 97, transparency: true, micScore: 80, multipoint: true, spatial: true, eqApp: true,
      batteryHrsAnc: 6, batteryHrsOff: 7, caseHrs: 24, quickCharge: 20,
      weight: 6.2, comfortScore: 86, foldable: false, waterRating: 'IPX4', replaceablePads: true,
      bluetooth: 5.3, wiredMode: false, usbAudio: false,
    }),
  p('nothing-ear-a', 'Ear (a)', 'Nothing', 99, 2024, 4.3,
    'LDAC and credible ANC for under a hundred dollars. The value pick, comfortably.', {
      form: 'In-ear', driverSize: 11, driverType: 'Dynamic', freqLow: 20, freqHigh: 40, codecs: 'LDAC', hiRes: true, soundScore: 80,
      anc: true, ancScore: 78, transparency: true, micScore: 72, multipoint: true, spatial: false, eqApp: true,
      batteryHrsAnc: 5.5, batteryHrsOff: 9.5, caseHrs: 42.5, quickCharge: 10,
      weight: 4.8, comfortScore: 84, foldable: false, waterRating: 'IPX4', replaceablePads: true,
      bluetooth: 5.3, wiredMode: false, usbAudio: false,
    }),
  p('soundcore-space-one', 'Soundcore Space One', 'Anker', 99, 2023, 4.1,
    'Forty hours of ANC playback for $99 — the budget commuter’s answer.', {
      form: 'Over-ear', driverSize: 40, driverType: 'Dynamic', freqLow: 16, freqHigh: 40, codecs: 'LDAC', hiRes: true, soundScore: 76,
      anc: true, ancScore: 82, transparency: true, micScore: 70, multipoint: true, spatial: false, eqApp: true,
      batteryHrsAnc: 40, batteryHrsOff: 55, caseHrs: null, quickCharge: 5,
      weight: 263, comfortScore: 82, foldable: true, waterRating: 'None', replaceablePads: true,
      bluetooth: 5.3, wiredMode: true, usbAudio: false,
    }),
]
