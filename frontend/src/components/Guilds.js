// Enhanced Guilds Component - Multi-Card & Multi-Tab System
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
  background: linear-gradient(45deg, #845ef7, #c084fc);
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
    box-shadow: 0 4px 12px rgba(132, 94, 247, 0.3);
  }
  
  &.active {
    background: linear-gradient(45deg, #845ef7, #c084fc);
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
    box-shadow: 0 10px 30px rgba(132, 94, 247, 0.3);
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
  color: #845ef7;
  font-weight: bold;
  font-size: 14px;
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #845ef7, #c084fc);
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
    box-shadow: 0 4px 12px rgba(132, 94, 247, 0.3);
  }
`;

const GuildListCard = styled.div`
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(132, 94, 247, 0.5);
    border-radius: 3px;
  }
`;

const GuildItem = styled.div`
  display: flex;
  justify-content: space-between;
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

const GuildInfo = styled.div`
  flex: 1;
`;

const GuildName = styled.div`
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 4px;
`;

const GuildDetails = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const GuildStats = styled.div`
  text-align: right;
`;

const GuildLevel = styled.div`
  font-size: 12px;
  color: #845ef7;
  font-weight: bold;
`;

const GuildMembers = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
`;

const Guilds = () => {
  const { user } = useAuthStore();
  const { hapticFeedback } = useTelegram();
  const [activeTab, setActiveTab] = useState('guilds');
  const [loading, setLoading] = useState(true);
  const [guilds, setGuilds] = useState([]);
  const [selectedGuild, setSelectedGuild] = useState(null);
  const [guildActivities, setGuildActivities] = useState([]);
  const [guildMembers, setGuildMembers] = useState([]);
  const [guildWars, setGuildWars] = useState([]);

  const guildTabs = [
    { id: 'guilds', label: 'Guilds', icon: '👥' },
    { id: 'activities', label: 'Activities', icon: '🎯' },
    { id: 'members', label: 'Members', icon: '👤' },
    { id: 'wars', label: 'Wars', icon: '⚔️' },
    { id: 'rewards', label: 'Rewards', icon: '💎' }
  ];

  // WebSocket for real-time guild updates
  useWebSocketBattle({
    onGuildUpdate: (data) => {
      if (data.type === 'GUILD_UPDATE') {
        setGuilds(prev => 
          prev.map(guild => 
            guild.id === data.guildId ? { ...guild, ...data.updates } : guild
          )
        );
      }
      if (data.type === 'GUILD_ACTIVITY') {
        setGuildActivities(prev => [data.activity, ...prev].slice(0, 10));
      }
      if (data.type === 'GUILD_WAR_UPDATE') {
        setGuildWars(prev => 
          prev.map(war => 
            war.id === data.warId ? { ...war, ...data.updates } : war
          )
        );
      }
    }
  });

  // Load guilds data
  useEffect(() => {
    const loadGuilds = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/guilds`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-faction': user?.faction || 'iran',
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setGuilds(data.guilds || []);
        } else {
          // Fallback data
          setGuilds([
            {
              id: 'elite_warriors',
              name: 'Elite Warriors',
              level: 15,
              members: 45,
              maxMembers: 50,
              power: 12450,
              faction: 'usa',
              description: 'Elite guild focused on strategic warfare',
              leader: 'CommanderAlpha',
              requirements: 'Level 10+',
              benefits: '+20% battle rewards, exclusive weapons'
            },
            {
              id: 'phoenix_rising',
              name: 'Phoenix Rising',
              level: 12,
              members: 38,
              maxMembers: 50,
              power: 10200,
              faction: 'iran',
              description: 'Rising from ashes, stronger than ever',
              leader: 'PhoenixLeader',
              requirements: 'Level 8+',
              benefits: '+15% territory bonuses, guild shop'
            },
            {
              id: 'shadow_legion',
              name: 'Shadow Legion',
              level: 18,
              members: 49,
              maxMembers: 50,
              power: 15600,
              faction: 'usa',
              description: 'Stealth and precision warfare specialists',
              leader: 'ShadowCommander',
              requirements: 'Level 15+',
              benefits: '+25% attack power, stealth missions'
            },
            {
              id: 'desert_eagles',
              name: 'Desert Eagles',
              level: 14,
              members: 42,
              maxMembers: 50,
              power: 11800,
              faction: 'iran',
              description: 'Masters of desert warfare tactics',
              leader: 'EagleEye',
              requirements: 'Level 12+',
              benefits: '+20% defense in desert territories'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load guilds:', error);
        toast.error('Failed to load guilds');
      } finally {
        setLoading(false);
      }
    };

    loadGuilds();
  }, [user?.faction, user?.id]);

  // Load guild activities
  useEffect(() => {
    const loadGuildActivities = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/guilds/activities`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setGuildActivities(data.activities || []);
        } else {
          // Fallback data
          setGuildActivities([
            {
              id: 1,
              type: 'war',
              title: 'Guild War: Elite Warriors vs Shadow Legion',
              description: 'Intense battle for territory control',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              participants: 89,
              reward: '5000 STG'
            },
            {
              id: 2,
              type: 'raid',
              title: 'Successful Raid on Enemy Territory',
              description: 'Guild members successfully captured enemy territory',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
              participants: 12,
              reward: '2500 STG'
            },
            {
              id: 3,
              type: 'training',
              title: 'Guild Training Session',
              description: 'Weekly training session for all members',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
              participants: 35,
              reward: '1000 STG'
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load guild activities:', error);
      }
    };

    if (activeTab === 'activities') {
      loadGuildActivities();
    }
  }, [activeTab, user?.id]);

  // Load guild members
  useEffect(() => {
    const loadGuildMembers = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/guilds/members`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setGuildMembers(data.members || []);
        } else {
          // Fallback data
          setGuildMembers([
            {
              id: 1,
              name: 'CommanderAlpha',
              role: 'Leader',
              level: 25,
              power: 3500,
              contribution: 12500,
              status: 'online',
              lastSeen: new Date()
            },
            {
              id: 2,
              name: 'WarriorBeta',
              role: 'Officer',
              level: 22,
              power: 2800,
              contribution: 8900,
              status: 'online',
              lastSeen: new Date()
            },
            {
              id: 3,
              name: 'StrategistGamma',
              role: 'Member',
              level: 18,
              power: 2100,
              contribution: 5600,
              status: 'offline',
              lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000)
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load guild members:', error);
      }
    };

    if (activeTab === 'members') {
      loadGuildMembers();
    }
  }, [activeTab, user?.id]);

  // Load guild wars
  useEffect(() => {
    const loadGuildWars = async () => {
      try {
        const response = await fetch(`${API_CONFIG.baseURL}/api/guilds/wars`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'x-user-id': user?.id || 'player123'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setGuildWars(data.wars || []);
        } else {
          // Fallback data
          setGuildWars([
            {
              id: 1,
              guild1: 'Elite Warriors',
              guild2: 'Shadow Legion',
              status: 'active',
              startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
              endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
              territory: 'New York',
              prizePool: 25000,
              participants: 89,
              guild1Score: 1250,
              guild2Score: 1180
            },
            {
              id: 2,
              guild1: 'Phoenix Rising',
              guild2: 'Desert Eagles',
              status: 'preparing',
              startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
              endTime: new Date(Date.now() + 60 * 60 * 60 * 1000),
              territory: 'Tehran',
              prizePool: 18000,
              participants: 78,
              guild1Score: 0,
              guild2Score: 0
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load guild wars:', error);
      }
    };

    if (activeTab === 'wars') {
      loadGuildWars();
    }
  }, [activeTab, user?.id]);

  const joinGuild = async (guildId) => {
    if (!user) {
      toast.error('Please login to join a guild');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/api/guilds/${guildId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'x-user-faction': user?.faction || 'iran',
          'x-user-id': user?.id || 'player123'
        },
        body: JSON.stringify({
          userId: user?.id,
          faction: user?.faction
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`🎉 Successfully joined ${data.guildName}!`);
        hapticFeedback('success');
        
        // Update UI
        setGuilds(prev => 
          prev.map(guild => 
            guild.id === guildId 
              ? { ...guild, members: guild.members + 1 }
              : guild
          )
        );
      } else {
        toast.error(data.message || 'Failed to join guild');
      }
    } catch (error) {
      console.error('Guild join error:', error);
      toast.error('Failed to join guild');
    }
  };

  const GuildsCards = () => [
    {
      id: 'guild-list',
      title: 'Available Guilds',
      icon: '👥',
      content: (
        <CardContent>
          <GuildListCard>
            {guilds.map(guild => (
              <GuildItem
                key={guild.id}
                onClick={() => {
                  setSelectedGuild(guild);
                  hapticFeedback('impact');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GuildInfo>
                  <GuildName>{guild.name}</GuildName>
                  <GuildDetails>
                    {guild.faction.toUpperCase()} • Level {guild.level} • {guild.description}
                  </GuildDetails>
                </GuildInfo>
                <GuildStats>
                  <GuildLevel>Lv.{guild.level}</GuildLevel>
                  <GuildMembers>{guild.members}/{guild.maxMembers}</GuildMembers>
                </GuildStats>
              </GuildItem>
            ))}
          </GuildListCard>
          {selectedGuild && (
            <ActionButton
              onClick={() => joinGuild(selectedGuild.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join {selectedGuild.name}
            </ActionButton>
          )}
        </CardContent>
      )
    },
    {
      id: 'guild-info',
      title: 'Guild Information',
      icon: '📊',
      content: (
        <CardContent>
          {selectedGuild ? (
            <>
              <StatRow>
                <StatLabel>Guild Name</StatLabel>
                <StatValue>{selectedGuild.name}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Leader</StatLabel>
                <StatValue>{selectedGuild.leader}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Power Level</StatLabel>
                <StatValue>{selectedGuild.power.toLocaleString()}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Requirements</StatLabel>
                <StatValue>{selectedGuild.requirements}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Benefits</StatLabel>
                <StatValue>{selectedGuild.benefits}</StatValue>
              </StatRow>
            </>
          ) : (
            <p>Select a guild to view detailed information</p>
          )}
        </CardContent>
      )
    },
    {
      id: 'guild-stats',
      title: 'Guild Statistics',
      icon: '📈',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Guilds</StatLabel>
            <StatValue>{guilds.length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Guild</StatLabel>
            <StatValue>None</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Members</StatLabel>
            <StatValue>{guilds.reduce((sum, guild) => sum + guild.members, 0)}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Power</StatLabel>
            <StatValue>
              {guilds.length > 0 
                ? Math.round(guilds.reduce((sum, guild) => sum + guild.power, 0) / guilds.length).toLocaleString()
                : '0'
              }
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Active Wars</StatLabel>
            <StatValue>{guildWars.filter(war => war.status === 'active').length}</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const ActivitiesCards = () => [
    {
      id: 'recent-activities',
      title: 'Recent Activities',
      icon: '🎯',
      content: (
        <CardContent>
          {guildActivities.map(activity => (
            <div key={activity.id} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                {activity.title}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                {activity.description}
              </div>
              <div style={{ fontSize: '11px', color: '#845ef7' }}>
                {new Date(activity.timestamp).toLocaleString()} • {activity.participants} participants • {activity.reward}
              </div>
            </div>
          ))}
        </CardContent>
      )
    },
    {
      id: 'activity-stats',
      title: 'Activity Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Activities</StatLabel>
            <StatValue>{guildActivities.length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Wars Participated</StatLabel>
            <StatValue>{guildActivities.filter(a => a.type === 'war').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Raids Completed</StatLabel>
            <StatValue>{guildActivities.filter(a => a.type === 'raid').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Training Sessions</StatLabel>
            <StatValue>{guildActivities.filter(a => a.type === 'training').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Rewards</StatLabel>
            <StatValue>
              {guildActivities.reduce((sum, a) => sum + parseInt(a.reward.replace(/[^0-9]/g, '') || 0), 0).toLocaleString()} STG
            </StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const MembersCards = () => [
    {
      id: 'guild-members',
      title: 'Guild Members',
      icon: '👤',
      content: (
        <CardContent>
          {guildMembers.map(member => (
            <div key={member.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    {member.role} • Level {member.level}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#845ef7' }}>
                    {member.power.toLocaleString()} Power
                  </div>
                  <div style={{ fontSize: '11px', color: member.status === 'online' ? '#51cf66' : '#ff6b6b' }}>
                    {member.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )
    },
    {
      id: 'member-stats',
      title: 'Member Statistics',
      icon: '📈',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Total Members</StatLabel>
            <StatValue>{guildMembers.length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Online Now</StatLabel>
            <StatValue>{guildMembers.filter(m => m.status === 'online').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Average Level</StatLabel>
            <StatValue>
              {guildMembers.length > 0 
                ? Math.round(guildMembers.reduce((sum, m) => sum + m.level, 0) / guildMembers.length)
                : 0
              }
            </StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Power</StatLabel>
            <StatValue>{guildMembers.reduce((sum, m) => sum + m.power, 0).toLocaleString()}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Contribution</StatLabel>
            <StatValue>{guildMembers.reduce((sum, m) => sum + m.contribution, 0).toLocaleString()} STG</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const WarsCards = () => [
    {
      id: 'active-wars',
      title: 'Guild Wars',
      icon: '⚔️',
      content: (
        <CardContent>
          {guildWars.map(war => (
            <div key={war.id} style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
                {war.guild1} vs {war.guild2}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                Territory: {war.territory} • Prize Pool: {war.prizePool.toLocaleString()} STG
              </div>
              <div style={{ fontSize: '11px', color: '#845ef7', marginBottom: '8px' }}>
                Status: {war.status} • Participants: {war.participants}
              </div>
              {war.status === 'active' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <div style={{ color: '#00a6ff' }}>{war.guild1}: {war.guild1Score}</div>
                  <div style={{ color: '#ff6b6b' }}>{war.guild2}: {war.guild2Score}</div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )
    },
    {
      id: 'war-stats',
      title: 'War Statistics',
      icon: '📊',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Active Wars</StatLabel>
            <StatValue>{guildWars.filter(w => w.status === 'active').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Preparing Wars</StatLabel>
            <StatValue>{guildWars.filter(w => w.status === 'preparing').length}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Prize Pools</StatLabel>
            <StatValue>{guildWars.reduce((sum, w) => sum + w.prizePool, 0).toLocaleString()} STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Participants</StatLabel>
            <StatValue>{guildWars.reduce((sum, w) => sum + w.participants, 0)}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Your Contribution</StatLabel>
            <StatValue>0 STG</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const RewardsCards = () => [
    {
      id: 'guild-rewards',
      title: 'Guild Rewards',
      icon: '💎',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Daily Rewards</StatLabel>
            <StatValue>500 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>War Bonuses</StatLabel>
            <StatValue>2,500 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Territory Bonuses</StatLabel>
            <StatValue>1,200 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Member Contributions</StatLabel>
            <StatValue>3,800 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Total Earned</StatLabel>
            <StatValue>8,000 STG</StatValue>
          </StatRow>
          <ActionButton
            onClick={() => {
              toast.success('🎉 Guild rewards claimed!');
              hapticFeedback('success');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim Rewards
          </ActionButton>
        </CardContent>
      )
    },
    {
      id: 'reward-history',
      title: 'Reward History',
      icon: '📜',
      content: (
        <CardContent>
          <StatRow>
            <StatLabel>Last Claim</StatLabel>
            <StatValue>2 hours ago</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>This Week</StatLabel>
            <StatValue>12,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>This Month</StatLabel>
            <StatValue>48,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>All Time</StatLabel>
            <StatValue>125,000 STG</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Next Claim</StatLabel>
            <StatValue>22 hours</StatValue>
          </StatRow>
        </CardContent>
      )
    }
  ];

  const getCardsForTab = () => {
    switch (activeTab) {
      case 'guilds': return GuildsCards();
      case 'activities': return ActivitiesCards();
      case 'members': return MembersCards();
      case 'wars': return WarsCards();
      case 'rewards': return RewardsCards();
      default: return GuildsCards();
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>👥</div>
          <div style={{ color: '#ffffff' }}>Loading guilds...</div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>👥 Guilds</Title>
      
      <TabContainer>
        {guildTabs.map(tab => (
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

export default Guilds;
