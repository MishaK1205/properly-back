import * as fs from 'fs';
import mongoose, { Types } from 'mongoose';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as zlib from 'zlib';
import { CompanySchema } from '../src/companies/schemas/company.schema';
import { ImageSchema } from '../src/images/schemas/image.schema';
import { ProjectSchema } from '../src/projects/schemas/project.schema';

const PROJECT_ROOT = path.resolve(__dirname, '..');

function readEnv(key: string, fallback?: string): string {
  if (process.env[key]) {
    return process.env[key] as string;
  }
  const line = fs
    .readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf8')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`) && !entry.startsWith('#'));
  if (line) {
    return line.slice(key.length + 1).trim();
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`${key} not found in environment or .env`);
}

// --- Minimal PNG encoder (no image deps in this project) -------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const payload = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([length, payload, crc]);
}

type Rgb = [number, number, number];

function encodePng(
  width: number,
  height: number,
  pixel: (x: number, y: number) => Rgb,
): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0;
    offset += 1;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixel(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      offset += 3;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Deterministic pseudo-random in [0,1) so re-runs produce identical art. */
function noise(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Stylised exterior render: sky, sun, skyline of towers, water band. */
function renderExterior(
  width: number,
  height: number,
  seed: number,
  palette: { skyTop: Rgb; skyLow: Rgb; water: Rgb; building: Rgb },
): Buffer {
  const horizon = Math.round(height * 0.66);
  const sunX = Math.round(width * (0.2 + noise(seed) * 0.6));
  const sunY = Math.round(horizon * (0.25 + noise(seed + 1) * 0.35));
  const sunR = Math.round(height * 0.06);

  const towerWidth = Math.round(width / 9);
  const towers = Array.from({ length: 10 }, (_, index) => ({
    top: Math.round(horizon - height * (0.12 + noise(seed + index * 3) * 0.34)),
    shade: 0.75 + noise(seed + index * 7) * 0.45,
  }));

  return encodePng(width, height, (x, y) => {
    if (y < horizon) {
      const dx = x - sunX;
      const dy = y - sunY;
      const towerIndex = Math.floor(x / towerWidth);
      const tower = towers[Math.min(towerIndex, towers.length - 1)];

      if (y >= tower.top) {
        const base = mix(
          palette.building,
          [255, 255, 255],
          ((horizon - y) / height) * 0.35,
        );
        const body: Rgb = [
          Math.min(255, Math.round(base[0] * tower.shade)),
          Math.min(255, Math.round(base[1] * tower.shade)),
          Math.min(255, Math.round(base[2] * tower.shade)),
        ];
        const localX = x - towerIndex * towerWidth;
        const isWindow =
          localX > 6 &&
          localX % 22 > 5 &&
          localX % 22 < 17 &&
          y - tower.top > 10 &&
          (y - tower.top) % 30 > 8 &&
          (y - tower.top) % 30 < 22;
        if (isWindow) {
          const lit = noise(seed + towerIndex * 13 + Math.floor(y / 30)) > 0.45;
          return lit ? [255, 226, 158] : mix(body, [40, 52, 68], 0.55);
        }
        if (localX < 3) {
          return mix(body, [0, 0, 0], 0.25);
        }
        return body;
      }

      if (dx * dx + dy * dy < sunR * sunR) {
        return [255, 244, 214];
      }
      const glow = Math.sqrt(dx * dx + dy * dy) / (sunR * 5);
      const sky = mix(palette.skyTop, palette.skyLow, y / horizon);
      return glow < 1 ? mix([255, 238, 198], sky, glow) : sky;
    }

    const depth = (y - horizon) / (height - horizon);
    const water = mix(palette.water, mix(palette.water, [0, 0, 0], 0.4), depth);
    const ripple =
      Math.sin(x * 0.05 + y * 0.35 + seed) * 0.5 +
      Math.sin(x * 0.013 - y * 0.2) * 0.5;
    const highlight = Math.abs(x - sunX) < width * 0.08 ? 0.22 : 0;
    return mix(water, [255, 255, 255], Math.max(0, ripple * 0.09 + highlight));
  });
}

/** Stylised floor plan: outer walls, room partitions, faint measuring grid. */
function renderFloorPlan(
  width: number,
  height: number,
  variant: number,
): Buffer {
  const wall = 9;
  const splitX = Math.round(width * (variant % 2 === 0 ? 0.46 : 0.58));
  const splitY = Math.round(height * (variant % 3 === 0 ? 0.52 : 0.62));
  const balconyY = height - Math.round(height * 0.16);

  return encodePng(width, height, (x, y) => {
    const onOuter =
      x < wall || y < wall || x >= width - wall || y >= height - wall;
    if (onOuter) {
      return [38, 44, 56];
    }

    // Door gaps keep the partitions from reading as sealed boxes.
    const inVerticalDoor =
      y > splitY * 0.34 && y < splitY * 0.34 + height * 0.1;
    const inHorizontalDoor =
      x > splitX + width * 0.14 && x < splitX + width * 0.26;

    if (Math.abs(x - splitX) < wall / 2 && y < balconyY && !inVerticalDoor) {
      return [38, 44, 56];
    }
    if (Math.abs(y - splitY) < wall / 2 && x > splitX && !inHorizontalDoor) {
      return [38, 44, 56];
    }
    if (Math.abs(y - balconyY) < wall / 2) {
      return [120, 132, 148];
    }

    if (y > balconyY) {
      return [226, 234, 238];
    }

    const grid = x % 48 < 1 || y % 48 < 1;
    if (grid) {
      return [226, 228, 232];
    }
    return [249, 249, 246];
  });
}

// --- Seed content ---------------------------------------------------------

interface Trilingual {
  ge: string;
  en: string;
  ru: string;
}

interface CompanySeed {
  companyName: string;
  projectsCompleted: number;
  unitsDelivered: number;
  activeProjects: number;
  operatingSince: number;
  location: Trilingual;
  description: Trilingual;
}

const COMPANIES: CompanySeed[] = [
  {
    companyName: 'Argo Development',
    projectsCompleted: 14,
    unitsDelivered: 2450,
    activeProjects: 3,
    operatingSince: 2006,
    location: {
      ge: 'ბათუმი, საქართველო',
      en: 'Batumi, Georgia',
      ru: 'Батуми, Грузия',
    },
    description: {
      ge: 'Argo Development ბათუმის სანაპირო ზოლში 2006 წლიდან აშენებს საცხოვრებელ და საკურორტო კომპლექსებს. კომპანია სრულ ციკლს ფარავს — მიწის შერჩევიდან მართვის კომპანიის მომსახურებამდე.',
      en: 'Argo Development has been building residential and resort complexes along the Batumi coastline since 2006. The company covers the full cycle, from land assembly to post-handover rental management.',
      ru: 'Argo Development с 2006 года строит жилые и курортные комплексы на побережье Батуми. Компания закрывает полный цикл — от подбора участка до управления арендой после сдачи.',
    },
  },
  {
    companyName: 'Kolkheti Group',
    projectsCompleted: 9,
    unitsDelivered: 1310,
    activeProjects: 2,
    operatingSince: 2011,
    location: {
      ge: 'ქობულეთი, საქართველო',
      en: 'Kobuleti, Georgia',
      ru: 'Кобулети, Грузия',
    },
    description: {
      ge: 'Kolkheti Group სპეციალიზირებულია დაბალსართულიან საკურორტო კვარტლებში კოლხეთის ეროვნული პარკის სიახლოვეს, ენერგოეფექტურ ტექნოლოგიებზე ორიენტაციით.',
      en: 'Kolkheti Group specialises in low-rise resort quarters near Kolkheti National Park, with a focus on energy-efficient building technology.',
      ru: 'Kolkheti Group специализируется на малоэтажных курортных кварталах рядом с Колхетским национальным парком, делая ставку на энергоэффективные технологии.',
    },
  },
  {
    companyName: 'Iberia Estate',
    projectsCompleted: 21,
    unitsDelivered: 3980,
    activeProjects: 5,
    operatingSince: 1998,
    location: {
      ge: 'თბილისი, საქართველო',
      en: 'Tbilisi, Georgia',
      ru: 'Тбилиси, Грузия',
    },
    description: {
      ge: 'ერთ-ერთი უძველესი დეველოპერი ქვეყანაში. Iberia Estate-ს პორტფელში შედის საოფისე, საცხოვრებელი და შერეული დანიშნულების პროექტები თბილისის ცენტრალურ უბნებში.',
      en: 'One of the oldest developers in the country. The Iberia Estate portfolio spans office, residential and mixed-use schemes across central Tbilisi.',
      ru: 'Один из старейших застройщиков страны. В портфеле Iberia Estate офисные, жилые и многофункциональные проекты в центральных районах Тбилиси.',
    },
  },
  {
    companyName: 'Anaklia Invest',
    projectsCompleted: 6,
    unitsDelivered: 720,
    activeProjects: 4,
    operatingSince: 2015,
    location: {
      ge: 'ანაკლია, საქართველო',
      en: 'Anaklia, Georgia',
      ru: 'Анаклия, Грузия',
    },
    description: {
      ge: 'Anaklia Invest ახალ საკურორტო ინფრასტრუქტურას ავითარებს შავი ზღვის ჩრდილოეთ სანაპიროზე, ღრმაწყლოვანი პორტის პროექტის მიმდებარედ.',
      en: 'Anaklia Invest develops new resort infrastructure on the northern Black Sea coast, next to the deep-water port project.',
      ru: 'Anaklia Invest развивает новую курортную инфраструктуру на северном побережье Чёрного моря, рядом с проектом глубоководного порта.',
    },
  },
  {
    companyName: 'Kazbegi Properties',
    projectsCompleted: 11,
    unitsDelivered: 640,
    activeProjects: 2,
    operatingSince: 2009,
    location: {
      ge: 'გუდაური, საქართველო',
      en: 'Gudauri, Georgia',
      ru: 'Гудаури, Грузия',
    },
    description: {
      ge: 'მთის კურორტების სპეციალისტი: Kazbegi Properties აშენებს შალე-ტიპის აპარტამენტებს გუდაურსა და ყაზბეგში, სასრიალო ტრასებთან პირდაპირი წვდომით.',
      en: 'A mountain-resort specialist: Kazbegi Properties builds chalet-style apartments in Gudauri and Kazbegi with direct ski-in access.',
      ru: 'Специалист по горным курортам: Kazbegi Properties строит апартаменты в стиле шале в Гудаури и Казбеги с прямым выходом к склонам.',
    },
  },
  {
    companyName: 'Tamarisi Group',
    projectsCompleted: 8,
    unitsDelivered: 890,
    activeProjects: 3,
    operatingSince: 2013,
    location: {
      ge: 'ბაკურიანი, საქართველო',
      en: 'Bakuriani, Georgia',
      ru: 'Бакуриани, Грузия',
    },
    description: {
      ge: 'Tamarisi Group ბაკურიანში ავითარებს აპარტ-ჰოტელებს, სადაც ოპერირებას ჯგუფის საკუთარი სასტუმრო ბრენდი უზრუნველყოფს.',
      en: 'Tamarisi Group develops aparthotels in Bakuriani that are operated by the group’s own hospitality brand.',
      ru: 'Tamarisi Group развивает в Бакуриани апарт-отели, которыми управляет собственный гостиничный бренд группы.',
    },
  },
  {
    companyName: 'Mtkvari Development',
    projectsCompleted: 17,
    unitsDelivered: 2870,
    activeProjects: 4,
    operatingSince: 2004,
    location: {
      ge: 'თბილისი, საქართველო',
      en: 'Tbilisi, Georgia',
      ru: 'Тбилиси, Грузия',
    },
    description: {
      ge: 'მდინარე მტკვრის სანაპიროს რეგენერაციაზე ორიენტირებული დეველოპერი, რომელიც ისტორიულ შენობებს თანამედროვე საცხოვრებელ ფუნქციას უბრუნებს.',
      en: 'A developer focused on regenerating the Mtkvari riverfront, returning historic structures to modern residential use.',
      ru: 'Застройщик, ориентированный на регенерацию набережной Мтквари и возвращение исторических зданий к современному жилому использованию.',
    },
  },
  {
    companyName: 'Colchis Coast Builders',
    projectsCompleted: 12,
    unitsDelivered: 1560,
    activeProjects: 3,
    operatingSince: 2008,
    location: {
      ge: 'ქუთაისი, საქართველო',
      en: 'Kutaisi, Georgia',
      ru: 'Кутаиси, Грузия',
    },
    description: {
      ge: 'Colchis Coast Builders იმერეთის რეგიონში აშენებს საშუალო სიმაღლის საცხოვრებელ კვარტლებს, ბაღებისა და საზოგადოებრივი სივრცეების აქცენტით.',
      en: 'Colchis Coast Builders delivers mid-rise residential quarters across the Imereti region, with an emphasis on gardens and shared amenity space.',
      ru: 'Colchis Coast Builders строит среднеэтажные жилые кварталы в регионе Имерети, уделяя внимание садам и общественным пространствам.',
    },
  },
  {
    companyName: 'Shekvetili Resorts',
    projectsCompleted: 5,
    unitsDelivered: 480,
    activeProjects: 2,
    operatingSince: 2017,
    location: {
      ge: 'შეკვეთილი, საქართველო',
      en: 'Shekvetili, Georgia',
      ru: 'Шекветили, Грузия',
    },
    description: {
      ge: 'Shekvetili Resorts მაგნიტური ქვიშის სანაპიროზე ავითარებს დასასვენებელ კომპლექსებს სპა- და საკონფერენციო ინფრასტრუქტურით.',
      en: 'Shekvetili Resorts develops leisure complexes on the magnetic-sand shoreline, combining spa and conference infrastructure.',
      ru: 'Shekvetili Resorts развивает курортные комплексы на пляже с магнитным песком, объединяя спа- и конференц-инфраструктуру.',
    },
  },
  {
    companyName: 'Vardzia Group',
    projectsCompleted: 7,
    unitsDelivered: 610,
    activeProjects: 1,
    operatingSince: 2012,
    location: {
      ge: 'მცხეთა, საქართველო',
      en: 'Mtskheta, Georgia',
      ru: 'Мцхета, Грузия',
    },
    description: {
      ge: 'Vardzia Group მუშაობს UNESCO-ს დაცულ ზონებთან ახლოს, სადაც ტრადიციულ არქიტექტურას თანამედროვე ინჟინერიასთან აერთიანებს.',
      en: 'Vardzia Group works close to UNESCO-protected zones, pairing traditional architecture with modern engineering.',
      ru: 'Vardzia Group работает рядом с зонами, охраняемыми UNESCO, соединяя традиционную архитектуру с современной инженерией.',
    },
  },
];

interface ProjectSeed {
  projectName: string;
  companyIndex: number;
  city: Trilingual;
  district: Trilingual;
  latitude: number;
  longitude: number;
  buildingType: Trilingual;
  totalFloors: number;
  unitsInBuilding: number;
  unitSizesAvailable: string;
  distanceToSea: string;
  distanceToCityCenter: string;
  lastVerified: string;
  basePrice: number;
  palette: { skyTop: Rgb; skyLow: Rgb; water: Rgb; building: Rgb };
}

const PROJECTS: ProjectSeed[] = [
  {
    projectName: 'Seaside Terrace Batumi',
    companyIndex: 0,
    city: { ge: 'ბათუმი', en: 'Batumi', ru: 'Батуми' },
    district: { ge: 'ახალი ბულვარი', en: 'New Boulevard', ru: 'Новый бульвар' },
    latitude: 41.6285,
    longitude: 41.6146,
    buildingType: {
      ge: 'მრავალფუნქციური საცხოვრებელი კომპლექსი',
      en: 'Mixed-use residential complex',
      ru: 'Многофункциональный жилой комплекс',
    },
    totalFloors: 24,
    unitsInBuilding: 288,
    unitSizesAvailable: '32–128 m²',
    distanceToSea: '120 m',
    distanceToCityCenter: '2.4 km',
    lastVerified: '2026-07-14',
    basePrice: 1850,
    palette: {
      skyTop: [46, 92, 158],
      skyLow: [244, 186, 138],
      water: [28, 74, 106],
      building: [214, 206, 192],
    },
  },
  {
    projectName: 'Bay View Residence',
    companyIndex: 1,
    city: { ge: 'ქობულეთი', en: 'Kobuleti', ru: 'Кобулети' },
    district: {
      ge: 'დავით აღმაშენებლის გამზირი',
      en: 'Davit Aghmashenebeli Avenue',
      ru: 'Проспект Давида Строителя',
    },
    latitude: 41.8214,
    longitude: 41.7788,
    buildingType: {
      ge: 'დაბალსართულიანი საკურორტო კვარტალი',
      en: 'Low-rise resort quarter',
      ru: 'Малоэтажный курортный квартал',
    },
    totalFloors: 8,
    unitsInBuilding: 96,
    unitSizesAvailable: '38–104 m²',
    distanceToSea: '60 m',
    distanceToCityCenter: '900 m',
    lastVerified: '2026-06-28',
    basePrice: 1420,
    palette: {
      skyTop: [58, 108, 168],
      skyLow: [252, 214, 168],
      water: [24, 88, 112],
      building: [232, 220, 198],
    },
  },
  {
    projectName: 'Argo Towers',
    companyIndex: 0,
    city: { ge: 'ბათუმი', en: 'Batumi', ru: 'Батуми' },
    district: {
      ge: 'ჯავახიშვილის ქუჩა',
      en: 'Javakhishvili Street',
      ru: 'Улица Джавахишвили',
    },
    latitude: 41.6413,
    longitude: 41.6329,
    buildingType: {
      ge: 'აპარტ-ჰოტელი',
      en: 'Aparthotel',
      ru: 'Апарт-отель',
    },
    totalFloors: 31,
    unitsInBuilding: 412,
    unitSizesAvailable: '28–96 m²',
    distanceToSea: '350 m',
    distanceToCityCenter: '600 m',
    lastVerified: '2026-07-21',
    basePrice: 2100,
    palette: {
      skyTop: [32, 60, 122],
      skyLow: [232, 148, 122],
      water: [22, 58, 92],
      building: [188, 196, 208],
    },
  },
  {
    projectName: 'Kolkheti Park Residence',
    companyIndex: 3,
    city: { ge: 'ანაკლია', en: 'Anaklia', ru: 'Анаклия' },
    district: {
      ge: 'სანაპირო ზოლი',
      en: 'Coastal strip',
      ru: 'Береговая полоса',
    },
    latitude: 42.3861,
    longitude: 41.5622,
    buildingType: {
      ge: 'საკურორტო კომპლექსი',
      en: 'Resort complex',
      ru: 'Курортный комплекс',
    },
    totalFloors: 12,
    unitsInBuilding: 164,
    unitSizesAvailable: '35–118 m²',
    distanceToSea: '80 m',
    distanceToCityCenter: '1.1 km',
    lastVerified: '2026-05-30',
    basePrice: 1180,
    palette: {
      skyTop: [64, 118, 172],
      skyLow: [248, 226, 186],
      water: [30, 96, 118],
      building: [226, 214, 190],
    },
  },
  {
    projectName: 'Alpine Lodge Gudauri',
    companyIndex: 4,
    city: { ge: 'გუდაური', en: 'Gudauri', ru: 'Гудаури' },
    district: { ge: 'ახალი გუდაური', en: 'New Gudauri', ru: 'Новый Гудаури' },
    latitude: 42.4783,
    longitude: 44.4783,
    buildingType: {
      ge: 'შალე-ტიპის აპარტამენტები',
      en: 'Chalet-style apartments',
      ru: 'Апартаменты в стиле шале',
    },
    totalFloors: 9,
    unitsInBuilding: 138,
    unitSizesAvailable: '26–88 m²',
    distanceToSea: '320 km',
    distanceToCityCenter: '1.8 km',
    lastVerified: '2026-07-02',
    basePrice: 1650,
    palette: {
      skyTop: [38, 78, 142],
      skyLow: [214, 226, 246],
      water: [96, 122, 148],
      building: [176, 152, 128],
    },
  },
  {
    projectName: 'Panorama Heights Bakuriani',
    companyIndex: 5,
    city: { ge: 'ბაკურიანი', en: 'Bakuriani', ru: 'Бакуриани' },
    district: { ge: 'დიდველი', en: 'Didveli', ru: 'Дидвели' },
    latitude: 41.7392,
    longitude: 43.5312,
    buildingType: {
      ge: 'აპარტ-ჰოტელი სპა-ზონით',
      en: 'Aparthotel with spa',
      ru: 'Апарт-отель со спа',
    },
    totalFloors: 11,
    unitsInBuilding: 186,
    unitSizesAvailable: '30–92 m²',
    distanceToSea: '215 km',
    distanceToCityCenter: '2.2 km',
    lastVerified: '2026-06-11',
    basePrice: 1540,
    palette: {
      skyTop: [44, 88, 150],
      skyLow: [222, 232, 248],
      water: [104, 130, 152],
      building: [168, 146, 122],
    },
  },
  {
    projectName: 'Riverside Quarter Tbilisi',
    companyIndex: 6,
    city: { ge: 'თბილისი', en: 'Tbilisi', ru: 'Тбилиси' },
    district: { ge: 'ავლაბარი', en: 'Avlabari', ru: 'Авлабари' },
    latitude: 41.6934,
    longitude: 44.8112,
    buildingType: {
      ge: 'საცხოვრებელი კვარტალი',
      en: 'Residential quarter',
      ru: 'Жилой квартал',
    },
    totalFloors: 16,
    unitsInBuilding: 224,
    unitSizesAvailable: '42–146 m²',
    distanceToSea: '330 km',
    distanceToCityCenter: '1.3 km',
    lastVerified: '2026-07-18',
    basePrice: 1980,
    palette: {
      skyTop: [52, 84, 132],
      skyLow: [246, 202, 152],
      water: [82, 96, 88],
      building: [206, 186, 160],
    },
  },
  {
    projectName: 'Botanical Garden Residence',
    companyIndex: 7,
    city: { ge: 'ქუთაისი', en: 'Kutaisi', ru: 'Кутаиси' },
    district: { ge: 'ბალახვანი', en: 'Balakhvani', ru: 'Балахвани' },
    latitude: 42.2794,
    longitude: 42.7031,
    buildingType: {
      ge: 'საშუალო სიმაღლის საცხოვრებელი კომპლექსი',
      en: 'Mid-rise residential complex',
      ru: 'Среднеэтажный жилой комплекс',
    },
    totalFloors: 10,
    unitsInBuilding: 142,
    unitSizesAvailable: '40–132 m²',
    distanceToSea: '95 km',
    distanceToCityCenter: '2.8 km',
    lastVerified: '2026-06-19',
    basePrice: 1120,
    palette: {
      skyTop: [70, 118, 160],
      skyLow: [242, 232, 196],
      water: [78, 108, 92],
      building: [222, 210, 184],
    },
  },
  {
    projectName: 'Golden Sands Resort',
    companyIndex: 8,
    city: { ge: 'შეკვეთილი', en: 'Shekvetili', ru: 'Шекветили' },
    district: { ge: 'პარკის ზონა', en: 'Park zone', ru: 'Парковая зона' },
    latitude: 41.9749,
    longitude: 41.7623,
    buildingType: {
      ge: 'საკურორტო კომპლექსი სპა-ცენტრით',
      en: 'Resort complex with spa centre',
      ru: 'Курортный комплекс со спа-центром',
    },
    totalFloors: 14,
    unitsInBuilding: 208,
    unitSizesAvailable: '33–124 m²',
    distanceToSea: '250 m',
    distanceToCityCenter: '3.1 km',
    lastVerified: '2026-07-09',
    basePrice: 1720,
    palette: {
      skyTop: [40, 96, 156],
      skyLow: [254, 208, 154],
      water: [26, 84, 114],
      building: [236, 222, 196],
    },
  },
  {
    projectName: 'Old Town Lofts Mtskheta',
    companyIndex: 9,
    city: { ge: 'მცხეთა', en: 'Mtskheta', ru: 'Мцхета' },
    district: {
      ge: 'ისტორიული ცენტრი',
      en: 'Historic centre',
      ru: 'Исторический центр',
    },
    latitude: 41.8434,
    longitude: 44.7202,
    buildingType: {
      ge: 'ლოფტების კვარტალი',
      en: 'Loft quarter',
      ru: 'Лофт-квартал',
    },
    totalFloors: 6,
    unitsInBuilding: 64,
    unitSizesAvailable: '45–160 m²',
    distanceToSea: '325 km',
    distanceToCityCenter: '400 m',
    lastVerified: '2026-05-22',
    basePrice: 1460,
    palette: {
      skyTop: [58, 96, 140],
      skyLow: [244, 214, 170],
      water: [86, 104, 96],
      building: [212, 180, 148],
    },
  },
];

const FINISHING: Trilingual[] = [
  { ge: 'თეთრი კარკასი', en: 'White frame', ru: 'Белый каркас' },
  {
    ge: 'სრული რემონტი "გასაღების ქვეშ"',
    en: 'Full turnkey finishing',
    ru: 'Полная отделка под ключ',
  },
  {
    ge: 'წინასწარი რემონტი, ღია გეგმარება',
    en: 'Pre-finished, open plan',
    ru: 'Предчистовая отделка, открытая планировка',
  },
];

const FURNITURE: Trilingual[] = [
  {
    ge: 'ავეჯისა და ტექნიკის სრული პაკეტი შედის ფასში',
    en: 'Full furniture and appliance package included in the price',
    ru: 'Полный пакет мебели и техники включён в цену',
  },
  {
    ge: 'ავეჯის პაკეტი ოპციურია, ფასი $12,000-დან',
    en: 'Furniture package optional, from $12,000',
    ru: 'Пакет мебели опционально, от $12 000',
  },
  {
    ge: 'სამზარეულო და სველი წერტილები აღჭურვილია, დანარჩენი ავეჯი ცალკე',
    en: 'Kitchen and bathrooms fitted, remaining furniture priced separately',
    ru: 'Кухня и санузлы оборудованы, остальная мебель отдельно',
  },
];

const STR_MANAGEMENT: Trilingual[] = [
  {
    ge: 'დიახ — მოკლევადიანი გაქირავების მართვა ხორციელდება ადგილზე, დეველოპერის ოპერატორის მიერ',
    en: 'Yes — short-term rental management is handled on site by the developer’s own operator',
    ru: 'Да — управление краткосрочной арендой на месте, оператором застройщика',
  },
  {
    ge: 'დიახ — პარტნიორი ოპერატორი მუშაობს ადგილზე, შემოსავლის განაწილება 80/20',
    en: 'Yes — a partner operator works on site with an 80/20 revenue split',
    ru: 'Да — партнёрский оператор работает на месте, распределение дохода 80/20',
  },
  {
    ge: 'არა — მფლობელი დამოუკიდებლად აქირავებს, კონსიერჟის მხარდაჭერით',
    en: 'No — owners rent independently, with concierge desk support',
    ru: 'Нет — владельцы сдают самостоятельно, при поддержке консьерж-службы',
  },
];

function projectDescriptionCards(seed: ProjectSeed) {
  return [
    {
      projectDescriptionCardTitleGe: 'მდებარეობა',
      projectDescriptionCardTitleEn: 'Location',
      projectDescriptionCardTitleRu: 'Расположение',
      projectDescriptionCardContentGe: `${seed.district.ge}, ${seed.city.ge}`,
      projectDescriptionCardContentEn: `${seed.district.en}, ${seed.city.en}`,
      projectDescriptionCardContentRu: `${seed.district.ru}, ${seed.city.ru}`,
      projectDescriptionCardDescriptionGe: `კომპლექსი მდებარეობს ზღვიდან ${seed.distanceToSea}-ის და ქალაქის ცენტრიდან ${seed.distanceToCityCenter}-ის დაშორებით, განვითარებული ინფრასტრუქტურის ზონაში.`,
      projectDescriptionCardDescriptionEn: `The complex sits ${seed.distanceToSea} from the water and ${seed.distanceToCityCenter} from the city centre, inside an established infrastructure zone.`,
      projectDescriptionCardDescriptionRu: `Комплекс расположен в ${seed.distanceToSea} от воды и в ${seed.distanceToCityCenter} от центра города, в зоне сложившейся инфраструктуры.`,
    },
    {
      projectDescriptionCardTitleGe: 'არქიტექტურა',
      projectDescriptionCardTitleEn: 'Architecture',
      projectDescriptionCardTitleRu: 'Архитектура',
      projectDescriptionCardContentGe: `${seed.totalFloors} სართული, ${seed.unitsInBuilding} ბინა`,
      projectDescriptionCardContentEn: `${seed.totalFloors} floors, ${seed.unitsInBuilding} apartments`,
      projectDescriptionCardContentRu: `${seed.totalFloors} этажей, ${seed.unitsInBuilding} апартаментов`,
      projectDescriptionCardDescriptionGe: `${seed.buildingType.ge} მონოლითურ-კარკასული კონსტრუქციით, პანორამული მინაპაკეტებითა და საერთო სარგებლობის ტერასებით.`,
      projectDescriptionCardDescriptionEn: `A ${seed.buildingType.en.toLowerCase()} built on a reinforced concrete frame, with panoramic glazing and shared roof terraces.`,
      projectDescriptionCardDescriptionRu: `${seed.buildingType.ru} на монолитно-каркасной конструкции, с панорамным остеклением и общими террасами.`,
    },
    {
      projectDescriptionCardTitleGe: 'ინფრასტრუქტურა',
      projectDescriptionCardTitleEn: 'Amenities',
      projectDescriptionCardTitleRu: 'Инфраструктура',
      projectDescriptionCardContentGe:
        'აუზი, სპა, ფიტნესი, მიწისქვეშა პარკინგი',
      projectDescriptionCardContentEn: 'Pool, spa, gym, underground parking',
      projectDescriptionCardContentRu:
        'Бассейн, спа, фитнес, подземный паркинг',
      projectDescriptionCardDescriptionGe:
        'პირველ ორ სართულზე განთავსებულია კომერციული ფართები, ლობი 24/7 მიღებით და ბავშვთა ოთახი.',
      projectDescriptionCardDescriptionEn:
        'The first two levels hold commercial units, a lobby with 24/7 reception and a children’s room.',
      projectDescriptionCardDescriptionRu:
        'На первых двух уровнях расположены коммерческие площади, лобби с круглосуточной службой приёма и детская комната.',
    },
  ];
}

function investmentCards(seed: ProjectSeed) {
  const yieldPct = (7 + (seed.basePrice % 7) * 0.3).toFixed(1);
  const occupancy = 62 + (seed.unitsInBuilding % 17);
  return [
    {
      investmentCardTitleGe: 'პროგნოზირებული სარგებელი',
      investmentCardTitleEn: 'Projected yield',
      investmentCardTitleRu: 'Прогнозируемая доходность',
      investmentCardContentGe: `${yieldPct}% წელიწადში`,
      investmentCardContentEn: `${yieldPct}% per year`,
      investmentCardContentRu: `${yieldPct}% в год`,
      investmentCardDescriptionGe:
        'გაანგარიშება ეყრდნობა მართვის კომპანიის მიერ წარმოდგენილ ბოლო 12 თვის ფაქტობრივ მაჩვენებლებს ანალოგიურ ობიექტებზე.',
      investmentCardDescriptionEn:
        'The calculation is based on the management company’s actual last-12-month figures for comparable assets.',
      investmentCardDescriptionRu:
        'Расчёт основан на фактических показателях управляющей компании за последние 12 месяцев по сопоставимым объектам.',
    },
    {
      investmentCardTitleGe: 'დატვირთვა სეზონზე',
      investmentCardTitleEn: 'Seasonal occupancy',
      investmentCardTitleRu: 'Загрузка в сезон',
      investmentCardContentGe: `${occupancy}%`,
      investmentCardContentEn: `${occupancy}%`,
      investmentCardContentRu: `${occupancy}%`,
      investmentCardDescriptionGe:
        'მაისი–ოქტომბრის პერიოდში დატვირთვა სტაბილურად აღემატება წლიურ საშუალოს; ზამთარში მოქმედებს გრძელვადიანი გაქირავების ტარიფი.',
      investmentCardDescriptionEn:
        'Occupancy between May and October runs consistently above the annual average; a long-stay tariff applies in winter.',
      investmentCardDescriptionRu:
        'С мая по октябрь загрузка стабильно выше среднегодовой; зимой действует тариф долгосрочной аренды.',
    },
    {
      investmentCardTitleGe: 'შესვლის ბარიერი',
      investmentCardTitleEn: 'Entry ticket',
      investmentCardTitleRu: 'Порог входа',
      investmentCardContentGe: `$${(seed.basePrice * 32).toLocaleString('en-US')}-დან`,
      investmentCardContentEn: `From $${(seed.basePrice * 32).toLocaleString('en-US')}`,
      investmentCardContentRu: `От $${(seed.basePrice * 32).toLocaleString('en-US')}`,
      investmentCardDescriptionGe:
        'ფასი მოცემულია უმცირესი ტიპის ბინაზე; რეზერვაცია ხდება $2,000 დეპოზიტით, ხელშეკრულება ფორმდება 10 დღეში.',
      investmentCardDescriptionEn:
        'The figure reflects the smallest unit type; reservation takes a $2,000 deposit and the contract is signed within 10 days.',
      investmentCardDescriptionRu:
        'Цена указана для самого компактного типа; бронирование — депозит $2 000, договор подписывается в течение 10 дней.',
    },
  ];
}

function pricingBySquareMeters(seed: ProjectSeed) {
  return [
    { squareMeterRange: '28–45 m²', startingPrice: seed.basePrice + 180 },
    { squareMeterRange: '46–75 m²', startingPrice: seed.basePrice },
    { squareMeterRange: '76–160 m²', startingPrice: seed.basePrice - 120 },
  ];
}

function paymentPlans(seed: ProjectSeed) {
  const unitPrice = seed.basePrice * 55;
  return [
    {
      paymentStageGe: 'ჯავშანი',
      paymentStageEn: 'Reservation',
      paymentStageRu: 'Бронирование',
      paymentAmount: 2000,
      whenGe: 'ხელშეკრულების გაფორმებამდე',
      whenEn: 'Before contract signing',
      whenRu: 'До подписания договора',
    },
    {
      paymentStageGe: 'პირველი შენატანი',
      paymentStageEn: 'Down payment',
      paymentStageRu: 'Первый взнос',
      paymentAmount: Math.round(unitPrice * 0.3),
      whenGe: 'ხელშეკრულების გაფორმებისას',
      whenEn: 'At contract signing',
      whenRu: 'При подписании договора',
    },
    {
      paymentStageGe: 'ეტაპობრივი გადახდა',
      paymentStageEn: 'Construction instalments',
      paymentStageRu: 'Платежи по этапам',
      paymentAmount: Math.round(unitPrice * 0.45),
      whenGe: 'თანაბრად გაშენებული მშენებლობის დასრულებამდე',
      whenEn: 'Spread evenly until construction completion',
      whenRu: 'Равными частями до завершения строительства',
    },
    {
      paymentStageGe: 'ბოლო შენატანი',
      paymentStageEn: 'Final payment',
      paymentStageRu: 'Финальный платёж',
      paymentAmount: Math.round(unitPrice * 0.25),
      whenGe: 'ექსპლუატაციაში მიღების აქტის გაცემისას',
      whenEn: 'On issue of the occupancy certificate',
      whenRu: 'При выдаче акта о вводе в эксплуатацию',
    },
  ];
}

function buildProjectDocument(
  seed: ProjectSeed,
  companyId: Types.ObjectId,
  projectImages: Types.ObjectId[],
  floorPlanImages: Types.ObjectId[],
  index: number,
) {
  const finishing = FINISHING[index % FINISHING.length];
  const furniture = FURNITURE[index % FURNITURE.length];
  const strManagement = STR_MANAGEMENT[index % STR_MANAGEMENT.length];

  return {
    projectName: seed.projectName,
    projectImages,
    projectLocationGe: `${seed.district.ge}, ${seed.city.ge}`,
    projectLocationEn: `${seed.district.en}, ${seed.city.en}`,
    projectLocationRu: `${seed.district.ru}, ${seed.city.ru}`,
    projectLatitude: seed.latitude,
    projectLongitude: seed.longitude,
    projectDescriptionCards: projectDescriptionCards(seed),
    projectAdvantagesGe: [
      `${seed.distanceToSea} ზღვამდე`,
      'მიწისქვეშა პარკინგი ყველა ბინისთვის',
      'გენერატორი და ავტონომიური წყალმომარაგება',
      'მართვის კომპანია ადგილზე',
      'საერთო სარგებლობის სახურავის ტერასა',
    ],
    projectAdvantagesEn: [
      `${seed.distanceToSea} to the sea`,
      'Underground parking for every apartment',
      'Backup generator and autonomous water supply',
      'On-site management company',
      'Shared roof terrace',
    ],
    projectAdvantagesRu: [
      `${seed.distanceToSea} до моря`,
      'Подземный паркинг для каждой квартиры',
      'Резервный генератор и автономное водоснабжение',
      'Управляющая компания на месте',
      'Общая терраса на крыше',
    ],
    paymentDescriptionGe:
      'გადახდა ხდება ეტაპობრივად, მშენებლობის მიმდინარეობის მიხედვით. ბანკის ესქროუ ანგარიში იცავს მყიდველის თანხას სამშენებლო ეტაპის დასრულებამდე. შიდა განვადება უპროცენტოა.',
    paymentDescriptionEn:
      'Payments follow construction milestones. A bank escrow account protects the buyer’s funds until each stage is signed off. Developer instalments carry no interest.',
    paymentDescriptionRu:
      'Оплата привязана к этапам строительства. Банковский эскроу-счёт защищает средства покупателя до закрытия каждого этапа. Внутренняя рассрочка беспроцентная.',
    projectDescription: {
      projectDescriptionTitleGe: `${seed.projectName} — ${seed.city.ge}`,
      projectDescriptionTitleEn: `${seed.projectName} — ${seed.city.en}`,
      projectDescriptionTitleRu: `${seed.projectName} — ${seed.city.ru}`,
      projectDescriptionContentGe: `${seed.buildingType.ge} ${seed.city.ge}-ში, ${seed.unitsInBuilding} ბინით ${seed.totalFloors} სართულზე. ფართები ${seed.unitSizesAvailable}. პროექტი მოიცავს კომერციულ პირველ ხაზს, სპა-ზონას, აუზსა და მიწისქვეშა პარკინგს. მშენებლობა მიმდინარეობს ნებართვის სრული პაკეტით.`,
      projectDescriptionContentEn: `A ${seed.buildingType.en.toLowerCase()} in ${seed.city.en} with ${seed.unitsInBuilding} apartments across ${seed.totalFloors} floors. Unit sizes run ${seed.unitSizesAvailable}. The scheme includes a commercial ground line, spa zone, pool and underground parking, and is being built under a complete permit package.`,
      projectDescriptionContentRu: `${seed.buildingType.ru} в ${seed.city.ru} — ${seed.unitsInBuilding} апартаментов на ${seed.totalFloors} этажах. Площади ${seed.unitSizesAvailable}. Проект включает коммерческую линию на первом уровне, спа-зону, бассейн и подземный паркинг; строительство ведётся с полным пакетом разрешений.`,
      projectShortDescriptionGe: `${seed.unitsInBuilding} ბინა ზღვიდან ${seed.distanceToSea}-ში, ფასი $${seed.basePrice}/m²-დან.`,
      projectShortDescriptionEn: `${seed.unitsInBuilding} apartments ${seed.distanceToSea} from the sea, from $${seed.basePrice}/m².`,
      projectShortDescriptionRu: `${seed.unitsInBuilding} апартаментов в ${seed.distanceToSea} от моря, от $${seed.basePrice}/m².`,
    },
    verificationChecklistGe: [
      'მშენებლობის ნებართვა შემოწმებულია საჯარო რეესტრში',
      'მიწის ნაკვეთი დეველოპერის საკუთრებაშია, ყადაღის გარეშე',
      'ესქროუ ანგარიში დადასტურებულია ბანკის მიერ',
      'დეველოპერის წინა ობიექტები ჩაბარებულია ვადაში',
    ],
    verificationChecklistEn: [
      'Construction permit verified in the public registry',
      'Land plot owned by the developer, free of encumbrances',
      'Escrow account confirmed by the bank',
      'Developer’s previous projects delivered on schedule',
    ],
    verificationChecklistRu: [
      'Разрешение на строительство проверено в публичном реестре',
      'Земельный участок в собственности застройщика, без обременений',
      'Эскроу-счёт подтверждён банком',
      'Предыдущие объекты застройщика сданы в срок',
    ],
    lastVerified: new Date(`${seed.lastVerified}T09:00:00.000Z`),
    investmentCards: investmentCards(seed),
    buildingTypeGe: seed.buildingType.ge,
    buildingTypeEn: seed.buildingType.en,
    buildingTypeRu: seed.buildingType.ru,
    totalFloors: seed.totalFloors,
    unitsInBuilding: seed.unitsInBuilding,
    unitSizesAvailable: seed.unitSizesAvailable,
    finishingGe: finishing.ge,
    finishingEn: finishing.en,
    finishingRu: finishing.ru,
    furniturePackageGe: furniture.ge,
    furniturePackageEn: furniture.en,
    furniturePackageRu: furniture.ru,
    strManagementOnSiteGe: strManagement.ge,
    strManagementOnSiteEn: strManagement.en,
    strManagementOnSiteRu: strManagement.ru,
    distanceToSea: seed.distanceToSea,
    distanceToCityCenter: seed.distanceToCityCenter,
    floorPlanImages,
    pricingBySquareMeters: pricingBySquareMeters(seed),
    paymentPlans: paymentPlans(seed),
    paymentAdvantagesGe: [
      'უპროცენტო შიდა განვადება 24 თვემდე',
      'ესქროუ ანგარიშით დაცული გადახდები',
      'ერთიანი გადახდისას 7% ფასდაკლება',
    ],
    paymentAdvantagesEn: [
      'Interest-free developer instalments up to 24 months',
      'Payments protected by an escrow account',
      '7% discount for payment in full',
    ],
    paymentAdvantagesRu: [
      'Беспроцентная рассрочка от застройщика до 24 месяцев',
      'Платежи защищены эскроу-счётом',
      'Скидка 7% при оплате полной суммой',
    ],
    company: companyId,
  };
}

// --- Runner ---------------------------------------------------------------

const EXTERIORS_PER_PROJECT = 4;
const FLOOR_PLANS_PER_PROJECT = 2;

async function main(): Promise<void> {
  const uploadDir = path.resolve(
    PROJECT_ROOT,
    readEnv('UPLOAD_DIR', './uploads'),
  );
  fs.mkdirSync(uploadDir, { recursive: true });

  await mongoose.connect(readEnv('MONGODB_URI'), {
    serverSelectionTimeoutMS: 5000,
  });

  const CompanyModel = mongoose.model('Company', CompanySchema);
  const ImageModel = mongoose.model('Image', ImageSchema);
  const ProjectModel = mongoose.model('Project', ProjectSchema);

  const companyIds: Types.ObjectId[] = [];
  let companiesCreated = 0;
  for (const seed of COMPANIES) {
    const existing = await CompanyModel.findOne({
      companyName: seed.companyName,
    }).exec();
    if (existing) {
      companyIds.push(existing._id);
      continue;
    }
    const created = await CompanyModel.create({
      companyName: seed.companyName,
      projectsCompleted: seed.projectsCompleted,
      unitsDelivered: seed.unitsDelivered,
      activeProjects: seed.activeProjects,
      operatingSince: seed.operatingSince,
      companyLocationGe: seed.location.ge,
      companyLocationEn: seed.location.en,
      companyLocationRu: seed.location.ru,
      companyDescriptionGe: seed.description.ge,
      companyDescriptionEn: seed.description.en,
      companyDescriptionRu: seed.description.ru,
    });
    companyIds.push(created._id);
    companiesCreated += 1;
  }
  console.log(
    `Companies: ${companiesCreated} created, ${COMPANIES.length - companiesCreated} already present`,
  );

  let projectsCreated = 0;
  let imagesCreated = 0;

  for (const [index, seed] of PROJECTS.entries()) {
    const existing = await ProjectModel.findOne({
      projectName: seed.projectName,
    }).exec();
    if (existing) {
      console.log(`Project already present, skipped: ${seed.projectName}`);
      continue;
    }

    const imageIds: Types.ObjectId[] = [];
    for (let n = 0; n < EXTERIORS_PER_PROJECT; n += 1) {
      const buffer = renderExterior(900, 600, index * 10 + n, seed.palette);
      const filename = `${uuidv4()}.png`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      const image = await ImageModel.create({
        originalName: `${seed.projectName.toLowerCase().replace(/\s+/g, '-')}-exterior-${n + 1}.png`,
        filename,
        mimeType: 'image/png',
        size: buffer.length,
      });
      imageIds.push(image._id);
      imagesCreated += 1;
    }

    const floorPlanIds: Types.ObjectId[] = [];
    for (let n = 0; n < FLOOR_PLANS_PER_PROJECT; n += 1) {
      const buffer = renderFloorPlan(700, 700, index + n);
      const filename = `${uuidv4()}.png`;
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      const image = await ImageModel.create({
        originalName: `${seed.projectName.toLowerCase().replace(/\s+/g, '-')}-floor-plan-${n + 1}.png`,
        filename,
        mimeType: 'image/png',
        size: buffer.length,
      });
      floorPlanIds.push(image._id);
      imagesCreated += 1;
    }

    await ProjectModel.create(
      buildProjectDocument(
        seed,
        companyIds[seed.companyIndex],
        imageIds,
        floorPlanIds,
        index,
      ),
    );
    projectsCreated += 1;
    console.log(
      `Created project ${seed.projectName} (${imageIds.length} exteriors, ${floorPlanIds.length} floor plans)`,
    );
  }

  console.log('---');
  console.log(`Projects created: ${projectsCreated}`);
  console.log(
    `Images created: ${imagesCreated} (files written to ${uploadDir})`,
  );
  console.log(
    `Totals now — companies: ${await CompanyModel.countDocuments()}, projects: ${await ProjectModel.countDocuments()}, images: ${await ImageModel.countDocuments()}`,
  );

  await mongoose.disconnect();
}

void main().catch(async (error) => {
  console.error(error instanceof Error ? error.stack : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
