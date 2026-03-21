import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const dotPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  min-height: 200px;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #0088cc;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`;

const PulseLoader = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  
  div {
    width: 12px;
    height: 12px;
    background: #0088cc;
    border-radius: 50%;
    animation: ${dotPulse} 1.4s ease-in-out infinite both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0; }
  }
`;

const Logo = styled.div`
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(45deg, #ff6b6b, #0088cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.6s ease-out;
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 8px;
  animation: ${fadeIn} 0.8s ease-out;
`;

const LoadingSubtext = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  text-align: center;
  animation: ${fadeIn} 1s ease-out;
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 16px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #0088cc, #00a6ff);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingScreen = ({ 
  type = 'spinner', 
  text = 'Loading...', 
  subtext = 'Please wait a moment',
  showLogo = false,
  progress = null 
}) => {
  return (
    <Container>
      {showLogo && <Logo>⚔️</Logo>}
      
      {type === 'spinner' ? (
        <Spinner />
      ) : type === 'pulse' ? (
        <PulseLoader>
          <div></div>
          <div></div>
          <div></div>
        </PulseLoader>
      ) : (
        <Spinner />
      )}
      
      <LoadingText>{text}</LoadingText>
      {subtext && <LoadingSubtext>{subtext}</LoadingSubtext>}
      
      {progress !== null && (
        <ProgressBar>
          <ProgressFill percentage={progress} />
        </ProgressBar>
      )}
    </Container>
  );
};

export default LoadingScreen;
