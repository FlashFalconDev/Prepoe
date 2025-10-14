import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Download, Image as ImageIcon, Video as VideoIcon, Music, File } from 'lucide-react';

interface MediaFile {
  url: string;
  type: 'image' | 'video' | 'audio' | 'other';
  name?: string;
  caption?: string;
}

interface MediaPlayerProps {
  file: MediaFile;
  isOpen: boolean;
  onClose: () => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ file, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // 根據文件類型判斷媒體類型
  const getMediaType = (url: string): 'image' | 'video' | 'audio' | 'other' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return 'video';
    } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension || '')) {
      return 'audio';
    }
    return 'other';
  };

  const mediaType = file.type || getMediaType(file.url);

  // 音頻/影片控制
  useEffect(() => {
    if (mediaType === 'audio' && audioRef.current) {
      const audio = audioRef.current;
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('ended', () => setIsPlaying(false));
    } else if (mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.addEventListener('loadedmetadata', () => setDuration(video.duration));
      video.addEventListener('timeupdate', () => setCurrentTime(video.currentTime));
      video.addEventListener('ended', () => setIsPlaying(false));
    }
  }, [mediaType]);

  const togglePlay = () => {
    if (mediaType === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (mediaType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (mediaType === 'audio' && audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    } else if (mediaType === 'video' && videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaType === 'audio' && audioRef.current) {
      audioRef.current.volume = newVolume;
    } else if (mediaType === 'video' && videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mediaType === 'audio' && audioRef.current) {
      const rect = progressRef.current?.getBoundingClientRect();
      if (rect) {
        const percent = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = percent * duration;
      }
    } else if (mediaType === 'video' && videoRef.current) {
      const rect = progressRef.current?.getBoundingClientRect();
      if (rect) {
        const percent = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = percent * duration;
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || `media_${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (e) {
      alert('下載失敗，請稍後再試');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {mediaType === 'image' && <ImageIcon size={20} className="text-blue-600" />}
            {mediaType === 'video' && <VideoIcon size={20} className="text-purple-600" />}
            {mediaType === 'audio' && <Music size={20} className="text-green-600" />}
            {mediaType === 'other' && <File size={20} className="text-gray-600" />}
            <h3 className="text-lg font-semibold text-gray-900">
              {file.caption || file.name || '多媒體文件'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="下載"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {mediaType === 'image' && (
            <div className="flex justify-center">
              <img
                src={file.url}
                alt={file.caption || '圖片'}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          )}

          {mediaType === 'video' && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                src={file.url}
                className="w-full max-h-[60vh] rounded-lg"
                controls={false}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
              />
              
              {/* 自定義控制條 */}
              <div className="space-y-2">
                <div
                  ref={progressRef}
                  className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          )}

          {mediaType === 'audio' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                  <Music size={48} className="text-white" />
                </div>
              </div>
              
              <audio ref={audioRef} src={file.url} />
              
              {/* 自定義控制條 */}
              <div className="space-y-2">
                <div
                  ref={progressRef}
                  className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-green-600 rounded-full transition-all"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
            </div>
          )}

          {mediaType === 'other' && (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <File size={48} className="text-gray-600" />
              </div>
              <p className="text-gray-600">此文件類型不支援預覽</p>
              <p className="text-sm text-gray-500">請點擊下載按鈕下載文件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPlayer; 