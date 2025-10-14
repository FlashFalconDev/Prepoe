import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, Plus, Play, Download, Share2, ArrowLeft, ArrowRight, User, Sparkles, Film, 
  Image as ImageIcon, Mic, Upload, Square, Pause, Volume2, VolumeX, Target, 
  FileText, Lightbulb, CheckCircle, XCircle, Loader2, AlertTriangle, Users, 
  BarChart3, Palette, FileVideo, FileAudio, Settings, Zap, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, API_ENDPOINTS, createVideoGeneration } from '../config/api';
import { AI_COLORS } from '../constants/colors';

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

interface VideoModel {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  isCustom: boolean;
  videoUrl?: string;
  pk?: number;
}

interface Material {
  id: string;
  name: string;
  type: 'image' | 'video';
  thumbnail: string;
  isCustom: boolean;
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
}

const AIVideo: React.FC = () => {
  const navigate = useNavigate();
  
  // 添加調試信息
  console.log('AIVideo 頁面載入中...');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedVoiceModel, setSelectedVoiceModel] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [copywritingContent, setCopywritingContent] = useState('');
  
  // 模型自建相關狀態
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [newVoiceName, setNewVoiceName] = useState('');
  const [customVoiceModels, setCustomVoiceModels] = useState<VoiceModel[]>([]);
  const [defaultVoiceModels, setDefaultVoiceModels] = useState<VoiceModel[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  
  // 影片模型相關狀態
  const [customVideoModels, setCustomVideoModels] = useState<VideoModel[]>([]);
  const [defaultVideoModels, setDefaultVideoModels] = useState<VideoModel[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  
  // 素材自建相關狀態
  const [showMaterialUpload, setShowMaterialUpload] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [customMaterials, setCustomMaterials] = useState<Material[]>([]);
  
  // 视频上传相关状态
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadMessage, setVideoUploadMessage] = useState('');
  
  // AI文案助手相關狀態
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [audienceProfile, setAudienceProfile] = useState<AudienceProfile>({
    gender: 'all',
    ageRange: [25, 35],
    profession: '',
    tone: 'professional'
  });
  const [copywritingOutline, setCopywritingOutline] = useState('');
  const [isGeneratingCopywriting, setIsGeneratingCopywriting] = useState(false);
  const [copywritingMessage, setCopywritingMessage] = useState('');

  // 媒體播放相關狀態
  const [playingAudio, setPlayingAudio] = useState<string>('');
  const [playingVideo, setPlayingVideo] = useState<string>('');
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});
  const [videoElements, setVideoElements] = useState<{[key: string]: HTMLVideoElement}>({});

  // 模態框相關狀態
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{url: string, name: string} | null>(null);

  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 預設職業選項（簡化為六大類）
  const professionOptions = [
    '學生',
    '上班族',
    '家庭主婦',
    '創業者',
    '服務業',
    '退休人士',
  ];

  const steps: CreationStep[] = [
    { id: 1, title: '基本資訊', completed: !!title },
    { id: 2, title: '語音模型', completed: !!selectedVoiceModel },
    { id: 3, title: '影像素材', completed: !!selectedMaterial },
    { id: 4, title: '文案編輯', completed: !!copywritingContent && copywritingContent.length <= 250 },
    { id: 5, title: 'AI生成', completed: false },
  ];

  const videoProjects: VideoProject[] = [
    {
      id: '1',
      title: '產品介紹影片',
      duration: '2:34',
      status: 'completed',
      thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: '公司簡介短片',
      duration: '1:45',
      status: 'processing',
      thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
      createdAt: '2024-01-14',
    },
  ];

  const readingText = "森林是我們人類賴以生存的珍貴自然資源,對於維持生態平衡具有重要意義。";

  // 🎯 載入語音模型
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
          // description: '自訂語音模型',
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

  // 🎬 載入影片模型
  const loadVideoModels = async () => {
    setIsLoadingVideos(true);
    try {
      const proxyUrl = API_ENDPOINTS.VIDEO_MODEL_LIST;
      const response = await api.get(proxyUrl);
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = response.data;
      console.log('影片模型API回應:', result);

      if (result.success && result.data) {
        // 處理自訂影片模型
        const customModels: VideoModel[] = await Promise.all(
          result.data.video_models.map(async (model: any) => {
            let thumbnailUrl = model.thumbnail_url || 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2';
            
            // 如果没有缩略图但有视频URL，尝试生成缩略图
            // if (!model.thumbnail_url && model.video_model_url) {
            //   try {
            //     const generatedThumbnail = await generateVideoThumbnail(model.video_model_url);
            //     thumbnailUrl = generatedThumbnail;
            //     console.log(`为视频模型 ${model.video_model_label} 生成缩略图成功`);
            //   } catch (error) {
            //     console.warn(`为视频模型 ${model.video_model_label} 生成缩略图失败:`, error);
            //   }
            // }
            
            return {
              id: `custom-video-${model.video_model_pk}`,
              name: model.video_model_label,
              description: model.info.replace(':', ' ྾ '),
              thumbnail: thumbnailUrl,
              isCustom: true,
              videoUrl: model.video_model_url,
              pk: model.video_model_pk,
            };
          })
        );

        // 處理預設影片模型
        const defaultModels: VideoModel[] = await Promise.all(
          result.data.defult_video_model.map(async (model: any) => {
            let thumbnailUrl = model.thumbnail_url || 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2';
            
            // 如果没有缩略图但有视频URL，尝试生成缩略图
            // if (!model.thumbnail_url && model.video_model_url) {
            //   try {
            //     const generatedThumbnail = await generateVideoThumbnail(model.video_model_url);
            //     thumbnailUrl = generatedThumbnail;
            //     console.log(`为默认视频模型 ${model.video_model_label} 生成缩略图成功`);
            //   } catch (error) {
            //     console.warn(`为默认视频模型 ${model.video_model_label} 生成缩略图失败:`, error);
            //   }
            // }
            
            return {
              id: `default-video-${model.video_model_pk}`,
              name: model.video_model_label,
              description: '預設影片模型',
              thumbnail: thumbnailUrl,
              isCustom: false,
              videoUrl: model.video_model_url,
              pk: model.video_model_pk,
            };
          })
        );

        setCustomVideoModels(customModels);
        setDefaultVideoModels(defaultModels);
      }
    } catch (error) {
      console.error('載入影片模型失敗:', error);
      // 使用預設數據作為備用
      setDefaultVideoModels([
        {
          id: 'default-video-1',
          name: '商業簡報',
          description: '預設影片模型',
          thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
          isCustom: false,
        },
        {
          id: 'default-video-2',
          name: '產品展示',
          description: '預設影片模型',
          thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2',
          isCustom: false,
        },
      ]);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // 🎵 音頻播放控制
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

  // 🎬 影片播放控制 - 修正版本
  const toggleVideoPlay = (modelId: string, videoUrl?: string) => {
    if (!videoUrl) return;

    // 停止當前播放的影片
    if (playingVideo && playingVideo !== modelId) {
      const currentVideo = videoElements[playingVideo];
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
      }
    }

    if (playingVideo === modelId) {
      // 停止當前影片
      const video = videoElements[modelId];
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      setPlayingVideo('');
    } else {
      // 播放新影片
      let video = videoElements[modelId];
      if (!video) {
        video = document.createElement('video');
        video.src = videoUrl;
        video.controls = true;
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.maxHeight = '300px';
        video.style.borderRadius = '8px';
        video.onended = () => setPlayingVideo('');
        video.onerror = (e) => {
          console.error('影片播放錯誤:', e);
          setPlayingVideo('');
        };
        setVideoElements(prev => ({ ...prev, [modelId]: video }));
      }
      
      // 創建播放彈窗
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
      `;

      const container = document.createElement('div');
      container.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 90vw;
        max-height: 90vh;
        position: relative;
      `;

      const closeButton = document.createElement('button');
      closeButton.innerHTML = '✕';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        z-index: 1;
      `;

      const title = document.createElement('h3');
      title.textContent = `預覽影片 - ${defaultVideoModels.find(m => m.id === modelId)?.name || customVideoModels.find(m => m.id === modelId)?.name || '未知'}`;
      title.style.cssText = `
        margin: 0 0 15px 0;
        color: #333;
        font-size: 18px;
        font-weight: 600;
      `;

      const closeModal = () => {
        video.pause();
        video.currentTime = 0;
        document.body.removeChild(modal);
        setPlayingVideo('');
      };

      closeButton.onclick = closeModal;
      modal.onclick = (e) => {
        if (e.target === modal) closeModal();
      };

      container.appendChild(closeButton);
      container.appendChild(title);
      container.appendChild(video);
      modal.appendChild(container);
      document.body.appendChild(modal);

      video.play().catch(error => {
        console.error('影片播放失敗:', error);
        closeModal();
      });
      setPlayingVideo(modelId);
    }
  };

  const handleNextStep = async () => {
    await reportStepApi(currentStep);
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // 或 'audio/ogg'
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

    if (!readingText.trim()) {
      setUploadMessage('❌ 請輸入朗讀文字');
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

      console.log('開始上傳語音模型:', {
        fileName: `${newVoiceName}.webm`,
        modelNote: newVoiceName,
        modelText: readingText,
        audioBlobSize: audioBlob.size,
        recordingTime: recordingTime
      });

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
        console.log('語音模型上傳成功');
        
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
        
        // 保持按鈕鎖定狀態，直到視窗關閉
        setTimeout(() => {
          setShowVoiceRecording(false);
          resetVoiceRecording();
        }, 3000);
      } else {
        throw new Error(result.message || '上傳失敗');
      }

    } catch (error) {
      console.error('上傳過程發生錯誤:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setUploadMessage('❌ 網路連接錯誤，請檢查網路連線');
      } else if (error instanceof Error) {
        setUploadMessage(`❌ ${error.message}`);
      } else {
        setUploadMessage('❌ 未知錯誤，請稍後再試');
      }
      // 錯誤時才解鎖按鈕
      setIsUploading(false);
    }
    // 移除 finally 區塊，成功時保持鎖定狀態
  };

  const resetVoiceRecording = () => {
    setNewVoiceName('');
    setRecordingTime(0);
    setAudioBlob(null);
    setUploadMessage('');
    setIsUploading(false); // 在重置時才解鎖
  };

  const uploadVideoModel = async () => {
    if (!selectedVideoFile) {
      setVideoUploadMessage('❌ 請選擇影片檔案');
      return;
    }

    if (!newMaterialName.trim()) {
      setVideoUploadMessage('❌ 請輸入影片模型名稱');
      return;
    }

    if (!selectedVideoFile.name.toLowerCase().endsWith('.mp4')) {
      setVideoUploadMessage('❌ 只接受 MP4 格式的影片檔案');
      return;
    }

    if (selectedVideoFile.type !== 'video/mp4') {
      setVideoUploadMessage('❌ 檔案格式不正確，請上傳 MP4 格式的影片');
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadMessage('🔄 正在上傳影片模型...');

    try {
      const formData = new FormData();
      formData.append('video_file', selectedVideoFile);
      formData.append('model_note', newMaterialName);
      formData.append('model_text', '影片模型');

      console.log('開始上傳影片模型:', {
        fileName: selectedVideoFile.name,
        modelNote: newMaterialName,
        fileSize: selectedVideoFile.size,
        fileType: selectedVideoFile.type
      });

      const proxyUrl = API_ENDPOINTS.UPLOAD_VIDEO;
      
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
      console.log('影片模型上傳API回應:', result);

      if (result.success) {
        console.log('影片模型上傳成功');
        
        let thumbnailUrl = 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2';
        
        const newModel: VideoModel = {
          id: `custom-video-${result.data.video_model_pk}`,
          name: newMaterialName,
          description: '自訂影片模型',
          thumbnail: thumbnailUrl,
          isCustom: true,
          videoUrl: result.data.video_model_url,
          pk: result.data.video_model_pk,
        };
        
        setCustomVideoModels(prev => [...prev, newModel]);
        setSelectedMaterial(newModel.id);
        setVideoUploadMessage('✅ 影片模型建立成功！');
        
        // 保持按鈕鎖定狀態，直到視窗關閉
        setTimeout(() => {
          setShowMaterialUpload(false);
          resetVideoUpload();
        }, 3000);
      } else {
        throw new Error(result.message || '上傳失敗');
      }

    } catch (error) {
      console.error('上傳過程發生錯誤:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setVideoUploadMessage('❌ 網路連接錯誤，請檢查網路連線');
      } else if (error instanceof Error) {
        setVideoUploadMessage(`❌ ${error.message}`);
      } else {
        setVideoUploadMessage('❌ 未知錯誤，請稍後再試');
      }
      // 錯誤時才解鎖按鈕
      setIsUploadingVideo(false);
    }
    // 移除 finally 區塊，成功時保持鎖定狀態
  };

  const resetVideoUpload = () => {
    setNewMaterialName('');
    setSelectedVideoFile(null);
    setVideoUploadMessage('');
    setIsUploadingVideo(false); // 在重置時才解鎖
  };

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
      const requestData = {
        audience_age: `${audienceProfile.ageRange[0]}-${audienceProfile.ageRange[1]}歲`,
        audience_profession: audienceProfile.profession,
        tone_style: getToneStyleText(audienceProfile.tone),
        content_outline: copywritingOutline
      };

      console.log('發送AI文案生成請求:', requestData);

      const csrftoken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const apiUrl = API_ENDPOINTS.GENERATE_TARGET_TEXT;

      const response = await api.post(apiUrl, requestData, {
        headers: {
          'X-CSRFToken': csrftoken,
        }
      });

      const result = response.data;
      console.log('AI文案生成API回應:', result);

      if (result.success) {
        setCopywritingContent(result.data.generated_text || result.data.content || '文案生成成功');
        setCopywritingMessage('✅ 文案生成成功！');
        
        // 保持按鈕鎖定狀態，直到視窗關閉
        setTimeout(() => {
          setShowAiAssistant(false);
          setCopywritingMessage('');
          setIsGeneratingCopywriting(false); // 在關閉視窗時才解鎖
        }, 3000);
      } else {
        throw new Error(result.message || '文案生成失敗');
      }

    } catch (error) {
      console.error('AI文案生成錯誤:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setCopywritingMessage('❌ 網路連接錯誤，請檢查網路連線');
      } else if (error instanceof Error) {
        setCopywritingMessage(`❌ ${error.message}`);
      } else {
        setCopywritingMessage('❌ 文案生成失敗，請稍後再試');
      }
      // 錯誤時才解鎖按鈕
      setIsGeneratingCopywriting(false);
    }
    // 移除 finally 區塊，成功時保持鎖定狀態
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

  // 🎬 影片模型卡片渲染
  const renderVideoModelCard = (model: VideoModel) => (
    <div
      key={model.id}
      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-colors ${
        selectedMaterial === model.id
          ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedMaterial(model.id)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center mb-3 overflow-hidden relative">
          {model.thumbnail ? (
            <img 
              src={model.thumbnail} 
              alt={model.name}
              className="w-full h-full object-cover object-center rounded-xl"
              style={{ aspectRatio: '1/1' }}
            />
          ) : (
            <Film size={32} className={AI_COLORS.text} />
          )}
          {/* 生成缩略图按钮已移除 */}
        </div>
        <h4 className="font-semibold text-gray-900 mb-1">{model.name}</h4>
        <p className="text-sm text-gray-600 leading-tight mb-3">{model.description}</p>
        
        {model.videoUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleVideoPlay(model.id, model.videoUrl);
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              playingVideo === model.id
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : `${AI_COLORS.bg} ${AI_COLORS.text} hover:${AI_COLORS.bgHover}`
            }`}
          >
            {playingVideo === model.id ? (
              <>
                <Square size={12} />
                停止
              </>
            ) : (
              <>
                <Play size={18} className="text-white" />
                預覽
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

  // 为指定模型生成缩略图
  // const generateThumbnailForModel = async (model: VideoModel) => {
  //   if (!model.videoUrl) return;
    
  //   try {
  //     console.log(`正在为 ${model.name} 生成缩略图...`);
  //     const thumbnailUrl = await generateVideoThumbnail(model.videoUrl);
      
  //     // 更新模型数据
  //     const updatedModel = { ...model, thumbnail: thumbnailUrl };
      
  //     // 更新状态
  //     setCustomVideoModels(prev => 
  //       prev.map(m => m.id === model.id ? updatedModel : m)
  //     );
  //     setDefaultVideoModels(prev => 
  //       prev.map(m => m.id === model.id ? updatedModel : m)
  //     );
      
  //     console.log(`缩略图生成成功: ${model.name}`);
  //   } catch (error) {
  //     console.error(`缩略图生成失败: ${model.name}`, error);
  //   }
  // };

  const renderMaterialCard = (material: Material) => (
    <div
      key={material.id}
      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-colors ${
        selectedMaterial === material.id
          ? `${AI_COLORS.border} ${AI_COLORS.bgLight}`
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => setSelectedMaterial(material.id)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-15 h-15 bg-gray-200 rounded-xl flex items-center justify-center mb-3">
          {material.type === 'video' ? (
            <Film size={32} className={AI_COLORS.text} />
          ) : (
            <ImageIcon size={32} className={AI_COLORS.text} />
          )}
        </div>
        <h4 className="font-semibold text-gray-900 mb-1">{material.name}</h4>
        <p className="text-sm text-gray-600">
          {material.type === 'video' ? '影片素材' : '圖片素材'}
        </p>
        {material.isCustom && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
            自訂
          </div>
        )}
      </div>
    </div>
  );

  const renderAddMaterialCard = () => (
    <div
      className={`p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:${AI_COLORS.border} transition-colors flex items-center justify-center min-h-[180px]`}
      onClick={() => setShowMaterialUpload(true)}
    >
      <div className="flex flex-col items-center justify-center text-center w-full h-full">
        <div className={`w-15 h-15 ${AI_COLORS.bg} rounded-xl flex items-center justify-center mb-3 mx-auto`}>
          <Plus size={32} className={AI_COLORS.text} />
        </div>
        <h4 className={`font-semibold ${AI_COLORS.text} mb-1`}>新增影片素材</h4>
        <p className="text-sm text-gray-600">上傳 MP4 影片</p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">設定影片基本資訊</h3>
            <p className="text-gray-600 mb-6">為您的AI短影音設定標題和基本資訊</p>
            
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
          </div>
        );

      case 2:
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
        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">選擇素材</h3>
            <p className="text-gray-600 mb-6">選擇預設素材或上傳自己的素材</p>
            
            {isLoadingVideos && (
              <div className="text-center py-8">
                <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${AI_COLORS.border}`}></div>
                <p className="mt-2 text-gray-600">載入影片素材中...</p>
              </div>
            )}

            {/* 預設影片素材 */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">預設影片素材</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {defaultVideoModels.map(renderVideoModelCard)}
              </div>
            </div>

            {/* 我的影片素材 */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">我的影片素材</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {customVideoModels.map(renderVideoModelCard)}
                {renderAddMaterialCard()}
              </div>
            </div>

            {/* 其他素材 */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">其他素材</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {customMaterials.map(renderMaterialCard)}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">文案編輯</h3>
                <p className="text-gray-600">編寫影片文案內容</p>
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
                  <span className={`text-sm ${copywritingContent.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>
                    {copywritingContent.length}/250
                  </span>
                  {copywritingContent.length > 250 && (
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                      超出字數限制
                    </span>
                  )}
                </div>
              </div>
              <textarea
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent resize-none ${
                  copywritingContent.length > 250 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-ai-500'
                }`}
                rows={8}
                placeholder="輸入完整的影片文案內容...（最多250字）"
                value={copywritingContent}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= 250) {
                    setCopywritingContent(newValue);
                  }
                }}
                maxLength={250}
              />
              {copywritingContent.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  已輸入 {copywritingContent.length} 字，還可輸入 {250 - copywritingContent.length} 字
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        // 获取选中的语音模型和视频模型的 pk 值
        const selectedVoiceModelData = [...defaultVoiceModels, ...customVoiceModels].find(model => model.id === selectedVoiceModel);
        const selectedVideoModelData = [...defaultVideoModels, ...customVideoModels].find(model => model.id === selectedMaterial);
        
        // 在控制台输出 pk 值
        console.log('=== AI 生成影片 - 選擇的內容 PK 值 ===');
        console.log('專案標題:', title);
        console.log('選中的語音模型:', selectedVoiceModelData);
        console.log('語音模型 PK:', selectedVoiceModelData?.pk);
        console.log('選中的影片模型:', selectedVideoModelData);
        console.log('影片模型 PK:', selectedVideoModelData?.pk);
        console.log('文案內容:', copywritingContent);
        console.log('=====================================');

        return (
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI生成影片</h3>
            <p className="text-gray-600 mb-6">確認您的選擇並開始生成影片</p>
            
            {/* 选择内容预览 */}
            <div className="space-y-6 mb-8">
              {/* 项目标题 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="AI_COLORS.text" />
                  <h4 className="font-semibold text-gray-900">專案標題</h4>
                </div>
                <p className="text-gray-700">{title || '未設定'}</p>
              </div>

              {/* 语音模型 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mic size={20} className="AI_COLORS.text" />
                  <h4 className="font-semibold text-gray-900">語音模型</h4>
                </div>
                {selectedVoiceModelData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedVoiceModelData.avatar && !selectedVoiceModelData.isCustom ? (
                        <img 
                          src={selectedVoiceModelData.avatar} 
                          alt={selectedVoiceModelData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={24} className="AI_COLORS.text" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedVoiceModelData.name}</p>
                      <p className="text-sm text-gray-600">{selectedVoiceModelData.description}</p>
                      {selectedVoiceModelData.pk && (
                        <p className="text-xs AI_COLORS.text">PK: {selectedVoiceModelData.pk}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">未選擇語音模型</p>
                )}
              </div>

              {/* 视频模型 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Film size={20} className="AI_COLORS.text" />
                  <h4 className="font-semibold text-gray-900">影片模型</h4>
                </div>
                {selectedVideoModelData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {selectedVideoModelData.thumbnail ? (
                        <img 
                          src={selectedVideoModelData.thumbnail} 
                          alt={selectedVideoModelData.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Film size={24} className="AI_COLORS.text" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedVideoModelData.name}</p>
                      <p className="text-sm text-gray-600">{selectedVideoModelData.description}</p>
                      {selectedVideoModelData.pk && (
                        <p className="text-xs AI_COLORS.text">PK: {selectedVideoModelData.pk}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">未選擇影片模型</p>
                )}
              </div>

              {/* 文案内容 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={20} className="AI_COLORS.text" />
                  <h4 className="font-semibold text-gray-900">文案內容</h4>
                </div>
                {copywritingContent ? (
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {copywritingContent}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">未輸入文案內容</p>
                )}
              </div>
            </div>

            {/* 生成按钮 */}
            <div className="text-center">
              <button 
                className={`inline-flex items-center gap-3 px-8 py-4 ${AI_COLORS.button} rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isGeneratingVideo || isSubmitting}
                onClick={async () => {
                  if (!selectedVoiceModelData?.pk || !selectedVideoModelData?.pk || !title || !copywritingContent) {
                    setCopywritingMessage('請確認所有欄位都已選擇/填寫');
                    return;
                  }
                  
                  if (copywritingContent.length > 250) {
                    setCopywritingMessage('文案內容不能超過250字');
                    return;
                  }
                  
                  setIsSubmitting(true); // 開始送出中狀態
                  setCopywritingMessage('🔄 正在送出...');
                  
                  let hasError = false;
                  let errorMessage = '';
                  
                  try {
                    const result = await createVideoGeneration({
                      voice_model_id: selectedVoiceModelData.pk,
                      video_model_id: selectedVideoModelData.pk,
                      label: title,
                      text_content: copywritingContent
                    });
                    
                    if (!result.success) {
                      hasError = true;
                      errorMessage = result.error || '送出失敗';
                    }
                  } catch (e) {
                    hasError = true;
                    errorMessage = '送出失敗，請稍後再試';
                  }
                  
                  // 無論成功或失敗，都等待5秒後再處理結果
                  setTimeout(() => {
                    if (hasError) {
                      setCopywritingMessage(errorMessage);
                      setIsSubmitting(false);
                    } else {
                      setCopywritingMessage('✅ 已送出');
                      setShowSuccessModal(true);
                      setIsSubmitting(false);
                    }
                  }, 5000);
                }}
              >
                <Video size={24} />
                {isSubmitting ? '送出中...' : isGeneratingVideo ? '提交中...' : '開始生成影片'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    loadVoiceModels();
    loadVideoModels();
    
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      
      // 清理音頻元素
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      
      // 清理影片元素
      Object.values(videoElements).forEach(video => {
        video.pause();
        video.src = '';
      });
    };
  }, []);

  // // 测试缩略图生成功能
  // const testThumbnailGeneration = async () => {
  //   const testVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'; // 示例视频URL
    
  //   try {
  //     console.log('开始测试缩略图生成...');
  //     const thumbnail = await generateVideoThumbnail(testVideoUrl);
  //     console.log('缩略图生成成功:', thumbnail.substring(0, 100) + '...');
      
  //     // 创建一个测试图片元素来显示结果
  //     const img = document.createElement('img');
  //     img.src = thumbnail;
  //     img.style.width = '200px';
  //     img.style.height = '150px';
  //     img.style.border = '2px solid #333';
  //     img.style.margin = '10px';
      
  //     // 添加到页面进行测试
  //     document.body.appendChild(img);
      
  //   } catch (error) {
  //     console.error('缩略图生成测试失败:', error);
  //   }
  // };

  // 在组件加载时测试缩略图功能
  useEffect(() => {
    // 取消注释下面的行来测试缩略图生成功能
    // testThumbnailGeneration();
  }, []);

  // 彈窗狀態
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 最近專案狀態
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState<{[key: string]: string}>({});
  const [generatingThumbnails, setGeneratingThumbnails] = useState<{[key: string]: boolean}>({});
  const [showRecentProjects, setShowRecentProjects] = useState(false);

  // 生成最近專案影片縮略圖
  const generateProjectThumbnail = (videoUrl: string, projectId: string): Promise<void> => {
    // 如果正在生成或已經有縮略圖，直接返回
    if (generatingThumbnails[projectId] || videoThumbnails[projectId]) {
      return Promise.resolve();
    }

    // 標記正在生成
    setGeneratingThumbnails(prev => ({ ...prev, [projectId]: true }));

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        try {
          video.currentTime = 0.1; // 設置到第0.1秒
          
          video.onseeked = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('無法創建 canvas 上下文'));
                return;
              }
              
              canvas.width = 80; // 縮略圖寬度
              canvas.height = 80; // 縮略圖高度
              
              // 計算縮放比例以保持寬高比
              const videoAspectRatio = video.videoWidth / video.videoHeight;
              const canvasAspectRatio = canvas.width / canvas.height;
              
              let drawWidth = canvas.width;
              let drawHeight = canvas.height;
              let offsetX = 0;
              let offsetY = 0;
              
              if (videoAspectRatio > canvasAspectRatio) {
                // 影片更寬，以高度為準
                drawHeight = canvas.height;
                drawWidth = drawHeight * videoAspectRatio;
                offsetX = (canvas.width - drawWidth) / 2;
              } else {
                // 影片更高，以寬度為準
                drawWidth = canvas.width;
                drawHeight = drawWidth / videoAspectRatio;
                offsetY = (canvas.height - drawHeight) / 2;
              }
              
              ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
              
              const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
              setVideoThumbnails(prev => ({ ...prev, [projectId]: thumbnailUrl }));
              
              // 清理資源
              video.pause();
              video.src = '';
              
              // 移除生成標記
              setGeneratingThumbnails(prev => ({ ...prev, [projectId]: false }));
              resolve();
            } catch (error) {
              // 移除生成標記
              setGeneratingThumbnails(prev => ({ ...prev, [projectId]: false }));
              reject(error);
            }
          };
          
          video.onerror = () => {
            // 移除生成標記
            setGeneratingThumbnails(prev => ({ ...prev, [projectId]: false }));
            reject(new Error('影片載入失敗'));
          };
          
        } catch (error) {
          // 移除生成標記
          setGeneratingThumbnails(prev => ({ ...prev, [projectId]: false }));
          reject(error);
        }
      };
      
      video.onerror = () => {
        // 移除生成標記
        setGeneratingThumbnails(prev => ({ ...prev, [projectId]: false }));
        reject(new Error('影片載入失敗'));
      };
      
      video.src = videoUrl;
    });
  };

  // 清理資源（移除自動載入專案）
  useEffect(() => {
    // 不在進入頁面時自動載入最近專案
    
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      
      // 清理音頻元素
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      
      // 清理影片元素
      Object.values(videoElements).forEach(video => {
        video.pause();
        video.src = '';
      });
    };
  }, []);

  // 1. 在 AIVideo 頂層定義 fetchRecentProjects
  const fetchRecentProjects = async () => {
    setIsLoadingRecent(true);
    try {
      // 改用 axios api 實例
      const res = await api.get(API_ENDPOINTS.VIDEO_GENERATION_LIST);
      const result = res.data;
      if (result.success && result.data?.video_generations) {
        setRecentProjects(result.data.video_generations);
        // 為已完成的影片自動生成縮略圖
        result.data.video_generations.forEach((project: any) => {
          if (project.is_completed && project.video_generation_video_url && !videoThumbnails[project.video_generation_pk]) {
            generateProjectThumbnail(project.video_generation_video_url, project.video_generation_pk.toString())
              .catch(error => {
                console.error(`為項目 ${project.video_generation_pk} 生成縮略圖失敗:`, error);
              });
          }
        });
      }
    } catch (e) {
      setRecentProjects([]);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleDownload = async () => {
    // ...原本的 fetch blob 下載流程...
  };

  // 檢測是否在 LINE 環境中
  const isLine = /Line/i.test(navigator.userAgent);

  const reportStepApi = async (step: number) => {
    const stepMap = [
      { action_id: 'ai_video_step1', action_name: '基本資訊', now_page: '基本資訊' },
      { action_id: 'ai_video_step2', action_name: '語音模型', now_page: '語音模型' },
      { action_id: 'ai_video_step3', action_name: '影像素材', now_page: '影像素材' },
      { action_id: 'ai_video_step4', action_name: '文案編輯', now_page: '文案編輯' },
      { action_id: 'ai_video_step5', action_name: 'AI生成', now_page: 'AI生成' },
    ];
    const info = stepMap[step - 1];

    // 只用 user.id 當 device_id，ip 用 user.ip_address
    let device_id = '';
    let ip = '';
    let userObj: any = {};
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        userObj = JSON.parse(userStr);
        device_id = userObj.id ? String(userObj.id) : '';
        ip = userObj.ip_address ? String(userObj.ip_address) : '';
      }
    } catch (e) {}
    console.log("userObj", userObj);
    console.log("device_id", device_id);

    const view = /phone|android|mobile/i.test(navigator.userAgent) ? 'phone' : 'PC';
    const body = {
      mode: "2",
      app_id: "114_光隼",
      action_id: info.action_id,
      action_name: info.action_name,
      use_time: "0",
      time: Math.floor(Date.now() / 1000),
      device_id: device_id || "",
      ip,
      view,
      now_page: info.now_page,
    };

    const formBody = Object.entries(body)
      .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
      .join('&');

    const res = await fetch('https://rise.iii.org.tw/app_restful/public/index.php/api/customers/add/2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });

    const responseText = await res.text();
    console.log('步驟上報API:', responseText);
  };

  // 在狀態定義區域添加
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="bg-gray-50 rounded-xl p-4 mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
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

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">我的影片創作記錄</h2>
            <div className="flex items-center gap-3">
              {showRecentProjects && (
                <button
                  onClick={async () => {
                    try {
                      await fetchRecentProjects();
                    } catch (error) {
                      console.error('重新整理失敗:', error);
                    }
                  }}
                  disabled={isLoadingRecent}
                  className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  <Loader2 size={16} className={isLoadingRecent ? 'animate-spin' : ''} />
                  重新整理
                </button>
              )}
              <button
                onClick={() => {
                  setShowRecentProjects(!showRecentProjects);
                  if (!showRecentProjects && recentProjects.length === 0) {
                    fetchRecentProjects();
                  }
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showRecentProjects ? '隱藏記錄' : '查看記錄'}
              </button>
            </div>
          </div>

          {showRecentProjects && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {isLoadingRecent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">載入中...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileVideo size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>尚無影片創作記錄</p>
                      <p className="text-sm">開始創作您的第一個AI影片吧！</p>
                    </div>
                  )}
                  {recentProjects.map((project) => {
                // 狀態顏色與文字
                let statusLabel = '';
                let statusBoxClass = '';
                // if (project.is_generation) {
                //   statusLabel = '生成中';
                //   statusBoxClass = 'border border-yellow-400 text-yellow-700 bg-yellow-50';
                // } else if (project.is_completed) {
                //   statusLabel = '已完成';
                //   statusBoxClass = 'border border-green-400 text-green-700 bg-green-50';
                // } else {
                //   statusLabel = '等待中';
                //   statusBoxClass = 'border border-gray-400 text-gray-700 bg-gray-50';
                // }
                if (project.status === 'generation') {
                  statusLabel = '生成中';
                  statusBoxClass = 'border border-yellow-400 text-yellow-700 bg-yellow-50';
                } else if (project.status === 'completed') {
                  statusLabel = '已完成';
                  statusBoxClass = 'border border-green-400 text-green-700 bg-green-50';
                } else if (project.status === 'queue' || project.status === '隊列中') {
                  statusLabel = '隊列中';
                  statusBoxClass = 'border border-orange-400 text-orange-700 bg-orange-50';
                } else if (project.status === 'Voice_Model_error') {
                  statusLabel = '語音模型錯誤';
                  statusBoxClass = 'border border-red-400 text-red-700 bg-red-50';
                } else if (project.status === 'Video_Model_error') {
                  statusLabel = '影像素材錯誤';
                  statusBoxClass = 'border border-red-400 text-red-700 bg-red-50';
                } else if (project.status === 'error') {
                  statusLabel = '生成錯誤';
                  statusBoxClass = 'border border-red-400 text-red-700 bg-red-50';
                } else {
                  statusLabel = '等待中';
                  statusBoxClass = 'border border-gray-400 text-gray-700 bg-gray-50';
                }

                return (
                  <div key={project.video_generation_pk} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 transition-shadow hover:shadow-lg">
                    {/* 左側縮圖 */}
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-white shadow-inner overflow-hidden">
                      {project.thumbnail_url ? (
                        <img
                          src={project.thumbnail_url}
                          alt={project.video_generation_label}
                          className="w-full h-full object-cover rounded-xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center rounded-xl bg-gray-100">
                          <Clock size={32} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* 中間內容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate mb-1">{project.video_generation_label}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} className="mr-1" />
                        <span>{new Date(project.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    {/* 右側狀態與功能 */}
                    <div className="flex flex-col items-end gap-2 min-w-[110px]">
                      <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${statusBoxClass}`}>{statusLabel}</div>
                      {project.is_completed && project.video_generation_video_url && (
                        <div className="flex gap-2 mt-1">
                          {/* 播放按鈕 */}
                          <button
                            className={`p-2 ${AI_COLORS.bgDark} rounded-full hover:shadow-lg transition-colors hover:${AI_COLORS.bgDark}`}
                            title="播放影片"
                            onClick={() => {
                              toggleVideoPlay && toggleVideoPlay(project.video_generation_pk, project.video_generation_video_url);
                            }}
                          >
                            <Play size={18} className="text-white" />
                          </button>
                          {/* 下載按鈕（彈窗說明+下載） */}
                          <button
                            className={`p-2 ${AI_COLORS.bgDark} rounded-full hover:shadow-lg transition-colors hover:${AI_COLORS.bgDark}`}
                            title="下載影片"
                            onClick={() => {
                              setDownloadInfo({
                                url: project.video_generation_video_url,
                                name: `video_${project.video_generation_pk}.mp4`
                              });
                              setShowDownloadModal(true);
                            }}
                          >
                            <Download size={18} className="text-white" />
                          </button>
                          {/* 分享按鈕 */}
                          <button 
                            className={`p-2 ${AI_COLORS.bg} rounded-full hover:shadow-lg transition-colors hover:${AI_COLORS.bgHover}`} 
                            title="分享影片" 
                            onClick={() => {
                              navigator.clipboard.writeText(project.video_generation_video_url);
                              alert('影片連結已複製到剪貼簿');
                            }}
                          >
                            <Share2 size={18} className={AI_COLORS.text} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
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
                    ? 'AI_COLORS.text hover:${AI_COLORS.textDark}'
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

      {/* Material Upload Modal */}
      {showMaterialUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button 
                onClick={() => {
                  setShowMaterialUpload(false);
                  resetVideoUpload();
                }}
                className="text-gray-600 hover:text-gray-800"
                disabled={isUploadingVideo}
              >
                取消
              </button>
              <h3 className="text-lg font-semibold text-gray-900">上傳影片素材</h3>
              <button 
                onClick={uploadVideoModel}
                disabled={!newMaterialName.trim() || !selectedVideoFile || isUploadingVideo}
                className={`font-semibold ${
                  newMaterialName.trim() && selectedVideoFile && !isUploadingVideo
                    ? 'AI_COLORS.text hover:${AI_COLORS.textDark}'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {isUploadingVideo ? '上傳中...' : '保存'}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">影片名稱</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ai-500 focus:border-transparent"
                  placeholder="輸入影片名稱..."
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  disabled={isUploadingVideo}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">選擇影片檔案</label>
                <input
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // 检查文件格式
                      if (!file.name.toLowerCase().endsWith('.mp4')) {
                        setVideoUploadMessage('❌ 只接受 MP4 格式的影片檔案');
                        return;
                      }
                      if (file.type !== 'video/mp4') {
                        setVideoUploadMessage('❌ 檔案格式不正確，請上傳 MP4 格式的影片');
                        return;
                      }
                      setSelectedVideoFile(file);
                      setVideoUploadMessage('');
                    }
                  }}
                  className="hidden"
                  id="video-file-input"
                  disabled={isUploadingVideo}
                />
                <label
                  htmlFor="video-file-input"
                  className={`border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:${AI_COLORS.border} transition-colors cursor-pointer block`}
                >
                  {selectedVideoFile ? (
                    <div>
                      <Film size={48} className="text-green-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">已選擇檔案</p>
                      <p className="text-sm text-gray-600 mb-2">{selectedVideoFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedVideoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload size={48} className="AI_COLORS.text mx-auto mb-4" />
                      <p className="text-lg font-semibold text-gray-900 mb-2">點擊選擇影片檔案</p>
                      <p className="text-sm text-gray-600">只支援 MP4 格式</p>
                    </div>
                  )}
                </label>
              </div>

              {videoUploadMessage && (
                <div className={`p-4 rounded-xl text-center font-medium ${
                  videoUploadMessage.includes('成功') 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : videoUploadMessage.includes('錯誤') || videoUploadMessage.includes('失敗')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : videoUploadMessage.includes('正在') || videoUploadMessage.includes('上傳中')
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-gray-50 border border-gray-200 text-gray-700'
                }`}>
                  <p>{videoUploadMessage}</p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={20} className="text-amber-600" />
                  <h4 className="font-semibold text-amber-800">上傳小貼士</h4>
                </div>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• 只接受 MP4 格式的影片檔案</li>
                  <li>• 影片建議長度 10-60 秒</li>
                  <li>• 檔案大小不超過 100MB</li>
                  <li>• 內容需符合平台使用規範</li>
                </ul>
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
              <h3 className="text-lg font-semibold text-gray-900">AI文案助手</h3>
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
                      <div className="text-center text-xs AI_COLORS.text font-semibold mt-1">
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
                      <div className="text-center text-xs AI_COLORS.text font-semibold mt-1">
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

      {/* 成功提示彈窗 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xs w-full text-center">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">已排入生成序列</h3>
            <p className="text-gray-700 mb-6">請耐心等候，AI將自動為您生成影片。</p>
            <button
              className="px-6 py-2 ${AI_COLORS.bgDark} text-white rounded-xl font-semibold hover:${AI_COLORS.bgHover} transition-colors"
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentStep(1);
                setIsGeneratingVideo(false); // 重置生成狀態
                setIsSubmitting(false); // 重置送出狀態
                setCopywritingMessage(''); // 清除訊息
                // 只有在用戶已經打開記錄列表時才刷新
                if (showRecentProjects) {
                  fetchRecentProjects();
                }
              }}
            >
              返回基本資料
            </button>
          </div>
        </div>
      )}

      {/* 下載說明彈窗 */}
      {showDownloadModal && downloadInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-xs w-full text-center relative">
            {/* 關閉 X 按鈕 */}
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowDownloadModal(false)}
              aria-label="關閉"
            >
              ×
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">下載影片說明</h3>
            
            {isLine ? (
              <p className="text-red-600 font-semibold mt-4">您目前在LINE App內，請使用「在瀏覽器開啟」後再下載。</p>
            ) : (
              <p className="text-gray-700 mb-4">如在有異常，<br/>請使用「在瀏覽器開啟」後再下載。</p>
            )}
            {isLine ? (
              <p className="text-red-600 font-semibold mt-4"></p>
            ) : (
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
                className="inline-block px-6 py-2 ${AI_COLORS.bgDark} text-white rounded-xl font-semibold hover:${AI_COLORS.bgHover} transition-colors mb-4"
              >
                下載影片
              </button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AIVideo;