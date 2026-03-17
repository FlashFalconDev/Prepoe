// 撲克牌 54 張定義
// 四花色各 13 張 + 2 鬼牌

import { OracleInterpretation } from './crystalOracleCards';

export interface PlayingCard {
  id: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';
  rank: string;
  name: string;
  nameCN: string;
  title: string;                              // 完整標題 (中文名稱 + 英文名稱)
  keywords: string[];                         // 關鍵字
  interpretations: OracleInterpretation[];    // 解讀內容
  defaultPrompt: string;
}

// 紅心 (Hearts) - 13 張 - 水元素 - 愛情、情感、關係、家庭
export const HEARTS: PlayingCard[] = [
  {
    id: 'hearts-a',
    suit: 'hearts',
    rank: 'A',
    name: 'Ace of Hearts',
    nameCN: '紅心 A',
    title: '紅心 A (Ace of Hearts)',
    keywords: ['愛情', '新開始', '家庭', '幸福', '情感', '純真'],
    interpretations: [
      { caption: '', content: '紅心 A 代表新的愛情開始、家庭幸福和情感的滿足。這張牌預示著浪漫關係的萌芽或現有關係的深化。它象徵著純真的愛、快樂的家庭環境和內心深處的幸福感。這是一個適合表達愛意、建立新關係的吉祥時刻。' }
    ],
    defaultPrompt: 'Classic playing card Ace of Hearts, large ornate red heart in center, elegant Victorian design'
  },
  {
    id: 'hearts-2',
    suit: 'hearts',
    rank: '2',
    name: 'Two of Hearts',
    nameCN: '紅心 2',
    title: '紅心 2 (Two of Hearts)',
    keywords: ['連結', '浪漫', '訂婚', '親密', '合作', '情感交流'],
    interpretations: [
      { caption: '', content: '紅心 2 象徵著兩人之間的深刻連結和愛情的互動。這張牌代表浪漫的合作關係、訂婚或親密關係的加深。它提醒你珍惜與伴侶之間的情感交流，共同創造美好的回憶。' }
    ],
    defaultPrompt: 'Classic playing card Two of Hearts, two red hearts arranged vertically, traditional card design'
  },
  {
    id: 'hearts-3',
    suit: 'hearts',
    rank: '3',
    name: 'Three of Hearts',
    nameCN: '紅心 3',
    title: '紅心 3 (Three of Hearts)',
    keywords: ['謹慎', '選擇', '三角', '不確定', '決定', '傾聽'],
    interpretations: [
      { caption: '', content: '紅心 3 提醒你在感情中需要謹慎行事。這張牌可能暗示三角關係、情感上的不確定性或需要在多個選擇中做出決定。它建議你傾聽內心的聲音，避免因衝動而做出後悔的決定。' }
    ],
    defaultPrompt: 'Classic playing card Three of Hearts, three red hearts in triangle formation, elegant design'
  },
  {
    id: 'hearts-4',
    suit: 'hearts',
    rank: '4',
    name: 'Four of Hearts',
    nameCN: '紅心 4',
    title: '紅心 4 (Four of Hearts)',
    keywords: ['穩定', '滿足', '安穩', '珍惜', '維護', '平淡'],
    interpretations: [
      { caption: '', content: '紅心 4 代表情感的穩定和內心的滿足。這張牌暗示你可能對目前的感情狀態感到安穩但也可能略顯平淡。它提醒你珍惜現有的幸福，同時也要注意不要因為過於安逸而忽視關係的維護。' }
    ],
    defaultPrompt: 'Classic playing card Four of Hearts, four red hearts in square formation, traditional style'
  },
  {
    id: 'hearts-5',
    suit: 'hearts',
    rank: '5',
    name: 'Five of Hearts',
    nameCN: '紅心 5',
    title: '紅心 5 (Five of Hearts)',
    keywords: ['變化', '失落', '分離', '挑戰', '成長', '轉變'],
    interpretations: [
      { caption: '', content: '紅心 5 象徵著情感上的變化或失落。這張牌可能預示著分離、失望或關係中的挑戰。但它也提醒你，這些經歷是成長的一部分，新的機會往往在轉變之後出現。保持開放的心態，迎接新的可能性。' }
    ],
    defaultPrompt: 'Classic playing card Five of Hearts, five red hearts arranged in X pattern, classic design'
  },
  {
    id: 'hearts-6',
    suit: 'hearts',
    rank: '6',
    name: 'Six of Hearts',
    nameCN: '紅心 6',
    title: '紅心 6 (Six of Hearts)',
    keywords: ['懷舊', '回憶', '重逢', '過去', '反思', '舊情'],
    interpretations: [
      { caption: '', content: '紅心 6 代表懷舊、過去的回憶和舊情的重逢。這張牌可能暗示前任的出現或對過去美好時光的回憶。它提醒你反思過去的經驗，但也要專注於當下和未來的幸福。' }
    ],
    defaultPrompt: 'Classic playing card Six of Hearts, six red hearts in two columns, elegant Victorian style'
  },
  {
    id: 'hearts-7',
    suit: 'hearts',
    rank: '7',
    name: 'Seven of Hearts',
    nameCN: '紅心 7',
    title: '紅心 7 (Seven of Hearts)',
    keywords: ['夢想', '幻想', '理想', '期望', '現實', '追求'],
    interpretations: [
      { caption: '', content: '紅心 7 象徵著夢想、幻想和對愛情的理想化。這張牌提醒你區分現實與幻想，避免對感情抱有不切實際的期望。同時，它也鼓勵你追求內心真正渴望的愛情，但要腳踏實地。' }
    ],
    defaultPrompt: 'Classic playing card Seven of Hearts, seven red hearts arranged traditionally, classic design'
  },
  {
    id: 'hearts-8',
    suit: 'hearts',
    rank: '8',
    name: 'Eight of Hearts',
    nameCN: '紅心 8',
    title: '紅心 8 (Eight of Hearts)',
    keywords: ['歡慶', '派對', '社交', '聚會', '朋友', '樂趣'],
    interpretations: [
      { caption: '', content: '紅心 8 代表歡慶、派對和社交活動。這張牌預示著愉快的聚會、新朋友的出現或令人開心的社交場合。這是一個適合擴展社交圈、享受生活樂趣的時期。' }
    ],
    defaultPrompt: 'Classic playing card Eight of Hearts, eight red hearts in two columns, traditional style'
  },
  {
    id: 'hearts-9',
    suit: 'hearts',
    rank: '9',
    name: 'Nine of Hearts',
    nameCN: '紅心 9',
    title: '紅心 9 (Nine of Hearts)',
    keywords: ['願望', '幸運', '實現', '祝福', '滿足', '好運'],
    interpretations: [
      { caption: '', content: '紅心 9 被稱為「願望牌」，是撲克牌中最幸運的牌之一。這張牌預示著願望的實現、情感的滿足和深深的幸福感。它帶來好運和祝福，暗示你的真心願望即將成真。' }
    ],
    defaultPrompt: 'Classic playing card Nine of Hearts, nine red hearts in grid pattern, elegant design'
  },
  {
    id: 'hearts-10',
    suit: 'hearts',
    rank: '10',
    name: 'Ten of Hearts',
    nameCN: '紅心 10',
    title: '紅心 10 (Ten of Hearts)',
    keywords: ['圓滿', '成功', '好運', '幸福', '完美', '吉祥'],
    interpretations: [
      { caption: '', content: '紅心 10 代表完美的幸福、成功和好運。這張牌是非常吉祥的象徵，預示著愛情和家庭生活的圓滿。它象徵著情感上的完整和達成，是所有紅心牌中最積極正面的一張。' }
    ],
    defaultPrompt: 'Classic playing card Ten of Hearts, ten red hearts arranged in standard pattern, classic style'
  },
  {
    id: 'hearts-j',
    suit: 'hearts',
    rank: 'J',
    name: 'Jack of Hearts',
    nameCN: '紅心 J',
    title: '紅心 J (Jack of Hearts)',
    keywords: ['年輕', '浪漫', '魅力', '追求者', '熱情', '純真'],
    interpretations: [
      { caption: '', content: '紅心 J 代表一個年輕、浪漫且富有魅力的人。這可能是一個真摯的追求者、忠誠的朋友或充滿愛心的年輕人。這張牌象徵著純真的愛意、浪漫的示好和年輕的熱情。' }
    ],
    defaultPrompt: 'Classic playing card Jack of Hearts, young nobleman with heart symbol, two-headed design, red and yellow costume'
  },
  {
    id: 'hearts-q',
    suit: 'hearts',
    rank: 'Q',
    name: 'Queen of Hearts',
    nameCN: '紅心 Q',
    title: '紅心 Q (Queen of Hearts)',
    keywords: ['溫柔', '慈愛', '善解人意', '母親', '支持', '智慧'],
    interpretations: [
      { caption: '', content: '紅心 Q 代表一位溫柔、慈愛且善解人意的女性。她可能是母親、妻子、女友或一位關心你的女性朋友。這張牌象徵著無條件的愛、情感的智慧和溫暖的支持。' }
    ],
    defaultPrompt: 'Classic playing card Queen of Hearts, regal queen holding flower and heart, two-headed design, red gown'
  },
  {
    id: 'hearts-k',
    suit: 'hearts',
    rank: 'K',
    name: 'King of Hearts',
    nameCN: '紅心 K',
    title: '紅心 K (King of Hearts)',
    keywords: ['慷慨', '可靠', '愛心', '父親', '穩定', '承諾'],
    interpretations: [
      { caption: '', content: '紅心 K 代表一位慷慨、有愛心且可靠的男性。他可能是父親、丈夫、伴侶或一位值得信賴的男性朋友。這張牌象徵著成熟的愛、情感的穩定和對家庭的承諾。' }
    ],
    defaultPrompt: 'Classic playing card King of Hearts, king with sword behind head, two-headed design, red robes, suicide king'
  },
];

// 方塊 (Diamonds) - 13 張 - 土元素 - 金錢、物質、事業、實際
export const DIAMONDS: PlayingCard[] = [
  {
    id: 'diamonds-a',
    suit: 'diamonds',
    rank: 'A',
    name: 'Ace of Diamonds',
    nameCN: '方塊 A',
    title: '方塊 A (Ace of Diamonds)',
    keywords: ['財務', '機會', '消息', '投資', '好運', '新開始'],
    interpretations: [
      { caption: '', content: '方塊 A 代表新的財務機會、重要的消息和物質上的新開始。這張牌預示著金錢方面的好運、商業提案或有價值的信息即將到來。這是一個適合投資、創業或接受新機會的吉祥時刻。' }
    ],
    defaultPrompt: 'Classic playing card Ace of Diamonds, large ornate red diamond in center, elegant Victorian design'
  },
  {
    id: 'diamonds-2',
    suit: 'diamonds',
    rank: '2',
    name: 'Two of Diamonds',
    nameCN: '方塊 2',
    title: '方塊 2 (Two of Diamonds)',
    keywords: ['變化', '平衡', '流動', '合作', '靈活', '管理'],
    interpretations: [
      { caption: '', content: '方塊 2 象徵著財務上的變化和需要平衡的狀況。這張牌可能暗示金錢的流動、商業上的合作或需要在財務決策上保持靈活。它提醒你謹慎管理資源，適應變化。' }
    ],
    defaultPrompt: 'Classic playing card Two of Diamonds, two red diamonds arranged vertically, traditional design'
  },
  {
    id: 'diamonds-3',
    suit: 'diamonds',
    rank: '3',
    name: 'Three of Diamonds',
    nameCN: '方塊 3',
    title: '方塊 3 (Three of Diamonds)',
    keywords: ['合作', '創意', '團隊', '收益', '成功', '價值'],
    interpretations: [
      { caption: '', content: '方塊 3 代表商業合作和創意的實現。這張牌可能暗示與他人合作帶來的財務收益、團隊工作或創意項目的成功。它鼓勵你與志同道合的人合作，共同創造價值。' }
    ],
    defaultPrompt: 'Classic playing card Three of Diamonds, three red diamonds in triangle formation, elegant style'
  },
  {
    id: 'diamonds-4',
    suit: 'diamonds',
    rank: '4',
    name: 'Four of Diamonds',
    nameCN: '方塊 4',
    title: '方塊 4 (Four of Diamonds)',
    keywords: ['穩定', '安全', '儲蓄', '基礎', '保護', '資產'],
    interpretations: [
      { caption: '', content: '方塊 4 象徵著財務的穩定和物質上的安全感。這張牌代表穩固的經濟基礎、儲蓄的重要性和對資源的謹慎管理。它提醒你建立長期的財務計劃，保護你的資產。' }
    ],
    defaultPrompt: 'Classic playing card Four of Diamonds, four red diamonds in square formation, classic design'
  },
  {
    id: 'diamonds-5',
    suit: 'diamonds',
    rank: '5',
    name: 'Five of Diamonds',
    nameCN: '方塊 5',
    title: '方塊 5 (Five of Diamonds)',
    keywords: ['挑戰', '困難', '開支', '波動', '調整', '規劃'],
    interpretations: [
      { caption: '', content: '方塊 5 暗示財務上的挑戰或暫時的困難。這張牌可能預示著意外開支、收入波動或需要調整預算的時期。但它也提醒你，困難是暫時的，透過謹慎規劃可以克服挑戰。' }
    ],
    defaultPrompt: 'Classic playing card Five of Diamonds, five red diamonds in X pattern, traditional style'
  },
  {
    id: 'diamonds-6',
    suit: 'diamonds',
    rank: '6',
    name: 'Six of Diamonds',
    nameCN: '方塊 6',
    title: '方塊 6 (Six of Diamonds)',
    keywords: ['改善', '清償', '回報', '平衡', '解決', '整理'],
    interpretations: [
      { caption: '', content: '方塊 6 代表財務狀況的改善和債務的清償。這張牌預示著收支平衡的恢復、過去投資的回報或財務問題的解決。這是一個適合整理財務、償還債務的好時機。' }
    ],
    defaultPrompt: 'Classic playing card Six of Diamonds, six red diamonds in two columns, elegant design'
  },
  {
    id: 'diamonds-7',
    suit: 'diamonds',
    rank: '7',
    name: 'Seven of Diamonds',
    nameCN: '方塊 7',
    title: '方塊 7 (Seven of Diamonds)',
    keywords: ['不滿', '反思', '倦怠', '評估', '價值觀', '方向'],
    interpretations: [
      { caption: '', content: '方塊 7 象徵著對工作或財務狀況的不滿。這張牌可能暗示對薪資的不滿足、職業倦怠或對物質追求的反思。它提醒你重新評估你的價值觀和事業方向。' }
    ],
    defaultPrompt: 'Classic playing card Seven of Diamonds, seven red diamonds arranged traditionally, classic style'
  },
  {
    id: 'diamonds-8',
    suit: 'diamonds',
    rank: '8',
    name: 'Eight of Diamonds',
    nameCN: '方塊 8',
    title: '方塊 8 (Eight of Diamonds)',
    keywords: ['旅行', '移動', '機會', '調動', '行動', '道路'],
    interpretations: [
      { caption: '', content: '方塊 8 代表旅行、新的道路和事業上的移動。這張牌可能預示著商務旅行、工作調動或新的職業機會。它象徵著透過行動和移動來創造財富和機會。' }
    ],
    defaultPrompt: 'Classic playing card Eight of Diamonds, eight red diamonds in two columns, traditional design'
  },
  {
    id: 'diamonds-9',
    suit: 'diamonds',
    rank: '9',
    name: 'Nine of Diamonds',
    nameCN: '方塊 9',
    title: '方塊 9 (Nine of Diamonds)',
    keywords: ['獨立', '自由', '成就', '努力', '成功', '滿足'],
    interpretations: [
      { caption: '', content: '方塊 9 象徵著獨立、財務自由和物質上的成就。這張牌代表透過自己的努力獲得的成功和滿足。它鼓勵你追求經濟獨立，享受努力工作帶來的成果。' }
    ],
    defaultPrompt: 'Classic playing card Nine of Diamonds, nine red diamonds in grid pattern, elegant Victorian style'
  },
  {
    id: 'diamonds-10',
    suit: 'diamonds',
    rank: '10',
    name: 'Ten of Diamonds',
    nameCN: '方塊 10',
    title: '方塊 10 (Ten of Diamonds)',
    keywords: ['財富', '成功', '豐盛', '巔峰', '收益', '圓滿'],
    interpretations: [
      { caption: '', content: '方塊 10 代表大量的財富、商業成功和財務上的圓滿。這張牌是物質豐盛的象徵，預示著重大的財務收益、成功的投資或事業的巔峰。這是財運最旺的時期。' }
    ],
    defaultPrompt: 'Classic playing card Ten of Diamonds, ten red diamonds in standard pattern, classic design'
  },
  {
    id: 'diamonds-j',
    suit: 'diamonds',
    rank: 'J',
    name: 'Jack of Diamonds',
    nameCN: '方塊 J',
    title: '方塊 J (Jack of Diamonds)',
    keywords: ['年輕', '機智', '商業', '信使', '機會', '資訊'],
    interpretations: [
      { caption: '', content: '方塊 J 代表一個年輕、機智且有商業頭腦的人。他可能是一個帶來財務消息的信使、年輕的商人或在物質方面給予幫助的人。這張牌象徵著機會的到來和有價值的資訊。' }
    ],
    defaultPrompt: 'Classic playing card Jack of Diamonds, young nobleman in profile with diamond, two-headed design'
  },
  {
    id: 'diamonds-q',
    suit: 'diamonds',
    rank: 'Q',
    name: 'Queen of Diamonds',
    nameCN: '方塊 Q',
    title: '方塊 Q (Queen of Diamonds)',
    keywords: ['精明', '務實', '成功', '智慧', '顧問', '支持'],
    interpretations: [
      { caption: '', content: '方塊 Q 代表一位精明、務實且在財務上成功的女性。她可能是一位女商人、財務顧問或在物質方面給予支持的女性。這張牌象徵著財務智慧、實際的建議和物質上的援助。' }
    ],
    defaultPrompt: 'Classic playing card Queen of Diamonds, queen holding flower, two-headed design, ornate dress'
  },
  {
    id: 'diamonds-k',
    suit: 'diamonds',
    rank: 'K',
    name: 'King of Diamonds',
    nameCN: '方塊 K',
    title: '方塊 K (King of Diamonds)',
    keywords: ['成功', '權勢', '老闆', '權威', '領導', '影響力'],
    interpretations: [
      { caption: '', content: '方塊 K 代表一位成功、有權勢且在商業上有成就的男性。他可能是老闆、商業夥伴或在財務事務上有影響力的人。這張牌象徵著商業成功、財務權威和實際的領導力。' }
    ],
    defaultPrompt: 'Classic playing card King of Diamonds, king with axe in profile, two-headed design, one eye visible'
  },
];

// 梅花 (Clubs) - 13 張 - 火元素 - 工作、努力、成長、知識
export const CLUBS: PlayingCard[] = [
  {
    id: 'clubs-a',
    suit: 'clubs',
    rank: 'A',
    name: 'Ace of Clubs',
    nameCN: '梅花 A',
    title: '梅花 A (Ace of Clubs)',
    keywords: ['計劃', '創意', '知識', '學習', '靈感', '成長'],
    interpretations: [
      { caption: '', content: '梅花 A 代表新的計劃、創意的開始和知識的追求。這張牌預示著新項目的啟動、學習機會或靈感的湧現。這是一個適合開始新事業、學習新技能或追求個人成長的時刻。' }
    ],
    defaultPrompt: 'Classic playing card Ace of Clubs, large ornate black clover in center, elegant Victorian design'
  },
  {
    id: 'clubs-2',
    suit: 'clubs',
    rank: '2',
    name: 'Two of Clubs',
    nameCN: '梅花 2',
    title: '梅花 2 (Two of Clubs)',
    keywords: ['障礙', '困難', '分歧', '耐心', '溝通', '妥協'],
    interpretations: [
      { caption: '', content: '梅花 2 象徵著障礙和需要克服的困難。這張牌可能暗示計劃受阻、意見分歧或需要更多努力才能達成目標。它提醒你保持耐心，透過溝通和妥協來解決問題。' }
    ],
    defaultPrompt: 'Classic playing card Two of Clubs, two black clovers arranged vertically, traditional design'
  },
  {
    id: 'clubs-3',
    suit: 'clubs',
    rank: '3',
    name: 'Three of Clubs',
    nameCN: '梅花 3',
    title: '梅花 3 (Three of Clubs)',
    keywords: ['合作', '成長', '發展', '團隊', '技能', '多元'],
    interpretations: [
      { caption: '', content: '梅花 3 代表成功的合作和多方面的發展。這張牌預示著商業上的成長、技能的擴展或多個項目同時進展順利。它象徵著團隊合作帶來的成功和才能的多元發展。' }
    ],
    defaultPrompt: 'Classic playing card Three of Clubs, three black clovers in triangle formation, elegant style'
  },
  {
    id: 'clubs-4',
    suit: 'clubs',
    rank: '4',
    name: 'Four of Clubs',
    nameCN: '梅花 4',
    title: '梅花 4 (Four of Clubs)',
    keywords: ['欺騙', '小心', '動機', '審視', '細節', '誤導'],
    interpretations: [
      { caption: '', content: '梅花 4 象徵著欺騙或不誠實的情況。這張牌提醒你小心他人的動機，特別是在商業交易或合作關係中。它建議你仔細審視所有細節，避免被誤導。' }
    ],
    defaultPrompt: 'Classic playing card Four of Clubs, four black clovers in square formation, classic design'
  },
  {
    id: 'clubs-5',
    suit: 'clubs',
    rank: '5',
    name: 'Five of Clubs',
    nameCN: '梅花 5',
    title: '梅花 5 (Five of Clubs)',
    keywords: ['競爭', '衝突', '挑戰', '實力', '專注', '碰撞'],
    interpretations: [
      { caption: '', content: '梅花 5 代表競爭、衝突和需要應對的挑戰。這張牌可能暗示工作中的競爭對手、觀點的碰撞或需要展示實力的時刻。它鼓勵你保持專注，用實力證明自己。' }
    ],
    defaultPrompt: 'Classic playing card Five of Clubs, five black clovers in X pattern, traditional style'
  },
  {
    id: 'clubs-6',
    suit: 'clubs',
    rank: '6',
    name: 'Six of Clubs',
    nameCN: '梅花 6',
    title: '梅花 6 (Six of Clubs)',
    keywords: ['成功', '成就', '完成', '回報', '認可', '慶祝'],
    interpretations: [
      { caption: '', content: '梅花 6 象徵著成功、成就和計劃的完成。這張牌預示著目標的達成、努力的回報和他人的認可。這是慶祝成就、享受成功果實的時刻。' }
    ],
    defaultPrompt: 'Classic playing card Six of Clubs, six black clovers in two columns, elegant design'
  },
  {
    id: 'clubs-7',
    suit: 'clubs',
    rank: '7',
    name: 'Seven of Clubs',
    nameCN: '梅花 7',
    title: '梅花 7 (Seven of Clubs)',
    keywords: ['麻煩', '謹慎', '複雜', '警覺', '人際', '三思'],
    interpretations: [
      { caption: '', content: '梅花 7 代表潛在的麻煩或需要謹慎處理的情況。這張牌可能暗示來自異性的問題、複雜的人際關係或需要保持警覺的商業狀況。它建議你三思而後行。' }
    ],
    defaultPrompt: 'Classic playing card Seven of Clubs, seven black clovers arranged traditionally, classic style'
  },
  {
    id: 'clubs-8',
    suit: 'clubs',
    rank: '8',
    name: 'Eight of Clubs',
    nameCN: '梅花 8',
    title: '梅花 8 (Eight of Clubs)',
    keywords: ['進步', '堅持', '決心', '努力', '艱難', '目標'],
    interpretations: [
      { caption: '', content: '梅花 8 象徵著困難中的進步和堅持的力量。這張牌代表雖然道路艱難，但持續的努力終將帶來成功。它鼓勵你保持決心，不要輕易放棄目標。' }
    ],
    defaultPrompt: 'Classic playing card Eight of Clubs, eight black clovers in two columns, traditional design'
  },
  {
    id: 'clubs-9',
    suit: 'clubs',
    rank: '9',
    name: 'Nine of Clubs',
    nameCN: '梅花 9',
    title: '梅花 9 (Nine of Clubs)',
    keywords: ['機會', '好運', '驚喜', '可能性', '成功', '開放'],
    interpretations: [
      { caption: '', content: '梅花 9 代表新的機會、意外的好運和潛在的成就。這張牌預示著驚喜的出現、新的可能性或意想不到的成功。保持開放的心態，把握每一個機會。' }
    ],
    defaultPrompt: 'Classic playing card Nine of Clubs, nine black clovers in grid pattern, elegant Victorian style'
  },
  {
    id: 'clubs-10',
    suit: 'clubs',
    rank: '10',
    name: 'Ten of Clubs',
    nameCN: '梅花 10',
    title: '梅花 10 (Ten of Clubs)',
    keywords: ['旅行', '改變', '環境', '海外', '視野', '搬遷'],
    interpretations: [
      { caption: '', content: '梅花 10 象徵著旅行、改變和新的環境。這張牌可能預示著海外旅行、搬遷或生活環境的重大變化。這些改變將帶來積極的影響和新的視野。' }
    ],
    defaultPrompt: 'Classic playing card Ten of Clubs, ten black clovers in standard pattern, classic design'
  },
  {
    id: 'clubs-j',
    suit: 'clubs',
    rank: 'J',
    name: 'Jack of Clubs',
    nameCN: '梅花 J',
    title: '梅花 J (Jack of Clubs)',
    keywords: ['活潑', '可靠', '勤奮', '忠誠', '幫助', '積極'],
    interpretations: [
      { caption: '', content: '梅花 J 代表一個活潑、可靠且富有企業精神的年輕人。他可能是一個忠誠的朋友、勤奮的員工或帶來好消息的信使。這張牌象徵著可信賴的幫助和積極的能量。' }
    ],
    defaultPrompt: 'Classic playing card Jack of Clubs, young nobleman with club symbol, two-headed design, green and yellow'
  },
  {
    id: 'clubs-q',
    suit: 'clubs',
    rank: 'Q',
    name: 'Queen of Clubs',
    nameCN: '梅花 Q',
    title: '梅花 Q (Queen of Clubs)',
    keywords: ['自信', '魅力', '社交', '影響力', '盟友', '支持'],
    interpretations: [
      { caption: '', content: '梅花 Q 代表一位自信、有魅力且善於社交的女性。她可能是一位有影響力的朋友、商業上的盟友或在事業上給予支持的女性。這張牌象徵著吸引力、社交能力和實際的幫助。' }
    ],
    defaultPrompt: 'Classic playing card Queen of Clubs, queen holding flower, two-headed design, elegant dress'
  },
  {
    id: 'clubs-k',
    suit: 'clubs',
    rank: 'K',
    name: 'King of Clubs',
    nameCN: '梅花 K',
    title: '梅花 K (King of Clubs)',
    keywords: ['熱心', '慷慨', '領導', '導師', '智慧', '友誼'],
    interpretations: [
      { caption: '', content: '梅花 K 代表一位熱心、慷慨且有領導力的男性。他可能是一位良師益友、事業上的導師或在困難時給予幫助的人。這張牌象徵著真誠的支持、智慧的指導和可靠的友誼。' }
    ],
    defaultPrompt: 'Classic playing card King of Clubs, king with orb, two-headed design, Alexander the Great style'
  },
];

// 黑桃 (Spades) - 13 張 - 風元素 - 挑戰、思考、轉變、智慧
export const SPADES: PlayingCard[] = [
  {
    id: 'spades-a',
    suit: 'spades',
    rank: 'A',
    name: 'Ace of Spades',
    nameCN: '黑桃 A',
    title: '黑桃 A (Ace of Spades)',
    keywords: ['轉變', '結束', '新開始', '決定', '轉折', '重生'],
    interpretations: [
      { caption: '', content: '黑桃 A 代表重大的轉變、結束和新的開始。這張牌是撲克牌中最強大的一張，象徵著深刻的改變、重要的決定或生命的轉折點。雖然改變可能帶來挑戰，但也預示著成長和重生的機會。' }
    ],
    defaultPrompt: 'Classic playing card Ace of Spades, large ornate black spade in center, most elaborate design, death card'
  },
  {
    id: 'spades-2',
    suit: 'spades',
    rank: '2',
    name: 'Two of Spades',
    nameCN: '黑桃 2',
    title: '黑桃 2 (Two of Spades)',
    keywords: ['分離', '選擇', '決定', '距離', '權衡', '理性'],
    interpretations: [
      { caption: '', content: '黑桃 2 象徵著分離、困難的選擇和需要做出決定的時刻。這張牌可能暗示關係中的距離、需要權衡的選項或暫時的分離。它提醒你用理性來面對情況，做出對自己最有利的選擇。' }
    ],
    defaultPrompt: 'Classic playing card Two of Spades, two black spades arranged vertically, traditional design'
  },
  {
    id: 'spades-3',
    suit: 'spades',
    rank: '3',
    name: 'Three of Spades',
    nameCN: '黑桃 3',
    title: '黑桃 3 (Three of Spades)',
    keywords: ['心碎', '背叛', '痛苦', '失望', '堅強', '療癒'],
    interpretations: [
      { caption: '', content: '黑桃 3 代表心碎、背叛或情感上的痛苦。這張牌可能預示著關係中的問題、信任的破裂或失望的經歷。但它也提醒你，這些經歷會讓你更加堅強，時間會療癒一切。' }
    ],
    defaultPrompt: 'Classic playing card Three of Spades, three black spades in triangle formation, elegant style'
  },
  {
    id: 'spades-4',
    suit: 'spades',
    rank: '4',
    name: 'Four of Spades',
    nameCN: '黑桃 4',
    title: '黑桃 4 (Four of Spades)',
    keywords: ['休息', '恢復', '暫停', '反思', '停滯', '養精蓄銳'],
    interpretations: [
      { caption: '', content: '黑桃 4 象徵著休息、恢復和暫時的停滯。這張牌代表需要暫停、反思和養精蓄銳的時期。它建議你在採取行動之前先休息，讓身心得到充分的恢復。' }
    ],
    defaultPrompt: 'Classic playing card Four of Spades, four black spades in square formation, classic design'
  },
  {
    id: 'spades-5',
    suit: 'spades',
    rank: '5',
    name: 'Five of Spades',
    nameCN: '黑桃 5',
    title: '黑桃 5 (Five of Spades)',
    keywords: ['挫折', '失敗', '困難', '受阻', '學習', '成長'],
    interpretations: [
      { caption: '', content: '黑桃 5 代表挫折、失敗或暫時的困難。這張牌可能暗示計劃受阻、期望落空或需要面對的挑戰。但它也提醒你，失敗是成功之母，從中學習才能成長。' }
    ],
    defaultPrompt: 'Classic playing card Five of Spades, five black spades in X pattern, traditional style'
  },
  {
    id: 'spades-6',
    suit: 'spades',
    rank: '6',
    name: 'Six of Spades',
    nameCN: '黑桃 6',
    title: '黑桃 6 (Six of Spades)',
    keywords: ['改善', '過渡', '好轉', '耐心', '希望', '結束'],
    interpretations: [
      { caption: '', content: '黑桃 6 象徵著改善、過渡和逐漸好轉的情況。這張牌代表困難時期即將結束，情況正在慢慢改善。它鼓勵你保持耐心，相信前方有更好的事物等待著你。' }
    ],
    defaultPrompt: 'Classic playing card Six of Spades, six black spades in two columns, elegant design'
  },
  {
    id: 'spades-7',
    suit: 'spades',
    rank: '7',
    name: 'Seven of Spades',
    nameCN: '黑桃 7',
    title: '黑桃 7 (Seven of Spades)',
    keywords: ['損失', '悲傷', '放下', '接受', '失去', '現實'],
    interpretations: [
      { caption: '', content: '黑桃 7 代表損失、悲傷或需要放下的事物。這張牌可能暗示失去某些東西、計劃的失敗或需要接受現實的時刻。它提醒你放下執著，接受無法改變的事實。' }
    ],
    defaultPrompt: 'Classic playing card Seven of Spades, seven black spades arranged traditionally, classic style'
  },
  {
    id: 'spades-8',
    suit: 'spades',
    rank: '8',
    name: 'Eight of Spades',
    nameCN: '黑桃 8',
    title: '黑桃 8 (Eight of Spades)',
    keywords: ['困難', '障礙', '謹慎', '警覺', '挑戰', '注意'],
    interpretations: [
      { caption: '', content: '黑桃 8 象徵著困難、障礙和需要小心謹慎的時期。這張牌代表可能面臨的挑戰、健康問題或需要特別注意的情況。它建議你保持警覺，謹慎行事。' }
    ],
    defaultPrompt: 'Classic playing card Eight of Spades, eight black spades in two columns, traditional design'
  },
  {
    id: 'spades-9',
    suit: 'spades',
    rank: '9',
    name: 'Nine of Spades',
    nameCN: '黑桃 9',
    title: '黑桃 9 (Nine of Spades)',
    keywords: ['焦慮', '擔憂', '恐懼', '悲觀', '負面', '控制'],
    interpretations: [
      { caption: '', content: '黑桃 9 代表焦慮、擔憂和負面的想法。這張牌可能反映出內心的恐懼、過度的擔心或悲觀的態度。它提醒你不要讓負面思緒控制自己，很多擔憂往往不會成真。' }
    ],
    defaultPrompt: 'Classic playing card Nine of Spades, nine black spades in grid pattern, elegant Victorian style'
  },
  {
    id: 'spades-10',
    suit: 'spades',
    rank: '10',
    name: 'Ten of Spades',
    nameCN: '黑桃 10',
    title: '黑桃 10 (Ten of Spades)',
    keywords: ['不幸', '困難', '挑戰', '警告', '觸底', '黎明'],
    interpretations: [
      { caption: '', content: '黑桃 10 象徵著不幸的消息、困難的時期或重大的挑戰。這張牌是一個警告，提醒你可能需要面對一些艱難的情況。但它也代表著觸底反彈的可能，最黑暗的時刻往往是黎明前的黑暗。' }
    ],
    defaultPrompt: 'Classic playing card Ten of Spades, ten black spades in standard pattern, classic design'
  },
  {
    id: 'spades-j',
    suit: 'spades',
    rank: 'J',
    name: 'Jack of Spades',
    nameCN: '黑桃 J',
    title: '黑桃 J (Jack of Spades)',
    keywords: ['聰明', '不可靠', '謹慎', '警覺', '年輕', '問題'],
    interpretations: [
      { caption: '', content: '黑桃 J 代表一個年輕、聰明但可能不太可靠的人。他可能是一個需要謹慎對待的人、帶來問題的年輕人或在某些方面不夠成熟的人。這張牌提醒你在與他人交往時保持警覺。' }
    ],
    defaultPrompt: 'Classic playing card Jack of Spades, young nobleman in profile with spade, two-headed design, one eye'
  },
  {
    id: 'spades-q',
    suit: 'spades',
    rank: 'Q',
    name: 'Queen of Spades',
    nameCN: '黑桃 Q',
    title: '黑桃 Q (Queen of Spades)',
    keywords: ['聰明', '獨立', '嚴厲', '智慧', '經驗', '力量'],
    interpretations: [
      { caption: '', content: '黑桃 Q 代表一位聰明、獨立但可能較為嚴厲的女性。她可能是一位要求高的人、寡婦或經歷過困難的女性。這張牌象徵著智慧、獨立性和從經驗中獲得的力量。' }
    ],
    defaultPrompt: 'Classic playing card Queen of Spades, stern queen holding scepter, two-headed design, Athena style'
  },
  {
    id: 'spades-k',
    suit: 'spades',
    rank: 'K',
    name: 'King of Spades',
    nameCN: '黑桃 K',
    title: '黑桃 K (King of Spades)',
    keywords: ['權威', '專業', '嚴肅', '法律', '專業人士', '認真'],
    interpretations: [
      { caption: '', content: '黑桃 K 代表一位有權威、專業且可能較為嚴肅的男性。他可能是律師、法官、醫生或其他專業人士。這張牌象徵著權威、專業知識和需要認真對待的事務。' }
    ],
    defaultPrompt: 'Classic playing card King of Spades, king with sword, two-headed design, David style, full beard'
  },
];

// 鬼牌 (Jokers) - 2 張 - 特殊牌 - 意外、混亂、無限可能
export const JOKERS: PlayingCard[] = [
  {
    id: 'joker-red',
    suit: 'joker',
    rank: 'Joker',
    name: 'Red Joker',
    nameCN: '紅色鬼牌',
    title: '紅鬼牌 (Red Joker)',
    keywords: ['積極', '驚喜', '好運', '可能性', '創造力', '樂觀'],
    interpretations: [
      { caption: '', content: '紅鬼牌代表積極的意外、好運的驚喜和充滿可能性的轉折。這張牌象徵著命運之輪的轉動，帶來意想不到的好機會。它鼓勵你擁抱生命中的驚喜，保持開放和樂觀的態度。紅鬼牌也代表著創造力、幽默感和打破常規的勇氣。' }
    ],
    defaultPrompt: 'Playing card Red Joker, colorful jester with bells, playful pose, red and gold costume, whimsical design'
  },
  {
    id: 'joker-black',
    suit: 'joker',
    rank: 'Joker',
    name: 'Black Joker',
    nameCN: '黑色鬼牌',
    title: '黑鬼牌 (Black Joker)',
    keywords: ['未知', '警惕', '變數', '適應', '秘密', '冷靜'],
    interpretations: [
      { caption: '', content: '黑鬼牌代表未知的變數、需要警惕的意外和命運的不可預測性。這張牌提醒你生活中存在無法控制的因素，需要保持靈活和適應性。它也象徵著隱藏的真相、需要揭開的秘密或即將發生的轉變。黑鬼牌鼓勵你面對未知時保持冷靜和智慧。' }
    ],
    defaultPrompt: 'Playing card Black Joker, mysterious jester, darker costume, black and silver, mischievous expression'
  },
];

// 合併所有撲克牌
export const ALL_PLAYING_CARDS: PlayingCard[] = [
  ...HEARTS,
  ...DIAMONDS,
  ...CLUBS,
  ...SPADES,
  ...JOKERS,
];

// 撲克牌類別資訊
export const PLAYING_DECK_INFO = {
  id: 'playing_card',  // 對應後端 category: playing_card / playing_cards / cartomancy
  name: 'Playing Card',
  nameCN: '撲克牌',
  description: '標準 54 張撲克牌，包含四種花色和兩張鬼牌',
  totalCards: 54,
  categories: [
    { id: 'hearts', name: '紅心', count: 13 },
    { id: 'diamonds', name: '方塊', count: 13 },
    { id: 'clubs', name: '梅花', count: 13 },
    { id: 'spades', name: '黑桃', count: 13 },
    { id: 'joker', name: '鬼牌', count: 2 },
  ],
};
