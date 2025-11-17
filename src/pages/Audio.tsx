import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2, Plus, Minus, Play, Download, Share2, ArrowLeft, ArrowRight, User, Sparkles,
  Mic, Upload, Square, Pause, VolumeX, Target,
  FileText, Lightbulb, CheckCircle, XCircle, Loader2, AlertTriangle, Users,
  BarChart3, Palette, FileAudio, Settings, Zap, Clock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS, createSoundClone, generateAIAudio, getSoundCloneList, getSoundCloneDetail, getAIModules, AIModuleConfig } from '../config/api';
import { AI_COLORS, ENHANCED_COLORS } from '../constants/colors';
import { trackAudioStep } from '../services/usageTracking';
import { useAuth } from '../contexts/AuthContext';

interface AudioProject {
  id: string;
  title: string;
  duration: string;
  status: 'completed' | 'processing' | 'draft';
  audioUrl?: string;
  createdAt: string;
}

interface VoiceModel {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isCustom: boolean;
  audioUrl?: string;
  pk?: number;
}

interface CreationStep {
  id: number;
  title: string;
  completed: boolean;
}

interface AudienceProfile {
  gender: 'male' | 'female' | 'all';
  ageRange: [number, number];
  profession: string;
  tone: 'professional' | 'casual' | 'friendly' | 'energetic';
  duration: number; // 時間長度（秒），預設10秒
}

// 時間長度選項 (秒)
const DURATION_OPTIONS = [10, 30, 60, 180, 600]; // 10秒, 30秒, 1分鐘, 3分鐘, 10分鐘

// 對話內容接口（擴增模式使用）
interface DialogueItem {
  id: string;
  speakerNum: number; // 說話人編號（1-4）
  content: string;
  order: number;
  emotions?: {[key: string]: number}; // 情緒資料（可選）
}

// 情緒選項定義
const emotionOptions = [
  { value: 'happy', label: '開心', description: '愉悅、興奮' },
  { value: 'angry', label: '憤怒', description: '激動、強烈' },
  { value: 'sad', label: '悲傷', description: '低沉、憂鬱' },
  { value: 'afraid', label: '害怕', description: '緊張、恐懼' },
  { value: 'disgusted', label: '厭惡', description: '反感、嫌棄' },
  { value: 'melancholic', label: '憂鬱', description: '沉思、感傷' },
  { value: 'surprised', label: '驚訝', description: '意外、驚奇' },
  { value: 'calm', label: '平靜', description: '沉穩、安詳' }
];

const AIAudio: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // 獲取當前用戶信息

  // 創作模式選擇：'basic' 基礎模式, 'enhanced' 擴增模式（字幕）
  const [creationMode, setCreationMode] = useState<'basic' | 'enhanced' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<number>(user?.role === 'admin' ? 6 : 5); // Admin預設6，一般用戶預設5

  // 擴增模式：多人語音模型選擇（1-4人）
  const [speakerCount, setSpeakerCount] = useState<number>(1);
  const [selectedVoiceModels, setSelectedVoiceModels] = useState<{[key: number]: string}>({}); // {1: 'model-id-1', 2: 'model-id-2', ...}
  const [showVoiceModelSelection, setShowVoiceModelSelection] = useState<number | null>(null); // 當前正在選擇的說話人編號

  const [selectedVoiceModel, setSelectedVoiceModel] = useState<string>(''); // 基礎模式使用
  const [emotionValues, setEmotionValues] = useState<{[key: string]: number}>({
    happy: 0,
    angry: 0,
    sad: 0,
    afraid: 0,
    disgusted: 0,
    melancholic: 0,
    surprised: 0,
    calm: 0
  });
  const [emotionMode, setEmotionMode] = useState<string>('');
  const [copywritingContent, setCopywritingContent] = useState(''); // 基礎模式使用

  // 擴增模式：對話列表
  const [dialogues, setDialogues] = useState<DialogueItem[]>([]);
  const [showDialogueDetails, setShowDialogueDetails] = useState(false); // 控制對話詳情展開/收起

  // 擴增模式：說話人順序和變更追蹤
  const [speakerOrder, setSpeakerOrder] = useState<number[]>([]); // [1, 2, 3, 4] 說話人的顯示順序
  const [hasPendingSpeakerChanges, setHasPendingSpeakerChanges] = useState(false); // 是否有待更新的人物順序變更
  const [draggedSpeaker, setDraggedSpeaker] = useState<number | null>(null); // 正在拖拽的說話人
  
  // 語音模型相關狀態
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [customVoiceModels, setCustomVoiceModels] = useState<VoiceModel[]>([]);
  const [defaultVoiceModels, setDefaultVoiceModels] = useState<VoiceModel[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'record' | 'upload'>('record'); // 'record' 或 'upload'

  // AI文案助手相關狀態
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [audienceProfile, setAudienceProfile] = useState<AudienceProfile>({
    gender: 'all',
    ageRange: [25, 35],
    profession: '',
    tone: 'professional',
    duration: 10 // 預設10秒
  });
  const [copywritingOutline, setCopywritingOutline] = useState('');
  const [isGeneratingCopywriting, setIsGeneratingCopywriting] = useState(false);
  const [copywritingMessage, setCopywritingMessage] = useState('');

  // 媒體播放相關狀態
  const [playingAudio, setPlayingAudio] = useState<string>('');
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});

  // 模態框相關狀態
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{url: string, name: string} | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');
  const [soundCloneList, setSoundCloneList] = useState<any[]>([]);
  const [showSoundCloneList, setShowSoundCloneList] = useState(false);
  const [loadingSoundClones, setLoadingSoundClones] = useState(false);

  // AI 模組配置相關狀態
  const [aiModuleConfig, setAiModuleConfig] = useState<AIModuleConfig | null>(null);
  const [availableT2SModels, setAvailableT2SModels] = useState<{ id: string; model: any }[]>([]);
  const [selectedT2SModel, setSelectedT2SModel] = useState<{ id: string; model: any } | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [maxChars, setMaxChars] = useState(250); // 預設值改為 250

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 預設職業選項
  const professionOptions = [
    '學生',
    '上班族',
    '家庭主婦',
    '創業者',
    '服務業',
    '退休人士',
  ];

  // 計算擴增模式總字數（需要在 steps 之前定義）
  const totalDialogueLength = dialogues.reduce((sum, d) => sum + d.content.length, 0);

  const steps: CreationStep[] = [
    { id: 1, title: '基本資訊', completed: !!title && (!showModelSelection || !!selectedT2SModel) },
    { id: 2, title: '語音模型', completed: creationMode === 'enhanced' ? Object.keys(selectedVoiceModels).length === speakerCount : !!selectedVoiceModel },
    { id: 3, title: '情緒選擇', completed: emotionMode === 'normal' || emotionMode === 'auto' || (emotionMode === 'custom' && Object.values(emotionValues).some(value => value > 0)) },
    { id: 4, title: '文案編輯', completed: creationMode === 'enhanced' ? (dialogues.length > 0 && dialogues.every(d => d.content.trim().length > 0) && totalDialogueLength <= maxChars) : (!!copywritingContent && copywritingContent.length <= maxChars) },
    { id: 5, title: 'AI生成', completed: false },
  ];

  const readingText = "森林是我們人類賴以生存的珍貴自然資源,對於維持生態平衡具有重要意義。";

  // 載入 AI 模組配置
  const loadAIModuleConfig = async () => {
    try {
      const result = await getAIModules('t2s');
      console.log('AI 模組配置 (T2S):', result);
      
      if (result.success && result.data && result.data.modules.t2s) {
        setAiModuleConfig(result.data);
        
        // 提取可用的 T2S 模型
        const models: { id: string; model: any }[] = [];
        result.data.modules.t2s.forEach(item => {
          Object.entries(item).forEach(([id, model]) => {
            models.push({ id, model });
          });
        });
        
        setAvailableT2SModels(models);
        
        // 如果有多個模型，顯示選擇界面
        if (models.length > 1) {
          setShowModelSelection(true);
        } else if (models.length === 1) {
          // 如果只有一個模型，自動選擇
          setSelectedT2SModel(models[0]);
          setShowModelSelection(false);
          
          // 設置字數限制（從第一個 branch 中獲取）
          const branch = models[0].model.branch[0];
          if (branch?.limits?.max_chars) {
            const newMaxChars = branch.limits.max_chars;
            setMaxChars(newMaxChars);
            // 如果現有內容超過新的字數限制，自動截斷
            if (copywritingContent.length > newMaxChars) {
              setCopywritingContent(copywritingContent.substring(0, newMaxChars));
            }
          }
        }
      }
    } catch (error) {
      console.error('載入 AI 模組配置失敗:', error);
    }
  };

  // 計算文案需要消耗的 token
  const calculateTokenCost = (text: string): number => {
    if (!selectedT2SModel) return 0;
    
    const branch = selectedT2SModel.model.branch[0];
    if (!branch) return 0;
    
    const charCount = text.length;
    const units = Math.ceil(charCount / branch.per_unit);
    return units * branch.token_per_unit;
  };

  // 載入聲音克隆記錄
  const loadSoundCloneList = async () => {
    setLoadingSoundClones(true);
    try {
      const result = await getSoundCloneList();
      
      if (result.success && result.data) {
        // 檢查數據結構，可能是嵌套的
        const data = result.data.data || result.data;
        const records = data.sound_clones || [];
        setSoundCloneList(records);
      }
    } catch (error) {
      console.error('載入聲音克隆記錄失敗:', error);
    } finally {
      setLoadingSoundClones(false);
    }
  };

  // 載入語音模型
  const loadVoiceModels = async () => {
    try {
      const proxyUrl = API_ENDPOINTS.VOICE_MODEL_LIST;
      const response = await api.get(proxyUrl);
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = response.data;
      console.log('語音模型API回應:', result);

      if (result.success && result.data) {
        // 處理自訂語音模型
        const customModels: VoiceModel[] = result.data.voice_models.map((model: any) => ({
          id: `custom-${model.voice_model_pk}`,
          name: model.voice_model_label,
          isCustom: true,
          audioUrl: model.voice_model_url,
          pk: model.voice_model_pk,
        }));

        // 處理預設語音模型
        const defaultModels: VoiceModel[] = result.data.defult_voice_model.map((model: any) => ({
          id: `default-${model.voice_model_pk}`,
          name: model.voice_model_label,
          description: '預設語音模型',
          avatar: model.pic_url,
          isCustom: false,
          audioUrl: model.voice_model_url,
          pk: model.voice_model_pk,
        }));

        setCustomVoiceModels(customModels);
        setDefaultVoiceModels(defaultModels);
      }
    } catch (error) {
      console.error('載入語音模型失敗:', error);
      // 使用預設數據作為備用
      setDefaultVoiceModels([
        {
          id: 'default-1',
          name: '專業女聲',
          description: '溫和親切的女性聲音',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          isCustom: false,
        },
        {
          id: 'default-2',
          name: '專業男聲',
          description: '穩重可靠的男性聲音',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
          isCustom: false,
        },
      ]);
    }
  };

  // 音頻播放控制
  const toggleAudioPlay = (modelId: string, audioUrl?: string) => {
    if (!audioUrl) return;

    // 停止當前播放的其他音頻
    if (playingAudio && playingAudio !== modelId) {
      const currentAudio = audioElements[playingAudio];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    if (playingAudio === modelId) {
      // 暫停當前音頻（不重置播放位置）
      const audio = audioElements[modelId];
      if (audio) {
        audio.pause();
      }
      setPlayingAudio('');
    } else {
      // 播放新音頻或繼續播放
      let audio = audioElements[modelId];
      if (!audio) {
        audio = new Audio(audioUrl);
        audio.onended = () => setPlayingAudio('');
        audio.onerror = (e) => {
          console.error('音頻播放錯誤:', e);
          setPlayingAudio('');
        };
        setAudioElements(prev => ({ ...prev, [modelId]: audio }));
      }
      
      audio.play().catch(error => {
        console.error('音頻播放失敗:', error);
        setPlayingAudio('');
      });
      setPlayingAudio(modelId);
    }
  };

  const handleNextStep = async () => {
    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // 追蹤步驟切換
      await trackAudioStep(nextStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 語音錄製功能
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('無法存取麥克風:', error);
      setUploadMessage('❌ 無法存取麥克風，請檢查權限設定');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
  };

  const uploadVoiceModel = async () => {
    if (!audioBlob) {
      setUploadMessage('❌ 沒有錄音檔案');
      return;
    }

    if (!newVoiceName.trim()) {
      setUploadMessage('❌ 請輸入語音模型名稱');
      return;
    }

    const minTime = getMinRecordingTime();
    const maxTime = getMaxRecordingTime();
    
    if (recordingTime < minTime) {
      setUploadMessage(`❌ 錄音時間太短，請錄製至少${minTime}秒`);
      return;
    }
    
    if (recordingTime > maxTime) {
      setUploadMessage(`❌ 錄音時間太長，請錄製最多${maxTime}秒`);
      return;
    }

    setIsUploading(true);
    setUploadMessage('🔄 正在上傳語音模型...');

    try {
      const formData = new FormData();
      formData.append('wav_file', audioBlob, `${newVoiceName}.webm`);
      formData.append('model_note', newVoiceName);
      formData.append('model_text', readingText);
      formData.append('is_model_mode', 'true');

      const proxyUrl = API_ENDPOINTS.UPLOAD_WAV;
      
      const csrftoken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await api.post(proxyUrl, formData, {
        headers: {
          'X-CSRFToken': csrftoken,
        }
      });

      const result = response.data;
      console.log('語音模型上傳API回應:', result);

      if (result.success) {
        const newModel: VoiceModel = {
          id: `custom-${result.data.voice_model_pk}`,
          name: newVoiceName,
          description: `自訂語音模型 (${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')})`,
          isCustom: true,
          audioUrl: result.data.voice_model_url,
          pk: result.data.voice_model_pk,
        };
        
        setCustomVoiceModels(prev => [...prev, newModel]);
        setSelectedVoiceModel(newModel.id);
        setUploadMessage('✅ 聲音模型建立成功！');

        setTimeout(() => {
          setShowVoiceRecording(false);
          resetVoiceRecording();
        }, 3000);
      } else {
        throw new Error(result.message || '上傳失敗');
      }

    } catch (error) {
      console.error('上傳過程發生錯誤:', error);
      setUploadMessage(`❌ ${error instanceof Error ? error.message : '未知錯誤，請稍後再試'}`);
      setIsUploading(false);
    }
  };

  const resetVoiceRecording = () => {
    setNewVoiceName('');
    setRecordingTime(0);
    setAudioBlob(null);
    setUploadMessage('');
    setIsUploading(false);
    setUploadedFileName('');
    setUploadMode('record');
  };

  // 處理音頻檔案上傳
  const handleAudioFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 檢查檔案類型
    const validTypes = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/webm', 'audio/mp3', 'audio/mpeg'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.wav')) {
      setUploadMessage('❌ 請上傳 WAV、MP3 或 WebM 格式的音頻檔案');
      return;
    }

    // 檢查檔案大小（限制10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadMessage('❌ 檔案大小不能超過 10MB');
      return;
    }

    // 使用音頻元素檢查時長
    const audioElement = new Audio();
    const objectUrl = URL.createObjectURL(file);
    
    audioElement.src = objectUrl;
    audioElement.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(audioElement.duration);
      const minTime = getMinRecordingTime();
      const maxTime = getMaxRecordingTime();
      
      if (duration < minTime) {
        setUploadMessage(`❌ 音頻時長至少需要 ${minTime} 秒`);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      
      if (duration > maxTime) {
        setUploadMessage(`❌ 音頻時長不能超過 ${maxTime} 秒`);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // 設置音頻 Blob 和檔案名稱
      setAudioBlob(file);
      setUploadedFileName(file.name);
      setRecordingTime(duration);
      setUploadMessage('✅ 音頻檔案已上傳成功');
      URL.revokeObjectURL(objectUrl);
    });

    audioElement.addEventListener('error', () => {
      setUploadMessage('❌ 無法讀取音頻檔案，請確認檔案格式正確');
      URL.revokeObjectURL(objectUrl);
    });
  };

  // AI文案生成功能
  const generateAiCopywriting = async () => {
    if (!audienceProfile.profession.trim()) {
      setCopywritingMessage('❌ 請選擇或填寫受眾職業');
      return;
    }

    if (!copywritingOutline.trim()) {
      setCopywritingMessage('❌ 請填寫文案大綱');
      return;
    }

    setIsGeneratingCopywriting(true);
    setCopywritingMessage('🔄 AI正在為您生成文案...');

    try {
      const requestData: any = {
        audience_age: `${audienceProfile.ageRange[0]}-${audienceProfile.ageRange[1]}歲`,
        audience_profession: audienceProfile.profession,
        tone_style: getToneStyleText(audienceProfile.tone),
        content_outline: copywritingOutline,
        duration: audienceProfile.duration // 時間長度（秒）
      };

      // 如果是擴增模式，添加說話人數參數
      if (creationMode === 'enhanced') {
        requestData.speaker_count = speakerCount;
      }

      const csrftoken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const apiUrl = API_ENDPOINTS.GENERATE_TARGET_TEXT;

      console.log('AI文案生成請求參數:', requestData);

      const response = await api.post(apiUrl, requestData, {
        headers: {
          'X-CSRFToken': csrftoken,
        }
      });

      const result = response.data;
      console.log('AI文案生成API回應:', result);

      if (result.success) {
        // 根據模式處理返回的文案
        if (creationMode === 'enhanced' && result.data.dialogue_script) {
          // 擴增模式：處理對話腳本數據格式
          const dialogueScript = result.data.dialogue_script;
          let generatedDialogues: DialogueItem[] = [];

          // 判斷回傳格式：陣列格式 vs 物件格式
          if (Array.isArray(dialogueScript)) {
            // 新格式：[{speaker: 1, text: '...', emotions: {...}, order: 1}, ...]
            console.log('AI生成的對話（陣列格式）:', dialogueScript);

            generatedDialogues = dialogueScript.map((item: any) => ({
              id: `dialogue-${Date.now()}-${Math.random()}`,
              speakerNum: item.speaker || 1,
              content: item.text || '',
              order: item.order || 0,
              emotions: item.emotions || {} // 保留情緒資料
            }));
          } else {
            // 舊格式：{ Speaker_1: { lines: [...] }, Speaker_2: { lines: [...] } }
            console.log('AI生成的對話（物件格式）:', dialogueScript);

            // 遍歷每個說話人
            Object.keys(dialogueScript).forEach((speakerKey) => {
              // 提取說話人編號 (Speaker_1 -> 1, Speaker_2 -> 2)
              const speakerNum = parseInt(speakerKey.replace('Speaker_', ''));
              const speaker = dialogueScript[speakerKey];

              // 處理該說話人的所有對話
              if (speaker.lines && Array.isArray(speaker.lines)) {
                speaker.lines.forEach((line: any) => {
                  generatedDialogues.push({
                    id: `dialogue-${Date.now()}-${Math.random()}`,
                    speakerNum: speakerNum,
                    content: line.text || '',
                    order: line.order || 0,
                    emotions: line.emotions || {} // 保留情緒資料
                  });
                });
              }
            });
          }

          // 按 order 排序
          generatedDialogues.sort((a, b) => a.order - b.order);

          // 重新分配 order，確保連續（從 0 開始）
          const finalDialogues = generatedDialogues.map((dialogue, index) => ({
            ...dialogue,
            order: index
          }));

          console.log('AI生成的對話（修正後）:', finalDialogues);

          setDialogues(finalDialogues);
          setCopywritingMessage(`✅ 多人對話文案生成成功！共 ${finalDialogues.length} 條對話`);
        } else {
          // 基礎模式：處理單一文案
          setCopywritingContent(result.data.generated_text || result.data.content || '文案生成成功');
          setCopywritingMessage('✅ 文案生成成功！');
        }

        setTimeout(() => {
          setShowAiAssistant(false);
          setCopywritingMessage('');
          setIsGeneratingCopywriting(false);
        }, 3000);
      } else {
        throw new Error(result.message || '文案生成失敗');
      }

    } catch (error) {
      console.error('AI文案生成錯誤:', error);
      setCopywritingMessage(`❌ ${error instanceof Error ? error.message : '文案生成失敗，請稍後再試'}`);
      setIsGeneratingCopywriting(false);
    }
  };

  // 生成AI音頻
  const handleGenerateAudio = async () => {
    // 根據模式驗證必要欄位
    if (creationMode === 'enhanced') {
      // 擴增模式驗證
      if (!title || dialogues.length === 0 || Object.keys(selectedVoiceModels).length !== speakerCount) {
        alert('請完成所有必要步驟');
        return;
      }
      // 檢查每條對話是否都有內容
      if (dialogues.some(d => !d.content.trim())) {
        alert('請填寫所有對話內容');
        return;
      }
    } else {
      // 基礎模式驗證
      if (!title || !selectedVoiceModel || !copywritingContent) {
        alert('請完成所有必要步驟');
        return;
      }

      // 檢查語音模型ID是否有效
      if (!selectedVoiceModel) {
        alert('請選擇語音模型');
        return;
      }

      // 從selectedVoiceModel中提取實際的pk值
      let voiceModelId: number;
      if (selectedVoiceModel.startsWith('default-')) {
        voiceModelId = parseInt(selectedVoiceModel.replace('default-', ''));
      } else if (selectedVoiceModel.startsWith('custom-')) {
        voiceModelId = parseInt(selectedVoiceModel.replace('custom-', ''));
      } else {
        voiceModelId = parseInt(selectedVoiceModel);
      }

      if (isNaN(voiceModelId) || voiceModelId <= 0) {
        alert('請選擇有效的語音模型');
        return;
      }
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage('正在準備生成音頻...');

    try {
      // 模擬進度更新
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

    // 獲取選擇的 T2S 模型的 model_pk 和 model_sub_pk
    if (!selectedT2SModel) {
      alert('請選擇 AI 模型');
      setIsGenerating(false);
      return;
    }
    const modelPk = selectedT2SModel.id; // 使用 AI 模組的 ID 作為 model_pk

    // 從 branch 中獲取 model_sub_pk
    const branch = selectedT2SModel.model.branch[0];
    if (!branch || !branch.pk) {
      alert('AI 模型配置錯誤，請重新選擇');
      setIsGenerating(false);
      return;
    }
    const modelSubPk = branch.pk; // 從 branch.pk 中獲取 model_sub_pk

    let result;

    if (creationMode === 'enhanced') {
      // 擴增模式：構建對話腳本格式
      const dialogueScript: {[key: string]: any} = {};

      // 按說話人分組對話
      for (let i = 1; i <= speakerCount; i++) {
        const speakerKey = `Speaker_${i}`;
        const modelId = selectedVoiceModels[i];

        // 提取實際的 pk 值
        let voiceModelPk: number;
        if (modelId.startsWith('default-')) {
          voiceModelPk = parseInt(modelId.replace('default-', ''));
        } else if (modelId.startsWith('custom-')) {
          voiceModelPk = parseInt(modelId.replace('custom-', ''));
        } else {
          voiceModelPk = parseInt(modelId);
        }

        // 獲取該說話人的所有對話
        const speakerDialogues = dialogues
          .filter(d => d.speakerNum === i)
          .sort((a, b) => a.order - b.order);

        // 構建該說話人的數據
        dialogueScript[speakerKey] = {
          voice_model_pk: voiceModelPk,
          lines: speakerDialogues.map((dialogue, index) => ({
            text: dialogue.content,
            order: dialogue.order + 1, // order 從 1 開始
            emotions: emotionMode === 'custom'
              ? emotionValues // 自訂模式：使用用戶設定的情緒值
              : (dialogue.emotions || {}) // 其他模式：使用對話中的情緒（AI生成或空物件）
          }))
        };
      }

      console.log('擴增模式 API調用參數:', {
        title,
        dialogue_script: dialogueScript,
        modelPk,
        modelSubPk,
        emotionMode,
        priority
      });

      // 調用 API 生成擴增模式音頻
      result = await generateAIAudio(
        title,
        null, // 擴增模式不需要單一 voice_model_id
        null, // 擴增模式不需要單一 copywriting_content
        modelPk,
        modelSubPk,
        {}, // 情緒數據已經包含在 dialogue_script 中
        priority,
        dialogueScript // 傳遞對話腳本
      );
    } else {
      // 基礎模式：原有邏輯
      const finalEmotionValues = emotionMode === 'normal'
        ? {} // 正常模式不發送情緒數據
        : emotionValues; // 自定義模式發送情緒數據

      // 從selectedVoiceModel中提取實際的pk值
      let voiceModelId: number;
      if (selectedVoiceModel.startsWith('default-')) {
        voiceModelId = parseInt(selectedVoiceModel.replace('default-', ''));
      } else if (selectedVoiceModel.startsWith('custom-')) {
        voiceModelId = parseInt(selectedVoiceModel.replace('custom-', ''));
      } else {
        voiceModelId = parseInt(selectedVoiceModel);
      }

      console.log('基礎模式 API調用參數:', {
        title,
        voiceModelId,
        copywritingContent,
        modelPk,
        modelSubPk,
        finalEmotionValues,
        emotionMode,
        priority
      });

      // 調用API生成音頻
      result = await generateAIAudio(
        title,
        voiceModelId,
        copywritingContent,
        modelPk,
        modelSubPk,
        finalEmotionValues,
        priority
      );
    }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (result.success) {
        setGenerationMessage('✅ 音頻生成需求已提交成功！');
        // 這裡可以處理生成的音頻文件
        console.log('生成的音頻數據:', result.data);
        
        // 立即重置生成狀態
        setIsGenerating(false);
        setGenerationProgress(0);
        
        // 立即跳轉回音頻生成首頁並重置到第一步
        setTimeout(() => {
          // 重置所有狀態
          setCurrentStep(1);
          setTitle('');
          setPriority(user?.role === 'admin' ? 6 : 5); // Admin重置為6，一般用戶重置為5
          setSelectedVoiceModel('');
          setCopywritingContent('');
          setEmotionMode('');
          setEmotionValues({
            happy: 0, angry: 0, sad: 0, afraid: 0,
            disgusted: 0, melancholic: 0, surprised: 0, calm: 0
          });
          setGenerationMessage('');

          // 重置擴增模式相關狀態
          setCreationMode(null);
          setSpeakerCount(1);
          setSelectedVoiceModels({});
          setDialogues([]);
          setShowVoiceModelSelection(null);
          setShowDialogueDetails(false);

          // 跳轉到音頻生成首頁
          navigate('/provider/creator/audio');
        }, 1000);
      } else {
        setGenerationMessage(result.error || '音頻生成失敗');
        setIsGenerating(false);
      }
    } catch (error: any) {
      console.error('生成音頻失敗:', error);
      setGenerationMessage('音頻生成失敗，請稍後再試');
      setIsGenerating(false);
    }
  };

  const getToneStyleText = (tone: string) => {
    switch (tone) {
      case 'professional': return '專業';
      case 'casual': return '輕鬆';
      case 'friendly': return '友善';
      case 'energetic': return '活力';
      default: return '專業';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">設定音頻基本資訊</h3>
            <p className="text-gray-600 mb-6">為您的AI音頻設定標題和基本資訊</p>
            
            <div className="space-y-6">
              {/* AI 模型選擇（如果有多個模型） */}
              {showModelSelection && availableT2SModels.length > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">選擇 AI 模型 *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableT2SModels.map(({ id, model }) => (
                      <div
                        key={id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedT2SModel?.id === id
                            ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedT2SModel({ id, model });
                          // 設置字數限制（從第一個 branch 中獲取）
                          const branch = model.branch[0];
                          if (branch?.limits?.max_chars) {
                            const newMaxChars = branch.limits.max_chars;
                            setMaxChars(newMaxChars);
                            // 如果現有內容超過新的字數限制，自動截斷
                            if (copywritingContent.length > newMaxChars) {
                              setCopywritingContent(copywritingContent.substring(0, newMaxChars));
                            }
                          }
                        }}
                      >
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">{model.name}</h4>
                          {model.branch.map((branch: any, idx: number) => (
                            <div key={idx} className="text-sm text-gray-600">
                              <p>計費方式：每 {branch.per_unit} 字消耗 {branch.token_per_unit} token</p>
                              {branch.limits?.max_chars && (
                                <p className="text-xs text-gray-500">
                                  字數上限：{branch.limits.max_chars} 字
                                </p>
                              )}
                              <p className="text-xs text-blue-600 font-medium mt-1">
                                {branch.rate_type === 'per_chars' ? '按字數計費' : '按時間計費'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">音頻標題 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  placeholder="輸入吸引人的音頻標題..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* 優先級選擇（僅 admin 可見） */}
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    優先級 * 
                    <span className="text-xs text-gray-500 font-normal ml-2">（1 最快，9 最慢）</span>
                  </label>
                  <div className="grid grid-cols-9 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={`p-3 border-2 rounded-xl text-center font-semibold transition-all ${
                          priority === level
                            ? `${AI_COLORS.border} ${AI_COLORS.bgLight} ${AI_COLORS.text} shadow-md`
                            : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-sm'
                        }`}
                        onClick={() => setPriority(level)}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    目前選擇：優先級 {priority} {priority <= 3 ? '（最快）' : priority <= 6 ? '（中等）' : '（較慢）'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        // 擴增模式：多人語音選擇
        if (creationMode === 'enhanced') {
          return (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">選擇語音模型</h3>
              <p className="text-gray-600 mb-6">點擊卡片選擇語音模型，使用 + 號新增說話人（最多4人）</p>

              {/* 為每個人選擇語音模型 - 簡潔版 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: speakerCount }, (_, index) => {
                  const speakerNum = index + 1;
                  const selectedModelId = selectedVoiceModels[speakerNum];

                  // 找出已選擇的模型
                  let selectedModel: VoiceModel | undefined;
                  if (selectedModelId) {
                    selectedModel = [...defaultVoiceModels, ...customVoiceModels].find(
                      m => m.id === selectedModelId
                    );
                  }

                  return (
                    <div
                      key={speakerNum}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedModel
                          ? `${ENHANCED_COLORS.border} ${ENHANCED_COLORS.bgLight} ${ENHANCED_COLORS.hover.shadow}`
                          : `border-dashed border-gray-300 ${ENHANCED_COLORS.hover.border} ${ENHANCED_COLORS.hover.bg}`
                      }`}
                      onClick={() => {
                        // 打開模型選擇彈窗
                        setShowVoiceModelSelection(speakerNum);
                      }}
                    >
                      <div className="flex flex-col items-center text-center">
                        {/* 頭像 */}
                        {selectedModel ? (
                          selectedModel.avatar ? (
                            <img
                              src={selectedModel.avatar}
                              alt={selectedModel.name}
                              className="w-16 h-16 rounded-full mb-3 object-cover"
                            />
                          ) : (
                            <div className={`w-16 h-16 ${ENHANCED_COLORS.bg} rounded-full mb-3 flex items-center justify-center`}>
                              <Mic size={32} className={ENHANCED_COLORS.text} />
                            </div>
                          )
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-full mb-3 flex items-center justify-center">
                            <User size={32} className="text-gray-400" />
                          </div>
                        )}

                        {/* 標題 */}
                        <div className="mb-2">
                          <div className="text-xs text-gray-500 mb-1">第 {speakerNum} 人</div>
                          <h4 className={`font-semibold ${selectedModel ? 'text-gray-900' : 'text-gray-400'}`}>
                            {selectedModel ? selectedModel.name : '待選擇'}
                          </h4>
                        </div>

                        {/* 試聽按鈕或選擇提示 */}
                        {selectedModel?.audioUrl ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAudioPlay(selectedModel.id, selectedModel.audioUrl);
                            }}
                            className={`p-2 ${ENHANCED_COLORS.bgHover} rounded-full transition-colors`}
                          >
                            {playingAudio === selectedModel.id ? (
                              <Pause size={20} className={ENHANCED_COLORS.text} />
                            ) : (
                              <Play size={20} className={ENHANCED_COLORS.text} />
                            )}
                          </button>
                        ) : !selectedModel ? (
                          <div className="text-xs text-gray-400 mt-1">點擊選擇</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* 新增人數按鈕（如果還未達到4人） */}
                {speakerCount < 4 && (
                  <div
                    className={`p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer ${ENHANCED_COLORS.hover.border} ${ENHANCED_COLORS.hover.bg} transition-all`}
                    onClick={() => {
                      setSpeakerCount(speakerCount + 1);
                    }}
                  >
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <div className={`w-16 h-16 ${ENHANCED_COLORS.bgLighter} rounded-full mb-3 flex items-center justify-center`}>
                        <Plus size={32} className={ENHANCED_COLORS.text} />
                      </div>
                      <h4 className={`font-semibold ${ENHANCED_COLORS.text}`}>新增說話人</h4>
                      <div className="text-xs text-gray-500 mt-1">最多4人</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // 基礎模式：單一語音選擇
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">選擇語音模型</h3>
            <p className="text-gray-600 mb-6">選擇預設語音或建立專屬語音風格</p>

            {/* 預設語音模型 */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">預設語音模型</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {defaultVoiceModels.map(renderVoiceModelCard)}
              </div>
            </div>

            {/* 我的語音模型 */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">我的語音模型</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {customVoiceModels.map(renderVoiceModelCard)}
                {renderAddVoiceCard()}
              </div>
            </div>
          </div>
        );

      case 3:
        // 如果還沒有選擇情緒模式，顯示選擇界面
        if (!emotionMode) {
          return (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">選擇情緒模式</h3>
              <p className="text-gray-600 mb-8">選擇您希望如何處理音頻的情緒表達</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 自動模式（擴增模式預設） */}
                {creationMode === 'enhanced' && (
                  <div
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      emotionMode === 'auto'
                        ? `${AI_COLORS.border} ${AI_COLORS.bgLight} shadow-md`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setEmotionMode('auto')}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles size={32} className="text-blue-600" />
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">自動模式</h4>
                      <p className="text-gray-600 mb-4">AI自動分析文案內容並調整情緒表達</p>
                      <div className="text-sm text-gray-500">
                        • AI智能分析<br/>
                        • 自動調整情緒<br/>
                        • 省時便捷
                      </div>
                    </div>
                  </div>
                )}

                {/* 正常模式 */}
                <div
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    emotionMode === 'normal'
                      ? `${AI_COLORS.border} ${AI_COLORS.bgLight} shadow-md`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEmotionMode('normal')}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">😐</span>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">正常模式</h4>
                    <p className="text-gray-600 mb-4">使用中性語調，適合一般用途的音頻內容</p>
                    <div className="text-sm text-gray-500">
                      • 中性語調<br/>
                      • 標準語速<br/>
                      • 適合多數場景
                    </div>
                  </div>
                </div>

                {/* 情緒調整模式 */}
                <div
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    emotionMode === 'custom'
                      ? `${AI_COLORS.border} ${AI_COLORS.bgLight} shadow-md`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEmotionMode('custom')}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎭</span>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">情緒調整模式</h4>
                    <p className="text-gray-600 mb-4">精細調整各種情緒的強度，創造更豐富的情感表達</p>
                    <div className="text-sm text-gray-500">
                      • 8種情緒選項<br/>
                      • 0-100強度調整<br/>
                      • 個性化語音
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // 如果選擇了自動模式，顯示確認信息
        if (emotionMode === 'auto') {
          return (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">情緒模式確認</h3>
              <p className="text-gray-600 mb-6">您已選擇自動模式，AI將智能分析文案並調整情緒表達</p>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} className="text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">自動模式</h4>
                <p className="text-gray-600 mb-4">AI將根據您的文案內容自動分析並調整情緒強度，無需手動設定</p>
                <button
                  onClick={() => setEmotionMode('')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  重新選擇
                </button>
              </div>
            </div>
          );
        }

        // 如果選擇了正常模式，顯示確認信息
        if (emotionMode === 'normal') {
          return (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">情緒模式確認</h3>
              <p className="text-gray-600 mb-6">您已選擇正常模式，將使用中性語調生成音頻</p>

              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">😐</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">正常模式</h4>
                <p className="text-gray-600 mb-4">將使用中性語調、標準語速生成音頻，適合一般用途</p>
                <button
                  onClick={() => setEmotionMode('')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  重新選擇
                </button>
              </div>
            </div>
          );
        }

        // 如果選擇了自定義模式，顯示情緒調整界面
        if (emotionMode === 'custom') {
          const emotionEmojis: {[key: string]: string} = {
            'happy': '😊',
            'angry': '😠',
            'sad': '😢',
            'afraid': '😨',
            'disgusted': '🤢',
            'melancholic': '😔',
            'surprised': '😲',
            'calm': '😌'
          };

          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">情緒調整</h3>
                  <p className="text-gray-600">調整音頻的情緒表達強度，讓AI為您生成更貼切的語音</p>
                </div>
                <button
                  onClick={() => setEmotionMode('normal')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  重新選擇模式
                </button>
              </div>
              
              <div className="space-y-4">
                {emotionOptions.map((emotion) => {
                  const isActive = emotionValues[emotion.value] > 0;
                  
                  return (
                    <div
                      key={emotion.value}
                      className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? `${AI_COLORS.border} ${AI_COLORS.bgLight} shadow-md`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* 情緒圖示和標題 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{emotionEmojis[emotion.value]}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{emotion.label}</h4>
                            <p className="text-xs text-gray-600">{emotion.description}</p>
                          </div>
                        </div>
                        <div className={`text-2xl font-bold ${isActive ? AI_COLORS.text : 'text-gray-400'}`}>
                          {emotionValues[emotion.value]}
                        </div>
                      </div>
                      
                      {/* 快速選擇按鈕 */}
                      <div className="flex items-center gap-2 mb-3">
                        {[0, 25, 50, 75, 100].map((value) => (
                          <button
                            key={value}
                            onClick={() => {
                              setEmotionValues(prev => ({
                                ...prev,
                                [emotion.value]: value
                              }));
                            }}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              emotionValues[emotion.value] === value
                                ? `${AI_COLORS.bgDark} text-white shadow-md`
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                      
                      {/* +/- 控制按鈕 */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const newValue = Math.max(0, emotionValues[emotion.value] - 5);
                            setEmotionValues(prev => ({
                              ...prev,
                              [emotion.value]: newValue
                            }));
                          }}
                          className={`p-2 rounded-lg ${AI_COLORS.bg} ${AI_COLORS.text} hover:${AI_COLORS.bgHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={emotionValues[emotion.value] === 0}
                        >
                          <Minus size={20} />
                        </button>
                        
                        <div className="flex-1 bg-gray-200 rounded-lg h-3 overflow-hidden">
                          <div
                            className={`h-full ${AI_COLORS.bgDark} transition-all duration-300`}
                            style={{ width: `${emotionValues[emotion.value]}%` }}
                          />
                        </div>
                        
                        <button
                          onClick={() => {
                            const newValue = Math.min(100, emotionValues[emotion.value] + 5);
                            setEmotionValues(prev => ({
                              ...prev,
                              [emotion.value]: newValue
                            }));
                          }}
                          className={`p-2 rounded-lg ${AI_COLORS.bg} ${AI_COLORS.text} hover:${AI_COLORS.bgHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                          disabled={emotionValues[emotion.value] === 100}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 情緒預覽說明 */}
              <div className="mt-6 space-y-3">
        
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Target size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 mb-1">💡 最佳效果建議</h4>
                      <p className="text-sm text-amber-700">
                        建議單一情緒強度不要超過 <span className="font-bold">60</span>，可以獲得更自然、更真實的語音表現效果。過高的情緒強度可能會讓語音聽起來過於誇張。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return null;

      case 4:
        // 擴增模式：多人對話編輯
        if (creationMode === 'enhanced') {
          const totalLength = totalDialogueLength;

          return (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">文案編輯</h3>
                  <p className="text-gray-600">編寫音頻文案內容</p>
                </div>
                <button
                  className={`flex items-center gap-2 px-4 py-2 ${AI_COLORS.bg} ${AI_COLORS.text} rounded-xl text-sm font-semibold hover:${AI_COLORS.bgHover} transition-colors`}
                  onClick={() => setShowAiAssistant(true)}
                >
                  <Sparkles size={16} />
                  AI輔助
                </button>
              </div>

              {/* 已設定人物區塊 */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">已設定人物（點擊添加對話，拖拽調整順序）</h4>
                  {hasPendingSpeakerChanges && (
                    <button
                      onClick={applySpeakerOrderChanges}
                      className={`flex items-center gap-2 px-4 py-2 ${ENHANCED_COLORS.button} rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all animate-pulse`}
                    >
                      <Sparkles size={16} />
                      更新對話
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {speakerOrder.map((originalSpeakerNum) => {
                    const displayPosition = speakerOrder.indexOf(originalSpeakerNum) + 1;
                    const modelId = selectedVoiceModels[originalSpeakerNum];
                    const model = [...defaultVoiceModels, ...customVoiceModels].find(m => m.id === modelId);

                    return (
                      <div
                        key={originalSpeakerNum}
                        draggable
                        onDragStart={() => handleDragStart(originalSpeakerNum)}
                        onDragOver={(e) => handleDragOver(e, originalSpeakerNum)}
                        onDragEnd={handleDragEnd}
                        className={`relative cursor-move ${
                          draggedSpeaker === originalSpeakerNum ? 'opacity-50 scale-95' : ''
                        } transition-all duration-200`}
                      >
                        {/* 主要卡片 */}
                        <div
                          onClick={() => !hasPendingSpeakerChanges && addDialogue(originalSpeakerNum)}
                          className={`p-3 ${ENHANCED_COLORS.bgLight} border-2 ${ENHANCED_COLORS.borderLight} rounded-xl hover:${ENHANCED_COLORS.hover.shadow} transition-all ${
                            hasPendingSpeakerChanges ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <div className="flex flex-col items-center text-center">
                            {model?.avatar ? (
                              <img src={model.avatar} alt={model.name} className="w-12 h-12 rounded-full mb-2 object-cover" />
                            ) : (
                              <div className={`w-12 h-12 ${ENHANCED_COLORS.bg} rounded-full mb-2 flex items-center justify-center`}>
                                <User size={24} className={ENHANCED_COLORS.text} />
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mb-0.5">第{displayPosition}人</div>
                            <div className={`text-sm font-semibold ${ENHANCED_COLORS.text}`}>
                              {model?.name || '未設定'}
                            </div>
                          </div>
                        </div>

                        {/* 拖拽提示圖標 */}
                        <div className={`absolute top-2 right-2 ${ENHANCED_COLORS.bg} rounded-full p-1`}>
                          <svg className={ENHANCED_COLORS.text} width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <circle cx="3" cy="3" r="1" fill="currentColor"/>
                            <circle cx="9" cy="3" r="1" fill="currentColor"/>
                            <circle cx="3" cy="6" r="1" fill="currentColor"/>
                            <circle cx="9" cy="6" r="1" fill="currentColor"/>
                            <circle cx="3" cy="9" r="1" fill="currentColor"/>
                            <circle cx="9" cy="9" r="1" fill="currentColor"/>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 對話列表 */}
              <div className="mb-4 relative">
                {/* 待更新提示遮罩 */}
                {hasPendingSpeakerChanges && (
                  <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className={`w-16 h-16 ${ENHANCED_COLORS.gradient} rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse`}>
                        <AlertTriangle size={32} className="text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">人物順序已變更</h3>
                      <p className="text-sm text-gray-600 mb-4">請點擊上方「更新對話」按鈕來應用變更</p>
                    </div>
                  </div>
                )}

                <div className={`transition-opacity duration-300 ${hasPendingSpeakerChanges ? 'opacity-40' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-900">對話內容</label>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${totalLength > maxChars ? 'text-red-500' : 'text-gray-500'}`}>
                        {totalLength}/{maxChars}
                      </span>
                      {totalLength > maxChars && (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                          超出字數限制
                        </span>
                      )}
                    </div>
                  </div>

                  {dialogues.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Users size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">尚無對話內容</p>
                    <p className="text-sm text-gray-400 mt-1">點擊上方人物卡片添加對話</p>
                  </div>
                ) : (
                  <div className="space-y-3" key={`dialogues-${Object.entries(selectedVoiceModels).map(([k,v]) => `${k}:${v}`).join('|')}`}>
                    {dialogues.map((dialogue, index) => {
                      const modelId = selectedVoiceModels[dialogue.speakerNum];
                      const model = [...defaultVoiceModels, ...customVoiceModels].find(
                        m => m.id === modelId
                      );

                      return (
                        <div
                          key={`${dialogue.id}-speaker-${dialogue.speakerNum}-model-${modelId}`}
                          className="bg-white border-2 border-gray-200 rounded-xl transition-all hover:shadow-md"
                        >
                          <div className="flex items-start gap-2 p-3">
                            {/* 上下移動按鈕 */}
                            <div className="flex-shrink-0 flex flex-col gap-1">
                              <button
                                onClick={() => moveDialogueUp(index)}
                                disabled={index === 0}
                                className={`p-1 rounded transition-colors ${
                                  index === 0
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                }`}
                                title="上移"
                              >
                                <ChevronUp size={18} />
                              </button>
                              <button
                                onClick={() => moveDialogueDown(index)}
                                disabled={index === dialogues.length - 1}
                                className={`p-1 rounded transition-colors ${
                                  index === dialogues.length - 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                }`}
                                title="下移"
                              >
                                <ChevronDown size={18} />
                              </button>
                            </div>

                            {/* 左側：頭像+名字+對話內容 */}
                            <div className="flex-1 min-w-0">
                              {/* 頭像和名字在同一列 */}
                              <div className="flex items-center gap-2 mb-2">
                                {/* 縮小的頭像 */}
                                <div className="flex-shrink-0">
                                  {model?.avatar ? (
                                    <img
                                      src={model.avatar}
                                      alt={model.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className={`w-6 h-6 ${ENHANCED_COLORS.bg} rounded-full flex items-center justify-center`}>
                                      <User size={14} className={ENHANCED_COLORS.text} />
                                    </div>
                                  )}
                                </div>
                                {/* 名字 */}
                                <div className={`text-sm font-semibold ${ENHANCED_COLORS.text}`}>
                                  {model?.name || `第${dialogue.speakerNum}人`}
                                </div>
                              </div>

                              {/* 對話輸入框 */}
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="輸入對話內容..."
                                value={dialogue.content}
                                onChange={(e) => updateDialogue(dialogue.id, e.target.value)}
                              />
                            </div>

                            {/* 右側：刪除按鈕和字數 */}
                            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                              <button
                                onClick={() => deleteDialogue(dialogue.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="刪除對話"
                              >
                                <Trash2 size={18} />
                              </button>
                              <div className="text-xs text-gray-500 text-center whitespace-nowrap">
                                {dialogue.content.length} 字
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>

              {/* 統計資訊 */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  {dialogues.length === 0 ? (
                    <>尚無對話內容</>
                  ) : (
                    <>
                      共 {dialogues.length} 條對話，總計 {totalLength} 字
                      {totalLength > 0 && ` · 還可輸入 ${maxChars - totalLength} 字`}
                    </>
                  )}
                </div>
                {selectedT2SModel && totalLength > 0 && (
                  <div className="text-blue-600 font-medium">
                    預計消耗：{calculateTokenCost(dialogues.map(d => d.content).join(''))} token
                  </div>
                )}
              </div>
            </div>
          );
        }

        // 基礎模式：單一文案編輯
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">文案編輯</h3>
                <p className="text-gray-600">編寫音頻文案內容</p>
              </div>
              <button
                className={`flex items-center gap-2 px-4 py-2 ${AI_COLORS.bg} ${AI_COLORS.text} rounded-xl text-sm font-semibold hover:${AI_COLORS.bgHover} transition-colors`}
                onClick={() => setShowAiAssistant(true)}
              >
                <Sparkles size={16} />
                AI輔助
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">文案內容</label>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${copywritingContent.length > maxChars ? 'text-red-500' : 'text-gray-500'}`}>
                    {copywritingContent.length}/{maxChars}
                  </span>
                  {copywritingContent.length > maxChars && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                      超出字數限制
                    </span>
                  )}
                </div>
              </div>
              <textarea
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent resize-none ${
                  copywritingContent.length > maxChars
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-ai-500'
                }`}
                rows={8}
                placeholder={`輸入完整的音頻文案內容...（最多${maxChars}字）`}
                value={copywritingContent}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= maxChars) {
                    setCopywritingContent(newValue);
                  }
                }}
                maxLength={maxChars}
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {copywritingContent.length > 0 ? (
                    <>已輸入 {copywritingContent.length} 字，還可輸入 {maxChars - copywritingContent.length} 字</>
                  ) : (
                    <>最多可輸入 {maxChars} 字</>
                  )}
                </div>
                {selectedT2SModel && copywritingContent.length > 0 && (
                  <div className="text-xs font-medium text-blue-600">
                    預計消耗：{calculateTokenCost(copywritingContent)} token
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        const selectedVoiceModelData = [...defaultVoiceModels, ...customVoiceModels].find(model => model.id === selectedVoiceModel);
        const hasAnyEmotionValue = Object.values(emotionValues).some(value => value > 0);
        
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI生成音頻</h3>
            <p className="text-gray-600 mb-6">確認您的選擇並開始生成音頻</p>
            
            {/* 選擇內容預覽 */}
            <div className="space-y-6 mb-8">
              {/* 項目標題 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">專案標題</h4>
                </div>
                <p className="text-gray-700">{title || '未設定'}</p>
              </div>

              {/* 語音模型 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mic size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">語音模型</h4>
                </div>
                {creationMode === 'enhanced' ? (
                  // 擴增模式：顯示多個語音模型
                  <div className="space-y-3">
                    {Array.from({ length: speakerCount }, (_, index) => {
                      const speakerNum = index + 1;
                      const modelId = selectedVoiceModels[speakerNum];
                      const model = [...defaultVoiceModels, ...customVoiceModels].find(m => m.id === modelId);

                      return (
                        <div key={speakerNum} className="flex items-center gap-3 bg-white rounded-lg p-3 border">
                          <div className={`w-10 h-10 ${ENHANCED_COLORS.bg} rounded-full flex items-center justify-center overflow-hidden`}>
                            {model?.avatar ? (
                              <img
                                src={model.avatar}
                                alt={model.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={20} className={ENHANCED_COLORS.text} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">第{speakerNum}人：{model?.name || '未設定'}</p>
                            {model?.description && (
                              <p className="text-sm text-gray-600">{model.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : selectedVoiceModelData ? (
                  // 基礎模式：顯示單一語音模型
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedVoiceModelData.avatar && !selectedVoiceModelData.isCustom ? (
                        <img
                          src={selectedVoiceModelData.avatar}
                          alt={selectedVoiceModelData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={24} className={AI_COLORS.text} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedVoiceModelData.name}</p>
                      <p className="text-sm text-gray-600">{selectedVoiceModelData.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">未選擇語音模型</p>
                )}
              </div>

              {/* 情緒選擇 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Palette size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">情緒表達</h4>
                </div>
                {emotionMode === 'auto' ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Sparkles size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">自動模式</p>
                      <p className="text-sm text-gray-600">AI自動分析文案內容並調整情緒表達</p>
                    </div>
                  </div>
                ) : emotionMode === 'normal' ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg">😐</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">正常模式</p>
                      <p className="text-sm text-gray-600">使用中性語調、標準語速</p>
                    </div>
                  </div>
                ) : emotionMode === 'custom' && hasAnyEmotionValue ? (
                  <div className="space-y-2">
                    {Object.entries(emotionValues)
                      .filter(([_, value]) => value > 0)
                      .map(([emotion, value]) => {
                        const emotionData = emotionOptions.find(e => e.value === emotion);
                        const emotionEmojis: {[key: string]: string} = {
                          'happy': '😊',
                          'angry': '😠',
                          'sad': '😢',
                          'afraid': '😨',
                          'disgusted': '🤢',
                          'melancholic': '😔',
                          'surprised': '😲',
                          'calm': '😌'
                        };
                        return (
                          <div key={emotion} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-lg">{emotionEmojis[emotion]}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{emotionData?.label}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${value}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-600">{value}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg">😐</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">中性語調</p>
                      <p className="text-sm text-gray-600">未設定特定情緒強度</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 優先級顯示（僅 admin 可見） */}
              {user?.role === 'admin' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={20} className="text-purple-600" />
                    <h4 className="font-semibold text-purple-800">優先級設定</h4>
                  </div>
                  <div className="space-y-1 text-sm text-purple-700">
                    <p className="font-bold text-lg">
                      優先級：{priority} {priority <= 3 ? '（最快）' : priority <= 6 ? '（中等）' : '（較慢）'}
                    </p>
                    <p className="text-xs">數字越小，處理優先順序越高</p>
                  </div>
                </div>
              )}

              {/* 文案內容 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className={AI_COLORS.text} />
                    <h4 className="font-semibold text-gray-900">文案內容</h4>
                  </div>
                  {creationMode === 'enhanced' && dialogues.length > 0 && (
                    <button
                      onClick={() => setShowDialogueDetails(!showDialogueDetails)}
                      className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                        showDialogueDetails
                          ? `${ENHANCED_COLORS.button}`
                          : `${ENHANCED_COLORS.buttonOutline}`
                      }`}
                    >
                      {showDialogueDetails ? (
                        <>
                          <ChevronUp size={16} />
                          收起詳情
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          查看詳情
                        </>
                      )}
                    </button>
                  )}
                </div>
                {creationMode === 'enhanced' ? (
                  // 擴增模式：顯示對話列表
                  dialogues.length > 0 ? (
                    <div className="space-y-3">
                      {/* 概況摘要 */}
                      <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${ENHANCED_COLORS.gradient} rounded-full flex items-center justify-center`}>
                              <Users size={20} className="text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">對話概況</p>
                              <p className="text-sm text-gray-600">
                                共 {dialogues.length} 條對話 · {speakerCount} 位說話人參與
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{dialogues.length}</p>
                            <p className="text-xs text-gray-600 mt-1">總對話數</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{totalDialogueLength}</p>
                            <p className="text-xs text-gray-600 mt-1">總字數</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {selectedT2SModel ? calculateTokenCost(dialogues.map(d => d.content).join('')) : 0}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">預計 Token</p>
                          </div>
                        </div>
                      </div>

                      {/* 詳細對話列表（可展開） */}
                      {showDialogueDetails && (
                        <div className="space-y-2 animate-fadeIn">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-gray-300"></div>
                            <span className="text-xs text-gray-500 font-medium">對話詳情</span>
                            <div className="h-px flex-1 bg-gray-300"></div>
                          </div>
                          {dialogues.map((dialogue, index) => {
                            const model = [...defaultVoiceModels, ...customVoiceModels].find(
                              m => m.id === selectedVoiceModels[dialogue.speakerNum]
                            );

                            return (
                              <div key={dialogue.id} className="bg-white rounded-lg p-3 border hover:border-purple-300 transition-colors">
                                <div className="flex items-start gap-3">
                                  {/* 說話人頭像 */}
                                  <div className="flex-shrink-0">
                                    {model?.avatar ? (
                                      <img
                                        src={model.avatar}
                                        alt={model.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className={`w-8 h-8 ${ENHANCED_COLORS.bg} rounded-full flex items-center justify-center`}>
                                        <User size={16} className={ENHANCED_COLORS.text} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-semibold ${ENHANCED_COLORS.text}`}>
                                        {model?.name || `第${dialogue.speakerNum}人`}
                                      </span>
                                      <span className="text-xs text-gray-400">#{index + 1}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {dialogue.content}
                                    </p>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {dialogue.content.length} 字
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">未輸入文案內容</p>
                  )
                ) : copywritingContent ? (
                  // 基礎模式：顯示單一文案
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {copywritingContent}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">字數：{copywritingContent.length} / {maxChars}</span>
                      {selectedT2SModel && (
                        <span className="font-medium text-blue-600">
                          預計消耗：{calculateTokenCost(copywritingContent)} token
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">未輸入文案內容</p>
                )}
              </div>
            </div>

            {/* 生成按鈕 */}
            <div className="text-center">
              <button 
                className={`inline-flex items-center gap-3 px-8 py-4 ${AI_COLORS.button} rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleGenerateAudio}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Volume2 size={24} />
                    開始生成音頻
                  </>
                )}
              </button>
              
              {/* 生成進度 */}
              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{generationMessage}</p>
                </div>
              )}
              
              {/* 生成訊息 */}
              {generationMessage && !isGenerating && (
                <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
                  generationMessage.includes('成功') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : generationMessage.includes('失敗') || generationMessage.includes('錯誤')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                }`}>
                  <p>{generationMessage}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderVoiceModelCard = (model: VoiceModel) => (
    <div
      key={model.id}
      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-colors ${
        selectedVoiceModel === model.id
          ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedVoiceModel(model.id)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-3 overflow-hidden">
          {model.avatar && !model.isCustom ? (
            <img 
              src={model.avatar} 
              alt={model.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={28} className={AI_COLORS.text} />
          )}
        </div>
        <h4 className="font-semibold text-gray-900 mb-3">{model.name}</h4>
        
        {model.audioUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAudioPlay(model.id, model.audioUrl);
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              playingAudio === model.id
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : `${AI_COLORS.bg} ${AI_COLORS.text} hover:${AI_COLORS.bgHover}`
            }`}
          >
            {playingAudio === model.id ? (
              <>
                <Pause size={12} />
                暫停
              </>
            ) : (
              <>
                <Play size={12} />
                播放
              </>
            )}
          </button>
        )}
        
        {model.isCustom && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
            自訂
          </div>
        )}
      </div>
    </div>
  );

  const renderAddVoiceCard = () => (
    <div
      className={`p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:${AI_COLORS.border} transition-colors`}
      onClick={() => setShowVoiceRecording(true)}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 ${AI_COLORS.bg} rounded-full flex items-center justify-center mb-3`}>
          <Plus size={28} className={AI_COLORS.text} />
        </div>
        <h4 className={`font-semibold ${AI_COLORS.text} mb-1`}>錄製語音模型</h4>
        <p className="text-sm text-gray-600">錄製專屬語音</p>
      </div>
    </div>
  );

  useEffect(() => {
    loadVoiceModels();
    loadAIModuleConfig();
    
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      
      // 清理音頻元素
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // 初始化說話人順序
  useEffect(() => {
    if (speakerCount > 0) {
      setSpeakerOrder(Array.from({ length: speakerCount }, (_, i) => i + 1));
      setHasPendingSpeakerChanges(false);
    }
  }, [speakerCount]);

  // 錄音時長限制（秒）
  const getMaxRecordingTime = () => {
    return 20;
  };

  const getMinRecordingTime = () => {
    return 5;
  };

  // 擴增模式：添加對話
  const addDialogue = (speakerNum: number) => {
    const newDialogue: DialogueItem = {
      id: `dialogue-${Date.now()}`,
      speakerNum,
      content: '',
      order: dialogues.length,
    };
    setDialogues([...dialogues, newDialogue]);
  };

  // 擴增模式：更新對話內容
  const updateDialogue = (id: string, content: string) => {
    setDialogues(dialogues.map(d => d.id === id ? { ...d, content } : d));
  };

  // 擴增模式：刪除對話
  const deleteDialogue = (id: string) => {
    setDialogues(dialogues.filter(d => d.id !== id));
  };

  // 擴增模式：拖拽處理函數
  const handleDragStart = (speakerNum: number) => {
    setDraggedSpeaker(speakerNum);
  };

  const handleDragOver = (e: React.DragEvent, targetSpeaker: number) => {
    e.preventDefault();
    if (draggedSpeaker === null || draggedSpeaker === targetSpeaker) return;

    const newOrder = [...speakerOrder];
    const draggedIndex = newOrder.indexOf(draggedSpeaker);
    const targetIndex = newOrder.indexOf(targetSpeaker);

    // 交換位置
    [newOrder[draggedIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[draggedIndex]];

    setSpeakerOrder(newOrder);
    setHasPendingSpeakerChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedSpeaker(null);
  };

  // 擴增模式：應用說話人順序變更
  const applySpeakerOrderChanges = () => {
    if (!hasPendingSpeakerChanges) return;

    // 正確的邏輯：
    // Speaker 1-4 是固定的「槽位」，語音角色是可分配的「角色」
    // 拖拉交換時，只需要交換 selectedVoiceModels 的對應關係
    // 對話的 speakerNum 完全不需要改變！

    // 重新映射語音模型（根據新順序重新分配模型到槽位）
    const newSelectedVoiceModels: {[key: number]: string} = {};
    speakerOrder.forEach((originalSpeakerNum, newIndex) => {
      const newSpeakerNum = newIndex + 1;
      const modelId = selectedVoiceModels[originalSpeakerNum];
      newSelectedVoiceModels[newSpeakerNum] = modelId;
    });

    // 只更新 selectedVoiceModels，不更新對話
    setSelectedVoiceModels(newSelectedVoiceModels);

    // 重置 speakerOrder 為正常順序
    setSpeakerOrder(Array.from({ length: speakerCount }, (_, i) => i + 1));
    setHasPendingSpeakerChanges(false);
  };

  // 擴增模式：上移對話
  const moveDialogueUp = (index: number) => {
    if (index === 0) return;
    const newDialogues = [...dialogues];
    [newDialogues[index - 1], newDialogues[index]] = [newDialogues[index], newDialogues[index - 1]];
    // 更新 order
    setDialogues(newDialogues.map((item, idx) => ({ ...item, order: idx })));
  };

  // 擴增模式：下移對話
  const moveDialogueDown = (index: number) => {
    if (index === dialogues.length - 1) return;
    const newDialogues = [...dialogues];
    [newDialogues[index], newDialogues[index + 1]] = [newDialogues[index + 1], newDialogues[index]];
    // 更新 order
    setDialogues(newDialogues.map((item, idx) => ({ ...item, order: idx })));
  };

  // 如果尚未選擇創作模式，顯示模式選擇界面
  if (!creationMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* 返回按鈕 */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>

          {/* 模式選擇卡片 */}
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {/* 基礎模式 */}
            <div
              onClick={() => setCreationMode('basic')}
              className="bg-white rounded-2xl p-4 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <FileAudio size={32} className="text-blue-600 md:w-10 md:h-10" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">基礎模式</h3>
                <p className="text-xs md:text-base text-gray-600 mb-4 md:mb-6">標準音頻創作流程</p>

                <div className="text-left space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex items-start gap-2 md:gap-3">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm text-gray-700">單一語音模型</span>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm text-gray-700">情緒調整選項</span>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm text-gray-700">快速生成</span>
                  </div>
                </div>

                <div className={`px-3 md:px-4 py-2 ${AI_COLORS.bg} ${AI_COLORS.text} rounded-lg text-sm md:text-base font-semibold group-hover:shadow-md transition-shadow`}>
                  選擇基礎模式
                </div>
              </div>
            </div>

            {/* 擴增模式 */}
            <div
              onClick={() => {
                setCreationMode('enhanced');
                setEmotionMode('auto'); // 預設自動模式
              }}
              className={`bg-white rounded-2xl p-4 md:p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent ${ENHANCED_COLORS.hover.border} group relative overflow-hidden`}
            >
              {/* 字幕徽章 - 右上角 */}
              <span className={`absolute top-3 right-3 md:top-4 md:right-4 px-1.5 md:px-2 py-0.5 md:py-1 ${ENHANCED_COLORS.gradient} text-white text-xs font-bold rounded-full z-20`}>字幕</span>

              {/* 漸變背景 */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${ENHANCED_COLORS.gradientLight} rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>

              <div className="text-center relative z-10">
                <div className={`w-16 h-16 md:w-20 md:h-20 ${ENHANCED_COLORS.gradientLight} rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                  <Users size={32} className={`${ENHANCED_COLORS.text} md:w-10 md:h-10`} />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">擴增模式</h3>
                <p className="text-xs md:text-base text-gray-600 mb-4 md:mb-6">支援多人語音與字幕生成</p>

                <div className="text-left space-y-2 md:space-y-3 mb-4 md:mb-6">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Sparkles size={16} className={`${ENHANCED_COLORS.iconLight} flex-shrink-0 mt-0.5 md:w-5 md:h-5`} />
                    <span className="text-xs md:text-sm text-gray-700">最多4人語音模型</span>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <Sparkles size={16} className={`${ENHANCED_COLORS.iconLight} flex-shrink-0 mt-0.5 md:w-5 md:h-5`} />
                    <span className="text-xs md:text-sm text-gray-700">AI自動情緒分析</span>
                  </div>
                  <div className="flex items-start gap-2 md:gap-3">
                    <Sparkles size={16} className={`${ENHANCED_COLORS.iconLight} flex-shrink-0 mt-0.5 md:w-5 md:h-5`} />
                    <span className="text-xs md:text-sm text-gray-700">智能字幕生成</span>
                  </div>
                </div>

                <div className={`px-3 md:px-4 py-2 ${ENHANCED_COLORS.buttonGradient} rounded-lg text-sm md:text-base font-semibold group-hover:shadow-md transition-shadow`}>
                  選擇擴增模式
                </div>
              </div>
            </div>
          </div>

          {/* 音頻記錄 */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-2xl font-bold text-gray-900">音頻記錄</h4>
              <div className="flex items-center gap-3">
                {showSoundCloneList && (
                  <button
                    onClick={async () => {
                      try {
                        await loadSoundCloneList();
                      } catch (error) {
                        console.error('重新整理失敗:', error);
                      }
                    }}
                    disabled={loadingSoundClones}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 bg-white rounded-lg border border-gray-200"
                  >
                    <Loader2 size={16} className={loadingSoundClones ? 'animate-spin' : ''} />
                    重新整理
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSoundCloneList(!showSoundCloneList);
                    if (!showSoundCloneList && soundCloneList.length === 0) {
                      loadSoundCloneList();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                >
                  {showSoundCloneList ? '隱藏記錄' : '查看記錄'}
                </button>
              </div>
            </div>

            {showSoundCloneList && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                {loadingSoundClones ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600 text-lg">載入中...</span>
                  </div>
                ) : soundCloneList.length > 0 ? (
                  <div className="space-y-4">
                    {soundCloneList.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow border border-gray-100">
                        {/* 頂部：標題和狀態 */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-gray-900 text-lg truncate mb-2">{record.label}</h5>
                            <p className="text-sm text-gray-600 line-clamp-2">{record.text_content}</p>
                          </div>
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            record.voice_model === null
                              ? 'bg-purple-100 text-purple-700'
                              : record.is_completed
                              ? 'bg-green-100 text-green-700'
                              : record.status === '等待中'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {record.voice_model === null
                              ? '自建內容'
                              : (record.status || (record.is_completed ? '已完成' : '處理中'))
                            }
                          </span>
                        </div>

                        {/* 中間：信息網格（帶圖標） */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {record.voice_model && (
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 truncate">語音: {record.voice_model.model_label}</span>
                            </div>
                          )}
                          {record.generation_voice_seconds > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600">時長: {record.generation_voice_seconds}秒</span>
                            </div>
                          )}
                          {record.emotion_data && record.primary_emotion && (
                            <div className="flex items-center gap-2">
                              <Sparkles size={16} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                {record.primary_emotion.emotion === 'sad' ? '悲傷' :
                                 record.primary_emotion.emotion === 'angry' ? '憤怒' :
                                 record.primary_emotion.emotion === 'happy' ? '開心' :
                                 record.primary_emotion.emotion === 'afraid' ? '害怕' :
                                 record.primary_emotion.emotion === 'disgusted' ? '厭惡' :
                                 record.primary_emotion.emotion === 'melancholic' ? '憂鬱' :
                                 record.primary_emotion.emotion === 'surprised' ? '驚訝' :
                                 record.primary_emotion.emotion === 'calm' ? '平靜' :
                                 record.primary_emotion.emotion} ({record.primary_emotion.value}%)
                              </span>
                            </div>
                          )}
                          {record.token_consumed && (
                            <div className="flex items-center gap-2">
                              <Zap size={16} className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600">Token: {record.token_consumed}</span>
                            </div>
                          )}
                        </div>

                        {/* 底部：建立時間和操作按鈕 */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock size={14} />
                            <span>建立時間: {new Date(record.created_at).toLocaleDateString('zh-TW')}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {record.generation_file ? (
                              <>
                                <button
                                  onClick={() => {
                                    toggleAudioPlay(`record-${record.id}`, record.generation_file.file_url);
                                  }}
                                  className={`p-2 rounded-full transition-all ${
                                    playingAudio === `record-${record.id}`
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'bg-blue-100 text-blue-600 hover:shadow-md'
                                  }`}
                                  title={playingAudio === `record-${record.id}` ? '暫停' : '播放'}
                                >
                                  {playingAudio === `record-${record.id}` ? (
                                    <Pause size={18} />
                                  ) : (
                                    <Play size={18} />
                                  )}
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(record.generation_file.file_url);
                                      const blob = await res.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `${record.label}.mp3`;
                                      document.body.appendChild(a);
                                      a.click();
                                      setTimeout(() => {
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      }, 100);
                                    } catch (e) {
                                      alert('下載失敗，請稍後再試');
                                    }
                                  }}
                                  className="p-2 bg-blue-600 text-white rounded-full hover:shadow-md transition-all"
                                  title="下載音頻"
                                >
                                  <Download size={18} />
                                </button>
                              </>
                            ) : record.status === '等待中' ? (
                              <div className="p-2 text-orange-600" title="音頻生成中">
                                <Clock size={18} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileAudio size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">尚無音頻創作記錄</p>
                    <p className="text-sm">開始創作您的第一個AI音頻吧！</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep >= step.id
                        ? step.completed
                          ? 'bg-emerald-500 text-white'
                          : `${AI_COLORS.bgDark} text-white`
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      currentStep >= step.id ? 'text-gray-900 font-semibold' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? AI_COLORS.bgDark : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-8">
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
              上一步
            </button>
          )}
          
          <div className="flex-1" />
          
          {currentStep < 5 && (
            <button
              onClick={handleNextStep}
              disabled={!steps[currentStep - 1].completed}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                steps[currentStep - 1].completed
                  ? `${AI_COLORS.button}`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              下一步
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Voice Recording Modal */}
      {showVoiceRecording && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button 
                onClick={() => {
                  setShowVoiceRecording(false);
                  resetVoiceRecording();
                }}
                className="text-gray-600 hover:text-gray-800"
                disabled={isUploading}
              >
                取消
              </button>
              <h3 className="text-lg font-semibold text-gray-900">錄製語音模型</h3>
              <button 
                onClick={uploadVoiceModel}
                disabled={!newVoiceName.trim() || !audioBlob || isUploading}
                className={`font-semibold ${
                  newVoiceName.trim() && audioBlob && !isUploading
                    ? `${AI_COLORS.text} hover:${AI_COLORS.textDark}`
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isUploading ? '上傳中...' : '保存'}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">語音模型名稱</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  placeholder="輸入語音模型名稱..."
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">建議朗讀文本</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">{readingText}</p>
                </div>
              </div>

              <div>
                {/* 標題和切換按鈕 */}
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-semibold text-gray-900">錄音控制</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setUploadMode('record');
                        setAudioBlob(null);
                        setUploadedFileName('');
                        setRecordingTime(0);
                        setUploadMessage('');
                      }}
                      disabled={isUploading || isRecording}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        uploadMode === 'record'
                          ? `${AI_COLORS.bgDark} text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${(isUploading || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Mic size={14} />
                        錄音
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setUploadMode('upload');
                        setAudioBlob(null);
                        setUploadedFileName('');
                        setRecordingTime(0);
                        setUploadMessage('');
                      }}
                      disabled={isUploading || isRecording}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        uploadMode === 'upload'
                          ? `${AI_COLORS.bgDark} text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${(isUploading || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Upload size={14} />
                        上傳檔案
                      </div>
                    </button>
                  </div>
                </div>

                {/* 錄音模式 */}
                {uploadMode === 'record' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : audioBlob ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-2xl font-bold text-gray-900">{formatTime(recordingTime)}</span>
                    </div>
                    
                    <div className="flex justify-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isUploading}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors ${
                          isRecording ? 'bg-red-500 hover:bg-red-600' : `${AI_COLORS.bgDark} hover:${AI_COLORS.bgHover}`
                        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isRecording ? (
                          <Square size={32} fill="currentColor" />
                        ) : (
                          <Mic size={32} />
                        )}
                      </button>
                    </div>

                    {audioBlob && !uploadedFileName && (
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle size={16} />
                        錄音完成 ({formatTime(recordingTime)})
                      </div>
                    )}
                  </div>
                )}

                {/* 上傳模式 */}
                {uploadMode === 'upload' && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${audioBlob && uploadedFileName ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-2xl font-bold text-gray-900">{formatTime(recordingTime)}</span>
                    </div>

                    <div className="flex justify-center">
                      <input
                        type="file"
                        id="audio-upload"
                        accept=".wav,.mp3,.webm,audio/wav,audio/wave,audio/x-wav,audio/webm,audio/mp3,audio/mpeg"
                        onChange={handleAudioFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                      <label
                        htmlFor="audio-upload"
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer ${
                          AI_COLORS.bgDark
                        } hover:${AI_COLORS.bgHover} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload size={32} />
                      </label>
                    </div>

                    {audioBlob && uploadedFileName && (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                          <CheckCircle size={16} />
                          已上傳: {uploadedFileName} ({formatTime(recordingTime)})
                        </div>
                        <button
                          onClick={() => {
                            setAudioBlob(null);
                            setUploadedFileName('');
                            setRecordingTime(0);
                            setUploadMessage('');
                          }}
                          disabled={isUploading}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          清除檔案
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {uploadMessage && (
                <div className={`p-4 rounded-xl text-center font-medium ${
                  uploadMessage.includes('成功') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : uploadMessage.includes('錯誤') || uploadMessage.includes('失敗')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : uploadMessage.includes('正在') || uploadMessage.includes('上傳中')
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`}>
                  <p>{uploadMessage}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={20} className="text-amber-600" />
                  <h4 className="font-semibold text-amber-800">使用小貼士</h4>
                </div>
                <div className="text-sm text-amber-700">
                  {uploadMode === 'record' ? (
                    <ul className="space-y-1">
                      <li>• 請在安靜的環境中錄音</li>
                      <li>• 保持與麥克風適當距離</li>
                      <li>• 語速適中，發音清晰</li>
                      <li>• 建議錄音時長 {getMinRecordingTime()}-{getMaxRecordingTime()} 秒</li>
                      <li>• 請完整朗讀建議文本</li>
                    </ul>
                  ) : (
                    <ul className="space-y-1">
                      <li>• 支援格式：WAV、MP3、WebM</li>
                      <li>• 檔案大小：最大 10MB</li>
                      <li>• 音頻時長：{getMinRecordingTime()}-{getMaxRecordingTime()} 秒</li>
                      <li>• 建議使用高品質音頻</li>
                      <li>• 內容應符合建議朗讀文本</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Model Selection Modal for Enhanced Mode */}
      {showVoiceModelSelection !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* 標題列 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">選擇語音模型</h3>
                <p className="text-sm text-gray-500 mt-1">為第 {showVoiceModelSelection} 人選擇語音</p>
              </div>
              <button
                onClick={() => setShowVoiceModelSelection(null)}
                className="text-gray-600 hover:text-gray-800 p-2"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* 預設語音模型 */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles size={20} className={ENHANCED_COLORS.text} />
                  預設語音模型
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {defaultVoiceModels.map((model) => {
                    const isSelected = selectedVoiceModels[showVoiceModelSelection] === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? `${ENHANCED_COLORS.border} ${ENHANCED_COLORS.bgLight} shadow-lg`
                            : `border-gray-200 ${ENHANCED_COLORS.hover.border} hover:shadow-md`
                        }`}
                        onClick={() => {
                          setSelectedVoiceModels({
                            ...selectedVoiceModels,
                            [showVoiceModelSelection]: model.id
                          });
                          setShowVoiceModelSelection(null); // 關閉彈窗
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          {model.avatar ? (
                            <img
                              src={model.avatar}
                              alt={model.name}
                              className="w-16 h-16 rounded-full mb-3 object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full mb-3 flex items-center justify-center">
                              <User size={32} className="text-gray-400" />
                            </div>
                          )}
                          <h4 className="font-semibold text-gray-900 mb-1">{model.name}</h4>
                          {model.description && (
                            <p className="text-xs text-gray-500 mb-2">{model.description}</p>
                          )}
                          {model.audioUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAudioPlay(model.id, model.audioUrl);
                              }}
                              className={`p-2 ${ENHANCED_COLORS.bgLighter} rounded-full transition-colors`}
                            >
                              {playingAudio === model.id ? (
                                <Pause size={18} className={ENHANCED_COLORS.text} />
                              ) : (
                                <Play size={18} className={ENHANCED_COLORS.text} />
                              )}
                            </button>
                          )}
                          {isSelected && (
                            <div className={`mt-2 px-2 py-1 ${ENHANCED_COLORS.statusSelected} text-xs rounded-full`}>
                              已選擇
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 我的語音模型 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mic size={20} className={ENHANCED_COLORS.text} />
                  我的語音模型
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {customVoiceModels.map((model) => {
                    const isSelected = selectedVoiceModels[showVoiceModelSelection] === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? `${ENHANCED_COLORS.border} ${ENHANCED_COLORS.bgLight} shadow-lg`
                            : `border-gray-200 ${ENHANCED_COLORS.hover.border} hover:shadow-md`
                        }`}
                        onClick={() => {
                          setSelectedVoiceModels({
                            ...selectedVoiceModels,
                            [showVoiceModelSelection]: model.id
                          });
                          setShowVoiceModelSelection(null); // 關閉彈窗
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-16 h-16 ${ENHANCED_COLORS.bg} rounded-full mb-3 flex items-center justify-center`}>
                            <Mic size={32} className={ENHANCED_COLORS.text} />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{model.name}</h4>
                          {model.audioUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleAudioPlay(model.id, model.audioUrl);
                              }}
                              className={`p-2 ${ENHANCED_COLORS.bgLighter} rounded-full transition-colors mt-2`}
                            >
                              {playingAudio === model.id ? (
                                <Pause size={18} className={ENHANCED_COLORS.text} />
                              ) : (
                                <Play size={18} className={ENHANCED_COLORS.text} />
                              )}
                            </button>
                          )}
                          {isSelected && (
                            <div className={`mt-2 px-2 py-1 ${ENHANCED_COLORS.statusSelected} text-xs rounded-full`}>
                              已選擇
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 新增語音模型按鈕 */}
                  <div
                    className={`p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer ${ENHANCED_COLORS.hover.border} ${ENHANCED_COLORS.hover.bg} transition-all`}
                    onClick={() => {
                      setShowVoiceModelSelection(null);
                      setShowVoiceRecording(true);
                    }}
                  >
                    <div className="flex flex-col items-center text-center justify-center h-full">
                      <div className={`w-16 h-16 ${ENHANCED_COLORS.bgLighter} rounded-full mb-3 flex items-center justify-center`}>
                        <Plus size={32} className={ENHANCED_COLORS.text} />
                      </div>
                      <h4 className={`font-semibold ${ENHANCED_COLORS.text}`}>新增語音</h4>
                      <p className="text-xs text-gray-500 mt-1">錄製或上傳</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAiAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button
                onClick={() => {
                  setShowAiAssistant(false);
                  setCopywritingMessage('');
                }}
                className="text-gray-600 hover:text-gray-800"
                disabled={isGeneratingCopywriting}
              >
                取消
              </button>
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-gray-900">AI文案助手</h3>
                {creationMode === 'enhanced' && (
                  <span className={`mt-1 px-2 py-0.5 ${ENHANCED_COLORS.gradient} text-white text-xs font-medium rounded-full`}>
                    擴增模式 · {speakerCount}人對話
                  </span>
                )}
              </div>
              <div className="w-12"></div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">1. 性別</label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'all', label: '不限' },
                    { key: 'male', label: '男性' },
                    { key: 'female', label: '女性' }
                  ].map(option => (
                    <button
                      key={option.key}
                      className={`p-3 border-2 rounded-xl text-center transition-colors ${
                        audienceProfile.gender === option.key
                          ? `${AI_COLORS.border} ${AI_COLORS.bgLight} ${AI_COLORS.text}`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                      onClick={() => setAudienceProfile(prev => ({ ...prev, gender: option.key as any }))}
                      disabled={isGeneratingCopywriting}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={18} className="text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">2. 年齡範圍</label>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-center mb-4">
                    <span className="text-lg font-semibold text-gray-900">
                      {audienceProfile.ageRange[0]} - {audienceProfile.ageRange[1]} 歲
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">最小年齡</label>
                      <input
                        type="range"
                        min="18"
                        max="65"
                        value={audienceProfile.ageRange[0]}
                        onChange={(e) => {
                          const newMinAge = parseInt(e.target.value);
                          setAudienceProfile(prev => ({ 
                            ...prev, 
                            ageRange: [newMinAge, Math.max(newMinAge, prev.ageRange[1])]
                          }));
                        }}
                        disabled={isGeneratingCopywriting}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="text-center text-xs text-purple-600 font-semibold mt-1">
                        {audienceProfile.ageRange[0]}歲
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">最大年齡</label>
                      <input
                        type="range"
                        min="18"
                        max="65"
                        value={audienceProfile.ageRange[1]}
                        onChange={(e) => {
                          const newMaxAge = parseInt(e.target.value);
                          setAudienceProfile(prev => ({ 
                            ...prev, 
                            ageRange: [Math.min(prev.ageRange[0], newMaxAge), newMaxAge]
                          }));
                        }}
                        disabled={isGeneratingCopywriting}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="text-center text-xs text-purple-600 font-semibold mt-1">
                        {audienceProfile.ageRange[1]}歲
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={18} className="text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">3. 受眾職業 *</label>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {professionOptions.map(profession => (
                      <button
                        key={profession}
                        className={`p-2 text-sm border-2 rounded-lg text-center transition-colors ${
                          audienceProfile.profession === profession
                            ? `${AI_COLORS.border} ${AI_COLORS.bgLight} ${AI_COLORS.text}`
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                        onClick={() => setAudienceProfile(prev => ({ ...prev, profession }))}
                        disabled={isGeneratingCopywriting}
                      >
                        {profession}
                      </button>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">或自訂職業</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ai-500 focus:border-transparent text-sm"
                      placeholder="輸入其他職業..."
                      value={audienceProfile.profession}
                      onChange={(e) => setAudienceProfile(prev => ({ ...prev, profession: e.target.value }))}
                      disabled={isGeneratingCopywriting}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={18} className="text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">4. 語調風格</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'professional', label: '專業', description: '正式、權威' },
                    { key: 'casual', label: '輕鬆', description: '親切、自然' },
                    { key: 'friendly', label: '友善', description: '溫暖、親近' },
                    { key: 'energetic', label: '活力', description: '動感、熱情' }
                  ].map(option => (
                    <button
                      key={option.key}
                      className={`p-3 border-2 rounded-xl text-center transition-colors ${
                        audienceProfile.tone === option.key
                          ? `${AI_COLORS.border} ${AI_COLORS.bgLight} ${AI_COLORS.text}`
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                      onClick={() => setAudienceProfile(prev => ({ ...prev, tone: option.key as any }))}
                      disabled={isGeneratingCopywriting}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs opacity-75">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={18} className="text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">5. 文案大綱 *</label>
                </div>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="請描述您希望生成的文案內容，例如：產品特色、目標受眾、主要賣點等..."
                  value={copywritingOutline}
                  onChange={(e) => setCopywritingOutline(e.target.value)}
                  disabled={isGeneratingCopywriting}
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-gray-600" />
                  <label className="block text-sm font-semibold text-gray-900">6. 時間長度</label>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">目標時長</span>
                    <span className="text-lg font-semibold text-purple-600">
                      {audienceProfile.duration >= 60
                        ? `${audienceProfile.duration / 60} 分鐘`
                        : `${audienceProfile.duration} 秒`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={DURATION_OPTIONS.indexOf(audienceProfile.duration)}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      setAudienceProfile(prev => ({ ...prev, duration: DURATION_OPTIONS[index] }));
                    }}
                    disabled={isGeneratingCopywriting}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>10秒</span>
                    <span>30秒</span>
                    <span>1分鐘</span>
                    <span>3分鐘</span>
                    <span>10分鐘</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    ⚠️ 實際時長會依據所選模型而有所誤差
                  </p>
                </div>
              </div>

              {copywritingMessage && (
                <div className={`p-4 rounded-xl text-center font-medium ${
                  copywritingMessage.includes('成功') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : copywritingMessage.includes('錯誤') || copywritingMessage.includes('失敗')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : copywritingMessage.includes('正在') || copywritingMessage.includes('生成中')
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`}>
                  <p>{copywritingMessage}</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="text-blue-600" />
                  <h4 className="font-semibold text-blue-800">生成要求</h4>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">設定目標受眾資訊，讓AI為您生成更精準的文案</p>
              </div>

              {/* 生成按鈕 */}
              <div className="pt-4">
                <button 
                  onClick={generateAiCopywriting}
                  disabled={isGeneratingCopywriting || !audienceProfile.profession.trim() || !copywritingOutline.trim()}
                  className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                    !isGeneratingCopywriting && audienceProfile.profession.trim() && copywritingOutline.trim()
                      ? `${AI_COLORS.button}`
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isGeneratingCopywriting ? '生成中...' : '生成文案'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成功模態框已移除 - 改為自動跳轉回音頻生成首頁 */}
    </div>
  );
};

export default AIAudio;
