import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Plus, Play, Download, Share2, ArrowLeft, ArrowRight, User, Sparkles, 
  Image as ImageIcon, Mic, Upload, Square, Pause, Volume2, VolumeX, Target, 
  FileText, Lightbulb, CheckCircle, XCircle, Loader2, AlertTriangle, Users, 
  BarChart3, Palette, FileVideo, FileAudio, Settings, Zap, Clock, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS, getSoundCloneList, createVideoGenerationWithImage, getVideoGenerationWithImageList, getAIModules, AIModuleConfig } from '../config/api';
import { AI_COLORS } from '../constants/colors';
import { trackVideoCreationStep } from '../services/usageTracking';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

interface VideoProject {
  id: string;
  title: string;
  duration: string;
  status: 'completed' | 'processing' | 'draft';
  thumbnail: string;
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

interface AudioRecord {
  id: number;
  title: string;
  textContent: string;
  audioUrl: string;
  duration: number;
  emotion: string;
  emotionPercentage: number;
  createdAt: string;
  status: 'completed' | 'processing' | 'failed';
}

interface SubtitleVideo {
  id: number;
  file_url: string;
  file_extension: string;
  created_at: string;
}

interface VideoGenerationRecord {
  id: number;
  label: string;
  prompt: string;
  parameters: {
    sec: number;
    token: number;
    aspect_ratios: string;
    video_quality: string;
  };
  created_at: string;
  is_completed: boolean;
  is_notified: boolean;
  generation_video_seconds: number;
  image_info: {
    id: number;
    image_url: string;
    file_extension: string;
    file_size?: number;
    created_at: string;
  };
  sound_model: {
    id: number;
    label: string;
    text_content: string;
    is_completed: boolean;
    generation_voice_seconds: number;
  };
  generation_video?: {
    id: number;
    file_url: string;
    file_extension: string;
    file_size: number;
    created_at: string;
  };
  status: string;
  use_dialogue?: boolean;
  srt_list?: SubtitleVideo[];
}

interface CreationStep {
  id: number;
  title: string;
  completed: boolean;
}

const VideoCreation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // 獲取當前用戶信息
  const { showSuccess, showError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<number>(user?.role === 'admin' ? 6 : 5); // Admin預設6，一般用戶預設5
  const [videoDescription, setVideoDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageRatio, setSelectedImageRatio] = useState<string>('');
  const [selectedVideoQuality, setSelectedVideoQuality] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<any>(null); // 存储完整的 branch 对象
  const [selectedVoiceModel, setSelectedVoiceModel] = useState<string>('');
  
  // 音頻記錄相關狀態
  const [audioRecords, setAudioRecords] = useState<AudioRecord[]>([]);
  const [isLoadingAudioRecords, setIsLoadingAudioRecords] = useState(false);
  const [selectedAudioRecord, setSelectedAudioRecord] = useState<AudioRecord | null>(null);
  
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

  // 媒體播放相關狀態
  const [playingAudio, setPlayingAudio] = useState<string>('');
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});

  // 模態框相關狀態
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{url: string, name: string} | null>(null);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [selectedSubtitleVideos, setSelectedSubtitleVideos] = useState<SubtitleVideo[]>([]);

  // 字幕合成相關狀態
  const [isBurningSubtitle, setIsBurningSubtitle] = useState<number | null>(null);
  
  // 影片生成相關狀態
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [isVideoSubmitted, setIsVideoSubmitted] = useState(false);
  
  // 影片生成記錄相關狀態
  const [videoRecords, setVideoRecords] = useState<VideoGenerationRecord[]>([]);
  const [isLoadingVideoRecords, setIsLoadingVideoRecords] = useState(false);
  const [showVideoRecords, setShowVideoRecords] = useState(false);

  // AI 模組配置相關狀態
  const [aiModuleConfig, setAiModuleConfig] = useState<AIModuleConfig | null>(null);
  const [availableS2VModels, setAvailableS2VModels] = useState<{ id: string; model: any }[]>([]);
  const [selectedS2VModel, setSelectedS2VModel] = useState<{ id: string; model: any } | null>(null);
  const [showModelSelection, setShowModelSelection] = useState(false);

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 當選擇模型時，如果只有一個品質選項，自動選擇
  useEffect(() => {
    if (selectedS2VModel?.model?.branch) {
      const branches = selectedS2VModel.model.branch;
      if (branches.length === 1) {
        setSelectedVideoQuality(branches[0].branch);
      }
    }
  }, [selectedS2VModel]);

  const steps: CreationStep[] = [
    { id: 1, title: '影片標題', completed: !!title && (!showModelSelection || !!selectedS2VModel) },
    { id: 2, title: '上傳圖片', completed: !!selectedImage && !!selectedImageRatio && !!selectedVideoQuality },
    { id: 3, title: '選擇音頻', completed: !!selectedAudioRecord },
    { id: 4, title: '影片情境描述', completed: !!videoDescription },
    { id: 5, title: '生成影片', completed: false },
  ];

  const readingText = "森林是我們人類賴以生存的珍貴自然資源,對於維持生態平衡具有重要意義。";

  // 載入 AI 模組配置
  const loadAIModuleConfig = async () => {
    try {
      const result = await getAIModules('s2v');
      console.log('AI 模組配置 (S2V):', result);
      
      if (result.success && result.data && result.data.modules.s2v) {
        setAiModuleConfig(result.data);
        
        // 提取可用的 S2V 模型
        const models: { id: string; model: any }[] = [];
        result.data.modules.s2v.forEach(item => {
          Object.entries(item).forEach(([id, model]: [string, any]) => {
            // 對 branch 按 token_per_unit 降序排序（token 大的排在上面）
            if (model.branch && Array.isArray(model.branch)) {
              model.branch.sort((a: any, b: any) => b.token_per_unit - a.token_per_unit);
            }
            models.push({ id, model });
          });
        });
        
        setAvailableS2VModels(models);
        
        // 如果有多個模型，顯示選擇界面
        if (models.length > 1) {
          setShowModelSelection(true);
        } else if (models.length === 1) {
          // 如果只有一個模型，自動選擇
          setSelectedS2VModel(models[0]);
          setShowModelSelection(false);
        }
      }
    } catch (error) {
      console.error('載入 AI 模組配置失敗:', error);
    }
  };

  // 輔助函數：獲取主要情緒
  const getPrimaryEmotion = (emotionData: any) => {
    if (!emotionData) return '平靜';
    
    const emotions = {
      '開心': emotionData.happy || 0,
      '憤怒': emotionData.angry || 0,
      '悲傷': emotionData.sad || 0,
      '害怕': emotionData.afraid || 0,
      '厭惡': emotionData.disgusted || 0,
      '憂鬱': emotionData.melancholic || 0,
      '驚訝': emotionData.surprised || 0,
      '平靜': emotionData.calm || 0
    };
    
    const maxEmotion = Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b);
    return maxEmotion[0];
  };

  // 輔助函數：獲取最大情緒百分比
  const getMaxEmotionPercentage = (emotionData: any) => {
    if (!emotionData) return 0;
    
    const values = Object.values(emotionData) as number[];
    const maxValue = Math.max(...values);
    
    // 如果數值已經大於 1，表示已經是百分比格式，直接返回
    // 如果數值小於等於 1，表示是小數格式，需要乘以 100
    return maxValue > 1 ? maxValue : maxValue * 100;
  };

  // 載入音頻記錄
  const loadAudioRecords = async () => {
    setIsLoadingAudioRecords(true);
    try {
      const result = await getSoundCloneList();
      console.log('音頻記錄API回應:', result);
      console.log('result.success:', result.success);
      console.log('result.data:', result.data);
      console.log('result.data.sound_clones:', result.data?.sound_clones);

      if (result.success && result.data) {
        // 檢查不同的數據結構可能性
        let soundClones = null;
        if (result.data.data && result.data.data.sound_clones) {
          // 雙重嵌套的情況：result.data.data.sound_clones
          soundClones = result.data.data.sound_clones;
        } else if (result.data.sound_clones) {
          // 單層嵌套的情況：result.data.sound_clones
          soundClones = result.data.sound_clones;
        } else if (Array.isArray(result.data)) {
          // 直接數組的情況
          soundClones = result.data;
        } else if (result.data.data && Array.isArray(result.data.data)) {
          // 雙重嵌套但直接是數組的情況
          soundClones = result.data.data;
        }

        console.log('soundClones:', soundClones);

        if (soundClones && soundClones.length > 0) {
          const records: AudioRecord[] = soundClones.map((record: any) => ({
            id: record.id,
            title: record.label || `音頻 ${record.id}`,
            textContent: record.text_content || '',
            audioUrl: record.generation_file?.file_url || '',
            duration: parseFloat(record.generation_voice_seconds) || 0,
            emotion: getPrimaryEmotion(record.emotion_data) || '平靜',
            emotionPercentage: getMaxEmotionPercentage(record.emotion_data) || 0,
            createdAt: record.created_at || '',
            status: record.is_completed ? 'completed' : 'processing'
          }));
          console.log('處理後的records:', records);
          setAudioRecords(records);
        } else {
          console.log('沒有找到音頻記錄數據');
          setAudioRecords([]);
        }
      } else {
        console.log('API 回應不成功或沒有數據');
        setAudioRecords([]);
      }
    } catch (error) {
      console.error('載入音頻記錄失敗:', error);
      setAudioRecords([]);
    } finally {
      setIsLoadingAudioRecords(false);
    }
  };

  // 載入影片生成記錄
  const loadVideoRecords = async () => {
    setIsLoadingVideoRecords(true);
    try {
      const result = await getVideoGenerationWithImageList();
      if (result.success && result.data && result.data.data && result.data.data.video_generations) {
        const records: VideoGenerationRecord[] = result.data.data.video_generations.map((record: any) => {
          return {
          id: record.id,
          label: record.label || `影片 ${record.id}`,
          prompt: record.prompt || '',
          parameters: record.parameters || {
            sec: 0,
            token: 0,
            aspect_ratios: '1:1',
            video_quality: '540p'
          },
          created_at: record.created_at || '',
          is_completed: record.is_completed || false,
          is_notified: record.is_notified || false,
          generation_video_seconds: record.generation_video_seconds || 0,
          image_info: record.image_info || {
            id: 0,
            image_url: '',
            file_extension: '',
            file_size: 0,
            created_at: ''
          },
          sound_model: record.sound_model || {
            id: 0,
            label: '',
            text_content: '',
            is_completed: false,
            generation_voice_seconds: 0
          },
          generation_video: record.generation_video,
          status: record.status || '等待中',
          use_dialogue: record.use_dialogue,
          srt_list: record.srt_list || []
        };
        });
        setVideoRecords(records);
      } else {
        setVideoRecords([]);
      }
    } catch (error) {
      console.error('載入影片生成記錄失敗:', error);
      setVideoRecords([]);
    } finally {
      setIsLoadingVideoRecords(false);
    }
  };

  // 字幕合成功能
  const handleSubtitleBurn = async (videoId: number) => {
    setIsBurningSubtitle(videoId);
    try {
      const response = await api.post(API_ENDPOINTS.SUBTITLE_BURN(videoId));
      const result = response.data;

      if (result.success) {
        showSuccess('字幕合成請求已送出', '處理完成後會自動更新');
        // 重新載入影片列表以獲取最新狀態
        await loadVideoRecords();
      } else {
        showError('字幕合成失敗', result.error || result.message || '未知錯誤');
      }
    } catch (error: any) {
      console.error('字幕合成失敗:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || '網路錯誤';
      showError('字幕合成失敗', errorMessage);
    } finally {
      setIsBurningSubtitle(null);
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
      await trackVideoCreationStep(nextStep);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 圖片上傳處理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案');
        return;
      }
      
      // 檢查文件大小 (限制為 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('圖片檔案大小不能超過 10MB');
        return;
      }
      
      // 檢查是否已選擇比例和品質
      if (!selectedImageRatio) {
        alert('請先選擇圖片比例');
        return;
      }
      
      if (!selectedVideoQuality) {
        alert('請先選擇影片品質');
        return;
      }
      
      setSelectedImage(file);
      
      // 創建預覽
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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

    if (recordingTime > 10) {
      setUploadMessage('❌ 錄音時間太長，請錄製最多10秒');
      return;
    }

    setIsUploading(true);
    setUploadMessage('🔄 正在上傳語音模型...');

    try {
      const formData = new FormData();
      formData.append('wav_file', audioBlob, `${newVoiceName}.webm`);
      formData.append('model_note', newVoiceName);
      formData.append('model_text', readingText);

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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 計算 token 數量（使用後端配置）
  const calculateTokens = (duration: number, quality: string) => {
    if (!selectedS2VModel) {
      // 如果沒有選擇模型，使用預設值
      const seconds = Math.ceil(duration);
      return quality === '720p' ? seconds * 60 : seconds * 30;
    }
    
    // 從選擇的模型中找到對應品質的 branch
    const branch = selectedS2VModel.model.branch.find((b: any) => b.branch === quality);
    if (!branch) {
      // 如果找不到對應品質，使用預設值
      const seconds = Math.ceil(duration);
      return quality === '720p' ? seconds * 60 : seconds * 30;
    }
    
    const seconds = Math.ceil(duration);
    const units = Math.ceil(seconds / branch.per_unit);
    return units * branch.token_per_unit;
  };

  // 切割圖片函數
  const cropImageToRatio = (file: File, ratio: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        let cropWidth = width;
        let cropHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        
        // 根據比例計算裁剪尺寸
        switch (ratio) {
          case '1:1':
            if (width > height) {
              cropWidth = height;
              offsetX = (width - height) / 2;
            } else {
              cropHeight = width;
              offsetY = (height - width) / 2;
            }
            break;
          case '16:9':
            const targetRatio = 16 / 9;
            const currentRatio = width / height;
            if (currentRatio > targetRatio) {
              cropWidth = height * targetRatio;
              offsetX = (width - cropWidth) / 2;
            } else {
              cropHeight = width / targetRatio;
              offsetY = (height - cropHeight) / 2;
            }
            break;
          case '9:16':
            const targetRatio916 = 9 / 16;
            const currentRatio916 = width / height;
            if (currentRatio916 > targetRatio916) {
              cropWidth = height * targetRatio916;
              offsetX = (width - cropWidth) / 2;
            } else {
              cropHeight = width / targetRatio916;
              offsetY = (height - cropHeight) / 2;
            }
            break;
        }
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx?.drawImage(
          img,
          offsetX, offsetY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, { type: file.type });
            resolve(croppedFile);
          } else {
            reject(new Error('圖片切割失敗'));
          }
        }, file.type, 0.9);
      };
      
      img.onerror = () => reject(new Error('圖片載入失敗'));
      img.src = URL.createObjectURL(file);
    });
  };

  // 影片生成函數
  const generateVideo = async () => {
    if (!selectedImage || !selectedAudioRecord || !title || !videoDescription) {
      setGenerationMessage('❌ 請完成所有必要步驟');
      return;
    }

    setIsGeneratingVideo(true);
    setGenerationMessage('🔄 正在處理圖片並生成影片，請稍候...');

    try {
      // 切割圖片
      setGenerationMessage('🔄 正在切割圖片...');
      const croppedImage = await cropImageToRatio(selectedImage, selectedImageRatio);
      
      const formData = new FormData();
      
      // 添加切割後的圖片
      formData.append('image', croppedImage);
      
      // 添加聲音模型ID
      formData.append('sound_model_id', selectedAudioRecord.id.toString());
      
      // 添加標籤（使用影片標題）
      formData.append('label', title);
      
      // 添加提示文字（使用情境描述）
      formData.append('prompt', videoDescription);
      
      // 計算參數
      const duration = selectedAudioRecord.duration;
      const tokens = calculateTokens(duration, selectedVideoQuality);
      
      // 添加額外參數（新格式）
      const parameters = {
        sec: duration,
        token: tokens,
        aspect_ratios: selectedImageRatio,
        video_quality: selectedBranch?.resolution || selectedVideoQuality // 使用 resolution 而不是 branch 名称
      };
      formData.append('parameters', JSON.stringify(parameters));
      
      // 優先級作為獨立欄位，與 parameters 同一層
      formData.append('priority', priority.toString());

      setGenerationMessage('🔄 正在提交影片生成需求...');
      
      // 設置為送出中狀態
      setIsGeneratingVideo(true);
      setGenerationMessage('🔄 正在送出...');
      
      let hasError = false;
      let errorMessage = '';
      
      // 獲取 model_pk 和 model_sub_pk
      const modelPk = selectedS2VModel?.id || 'default';
      const modelSubPk = selectedBranch?.pk || 1;
      
      console.log('影片生成參數:', {
        modelPk,
        modelSubPk,
        selectedVideoQuality,
        selectedBranch,
        parameters
      });
      
      // 異步提交，等待結果
      createVideoGenerationWithImage(formData, modelPk, modelSubPk)
        .then(result => {
          if (result.success) {
            console.log('影片生成成功:', result.data);
            console.log('生成參數:', parameters);
          } else {
            hasError = true;
            errorMessage = result.error || '送出失敗';
          }
        })
        .catch(error => {
          hasError = true;
          errorMessage = `送出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`;
          console.error('影片生成失敗:', error);
        });
      
      // 等待5秒後處理結果
      setTimeout(() => {
        if (hasError) {
          setGenerationMessage(`❌ ${errorMessage}`);
          setIsGeneratingVideo(false);
        } else {
          setGenerationMessage('✅ 已送出');
          setIsVideoSubmitted(true);
          setIsGeneratingVideo(false);
          
            // 再等待2秒後重置狀態並回到第一頁
            setTimeout(() => {
              setGenerationMessage('');
              setIsVideoSubmitted(false);
              setCurrentStep(1);
              setTitle('');
              setPriority(user?.role === 'admin' ? 6 : 5); // Admin重置為6，一般用戶重置為5
              setVideoDescription('');
              setSelectedImage(null);
              setSelectedAudioRecord(null);
              setSelectedImageRatio('');
              setSelectedVideoQuality('');
              setImagePreview('');
              
              console.log('狀態重置完成，currentStep 設為 1');
            
            // 只有在記錄列表已經打開時才刷新
            if (showVideoRecords) {
              loadVideoRecords();
            }
          }, 2000);
        }
      }, 5000);
    } catch (error) {
      console.error('影片生成失敗:', error);
      setGenerationMessage(`❌ 影片生成失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
      setIsGeneratingVideo(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">設定影片標題</h3>
            <p className="text-gray-600 mb-6">為您的影片設定一個吸引人的標題</p>
            
            <div className="space-y-6">
              {/* 影片標題 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">影片標題 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  placeholder="輸入吸引人的影片標題..."
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

              {/* AI 模型選擇（如果有多個模型） */}
              {showModelSelection && availableS2VModels.length > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">選擇 AI 模型 *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableS2VModels.map(({ id, model }) => (
                      <div
                        key={id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedS2VModel?.id === id
                            ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedS2VModel({ id, model })}
                      >
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">{model.name}</h4>
                          <div className="space-y-2">
                            {model.branch.map((branch: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-700">{branch.branch}</span>
                                  <span className="text-blue-600 font-semibold">
                                    {branch.token_per_unit} token/秒
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  每 {branch.per_unit} 秒消耗 {branch.token_per_unit} token
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">上傳圖片</h3>
            <p className="text-gray-600 mb-6">選擇一張圖片作為影片的主要視覺內容</p>
            
            {/* 影片品質選擇 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">選擇影片品質 *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedS2VModel?.model.branch.map((branch: any) => (
                  <div
                    key={branch.branch}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      selectedVideoQuality === branch.branch
                        ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedVideoQuality(branch.branch);
                      setSelectedBranch(branch);
                    }}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        selectedVideoQuality === branch.branch ? AI_COLORS.bg : 'bg-gray-200'
                      }`}>
                        <Video size={24} className={selectedVideoQuality === branch.branch ? AI_COLORS.text : 'text-gray-500'} />
                      </div>
                      <h4 className="font-semibold text-gray-900">{branch.branch}</h4>
                      <p className="text-sm text-gray-600">
                        標準品質: {branch.resolution || 'N/A'}
                      </p>
                      {branch.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {branch.description}
                        </p>
                      )}
                      <p className="text-xs font-medium text-blue-600 mt-2">
                        {branch.token_per_unit} token/秒
                      </p>
                    </div>
                  </div>
                )) || (
                  // 如果沒有選擇模型，顯示預設選項
                  <>
                    {[
                      { value: '540p', label: '540p', resolution: '540p', description: '', tokenRate: 30, pk: 1, per_unit: 1, token_per_unit: 50, branch: '540p' },
                      { value: '720p', label: '720p', resolution: '720p', description: '', tokenRate: 60, pk: 4, per_unit: 1, token_per_unit: 100, branch: '720p' }
                    ].map((quality) => (
                      <div
                        key={quality.value}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedVideoQuality === quality.value
                            ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          setSelectedVideoQuality(quality.value);
                          setSelectedBranch(quality);
                        }}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            selectedVideoQuality === quality.value ? AI_COLORS.bg : 'bg-gray-200'
                          }`}>
                            <Video size={24} className={selectedVideoQuality === quality.value ? AI_COLORS.text : 'text-gray-500'} />
                          </div>
                          <h4 className="font-semibold text-gray-900">{quality.label}</h4>
                          <p className="text-sm text-gray-600">標準品質: {quality.resolution}</p>
                          {quality.description && (
                            <p className="text-xs text-gray-500 mt-1">{quality.description}</p>
                          )}
                          <p className="text-xs font-medium text-blue-600 mt-2">
                            {quality.tokenRate} token/秒
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
            
            {/* 圖片比例選擇 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">選擇圖片比例 *</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '1:1', label: '1:1', description: '正方形' },
                  { value: '16:9', label: '16:9', description: '橫向長方形' },
                  { value: '9:16', label: '9:16', description: '直向長方形' }
                ].map((ratio) => (
                  <div
                    key={ratio.value}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      selectedImageRatio === ratio.value
                        ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImageRatio(ratio.value)}
                  >
                    <div className="text-center">
                      {/* 圖示顯示比例形狀 */}
                      <div className="flex items-center justify-center mb-3" style={{ height: '48px' }}>
                        {ratio.value === '1:1' && (
                          <div className={`w-10 h-10 rounded border-2 ${
                            selectedImageRatio === ratio.value 
                              ? `${AI_COLORS.border} ${AI_COLORS.bg}` 
                              : 'border-gray-400 bg-gray-200'
                          }`} />
                        )}
                        {ratio.value === '16:9' && (
                          <div className={`w-12 h-7 rounded border-2 ${
                            selectedImageRatio === ratio.value 
                              ? `${AI_COLORS.border} ${AI_COLORS.bg}` 
                              : 'border-gray-400 bg-gray-200'
                          }`} />
                        )}
                        {ratio.value === '9:16' && (
                          <div className={`w-7 h-12 rounded border-2 ${
                            selectedImageRatio === ratio.value 
                              ? `${AI_COLORS.border} ${AI_COLORS.bg}` 
                              : 'border-gray-400 bg-gray-200'
                          }`} />
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900">{ratio.label}</h4>
                      <p className="text-sm text-gray-600">{ratio.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">選擇圖片 *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {!selectedImage ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    (selectedImageRatio && selectedVideoQuality)
                      ? 'border-gray-300 hover:border-gray-400 cursor-pointer' 
                      : 'border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                  onClick={() => (selectedImageRatio && selectedVideoQuality) && fileInputRef.current?.click()}
                >
                  <Camera size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {(selectedImageRatio && selectedVideoQuality) ? '點擊上傳圖片' : '請先選擇圖片比例和影片品質'}
                  </h4>
                  <p className="text-gray-600 mb-4">支援 JPG、PNG、GIF 格式，最大 10MB</p>
                  {(selectedImageRatio && selectedVideoQuality) && (
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      選擇檔案
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="預覽"
                      className={`w-full object-cover rounded-xl border-4 border-blue-500 shadow-lg ${
                        selectedImageRatio === '1:1' ? 'aspect-square max-w-md mx-auto' :
                        selectedImageRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16] max-w-sm mx-auto'
                      }`}
                    />
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedImage.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-gray-500">比例: {selectedImageRatio}</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      重新選擇
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">選擇音頻</h3>
            <p className="text-gray-600 mb-6">選擇已生成的音頻記錄或建立新的音頻</p>
            
            {/* 音頻記錄列表 */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">我的音頻創作記錄</h4>
              {isLoadingAudioRecords ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">載入中...</span>
                </div>
              ) : audioRecords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audioRecords
                    .filter(record => record.status === 'completed')
                    .map(renderAudioRecordCard)}
                </div>
              ) : audioRecords.filter(record => record.status === 'completed').length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileAudio size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>尚無已完成的音頻記錄</p>
                  <p className="text-sm">請先完成音頻創作，再進行影片製作</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileAudio size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>尚無音頻記錄</p>
                  <p className="text-sm">請先建立音頻記錄</p>
                </div>
              )}
            </div>

            {/* 建立新音頻按鈕 */}
            <div className="text-center">
              <button
                onClick={() => navigate('/provider/creator/audio')}
                className={`inline-flex items-center gap-2 px-6 py-3 ${AI_COLORS.button} rounded-xl font-semibold transition-colors`}
              >
                <Plus size={20} />
                建立新音頻
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">影片情境描述</h3>
            <p className="text-gray-600 mb-6">描述影片的情境、氛圍或想要傳達的訊息</p>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">影片情境描述 *</label>
              
              {/* 快速選擇選項 */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">快速選擇情境：</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    '溫馨日常對話',
                    '專業知識分享',
                    '激勵鼓舞氛圍',
                    '自然演說情境',
                    '溫暖療癒感受',
                    '平靜舒緩氛圍'
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setVideoDescription(preset)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        videoDescription === preset
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent resize-none"
                rows={6}
                placeholder="描述影片的情境、氛圍或想要傳達的訊息..."
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">建議 50-200 字，幫助 AI 更好地理解您的需求</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">生成影片</h3>
            <p className="text-gray-600 mb-6">確認您的選擇並開始生成影片</p>
            
            {/* 選擇內容預覽 */}
            <div className="space-y-6 mb-8">
              {/* 項目標題和描述 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">影片標題</h4>
                </div>
                <p className="text-gray-700">{title || '未設定'}</p>
              </div>

              {/* 影片情境描述 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">影片情境描述</h4>
                </div>
                <p className="text-gray-700">{videoDescription || '未設定'}</p>
              </div>

              {/* 影片品質 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Video size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">影片品質</h4>
                </div>
                <p className="text-gray-700">{selectedVideoQuality || '未設定'}</p>
              </div>

              {/* 圖片預覽 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">圖片內容</h4>
                </div>
                {selectedImage ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="預覽"
                      className={`object-cover rounded-lg border-4 border-blue-500 shadow-lg ${
                        selectedImageRatio === '1:1' ? 'w-20 h-20' :
                        selectedImageRatio === '16:9' ? 'w-32 h-18' : 'w-18 h-32'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{selectedImage.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-gray-500">比例: {selectedImageRatio}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">未選擇圖片</p>
                )}
              </div>

              {/* 音頻記錄 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileAudio size={20} className={AI_COLORS.text} />
                  <h4 className="font-semibold text-gray-900">選擇的音頻</h4>
                </div>
                {selectedAudioRecord ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        <FileAudio size={24} className={AI_COLORS.text} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{selectedAudioRecord.title}</p>
                        <p className="text-sm text-gray-600">時長: {selectedAudioRecord.duration.toFixed(2)}秒</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{selectedAudioRecord.textContent}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>情緒: {selectedAudioRecord.emotion} ({selectedAudioRecord.emotionPercentage}%)</span>
                      <span>建立時間: {new Date(selectedAudioRecord.createdAt).toLocaleDateString('zh-TW')}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">未選擇音頻</p>
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

              {/* Token 消耗預估 */}
              {selectedAudioRecord && selectedVideoQuality && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={20} className="text-blue-600" />
                    <h4 className="font-semibold text-blue-800">Token 消耗預估</h4>
                  </div>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>影片時長：{selectedAudioRecord.duration.toFixed(2)} 秒</p>
                    <p>影片品質：{selectedVideoQuality}</p>
                    <p className="font-bold text-lg">
                      預計消耗：{calculateTokens(selectedAudioRecord.duration, selectedVideoQuality)} token
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 生成按鈕 */}
            <div className="text-center">
              <button 
                className={`inline-flex items-center gap-3 px-8 py-4 ${AI_COLORS.button} rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={isVideoSubmitted ? () => {
                  // 返回查看進度 - 滾動到影片記錄區域
                  const recordsSection = document.querySelector('[data-section="video-records"]');
                  if (recordsSection) {
                    recordsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                } : generateVideo}
                disabled={isGeneratingVideo}
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    生成中...
                  </>
                ) : isVideoSubmitted ? (
                  <>
                    <Video size={24} />
                    返回查看進度
                  </>
                ) : (
                  <>
                    <Video size={24} />
                    開始生成影片
                  </>
                )}
              </button>
              
              {generationMessage && (
                <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
                  generationMessage.includes('成功') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : generationMessage.includes('失敗') || generationMessage.includes('錯誤')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : generationMessage.includes('正在') || generationMessage.includes('生成中')
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`}>
                  <p>{generationMessage}</p>
                  {generationMessage.includes('成功') && !isGeneratingVideo && (
                    <button
                      onClick={() => {
                        setGenerationMessage('');
                        setCurrentStep(1);
                        setTitle('');
                        setVideoDescription('');
                        setSelectedImage(null);
                        setSelectedAudioRecord(null);
                        setSelectedImageRatio('1:1');
                        setSelectedVideoQuality('540p');
                      }}
                      className="mt-2 px-4 py-2 bg-ai-500 text-white rounded-lg hover:bg-ai-600 transition-colors"
                    >
                      重新開始
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAudioRecordCard = (record: AudioRecord) => {
    const isTooShort = record.duration < 5;
    const isDisabled = record.status !== 'completed' || isTooShort;
    
    return (
      <div
        key={record.id}
        className={`relative p-4 rounded-xl transition-all duration-200 ${
          isDisabled
            ? 'border-2 border-gray-200 opacity-50 cursor-not-allowed'
            : selectedAudioRecord?.id === record.id
            ? `border-4 ${AI_COLORS.border} ${AI_COLORS.bgLight} shadow-lg cursor-pointer`
            : 'border-2 border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
        }`}
        onClick={() => {
          if (record.status !== 'completed') {
            return;
          }
          if (isTooShort) {
            alert('⚠️ 音頻時長不足\n\n此音頻時長低於 5 秒，無法用於影片創作。\n請選擇時長至少 5 秒的音頻。');
            return;
          }
          setSelectedAudioRecord(record);
        }}
      >
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{record.title}</h4>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            record.status === 'completed' 
              ? 'bg-green-100 text-green-700'
              : record.status === 'processing'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {record.status === 'completed' ? '已完成' : 
             record.status === 'processing' ? '處理中' : '失敗'}
          </div>
        </div>
        
        <div className="flex flex-col space-y-1 mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 min-h-[16px]">
            <span>建立時間: {new Date(record.createdAt).toLocaleDateString('zh-TW')}</span>
            <span>時長: {record.duration.toFixed(2)}秒</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 min-h-[16px]">
            <span>主要情緒: {record.emotion} ({record.emotionPercentage}%)</span>
            <span></span>
          </div>
        </div>
        
        {record.audioUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleAudioPlay(`audio-${record.id}`, record.audioUrl);
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              playingAudio === `audio-${record.id}`
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : `${AI_COLORS.bg} ${AI_COLORS.text} hover:${AI_COLORS.bgHover}`
            }`}
          >
            {playingAudio === `audio-${record.id}` ? (
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
        
        {/* 時長不足警告 */}
        {isTooShort && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                時長不足 5 秒，無法用於影片創作
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    );
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
        <h4 className={`font-semibold ${AI_COLORS.text} mb-1`}>新增語音模型</h4>
        <p className="text-sm text-gray-600">錄製專屬語音</p>
      </div>
    </div>
  );

  const renderVideoRecordCard = (record: VideoGenerationRecord) => (
    <div
      key={record.id}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => {
        if (record.generation_video) {
          setDownloadInfo({
            url: record.generation_video.file_url,
            name: `${record.label}.${record.generation_video.file_extension}`
          });
          setShowDownloadModal(true);
        }
      }}
    >
      {/* 左右佈局 */}
      <div className="flex gap-4">
        {/* 左側：影片縮圖 */}
        <div className="relative w-32 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {record.image_info?.image_url ? (
            <img
              src={record.image_info.image_url}
              alt={record.label}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Video size={32} className="text-gray-400" />
            </div>
          )}

          {/* 播放按鈕覆蓋層 */}
          {record.generation_video && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
              <div className="bg-white bg-opacity-90 rounded-full p-2">
                <Play size={20} className="text-gray-800" />
              </div>
            </div>
          )}
        </div>

        {/* 右側：資訊 */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* 上方：標題 */}
          <div>
            <div className="pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-900 text-base truncate">{record.label}</h4>
            </div>

            {/* 分隔線下方：狀態 + 字幕按鈕 */}
            <div className="pt-2 flex items-center justify-between gap-2">
              {/* 左側：狀態指示燈 + 文字 */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  record.is_completed
                    ? 'bg-green-500'
                    : record.status === '生成中'
                    ? 'bg-yellow-500 animate-pulse'
                    : record.status === '隊列中'
                    ? 'bg-orange-500'
                    : 'bg-gray-400'
                }`} />
                <span className={`text-xs font-medium ${
                  record.is_completed
                    ? 'text-green-700'
                    : record.status === '生成中'
                    ? 'text-yellow-700'
                    : record.status === '隊列中'
                    ? 'text-orange-700'
                    : 'text-gray-700'
                }`}>
                  {record.is_completed ? '已完成' : record.status}
                </span>
              </div>

              {/* 右側：字幕功能按鈕 */}
              {record.use_dialogue && record.is_completed && (
                <div>
                  {record.srt_list && record.srt_list.length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubtitleVideos(record.srt_list || []);
                        setShowSubtitleModal(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-medium"
                    >
                      <FileText size={12} />
                      字幕影片
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubtitleBurn(record.id);
                      }}
                      disabled={isBurningSubtitle === record.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors text-xs font-medium ${
                        isBurningSubtitle === record.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {isBurningSubtitle === record.id ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          合成中...
                        </>
                      ) : (
                        <>
                          <FileText size={12} />
                          字幕合成
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 下方：詳細資訊 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">比例: {record.parameters.aspect_ratios}</span>
            </div>
            <div className="flex items-center gap-2">
              <Video size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">品質: {record.parameters.video_quality}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">時長: {record.parameters.sec}秒</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">Token: {record.parameters.token}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">建立時間: {new Date(record.created_at).toLocaleDateString('zh-TW')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 添加防重複調用標記
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 防止在React.StrictMode下重複調用
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    loadAudioRecords();
    // 移除自動載入影片記錄，改為用戶點擊時才載入
    // loadVideoRecords();
    // 移除不必要的語音模型載入，影片生成不需要語音模型
    // loadVoiceModels();
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
        <div className="flex items-center justify-between">
          {currentStep > 1 && !isGeneratingVideo && (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={20} />
              上一步
            </button>
          )}
          
          <div className="flex-1" />
          
          {currentStep < 5 && !isGeneratingVideo && (
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

      {/* 影片生成記錄區域 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm" data-section="video-records">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">我的影片創作記錄</h3>
          <div className="flex items-center gap-3">
            {showVideoRecords && (
              <button
                onClick={loadVideoRecords}
                disabled={isLoadingVideoRecords}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                <Loader2 size={16} className={isLoadingVideoRecords ? 'animate-spin' : ''} />
                重新整理
              </button>
            )}
            <button
              onClick={() => {
                setShowVideoRecords(!showVideoRecords);
                if (!showVideoRecords && videoRecords.length === 0) {
                  loadVideoRecords();
                }
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {showVideoRecords ? '隱藏記錄' : '查看記錄'}
            </button>
          </div>
        </div>
        
        {showVideoRecords && (
          <div>
            {isLoadingVideoRecords ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={32} className="animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">載入中...</span>
              </div>
            ) : videoRecords.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {videoRecords.map(renderVideoRecordCard)}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Video size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">尚無影片創作記錄</p>
                <p className="text-sm">開始創作您的第一個AI影片吧！</p>
              </div>
            )}
          </div>
        )}
        
        {/* 底部間距 */}
        <div className="h-8"></div>
        </div>
      </div>

      {/* Video Playback Modal */}
      {showDownloadModal && downloadInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">影片播放</h3>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  src={downloadInfo.url}
                  controls
                  className="w-full h-full"
                  preload="metadata"
                >
                  您的瀏覽器不支援影片播放
                </video>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{downloadInfo.name}</h4>
                  <p className="text-sm text-gray-600">點擊下載按鈕保存到本地</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(downloadInfo.url);
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = downloadInfo.name;
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
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download size={16} />
                  下載影片
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtitle Videos Modal */}
      {showSubtitleModal && selectedSubtitleVideos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">字幕影片列表</h3>
              <button
                onClick={() => {
                  setShowSubtitleModal(false);
                  setSelectedSubtitleVideos([]);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSubtitleVideos.map((subtitleVideo, index) => (
                  <div
                    key={subtitleVideo.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          字幕影片 #{index + 1}
                        </h4>
                        <p className="text-xs text-gray-500">
                          建立時間: {new Date(subtitleVideo.created_at).toLocaleString('zh-TW')}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {subtitleVideo.file_extension.toUpperCase()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setDownloadInfo({
                          url: subtitleVideo.file_url,
                          name: `subtitle_video_${index + 1}.${subtitleVideo.file_extension}`
                        });
                        setShowSubtitleModal(false);
                        setShowDownloadModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Play size={16} />
                      播放影片
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-sm font-semibold text-gray-900 mb-4">錄音控制</label>
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

                  {audioBlob && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                      <CheckCircle size={16} />
                      錄音完成 ({formatTime(recordingTime)})
                    </div>
                  )}
                </div>
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
                  <h4 className="font-semibold text-amber-800">錄音小貼士</h4>
                </div>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• 請在安靜的環境中錄音</li>
                  <li>• 保持與麥克風適當距離</li>
                  <li>• 語速適中，發音清晰</li>
                  <li>• 建議錄音時長最多10秒</li>
                  <li>• 請完整朗讀建議文本</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCreation;
