import type { Category, Product } from '@/types'
import { accentFor, commercialSpecs } from '../shared'

const FORMAT = ['Full-frame', 'APS-C', 'Micro Four Thirds']
const VIDEO = ['6K30 open gate', '8K30', '6K30', '4K120', '4K60', '4K30']
const SCREEN = ['Vari-angle touchscreen', 'Tilting touchscreen', 'Three-way tilt', 'Fixed']
const MOUNT_TYPE = ['Interchangeable', 'Fixed lens']

export const camerasCategory: Category = {
  id: 'cameras',
  label: 'Cameras',
  singular: 'camera',
  plural: 'cameras',
  icon: 'Camera',
  blurb: 'Mirrorless bodies compared on stills, video and everything in between.',
  groupOrder: ['camera', 'performance', 'display', 'battery', 'storage', 'build', 'connectivity', 'price'],
  cardSpecs: ['sensorFormat', 'megapixels', 'burstElec', 'weight'],
  headlineSpecs: ['sensorFormat', 'megapixels', 'videoMax', 'ibisStops'],

  specs: [
    { key: 'sensorFormat', label: 'Sensor format', group: 'camera', kind: 'enum', enumOrder: FORMAT, higherIsBetter: true, hint: 'Bigger sensors gather more light and give shallower depth of field for the same framing.' },
    { key: 'megapixels', label: 'Resolution', group: 'camera', kind: 'number', unit: 'MP', precision: 1, higherIsBetter: true, bar: true },
    { key: 'dynamicRange', label: 'Dynamic range', group: 'camera', kind: 'number', unit: 'stops', precision: 1, higherIsBetter: true, bar: true, hint: 'How much shadow and highlight detail survives in a single RAW exposure.' },
    { key: 'isoMax', label: 'Max native ISO', group: 'camera', kind: 'number', higherIsBetter: true, bar: true },
    { key: 'lowLightScore', label: 'Low-light score', group: 'camera', kind: 'number', unit: '/100', higherIsBetter: true, bar: true },
    { key: 'ibisStops', label: 'In-body stabilisation', group: 'camera', kind: 'number', unit: 'stops', precision: 1, higherIsBetter: true, bar: true },
    { key: 'mountType', label: 'Lens mount', group: 'camera', kind: 'enum', enumOrder: MOUNT_TYPE, higherIsBetter: null },
    { key: 'mount', label: 'Mount', group: 'camera', kind: 'text', higherIsBetter: null },

    { key: 'burstMech', label: 'Burst (mechanical)', group: 'performance', kind: 'number', unit: 'fps', precision: 1, higherIsBetter: true, bar: true },
    { key: 'burstElec', label: 'Burst (electronic)', group: 'performance', kind: 'number', unit: 'fps', precision: 1, higherIsBetter: true, bar: true },
    { key: 'afPoints', label: 'AF points', group: 'performance', kind: 'number', higherIsBetter: true, bar: true },
    { key: 'afScore', label: 'Autofocus score', group: 'performance', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Subject detection reliability and tracking hit-rate across our test set.' },
    { key: 'subjectDetect', label: 'AI subject detection', group: 'performance', kind: 'bool', higherIsBetter: true },
    { key: 'bufferRaw', label: 'RAW buffer', group: 'performance', kind: 'number', unit: 'frames', higherIsBetter: true, bar: true },
    { key: 'videoMax', label: 'Max video', group: 'performance', kind: 'enum', enumOrder: VIDEO, higherIsBetter: true },
    { key: 'tenBit', label: '10-bit internal', group: 'performance', kind: 'bool', higherIsBetter: true },
    { key: 'logProfile', label: 'Log profile', group: 'performance', kind: 'bool', higherIsBetter: true },
    { key: 'noRecordLimit', label: 'Unlimited recording', group: 'performance', kind: 'bool', higherIsBetter: true },

    { key: 'evfDots', label: 'Viewfinder resolution', group: 'display', kind: 'number', unit: 'M dots', precision: 2, higherIsBetter: true, bar: true },
    { key: 'evfMag', label: 'Viewfinder magnification', group: 'display', kind: 'number', unit: '×', precision: 2, higherIsBetter: true },
    { key: 'screenType', label: 'Rear screen', group: 'display', kind: 'enum', enumOrder: SCREEN, higherIsBetter: true },
    { key: 'screenDots', label: 'Screen resolution', group: 'display', kind: 'number', unit: 'M dots', precision: 2, higherIsBetter: true },

    { key: 'shotsPerCharge', label: 'Shots per charge', group: 'battery', kind: 'number', higherIsBetter: true, bar: true, hint: 'CIPA rating. Real-world counts are typically 1.5–2× higher.' },
    { key: 'usbCharging', label: 'USB-C charging', group: 'battery', kind: 'bool', higherIsBetter: true },

    { key: 'cardSlots', label: 'Card slots', group: 'storage', kind: 'number', higherIsBetter: true },
    { key: 'cfExpress', label: 'CFexpress support', group: 'storage', kind: 'bool', higherIsBetter: true },

    { key: 'weight', label: 'Weight (with battery)', group: 'build', kind: 'number', unit: 'g', higherIsBetter: false, bar: true },
    { key: 'weatherSealed', label: 'Weather sealing', group: 'build', kind: 'bool', higherIsBetter: true },
    { key: 'ergonomicsScore', label: 'Handling score', group: 'build', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Grip depth, control layout and menu design assessed over a full day of shooting.' },

    { key: 'wifi', label: 'Wi-Fi', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'usbTethering', label: 'USB tethering', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'headphoneOut', label: 'Headphone jack', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'micIn', label: 'Microphone input', group: 'connectivity', kind: 'bool', higherIsBetter: true },

    ...commercialSpecs,
  ],

  pillars: [
    { id: 'image', label: 'Image quality', short: 'Image', hint: 'Sensor size, resolution, dynamic range and low-light performance.', weights: { sensorFormat: 0.25, dynamicRange: 0.25, lowLightScore: 0.25, megapixels: 0.15, isoMax: 0.1 } },
    { id: 'speed', label: 'Speed & autofocus', short: 'AF', hint: 'Burst rates, buffer depth and how reliably it locks on.', weights: { afScore: 0.4, burstElec: 0.2, burstMech: 0.15, bufferRaw: 0.15, afPoints: 0.1 } },
    { id: 'video', label: 'Video', short: 'Video', hint: 'Codecs, resolution, stabilisation and recording limits.', weights: { videoMax: 0.35, tenBit: 0.15, logProfile: 0.15, ibisStops: 0.2, noRecordLimit: 0.15 } },
    { id: 'handling', label: 'Handling', short: 'Feel', hint: 'Ergonomics, viewfinder, screen articulation and sealing.', weights: { ergonomicsScore: 0.35, evfDots: 0.25, screenType: 0.2, weatherSealed: 0.2 } },
    { id: 'endurance', label: 'Endurance', short: 'Stamina', hint: 'Battery life, card slots and weight in the bag.', weights: { shotsPerCharge: 0.45, cardSlots: 0.2, weight: 0.25, usbCharging: 0.1 } },
    { id: 'value', label: 'Value', short: 'Value', hint: 'Body price against capability.', weights: { price: 1 } },
  ],

  personas: [
    { id: 'budget', label: 'Budget buyers', icon: 'PiggyBank', blurb: 'Most camera per dollar', weights: { value: 10, image: 2, speed: 1 } },
    { id: 'photography', label: 'Stills photography', icon: 'Aperture', blurb: 'Files that hold up to heavy edits', weights: { image: 10, handling: 5, speed: 4 } },
    { id: 'video', label: 'Video & filmmaking', icon: 'Video', blurb: 'Codecs, stabilisation, no limits', weights: { video: 10, image: 5, handling: 4 } },
    { id: 'action', label: 'Sports & wildlife', icon: 'Bird', blurb: 'Tracking that keeps up', weights: { speed: 10, endurance: 5, handling: 4 } },
    { id: 'travel', label: 'Travel & street', icon: 'Backpack', blurb: 'Small, quiet, all-day', weights: { endurance: 9, handling: 7, image: 5 } },
    { id: 'endurance', label: 'Battery life', icon: 'BatteryCharging', blurb: 'Shoot all day on one cell', weights: { endurance: 10, value: 2 } },
  ],

  quickFilters: [
    { id: 'under-2000', label: 'Under $2,000', test: (p) => p.price < 2000 },
    { id: 'full-frame', label: 'Full-frame', test: (p) => p.specs.sensorFormat === 'Full-frame' },
    { id: 'ibis', label: 'In-body stabilisation', test: (p) => Number(p.specs.ibisStops ?? 0) > 0 },
    { id: 'dual-slot', label: 'Dual card slots', test: (p) => Number(p.specs.cardSlots ?? 0) >= 2 },
    { id: 'fast-burst', label: '20fps+', test: (p) => Number(p.specs.burstElec ?? 0) >= 20 },
    { id: 'light', label: 'Under 600g', test: (p) => Number(p.specs.weight ?? 9999) < 600 },
    { id: 'vari-angle', label: 'Vari-angle screen', test: (p) => p.specs.screenType === 'Vari-angle touchscreen' },
  ],
}

const p = (
  id: string, name: string, brand: string, price: number, releaseYear: number,
  rating: number, tagline: string, specs: Product['specs'],
): Product => ({ id, name, brand, category: 'cameras', price, releaseYear, rating, tagline, accent: accentFor(brand), specs })

export const cameraProducts: Product[] = [
  p('sony-a7-iv', 'A7 IV', 'Sony', 2498, 2021, 4.6,
    'The hybrid default: 33MP stills, strong video and the best AF in its class.', {
      sensorFormat: 'Full-frame', megapixels: 33, dynamicRange: 14.7, isoMax: 51200, lowLightScore: 86, ibisStops: 5.5,
      mountType: 'Interchangeable', mount: 'Sony E',
      burstMech: 10, burstElec: 10, afPoints: 759, afScore: 94, subjectDetect: true, bufferRaw: 828,
      videoMax: '4K60', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 3.68, evfMag: 0.78, screenType: 'Vari-angle touchscreen', screenDots: 1.03,
      shotsPerCharge: 580, usbCharging: true, cardSlots: 2, cfExpress: true,
      weight: 658, weatherSealed: true, ergonomicsScore: 88,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
  p('sony-a7c-ii', 'A7C II', 'Sony', 2198, 2023, 4.4,
    'The same 33MP sensor in a body 150g lighter — at the cost of the viewfinder.', {
      sensorFormat: 'Full-frame', megapixels: 33, dynamicRange: 14.7, isoMax: 51200, lowLightScore: 86, ibisStops: 7,
      mountType: 'Interchangeable', mount: 'Sony E',
      burstMech: 10, burstElec: 10, afPoints: 759, afScore: 94, subjectDetect: true, bufferRaw: 1000,
      videoMax: '4K60', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 2.36, evfMag: 0.7, screenType: 'Vari-angle touchscreen', screenDots: 1.03,
      shotsPerCharge: 530, usbCharging: true, cardSlots: 1, cfExpress: false,
      weight: 514, weatherSealed: true, ergonomicsScore: 78,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
  p('canon-r6-ii', 'EOS R6 Mark II', 'Canon', 2499, 2022, 4.7,
    '40fps silent bursts and the most confident subject tracking here.', {
      sensorFormat: 'Full-frame', megapixels: 24.2, dynamicRange: 14.6, isoMax: 102400, lowLightScore: 90, ibisStops: 8,
      mountType: 'Interchangeable', mount: 'Canon RF',
      burstMech: 12, burstElec: 40, afPoints: 1053, afScore: 96, subjectDetect: true, bufferRaw: 140,
      videoMax: '4K60', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 3.69, evfMag: 0.76, screenType: 'Vari-angle touchscreen', screenDots: 1.62,
      shotsPerCharge: 580, usbCharging: true, cardSlots: 2, cfExpress: false,
      weight: 670, weatherSealed: true, ergonomicsScore: 92,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
  p('canon-r8', 'EOS R8', 'Canon', 1499, 2023, 4.3,
    'R6 II image quality and autofocus for $1,000 less. You give up IBIS and battery.', {
      sensorFormat: 'Full-frame', megapixels: 24.2, dynamicRange: 14.5, isoMax: 102400, lowLightScore: 89, ibisStops: 0,
      mountType: 'Interchangeable', mount: 'Canon RF',
      burstMech: 6, burstElec: 40, afPoints: 1053, afScore: 95, subjectDetect: true, bufferRaw: 120,
      videoMax: '4K60', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 2.36, evfMag: 0.7, screenType: 'Vari-angle touchscreen', screenDots: 1.62,
      shotsPerCharge: 290, usbCharging: true, cardSlots: 1, cfExpress: false,
      weight: 461, weatherSealed: true, ergonomicsScore: 80,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
  p('nikon-z6-iii', 'Z6 III', 'Nikon', 2497, 2024, 4.6,
    'The first partially-stacked sensor at this price — 6K open gate and 20fps RAW.', {
      sensorFormat: 'Full-frame', megapixels: 24.5, dynamicRange: 14.2, isoMax: 64000, lowLightScore: 87, ibisStops: 8,
      mountType: 'Interchangeable', mount: 'Nikon Z',
      burstMech: 14, burstElec: 20, afPoints: 299, afScore: 92, subjectDetect: true, bufferRaw: 200,
      videoMax: '6K30 open gate', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 5.76, evfMag: 0.8, screenType: 'Vari-angle touchscreen', screenDots: 2.1,
      shotsPerCharge: 390, usbCharging: true, cardSlots: 2, cfExpress: true,
      weight: 760, weatherSealed: true, ergonomicsScore: 90,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
  p('fuji-xt5', 'X-T5', 'Fujifilm', 1699, 2022, 4.6,
    '40MP APS-C with real dials — the enthusiast stills camera of the generation.', {
      sensorFormat: 'APS-C', megapixels: 40.2, dynamicRange: 13.9, isoMax: 12800, lowLightScore: 76, ibisStops: 7,
      mountType: 'Interchangeable', mount: 'Fujifilm X',
      burstMech: 15, burstElec: 20, afPoints: 425, afScore: 82, subjectDetect: true, bufferRaw: 119,
      videoMax: '6K30', tenBit: true, logProfile: true, noRecordLimit: false,
      evfDots: 3.69, evfMag: 0.8, screenType: 'Three-way tilt', screenDots: 1.84,
      shotsPerCharge: 580, usbCharging: true, cardSlots: 2, cfExpress: false,
      weight: 557, weatherSealed: true, ergonomicsScore: 87,
      wifi: true, usbTethering: true, headphoneOut: false, micIn: true,
    }),
  p('fuji-x100vi', 'X100VI', 'Fujifilm', 1599, 2024, 4.5,
    'A fixed 35mm-equivalent lens, IBIS, and a hybrid viewfinder. Nothing else is like it.', {
      sensorFormat: 'APS-C', megapixels: 40.2, dynamicRange: 13.9, isoMax: 12800, lowLightScore: 75, ibisStops: 6,
      mountType: 'Fixed lens', mount: 'Fixed 23mm f/2',
      burstMech: 11, burstElec: 20, afPoints: 425, afScore: 80, subjectDetect: true, bufferRaw: 38,
      videoMax: '6K30', tenBit: true, logProfile: true, noRecordLimit: false,
      evfDots: 3.69, evfMag: 0.66, screenType: 'Tilting touchscreen', screenDots: 1.62,
      shotsPerCharge: 450, usbCharging: true, cardSlots: 1, cfExpress: false,
      weight: 521, weatherSealed: false, ergonomicsScore: 84,
      wifi: true, usbTethering: true, headphoneOut: false, micIn: true,
    }),
  p('lumix-s5-ii', 'Lumix S5 II', 'Panasonic', 1999, 2023, 4.5,
    'The video specialist: unlimited 6K open gate recording with a cooling fan.', {
      sensorFormat: 'Full-frame', megapixels: 24.2, dynamicRange: 14.5, isoMax: 51200, lowLightScore: 85, ibisStops: 6.5,
      mountType: 'Interchangeable', mount: 'L-mount',
      burstMech: 9, burstElec: 30, afPoints: 779, afScore: 85, subjectDetect: true, bufferRaw: 200,
      videoMax: '6K30 open gate', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 3.68, evfMag: 0.78, screenType: 'Vari-angle touchscreen', screenDots: 1.84,
      shotsPerCharge: 370, usbCharging: true, cardSlots: 2, cfExpress: false,
      weight: 740, weatherSealed: true, ergonomicsScore: 86,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
  p('om-1-ii', 'OM-1 Mark II', 'OM System', 2399, 2024, 4.4,
    'Computational photography and 120fps bursts in the lightest weather-sealed body here.', {
      sensorFormat: 'Micro Four Thirds', megapixels: 20.4, dynamicRange: 12.8, isoMax: 25600, lowLightScore: 66, ibisStops: 8.5,
      mountType: 'Interchangeable', mount: 'Micro Four Thirds',
      burstMech: 10, burstElec: 120, afPoints: 1053, afScore: 88, subjectDetect: true, bufferRaw: 213,
      videoMax: '4K60', tenBit: true, logProfile: true, noRecordLimit: true,
      evfDots: 5.76, evfMag: 0.83, screenType: 'Vari-angle touchscreen', screenDots: 1.62,
      shotsPerCharge: 500, usbCharging: true, cardSlots: 2, cfExpress: false,
      weight: 599, weatherSealed: true, ergonomicsScore: 89,
      wifi: true, usbTethering: true, headphoneOut: true, micIn: true,
    }),
]
