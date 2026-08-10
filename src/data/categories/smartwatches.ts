import type { Category, Product } from '@/types'
import { accentFor, commercialSpecs } from '../shared'

const GLASS = ['Sapphire crystal', 'Gorilla Glass DX', 'Gorilla Glass 3', 'Ion-X glass']
const CASE = ['Titanium', 'Stainless steel', 'Aluminium', 'Fibre-reinforced polymer']
const GNSS = ['Dual-band multi-GNSS', 'Multi-GNSS', 'GPS only']
const WATER = ['100 m / EN13319', '10 ATM', '5 ATM', 'IP68']

export const smartwatchesCategory: Category = {
  id: 'smartwatches',
  label: 'Smartwatches',
  singular: 'watch',
  plural: 'watches',
  icon: 'Watch',
  blurb: 'Health trackers, running watches and full-fat smartwatches side by side.',
  groupOrder: ['display', 'health', 'features', 'battery', 'build', 'connectivity', 'price'],
  cardSpecs: ['caseSize', 'batteryLifeDays', 'platform', 'weight'],
  headlineSpecs: ['platform', 'caseSize', 'batteryLifeDays', 'gnss'],

  specs: [
    { key: 'screenSize', label: 'Display size', group: 'display', kind: 'number', unit: '"', precision: 2, higherIsBetter: true, bar: true },
    { key: 'resolution', label: 'Resolution', group: 'display', kind: 'text', higherIsBetter: null },
    { key: 'brightness', label: 'Peak brightness', group: 'display', kind: 'number', unit: 'nits', higherIsBetter: true, bar: true, hint: 'Above 2000 nits stays readable mid-run in direct summer sun.' },
    { key: 'alwaysOn', label: 'Always-on display', group: 'display', kind: 'bool', higherIsBetter: true },
    { key: 'glass', label: 'Lens material', group: 'display', kind: 'enum', enumOrder: GLASS, higherIsBetter: true, hint: 'Sapphire resists scratches far better than any coated glass.' },

    { key: 'hrSensor', label: 'Optical heart rate', group: 'health', kind: 'bool', higherIsBetter: true },
    { key: 'ecg', label: 'ECG', group: 'health', kind: 'bool', higherIsBetter: true },
    { key: 'spo2', label: 'Blood oxygen', group: 'health', kind: 'bool', higherIsBetter: true },
    { key: 'bodyTemp', label: 'Skin temperature', group: 'health', kind: 'bool', higherIsBetter: true },
    { key: 'afibAlerts', label: 'Irregular rhythm alerts', group: 'health', kind: 'bool', higherIsBetter: true },
    { key: 'sleepScore', label: 'Sleep tracking depth', group: 'health', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Our score for stage accuracy, recovery metrics and how actionable the reporting is.' },
    { key: 'hrAccuracy', label: 'HR accuracy score', group: 'health', kind: 'number', unit: '/100', higherIsBetter: true, bar: true, hint: 'Deviation from a chest strap across interval and steady-state testing.' },

    { key: 'gnss', label: 'GPS', group: 'features', kind: 'enum', enumOrder: GNSS, higherIsBetter: true, hint: 'Dual-band receivers hold a fix in cities and under tree cover far better.' },
    { key: 'sportModes', label: 'Sport modes', group: 'features', kind: 'number', higherIsBetter: true, bar: true },
    { key: 'maps', label: 'Offline maps', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'musicStorage', label: 'On-device music', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'storage', label: 'Storage', group: 'features', kind: 'number', unit: 'GB', higherIsBetter: true },
    { key: 'appEcosystem', label: 'Third-party apps', group: 'features', kind: 'number', unit: '/100', higherIsBetter: true, bar: true },

    { key: 'batteryLifeDays', label: 'Smartwatch mode', group: 'battery', kind: 'number', unit: 'days', precision: 1, higherIsBetter: true, bar: true },
    { key: 'gpsBatteryHrs', label: 'GPS runtime', group: 'battery', kind: 'number', unit: 'h', higherIsBetter: true, bar: true, hint: 'Continuous dual-band GPS with the screen on — the number that decides marathon suitability.' },
    { key: 'chargeTimeMin', label: '0–100% charge', group: 'battery', kind: 'number', unit: 'min', higherIsBetter: false, bar: true },

    { key: 'caseSize', label: 'Case size', group: 'build', kind: 'number', unit: 'mm', precision: 1, higherIsBetter: null },
    { key: 'weight', label: 'Weight (no strap)', group: 'build', kind: 'number', unit: 'g', higherIsBetter: false, bar: true },
    { key: 'thickness', label: 'Thickness', group: 'build', kind: 'number', unit: 'mm', precision: 1, higherIsBetter: false, bar: true },
    { key: 'caseMaterial', label: 'Case material', group: 'build', kind: 'enum', enumOrder: CASE, higherIsBetter: true },
    { key: 'waterRating', label: 'Water resistance', group: 'build', kind: 'enum', enumOrder: WATER, higherIsBetter: true },

    { key: 'platform', label: 'Platform', group: 'connectivity', kind: 'text', higherIsBetter: null },
    { key: 'iosCompatible', label: 'Works with iPhone', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'androidCompatible', label: 'Works with Android', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'lte', label: 'LTE option', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'nfcPay', label: 'Contactless payments', group: 'connectivity', kind: 'bool', higherIsBetter: true },
    { key: 'speaker', label: 'Speaker & mic', group: 'connectivity', kind: 'bool', higherIsBetter: true },

    ...commercialSpecs,
  ],

  pillars: [
    { id: 'display', label: 'Display', short: 'Screen', hint: 'Size, brightness and lens durability.', weights: { screenSize: 0.25, brightness: 0.35, glass: 0.25, alwaysOn: 0.15 } },
    { id: 'health', label: 'Health', short: 'Health', hint: 'Sensor suite plus how accurate and actionable the data is.', weights: { hrAccuracy: 0.3, sleepScore: 0.25, ecg: 0.15, spo2: 0.1, bodyTemp: 0.1, afibAlerts: 0.1 } },
    { id: 'sport', label: 'Training', short: 'Sport', hint: 'GPS quality, sport coverage, navigation and music.', weights: { gnss: 0.35, sportModes: 0.25, maps: 0.2, musicStorage: 0.2 } },
    { id: 'battery', label: 'Battery', short: 'Power', hint: 'Days between charges and GPS endurance.', weights: { batteryLifeDays: 0.5, gpsBatteryHrs: 0.35, chargeTimeMin: 0.15 } },
    { id: 'smart', label: 'Smart features', short: 'Smart', hint: 'App ecosystem, payments, calls and connectivity.', weights: { appEcosystem: 0.4, nfcPay: 0.2, speaker: 0.2, lte: 0.2 } },
    { id: 'value', label: 'Value', short: 'Value', hint: 'Price against everything above.', weights: { price: 0.85, storage: 0.15 } },
  ],

  personas: [
    { id: 'budget', label: 'Budget buyers', icon: 'PiggyBank', blurb: 'Most watch per dollar', weights: { value: 10, health: 2, battery: 2 } },
    { id: 'health', label: 'Health tracking', icon: 'HeartPulse', blurb: 'Sensors and sleep insight', weights: { health: 10, battery: 4, smart: 3 } },
    { id: 'running', label: 'Running & training', icon: 'Footprints', blurb: 'GPS accuracy and race-day endurance', weights: { sport: 10, battery: 7, display: 3 } },
    { id: 'outdoors', label: 'Outdoors & adventure', icon: 'Mountain', blurb: 'Maps, toughness, multi-day battery', weights: { sport: 9, battery: 9, display: 5 } },
    { id: 'endurance', label: 'Battery life', icon: 'BatteryCharging', blurb: 'Weeks, not days', weights: { battery: 10, value: 2 } },
    { id: 'everyday', label: 'Everyday smartwatch', icon: 'Sparkles', blurb: 'Notifications, apps, payments', weights: { smart: 10, display: 6, health: 4 } },
  ],

  quickFilters: [
    { id: 'under-400', label: 'Under $400', test: (p) => p.price < 400 },
    { id: 'ecg', label: 'Has ECG', test: (p) => p.specs.ecg === true },
    { id: 'dual-gnss', label: 'Dual-band GPS', test: (p) => String(p.specs.gnss).startsWith('Dual') },
    { id: 'maps', label: 'Offline maps', test: (p) => p.specs.maps === true },
    { id: 'week', label: '5+ day battery', test: (p) => Number(p.specs.batteryLifeDays ?? 0) >= 5 },
    { id: 'sapphire', label: 'Sapphire lens', test: (p) => p.specs.glass === 'Sapphire crystal' },
    { id: 'cross-platform', label: 'iOS + Android', test: (p) => p.specs.iosCompatible === true && p.specs.androidCompatible === true },
  ],
}

const p = (
  id: string, name: string, brand: string, price: number, releaseYear: number,
  rating: number, tagline: string, specs: Product['specs'],
): Product => ({ id, name, brand, category: 'smartwatches', price, releaseYear, rating, tagline, accent: accentFor(brand), specs })

export const smartwatchProducts: Product[] = [
  p('apple-watch-ultra-2', 'Apple Watch Ultra 2', 'Apple', 799, 2023, 4.6,
    'The best smartwatch experience in a case that survives a dive trip.', {
      screenSize: 1.92, resolution: '410 × 502', brightness: 3000, alwaysOn: true, glass: 'Sapphire crystal',
      hrSensor: true, ecg: true, spo2: true, bodyTemp: true, afibAlerts: true, sleepScore: 78, hrAccuracy: 88,
      gnss: 'Dual-band multi-GNSS', sportModes: 80, maps: true, musicStorage: true, storage: 64, appEcosystem: 98,
      batteryLifeDays: 2.5, gpsBatteryHrs: 12, chargeTimeMin: 75,
      caseSize: 49, weight: 61.4, thickness: 14.4, caseMaterial: 'Titanium', waterRating: '100 m / EN13319',
      platform: 'watchOS', iosCompatible: true, androidCompatible: false, lte: true, nfcPay: true, speaker: true,
    }),
  p('apple-watch-s10', 'Apple Watch Series 10', 'Apple', 399, 2024, 4.5,
    'The thinnest, best-screened everyday smartwatch — if you carry an iPhone.', {
      screenSize: 1.96, resolution: '416 × 496', brightness: 2000, alwaysOn: true, glass: 'Ion-X glass',
      hrSensor: true, ecg: true, spo2: true, bodyTemp: true, afibAlerts: true, sleepScore: 76, hrAccuracy: 87,
      gnss: 'Dual-band multi-GNSS', sportModes: 80, maps: true, musicStorage: true, storage: 64, appEcosystem: 98,
      batteryLifeDays: 1.5, gpsBatteryHrs: 8, chargeTimeMin: 60,
      caseSize: 46, weight: 36.4, thickness: 9.7, caseMaterial: 'Aluminium', waterRating: '5 ATM',
      platform: 'watchOS', iosCompatible: true, androidCompatible: false, lte: true, nfcPay: true, speaker: true,
    }),
  p('galaxy-watch-ultra', 'Galaxy Watch Ultra', 'Samsung', 649, 2024, 4.2,
    'Samsung’s rugged answer, with the longest battery of any Wear OS watch.', {
      screenSize: 1.5, resolution: '480 × 480', brightness: 3000, alwaysOn: true, glass: 'Sapphire crystal',
      hrSensor: true, ecg: true, spo2: true, bodyTemp: true, afibAlerts: true, sleepScore: 82, hrAccuracy: 84,
      gnss: 'Dual-band multi-GNSS', sportModes: 100, maps: true, musicStorage: true, storage: 32, appEcosystem: 82,
      batteryLifeDays: 3, gpsBatteryHrs: 20, chargeTimeMin: 80,
      caseSize: 47, weight: 60.5, thickness: 12.1, caseMaterial: 'Titanium', waterRating: '10 ATM',
      platform: 'Wear OS', iosCompatible: false, androidCompatible: true, lte: true, nfcPay: true, speaker: true,
    }),
  p('galaxy-watch-7', 'Galaxy Watch 7', 'Samsung', 299, 2024, 4.1,
    'The default Android smartwatch: strong sensors, unremarkable battery.', {
      screenSize: 1.5, resolution: '480 × 480', brightness: 2000, alwaysOn: true, glass: 'Sapphire crystal',
      hrSensor: true, ecg: true, spo2: true, bodyTemp: true, afibAlerts: true, sleepScore: 82, hrAccuracy: 83,
      gnss: 'Dual-band multi-GNSS', sportModes: 100, maps: true, musicStorage: true, storage: 32, appEcosystem: 82,
      batteryLifeDays: 1.5, gpsBatteryHrs: 12, chargeTimeMin: 75,
      caseSize: 44, weight: 33.8, thickness: 9.7, caseMaterial: 'Aluminium', waterRating: '5 ATM',
      platform: 'Wear OS', iosCompatible: false, androidCompatible: true, lte: true, nfcPay: true, speaker: true,
    }),
  p('garmin-fenix-8', 'Fenix 8 (47mm AMOLED)', 'Garmin', 999, 2024, 4.6,
    'Sixteen days of battery, full offline maps, and dive-rated. The serious option.', {
      screenSize: 1.4, resolution: '454 × 454', brightness: 2000, alwaysOn: true, glass: 'Sapphire crystal',
      hrSensor: true, ecg: true, spo2: true, bodyTemp: true, afibAlerts: false, sleepScore: 92, hrAccuracy: 90,
      gnss: 'Dual-band multi-GNSS', sportModes: 100, maps: true, musicStorage: true, storage: 32, appEcosystem: 62,
      batteryLifeDays: 16, gpsBatteryHrs: 47, chargeTimeMin: 120,
      caseSize: 47, weight: 73, thickness: 13.8, caseMaterial: 'Titanium', waterRating: '100 m / EN13319',
      platform: 'Garmin OS', iosCompatible: true, androidCompatible: true, lte: false, nfcPay: true, speaker: true,
    }),
  p('garmin-fr-265', 'Forerunner 265', 'Garmin', 449, 2023, 4.5,
    'A running watch first: 20 hours of GPS in a 47g case.', {
      screenSize: 1.3, resolution: '416 × 416', brightness: 1000, alwaysOn: true, glass: 'Gorilla Glass 3',
      hrSensor: true, ecg: false, spo2: true, bodyTemp: false, afibAlerts: false, sleepScore: 90, hrAccuracy: 89,
      gnss: 'Dual-band multi-GNSS', sportModes: 45, maps: false, musicStorage: true, storage: 8, appEcosystem: 62,
      batteryLifeDays: 13, gpsBatteryHrs: 20, chargeTimeMin: 100,
      caseSize: 46.1, weight: 47, thickness: 12.9, caseMaterial: 'Fibre-reinforced polymer', waterRating: '5 ATM',
      platform: 'Garmin OS', iosCompatible: true, androidCompatible: true, lte: false, nfcPay: true, speaker: false,
    }),
  p('pixel-watch-3-45', 'Pixel Watch 3 (45mm)', 'Google', 399, 2024, 4.2,
    'The best-looking Wear OS watch, with Fitbit’s tracking underneath.', {
      screenSize: 1.45, resolution: '456 × 456', brightness: 2000, alwaysOn: true, glass: 'Gorilla Glass 3',
      hrSensor: true, ecg: true, spo2: true, bodyTemp: false, afibAlerts: true, sleepScore: 88, hrAccuracy: 86,
      gnss: 'Dual-band multi-GNSS', sportModes: 40, maps: true, musicStorage: true, storage: 32, appEcosystem: 84,
      batteryLifeDays: 1.5, gpsBatteryHrs: 12, chargeTimeMin: 60,
      caseSize: 45, weight: 37, thickness: 12.3, caseMaterial: 'Aluminium', waterRating: '5 ATM',
      platform: 'Wear OS', iosCompatible: false, androidCompatible: true, lte: true, nfcPay: true, speaker: true,
    }),
  p('amazfit-balance', 'Amazfit Balance', 'Amazfit', 229, 2023, 4,
    'Two weeks of battery and dual-band GPS for the price of a cheap fitness band.', {
      screenSize: 1.5, resolution: '480 × 480', brightness: 1500, alwaysOn: true, glass: 'Gorilla Glass 3',
      hrSensor: true, ecg: false, spo2: true, bodyTemp: false, afibAlerts: false, sleepScore: 74, hrAccuracy: 76,
      gnss: 'Dual-band multi-GNSS', sportModes: 150, maps: true, musicStorage: true, storage: 4, appEcosystem: 38,
      batteryLifeDays: 14, gpsBatteryHrs: 26, chargeTimeMin: 120,
      caseSize: 46, weight: 35, thickness: 10.6, caseMaterial: 'Aluminium', waterRating: '5 ATM',
      platform: 'Zepp OS', iosCompatible: true, androidCompatible: true, lte: false, nfcPay: false, speaker: true,
    }),
]
