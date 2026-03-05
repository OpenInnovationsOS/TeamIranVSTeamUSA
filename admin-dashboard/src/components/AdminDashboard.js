import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Row, Col, Statistic, Table, Button, Badge, Avatar, Progress, Tabs, List, Space, Typography, Alert, Modal, Form, Input, Select, DatePicker, Switch } from 'antd';
import { UserOutlined, TrophyOutlined, DollarOutlined, ThunderboltOutlined, TeamOutlined, GlobalOutlined, SettingOutlined, BarChartOutlined, BellOutlined, SafetyOutlined, DatabaseOutlined, ApiOutlined, RocketOutlined } from '@ant-design/icons';
import { Line, Pie, Column } from '@ant-design/plots';
import styled from 'styled-components';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const DashboardContainer = styled.div`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

const StatCard = styled(Card)`
  .ant-statistic-content {
    color: #1890ff;
  }
  .ant-statistic-title {
    color: #666;
  }
`;

const AdminDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [battles, setBattles] = useState([]);
  const [gameStats, setGameStats] = useState({
    totalUsers: 1247,
    activeUsers: 834,
    totalBattles: 8234,
    totalStgTokens: 1250000,
    iranPlayers: 623,
    usaPlayers: 624,
    iranWins: 4123,
    usaWins: 4111
  });

  // Mock data for demonstration
  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setGameStats(prev => ({
        ...prev,
        activeUsers: Math.floor(Math.random() * 200) + 700,
        totalBattles: prev.totalBattles + Math.floor(Math.random() * 5),
        totalStgTokens: prev.totalStgTokens + Math.floor(Math.random() * 1000)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const userColumns = [
    {
      title: 'Player',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>Level {record.level}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Faction',
      dataIndex: 'faction',
      key: 'faction',
      render: (faction) => (
        <Badge color={faction === 'iran' ? 'green' : 'blue'} text={faction === 'iran' ? '🇮🇷 Iran' : '🇺🇸 USA'} />
      )
    },
    {
      title: 'STG Tokens',
      dataIndex: 'stgTokens',
      key: 'stgTokens',
      render: (tokens) => <Text strong>{tokens.toLocaleString()}</Text>
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      render: (rate) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate > 70 ? 'success' : rate > 50 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date) => <Text type="secondary">{date}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'online' ? 'success' : 'default'} 
          text={status} 
        />
      )
    }
  ];

  const battleColumns = [
    {
      title: 'Battle ID',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: 'Players',
      dataIndex: 'players',
      key: 'players',
      render: (players) => (
        <Space>
          <Text>{players[0]}</Text>
          <Text type="secondary">vs</Text>
          <Text>{players[1]}</Text>
        </Space>
      )
    },
    {
      title: 'Winner',
      dataIndex: 'winner',
      key: 'winner',
      render: (winner) => <Text strong>{winner}</Text>
    },
    {
      title: 'Stake',
      dataIndex: 'stake',
      key: 'stake',
      render: (stake) => <Text strong>{stake} STG</Text>
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time'
    }
  ];

  const menuItems = [
    {
      key: 'overview',
      icon: <BarChartOutlined />,
      label: 'Overview'
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'User Management'
    },
    {
      key: 'battles',
      icon: <TrophyOutlined />,
      label: 'Battle Analytics'
    },
    {
      key: 'economy',
      icon: <DollarOutlined />,
      label: 'Economy Management'
    },
    {
      key: 'territory',
      icon: <GlobalOutlined />,
      label: 'Territory Control'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Game Settings'
    },
    {
      key: 'system',
      icon: <DatabaseOutlined />,
      label: 'System Health'
    }
  ];

  const renderOverview = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard>
            <Statistic
              title="Total Users"
              value={gameStats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard>
            <Statistic
              title="Active Users"
              value={gameStats.activeUsers}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard>
            <Statistic
              title="Total Battles"
              value={gameStats.totalBattles}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </StatCard>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <StatCard>
            <Statistic
              title="STG Tokens in Circulation"
              value={gameStats.totalStgTokens}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </StatCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Faction Distribution">
            <Pie
              data={[
                { type: '🇮🇷 Iran', value: gameStats.iranPlayers },
                { type: '🇺🇸 USA', value: gameStats.usaPlayers }
              ]}
              angleField={90}
              colorField={['#52c41a', '#1890ff']}
              radius={0.8}
              label={{
                type: 'outer',
                content: '{name}: {value}'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Battle Performance">
            <Column
              data={[
                { faction: '🇮🇷 Iran', wins: gameStats.iranWins },
                { faction: '🇺🇸 USA', wins: gameStats.usaWins }
              ]}
              xField="faction"
              yField="wins"
              color={['#52c41a', '#1890ff']}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Real-time Activity">
            <Line
              data={[
                { time: '00:00', users: 800, battles: 45 },
                { time: '04:00', users: 650, battles: 32 },
                { time: '08:00', users: 1200, battles: 78 },
                { time: '12:00', users: 980, battles: 65 },
                { time: '16:00', users: 1100, battles: 72 },
                { time: '20:00', users: 834, battles: 58 }
              ]}
              xField="time"
              yField="users"
              series={[
                { field: 'users', name: 'Active Users' },
                { field: 'battles', name: 'Battles/Hour' }
              ]}
              smooth
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderUserManagement = () => (
    <div>
      <Card title="User Management" extra={
        <Space>
          <Button type="primary">Add User</Button>
          <Button>Export</Button>
        </Space>
      }>
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );

  const renderBattleAnalytics = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="Battle Statistics">
            <Statistic title="Today's Battles" value={234} />
            <Statistic title="Average Duration" value="3m 24s" />
            <Statistic title="Total STG Wagered" value={45678} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Recent Battles">
            <Table
              columns={battleColumns}
              dataSource={battles}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderEconomyManagement = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Token Supply Management">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Total WIN Token Supply</Text>
                <Progress percent={75} status="active" />
              </div>
              <div>
                <Text strong>STG Tokens Minted Today</Text>
                <Progress percent={45} status="active" />
              </div>
              <div>
                <Text strong>Treasury Balance</Text>
                <Progress percent={90} status="active" />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Economy Controls">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Daily STG Reward</Text>
                <Input type="number" defaultValue="100" />
              </div>
              <div>
                <Text>Battle Minimum Stake</Text>
                <Input type="number" defaultValue="50" />
              </div>
              <div>
                <Text>Energy Regeneration Rate</Text>
                <Select defaultValue="1 per minute" style={{ width: '100%' }}>
                  <Select.Option value="1 per minute">1 per minute</Select.Option>
                  <Select.Option value="2 per minute">2 per minute</Select.Option>
                  <Select.Option value="5 per minute">5 per minute</Select.Option>
                </Select>
              </div>
              <Button type="primary" block>Save Settings</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderSettings = () => (
    <div>
      <Card title="Game Settings">
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Game Mode">
                <Select defaultValue="p2e" style={{ width: '100%' }}>
                  <Select.Option value="p2e">Play-to-Earn</Select.Option>
                  <Select.Option value="pvp">Player vs Player</Select.Option>
                  <Select.Option value="tournament">Tournament Mode</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Energy System">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item label="Daily Missions">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Territory Control">
                <Switch defaultChecked />
              </Form.Item>
              <Form.Item label="Leaderboard Reset">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Maintenance Mode">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save All Settings</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const renderSystemHealth = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Server Performance">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>CPU Usage</Text>
                <Progress percent={45} status="active" />
              </div>
              <div>
                <Text>Memory Usage</Text>
                <Progress percent={67} status="active" />
              </div>
              <div>
                <Text>Database Connections</Text>
                <Progress percent={23} status="active" />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="System Status">
            <List
              dataSource={[
                { title: 'API Server', status: 'healthy', uptime: '99.9%' },
                { title: 'Database', status: 'healthy', uptime: '99.8%' },
                { title: 'Redis Cache', status: 'healthy', uptime: '99.7%' },
                { title: 'WebSocket Service', status: 'healthy', uptime: '99.5%' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Badge status={item.status === 'healthy' ? 'success' : 'error'} />}
                    title={item.title}
                    description={`Uptime: ${item.uptime}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUserManagement();
      case 'battles':
        return renderBattleAnalytics();
      case 'economy':
        return renderEconomyManagement();
      case 'territory':
        return <Card title="Territory Control">Territory management coming soon...</Card>;
      case 'settings':
        return renderSettings();
      case 'system':
        return renderSystemHealth();
      default:
        return renderOverview();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'TIG' : 'TIG ADMIN'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeTab]}
          items={menuItems}
          onClick={({ key }) => setActiveTab(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Title level={4} style={{ margin: 0, color: '#001529' }}>
            Team Iran vs USA - Super Admin Dashboard
          </Title>
          <Space>
            <Badge count={5}>
              <Button icon={<BellOutlined />} />
            </Badge>
            <Button icon={<SettingOutlined />}>Profile</Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <DashboardContainer>
            {renderContent()}
          </DashboardContainer>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
