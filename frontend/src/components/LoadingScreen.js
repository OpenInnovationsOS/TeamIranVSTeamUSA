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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  color: #ffffff;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Logo = styled.div`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 24px;
  text-align: center;
  background: linear-gradient(45deg, #0088cc, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #0088cc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingText = styled.div`
  font-size: 18px;
  color: #ffffff;
  margin-bottom: 8px;
`;

const SubText = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  max-width: 300px;
`;

const LoadingScreen = () => {
  return (
    <Container>
      <Logo>⚔️</Logo>
      <Spinner />
      <LoadingText>Loading Game...</LoadingText>
      <SubText>Preparing your battle arena</SubText>
    </Container>
  );
};

export default LoadingScreen;
