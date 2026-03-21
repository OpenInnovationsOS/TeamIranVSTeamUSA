import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { FadeIn } from './Transitions';
import { useTelegram } from '../hooks/useTelegram';
import { useAuthStore } from '../stores/authStore';
import AdminMonetizationTab from './AdminMonetizationTab';

const Container = styled.div`
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  padding-bottom: 100px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const LoginSection = styled.div`
  max-width: 400px;
  margin: 50px auto;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const LoginTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 20px;
  text-align: center;
`;

const LoginForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #9b59b6;
  }
`;

const LoginButton = styled(motion.button)`
  padding: 14px;
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  color: #9b59b6;
  margin-bottom: 16px;
`;

const ConfigForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
`;

const TextInput = styled.input`
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #9b59b6;
  }
`;

const NumberInput = styled.input`
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #9b59b6;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #9b59b6;
`;

const ActionButton = styled(motion.button)`
  padding: 12px 24px;
  background: linear-gradient(45deg, #9b59b6, #8e44ad);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TapBoostManager = styled.div`
  margin-top: 24px;
`;

const TapBoostForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const TapBoostList = styled.div`
  display: grid;
  gap: 16px;
`;

const TapBoostItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TapBoostInfo = styled.div`
  flex: 1;
`;

const TapBoostName = styled.h4`
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const TapBoostDetails = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
`;

const TapBoostActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditButton = styled(motion.button)`
  padding: 6px 12px;
  background: rgba(52, 152, 219, 0.2);
  color: #3498db;
  border: 1px solid #3498db;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const DeleteButton = styled(motion.button)`
  padding: 6px 12px;
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  padding: 10px 20px;
  background: ${props => props.active ? 'rgba(155, 89, 182, 0.3)' : 'transparent'};
  color: ${props => props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'};
  border: none;
  border-bottom: ${props => props.active ? '2px solid #9b59b6' : 'none'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  
  &:hover {
    color: #ffffff;
  }
`;

const ColorPicker = styled.input`
  width: 50px;
  height: 35px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  cursor: pointer;
`;

const RangeInput = styled.input`
  width: 100%;
  margin: 10px 0;
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #ffffff;
`;

const TapPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const PreviewButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.size}px;
  width: ${props => props.size * 2}px;
  height: ${props => props.size * 2}px;
  border-radius: ${props => props.borderRadius}px;
  background: ${props => props.gradient 
    ? `linear-gradient(45deg, ${props.gradientStart}, ${props.gradientEnd})` 
    : props.color};
  box-shadow: ${props => props.shadow ? '0 4px 15px rgba(0, 0, 0, 0.3)' : 'none'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [config, setConfig] = useState({
    ton_wallet_address: '',
    tap_boost_enabled: true,
    marketplace_enabled: true,
    commission_rate: 0.05,
    // Tap Button Appearance
    tap_button_text: '👆',
    tap_button_size: 80,
    tap_button_color: '#0088cc',
    tap_button_gradient_start: '#0088cc',
    tap_button_gradient_end: '#00a6ff',
    tap_button_border_radius: 50,
    tap_button_shadow: true,
    tap_animation_enabled: true,
    tap_sound_enabled: true
  });
  const [tapBoosts, setTapBoosts] = useState([]);
  const [newBoost, setNewBoost] = useState({
    name: '',
    description: '',
    duration: 1800,
    multiplier: 2,
    ton_price: 0.5,
    stg_price: 100,
    active: true
  });
  const [editingBoost, setEditingBoost] = useState(null);
  const { hapticFeedback } = useTelegram();

  // Check admin access on component mount
  useEffect(() => {
    if (isAdmin()) {
      setIsAuthenticated(true);
      // Load data for authenticated admin
      Promise.all([
        loadConfig(),
        loadTapBoosts()
      ]);
    }
  }, [isAdmin]);

  // Load admin configuration
  const loadConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/config', {
        headers: {
          'x-admin-key': adminKey
        }
      });
      const data = await response.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  // Load tap boost packages
  const loadTapBoosts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/tap-boosts', {
        headers: {
          'x-admin-key': adminKey
        }
      });
      const data = await response.json();
      if (data.success) {
        setTapBoosts(data.packages);
      }
    } catch (error) {
      console.error('Error loading tap boosts:', error);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    hapticFeedback('impact');

    try {
      const response = await fetch('http://localhost:3000/api/admin/stats', {
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        hapticFeedback('success');
        toast.success('Admin access granted!');
        
        // Load data
        await Promise.all([
          loadConfig(),
          loadTapBoosts()
        ]);
      } else {
        throw new Error('Invalid admin key');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid admin key');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  // Update configuration
  const updateConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    hapticFeedback('impact');

    try {
      const response = await fetch('http://localhost:3000/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      if (data.success) {
        hapticFeedback('success');
        toast.success('Configuration updated!');
      } else {
        throw new Error(data.error || 'Failed to update config');
      }
    } catch (error) {
      console.error('Config update error:', error);
      toast.error(error.message || 'Failed to update config');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  // Create tap boost package
  const createTapBoost = async (e) => {
    e.preventDefault();
    setLoading(true);
    hapticFeedback('impact');

    try {
      const response = await fetch('http://localhost:3000/api/admin/tap-boosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(newBoost)
      });

      const data = await response.json();
      if (data.success) {
        hapticFeedback('success');
        toast.success('Tap boost package created!');
        
        // Reset form
        setNewBoost({
          name: '',
          description: '',
          duration: 1800,
          multiplier: 2,
          ton_price: 0.5,
          stg_price: 100,
          active: true
        });
        
        // Reload tap boosts
        await loadTapBoosts();
      } else {
        throw new Error(data.error || 'Failed to create tap boost');
      }
    } catch (error) {
      console.error('Create tap boost error:', error);
      toast.error(error.message || 'Failed to create tap boost');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  // Update tap boost package
  const updateTapBoost = async (boostId) => {
    setLoading(true);
    hapticFeedback('impact');

    try {
      const response = await fetch(`http://localhost:3000/api/admin/tap-boosts/${boostId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(editingBoost)
      });

      const data = await response.json();
      if (data.success) {
        hapticFeedback('success');
        toast.success('Tap boost package updated!');
        
        setEditingBoost(null);
        await loadTapBoosts();
      } else {
        throw new Error(data.error || 'Failed to update tap boost');
      }
    } catch (error) {
      console.error('Update tap boost error:', error);
      toast.error(error.message || 'Failed to update tap boost');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  // Delete tap boost package
  const deleteTapBoost = async (boostId) => {
    if (!window.confirm('Are you sure you want to delete this tap boost package?')) {
      return;
    }

    setLoading(true);
    hapticFeedback('impact');

    try {
      const response = await fetch(`http://localhost:3000/api/admin/tap-boosts/${boostId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });

      const data = await response.json();
      if (data.success) {
        hapticFeedback('success');
        toast.success('Tap boost package deleted!');
        
        await loadTapBoosts();
      } else {
        throw new Error(data.error || 'Failed to delete tap boost');
      }
    } catch (error) {
      console.error('Delete tap boost error:', error);
      toast.error(error.message || 'Failed to delete tap boost');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <Container>
        <FadeIn>
          <LoginSection>
            <LoginTitle>� Access Denied</LoginTitle>
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '20px'
            }}>
              You don't have permission to access the admin dashboard.
            </div>
            <LoginButton
              onClick={() => window.history.back()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Go Back
            </LoginButton>
          </LoginSection>
        </FadeIn>
      </Container>
    );
  }

  return (
    <Container>
      <DashboardContainer>
        <FadeIn>
          <Header>
            <Title>👑 Super Admin Dashboard</Title>
            <Subtitle>Manage tap boost packages and configuration</Subtitle>
          </Header>

          {/* Tab Navigation */}
          <TabContainer>
            <Tab 
              active={activeTab === 'config'} 
              onClick={() => setActiveTab('config')}
            >
              ⚙️ Basic Config
            </Tab>
            <Tab 
              active={activeTab === 'tapbutton'} 
              onClick={() => setActiveTab('tapbutton')}
            >
              👆 Tap Button
            </Tab>
            <Tab 
              active={activeTab === 'tapboosts'} 
              onClick={() => setActiveTab('tapboosts')}
            >
              ⚡ Tap Boosts
            </Tab>
            <Tab 
              active={activeTab === 'monetization'} 
              onClick={() => setActiveTab('monetization')}
            >
              💰 Monetization
            </Tab>
          </TabContainer>

          {/* Basic Configuration Section */}
          {activeTab === 'config' && (
          <Section>
            <SectionTitle>⚙️ Basic Configuration</SectionTitle>
            <ConfigForm onSubmit={updateConfig}>
              <FormGroup>
                <Label>TON Wallet Address</Label>
                <TextInput
                  type="text"
                  placeholder="EQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.ton_wallet_address}
                  onChange={(e) => setConfig({...config, ton_wallet_address: e.target.value})}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Commission Rate</Label>
                <NumberInput
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.commission_rate}
                  onChange={(e) => setConfig({...config, commission_rate: parseFloat(e.target.value)})}
                  required
                />
              </FormGroup>
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.tap_boost_enabled}
                  onChange={(e) => setConfig({...config, tap_boost_enabled: e.target.checked})}
                />
                <Label>Enable Tap Boosts</Label>
              </CheckboxGroup>
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.marketplace_enabled}
                  onChange={(e) => setConfig({...config, marketplace_enabled: e.target.checked})}
                />
                <Label>Enable Marketplace</Label>
              </CheckboxGroup>
              
              <ActionButton
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Updating...' : 'Update Configuration'}
              </ActionButton>
            </ConfigForm>
          </Section>
          )}

          {/* Tap Button Customization Section */}
          {activeTab === 'tapbutton' && (
          <Section>
            <SectionTitle>👆 Tap Button Customization</SectionTitle>
            
            {/* Live Preview */}
            <TapPreview>
              <div>
                <h4 style={{color: '#ffffff', marginBottom: '10px'}}>Live Preview</h4>
                <PreviewButton 
                  size={config.tap_button_size}
                  borderRadius={config.tap_button_border_radius}
                  color={config.tap_button_color}
                  gradient={config.tap_button_gradient_start !== config.tap_button_gradient_end}
                  gradientStart={config.tap_button_gradient_start}
                  gradientEnd={config.tap_button_gradient_end}
                  shadow={config.tap_button_shadow}
                >
                  {config.tap_button_text}
                </PreviewButton>
              </div>
            </TapPreview>

            <ConfigForm onSubmit={updateConfig}>
              {/* Appearance Settings */}
              <h4 style={{color: '#9b59b6', margin: '20px 0 10px'}}>🎨 Appearance</h4>
              
              <FormGroup>
                <Label>Button Text/Emoji</Label>
                <TextInput
                  type="text"
                  placeholder="👆"
                  value={config.tap_button_text}
                  onChange={(e) => setConfig({...config, tap_button_text: e.target.value})}
                  maxLength={2}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Button Size (px)</Label>
                <RangeInput
                  type="range"
                  min="40"
                  max="120"
                  value={config.tap_button_size}
                  onChange={(e) => setConfig({...config, tap_button_size: parseInt(e.target.value)})}
                />
                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>
                  {config.tap_button_size}px
                </div>
              </FormGroup>
              
              <FormGroup>
                <Label>Border Radius (px)</Label>
                <RangeInput
                  type="range"
                  min="0"
                  max="50"
                  value={config.tap_button_border_radius}
                  onChange={(e) => setConfig({...config, tap_button_border_radius: parseInt(e.target.value)})}
                />
                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>
                  {config.tap_button_border_radius}px
                </div>
              </FormGroup>
              
              <FormGroup style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                <div style={{flex: 1}}>
                  <Label>Primary Color</Label>
                  <ColorPicker
                    type="color"
                    value={config.tap_button_color}
                    onChange={(e) => setConfig({...config, tap_button_color: e.target.value})}
                  />
                </div>
                
                <div style={{flex: 1}}>
                  <Label>Gradient Start</Label>
                  <ColorPicker
                    type="color"
                    value={config.tap_button_gradient_start}
                    onChange={(e) => setConfig({...config, tap_button_gradient_start: e.target.value})}
                  />
                </div>
                
                <div style={{flex: 1}}>
                  <Label>Gradient End</Label>
                  <ColorPicker
                    type="color"
                    value={config.tap_button_gradient_end}
                    onChange={(e) => setConfig({...config, tap_button_gradient_end: e.target.value})}
                  />
                </div>
              </FormGroup>
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.tap_button_shadow}
                  onChange={(e) => setConfig({...config, tap_button_shadow: e.target.checked})}
                />
                <Label>Enable Shadow Effect</Label>
              </CheckboxGroup>

              {/* Behavior Settings */}
              <h4 style={{color: '#9b59b6', margin: '20px 0 10px'}}>⚡ Behavior</h4>
              
              <FormGroup style={{display: 'flex', gap: '20px'}}>
                <div style={{flex: 1}}>
                  <Label>Min Reward (STG)</Label>
                  <NumberInput
                    type="number"
                    min="0"
                    value={config.base_reward_min}
                    onChange={(e) => setConfig({...config, base_reward_min: parseInt(e.target.value)})}
                  />
                </div>
                
                <div style={{flex: 1}}>
                  <Label>Max Reward (STG)</Label>
                  <NumberInput
                    type="number"
                    min="1"
                    value={config.base_reward_max}
                    onChange={(e) => setConfig({...config, base_reward_max: parseInt(e.target.value)})}
                  />
                </div>
              </FormGroup>
              
              <FormGroup>
                <Label>Reward Notification Frequency</Label>
                <SelectInput
                  value={config.reward_notification_frequency}
                  onChange={(e) => setConfig({...config, reward_notification_frequency: parseInt(e.target.value)})}
                >
                  <option value={1}>Every Tap</option>
                  <option value={5}>Every 5 Taps</option>
                  <option value={10}>Every 10 Taps</option>
                  <option value={25}>Every 25 Taps</option>
                  <option value={50}>Every 50 Taps</option>
                  <option value={100}>Every 100 Taps</option>
                </SelectInput>
              </FormGroup>
              
              <FormGroup>
                <Label>Tap Rate Limit (taps/minute)</Label>
                <RangeInput
                  type="range"
                  min="10"
                  max="300"
                  value={config.tap_rate_limit}
                  onChange={(e) => setConfig({...config, tap_rate_limit: parseInt(e.target.value)})}
                />
                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>
                  {config.tap_rate_limit} taps/min
                </div>
              </FormGroup>
              
              <FormGroup>
                <Label>Tap Cooldown (ms)</Label>
                <RangeInput
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={config.tap_cooldown_ms}
                  onChange={(e) => setConfig({...config, tap_cooldown_ms: parseInt(e.target.value)})}
                />
                <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>
                  {config.tap_cooldown_ms}ms
                </div>
              </FormGroup>

              {/* Effects Settings */}
              <h4 style={{color: '#9b59b6', margin: '20px 0 10px'}}>✨ Effects</h4>
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.haptic_feedback_enabled}
                  onChange={(e) => setConfig({...config, haptic_feedback_enabled: e.target.checked})}
                />
                <Label>Enable Haptic Feedback</Label>
              </CheckboxGroup>
              
              {config.haptic_feedback_enabled && (
                <FormGroup>
                  <Label>Haptic Type</Label>
                  <SelectInput
                    value={config.haptic_feedback_type}
                    onChange={(e) => setConfig({...config, haptic_feedback_type: e.target.value})}
                  >
                    <option value="impact">Impact</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </SelectInput>
                </FormGroup>
              )}
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.tap_animation_enabled}
                  onChange={(e) => setConfig({...config, tap_animation_enabled: e.target.checked})}
                />
                <Label>Enable Tap Animation</Label>
              </CheckboxGroup>
              
              {config.tap_animation_enabled && (
                <FormGroup>
                  <Label>Animation Type</Label>
                  <SelectInput
                    value={config.tap_animation_type}
                    onChange={(e) => setConfig({...config, tap_animation_type: e.target.value})}
                  >
                    <option value="scale">Scale</option>
                    <option value="rotate">Rotate</option>
                    <option value="bounce">Bounce</option>
                    <option value="pulse">Pulse</option>
                    <option value="shake">Shake</option>
                  </SelectInput>
                </FormGroup>
              )}
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.reward_popup_enabled}
                  onChange={(e) => setConfig({...config, reward_popup_enabled: e.target.checked})}
                />
                <Label>Enable Reward Popups</Label>
              </CheckboxGroup>
              
              {config.reward_popup_enabled && (
                <FormGroup>
                  <Label>Popup Duration (ms)</Label>
                  <RangeInput
                    type="range"
                    min="500"
                    max="5000"
                    step="500"
                    value={config.reward_popup_duration}
                    onChange={(e) => setConfig({...config, reward_popup_duration: parseInt(e.target.value)})}
                  />
                  <div style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px'}}>
                    {config.reward_popup_duration}ms
                  </div>
                </FormGroup>
              )}
              
              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  checked={config.particle_effects_enabled}
                  onChange={(e) => setConfig({...config, particle_effects_enabled: e.target.checked})}
                />
                <Label>Enable Particle Effects</Label>
              </CheckboxGroup>
              
              {config.particle_effects_enabled && (
                <FormGroup>
                  <Label>Particle Color</Label>
                  <ColorPicker
                    type="color"
                    value={config.particle_color}
                    onChange={(e) => setConfig({...config, particle_color: e.target.value})}
                  />
                </FormGroup>
              )}
              
              <ActionButton
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Updating...' : 'Update Tap Button'}
              </ActionButton>
            </ConfigForm>
          </Section>
          )}

          {/* Monetization Section */}
          {activeTab === 'monetization' && (
            <Section>
              <AdminMonetizationTab />
            </Section>
          )}

          {/* Tap Boost Manager */}
          {activeTab === 'tapboosts' && (
          <Section>
            <SectionTitle>⚡ Tap Boost Packages</SectionTitle>
            
            <TapBoostManager>
              <SectionTitle style={{fontSize: '16px', marginBottom: '12px'}}>Create New Package</SectionTitle>
              <TapBoostForm onSubmit={createTapBoost}>
                <FormGroup>
                  <Label>Package Name</Label>
                  <TextInput
                    type="text"
                    placeholder="Basic Tap Boost"
                    value={newBoost.name}
                    onChange={(e) => setNewBoost({...newBoost, name: e.target.value})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Description</Label>
                  <TextInput
                    type="text"
                    placeholder="2x tap power for 30 minutes"
                    value={newBoost.description}
                    onChange={(e) => setNewBoost({...newBoost, description: e.target.value})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Duration (seconds)</Label>
                  <NumberInput
                    type="number"
                    value={newBoost.duration}
                    onChange={(e) => setNewBoost({...newBoost, duration: parseInt(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Multiplier</Label>
                  <NumberInput
                    type="number"
                    step="0.5"
                    value={newBoost.multiplier}
                    onChange={(e) => setNewBoost({...newBoost, multiplier: parseFloat(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>TON Price</Label>
                  <NumberInput
                    type="number"
                    step="0.1"
                    value={newBoost.ton_price}
                    onChange={(e) => setNewBoost({...newBoost, ton_price: parseFloat(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>STG Price</Label>
                  <NumberInput
                    type="number"
                    value={newBoost.stg_price}
                    onChange={(e) => setNewBoost({...newBoost, stg_price: parseInt(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <ActionButton
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Creating...' : 'Create Package'}
                </ActionButton>
              </TapBoostForm>
              
              <SectionTitle style={{fontSize: '16px', marginBottom: '12px'}}>Existing Packages</SectionTitle>
              <TapBoostList>
                {tapBoosts.map((boost) => (
                  <TapBoostItem key={boost.id}>
                    <TapBoostInfo>
                      <TapBoostName>{boost.name}</TapBoostName>
                      <TapBoostDetails>
                        {boost.multiplier}x for {boost.duration/60}min | 
                        💎 {boost.ton_price} TON | 💰 {boost.stg_price} STG
                      </TapBoostDetails>
                    </TapBoostInfo>
                    <TapBoostActions>
                      <EditButton
                        onClick={() => setEditingBoost(boost)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Edit
                      </EditButton>
                      <DeleteButton
                        onClick={() => deleteTapBoost(boost.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Delete
                      </DeleteButton>
                    </TapBoostActions>
                  </TapBoostItem>
                ))}
              </TapBoostList>
            </TapBoostManager>
          </Section>
          )}

          {/* Edit Modal */}
          {editingBoost && (
            <Section>
              <SectionTitle>✏️ Edit Package: {editingBoost.name}</SectionTitle>
              <ConfigForm onSubmit={(e) => {
                e.preventDefault();
                updateTapBoost(editingBoost.id);
              }}>
                <FormGroup>
                  <Label>Package Name</Label>
                  <TextInput
                    type="text"
                    value={editingBoost.name}
                    onChange={(e) => setEditingBoost({...editingBoost, name: e.target.value})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Description</Label>
                  <TextInput
                    type="text"
                    value={editingBoost.description}
                    onChange={(e) => setEditingBoost({...editingBoost, description: e.target.value})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Duration (seconds)</Label>
                  <NumberInput
                    type="number"
                    value={editingBoost.duration}
                    onChange={(e) => setEditingBoost({...editingBoost, duration: parseInt(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>Multiplier</Label>
                  <NumberInput
                    type="number"
                    step="0.5"
                    value={editingBoost.multiplier}
                    onChange={(e) => setEditingBoost({...editingBoost, multiplier: parseFloat(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>TON Price</Label>
                  <NumberInput
                    type="number"
                    step="0.1"
                    value={editingBoost.ton_price}
                    onChange={(e) => setEditingBoost({...editingBoost, ton_price: parseFloat(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>STG Price</Label>
                  <NumberInput
                    type="number"
                    value={editingBoost.stg_price}
                    onChange={(e) => setEditingBoost({...editingBoost, stg_price: parseInt(e.target.value)})}
                    required
                  />
                </FormGroup>
                
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    checked={editingBoost.active}
                    onChange={(e) => setEditingBoost({...editingBoost, active: e.target.checked})}
                  />
                  <Label>Active</Label>
                </CheckboxGroup>
                
                <div style={{display: 'flex', gap: '12px'}}>
                  <ActionButton
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? 'Updating...' : 'Update Package'}
                  </ActionButton>
                  <ActionButton
                    type="button"
                    onClick={() => setEditingBoost(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </ActionButton>
                </div>
              </ConfigForm>
            </Section>
          )}
        </FadeIn>
      </DashboardContainer>
    </Container>
  );
}

export default AdminDashboard;
