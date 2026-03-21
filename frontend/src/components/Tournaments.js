// Enhanced Tournaments Component - Multi-Card & Multi-Tab System
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useTelegram } from '../hooks/useTelegram';
import { useWebSocketBattle } from '../hooks/useWebSocketBattle';
import { API_CONFIG } from '../config/api';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  gap: 10px;
  flex-wrap: wrap;
`;

const TabButton = styled(motion.button)`
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #ff6b6b, #ff8e53);
    color: #ffffff;
    border-color: transparent;
  }
`;

const CardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const ModularCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardIcon = styled.div`
  font-size: 24px;
  margin-right: 12px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  margin: 0;
`;

const CardContent = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
`;

const StatValue = styled.span`
  color: #ff6b6b;
  font-weight: bold;
  font-size: 14px;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`;

const TournamentList = styled.div`
  max-height: 500px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 107, 107, 0.5);
    border-radius: 3px;
  }
`;

const TournamentItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }
`;

const TournamentInfo = styled.div`
  flex: 1;
`;

const TournamentName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const TournamentDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const TournamentStatus = styled.div`
  text-align: right;
`;

const TournamentBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 8px;
  background: ${props => 
    props.status === 'active' ? 'rgba(0, 255, 0, 0.3)' : 
    props.status === 'upcoming' ? 'rgba(255, 165, 0, 0.3)' : 
    props.status === 'completed' ? 'rgba(255, 255, 255, 0.2)' : 
    'rgba(255, 255, 255, 0.2)'
  };
  color: ${props => 
    props.status === 'active' ? '#00ff00' : 
    props.status === 'upcoming' ? '#ffa500' : 
    props.status === 'completed' ? '#ffffff' : 
    '#ffffff'
  };
`;

const TournamentStats = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const PrizePool = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
`;

const BracketContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
`;

const BracketRound = styled.div`
  text-align: center;
  margin: 0 20px;
`;

const BracketMatch = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const Tournaments = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [myTournaments, setMyTournaments] = useState([]);
  const [tournamentHistory, setTournamentHistory] = useState([]);
  const [registering, setRegistering] = useState(false);

  const tournamentTabs = [
    { id: 'active', label: 'Active', icon: '🎮' },
    { id: 'upcoming', label: 'Upcoming', icon: '📅' },
    { id: 'completed', label: 'Completed', icon: '✅' },
    { id: 'my-tournaments', label: 'My Tournaments', icon: '👤' },
    { id: 'rewards', label: 'Rewards', icon: '💎' }
  ];

  // WebSocket for real-time tournament updates
  useWebSocketBattle({
    onTournamentUpdate: (data) => {
      if (data.type === 'TOURNAMENT_UPDATE') {
        setTournaments(prev => 
          prev.map(tournament => 
            tournament.id === data.tournamentId 
              ? { ...tournament, ...data.updates } 
              : tournament
          )
        );
      }
      if (data.type === 'TOURNAMENT_START') {
        setTournaments(prev => [data.tournament, ...prev]);
      }
      if (data.type === 'TOURNAMENT_END') {
        setTournaments(prev => 
          prev.map(tournament => 
            tournament.id === data.tournamentId 
              ? { ...tournament, status: 'completed', ...data.updates } 
              : tournament
          )
        );
      }
    }
  });

  // Load tournaments data
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/tournaments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTournaments(data.tournaments || []);
        } else {
          // Fallback data
          setTournaments([
            {
              id: 1,
              name: 'Spring Championship 2026',
              status: 'active',
              type: 'battle',
              participants: 234,
              maxParticipants: 500,
              prizePool: 50000,
              startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
              endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
              entryFee: 1000,
              minLevel: 10,
              description: 'Intense battle tournament with massive rewards',
              rules: 'Single elimination, best of 3',
              rewards: ['50000 STG', 'Legendary Weapon', 'Exclusive Title'],
              avatar: '🏆'
            },
            {
              id: 2,
              name: 'Summer Showdown',
              status: 'upcoming',
              type: 'guild',
              participants: 0,
              maxParticipants: 100,
              prizePool: 25000,
              startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
              endTime: new Date(Date.now() + 60 * 60 * 60 * 1000),
              entryFee: 500,
              minLevel: 5,
              description: 'Guild-based tournament for team coordination',
              rules: 'Guild vs Guild, round robin',
              rewards: ['25000 STG', 'Guild Territory Bonus', 'Guild XP'],
              avatar: '👥'
            },
            {
              id: 3,
              name: 'Winter Warfare',
              status: 'completed',
              type: 'territory',
              participants: 150,
              maxParticipants: 300,
              prizePool: 30000,
              startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              entryFee: 750,
              minLevel: 8,
              description: 'Territory control tournament with strategic gameplay',
              rules: 'Territory capture, point system',
              rewards: ['30000 STG', 'Territory Control Bonus', 'Victory Badge'],
              avatar: '🗺️',
              winner: 'Elite Warriors',
              finalScore: 4500
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load tournaments:', error);
        toast.error('Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
  }, [user?.id]);

  // Load my tournaments
  useEffect(() => {
    const loadMyTournaments = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/tournaments/my`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMyTournaments(data.tournaments || []);
        } else {
          // Fallback data
          setMyTournaments([
            {
              id: 4,
              name: 'Spring Championship 2026',
              status: 'active',
              registered: true,
              rank: 42,
              score: 1250,
              matches: 3,
              wins: 2,
              losses: 1,
              avatar: '🏆'
            },
            {
              id: 5,
              name: 'Summer Showdown',
              status: 'upcoming',
              registered: false,
              rank: null,
              score: 0,
              matches: 0,
              wins: 0,
              losses: 0,
              avatar: '👥'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load my tournaments:', error);
      }
    };

    if (activeTab === 'my-tournaments') {
      loadMyTournaments();
    }
  }, [activeTab, user?.id]);

  // Load tournament history
  useEffect(() => {
    const loadTournamentHistory = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/tournaments/history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTournamentHistory(data.history || []);
        } else {
          // Fallback data
          setTournamentHistory([
            {
              id: 6,
              name: 'Fall Championship 2025',
              status: 'completed',
              participated: true,
              rank: 15,
              score: 890,
              prize: '1500 STG',
              date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              avatar: '🏆'
            },
            {
              id: 7,
              name: 'Autumn Arena',
              status: 'completed',
              participated: true,
              rank: 8,
              score: 1450,
              prize: '3000 STG',
              date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
              avatar: '⚔️'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load tournament history:', error);
      }
    };

    if (activeTab === 'completed') {
      loadTournamentHistory();
    }
  }, [activeTab, user?.id]);

  const registerForTournament = async (tournamentId) => {
    if (!user) {
      toast.error('Please login to register for tournaments');
      return;
    }

    const tournament = tournaments.find(t => t.id === tournamentId);
    if (user.level < tournament.minLevel) {
      toast.error(`Requires level ${tournament.minLevel}`);
      return;
    }

    if (user.stg_balance < tournament.entryFee) {
      toast.error(`Insufficient STG balance. Need ${tournament.entryFee} STG`);
      return;
    }

    setRegistering(true);
    hapticFeedback('impact');

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-id': user?.id || 'player123'
        },
        body: JSON.stringify({
          userId: user?.id,
          tournamentId: tournamentId,
          entryFee: tournament.entryFee
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`🎉 Successfully registered for ${tournament.name}!`);
        hapticFeedback('success');
        
        // Update UI
        setTournaments(prev => 
          prev.map(t => 
            t.id === tournamentId 
              ? { ...t, participants: t.participants + 1 }
              : t
          )
        );
      } else {
        toast.error(data.message || 'Failed to register for tournament');
      }
    } catch (error) {
      console.error('Tournament registration error:', error);
      toast.error('Failed to register for tournament');
    } finally {
      setRegistering(false);
    }
  };

  const ActiveCards = () => [
    {
      id: 'current-tournament',
      title: 'Current Tournament',
      icon: '🏆',
      content: (
        <CardContent>
          {tournaments.filter(t => t.status === 'active').map(tournament => (
            <div key={tournament.id} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                {tournament.name}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                {tournament.description}
              </div>
              <div style={{ fontSize: '11px', color: '#ff6b6b', marginBottom: '8px' }}>
                Type: {tournament.type} • {tournament.rules}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Level {tournament.minLevel}+ • {tournament.entryFee} STG entry
                </div>
                <TournamentBadge status={tournament.status}>
                  {tournament.status.toUpperCase()}
                </TournamentBadge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {tournament.participants}/{tournament.maxParticipants} participants
                </div>
                <PrizePool>{tournament.prizePool.toLocaleString()} STG</PrizePool>
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                Ends: {new Date(tournament.endTime).toLocaleString()}
              </div>
              <ActionButton
                onClick={() => registerForTournament(tournament.id)}
                disabled={registering}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {registering ? 'Registering...' : 'Register Now'}
              </ActionButton>
            </div>
          ))}
        </CardContent>
      )
    },
    {
      id: 'tournament-bracket',
      title: 'Tournament Bracket',
      icon: '🎯',
      content: (
        <CardContent>
          <BracketContainer>
            <BracketRound>
              <h4 style={{ color: '#ffffff', marginBottom: '12px' }}>Round 1</h4>
              <BracketMatch>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>Elite Warriors vs Shadow Guild</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Winner: Elite Warriors (2-1)
                </div>
              </BracketMatch>
              <BracketMatch>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>Phoenix Legion vs Thunder Clan</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Winner: Phoenix Legion (2-0)
                </div>
              </BracketMatch>
            </BracketRound>
            <BracketRound>
              <h4 style={{ color: '#ffffff', marginBottom: '12px' }}>Semi-Finals</h4>
              <BracketMatch>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>Elite Warriors vs Phoenix Legion</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  In Progress
                </div>
              </BracketMatch>
            </BracketRound>
            <BracketRound>
              <h4 style={{ color: '#ffffff', marginBottom: '12px' }}>Finals</h4>
              <BracketMatch>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>TBD</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  TBD
                </div>
              </BracketMatch>
            </BracketRound>
          </BracketContainer>
        </CardContent>
      )
    },
    {
      id: 'prize-pool',
      title: 'Prize Pool',
      icon: '💰',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Prize Pool</StatLabel>
            <StatValue>50,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>1st Place</StatLabel>
            <StatValue>25,000 STG + Legendary Weapon</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>2nd Place</StatLabel>
            <StatValue>15,000 STG + Epic Weapon</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>3rd Place</StatLabel>
            <StatValue>7,500 STG + Rare Weapon</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Participation Bonus</StatLabel>
            <StatValue>2,500 STG</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const getCardsForTab = () => {
    switch (activeTab) {
      case 'active': return ActiveCards();
      case 'upcoming': return ActiveCards();
      case 'completed': return ActiveCards();
      case 'my-tournaments': return ActiveCards();
      case 'rewards': return ActiveCards();
      default: return ActiveCards();
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div>
          <div style={{ color: '#ffffff' }}>Loading tournaments...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🏆 Tournaments</Title>
      
      <TabContainer>
        {tournamentTabs.map(tab => (
          <TabButton
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.icon} {tab.label}
          </TabButton>
        ))}
      </TabContainer>

      <CardContainer>
        {getCardsForTab().map(card => (
          <ModularCard
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: getCardsForTab().indexOf(card) * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <CardHeader>
              <CardIcon>{card.icon}</CardIcon>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            {card.content}
          </ModularCard>
        ))}
      </CardContainer>
    </Container>
  );
};

export default Tournaments;
