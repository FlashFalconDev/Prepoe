// 天使數字 / 靈數卡 定義
// 與後端 API 同步的天使數字組合

export interface AngelNumberCard {
  id: string;
  number: string;
  title: string;
  keywords: string[];
  interpretations: {
    caption: string;
    content: string;
  }[];
  defaultPrompt: string;
}

// 天使數字 - 26 張
export const ANGEL_NUMBERS: AngelNumberCard[] = [
  {
    id: 'angel-000',
    number: '000',
    title: '000 - 無限循環',
    keywords: ['無限', '循環', '潛能', '重置', '神聖秩序'],
    interpretations: [
      { caption: '', content: '000 代表無限的可能性和宇宙的完整循環。這個數字提醒你，你與宇宙能量完全對齊，一切都在完美的神聖秩序中運行。這是一個強大的重置訊號，暗示你正站在新旅程的起點，擁有無限的潛力等待被開發。' }
    ],
    defaultPrompt: 'Angel number card 000, infinite loop symbol, cosmic void with stars, divine potential, ethereal white and gold light'
  },
  {
    id: 'angel-111',
    number: '111',
    title: '111 - 新的開始',
    keywords: ['顯化', '新開始', '思想', '創造', '直覺'],
    interpretations: [
      { caption: '', content: '111 是顯化的強力數字，代表你的思想正在快速成為現實。天使提醒你專注於積極的想法，因為你的意念正處於高度創造的狀態。這是一個新開始的訊號，鼓勵你採取行動，把握機會，相信自己的直覺和能力。' }
    ],
    defaultPrompt: 'Angel number card 111, triple light beams, manifestation portal, new beginning, bright golden sunrise'
  },
  {
    id: 'angel-222',
    number: '222',
    title: '222 - 平衡與信任',
    keywords: ['平衡', '和諧', '合作', '信任', '耐心'],
    interpretations: [
      { caption: '', content: '222 象徵平衡、和諧與合作。天使告訴你要保持信心，一切都在按照完美的時機發展。這個數字鼓勵你在關係中尋求平衡，相信宇宙的安排。即使現在看不到結果，你的努力正在幕後產生積極的影響。' }
    ],
    defaultPrompt: 'Angel number card 222, perfect balance scales, harmony energy, trust symbol, soft blue peaceful light'
  },
  {
    id: 'angel-333',
    number: '333',
    title: '333 - 揚升大師的支持',
    keywords: ['揚升大師', '創造力', '支持', '成長', '智慧'],
    interpretations: [
      { caption: '', content: '333 表示揚升大師們正在你身邊，給予你支持和指引。這個數字鼓勵你發揮創造力，表達真實的自我。天使提醒你，你擁有內在的智慧和力量來克服任何挑戰。這也是一個擴展和成長的訊號。' }
    ],
    defaultPrompt: 'Angel number card 333, three ascended masters, divine protection, growth energy, purple and gold light'
  },
  {
    id: 'angel-444',
    number: '444',
    title: '444 - 天使的保護',
    keywords: ['保護', '天使', '穩定', '基礎', '堅定'],
    interpretations: [
      { caption: '', content: '444 是天使最常用來確認他們存在的數字。你被神聖的保護所包圍，天使正在引導你走向正確的道路。這個數字代表穩定、基礎和努力工作將得到回報。相信你正在建立的一切，保持專注和堅定。' }
    ],
    defaultPrompt: 'Angel number card 444, four guardian angels, protective shield, stable foundation, green and gold light'
  },
  {
    id: 'angel-555',
    number: '555',
    title: '555 - 重大變化',
    keywords: ['變化', '轉變', '突破', '解放', '可能性'],
    interpretations: [
      { caption: '', content: '555 預示著重大的生活轉變即將來臨。天使告訴你要準備好迎接變化，這些改變最終會帶來積極的結果。放下對未知的恐懼，擁抱新的可能性。這是一個解放和突破的時刻，讓過去的限制隨風而去。' }
    ],
    defaultPrompt: 'Angel number card 555, transformation butterflies, change winds, freedom energy, dynamic orange and red'
  },
  {
    id: 'angel-666',
    number: '666',
    title: '666 - 重新平衡',
    keywords: ['平衡', '物質', '精神', '療癒', '內在和平'],
    interpretations: [
      { caption: '', content: '666 提醒你需要重新審視生活的平衡，特別是在物質與精神層面。這個數字並非負面，而是天使溫柔的提醒：不要過度專注於物質擔憂。花時間滋養你的靈魂，重新連接你的內在和平與愛的能量。' }
    ],
    defaultPrompt: 'Angel number card 666, balance earth and heaven, healing energy, nurturing love, warm earth tones'
  },
  {
    id: 'angel-777',
    number: '777',
    title: '777 - 神聖的祝福',
    keywords: ['幸運', '祝福', '靈性成長', '奇蹟', '智慧'],
    interpretations: [
      { caption: '', content: '777 是極其幸運的數字，代表你與宇宙智慧深度對齊。天使祝賀你走在正確的道路上，你的靈性成長正在加速。這個數字帶來好運和祝福，鼓勵你繼續追隨內心的指引，奇蹟正在發生。' }
    ],
    defaultPrompt: 'Angel number card 777, seven lucky stars, divine magic sparkle, spiritual luck, purple and silver stars'
  },
  {
    id: 'angel-888',
    number: '888',
    title: '888 - 豐盛與富足',
    keywords: ['豐盛', '財務', '富足', '因果', '感恩'],
    interpretations: [
      { caption: '', content: '888 象徵財務和物質上的豐盛即將流入你的生活。這個數字代表無限的豐盈和因果循環的完成。天使告訴你，你之前種下的種子正在結出果實。保持感恩的心態，繼續與宇宙的豐盛能量對齊。' }
    ],
    defaultPrompt: 'Angel number card 888, infinite abundance flow, prosperity golden coins, success energy, rich gold and green'
  },
  {
    id: 'angel-999',
    number: '999',
    title: '999 - 完成與結束',
    keywords: ['完成', '結束', '釋放', '使命', '新空間'],
    interpretations: [
      { caption: '', content: '999 標誌著一個重要生命階段的結束。天使提醒你釋放不再服務於你的一切，為新的開始騰出空間。這是完成使命、結束舊循環的時刻。不要緊抓過去，信任更美好的事物正在等待你。' }
    ],
    defaultPrompt: 'Angel number card 999, cycle completion spiral, ending and new beginning, wisdom elder, white and silver'
  },
  {
    id: 'angel-1010',
    number: '1010',
    title: '1010 - 靈性覺醒',
    keywords: ['覺醒', '個人發展', '意識', '轉折點', '積極'],
    interpretations: [
      { caption: '', content: '1010 是靈性覺醒和個人發展的強力訊號。天使鼓勵你跳出舒適圈，擁抱更高的意識層次。這個數字組合代表你正處於人生的重要轉折點，保持積極的態度，相信宇宙正在為你創造最好的結果。' }
    ],
    defaultPrompt: 'Angel number card 1010, spiritual awakening portal, ascending consciousness, bright white and violet light'
  },
  {
    id: 'angel-1111',
    number: '1111',
    title: '1111 - 覺醒之門',
    keywords: ['覺醒密碼', '顯化', '門戶', '許願', '意圖'],
    interpretations: [
      { caption: '', content: '1111 被稱為「覺醒密碼」，是最強大的天使數字之一。這個數字代表靈性覺醒的門戶正在為你打開。天使提醒你注意自己的思想，因為你的顯化能力現在處於顛峰。這是一個許願和設定意圖的完美時刻。' }
    ],
    defaultPrompt: 'Angel number card 1111, four parallel light pillars, awakening gateway, brilliant white and gold light'
  },
  {
    id: 'angel-1212',
    number: '1212',
    title: '1212 - 保持正向',
    keywords: ['積極', '樂觀', '信念', '目標', '夢想'],
    interpretations: [
      { caption: '', content: '1212 提醒你保持積極和樂觀的態度。天使告訴你，你正在正確的軌道上，不要讓恐懼或懷疑動搖你的信念。這個數字鼓勵你專注於你的目標和夢想，相信一切都會以最好的方式展開。' }
    ],
    defaultPrompt: 'Angel number card 1212, positive energy spiral, optimistic sunrise, warm golden and pink light'
  },
  {
    id: 'angel-1234',
    number: '1234',
    title: '1234 - 循序漸進',
    keywords: ['循序', '簡化', '進步', '基本面', '過程'],
    interpretations: [
      { caption: '', content: '1234 象徵人生正在按部就班地前進。天使告訴你，每一步都很重要，不要急於求成。這個數字鼓勵你簡化生活，專注於基本面，一步一步地建立你想要的未來。相信這個過程，進步正在發生。' }
    ],
    defaultPrompt: 'Angel number card 1234, stepping stones ascending, progressive path, orderly gradient colors'
  },
  {
    id: 'angel-1313',
    number: '1313',
    title: '1313 - 揚升與轉化',
    keywords: ['揚升', '轉化', '靈性天賦', '創造力', '內在指引'],
    interpretations: [
      { caption: '', content: '1313 結合了新開始（1）和揚升大師的支持（3）。天使告訴你正處於深刻的轉化期，揚升大師正在幫助你提升意識。這是一個發展靈性天賦和創造力的時刻，相信你內在的指引。' }
    ],
    defaultPrompt: 'Angel number card 1313, ascension transformation, master guidance, purple and gold mystical energy'
  },
  {
    id: 'angel-1414',
    number: '1414',
    title: '1414 - 天使的引導',
    keywords: ['引導', '專注', '紀律', '神聖計劃', '基礎'],
    interpretations: [
      { caption: '', content: '1414 確認天使正在積極地引導你的人生道路。他們鼓勵你保持專注和紀律，同時相信神聖的計劃。這個數字帶來穩定的能量，幫助你建立堅實的基礎來實現你的目標和夢想。' }
    ],
    defaultPrompt: 'Angel number card 1414, angel guidance path, divine direction, stable green and white light'
  },
  {
    id: 'angel-1515',
    number: '1515',
    title: '1515 - 積極的改變',
    keywords: ['積極改變', '機會', '成長', '樂觀', '創造現實'],
    interpretations: [
      { caption: '', content: '1515 預示著積極的生活改變正在發生。天使鼓勵你保持樂觀，因為這些變化將帶來新的機會和成長。不要害怕改變，而是把它視為邁向更好生活的必要步驟。你的想法正在創造你的現實。' }
    ],
    defaultPrompt: 'Angel number card 1515, positive transformation, opportunity doorway, bright orange and yellow energy'
  },
  {
    id: 'angel-1717',
    number: '1717',
    title: '1717 - 好運降臨',
    keywords: ['好運', '祝福', '回報', '靈魂使命', '感恩'],
    interpretations: [
      { caption: '', content: '1717 是好運和祝福的訊號。天使告訴你，你過去的努力正在得到回報。這個數字鼓勵你繼續追隨你的靈魂使命，相信你正在走向成功。保持感恩的心，更多的祝福即將來臨。' }
    ],
    defaultPrompt: 'Angel number card 1717, lucky stars alignment, blessing shower, sparkling gold and silver'
  },
  {
    id: 'angel-1818',
    number: '1818',
    title: '1818 - 財務豐盛',
    keywords: ['財務', '豐盛', '成功', '富足', '繁榮'],
    interpretations: [
      { caption: '', content: '1818 帶來關於財務豐盛的強力訊息。天使告訴你，豐盛的能量正在流向你。這個數字鼓勵你相信自己值得擁有成功和富足。一個循環正在結束，新的繁榮時期即將開始。' }
    ],
    defaultPrompt: 'Angel number card 1818, financial abundance, prosperity flow, rich gold and emerald green'
  },
  {
    id: 'angel-1919',
    number: '1919',
    title: '1919 - 使命與目的',
    keywords: ['靈魂使命', '人生目的', '熱情', '服務', '天賦'],
    interpretations: [
      { caption: '', content: '1919 提醒你專注於你的靈魂使命和人生目的。一個章節正在結束，為你的更高使命騰出空間。天使鼓勵你追隨你的熱情，服務他人。你的獨特天賦是世界需要的禮物。' }
    ],
    defaultPrompt: 'Angel number card 1919, soul mission compass, life purpose star, deep purple and white light'
  },
  {
    id: 'angel-2020',
    number: '2020',
    title: '2020 - 信任與耐心',
    keywords: ['信任', '耐心', '合作', '神聖時機', '回報'],
    interpretations: [
      { caption: '', content: '2020 強調信任和耐心的重要性。天使告訴你，即使事情看起來進展緩慢，一切都在幕後完美地展開。保持信念，與他人合作，相信神聖的時機。你的耐心將得到豐厚的回報。' }
    ],
    defaultPrompt: 'Angel number card 2020, patient waiting, trust symbol, calm blue and soft pink harmony'
  },
  {
    id: 'angel-2121',
    number: '2121',
    title: '2121 - 新的合作',
    keywords: ['合作', '機會', '連結', '平衡', '雙贏'],
    interpretations: [
      { caption: '', content: '2121 預示著新的合作關係和機會。天使鼓勵你保持開放的心態，與他人建立有意義的連結。這個數字帶來平衡和和諧的能量，幫助你在關係中找到雙贏的局面。新的開始正在醞釀。' }
    ],
    defaultPrompt: 'Angel number card 2121, partnership connection, new collaboration, intertwined blue and gold energy'
  },
  {
    id: 'angel-2222',
    number: '2222',
    title: '2222 - 深層的平衡',
    keywords: ['深層平衡', '和諧', '神聖秩序', '完美安排', '正確道路'],
    interpretations: [
      { caption: '', content: '2222 是 222 的強化版，帶來更深層的平衡和和諧訊息。天使確認你正在正確的道路上，一切都在完美的神聖秩序中。這個數字鼓勵你在生活的各個方面尋求平衡，相信宇宙的完美安排。' }
    ],
    defaultPrompt: 'Angel number card 2222, perfect divine balance, deep harmony, layered blue and silver peaceful light'
  },
  {
    id: 'angel-3333',
    number: '3333',
    title: '3333 - 強力的創造',
    keywords: ['創造力', '自我表達', '才華', '光芒', '揚升大師'],
    interpretations: [
      { caption: '', content: '3333 是創造力和自我表達的強力訊號。揚升大師們正在全力支持你。這個數字鼓勵你大膽地展現你的才華，不要隱藏你的光芒。你的創造力是改變世界的工具，現在是發揮它的時候。' }
    ],
    defaultPrompt: 'Angel number card 3333, powerful creation burst, artistic explosion, vibrant yellow and orange creative energy'
  },
  {
    id: 'angel-4444',
    number: '4444',
    title: '4444 - 完全的保護',
    keywords: ['完全保護', '天使包圍', '掌控', '穩固基礎', '回報'],
    interpretations: [
      { caption: '', content: '4444 代表你被天使完全包圍和保護。這是一個極其強大的保護訊號，告訴你不要擔心，一切都在掌控之中。天使正在幫助你建立穩固的基礎，你的努力即將得到豐厚的回報。保持信心和專注。' }
    ],
    defaultPrompt: 'Angel number card 4444, complete angel protection, fortress of light, strong green and gold shield'
  },
  {
    id: 'angel-5555',
    number: '5555',
    title: '5555 - 巨大的轉變',
    keywords: ['巨大轉變', '快速改變', '解放', '重生', '擁抱'],
    interpretations: [
      { caption: '', content: '5555 預示著人生中巨大且快速的轉變。天使告訴你準備好迎接重大的改變，這些變化將從根本上改善你的生活。不要抗拒這個過程，而是擁抱它。舊的必須離開，新的才能進入。這是解放和重生的時刻。' }
    ],
    defaultPrompt: 'Angel number card 5555, massive transformation wave, rebirth phoenix, dynamic red and orange fire energy'
  },
];

// 天使數字類別資訊
export const ANGEL_DECK_INFO = {
  id: 'angel_numbers',
  name: 'Angel Numbers',
  nameCN: '天使數字',
  description: '神聖的天使數字訊息卡，包含三連數字、四連數字和特殊組合數字',
  totalCards: 26,
  categories: [
    { id: 'triple', name: '三連數字', count: 10 },
    { id: 'quad', name: '四連數字', count: 6 },
    { id: 'special', name: '特殊組合', count: 10 },
  ],
};
