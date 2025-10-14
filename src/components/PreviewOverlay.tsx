import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PreviewCard, { PreviewCardData } from './PreviewCard';
import ShareModal from './ShareModal';
import { useBusinessCardData } from '../hooks/useBusinessCardData';

interface PreviewOverlayProps {
  open: boolean;
  onClose: () => void;
  data: PreviewCardData;
  zIndex?: number;
  slug?: string; // 新增：可選的 slug 參數，用於獲取完整數據
}

const PreviewOverlay: React.FC<PreviewOverlayProps> = ({ open, onClose, data, zIndex = 50, slug }) => {
  // 如果有 slug，使用 hook 獲取完整數據（包括 share_pp）
  const { data: hookData } = useBusinessCardData(slug);
  
  // 優先使用 hook 獲取的數據，如果沒有則使用傳入的 data
  const finalData = hookData || data;
  const previewContentRef = useRef<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [scaledSize, setScaledSize] = useState<{ width: number; height: number }>({ width: 340, height: 0 });
  const [cardGapX, setCardGapX] = useState(24);
  const [showShareModal, setShowShareModal] = useState(false);

  // 等比縮放（與名片頁相同）
  const recalc = useCallback(() => {
    const BASE_WIDTH = 340;
    if (!open) {
      setPreviewScale(1);
      return;
    }
    const padY = 48; // py-12
    const padX = 80; // px-20
    const maxHeight = window.innerHeight - padY * 2;
    const maxWidth = Math.min(window.innerWidth - padX * 2, BASE_WIDTH);
    const el = previewContentRef.current;
    if (!el) {
      setPreviewScale(1);
      return;
    }
    const naturalHeight = el.scrollHeight || el.getBoundingClientRect().height || 0;
    const scaleH = naturalHeight > 0 ? maxHeight / naturalHeight : 1;
    const scaleW = maxWidth / BASE_WIDTH;
    const next = Math.min(scaleH, scaleW, 1);
    setPreviewScale(next);
    setScaledSize({ width: Math.round(BASE_WIDTH * next), height: Math.round(naturalHeight * next) });
    const gap = Math.max(20, Math.min(48, Math.round(window.innerWidth * 0.04)));
    setCardGapX(gap);
  }, [open]);

  useEffect(() => {
    recalc();
    // 監聽視窗尺寸
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc, finalData]);

  // 首次開啟時等待圖片/內容載入後再重算，避免第一次高度過短
  useEffect(() => {
    if (!open) return;
    const el = previewContentRef.current;
    if (!el) return;
    // 內容尺寸變化監聽
    const resizeObserver = new ResizeObserver(() => recalc());
    resizeObserver.observe(el);
    // 圖片載入後重算
    const imgs: HTMLImageElement[] = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
    imgs.forEach(img => {
      if (!img.complete) {
        const handler = () => recalc();
        img.addEventListener('load', handler, { once: true });
      }
    });
    // 兩次 RAF 確保布局完成後再量測
    requestAnimationFrame(() => requestAnimationFrame(recalc));
    // 時間緩衝（保險）
    const t = window.setTimeout(recalc, 200);
    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(t);
    };
  }, [open, finalData, recalc]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  if (!open) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 overflow-y-auto`}
        style={{ zIndex }}
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center py-12 px-20 md:px-32 pointer-events-none">
          <div
            className="rounded-2xl shadow-xl p-6 flex flex-col items-center justify-center pointer-events-auto"
                         style={{ backgroundColor: finalData.profile?.page_bg_color || '#e5e7eb', width: scaledSize.width + cardGapX * 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: scaledSize.width, height: scaledSize.height }}>
              <div ref={previewContentRef} style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: 340 }}>
                                                 <PreviewCard 
                  data={finalData} 
                  onShare={handleShare}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分享彈窗 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
                 profileSlug={finalData.profile?.slug || ''}
         sharePpUrl={finalData.share_pp}
      />
    </>,
    document.body
  );
};

export default PreviewOverlay;

