// 盧恩符文 24 張定義 (Elder Futhark)
// 古北歐符文系統

export interface RuneCard {
  id: string;
  name: string;
  nameCN: string;
  unicode: string;
  meaning: string;
  meaningCN: string;
  keywords: string[];
  defaultPrompt: string;
}

// Elder Futhark 符文 - 24 張
export const ELDER_FUTHARK_RUNES: RuneCard[] = [
  // 第一組：Freyr's Aett (弗雷的八個符文)
  {
    id: 'rune-fehu',
    name: 'Fehu',
    nameCN: '菲胡',
    unicode: 'ᚠ',
    meaning: 'Cattle, Wealth',
    meaningCN: '牛群、財富',
    keywords: ['財富', '豐收', '成功', '能量'],
    defaultPrompt: 'Ancient Nordic rune card Fehu (ᚠ), carved in stone, golden glow, wealth and prosperity symbolism, mystical atmosphere'
  },
  {
    id: 'rune-uruz',
    name: 'Uruz',
    nameCN: '烏魯茲',
    unicode: 'ᚢ',
    meaning: 'Aurochs, Strength',
    meaningCN: '野牛、力量',
    keywords: ['力量', '健康', '勇氣', '生命力'],
    defaultPrompt: 'Ancient Nordic rune card Uruz (ᚢ), carved in stone, primal energy, wild ox symbolism, raw power aura'
  },
  {
    id: 'rune-thurisaz',
    name: 'Thurisaz',
    nameCN: '索里薩茲',
    unicode: 'ᚦ',
    meaning: 'Giant, Thorn',
    meaningCN: '巨人、荊棘',
    keywords: ['保護', '防禦', '力量', '衝突'],
    defaultPrompt: 'Ancient Nordic rune card Thurisaz (ᚦ), carved in stone, Thor hammer energy, protective thorn, defensive power'
  },
  {
    id: 'rune-ansuz',
    name: 'Ansuz',
    nameCN: '安蘇茲',
    unicode: 'ᚨ',
    meaning: 'God, Odin',
    meaningCN: '神、奧丁',
    keywords: ['智慧', '溝通', '神諭', '靈感'],
    defaultPrompt: 'Ancient Nordic rune card Ansuz (ᚨ), carved in stone, divine wisdom, Odin ravens, mystical blue glow'
  },
  {
    id: 'rune-raidho',
    name: 'Raidho',
    nameCN: '萊多',
    unicode: 'ᚱ',
    meaning: 'Ride, Journey',
    meaningCN: '騎乘、旅程',
    keywords: ['旅程', '移動', '節奏', '秩序'],
    defaultPrompt: 'Ancient Nordic rune card Raidho (ᚱ), carved in stone, journey symbolism, winding path, travel energy'
  },
  {
    id: 'rune-kenaz',
    name: 'Kenaz',
    nameCN: '肯納茲',
    unicode: 'ᚲ',
    meaning: 'Torch, Knowledge',
    meaningCN: '火炬、知識',
    keywords: ['知識', '創造力', '啟蒙', '技藝'],
    defaultPrompt: 'Ancient Nordic rune card Kenaz (ᚲ), carved in stone, torch flame illumination, knowledge and creativity glow'
  },
  {
    id: 'rune-gebo',
    name: 'Gebo',
    nameCN: '蓋博',
    unicode: 'ᚷ',
    meaning: 'Gift, Partnership',
    meaningCN: '禮物、夥伴',
    keywords: ['禮物', '交換', '平衡', '夥伴關係'],
    defaultPrompt: 'Ancient Nordic rune card Gebo (ᚷ), carved in stone, X shape perfect balance, gift exchange energy, partnership'
  },
  {
    id: 'rune-wunjo',
    name: 'Wunjo',
    nameCN: '溫究',
    unicode: 'ᚹ',
    meaning: 'Joy, Bliss',
    meaningCN: '喜悅、幸福',
    keywords: ['喜悅', '幸福', '和諧', '成功'],
    defaultPrompt: 'Ancient Nordic rune card Wunjo (ᚹ), carved in stone, joyful golden light, happiness and harmony energy'
  },

  // 第二組：Heimdall's Aett (海姆達爾的八個符文)
  {
    id: 'rune-hagalaz',
    name: 'Hagalaz',
    nameCN: '哈格拉茲',
    unicode: 'ᚺ',
    meaning: 'Hail, Destruction',
    meaningCN: '冰雹、破壞',
    keywords: ['改變', '破壞', '自然力量', '淨化'],
    defaultPrompt: 'Ancient Nordic rune card Hagalaz (ᚺ), carved in ice, hailstorm energy, destructive transformation, winter storm'
  },
  {
    id: 'rune-nauthiz',
    name: 'Nauthiz',
    nameCN: '諾西茲',
    unicode: 'ᚾ',
    meaning: 'Need, Necessity',
    meaningCN: '需要、必要',
    keywords: ['需求', '限制', '耐心', '自律'],
    defaultPrompt: 'Ancient Nordic rune card Nauthiz (ᚾ), carved in stone, constraint energy, need fire, determination glow'
  },
  {
    id: 'rune-isa',
    name: 'Isa',
    nameCN: '伊薩',
    unicode: 'ᛁ',
    meaning: 'Ice, Stillness',
    meaningCN: '冰、靜止',
    keywords: ['靜止', '冰凍', '專注', '等待'],
    defaultPrompt: 'Ancient Nordic rune card Isa (ᛁ), carved in pure ice crystal, frozen stillness, meditation and patience'
  },
  {
    id: 'rune-jera',
    name: 'Jera',
    nameCN: '耶拉',
    unicode: 'ᛃ',
    meaning: 'Year, Harvest',
    meaningCN: '年、收穫',
    keywords: ['收穫', '循環', '回報', '耐心'],
    defaultPrompt: 'Ancient Nordic rune card Jera (ᛃ), carved in stone, harvest golden wheat, seasonal cycle, abundance energy'
  },
  {
    id: 'rune-eihwaz',
    name: 'Eihwaz',
    nameCN: '艾瓦茲',
    unicode: 'ᛇ',
    meaning: 'Yew Tree, Defense',
    meaningCN: '紫杉樹、防禦',
    keywords: ['保護', '耐力', '轉化', '死亡與重生'],
    defaultPrompt: 'Ancient Nordic rune card Eihwaz (ᛇ), carved in yew wood, world tree connection, protection and endurance'
  },
  {
    id: 'rune-perthro',
    name: 'Perthro',
    nameCN: '佩索',
    unicode: 'ᛈ',
    meaning: 'Dice Cup, Fate',
    meaningCN: '骰子杯、命運',
    keywords: ['命運', '神秘', '機會', '未知'],
    defaultPrompt: 'Ancient Nordic rune card Perthro (ᛈ), carved in bone, dice cup mystery, fate and destiny, secrets revealed'
  },
  {
    id: 'rune-algiz',
    name: 'Algiz',
    nameCN: '阿爾吉茲',
    unicode: 'ᛉ',
    meaning: 'Elk, Protection',
    meaningCN: '麋鹿、保護',
    keywords: ['保護', '防禦', '神聖', '覺醒'],
    defaultPrompt: 'Ancient Nordic rune card Algiz (ᛉ), carved in stone, elk antler protection, divine shield, spiritual defense'
  },
  {
    id: 'rune-sowilo',
    name: 'Sowilo',
    nameCN: '索維羅',
    unicode: 'ᛊ',
    meaning: 'Sun, Victory',
    meaningCN: '太陽、勝利',
    keywords: ['成功', '勝利', '能量', '榮耀'],
    defaultPrompt: 'Ancient Nordic rune card Sowilo (ᛊ), carved in gold, blazing sun energy, victory and success, radiant power'
  },

  // 第三組：Tyr's Aett (提爾的八個符文)
  {
    id: 'rune-tiwaz',
    name: 'Tiwaz',
    nameCN: '提瓦茲',
    unicode: 'ᛏ',
    meaning: 'Tyr, Justice',
    meaningCN: '提爾、正義',
    keywords: ['正義', '榮譽', '領導', '勝利'],
    defaultPrompt: 'Ancient Nordic rune card Tiwaz (ᛏ), carved in iron, warrior god Tyr, justice arrow, honor and courage'
  },
  {
    id: 'rune-berkano',
    name: 'Berkano',
    nameCN: '貝爾卡諾',
    unicode: 'ᛒ',
    meaning: 'Birch, Birth',
    meaningCN: '樺樹、誕生',
    keywords: ['新生', '成長', '療癒', '母性'],
    defaultPrompt: 'Ancient Nordic rune card Berkano (ᛒ), carved in birch bark, new growth energy, birth and fertility, nurturing'
  },
  {
    id: 'rune-ehwaz',
    name: 'Ehwaz',
    nameCN: '艾瓦茲',
    unicode: 'ᛖ',
    meaning: 'Horse, Movement',
    meaningCN: '馬、移動',
    keywords: ['進步', '信任', '合作', '忠誠'],
    defaultPrompt: 'Ancient Nordic rune card Ehwaz (ᛖ), carved in stone, noble horse partnership, movement and trust, loyal bond'
  },
  {
    id: 'rune-mannaz',
    name: 'Mannaz',
    nameCN: '曼納茲',
    unicode: 'ᛗ',
    meaning: 'Man, Humanity',
    meaningCN: '人類、人性',
    keywords: ['自我', '人性', '智慧', '社會'],
    defaultPrompt: 'Ancient Nordic rune card Mannaz (ᛗ), carved in stone, human essence, self-awareness, collective humanity'
  },
  {
    id: 'rune-laguz',
    name: 'Laguz',
    nameCN: '拉古茲',
    unicode: 'ᛚ',
    meaning: 'Water, Flow',
    meaningCN: '水、流動',
    keywords: ['直覺', '情感', '夢境', '潛意識'],
    defaultPrompt: 'Ancient Nordic rune card Laguz (ᛚ), carved in stone, flowing water energy, intuition and dreams, ocean depths'
  },
  {
    id: 'rune-ingwaz',
    name: 'Ingwaz',
    nameCN: '因瓦茲',
    unicode: 'ᛝ',
    meaning: 'Ing, Fertility',
    meaningCN: '英格、生育',
    keywords: ['潛能', '孕育', '內在成長', '完成'],
    defaultPrompt: 'Ancient Nordic rune card Ingwaz (ᛝ), carved in fertile earth, seed of potential, inner growth, gestation'
  },
  {
    id: 'rune-dagaz',
    name: 'Dagaz',
    nameCN: '達加茲',
    unicode: 'ᛞ',
    meaning: 'Day, Breakthrough',
    meaningCN: '白日、突破',
    keywords: ['覺醒', '突破', '轉化', '光明'],
    defaultPrompt: 'Ancient Nordic rune card Dagaz (ᛞ), carved in light stone, dawn breakthrough, transformation, new day rising'
  },
  {
    id: 'rune-othala',
    name: 'Othala',
    nameCN: '奧薩拉',
    unicode: 'ᛟ',
    meaning: 'Heritage, Ancestry',
    meaningCN: '遺產、祖先',
    keywords: ['傳承', '家園', '祖先', '歸屬'],
    defaultPrompt: 'Ancient Nordic rune card Othala (ᛟ), carved in ancient stone, ancestral home, heritage and belonging, roots'
  },
];

// 盧恩符文類別資訊
export const RUNE_DECK_INFO = {
  id: 'rune',
  name: 'Elder Futhark Runes',
  nameCN: '盧恩符文',
  description: '古北歐 Elder Futhark 符文系統，共 24 個神聖符文',
  totalCards: 24,
  categories: [
    { id: 'freyr', name: '弗雷之組', count: 8 },
    { id: 'heimdall', name: '海姆達爾之組', count: 8 },
    { id: 'tyr', name: '提爾之組', count: 8 },
  ],
};
