// 水晶神諭卡定義
// 透過水晶的能量與意義，提供指引與療癒訊息

/**
 * 統一的解讀資料結構
 * 這是所有神諭卡類型共用的格式，便於後續新增其他類型
 */
export interface OracleInterpretation {
  caption: string;  // 標題/情境 (如「愛情」、「事業」等，可為空)
  content: string;  // 解讀內容
}

/**
 * 水晶神諭卡資料結構
 */
export interface CrystalOracleCard {
  id: string;
  name: string;           // 英文名稱
  nameCN: string;         // 中文名稱
  title: string;          // 完整標題 (中文名稱 + 英文名稱)
  keywords: string[];     // 關鍵字
  interpretations: OracleInterpretation[];  // 解讀內容
  defaultPrompt: string;  // AI 圖片生成提示詞
}

// 水晶神諭卡 - 44 張
export const CRYSTAL_ORACLE_CARDS: CrystalOracleCard[] = [
  {
    id: 'crystal-amethyst',
    name: 'Amethyst',
    nameCN: '紫水晶',
    title: '紫水晶 (Amethyst)',
    keywords: ['直覺', '靈性', '淨化', '智慧', '冥想'],
    interpretations: [
      { caption: '', content: '紫水晶帶來神聖的智慧與靈性提升。現在是深入冥想、連結高我的最佳時機。讓紫水晶的能量淨化你的思緒，開啟直覺的通道。這張卡牌提醒你信任內在的聲音，它正引導你走向更高的意識層次。' }
    ],
    defaultPrompt: 'Crystal oracle card Amethyst, deep purple crystal formation, mystical violet aura, spiritual wisdom, meditation energy'
  },
  {
    id: 'crystal-rose-quartz',
    name: 'Rose Quartz',
    nameCN: '粉晶',
    title: '粉晶 (Rose Quartz)',
    keywords: ['愛', '療癒', '自愛', '寬恕', '溫柔'],
    interpretations: [
      { caption: '', content: '粉晶散發著無條件的愛的能量。這張卡牌邀請你打開心輪，首先學會愛自己。透過自我接納與寬恕，你將吸引更多愛進入生命。讓粉晶的溫柔能量療癒過去的傷痛，擁抱當下的美好。' }
    ],
    defaultPrompt: 'Crystal oracle card Rose Quartz, soft pink crystal cluster, gentle loving energy, heart healing, ethereal pink glow'
  },
  {
    id: 'crystal-clear-quartz',
    name: 'Clear Quartz',
    nameCN: '白水晶',
    title: '白水晶 (Clear Quartz)',
    keywords: ['清晰', '能量', '放大', '專注', '淨化'],
    interpretations: [
      { caption: '', content: '白水晶是水晶之王，能放大一切能量與意圖。現在是設定清晰目標的時刻，讓白水晶幫助你聚焦能量。這張卡牌提醒你淨化思緒，保持心智清明，你的意念正在被放大並顯化為現實。' }
    ],
    defaultPrompt: 'Crystal oracle card Clear Quartz, pristine transparent crystal point, pure white light energy, clarity and amplification'
  },
  {
    id: 'crystal-citrine',
    name: 'Citrine',
    nameCN: '黃水晶',
    title: '黃水晶 (Citrine)',
    keywords: ['豐盛', '財富', '喜悅', '自信', '創造力'],
    interpretations: [
      { caption: '', content: '黃水晶帶來陽光般的正能量與豐盛。這張卡牌預示財富與機會正在流向你。保持積極樂觀的心態，擁抱你的創造力。黃水晶提醒你，你值得擁有生命中所有的美好，豐盛是你的天生權利。' }
    ],
    defaultPrompt: 'Crystal oracle card Citrine, golden yellow crystal formation, sunny abundance energy, wealth and prosperity glow'
  },
  {
    id: 'crystal-black-tourmaline',
    name: 'Black Tourmaline',
    nameCN: '黑碧璽',
    title: '黑碧璽 (Black Tourmaline)',
    keywords: ['保護', '接地', '淨化', '安全', '穩定'],
    interpretations: [
      { caption: '', content: '黑碧璽是強大的保護石，能吸收並轉化負能量。這張卡牌提醒你建立能量邊界，保護自己免受外在干擾。接地並穩固自己，讓黑碧璽為你創造安全的能量場，你被神聖的保護所圍繞。' }
    ],
    defaultPrompt: 'Crystal oracle card Black Tourmaline, striated black crystal, protective shield energy, grounding earth energy'
  },
  {
    id: 'crystal-lapis-lazuli',
    name: 'Lapis Lazuli',
    nameCN: '青金石',
    title: '青金石 (Lapis Lazuli)',
    keywords: ['智慧', '真理', '表達', '洞察', '皇室'],
    interpretations: [
      { caption: '', content: '青金石連接著古老的智慧與真理。這張卡牌鼓勵你說出真相，表達你的真實想法。深入探索內在的智慧，讓青金石引導你看穿表象，理解更深層的真相。你的聲音需要被聽見。' }
    ],
    defaultPrompt: 'Crystal oracle card Lapis Lazuli, deep blue stone with golden pyrite flecks, wisdom and truth, royal night sky'
  },
  {
    id: 'crystal-moonstone',
    name: 'Moonstone',
    nameCN: '月光石',
    title: '月光石 (Moonstone)',
    keywords: ['女性能量', '直覺', '週期', '新開始', '情緒'],
    interpretations: [
      { caption: '', content: '月光石帶來月亮女神的祝福。這張卡牌與你的情緒循環和直覺深深連結。擁抱你的陰性能量，信任生命的自然節奏。月光石預示著新的開始，就像新月帶來重生的機會。' }
    ],
    defaultPrompt: 'Crystal oracle card Moonstone, iridescent white stone with blue flash, feminine moon energy, ethereal glow'
  },
  {
    id: 'crystal-obsidian',
    name: 'Obsidian',
    nameCN: '黑曜石',
    title: '黑曜石 (Obsidian)',
    keywords: ['轉化', '真相', '陰影', '保護', '釋放'],
    interpretations: [
      { caption: '', content: '黑曜石是真相的鏡子，幫助你面對陰影面。這張卡牌邀請你深入探索那些被隱藏的部分，在黑暗中找到光明。釋放不再服務你的一切，讓黑曜石幫助你完成深層的轉化與療癒。' }
    ],
    defaultPrompt: 'Crystal oracle card Obsidian, shiny black volcanic glass, shadow work energy, mirror of truth, deep transformation'
  },
  {
    id: 'crystal-tigers-eye',
    name: 'Tiger\'s Eye',
    nameCN: '虎眼石',
    title: '虎眼石 (Tiger\'s Eye)',
    keywords: ['勇氣', '意志力', '行動', '專注', '信心'],
    interpretations: [
      { caption: '', content: '虎眼石賦予你老虎般的力量與勇氣。這張卡牌呼喚你採取行動，追求你的目標。用堅定的意志力克服障礙，讓虎眼石的能量激發你的內在勇氣。現在是展現力量、邁向成功的時刻。' }
    ],
    defaultPrompt: 'Crystal oracle card Tiger\'s Eye, golden brown chatoyant stone, fierce courage energy, powerful action, cat eye effect'
  },
  {
    id: 'crystal-malachite',
    name: 'Malachite',
    nameCN: '孔雀石',
    title: '孔雀石 (Malachite)',
    keywords: ['轉變', '療癒', '心輪', '保護', '成長'],
    interpretations: [
      { caption: '', content: '孔雀石帶來深層的情緒療癒與轉變。這張卡牌象徵著心輪的開啟與保護。讓孔雀石幫助你釋放舊的情感模式，迎接個人成長。改變可能令人不安，但它是通往更好自己的必經之路。' }
    ],
    defaultPrompt: 'Crystal oracle card Malachite, deep green with swirling bands, heart transformation, protective growth energy'
  },
  {
    id: 'crystal-carnelian',
    name: 'Carnelian',
    nameCN: '紅玉髓',
    title: '紅玉髓 (Carnelian)',
    keywords: ['活力', '創造力', '熱情', '動力', '勇氣'],
    interpretations: [
      { caption: '', content: '紅玉髓點燃你的內在之火與創造力。這張卡牌帶來活力與熱情，推動你向前邁進。連結你的本我能量，讓紅玉髓激發你的創意與動力。現在是追求熱愛事物的最佳時機。' }
    ],
    defaultPrompt: 'Crystal oracle card Carnelian, warm orange-red stone, passionate fire energy, creative vitality, sacral chakra'
  },
  {
    id: 'crystal-labradorite',
    name: 'Labradorite',
    nameCN: '拉長石',
    title: '拉長石 (Labradorite)',
    keywords: ['魔法', '轉化', '直覺', '保護', '靈性覺醒'],
    interpretations: [
      { caption: '', content: '拉長石是魔法與神秘的守護者。這張卡牌預示著靈性覺醒與神奇的同步性。讓拉長石保護你的能量場，同時開啟超自然的感知能力。相信生命中的魔法，奇蹟正在發生。' }
    ],
    defaultPrompt: 'Crystal oracle card Labradorite, iridescent play of colors, magical transformation, aurora borealis effect'
  },
  {
    id: 'crystal-turquoise',
    name: 'Turquoise',
    nameCN: '綠松石',
    title: '綠松石 (Turquoise)',
    keywords: ['保護', '溝通', '療癒', '智慧', '旅行'],
    interpretations: [
      { caption: '', content: '綠松石自古以來就是神聖的保護石。這張卡牌帶來喉輪的療癒與溝通的力量。讓綠松石守護你的旅程，無論是身體還是靈性的旅行。表達你的真理，你的話語擁有療癒的力量。' }
    ],
    defaultPrompt: 'Crystal oracle card Turquoise, blue-green opaque stone, protective healing, ancient wisdom, throat chakra'
  },
  {
    id: 'crystal-amazonite',
    name: 'Amazonite',
    nameCN: '天河石',
    title: '天河石 (Amazonite)',
    keywords: ['和諧', '真誠', '勇氣', '希望', '平衡'],
    interpretations: [
      { caption: '', content: '天河石帶來心與喉的和諧連結。這張卡牌鼓勵你勇敢說出內心的真相，保持希望與樂觀。讓天河石幫助你在關係中找到平衡，用真誠的溝通化解衝突，重建和諧。' }
    ],
    defaultPrompt: 'Crystal oracle card Amazonite, soothing green-blue stone, harmonious communication, hope and courage'
  },
  {
    id: 'crystal-fluorite',
    name: 'Fluorite',
    nameCN: '螢石',
    title: '螢石 (Fluorite)',
    keywords: ['專注', '清晰', '學習', '秩序', '淨化'],
    interpretations: [
      { caption: '', content: '螢石帶來心智的清晰與專注。這張卡牌適合學習與思考的時期。讓螢石幫助你整理混亂的思緒，建立清晰的秩序。淨化你的能量場，保持專注於重要的目標。' }
    ],
    defaultPrompt: 'Crystal oracle card Fluorite, multicolored translucent crystal, mental clarity, rainbow organization energy'
  },
  {
    id: 'crystal-jade',
    name: 'Jade',
    nameCN: '翡翠',
    title: '翡翠 (Jade)',
    keywords: ['幸運', '和諧', '繁榮', '長壽', '智慧'],
    interpretations: [
      { caption: '', content: '翡翠自古以來象徵著好運與繁榮。這張卡牌帶來和諧與幸福的能量。讓翡翠的智慧引導你做出正確的選擇，吸引繁榮與好運進入生命。你被祝福包圍，幸運之神眷顧著你。' }
    ],
    defaultPrompt: 'Crystal oracle card Jade, rich green translucent stone, prosperity and luck, Eastern wisdom, harmonious energy'
  },
  {
    id: 'crystal-selenite',
    name: 'Selenite',
    nameCN: '透石膏',
    title: '透石膏 (Selenite)',
    keywords: ['淨化', '靈性', '天使', '高振動', '光'],
    interpretations: [
      { caption: '', content: '透石膏是最高振動的水晶之一，連結著天使領域。這張卡牌帶來光明與淨化的能量。讓透石膏清除所有阻塞，打開你與更高指引的連結。天使正在傳遞訊息給你，保持敞開接收。' }
    ],
    defaultPrompt: 'Crystal oracle card Selenite, luminous white crystal wand, angelic light, high vibration purification'
  },
  {
    id: 'crystal-aquamarine',
    name: 'Aquamarine',
    nameCN: '海藍寶',
    title: '海藍寶 (Aquamarine)',
    keywords: ['平靜', '勇氣', '溝通', '淨化', '水元素'],
    interpretations: [
      { caption: '', content: '海藍寶帶來大海般的平靜與清澈。這張卡牌幫助你在情緒的波浪中保持穩定。讓海藍寶淨化你的溝通，給予你說出真相的勇氣。像海水一樣流動，接受生命的變化。' }
    ],
    defaultPrompt: 'Crystal oracle card Aquamarine, pale blue-green crystal, ocean calm energy, water element, peaceful communication'
  },
  {
    id: 'crystal-garnet',
    name: 'Garnet',
    nameCN: '石榴石',
    title: '石榴石 (Garnet)',
    keywords: ['激情', '活力', '承諾', '愛情', '根基'],
    interpretations: [
      { caption: '', content: '石榴石燃燒著深沉的激情與生命力。這張卡牌帶來愛情與承諾的能量。讓石榴石幫助你建立穩固的根基，點燃內心的熱情。無論是愛情還是事業，現在是全力投入的時刻。' }
    ],
    defaultPrompt: 'Crystal oracle card Garnet, deep red crystal, passionate love energy, commitment fire, root chakra'
  },
  {
    id: 'crystal-aventurine',
    name: 'Aventurine',
    nameCN: '東菱石',
    title: '東菱石 (Aventurine)',
    keywords: ['幸運', '機會', '繁榮', '心輪', '樂觀'],
    interpretations: [
      { caption: '', content: '東菱石被稱為機會之石，帶來好運與繁榮。這張卡牌預示新的機會正在向你走來。打開心輪迎接豐盛，保持樂觀的態度。東菱石提醒你，幸運青睞那些準備好的人。' }
    ],
    defaultPrompt: 'Crystal oracle card Aventurine, green shimmering stone, lucky opportunity, prosperity energy, heart opening'
  },
  {
    id: 'crystal-rhodonite',
    name: 'Rhodonite',
    nameCN: '薔薇輝石',
    title: '薔薇輝石 (Rhodonite)',
    keywords: ['療癒', '寬恕', '情緒平衡', '自愛', '慈悲'],
    interpretations: [
      { caption: '', content: '薔薇輝石是情緒療癒的大師。這張卡牌邀請你療癒舊的傷痛，練習寬恕。讓薔薇輝石幫助你找回情緒的平衡，用慈悲對待自己和他人。釋放過去，擁抱內心的和平。' }
    ],
    defaultPrompt: 'Crystal oracle card Rhodonite, pink and black stone, emotional healing, forgiveness energy, heart balance'
  },
  {
    id: 'crystal-hematite',
    name: 'Hematite',
    nameCN: '赤鐵礦',
    title: '赤鐵礦 (Hematite)',
    keywords: ['接地', '穩定', '保護', '意志力', '專注'],
    interpretations: [
      { caption: '', content: '赤鐵礦帶來強大的接地與穩定能量。這張卡牌提醒你腳踏實地，專注於當下。讓赤鐵礦幫助你強化意志力，保護你的能量不被消耗。在穩固的根基上，建立你的夢想。' }
    ],
    defaultPrompt: 'Crystal oracle card Hematite, metallic silvery black stone, powerful grounding, Earth stability, protective shield'
  },
  {
    id: 'crystal-pyrite',
    name: 'Pyrite',
    nameCN: '黃鐵礦',
    title: '黃鐵礦 (Pyrite)',
    keywords: ['財富', '保護', '意志力', '行動', '顯化'],
    interpretations: [
      { caption: '', content: '黃鐵礦閃耀著成功與財富的光芒。這張卡牌帶來顯化與行動的能量。讓黃鐵礦激發你的意志力，保護你免受負能量干擾。相信你的價值，大膽追求財務豐盛。' }
    ],
    defaultPrompt: 'Crystal oracle card Pyrite, golden metallic cubes, wealth manifestation, fool\'s gold, abundance protection'
  },
  {
    id: 'crystal-sodalite',
    name: 'Sodalite',
    nameCN: '方鈉石',
    title: '方鈉石 (Sodalite)',
    keywords: ['邏輯', '真理', '直覺', '溝通', '理性'],
    interpretations: [
      { caption: '', content: '方鈉石平衡邏輯與直覺的力量。這張卡牌幫助你用理性思考，同時保持對真理的追求。讓方鈉石開啟你的第三眼，增強直覺能力。在做決定時，結合頭腦與內心的智慧。' }
    ],
    defaultPrompt: 'Crystal oracle card Sodalite, deep blue stone with white veins, logical intuition, third eye wisdom'
  },
  {
    id: 'crystal-kyanite',
    name: 'Kyanite',
    nameCN: '藍晶石',
    title: '藍晶石 (Kyanite)',
    keywords: ['溝通', '對齊', '平衡', '夢境', '直覺'],
    interpretations: [
      { caption: '', content: '藍晶石是脈輪對齊的高手，能瞬間平衡所有能量中心。這張卡牌帶來清晰的溝通與夢境訊息。讓藍晶石幫助你對齊內在與外在，連結更高的指引。留意夢中的訊息。' }
    ],
    defaultPrompt: 'Crystal oracle card Kyanite, blue blade-like crystal, chakra alignment, dream communication, energy bridge'
  },
  {
    id: 'crystal-sunstone',
    name: 'Sunstone',
    nameCN: '日光石',
    title: '日光石 (Sunstone)',
    keywords: ['喜悅', '領導', '活力', '獨立', '正向'],
    interpretations: [
      { caption: '', content: '日光石閃耀著太陽的光芒與喜悅。這張卡牌鼓勵你展現領導力，擁抱你的獨立性。讓日光石的正向能量驅散陰霾，帶來活力與熱情。你是自己生命的太陽，照亮前行的道路。' }
    ],
    defaultPrompt: 'Crystal oracle card Sunstone, golden orange shimmering stone, solar energy joy, leadership light, positive radiance'
  },
  {
    id: 'crystal-smoky-quartz',
    name: 'Smoky Quartz',
    nameCN: '茶晶',
    title: '茶晶 (Smoky Quartz)',
    keywords: ['接地', '釋放', '保護', '實際', '轉化'],
    interpretations: [
      { caption: '', content: '茶晶幫助你將夢想落實到現實中。這張卡牌帶來接地與釋放的能量。讓茶晶幫助你放下負面情緒與不再需要的一切。在穩固的地基上，你的願望才能真正實現。' }
    ],
    defaultPrompt: 'Crystal oracle card Smoky Quartz, translucent brown-grey crystal, grounding release, protective transformation'
  },
  {
    id: 'crystal-chrysocolla',
    name: 'Chrysocolla',
    nameCN: '矽孔雀石',
    title: '矽孔雀石 (Chrysocolla)',
    keywords: ['表達', '女神', '智慧', '平靜', '療癒'],
    interpretations: [
      { caption: '', content: '矽孔雀石帶來女神的智慧與溫柔力量。這張卡牌鼓勵你用智慧和平靜表達自己。讓矽孔雀石幫助你找到內在的平靜，用療癒的話語影響他人。你的聲音是一種禮物。' }
    ],
    defaultPrompt: 'Crystal oracle card Chrysocolla, blue-green goddess stone, wise expression, feminine power, peaceful healing'
  },
  {
    id: 'crystal-lepidolite',
    name: 'Lepidolite',
    nameCN: '鋰雲母',
    title: '鋰雲母 (Lepidolite)',
    keywords: ['平靜', '過渡', '壓力釋放', '平衡', '療癒'],
    interpretations: [
      { caption: '', content: '鋰雲母是過渡時期的最佳伴侶，帶來深層的平靜。這張卡牌幫助你在變化中保持穩定，釋放壓力與焦慮。讓鋰雲母輕柔地引導你度過困難時期，一切都會好起來的。' }
    ],
    defaultPrompt: 'Crystal oracle card Lepidolite, lavender purple stone, calming transition, stress relief, emotional balance'
  },
  {
    id: 'crystal-bloodstone',
    name: 'Bloodstone',
    nameCN: '血石',
    title: '血石 (Bloodstone)',
    keywords: ['勇氣', '淨化', '生命力', '保護', '療癒'],
    interpretations: [
      { caption: '', content: '血石帶來勇士般的力量與保護。這張卡牌增強你的生命力與勇氣。讓血石幫助你淨化血液和能量，面對挑戰時保持堅強。你內在的戰士正在覺醒，準備好迎接一切。' }
    ],
    defaultPrompt: 'Crystal oracle card Bloodstone, dark green with red spots, warrior courage, life force, protective vitality'
  },
  {
    id: 'crystal-apache-tear',
    name: 'Apache Tear',
    nameCN: '阿帕契之淚',
    title: '阿帕契之淚 (Apache Tear)',
    keywords: ['悲傷', '療癒', '保護', '接地', '轉化'],
    interpretations: [
      { caption: '', content: '阿帕契之淚溫柔地吸收悲傷與負面情緒。這張卡牌允許你哀悼和釋放，同時提供保護。讓這顆黑曜石幫助你療癒心中的傷痛，將悲傷轉化為智慧和力量。眼淚是療癒的一部分。' }
    ],
    defaultPrompt: 'Crystal oracle card Apache Tear, translucent black obsidian nodule, grief healing, gentle protection, emotional release'
  },
  {
    id: 'crystal-ametrine',
    name: 'Ametrine',
    nameCN: '紫黃晶',
    title: '紫黃晶 (Ametrine)',
    keywords: ['平衡', '創造力', '靈性', '物質', '統一'],
    interpretations: [
      { caption: '', content: '紫黃晶完美融合了紫水晶與黃水晶的能量。這張卡牌帶來靈性與物質世界的平衡。讓紫黃晶幫助你將靈感轉化為實際成果，在創造力與實用性之間找到和諧。' }
    ],
    defaultPrompt: 'Crystal oracle card Ametrine, purple and yellow bicolor crystal, spiritual material balance, creative unity'
  },
  {
    id: 'crystal-charoite',
    name: 'Charoite',
    nameCN: '紫龍晶',
    title: '紫龍晶 (Charoite)',
    keywords: ['轉化', '服務', '靈性', '恐懼釋放', '直覺'],
    interpretations: [
      { caption: '', content: '紫龍晶是深層轉化的催化劑。這張卡牌幫助你釋放深層的恐懼，擁抱靈性的使命。讓紫龍晶引導你服務他人，在幫助別人的過程中療癒自己。你的獨特天賦是給世界的禮物。' }
    ],
    defaultPrompt: 'Crystal oracle card Charoite, swirling purple stone, deep transformation, spiritual service, fear release'
  },
  {
    id: 'crystal-moldavite',
    name: 'Moldavite',
    nameCN: '捷克隕石',
    title: '捷克隕石 (Moldavite)',
    keywords: ['轉化', '覺醒', '宇宙', '加速', '高頻'],
    interpretations: [
      { caption: '', content: '捷克隕石帶來宇宙級的轉化與覺醒。這張卡牌預示快速而深刻的改變即將來臨。讓捷克隕石加速你的靈性進化，準備好迎接意想不到的機會。改變可能劇烈，但結果是積極的。' }
    ],
    defaultPrompt: 'Crystal oracle card Moldavite, translucent green tektite, cosmic transformation, spiritual awakening, high frequency'
  },
  {
    id: 'crystal-peridot',
    name: 'Peridot',
    nameCN: '橄欖石',
    title: '橄欖石 (Peridot)',
    keywords: ['更新', '豐盛', '淨化', '喜悅', '心輪'],
    interpretations: [
      { caption: '', content: '橄欖石帶來春天般的更新與清新能量。這張卡牌預示舊的結束、新的開始。讓橄欖石幫助你釋放過去的負擔，敞開心胸迎接豐盛與喜悅。生命正在為你準備美好的禮物。' }
    ],
    defaultPrompt: 'Crystal oracle card Peridot, bright olive green crystal, renewal abundance, joyful purification, spring energy'
  },
  {
    id: 'crystal-larimar',
    name: 'Larimar',
    nameCN: '拉利瑪',
    title: '拉利瑪 (Larimar)',
    keywords: ['平靜', '溝通', '療癒', '女神', '海洋'],
    interpretations: [
      { caption: '', content: '拉利瑪帶來加勒比海般的寧靜與療癒。這張卡牌連結著海洋女神的能量。讓拉利瑪撫平你的情緒，帶來深層的平靜與放鬆。在這個需要休息的時刻，允許自己被溫柔地療癒。' }
    ],
    defaultPrompt: 'Crystal oracle card Larimar, blue and white stone like ocean, Caribbean calm, goddess healing, peaceful communication'
  },
  {
    id: 'crystal-prehnite',
    name: 'Prehnite',
    nameCN: '葡萄石',
    title: '葡萄石 (Prehnite)',
    keywords: ['預知', '療癒', '和平', '保護', '自然'],
    interpretations: [
      { caption: '', content: '葡萄石被稱為療癒者的療癒石，也帶來預知的能力。這張卡牌提醒你照顧自己，才能更好地幫助他人。讓葡萄石帶來內心的和平，增強你與自然和靈性領域的連結。' }
    ],
    defaultPrompt: 'Crystal oracle card Prehnite, pale green translucent stone, healer\'s healing, prophetic peace, nature connection'
  },
  {
    id: 'crystal-ruby',
    name: 'Ruby',
    nameCN: '紅寶石',
    title: '紅寶石 (Ruby)',
    keywords: ['熱情', '生命力', '愛', '勇氣', '豐盛'],
    interpretations: [
      { caption: '', content: '紅寶石燃燒著王者般的熱情與力量。這張卡牌帶來強大的生命力與愛的能量。讓紅寶石點燃你的心輪，激發對生活的熱愛與勇氣。你值得擁有生命中最珍貴的一切。' }
    ],
    defaultPrompt: 'Crystal oracle card Ruby, deep red precious stone, passionate life force, royal love, courageous heart'
  },
  {
    id: 'crystal-sapphire',
    name: 'Sapphire',
    nameCN: '藍寶石',
    title: '藍寶石 (Sapphire)',
    keywords: ['智慧', '真理', '忠誠', '專注', '皇室'],
    interpretations: [
      { caption: '', content: '藍寶石帶來神聖的智慧與真理。這張卡牌象徵著忠誠與專注。讓藍寶石幫助你看清真相，做出明智的決定。在追求知識與真理的道路上，你被神聖的力量所支持。' }
    ],
    defaultPrompt: 'Crystal oracle card Sapphire, royal blue precious stone, divine wisdom, truth and loyalty, focused clarity'
  },
  {
    id: 'crystal-emerald',
    name: 'Emerald',
    nameCN: '祖母綠',
    title: '祖母綠 (Emerald)',
    keywords: ['愛', '繁榮', '療癒', '重生', '心輪'],
    interpretations: [
      { caption: '', content: '祖母綠是心輪的至高寶石，帶來無條件的愛與療癒。這張卡牌預示愛情與繁榮的到來。讓祖母綠打開你的心，迎接重生與更新。在愛的能量中，一切都會變得更加豐盛。' }
    ],
    defaultPrompt: 'Crystal oracle card Emerald, rich green precious stone, unconditional love, heart prosperity, renewal healing'
  },
  {
    id: 'crystal-opal',
    name: 'Opal',
    nameCN: '蛋白石',
    title: '蛋白石 (Opal)',
    keywords: ['創造力', '情感', '靈感', '魔法', '夢想'],
    interpretations: [
      { caption: '', content: '蛋白石展現著萬千色彩，象徵無限的創造可能。這張卡牌帶來強大的創造力與情感深度。讓蛋白石激發你的靈感與夢想，擁抱生命中的魔法與奇蹟。你的創造力是獨一無二的禮物。' }
    ],
    defaultPrompt: 'Crystal oracle card Opal, iridescent play of rainbow colors, creative magic, emotional depth, dreamlike inspiration'
  },
  {
    id: 'crystal-pearl',
    name: 'Pearl',
    nameCN: '珍珠',
    title: '珍珠 (Pearl)',
    keywords: ['純潔', '智慧', '女性', '轉化', '美'],
    interpretations: [
      { caption: '', content: '珍珠誕生於痛苦，最終成為美麗的寶石。這張卡牌提醒你，困難中孕育著美麗與智慧。讓珍珠的女性能量滋養你，相信轉化的過程。你正在成為更美好的自己。' }
    ],
    defaultPrompt: 'Crystal oracle card Pearl, lustrous white orb, feminine purity, wisdom through transformation, graceful beauty'
  },
];

// 水晶神諭卡類別資訊
export const CRYSTAL_ORACLE_DECK_INFO = {
  id: 'crystal_oracle',
  name: 'Crystal Oracle',
  nameCN: '水晶神諭',
  description: '44 張水晶神諭卡，透過水晶的能量與智慧，提供療癒與指引訊息',
  totalCards: 44,
  categories: [
    { id: 'quartz', name: '水晶家族', count: 8 },
    { id: 'precious', name: '珍貴寶石', count: 6 },
    { id: 'healing', name: '療癒寶石', count: 15 },
    { id: 'protection', name: '保護寶石', count: 8 },
    { id: 'transformation', name: '轉化寶石', count: 7 },
  ],
};
