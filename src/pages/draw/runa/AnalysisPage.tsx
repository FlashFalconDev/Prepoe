import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRunaContext, RUNA_FOOTER_ITEMS } from './RunaContext';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import CircleSymbol from './components/symbols/CircleSymbol';
import { AlertCircle, Coins } from 'lucide-react';

import { api, API_ENDPOINTS, getMemberCard, type MemberCard } from '../../../config/api';
import { COIN_LABEL } from '../../../config/terms';
import { useToast } from '../../../hooks/useToast';

// ====== 型別定義 ======

interface AddonInfo {
  need_addon: boolean;
  price: number;
  session_id: number;
}

interface TypewriterTextProps {
  htmlContent: string;
  delay?: number;
  onComplete?: () => void;
}

// ====== Styled Components ======

const PageContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100vh;
  text-align: center;
  position: relative;
  overflow: hidden;
  width: 100%;
  background-image: url('/draw/runa/images/stone_bg.png');
  background-size: 100% auto;
  background-position: center;
  padding: 20px 15px;
  box-sizing: border-box;
  background-color: #f8f8f5;
  will-change: opacity, transform;
`;

const BackButton = styled(motion.button)`
  position: absolute;
  top: var(--spacing-lg);
  left: var(--spacing-lg);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:before {
    content: "←";
    margin-right: var(--spacing-xs);
  }
`;

const Title = styled(motion.h1)`
  font-weight: var(--font-weight-medium);
  font-size: 1.2rem;
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
`;

const AnalysisContainer = styled(motion.div)`
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(200, 188, 167, 0.3);
  border-radius: 8px;
  padding: var(--spacing-xl);
  max-width: 340px;
  width: 100%;
  margin-bottom: var(--spacing-xl);
  position: relative;
  text-align: left;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(200, 188, 167, 0.3);
    border-radius: 2px;
  }

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/draw/runa/assets/paper-texture.png');
    background-size: cover;
    opacity: 0.1;
    pointer-events: none;
    z-index: -1;
    border-radius: 8px;
  }
`;

const AnalysisText = styled.div`
  font-size: 0.95rem;
  line-height: 1.8;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  letter-spacing: 0.5px;
`;

const ErrorText = styled(motion.div)`
  color: #ff6b6b;
  font-size: 0.9rem;
  max-width: 300px;
  text-align: center;
  margin-top: var(--spacing-md);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  margin-top: 30%;
`;

const ImagesContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
  width: 100%;
  perspective: 1000px;
`;

const ImageItem = styled(motion.img)`
  width: 80px;
  height: 80px;
  object-fit: contain;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.4);
  transform-style: preserve-3d;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);
  }
`;

const SymbolContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LoadingText = styled(motion.div)`
  margin-top: var(--spacing-md);
  font-weight: var(--font-weight-light);
  color: var(--color-text-secondary);
  letter-spacing: 2px;
  text-align: center;
`;

const CirclesWrapper = styled(motion.div)`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const OuterCircle = styled.div`
  position: absolute;
`;

// ====== 加購彈窗 Styled Components ======

const AddonOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const AddonModal = styled(motion.div)`
  background: linear-gradient(135deg, #1e1b4b, #312e81, #1e1b4b);
  border-radius: 16px;
  padding: 24px;
  max-width: 360px;
  width: 100%;
  border: 1px solid rgba(139, 92, 246, 0.2);
`;

const AddonIconWrap = styled.div`
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 146, 60, 0.2));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
`;

const AddonTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  text-align: center;
  margin-bottom: 8px;
`;

const AddonDesc = styled.p`
  color: #c4b5fd;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 24px;
`;

const CoinBox = styled.div`
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 179, 8, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
`;

const CoinBoxHeader = styled.h3`
  color: #fbbf24;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CoinRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CoinLabel = styled.div`
  & > p:first-child {
    color: #fff;
    font-size: 0.875rem;
    font-weight: 500;
  }
  & > p:last-child {
    color: #c4b5fd;
    font-size: 0.75rem;
    margin-top: 2px;
  }
`;

const CoinValue = styled.div`
  text-align: right;
  & > p:first-child {
    color: #fbbf24;
    font-weight: 700;
    font-size: 1rem;
  }
  & > p:last-child {
    color: #a78bfa;
    font-size: 0.75rem;
    margin-top: 2px;
  }
`;

const PurchaseButton = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 12px;
  background: ${p => p.$disabled ? 'rgba(107, 114, 128, 0.5)' : 'linear-gradient(to right, #f59e0b, #eab308)'};
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.$disabled ? 0.5 : 1};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
`;

const InsufficientText = styled.p`
  color: #a78bfa;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 12px;
`;

const BackModalButton = styled.button`
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// ====== TypewriterText Component ======

const TypewriterText: React.FC<TypewriterTextProps> = ({ htmlContent, delay = 70, onComplete }) => {
  const [displayedHTML, setDisplayedHTML] = useState('');
  const textRef = useRef('');
  const positionRef = useRef(0);
  const htmlWithoutTagsRef = useRef('');

  useEffect(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    htmlWithoutTagsRef.current = tempDiv.textContent || '';
    textRef.current = htmlContent;
  }, [htmlContent]);

  useEffect(() => {
    if (positionRef.current >= htmlWithoutTagsRef.current.length) {
      if (onComplete) onComplete();
      return;
    }

    const timer = setTimeout(() => {
      positionRef.current += 1;

      let htmlPosition = 0;
      let inTag = false;
      let currentPlainTextPos = 0;

      while (currentPlainTextPos < positionRef.current && htmlPosition < textRef.current.length) {
        const char = textRef.current[htmlPosition];

        if (char === '<') {
          inTag = true;
        } else if (char === '>') {
          inTag = false;
        } else if (!inTag) {
          currentPlainTextPos++;
        }

        htmlPosition++;
      }

      setDisplayedHTML(textRef.current.substring(0, htmlPosition));
    }, delay);

    return () => clearTimeout(timer);
  }, [displayedHTML, delay, onComplete]);

  return <div dangerouslySetInnerHTML={{ __html: displayedHTML }} />;
};

// ====== Component ======

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const { result } = useRunaContext();

  // 加購 AI 解釋相關狀態
  const [addonInfo, setAddonInfo] = useState<AddonInfo | null>(null);
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null);
  const [purchasingAddon, setPurchasingAddon] = useState(false);

  // 缺資料時導回首頁
  useEffect(() => {
    if (!result) {
      navigate('/draw/runa', { replace: true });
    }
  }, [result, navigate]);

  const handleFooterClick = (shareUrl: string) => {
    if (shareUrl.startsWith('/')) {
      navigate(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  // 呼叫 AI Submit API（處理 Axios 非 2xx 拋出例外的情況）
  const callAISubmit = async () => {
    if (!result) return null;
    const payload: Record<string, unknown> = {
      session_id: result.session_id,
      note: result.question,
    };
    try {
      const response = await api.post(API_ENDPOINTS.CARDHACK_AI_SUBMIT, payload);
      console.log('=== AI SUBMIT API 回傳 ===', response.data);
      return response.data;
    } catch (err: any) {
      // 後端可能以非 2xx 狀態碼回傳 need_addon，從 err.response.data 取得
      if (err.response?.data) {
        console.log('=== AI SUBMIT API 回傳 (非2xx) ===', err.response.data);
        return err.response.data;
      }
      throw err;
    }
  };

  // 處理 AI Submit 回傳結果
  const handleAIResponse = (data: any) => {
    // 檢查 need_addon：可能在 data.data 或直接在 data 層級
    const addonData = data.data?.need_addon ? data.data : (data.need_addon ? data : null);
    if (!data.success && addonData?.need_addon) {
      // 需要加購 → 顯示購買彈窗
      setAddonInfo({
        need_addon: true,
        price: addonData.price,
        session_id: addonData.session_id,
      });
      setIsLoading(false);
      // 載入會員卡以取得金幣資訊
      getMemberCard(addonData.price).then(res => {
        if (res.success) setMemberCard(res.data);
      }).catch(() => {});
      return;
    }

    if (data.success) {
      const content = data.data?.flex_deck?.contents?.[0]?.hero?.layers?.[0]?.text;
      setAnalysis(content || '暫無分析結果');
      setAddonInfo(null);
    } else {
      setError(data.message || '無法取得分析結果');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!result) {
        setError('無法取得結果資料');
        setIsLoading(false);
        return;
      }

      try {
        const data = await callAISubmit();
        if (data) handleAIResponse(data);
      } catch (err: any) {
        console.error('AI 解卦擷取錯誤:', err);
        setError('無法取得分析結果，請稍後再試。');
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [result]);

  // 金幣購買 AI 加購（通用建單 + 金幣扣款一步完成 → 重新呼叫 AI Submit）
  const handleAddonPurchase = async () => {
    if (!addonInfo || !memberCard) return;

    const coinsPerTwd = memberCard.coins_per_twd || 0;
    const totalCoinsNeeded = Math.ceil(addonInfo.price * coinsPerTwd);

    if (memberCard.coins < totalCoinsNeeded) {
      showError(`${COIN_LABEL}不足`);
      return;
    }

    setPurchasingAddon(true);
    try {
      // 建立加購訂單（後端共用 create_order 流程，自動組 items）
      const orderRes = await api.post(API_ENDPOINTS.CARDHACK_AI_ADDON_ORDER_CREATE, {
        session_id: addonInfo.session_id,
        payment_method: 'Free',
        use_coins: totalCoinsNeeded,
        coins_discount_amount: addonInfo.price,
      });
      const orderData = orderRes.data;

      if (!orderData.success) {
        showError(orderData.message || '建立訂單失敗');
        return;
      }

      // 重新呼叫 AI Submit
      showSuccess(orderData.message || '購買成功！正在載入解析...');
      setAddonInfo(null);
      setIsLoading(true);
      const data = await callAISubmit();
      if (data) handleAIResponse(data);
    } catch (err: any) {
      showError(err.response?.data?.message || '購買過程中發生錯誤');
    } finally {
      setPurchasingAddon(false);
    }
  };

  // 計算金幣
  const coinsPerTwd = memberCard?.coins_per_twd || 0;
  const totalCoinsNeeded = addonInfo ? Math.ceil(addonInfo.price * coinsPerTwd) : 0;
  const userCoins = memberCard?.coins || 0;
  const canAfford = userCoins >= totalCoinsNeeded;

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BackButton
        onClick={() => navigate('/draw/runa/reading')}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        返回
      </BackButton>

      <Title
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        深度解析
      </Title>

      {isLoading ? (
        <LoadingContainer>
          <SymbolContainer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <CirclesWrapper
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <OuterCircle style={{ transform: 'translate(-50%, -50%) rotate(0deg) translateX(40px)' }}>
                <CircleSymbol size={30} withInnerCircle={false} />
              </OuterCircle>
              <OuterCircle style={{ transform: 'translate(-50%, -50%) rotate(120deg) translateX(40px)' }}>
                <CircleSymbol size={30} withInnerCircle={false} />
              </OuterCircle>
              <OuterCircle style={{ transform: 'translate(-50%, -50%) rotate(240deg) translateX(40px)' }}>
                <CircleSymbol size={30} withInnerCircle={false} />
              </OuterCircle>
              <CircleSymbol size={50} />
            </CirclesWrapper>

            <LoadingText
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.8, 1] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
                times: [0, 0.4, 0.7, 1],
              }}
            >
              解讀神諭中...
            </LoadingText>
          </SymbolContainer>
        </LoadingContainer>
      ) : error ? (
        <>
          <ErrorText
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {error}
          </ErrorText>
          <motion.button
            onClick={() => window.location.reload()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              marginTop: 'var(--spacing-lg)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              border: '1px solid var(--color-text-secondary)',
              borderRadius: '4px',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            重試
          </motion.button>
        </>
      ) : (
        <>
          <AnalysisContainer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <AnalysisText>
              <TypewriterText
                htmlContent={analysis}
                delay={70}
                onComplete={() => setIsTypingComplete(true)}
              />
            </AnalysisText>
          </AnalysisContainer>

          <AnimatePresence>
            {isTypingComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ width: '100%' }}
              >
                <ImagesContainer>
                  {RUNA_FOOTER_ITEMS.map((item, index) => (
                    <ImageItem
                      key={index}
                      src={item.image}
                      alt={`footer-${index + 1}`}
                      onClick={() => handleFooterClick(item.share_url)}
                      initial={{ y: 40, opacity: 0, rotateY: -10, rotateX: 5 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        rotateY: 0,
                        rotateX: 5,
                        z: 20,
                        transition: {
                          duration: 0.8,
                          delay: 0.1 * (index + 1),
                        },
                      }}
                      whileHover={{
                        scale: 1.1,
                        y: -5,
                        rotateX: 10,
                        boxShadow: '0 20px 30px rgba(0, 0, 0, 0.25)',
                      }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </ImagesContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* AI 加購彈窗 */}
      <AnimatePresence>
        {addonInfo && (
          <AddonOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AddonModal
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 標題區域 */}
              <AddonIconWrap>
                <AlertCircle size={32} color="#fbbf24" />
              </AddonIconWrap>
              <AddonTitle>需要加購 AI 解釋</AddonTitle>
              <AddonDesc>{addonInfo.price > 0 ? `此次解讀需要使用${COIN_LABEL}購買` : '請先加購 AI 解釋'}</AddonDesc>

              {/* 金幣購買區塊 */}
              {memberCard && coinsPerTwd > 0 && (
                <CoinBox>
                  <CoinBoxHeader>
                    <Coins size={16} />
                    使用{COIN_LABEL}購買
                  </CoinBoxHeader>
                  <CoinRow>
                    <CoinLabel>
                      <p>AI 深度解析</p>
                      <p>NT$ {addonInfo.price}</p>
                    </CoinLabel>
                    <CoinValue>
                      <p>{totalCoinsNeeded.toLocaleString()} {COIN_LABEL}</p>
                      <p>餘額：{userCoins.toLocaleString()}</p>
                    </CoinValue>
                  </CoinRow>
                  {canAfford ? (
                    <PurchaseButton
                      onClick={handleAddonPurchase}
                      $disabled={purchasingAddon}
                      disabled={purchasingAddon}
                    >
                      {purchasingAddon ? (
                        <>
                          <Spinner />
                          購買中...
                        </>
                      ) : (
                        <>
                          <Coins size={16} />
                          使用需扣除 {totalCoinsNeeded.toLocaleString()} {COIN_LABEL}
                        </>
                      )}
                    </PurchaseButton>
                  ) : (
                    <InsufficientText>
                      {COIN_LABEL}不足（需要 {totalCoinsNeeded.toLocaleString()}，餘額 {userCoins.toLocaleString()}）
                    </InsufficientText>
                  )}
                </CoinBox>
              )}

              {/* 載入會員卡中 */}
              {!memberCard && (
                <CoinBox>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 }}>
                    <Spinner />
                    <span style={{ color: '#c4b5fd', fontSize: '0.875rem' }}>載入{COIN_LABEL}資訊...</span>
                  </div>
                </CoinBox>
              )}

              {/* 返回按鈕 */}
              <BackModalButton
                onClick={() => navigate('/draw/runa/reading')}
                disabled={purchasingAddon}
              >
                返回
              </BackModalButton>
            </AddonModal>
          </AddonOverlay>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default AnalysisPage;
