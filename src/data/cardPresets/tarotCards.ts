// 塔羅牌 78 張定義
// 大阿爾克那 22 張 + 小阿爾克那 56 張

export interface TarotCard {
  id: string;
  name: string;
  nameCN: string;
  category: 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
  number: number;
  keywords: string[];
  defaultPrompt: string;
}

// 大阿爾克那 (Major Arcana) - 22 張
export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 'major-0',
    name: 'The Fool',
    nameCN: '愚者',
    category: 'major',
    number: 0,
    keywords: ['新開始', '冒險', '純真', '自由'],
    defaultPrompt: 'The Fool tarot card, a young traveler with a small dog at the edge of a cliff, carrying a bundle, sun shining, mystical atmosphere'
  },
  {
    id: 'major-1',
    name: 'The Magician',
    nameCN: '魔術師',
    category: 'major',
    number: 1,
    keywords: ['意志力', '創造', '技能', '專注'],
    defaultPrompt: 'The Magician tarot card, a robed figure with one hand pointing to sky and one to earth, table with cup sword wand and pentacle, infinity symbol above head'
  },
  {
    id: 'major-2',
    name: 'The High Priestess',
    nameCN: '女祭司',
    category: 'major',
    number: 2,
    keywords: ['直覺', '神秘', '內在智慧', '潛意識'],
    defaultPrompt: 'The High Priestess tarot card, a serene woman seated between two pillars B and J, crescent moon at feet, scroll of Torah, veil with pomegranates'
  },
  {
    id: 'major-3',
    name: 'The Empress',
    nameCN: '皇后',
    category: 'major',
    number: 3,
    keywords: ['豐盛', '母性', '自然', '創造力'],
    defaultPrompt: 'The Empress tarot card, a regal woman on a throne in lush garden, crown of stars, wheat field, Venus symbol, pregnant or nurturing energy'
  },
  {
    id: 'major-4',
    name: 'The Emperor',
    nameCN: '皇帝',
    category: 'major',
    number: 4,
    keywords: ['權威', '結構', '領導', '穩定'],
    defaultPrompt: 'The Emperor tarot card, a stern bearded man on stone throne with ram heads, red robes, ankh scepter, mountains in background'
  },
  {
    id: 'major-5',
    name: 'The Hierophant',
    nameCN: '教皇',
    category: 'major',
    number: 5,
    keywords: ['傳統', '信仰', '教導', '精神指引'],
    defaultPrompt: 'The Hierophant tarot card, a religious figure seated between two pillars, triple crown, two acolytes kneeling, crossed keys'
  },
  {
    id: 'major-6',
    name: 'The Lovers',
    nameCN: '戀人',
    category: 'major',
    number: 6,
    keywords: ['愛情', '選擇', '和諧', '關係'],
    defaultPrompt: 'The Lovers tarot card, naked man and woman beneath an angel, tree of knowledge with serpent, tree of life with flames, garden of Eden'
  },
  {
    id: 'major-7',
    name: 'The Chariot',
    nameCN: '戰車',
    category: 'major',
    number: 7,
    keywords: ['意志', '勝利', '決心', '控制'],
    defaultPrompt: 'The Chariot tarot card, armored warrior in a chariot pulled by two sphinxes black and white, starry canopy, city walls behind'
  },
  {
    id: 'major-8',
    name: 'Strength',
    nameCN: '力量',
    category: 'major',
    number: 8,
    keywords: ['勇氣', '耐心', '內在力量', '溫柔'],
    defaultPrompt: 'Strength tarot card, a woman gently closing a lions mouth, infinity symbol above head, white robes, flower garland, calm expression'
  },
  {
    id: 'major-9',
    name: 'The Hermit',
    nameCN: '隱者',
    category: 'major',
    number: 9,
    keywords: ['內省', '智慧', '孤獨', '指引'],
    defaultPrompt: 'The Hermit tarot card, an old man in grey cloak on mountain peak, holding lantern with six-pointed star, staff in other hand'
  },
  {
    id: 'major-10',
    name: 'Wheel of Fortune',
    nameCN: '命運之輪',
    category: 'major',
    number: 10,
    keywords: ['命運', '轉變', '機會', '循環'],
    defaultPrompt: 'Wheel of Fortune tarot card, a great wheel with Hebrew letters TARO, sphinx on top, Anubis and serpent on sides, four winged creatures in corners'
  },
  {
    id: 'major-11',
    name: 'Justice',
    nameCN: '正義',
    category: 'major',
    number: 11,
    keywords: ['公正', '真相', '因果', '平衡'],
    defaultPrompt: 'Justice tarot card, a crowned figure seated between two pillars, holding scales in one hand and upright sword in other, red and green robes'
  },
  {
    id: 'major-12',
    name: 'The Hanged Man',
    nameCN: '倒吊人',
    category: 'major',
    number: 12,
    keywords: ['犧牲', '放下', '新視角', '等待'],
    defaultPrompt: 'The Hanged Man tarot card, a man suspended upside down from a T-shaped tree by one foot, serene expression, halo around head, crossed leg'
  },
  {
    id: 'major-13',
    name: 'Death',
    nameCN: '死神',
    category: 'major',
    number: 13,
    keywords: ['結束', '轉化', '重生', '改變'],
    defaultPrompt: 'Death tarot card, skeleton in black armor on white horse, carrying black flag with white rose, fallen king, rising sun between towers'
  },
  {
    id: 'major-14',
    name: 'Temperance',
    nameCN: '節制',
    category: 'major',
    number: 14,
    keywords: ['平衡', '耐心', '調和', '適度'],
    defaultPrompt: 'Temperance tarot card, an angel with one foot on land one in water, pouring liquid between two cups, sun on horizon, iris flowers'
  },
  {
    id: 'major-15',
    name: 'The Devil',
    nameCN: '惡魔',
    category: 'major',
    number: 15,
    keywords: ['束縛', '慾望', '物質', '陰影'],
    defaultPrompt: 'The Devil tarot card, Baphomet figure on black pedestal, inverted pentagram, two chained naked figures, bat wings, torch'
  },
  {
    id: 'major-16',
    name: 'The Tower',
    nameCN: '高塔',
    category: 'major',
    number: 16,
    keywords: ['劇變', '覺醒', '解放', '突破'],
    defaultPrompt: 'The Tower tarot card, a tall tower struck by lightning, crown falling, two figures falling, flames, dark stormy sky'
  },
  {
    id: 'major-17',
    name: 'The Star',
    nameCN: '星星',
    category: 'major',
    number: 17,
    keywords: ['希望', '靈感', '平靜', '更新'],
    defaultPrompt: 'The Star tarot card, a naked woman kneeling by water, pouring water from two jugs, large eight-pointed star above, seven smaller stars'
  },
  {
    id: 'major-18',
    name: 'The Moon',
    nameCN: '月亮',
    category: 'major',
    number: 18,
    keywords: ['幻覺', '恐懼', '直覺', '潛意識'],
    defaultPrompt: 'The Moon tarot card, full moon with face, dog and wolf howling, crayfish emerging from water, winding path between two towers'
  },
  {
    id: 'major-19',
    name: 'The Sun',
    nameCN: '太陽',
    category: 'major',
    number: 19,
    keywords: ['喜悅', '成功', '活力', '光明'],
    defaultPrompt: 'The Sun tarot card, large radiant sun with face, naked child on white horse, sunflowers, red banner, garden wall'
  },
  {
    id: 'major-20',
    name: 'Judgement',
    nameCN: '審判',
    category: 'major',
    number: 20,
    keywords: ['覺醒', '重生', '召喚', '反思'],
    defaultPrompt: 'Judgement tarot card, angel blowing trumpet from clouds, naked figures rising from coffins with arms raised, mountains in background'
  },
  {
    id: 'major-21',
    name: 'The World',
    nameCN: '世界',
    category: 'major',
    number: 21,
    keywords: ['完成', '整合', '成就', '圓滿'],
    defaultPrompt: 'The World tarot card, dancing figure in oval wreath, holding two wands, four creatures in corners angel eagle lion bull, completion'
  },
];

// 小阿爾克那 - 權杖 (Wands) - 14 張
export const MINOR_ARCANA_WANDS: TarotCard[] = [
  {
    id: 'wands-ace',
    name: 'Ace of Wands',
    nameCN: '權杖一',
    category: 'wands',
    number: 1,
    keywords: ['靈感', '潛力', '創造力', '新機會'],
    defaultPrompt: 'Ace of Wands tarot card, a hand emerging from cloud holding a sprouting wand, leaves falling, castle on distant hill'
  },
  {
    id: 'wands-2',
    name: 'Two of Wands',
    nameCN: '權杖二',
    category: 'wands',
    number: 2,
    keywords: ['計劃', '決定', '探索', '未來'],
    defaultPrompt: 'Two of Wands tarot card, a figure holding a globe standing between two tall wands, looking out from castle battlement over sea'
  },
  {
    id: 'wands-3',
    name: 'Three of Wands',
    nameCN: '權杖三',
    category: 'wands',
    number: 3,
    keywords: ['擴展', '遠見', '進展', '領導'],
    defaultPrompt: 'Three of Wands tarot card, a figure watching ships sail away, holding one wand with two others planted beside, cliff overlooking sea'
  },
  {
    id: 'wands-4',
    name: 'Four of Wands',
    nameCN: '權杖四',
    category: 'wands',
    number: 4,
    keywords: ['慶祝', '和諧', '家庭', '里程碑'],
    defaultPrompt: 'Four of Wands tarot card, four wands forming a canopy with garland, two figures celebrating, castle in background, joyful scene'
  },
  {
    id: 'wands-5',
    name: 'Five of Wands',
    nameCN: '權杖五',
    category: 'wands',
    number: 5,
    keywords: ['衝突', '競爭', '緊張', '挑戰'],
    defaultPrompt: 'Five of Wands tarot card, five young men in conflict wielding wands, chaotic scene, each fighting independently'
  },
  {
    id: 'wands-6',
    name: 'Six of Wands',
    nameCN: '權杖六',
    category: 'wands',
    number: 6,
    keywords: ['勝利', '認可', '成功', '自信'],
    defaultPrompt: 'Six of Wands tarot card, victorious figure on horseback with laurel wreath on wand, crowd following with wands raised'
  },
  {
    id: 'wands-7',
    name: 'Seven of Wands',
    nameCN: '權杖七',
    category: 'wands',
    number: 7,
    keywords: ['防禦', '堅持', '勇氣', '立場'],
    defaultPrompt: 'Seven of Wands tarot card, a figure on high ground defending against six wands from below, determined stance, one mismatched shoe'
  },
  {
    id: 'wands-8',
    name: 'Eight of Wands',
    nameCN: '權杖八',
    category: 'wands',
    number: 8,
    keywords: ['迅速', '行動', '訊息', '進展'],
    defaultPrompt: 'Eight of Wands tarot card, eight wands flying through clear sky over landscape, river below, sense of swift movement'
  },
  {
    id: 'wands-9',
    name: 'Nine of Wands',
    nameCN: '權杖九',
    category: 'wands',
    number: 9,
    keywords: ['堅韌', '警惕', '界限', '最後一步'],
    defaultPrompt: 'Nine of Wands tarot card, a weary wounded figure leaning on a wand, eight wands lined up behind like a fence, bandaged head'
  },
  {
    id: 'wands-10',
    name: 'Ten of Wands',
    nameCN: '權杖十',
    category: 'wands',
    number: 10,
    keywords: ['負擔', '責任', '壓力', '努力'],
    defaultPrompt: 'Ten of Wands tarot card, a figure struggling to carry ten heavy wands toward a distant town, bent over with burden'
  },
  {
    id: 'wands-page',
    name: 'Page of Wands',
    nameCN: '權杖侍者',
    category: 'wands',
    number: 11,
    keywords: ['熱情', '探索', '好奇', '消息'],
    defaultPrompt: 'Page of Wands tarot card, a young person holding a wand studying it with curiosity, desert landscape, salamanders on tunic'
  },
  {
    id: 'wands-knight',
    name: 'Knight of Wands',
    nameCN: '權杖騎士',
    category: 'wands',
    number: 12,
    keywords: ['冒險', '熱情', '衝動', '行動'],
    defaultPrompt: 'Knight of Wands tarot card, an armored knight on rearing horse holding raised wand, desert pyramids, salamanders on armor, fiery energy'
  },
  {
    id: 'wands-queen',
    name: 'Queen of Wands',
    nameCN: '權杖皇后',
    category: 'wands',
    number: 13,
    keywords: ['魅力', '自信', '獨立', '溫暖'],
    defaultPrompt: 'Queen of Wands tarot card, confident woman on throne holding wand and sunflower, black cat at feet, lions on throne, sunflower tapestry'
  },
  {
    id: 'wands-king',
    name: 'King of Wands',
    nameCN: '權杖國王',
    category: 'wands',
    number: 14,
    keywords: ['領導', '願景', '企業家', '榮譽'],
    defaultPrompt: 'King of Wands tarot card, a king on throne with salamanders and lions, holding wand, looking to the side, red robe and crown'
  },
];

// 小阿爾克那 - 聖杯 (Cups) - 14 張
export const MINOR_ARCANA_CUPS: TarotCard[] = [
  {
    id: 'cups-ace',
    name: 'Ace of Cups',
    nameCN: '聖杯一',
    category: 'cups',
    number: 1,
    keywords: ['愛', '新感情', '直覺', '靈性'],
    defaultPrompt: 'Ace of Cups tarot card, a hand holding overflowing chalice, dove descending with wafer, five streams of water, lotus flowers'
  },
  {
    id: 'cups-2',
    name: 'Two of Cups',
    nameCN: '聖杯二',
    category: 'cups',
    number: 2,
    keywords: ['連結', '夥伴', '吸引', '統一'],
    defaultPrompt: 'Two of Cups tarot card, a man and woman exchanging cups, caduceus with lion head above, pledging love, balanced partnership'
  },
  {
    id: 'cups-3',
    name: 'Three of Cups',
    nameCN: '聖杯三',
    category: 'cups',
    number: 3,
    keywords: ['友誼', '慶祝', '社交', '合作'],
    defaultPrompt: 'Three of Cups tarot card, three women dancing in a circle raising cups, harvest fruits on ground, joyful celebration'
  },
  {
    id: 'cups-4',
    name: 'Four of Cups',
    nameCN: '聖杯四',
    category: 'cups',
    number: 4,
    keywords: ['冷淡', '反思', '不滿', '機會'],
    defaultPrompt: 'Four of Cups tarot card, a figure sitting under tree with crossed arms, three cups before them, hand from cloud offering fourth cup'
  },
  {
    id: 'cups-5',
    name: 'Five of Cups',
    nameCN: '聖杯五',
    category: 'cups',
    number: 5,
    keywords: ['失落', '悲傷', '遺憾', '希望'],
    defaultPrompt: 'Five of Cups tarot card, a cloaked figure mourning over three spilled cups, two upright cups behind, bridge and castle in distance'
  },
  {
    id: 'cups-6',
    name: 'Six of Cups',
    nameCN: '聖杯六',
    category: 'cups',
    number: 6,
    keywords: ['懷舊', '童年', '純真', '記憶'],
    defaultPrompt: 'Six of Cups tarot card, a young boy giving a cup with flowers to a girl, garden with five other cups, old house, nostalgia'
  },
  {
    id: 'cups-7',
    name: 'Seven of Cups',
    nameCN: '聖杯七',
    category: 'cups',
    number: 7,
    keywords: ['幻想', '選擇', '想像', '誘惑'],
    defaultPrompt: 'Seven of Cups tarot card, a silhouette gazing at seven cups in clouds containing castle jewels wreath dragon snake head laurel figure'
  },
  {
    id: 'cups-8',
    name: 'Eight of Cups',
    nameCN: '聖杯八',
    category: 'cups',
    number: 8,
    keywords: ['離開', '放下', '尋找', '旅程'],
    defaultPrompt: 'Eight of Cups tarot card, a figure walking away from eight stacked cups toward mountains, moon eclipse, red cloak, night scene'
  },
  {
    id: 'cups-9',
    name: 'Nine of Cups',
    nameCN: '聖杯九',
    category: 'cups',
    number: 9,
    keywords: ['滿足', '願望', '幸福', '享受'],
    defaultPrompt: 'Nine of Cups tarot card, a satisfied man sitting with arms crossed, nine cups arranged on curved table behind, wish fulfillment'
  },
  {
    id: 'cups-10',
    name: 'Ten of Cups',
    nameCN: '聖杯十',
    category: 'cups',
    number: 10,
    keywords: ['家庭', '幸福', '和諧', '圓滿'],
    defaultPrompt: 'Ten of Cups tarot card, happy family couple with children, rainbow of ten cups in sky, peaceful home by river, joy and harmony'
  },
  {
    id: 'cups-page',
    name: 'Page of Cups',
    nameCN: '聖杯侍者',
    category: 'cups',
    number: 11,
    keywords: ['創意', '直覺', '敏感', '消息'],
    defaultPrompt: 'Page of Cups tarot card, a young person holding a cup with a fish emerging, blue tunic with lotus, surprised expression, by the sea'
  },
  {
    id: 'cups-knight',
    name: 'Knight of Cups',
    nameCN: '聖杯騎士',
    category: 'cups',
    number: 12,
    keywords: ['浪漫', '魅力', '想像力', '邀請'],
    defaultPrompt: 'Knight of Cups tarot card, a knight on white horse holding a cup, winged helmet, river landscape, graceful movement, artistic'
  },
  {
    id: 'cups-queen',
    name: 'Queen of Cups',
    nameCN: '聖杯皇后',
    category: 'cups',
    number: 13,
    keywords: ['同理心', '直覺', '療癒', '愛'],
    defaultPrompt: 'Queen of Cups tarot card, a beautiful queen on throne by water, holding ornate covered cup, mermaid decorations, contemplative'
  },
  {
    id: 'cups-king',
    name: 'King of Cups',
    nameCN: '聖杯國王',
    category: 'cups',
    number: 14,
    keywords: ['智慧', '平衡', '外交', '控制'],
    defaultPrompt: 'King of Cups tarot card, a king on throne amid turbulent sea, holding cup and scepter, fish amulet, calm amid chaos, emotionally balanced'
  },
];

// 小阿爾克那 - 寶劍 (Swords) - 14 張
export const MINOR_ARCANA_SWORDS: TarotCard[] = [
  {
    id: 'swords-ace',
    name: 'Ace of Swords',
    nameCN: '寶劍一',
    category: 'swords',
    number: 1,
    keywords: ['清晰', '真相', '突破', '新想法'],
    defaultPrompt: 'Ace of Swords tarot card, a hand from cloud holding upright sword with crown, olive and palm branches, mountains, clear sky'
  },
  {
    id: 'swords-2',
    name: 'Two of Swords',
    nameCN: '寶劍二',
    category: 'swords',
    number: 2,
    keywords: ['僵局', '決定', '平衡', '否認'],
    defaultPrompt: 'Two of Swords tarot card, a blindfolded woman holding two crossed swords, seated by water, crescent moon, rocky islands'
  },
  {
    id: 'swords-3',
    name: 'Three of Swords',
    nameCN: '寶劍三',
    category: 'swords',
    number: 3,
    keywords: ['心碎', '悲傷', '痛苦', '分離'],
    defaultPrompt: 'Three of Swords tarot card, a heart pierced by three swords, storm clouds and rain in background, sorrow and grief'
  },
  {
    id: 'swords-4',
    name: 'Four of Swords',
    nameCN: '寶劍四',
    category: 'swords',
    number: 4,
    keywords: ['休息', '恢復', '冥想', '療癒'],
    defaultPrompt: 'Four of Swords tarot card, a knight lying on tomb in prayer position, three swords on wall, one beneath, stained glass window'
  },
  {
    id: 'swords-5',
    name: 'Five of Swords',
    nameCN: '寶劍五',
    category: 'swords',
    number: 5,
    keywords: ['衝突', '失敗', '自利', '空虛'],
    defaultPrompt: 'Five of Swords tarot card, a smirking figure holding three swords, two on ground, two defeated figures walking away, stormy sky'
  },
  {
    id: 'swords-6',
    name: 'Six of Swords',
    nameCN: '寶劍六',
    category: 'swords',
    number: 6,
    keywords: ['過渡', '離開', '旅程', '平靜'],
    defaultPrompt: 'Six of Swords tarot card, a ferryman rowing a woman and child across water, six swords in boat, calm water ahead rough behind'
  },
  {
    id: 'swords-7',
    name: 'Seven of Swords',
    nameCN: '寶劍七',
    category: 'swords',
    number: 7,
    keywords: ['欺騙', '策略', '逃避', '獨行'],
    defaultPrompt: 'Seven of Swords tarot card, a figure sneaking away from camp carrying five swords, two left behind, looking back, tents in distance'
  },
  {
    id: 'swords-8',
    name: 'Eight of Swords',
    nameCN: '寶劍八',
    category: 'swords',
    number: 8,
    keywords: ['困境', '限制', '受害者', '無助'],
    defaultPrompt: 'Eight of Swords tarot card, a bound blindfolded woman surrounded by eight swords, water at feet, castle on cliff, trapped'
  },
  {
    id: 'swords-9',
    name: 'Nine of Swords',
    nameCN: '寶劍九',
    category: 'swords',
    number: 9,
    keywords: ['焦慮', '噩夢', '恐懼', '絕望'],
    defaultPrompt: 'Nine of Swords tarot card, a person sitting up in bed with head in hands, nine swords on dark wall, quilt with roses and zodiac'
  },
  {
    id: 'swords-10',
    name: 'Ten of Swords',
    nameCN: '寶劍十',
    category: 'swords',
    number: 10,
    keywords: ['結束', '背叛', '最低點', '重生'],
    defaultPrompt: 'Ten of Swords tarot card, a figure lying face down with ten swords in back, dark sky with golden dawn on horizon, water nearby'
  },
  {
    id: 'swords-page',
    name: 'Page of Swords',
    nameCN: '寶劍侍者',
    category: 'swords',
    number: 11,
    keywords: ['好奇', '警覺', '觀察', '訊息'],
    defaultPrompt: 'Page of Swords tarot card, a young person holding sword ready, windswept hair, clouds and birds, alert stance on uneven ground'
  },
  {
    id: 'swords-knight',
    name: 'Knight of Swords',
    nameCN: '寶劍騎士',
    category: 'swords',
    number: 12,
    keywords: ['行動', '野心', '衝動', '直接'],
    defaultPrompt: 'Knight of Swords tarot card, an armored knight charging on horse with raised sword, wind and storm clouds, butterflies and birds'
  },
  {
    id: 'swords-queen',
    name: 'Queen of Swords',
    nameCN: '寶劍皇后',
    category: 'swords',
    number: 13,
    keywords: ['獨立', '清晰', '客觀', '經驗'],
    defaultPrompt: 'Queen of Swords tarot card, a stern queen on stone throne holding upright sword, hand extended, butterflies, cloudy sky, widow'
  },
  {
    id: 'swords-king',
    name: 'King of Swords',
    nameCN: '寶劍國王',
    category: 'swords',
    number: 14,
    keywords: ['權威', '智慧', '公正', '真理'],
    defaultPrompt: 'King of Swords tarot card, a king on throne holding upright sword, blue robes, butterflies on throne, trees and clouds'
  },
];

// 小阿爾克那 - 錢幣 (Pentacles) - 14 張
export const MINOR_ARCANA_PENTACLES: TarotCard[] = [
  {
    id: 'pentacles-ace',
    name: 'Ace of Pentacles',
    nameCN: '錢幣一',
    category: 'pentacles',
    number: 1,
    keywords: ['機會', '繁榮', '新開始', '物質'],
    defaultPrompt: 'Ace of Pentacles tarot card, a hand from cloud holding a golden pentacle coin, garden with archway of flowers, path to mountains'
  },
  {
    id: 'pentacles-2',
    name: 'Two of Pentacles',
    nameCN: '錢幣二',
    category: 'pentacles',
    number: 2,
    keywords: ['平衡', '適應', '多工', '靈活'],
    defaultPrompt: 'Two of Pentacles tarot card, a young man juggling two pentacles in infinity loop, ships on rough seas behind, dancing pose'
  },
  {
    id: 'pentacles-3',
    name: 'Three of Pentacles',
    nameCN: '錢幣三',
    category: 'pentacles',
    number: 3,
    keywords: ['技藝', '合作', '學習', '品質'],
    defaultPrompt: 'Three of Pentacles tarot card, a craftsman working on cathedral arch, monk and architect consulting plans, three pentacles in arch'
  },
  {
    id: 'pentacles-4',
    name: 'Four of Pentacles',
    nameCN: '錢幣四',
    category: 'pentacles',
    number: 4,
    keywords: ['控制', '穩定', '吝嗇', '安全'],
    defaultPrompt: 'Four of Pentacles tarot card, a man clutching pentacle on crown, one under each foot, one held to chest, city behind, possessive'
  },
  {
    id: 'pentacles-5',
    name: 'Five of Pentacles',
    nameCN: '錢幣五',
    category: 'pentacles',
    number: 5,
    keywords: ['困難', '貧困', '孤立', '考驗'],
    defaultPrompt: 'Five of Pentacles tarot card, two beggars in snow outside church window with five pentacles, one on crutches, isolation and hardship'
  },
  {
    id: 'pentacles-6',
    name: 'Six of Pentacles',
    nameCN: '錢幣六',
    category: 'pentacles',
    number: 6,
    keywords: ['慷慨', '施捨', '分享', '平衡'],
    defaultPrompt: 'Six of Pentacles tarot card, a wealthy merchant with scales giving coins to kneeling beggars, six pentacles balanced, generosity'
  },
  {
    id: 'pentacles-7',
    name: 'Seven of Pentacles',
    nameCN: '錢幣七',
    category: 'pentacles',
    number: 7,
    keywords: ['評估', '耐心', '投資', '成長'],
    defaultPrompt: 'Seven of Pentacles tarot card, a farmer leaning on hoe looking at vine with seven pentacles, contemplating harvest, patience'
  },
  {
    id: 'pentacles-8',
    name: 'Eight of Pentacles',
    nameCN: '錢幣八',
    category: 'pentacles',
    number: 8,
    keywords: ['勤奮', '技能', '專注', '學徒'],
    defaultPrompt: 'Eight of Pentacles tarot card, a craftsman at workbench carving pentacles, six finished hanging, city in distance, dedication'
  },
  {
    id: 'pentacles-9',
    name: 'Nine of Pentacles',
    nameCN: '錢幣九',
    category: 'pentacles',
    number: 9,
    keywords: ['豐盛', '獨立', '成就', '享受'],
    defaultPrompt: 'Nine of Pentacles tarot card, an elegant woman in vineyard with falcon on hand, nine pentacles in lush garden, snail, self-sufficiency'
  },
  {
    id: 'pentacles-10',
    name: 'Ten of Pentacles',
    nameCN: '錢幣十',
    category: 'pentacles',
    number: 10,
    keywords: ['財富', '傳承', '家族', '安定'],
    defaultPrompt: 'Ten of Pentacles tarot card, elderly man with dogs and family under archway, ten pentacles in tree of life pattern, ancestral home'
  },
  {
    id: 'pentacles-page',
    name: 'Page of Pentacles',
    nameCN: '錢幣侍者',
    category: 'pentacles',
    number: 11,
    keywords: ['機會', '學習', '實際', '目標'],
    defaultPrompt: 'Page of Pentacles tarot card, a young person studying a pentacle intently, green landscape, plowed field, trees, careful consideration'
  },
  {
    id: 'pentacles-knight',
    name: 'Knight of Pentacles',
    nameCN: '錢幣騎士',
    category: 'pentacles',
    number: 12,
    keywords: ['努力', '責任', '穩重', '堅持'],
    defaultPrompt: 'Knight of Pentacles tarot card, a knight on heavy horse holding pentacle, dark horse standing still, plowed field, patient methodical'
  },
  {
    id: 'pentacles-queen',
    name: 'Queen of Pentacles',
    nameCN: '錢幣皇后',
    category: 'pentacles',
    number: 13,
    keywords: ['實際', '舒適', '滋養', '安全'],
    defaultPrompt: 'Queen of Pentacles tarot card, a queen on throne in blooming garden holding pentacle, rabbit at feet, roses, nurturing abundance'
  },
  {
    id: 'pentacles-king',
    name: 'King of Pentacles',
    nameCN: '錢幣國王',
    category: 'pentacles',
    number: 14,
    keywords: ['成功', '財富', '領導', '穩定'],
    defaultPrompt: 'King of Pentacles tarot card, a king on throne with bulls and vines, holding pentacle and scepter, castle and vineyards, prosperity'
  },
];

// 合併所有塔羅牌
export const ALL_TAROT_CARDS: TarotCard[] = [
  ...MAJOR_ARCANA,
  ...MINOR_ARCANA_WANDS,
  ...MINOR_ARCANA_CUPS,
  ...MINOR_ARCANA_SWORDS,
  ...MINOR_ARCANA_PENTACLES,
];

// 塔羅牌類別資訊
export const TAROT_DECK_INFO = {
  id: 'tarot',
  name: 'Tarot Deck',
  nameCN: '塔羅牌',
  description: '經典韋特塔羅牌，包含 22 張大阿爾克那和 56 張小阿爾克那',
  totalCards: 78,
  categories: [
    { id: 'major', name: '大阿爾克那', count: 22 },
    { id: 'wands', name: '權杖', count: 14 },
    { id: 'cups', name: '聖杯', count: 14 },
    { id: 'swords', name: '寶劍', count: 14 },
    { id: 'pentacles', name: '錢幣', count: 14 },
  ],
};
