import { Series } from '@/types/content';
import { COSMIC_GENESIS_CHAPTERS as CREATION_CHAPTERS } from '@/constants/chapters/creation-polished';
import { PROPHETS_CHAPTERS } from '@/constants/chapters/prophets';
import { SEERAH_CHAPTERS as SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS } from '@/constants/chapters/seerah-of-prophet-muhammad';
import { RIGHTLY_GUIDED_CALIPHS_CHAPTERS } from '@/constants/chapters/rightly-guided-caliphs';
import { COMPANIONS_CHAPTERS as COMPANIONS_V3_CHAPTERS } from '@/constants/chapters/companions v3';
import { GREAT_WOMEN_CHAPTERS } from '@/constants/chapters/great-women-of-islam';
import { extractDisplayTitle } from '@/utils/chapterMarkdown';

function t(map: Record<string, string>, key: string): string {
  return map[key] ?? '# Content Loading Error\n\nThis chapter could not be loaded.';
}

function extractTitle(text: string): string {
  return extractDisplayTitle(text);
}

function buildChaptersFromMap(
  map: Record<string, string>,
  tags: string[],
  readingTime = 12,
  titleOverrides?: Record<string, string>,
  tagOverrides?: Record<string, string[]>
): Series['chapters'] {
  return Object.entries(map).map(([id, text]) => ({
    id,
    title: titleOverrides?.[id] ?? extractTitle(text),
    tags: tagOverrides?.[id] ?? tags,
    readingTime,
    text,
  }));
}

const COMPANIONS_TITLE_OVERRIDES: Record<string, string> = {
  'ch01-abd-rahman-ibn-awf': 'The Iron Market',
  'ch01-khalid-ibn-al-walid-sword-of-allah': 'The Sword of Allāh',
  'ch03-abu-ubaydah-ibn-al-jarrah': 'The Trustworthy of the Ummah',
  'ch05-al-zubayr-ibn-al-awwam': 'The Disciple',
  'ch01-sad-ibn-abi-waqqas-the-first-arrow': 'The First Arrow',
  'ch06-bilal-ibn-rabah-the-silence-in-damascus': 'The Silence in Damascus',
  'ch08-salaman-al-farsi-seeker-of-truth': 'The Seeker of Truth',
  'ch09-abdullah-ibn-masud': 'The Custodian of the Word',
  'ch10-muadh-ibn-jabal-master-jurisprudence': 'The Master of Jurisprudence',
  'ch10-talhah-ibn-ubaydullah-the-living-martyr': 'The Living Martyr',
};

const COMPANIONS_TAG_OVERRIDES: Record<string, string[]> = {
  'ch01-abd-rahman-ibn-awf': ['Abd al-Rahman ibn Awf', 'Companions', 'Reflection', 'Lessons'],
  'ch01-khalid-ibn-al-walid-sword-of-allah': ['Khalid ibn al-Walid', 'Companions', 'Reflection', 'Lessons'],
  'ch03-abu-ubaydah-ibn-al-jarrah': ['Abu Ubaydah ibn al-Jarrah', 'Companions', 'Reflection', 'Lessons'],
  'ch05-al-zubayr-ibn-al-awwam': ['Al-Zubayr ibn al-Awwam', 'Companions', 'Reflection', 'Lessons'],
  'ch01-sad-ibn-abi-waqqas-the-first-arrow': ['Sad ibn Abi Waqqas', 'Companions', 'Reflection', 'Lessons'],
  'ch06-bilal-ibn-rabah-the-silence-in-damascus': ['Bilal ibn Rabah', 'Companions', 'Reflection', 'Lessons'],
  'ch08-salaman-al-farsi-seeker-of-truth': ['Salman al-Farsi', 'Companions', 'Reflection', 'Lessons'],
  'ch09-abdullah-ibn-masud': ['Abdullah ibn Masud', 'Companions', 'Reflection', 'Lessons'],
  'ch10-muadh-ibn-jabal-master-jurisprudence': ['Muadh ibn Jabal', 'Companions', 'Reflection', 'Lessons'],
  'ch10-talhah-ibn-ubaydullah-the-living-martyr': ['Talhah ibn Ubaydullah', 'Companions', 'Reflection', 'Lessons'],
};

const PROPHETS_TAG_OVERRIDES: Record<string, string[]> = {
  'ch01-adam-the-clay-and-the-fire': ['Adam', 'Prophets', 'History', 'Reflection'],
  'ch02-adam-the-tree-of-eternity': ['Adam', 'Prophets', 'History', 'Reflection'],
  'ch03-adam-the-first-blood': ['Adam', 'Prophets', 'History', 'Reflection'],
  'ch02-nuh-part1': ['Nuh', 'Prophets', 'History', 'Reflection'],
  'ch02-nuh-part2': ['Nuh', 'Prophets', 'History', 'Reflection'],
  'ch02-nuh-part3': ['Nuh', 'Prophets', 'History', 'Reflection'],
  'ch03-ibrahim-the-smasher-of-idols': ['Ibrahim', 'Prophets', 'History', 'Reflection'],
  'ch03-ibrahim-the-furnace-of-babylon': ['Ibrahim', 'Prophets', 'History', 'Reflection'],
  'ch03-ibrahim-the-king-and-the-wife': ['Ibrahim', 'Prophets', 'History', 'Reflection'],
  'ch03-ibrahim-the-sacrificial-dream': ['Ibrahim', 'Prophets', 'History', 'Reflection'],
  'ch03-ibrahim-the-foundations-of-the-house': ['Ibrahim', 'Prophets', 'History', 'Reflection'],
  'ch04-lut-part1': ['Lut', 'Prophets', 'History', 'Reflection'],
  'ch04-lut-part2': ['Lut', 'Prophets', 'History', 'Reflection'],
  'ch05-yusuf-dream-pit': ['Yusuf', 'Prophets', 'History', 'Reflection'],
  'ch05-yusuf-palace-aziz': ['Yusuf', 'Prophets', 'History', 'Reflection'],
  'ch05-yusuf-prison-king': ['Yusuf', 'Prophets', 'History', 'Reflection'],
  'ch05-yusuf-minister-earth': ['Yusuf', 'Prophets', 'History', 'Reflection'],
  'ch05-yusuf-scent-shirt': ['Yusuf', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-1': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-2': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-3': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-4': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-5': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-6': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-7': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-8': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-9': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch06-musa-leviathan-antiquity-10': ['Musa', 'Prophets', 'History', 'Reflection'],
  'ch07-dawud-sulayman-golden-age-01': ['Dawud', 'Sulayman', 'Prophets', 'History', 'Reflection'],
  'ch07-dawud-sulayman-golden-age-02': ['Dawud', 'Sulayman', 'Prophets', 'History', 'Reflection'],
  'ch07-dawud-sulayman-golden-age-03': ['Dawud', 'Sulayman', 'Prophets', 'History', 'Reflection'],
  'ch07-dawud-sulayman-golden-age-04': ['Dawud', 'Sulayman', 'Prophets', 'History', 'Reflection'],
  'ch01-yunus-fleeing-ship': ['Yunus', 'Prophets', 'History', 'Reflection'],
  'ch02-yunus-three-darknesses': ['Yunus', 'Prophets', 'History', 'Reflection'],
  'ch09-isa-the-virgin-birth': ['Isa', 'Prophets', 'History', 'Reflection'],
  'ch09-isa-the-signs-and-the-raising': ['Isa', 'Prophets', 'History', 'Reflection'],
};

const SEERAH_TAG_OVERRIDES: Record<string, string[]> = Object.fromEntries(
  Object.keys(SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS).map((id, index) => [
    id,
    ['Seerah', index >= 11 ? 'Madinah' : 'Makkah', 'History'],
  ])
);

export const LIBRARY: Series[] = [
  {
    id: 'creation',
    title: 'Creation of the Universe',
    description: 'Foundations: creation, unseen beings, and the structure of the world.',
    coverImage: require('@/assets/covers/creation.jpg'),
    tags: ['Creation', 'Unseen', 'Foundations', 'Reflection'],
    chapters: buildChaptersFromMap(
      CREATION_CHAPTERS,
      ['Creation', 'Unseen', 'Foundations', 'Reflection'],
      12
    ),
  },
  {
    id: 'prophets',
    title: 'Stories of the Prophets',
    description: 'A narrated journey through early humanity and the lives of the Prophets-history, archaeology, and lessons.',
    coverImage: require('@/assets/covers/prophets.jpg'),
    tags: ['Reflection', 'History', 'Lessons'],
    chapters: buildChaptersFromMap(
      PROPHETS_CHAPTERS,
      ['Prophets', 'History', 'Reflection'],
      12,
      undefined,
      PROPHETS_TAG_OVERRIDES
    ),
  },
  {
    id: 'seerah-of-prophet-muhammad',
    title: 'Seerah of Prophet Muhammad ﷺ',
    description: 'A cinematic, modern narrated Seerah—origins, revelation, persecution, migration, community-building, and the completed message.',
    coverImage: require('@/assets/covers/seerah.jpg'),
    tags: ['Seerah', 'Makkah', 'Madinah', 'History'],
    chapters: buildChaptersFromMap(
      SEERAH_OF_PROPHET_MUHAMMAD_CHAPTERS,
      ['Seerah', 'History'],
      12,
      undefined,
      SEERAH_TAG_OVERRIDES
    ),
  },
  {
    id: 'sahaba',
    title: 'Life of the Four Rightly Guided Caliphs',
    description: 'Leadership, justice, sacrifice and legacy of the four greatest rulers after the Prophet \uFE0E.',
    coverImage: require('@/assets/covers/sahaba.jpg'),
    tags: ['Biography', 'Caliphs', 'Leadership', 'History'],
    chapters: [
      { id: 'ch01-the-silk-and-the-search-genesis', title: 'The Silk and the Search (Genesis)', tags: ['Abu Bakr', 'Makkah', 'Character', 'Faith', 'Early Islam'], readingTime: 8, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch01-the-silk-and-the-search-genesis') },
      { id: 'ch02-the-companion-of-the-cave', title: 'The Companion of the Cave', tags: ['Abu Bakr', 'Hijrah', 'Bilal', 'Thawr', 'Sacrifice'], readingTime: 8, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch02-the-companion-of-the-cave') },
      { id: 'ch03-the-shadow-of-the-prophet', title: 'The Shadow of the Prophet', tags: ['Abu Bakr', 'Hudaybiyyah', 'Tabuk', 'Companionship', 'Prayer'], readingTime: 11, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch03-the-shadow-of-the-prophet') },
      { id: 'ch04-the-fracture-of-saqifah', title: 'The Fracture of Saqifah', tags: ['Abu Bakr', 'Saqifah', 'Madinah', 'Leadership', 'Unity'], readingTime: 10, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch04-the-fracture-of-saqifah') },
      { id: 'ch05-the-iron-decree', title: 'The Iron Decree', tags: ['Abu Bakr', 'Riddah', 'Yamamah', 'Zakah', 'Resolve'], readingTime: 10, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch05-the-iron-decree') },
      { id: 'ch06-the-first-vault', title: 'The First Vault', tags: ['Abu Bakr', "Qur'an", 'Suhuf', 'Succession', 'Legacy'], readingTime: 13, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch06-the-first-vault') },
      { id: 'ch07-the-iron-of-al-khattab-genesis', title: 'The Iron of Al-Khattab (Genesis)', tags: ['Umar', 'Makkah', 'Conversion', 'Courage', 'Genesis'], readingTime: 15, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch07-the-iron-of-al-khattab-genesis') },
      { id: 'ch08-the-sword-of-the-hijrah', title: 'The Sword of the Hijrah', tags: ['Umar', 'Hijrah', 'Madinah', 'Badr', 'Grief'], readingTime: 9, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch08-the-sword-of-the-hijrah') },
      { id: 'ch09-the-inauguration-of-the-state', title: 'The Inauguration of the State', tags: ['Umar', 'Caliphate', 'Justice', 'Diwan', 'Governance'], readingTime: 11, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch09-the-inauguration-of-the-state') },
      { id: 'ch10-the-fall-of-the-superpowers', title: 'The Fall of the Superpowers', tags: ['Umar', 'Yarmuk', 'Qadisiyyah', 'Persia', 'Byzantium'], readingTime: 8, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch10-the-fall-of-the-superpowers') },
      { id: 'ch11-the-keys-of-jerusalem', title: 'The Keys of Jerusalem', tags: ['Umar', 'Jerusalem', 'Treaty', 'Justice', 'Sham'], readingTime: 10, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch11-the-keys-of-jerusalem') },
      { id: 'ch12-the-year-of-ashes', title: 'The Year of Ashes', tags: ['Umar', 'Famine', 'Service', 'Mercy', 'Accountability'], readingTime: 9, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch12-the-year-of-ashes') },
      { id: 'ch13-the-poisoned-blade', title: 'The Poisoned Blade', tags: ['Umar', 'Assassination', 'Shura', 'Martyrdom', 'Legacy'], readingTime: 11, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch13-the-poisoned-blade') },
      { id: 'ch14-the-aristocrats-sacrifice-genesis', title: "The Aristocrat's Sacrifice (Genesis)", tags: ['Uthman', 'Makkah', 'Modesty', 'Abyssinia', 'Persecution'], readingTime: 8, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch14-the-aristocrats-sacrifice-genesis') },
      { id: 'ch15-possessor-of-the-two-lights', title: 'Possessor of the Two Lights', tags: ['Uthman', 'Ruqayyah', 'Umm Kulthum', 'Badr', 'Grief'], readingTime: 7, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch15-possessor-of-the-two-lights') },
      { id: 'ch16-the-financier-of-heaven', title: 'The Financier of Heaven', tags: ['Uthman', 'Rumah', 'Tabuk', 'Generosity', 'Service'], readingTime: 8, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch16-the-financier-of-heaven') },
      { id: 'ch17-the-maritime-empire', title: 'The Maritime Empire', tags: ['Uthman', 'Caliphate', 'Navy', 'Cyprus', 'Expansion'], readingTime: 9, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch17-the-maritime-empire') },
      { id: 'ch18-the-universal-mushaf', title: 'The Universal Mushaf', tags: ['Uthman', "Qur'an", 'Mushaf', 'Preservation', 'Unity'], readingTime: 9, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch18-the-universal-mushaf') },
      { id: 'ch19-the-blood-on-the-parchment', title: 'The Blood on the Parchment', tags: ['Uthman', 'Siege', 'Madinah', 'Martyrdom', 'Fitnah'], readingTime: 10, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch19-the-blood-on-the-parchment') },
      { id: 'ch20-the-son-of-the-sanctuary-genesis', title: 'The Son of the Sanctuary (Genesis)', tags: ['Ali', 'Makkah', 'Childhood', 'Hijrah', 'Courage'], readingTime: 7, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch20-the-son-of-the-sanctuary-genesis') },
      { id: 'ch21-the-lion-of-badr-and-uhud', title: 'The Lion of Badr and Uhud', tags: ['Ali', 'Badr', 'Uhud', 'Fatimah', 'Courage'], readingTime: 7, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch21-the-lion-of-badr-and-uhud') },
      { id: 'ch22-the-sword-of-khaybar', title: 'The Sword of Khaybar', tags: ['Ali', 'Khandaq', 'Khaybar', 'Banner', 'Strength'], readingTime: 7, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch22-the-sword-of-khaybar') },
      { id: 'ch23-the-reluctant-sovereign', title: 'The Reluctant Sovereign', tags: ['Ali', 'Caliphate', 'Shura', 'Madinah', 'Fitnah'], readingTime: 6, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch23-the-reluctant-sovereign') },
      { id: 'ch24-the-tragedy-of-the-camel', title: 'The Tragedy of the Camel', tags: ['Ali', 'Basra', 'Aishah', 'Fitnah', 'Unity'], readingTime: 8, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch24-the-tragedy-of-the-camel') },
      { id: 'ch25-the-meat-grinder-of-siffin', title: 'The Meat Grinder of Siffin', tags: ['Ali', 'Siffin', 'Arbitration', 'Muawiyah', 'Crisis'], readingTime: 7, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch25-the-meat-grinder-of-siffin') },
      { id: 'ch26-the-poison-of-nahrawan', title: 'The Poison of Nahrawan', tags: ['Ali', 'Kharijites', 'Nahrawan', 'Kufa', 'Martyrdom'], readingTime: 7, text: t(RIGHTLY_GUIDED_CALIPHS_CHAPTERS, 'ch26-the-poison-of-nahrawan') },
    ],
  },
  {
    id: 'companions',
    title: 'Stories of the Companions',
    description: 'Short, powerful stories of the Companions—courage, sincerity and sacrifice.',
    coverImage: require('@/assets/covers/companions.jpg'),
    tags: ['Sahaba', 'Companions', 'Reflection', 'Lessons'],
    chapters: buildChaptersFromMap(
      COMPANIONS_V3_CHAPTERS,
      ['Sahaba', 'Companions', 'Reflection', 'Lessons'],
      14,
      COMPANIONS_TITLE_OVERRIDES,
      COMPANIONS_TAG_OVERRIDES
    ),
  },
  {
    id: 'women-sahabiyat',
    title: 'The Great Women of Islam',
    description: 'Short but powerful stories of the Great Women of Islam\u2014Scholarship, strength and devotion.',
    coverImage: require('@/assets/covers/women-sahabiyat.jpg'),
    tags: ['Sahabiyat', 'Reflection', 'Scholarship', 'Role Models'],
    chapters: [
      { id: 'ch01-hajar-the-matriarch-of-the-desert', title: 'The Matriarch of the Desert', tags: ['Hajar', 'Tawakkul', 'Motherhood', 'Makkah', 'Sabr'], readingTime: 16, text: t(GREAT_WOMEN_CHAPTERS, 'ch01-hajar-the-matriarch-of-the-desert') },
      { id: 'ch02-asiyah-the-queen-of-tyranny', title: 'The Queen of Tyranny', tags: ['Asiyah', 'Firawn', 'Faith', 'Resistance', 'Paradise'], readingTime: 12, text: t(GREAT_WOMEN_CHAPTERS, 'ch02-asiyah-the-queen-of-tyranny') },
      { id: 'ch03-maryam-the-miracle-of-devotion', title: 'The Miracle of Devotion', tags: ['Maryam', 'Devotion', 'Miracle', 'Purity', 'Worship'], readingTime: 24, text: t(GREAT_WOMEN_CHAPTERS, 'ch03-maryam-the-miracle-of-devotion') },
      { id: 'ch04-khadijah-the-syndicate-queen', title: 'The Syndicate Queen', tags: ['Khadijah', 'Makkah', 'Sacrifice', 'Commerce', 'Support'], readingTime: 26, text: t(GREAT_WOMEN_CHAPTERS, 'ch04-khadijah-the-syndicate-queen') },
      { id: 'ch05-sumayyah-the-first-blood', title: 'The First Blood', tags: ['Sumayyah', 'Martyrdom', 'Persecution', 'Tawhid', 'Steadfastness'], readingTime: 24, text: t(GREAT_WOMEN_CHAPTERS, 'ch05-sumayyah-the-first-blood') },
      { id: 'ch06-fatimah-bint-al-khattab-the-catalyst-of-iron', title: 'The Catalyst of Iron', tags: ['Fatimah bint al-Khattab', 'Umar', 'Conversion', 'Qur\'an', 'Courage'], readingTime: 23, text: t(GREAT_WOMEN_CHAPTERS, 'ch06-fatimah-bint-al-khattab-the-catalyst-of-iron') },
      { id: 'ch07-aishah-the-scholar-of-the-ummah', title: 'The Scholar of the Ummah', tags: ['Aishah', 'Hadith', 'Scholarship', 'Fiqh', 'Intelligence'], readingTime: 50, text: t(GREAT_WOMEN_CHAPTERS, 'ch07-aishah-the-scholar-of-the-ummah') },
      { id: 'ch08-fatimah-az-zahra-leader-of-the-women-of-paradise', title: 'Leader of the Women of Paradise', tags: ['Fatimah az-Zahra', 'Ahl al-Bayt', 'Asceticism', 'Patience', 'Paradise'], readingTime: 28, text: t(GREAT_WOMEN_CHAPTERS, 'ch08-fatimah-az-zahra-leader-of-the-women-of-paradise') },
      { id: 'ch09-nasibah-bint-kab-the-shield-of-uhud', title: 'The Shield of Uhud', tags: ['Nasibah bint Ka\'b', 'Uhud', 'Courage', 'Defense', 'Loyalty'], readingTime: 23, text: t(GREAT_WOMEN_CHAPTERS, 'ch09-nasibah-bint-kab-the-shield-of-uhud') },
      { id: 'ch10-umm-salamah-wisdom-in-the-storm', title: 'Wisdom in the Storm', tags: ['Umm Salamah', 'Wisdom', 'Hijrah', 'Counsel', 'Patience'], readingTime: 40, text: t(GREAT_WOMEN_CHAPTERS, 'ch10-umm-salamah-wisdom-in-the-storm') },
    ],
  },
];

export function getSeriesById(id: string): Series | undefined {
  return LIBRARY.find((s) => s.id === id);
}

export function getChapterById(seriesId: string, chapterId: string) {
  const series = getSeriesById(seriesId);
  if (!series) return undefined;
  const chapter = series.chapters.find((c) => c.id === chapterId);
  if (!chapter) return undefined;
  return { series, chapter };
}
