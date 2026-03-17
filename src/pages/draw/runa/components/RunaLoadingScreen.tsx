import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import CircleSymbol from './symbols/CircleSymbol';

// ====== Styled Components ======

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background);
  z-index: 1000;
  transition: opacity 0.8s ease;
`;

const SymbolContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LoadingText = styled(motion.div)`
  margin-top: var(--spacing-lg);
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

// ====== Component ======

const RunaLoadingScreen: React.FC = () => {
  return (
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
          符文能量聚集中...
        </LoadingText>
      </SymbolContainer>
    </LoadingContainer>
  );
};

export default RunaLoadingScreen;
