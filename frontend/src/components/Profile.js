import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #0088cc, #ff6b6b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ProfileCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-right: 16px;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Username = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const FactionBadge = styled.div`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  background: ${props => 
    props.faction === 'iran' ? 'linear-gradient(45deg, #00a652, #008844)' : 
    'linear-gradient(45deg, #002868, #001848)'
  };
  color: #ffffff;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
`;

const StatItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  text-transform: uppercase;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
`;

const ReferralSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const ReferralCode = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  color: #ffd43b;
  margin: 12px 0;
`;

const ShareButton = styled(motion.button)`
  background: linear-gradient(45deg, #0088cc, #00a6ff);
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
`;

const WalletSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
`;

const WalletAddress = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  word-break: break-all;
  margin: 12px 0;
`;

const ConnectButton = styled(motion.button)`
  background: linear-gradient(45deg, #00a652, #008844);
  color: #ffffff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
`;

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const { hapticFeedback, shareScore } = useTelegram();
  const [referrals, setReferrals] = useState([]);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [referralCode, setReferralCode] = useState('');

  // Fallback user data
  const safeUser = user || {
    id: 1,
    username: 'Player1',
    first_name: 'Test',
    last_name: 'User',
    faction: 'iran',
    stg_balance: 1000,
    level: 1,
    experience: 0,
    referral_code: 'PLAYER123',
    battles: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    created_at: new Date().toISOString(),
    wallet_address: null
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load profile data
      const profileResponse = await fetch('http://localhost:3001/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          updateUser(profileData.data);
        }
      }

      // Load achievements
      const achievementsResponse = await fetch('http://localhost:3001/api/achievements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData.achievements || []);
      }

      // Generate referral code if not exists
      if (!safeUser.referral_code) {
        generateReferralCode();
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
      // Set fallback data
      setReferralCode(safeUser.referral_code);
      setReferrals([
        {
          id: 2,
          username: 'player2',
          first_name: 'Player Two',
          created_at: '2024-01-15T10:30:00Z',
          stg_balance: 500,
          level: 3
        }
      ]);
      setAchievements([
        { id: 1, title: 'First Victory', description: 'Win your first battle', completed: true, reward: 100, rarity: 'common' },
        { id: 2, title: 'Battle Master', description: 'Win 10 battles', completed: false, reward: 500, rarity: 'rare' },
        { id: 3, title: 'STG Collector', description: 'Earn 1000 STG', completed: true, reward: 200, rarity: 'common' }
      ]);
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/referral/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReferralCode(data.referral_code);
          updateUser({ referral_code: data.referral_code });
        }
      }
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      // Fallback referral code
      const fallbackCode = `PLAYER${Math.floor(Math.random() * 100000)}`;
      setReferralCode(fallbackCode);
      updateUser({ referral_code: fallbackCode });
    }
  };

  const shareReferralCode = () => {
    const referralText = `🎮 Join Team ${safeUser.faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}! Use my referral code: ${referralCode || safeUser.referral_code}\n\nPlay now: ${window.location.href}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(referralText)}`;
    
    window.open(telegramUrl, '_blank');
    hapticFeedback('success');
    toast.success('Referral link shared!');
  };

  const connectTONWallet = async () => {
    setIsConnectingWallet(true);
    hapticFeedback('impact');
    
    try {
      // Mock wallet connection - in real app, this would use TON Connect
      setTimeout(() => {
        const mockWalletAddress = 'EQD1234567890abcdef1234567890abcdef12345678';
        updateUser({ ton_wallet_address: mockWalletAddress });
        toast.success('TON wallet connected successfully!');
        setIsConnectingWallet(false);
      }, 2000);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast.error('Failed to connect wallet');
      setIsConnectingWallet(false);
    }
  };

  return (
    <Container>
      <Title>👤 Profile</Title>

      <ProfileCard>
        <ProfileHeader>
          <Avatar>
            {user.faction === 'iran' ? '🇮🇷' : '🇺🇸'}
          </Avatar>
          <ProfileInfo>
            <Username>{user.first_name || user.username}</Username>
            <FactionBadge faction={user.faction}>
              {user.faction === 'iran' ? '🇮🇷 Team Iran' : '🇺🇸 Team USA'}
            </FactionBadge>
          </ProfileInfo>
        </ProfileHeader>

        <StatsGrid>
          <StatItem>
            <StatLabel>Level</StatLabel>
            <StatValue>{user.level}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Experience</StatLabel>
            <StatValue>{user.experience}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>STG Balance</StatLabel>
            <StatValue>{user.stg_balance.toLocaleString()}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>WIN Tokens</StatLabel>
            <StatValue>{user.win_claimable.toLocaleString()}</StatValue>
          </StatItem>
        </StatsGrid>
      </ProfileCard>

      <ReferralSection>
        <h3 style={{ color: '#ffffff', marginBottom: '12px' }}>🎁 Referral Program</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '12px' }}>
          Invite friends and earn 50 STG for each referral!
        </p>
        <ReferralCode>{user.referral_code}</ReferralCode>
        <ShareButton
          onClick={shareReferralCode}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          📤 Share Referral Code
        </ShareButton>
        
        {referrals.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px' }}>
              Your Referrals ({referrals.length})
            </h4>
            {referrals.map(referral => (
              <div key={referral.id} style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                padding: '8px', 
                borderRadius: '6px', 
                marginBottom: '4px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                {referral.first_name || referral.username} • Level {referral.level}
              </div>
            ))}
          </div>
        )}
      </ReferralSection>

      <WalletSection>
        <h3 style={{ color: '#ffffff', marginBottom: '12px' }}>💎 TON Wallet</h3>
        {user.ton_wallet_address ? (
          <>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '8px' }}>
              Connected wallet:
            </p>
            <WalletAddress>{user.ton_wallet_address}</WalletAddress>
          </>
        ) : (
          <>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '12px' }}>
              Connect your TON wallet to claim WIN tokens
            </p>
            <ConnectButton
              onClick={connectTONWallet}
              disabled={isConnectingWallet}
              whileHover={{ scale: isConnectingWallet ? 1 : 1.02 }}
              whileTap={{ scale: isConnectingWallet ? 1 : 0.98 }}
            >
              {isConnectingWallet ? 'Connecting...' : '🔗 Connect TON Wallet'}
            </ConnectButton>
          </>
        )}
      </WalletSection>
    </Container>
  );
};

export default Profile;
