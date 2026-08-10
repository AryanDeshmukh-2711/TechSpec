import type { Category, Product } from '@/types'
import { accentFor, commercialSpecs } from '../shared'

const PANEL = ['Tandem OLED', 'OLED', 'Mini-LED', 'IPS LCD']
const VIDEO = ['4K120', '4K60', '4K30', '1080p60']
const WIFI = ['Wi-Fi 7', 'Wi-Fi 6E', 'Wi-Fi 6']
const USB = ['Thunderbolt / USB 4', 'USB 3.2 Gen 1', 'USB 2.0']

export const tabletsCategory: Category = {
  id: 'tablets',
  label: 'Tablets',
  singular: 'tablet',
  plural: 'tablets',
  icon: 'Tablet',
  blurb: 'From note-taking slates to laptop-replacement flagships.',
  groupOrder: ['display', 'performance', 'battery', 'features', 'storage', 'build', 'camera', 'price'],
  cardSpecs: ['screenSize', 'chipset', 'ram', 'weight'],
  headlineSpecs: ['chipset', 'screenSize', 'ram', 'storage'],

  specs: [
    { key: 'screenSize', label: 'Screen size', group: 'display', kind: 'number', unit: '"', precision: 1, higherIsBetter: true, bar: true },
    { key: 'resolution', label: 'Resolution', group: 'display', kind: 'text', higherIsBetter: null },
    { key: 'ppi', label: 'Pixel density', group: 'display', kind: 'number', unit: 'ppi', higherIsBetter: true, bar: true },
    { key: 'refreshRate', label: 'Refresh rate', group: 'display', kind: 'number', unit: 'Hz', higherIsBetter: true, bar: true },
    { key: 'brightness', label: 'Peak brightness', group: 'display', kind: 'number', unit: 'nits', higherIsBetter: true, bar: true },
    {
      key: 'panelType',
      label: 'Panel type',
      group: 'display',
      kind: 'enum',
      enumOrder: PANEL,
      higherIsBetter: true,
      hint: 'Tandem OLED stacks two emissive layers for higher sustained brightness and longer life.',
    },
    { key: 'laminated', label: 'Laminated display', group: 'display', kind: 'bool', higherIsBetter: true, hint: 'No air gap between glass and panel — matters a lot when drawing with a stylus.' },

    { key: 'chipset', label: 'Chipset', group: 'performance', kind: 'text', higherIsBetter: null },
    { key: 'antutu', label: 'AnTuTu v10', group: 'performance', kind: 'number', higherIsBetter: true, bar: true },
    { key: 'gbSingle', label: 'Geekbench single', group: 'performance', kind: 'number', higherIsBetter: true, bar: true },
    { key: 'gbMulti', label: 'Geekbench multi', group: 'performance', kind: 'number', higherIsBetter: true, bar: true },
    { key: 'ram', label: 'Memory', group: 'performance', kind: 'number', unit: 'GB', higherIsBetter: true, bar: true },

    { key: 'batteryWh', label: 'Battery capacity', group: 'battery', kind: 'number', unit: 'Wh', precision: 1, higherIsBetter: true, bar: true },
    { key: 'batteryLifeHrs', label: 'Video playback', group: 'battery', kind: 'number', unit: 'h', precision: 1, higherIsBetter: true, bar: true },
    { key: 'chargeWired', label: 'Charging', group: 'battery', kind: 'number', unit: 'W', higherIsBetter: true },

    { key: 'penSupport', label: 'Active stylus', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'penIncluded', label: 'Stylus in the box', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'keyboardSupport', label: 'First-party keyboard', group: 'features', kind: 'bool', higherIsBetter: true },
    { key: 'speakers', label: 'Speakers', group: 'features', kind: 'number', higherIsBetter: true },
    { key: 'desktopMode', label: 'Desktop-class mode', group: 'features', kind: 'bool', higherIsBetter: true, hint: 'Stage Manager, DeX or an equivalent windowed multitasking mode.' },

    { key: 'storage', label: 'Base storage', group: 'storage', kind: 'number', unit: 'GB', higherIsBetter: true, bar: true },
    { key: 'expandable', label: 'microSD slot', group: 'storage', kind: 'bool', higherIsBetter: true },

    { key: 'weight', label: 'Weight', group: 'build', kind: 'number', unit: 'g', higherIsBetter: false, bar: true },
    { key: 'thickness', label: 'Thickness', group: 'build', kind: 'number', unit: 'mm', precision: 2, higherIsBetter: false, bar: true },
    { key: 'chassis', label: 'Chassis', group: 'build', kind: 'text', higherIsBetter: null },

    { key: 'mainMp', label: 'Rear camera', group: 'camera', kind: 'number', unit: 'MP', higherIsBetter: true },
    { key: 'selfieMp', label: 'Front camera', group: 'camera', kind: 'number', unit: 'MP', higherIsBetter: true },
    { key: 'videoMax', label: 'Max video', group: 'camera', kind: 'enum', enumOrder: VIDEO, higherIsBetter: true },
    { key: 'wifi', label: 'Wi-Fi', group: 'features', kind: 'enum', enumOrder: WIFI, higherIsBetter: true },
    { key: 'usbSpeed', label: 'USB-C speed', group: 'features', kind: 'enum', enumOrder: USB, higherIsBetter: true },

    ...commercialSpecs,
  ],

  pillars: [
    {
      id: 'display',
      label: 'Display',
      short: 'Screen',
      hint: 'Sharpness, brightness, smoothness and lamination.',
      weights: { ppi: 0.2, refreshRate: 0.2, brightness: 0.2, panelType: 0.25, laminated: 0.15 },
    },
    {
      id: 'performance',
      label: 'Performance',
      short: 'Speed',
      hint: 'Raw compute for heavy apps, multitasking and games.',
      weights: { antutu: 0.3, gbMulti: 0.25, gbSingle: 0.2, ram: 0.25 },
    },
    {
      id: 'battery',
      label: 'Battery',
      short: 'Power',
      hint: 'Playback runtime, capacity and charging speed.',
      weights: { batteryLifeHrs: 0.55, batteryWh: 0.25, chargeWired: 0.2 },
    },
    {
      id: 'portability',
      label: 'Portability',
      short: 'Carry',
      hint: 'Weight and thickness in hand.',
      weights: { weight: 0.6, thickness: 0.4 },
    },
    {
      id: 'creation',
      label: 'Creative tools',
      short: 'Create',
      hint: 'Stylus, keyboard, speakers and desktop-class multitasking.',
      weights: { penSupport: 0.2, penIncluded: 0.15, keyboardSupport: 0.2, desktopMode: 0.25, speakers: 0.2 },
    },
    {
      id: 'value',
      label: 'Value',
      short: 'Value',
      hint: 'Price and what you get in the box for it.',
      weights: { price: 0.7, storage: 0.2, penIncluded: 0.1 },
    },
  ],

  personas: [
    { id: 'budget', label: 'Budget buyers', icon: 'PiggyBank', blurb: 'Most tablet per dollar', weights: { value: 10, display: 1, battery: 1 } },
    { id: 'power', label: 'Power users', icon: 'Zap', blurb: 'Laptop replacement duty', weights: { performance: 10, creation: 7, display: 4 } },
    { id: 'gaming', label: 'Gaming', icon: 'Gamepad2', blurb: 'High frame rates and good speakers', weights: { performance: 10, display: 7, battery: 4 } },
    { id: 'creative', label: 'Drawing & notes', icon: 'PenTool', blurb: 'Stylus feel and screen quality', weights: { creation: 10, display: 8, portability: 3 } },
    { id: 'endurance', label: 'Battery life', icon: 'BatteryCharging', blurb: 'Long-haul playback', weights: { battery: 10, portability: 2 } },
    { id: 'portability', label: 'Portability', icon: 'Feather', blurb: 'One-hand, bag-friendly', weights: { portability: 10, battery: 4 } },
  ],

  quickFilters: [
    { id: 'under-600', label: 'Under $600', test: (p) => p.price < 600 },
    { id: 'oled', label: 'OLED screen', test: (p) => String(p.specs.panelType).includes('OLED') },
    { id: 'high-refresh', label: '120Hz', test: (p) => Number(p.specs.refreshRate ?? 0) >= 120 },
    { id: 'pen-included', label: 'Stylus included', test: (p) => p.specs.penIncluded === true },
    { id: 'desktop', label: 'Desktop mode', test: (p) => p.specs.desktopMode === true },
    { id: 'light', label: 'Under 500g', test: (p) => Number(p.specs.weight ?? 9999) < 500 },
  ],
}

const p = (
  id: string, name: string, brand: string, price: number, releaseYear: number,
  rating: number, tagline: string, specs: Product['specs'],
): Product => ({ id, name, brand, category: 'tablets', price, releaseYear, rating, tagline, accent: accentFor(brand), specs })

export const tabletProducts: Product[] = [
  p('ipad-pro-13-m4', 'iPad Pro 13" (M4)', 'Apple', 1299, 2024, 4.7,
    'The thinnest device Apple has ever made, with the best screen on any tablet.', {
      screenSize: 13, resolution: '2752 × 2064', ppi: 264, refreshRate: 120, brightness: 1600,
      panelType: 'Tandem OLED', laminated: true,
      chipset: 'Apple M4', antutu: 2450000, gbSingle: 3700, gbMulti: 14500, ram: 8,
      batteryWh: 38.99, batteryLifeHrs: 10.5, chargeWired: 30,
      penSupport: true, penIncluded: false, keyboardSupport: true, speakers: 4, desktopMode: true,
      storage: 256, expandable: false,
      weight: 579, thickness: 5.1, chassis: 'Aluminium',
      mainMp: 12, selfieMp: 12, videoMax: '4K60', wifi: 'Wi-Fi 6E', usbSpeed: 'Thunderbolt / USB 4',
    }),
  p('ipad-air-13-m3', 'iPad Air 13" (M3)', 'Apple', 799, 2025, 4.5,
    'Most of the Pro experience for $500 less, minus the OLED and 120Hz.', {
      screenSize: 12.9, resolution: '2732 × 2048', ppi: 264, refreshRate: 60, brightness: 600,
      panelType: 'IPS LCD', laminated: true,
      chipset: 'Apple M3', antutu: 1980000, gbSingle: 3100, gbMulti: 11800, ram: 8,
      batteryWh: 36.59, batteryLifeHrs: 10, chargeWired: 20,
      penSupport: true, penIncluded: false, keyboardSupport: true, speakers: 4, desktopMode: true,
      storage: 128, expandable: false,
      weight: 616, thickness: 6.1, chassis: 'Aluminium',
      mainMp: 12, selfieMp: 12, videoMax: '4K60', wifi: 'Wi-Fi 6E', usbSpeed: 'USB 3.2 Gen 1',
    }),
  p('ipad-a16', 'iPad (A16)', 'Apple', 349, 2025, 4.3,
    'The value anchor of the whole category — good enough for almost everyone.', {
      screenSize: 11, resolution: '2360 × 1640', ppi: 264, refreshRate: 60, brightness: 500,
      panelType: 'IPS LCD', laminated: false,
      chipset: 'Apple A16', antutu: 1180000, gbSingle: 2600, gbMulti: 6400, ram: 6,
      batteryWh: 28.93, batteryLifeHrs: 10, chargeWired: 20,
      penSupport: true, penIncluded: false, keyboardSupport: true, speakers: 2, desktopMode: false,
      storage: 128, expandable: false,
      weight: 477, thickness: 7, chassis: 'Aluminium',
      mainMp: 12, selfieMp: 12, videoMax: '4K60', wifi: 'Wi-Fi 6', usbSpeed: 'USB 2.0',
    }),
  p('ipad-mini-a17', 'iPad mini (A17 Pro)', 'Apple', 499, 2024, 4.4,
    'The only genuinely pocketable tablet with flagship-adjacent silicon.', {
      screenSize: 8.3, resolution: '2266 × 1488', ppi: 326, refreshRate: 60, brightness: 500,
      panelType: 'IPS LCD', laminated: true,
      chipset: 'Apple A17 Pro', antutu: 1480000, gbSingle: 2900, gbMulti: 7300, ram: 8,
      batteryWh: 19.3, batteryLifeHrs: 9.5, chargeWired: 20,
      penSupport: true, penIncluded: false, keyboardSupport: false, speakers: 2, desktopMode: false,
      storage: 128, expandable: false,
      weight: 293, thickness: 6.3, chassis: 'Aluminium',
      mainMp: 12, selfieMp: 12, videoMax: '4K60', wifi: 'Wi-Fi 6E', usbSpeed: 'USB 3.2 Gen 1',
    }),
  p('tab-s10-ultra', 'Galaxy Tab S10 Ultra', 'Samsung', 1199, 2024, 4.5,
    'A 14.6-inch OLED with the S Pen included and a real desktop mode.', {
      screenSize: 14.6, resolution: '2960 × 1848', ppi: 239, refreshRate: 120, brightness: 930,
      panelType: 'OLED', laminated: true,
      chipset: 'Dimensity 9300+', antutu: 2150000, gbSingle: 2200, gbMulti: 7100, ram: 12,
      batteryWh: 43.7, batteryLifeHrs: 12, chargeWired: 45,
      penSupport: true, penIncluded: true, keyboardSupport: true, speakers: 4, desktopMode: true,
      storage: 256, expandable: true,
      weight: 718, thickness: 5.4, chassis: 'Aluminium',
      mainMp: 13, selfieMp: 12, videoMax: '4K30', wifi: 'Wi-Fi 7', usbSpeed: 'USB 3.2 Gen 1',
    }),
  p('tab-s10-plus', 'Galaxy Tab S10+', 'Samsung', 999, 2024, 4.4,
    'The Ultra experience at a size you can actually hold, stylus included.', {
      screenSize: 12.4, resolution: '2800 × 1752', ppi: 266, refreshRate: 120, brightness: 930,
      panelType: 'OLED', laminated: true,
      chipset: 'Dimensity 9300+', antutu: 2100000, gbSingle: 2200, gbMulti: 7000, ram: 12,
      batteryWh: 39.1, batteryLifeHrs: 11.5, chargeWired: 45,
      penSupport: true, penIncluded: true, keyboardSupport: true, speakers: 4, desktopMode: true,
      storage: 256, expandable: true,
      weight: 571, thickness: 5.6, chassis: 'Aluminium',
      mainMp: 13, selfieMp: 12, videoMax: '4K30', wifi: 'Wi-Fi 7', usbSpeed: 'USB 3.2 Gen 1',
    }),
  p('oneplus-pad-2', 'OnePlus Pad 2', 'OnePlus', 549, 2024, 4.2,
    'A 144Hz 3K screen and 12GB of RAM for the price of a base iPad Air.', {
      screenSize: 12.1, resolution: '3000 × 2120', ppi: 303, refreshRate: 144, brightness: 900,
      panelType: 'IPS LCD', laminated: true,
      chipset: 'Snapdragon 8 Gen 3', antutu: 2050000, gbSingle: 2100, gbMulti: 6600, ram: 12,
      batteryWh: 36.1, batteryLifeHrs: 11, chargeWired: 67,
      penSupport: true, penIncluded: false, keyboardSupport: true, speakers: 6, desktopMode: false,
      storage: 256, expandable: false,
      weight: 584, thickness: 6.5, chassis: 'Aluminium',
      mainMp: 13, selfieMp: 8, videoMax: '4K30', wifi: 'Wi-Fi 6E', usbSpeed: 'USB 3.2 Gen 1',
    }),
  p('xiaomi-pad-7-pro', 'Xiaomi Pad 7 Pro', 'Xiaomi', 449, 2025, 4.1,
    'The cheapest 3.2K 144Hz tablet here, and it charges at 67W.', {
      screenSize: 11.2, resolution: '3200 × 2136', ppi: 345, refreshRate: 144, brightness: 800,
      panelType: 'IPS LCD', laminated: true,
      chipset: 'Snapdragon 8s Gen 3', antutu: 1560000, gbSingle: 1850, gbMulti: 5000, ram: 8,
      batteryWh: 32.8, batteryLifeHrs: 10.5, chargeWired: 67,
      penSupport: true, penIncluded: false, keyboardSupport: true, speakers: 6, desktopMode: false,
      storage: 256, expandable: false,
      weight: 500, thickness: 6.18, chassis: 'Aluminium',
      mainMp: 50, selfieMp: 32, videoMax: '4K30', wifi: 'Wi-Fi 6E', usbSpeed: 'USB 2.0',
    }),
]
