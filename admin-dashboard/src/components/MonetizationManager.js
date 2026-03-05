import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Input, 
  Select, 
  Modal, 
  Form, 
  Switch, 
  InputNumber, 
  Space, 
  Typography, 
  Divider,
  Tag,
  Tooltip,
  message,
  Popconfirm
} from 'antd';
import { 
  DollarOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Option } = Select;

const ManagerContainer = styled.div`
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
`;

const SectionCard = styled(Card)`
  margin-bottom: 24px;
  
  .ant-card-head {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    color: white;
    
    .ant-card-head-title {
      color: white;
    }
  }
`;

const PriceInput = styled(InputNumber)`
  width: 100%;
`;

const MonetizationManager = () => {
  const [tokenPacks, setTokenPacks] = useState([
    { id: 'stg_1k', amount: 1000, price: 1.99, bonus: 0, active: true },
    { id: 'stg_5k', amount: 5000, price: 5.99, bonus: 500, active: true },
    { id: 'stg_10k', amount: 10000, price: 10.99, bonus: 1500, active: true },
    { id: 'stg_50k', amount: 50000, price: 29.99, bonus: 10000, active: true }
  ]);

  const [premiumFeatures, setPremiumFeatures] = useState([
    { id: 'energy_boost', name: 'Energy Boost', monthly: 2, description: '2x energy regeneration', active: true, users: 234 },
    { id: 'custom_avatar', name: 'Custom Avatar', monthly: 5, description: 'Exclusive avatars and skins', active: true, users: 189 },
    { id: 'battle_analytics', name: 'Battle Analytics', monthly: 3, description: 'Advanced battle statistics', active: true, users: 156 },
    { id: 'vip_chat', name: 'VIP Chat', monthly: 4, description: 'Priority support and chat features', active: true, users: 98 }
  ]);

  const [editingToken, setEditingToken] = useState(null);
  const [editingFeature, setEditingFeature] = useState(null);
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
  const [featureModalVisible, setFeatureModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Token pack columns
  const tokenColumns = [
    {
      title: 'Pack ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag color="blue">{id}</Tag>
    },
    {
      title: 'Token Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>{amount.toLocaleString()} STG</Text>
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <Text style={{ color: '#52c41a' }}>${price.toFixed(2)}</Text>
    },
    {
      title: 'Bonus',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (bonus) => bonus > 0 ? <Tag color="gold">+{bonus.toLocaleString()}</Tag> : <Text type="secondary">None</Text>
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => {
        const totalTokens = record.amount + (record.bonus || 0);
        const valuePerToken = record.price / totalTokens;
        return <Text>${valuePerToken.toFixed(4)}/STG</Text>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => editTokenPack(record)}
            />
          </Tooltip>
          <Tooltip title="Toggle Status">
            <Button 
              size="small" 
              icon={<SettingOutlined />}
              onClick={() => toggleTokenPack(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this token pack?"
            onConfirm={() => deleteTokenPack(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Premium feature columns
  const featureColumns = [
    {
      title: 'Feature ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag color="purple">{id}</Tag>
    },
    {
      title: 'Feature Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: 'Monthly Price',
      dataIndex: 'monthly',
      key: 'monthly',
      render: (monthly) => <Text style={{ color: '#52c41a' }}>${monthly}/month</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Active Users',
      dataIndex: 'users',
      key: 'users',
      render: (users) => <Text>{users.toLocaleString()}</Text>
    },
    {
      title: 'Monthly Revenue',
      key: 'revenue',
      render: (_, record) => {
        const revenue = record.monthly * record.users;
        return <Text style={{ color: '#52c41a' }}>${revenue.toLocaleString()}</Text>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => editPremiumFeature(record)}
            />
          </Tooltip>
          <Tooltip title="Toggle Status">
            <Button 
              size="small" 
              icon={<SettingOutlined />}
              onClick={() => togglePremiumFeature(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this feature?"
            onConfirm={() => deletePremiumFeature(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Token pack management
  const editTokenPack = (pack) => {
    setEditingToken(pack);
    setTokenModalVisible(true);
  };

  const saveTokenPack = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingToken.id) {
        // Update existing pack
        setTokenPacks(prev => 
          prev.map(pack => 
            pack.id === editingToken.id ? editingToken : pack
          )
        );
        message.success('Token pack updated successfully!');
      } else {
        // Add new pack
        const newPack = {
          ...editingToken,
          id: `stg_${editingToken.amount}`
        };
        setTokenPacks(prev => [...prev, newPack]);
        message.success('Token pack added successfully!');
      }
      
      setTokenModalVisible(false);
      setEditingToken(null);
    } catch (error) {
      message.error('Failed to save token pack');
    } finally {
      setLoading(false);
    }
  };

  const toggleTokenPack = (id) => {
    setTokenPacks(prev => 
      prev.map(pack => 
        pack.id === id ? { ...pack, active: !pack.active } : pack
      )
    );
    message.success('Token pack status updated!');
  };

  const deleteTokenPack = (id) => {
    setTokenPacks(prev => prev.filter(pack => pack.id !== id));
    message.success('Token pack deleted successfully!');
  };

  // Premium feature management
  const editPremiumFeature = (feature) => {
    setEditingFeature(feature);
    setFeatureModalVisible(true);
  };

  const savePremiumFeature = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingFeature.id) {
        // Update existing feature
        setPremiumFeatures(prev => 
          prev.map(feature => 
            feature.id === editingFeature.id ? editingFeature : feature
          )
        );
        message.success('Premium feature updated successfully!');
      } else {
        // Add new feature
        const newFeature = {
          ...editingFeature,
          id: `feature_${Date.now()}`,
          users: 0
        };
        setPremiumFeatures(prev => [...prev, newFeature]);
        message.success('Premium feature added successfully!');
      }
      
      setFeatureModalVisible(false);
      setEditingFeature(null);
    } catch (error) {
      message.error('Failed to save premium feature');
    } finally {
      setLoading(false);
    }
  };

  const togglePremiumFeature = (id) => {
    setPremiumFeatures(prev => 
      prev.map(feature => 
        feature.id === id ? { ...feature, active: !feature.active } : feature
      )
    );
    message.success('Premium feature status updated!');
  };

  const deletePremiumFeature = (id) => {
    setPremiumFeatures(prev => prev.filter(feature => feature.id !== id));
    message.success('Premium feature deleted successfully!');
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalTokenRevenue = tokenPacks
      .filter(pack => pack.active)
      .reduce((sum, pack) => sum + pack.price, 0);
    
    const totalFeatureRevenue = premiumFeatures
      .filter(feature => feature.active)
      .reduce((sum, feature) => sum + (feature.monthly * feature.users), 0);
    
    return {
      tokenRevenue: totalTokenRevenue,
      featureRevenue: totalFeatureRevenue,
      totalRevenue: totalTokenRevenue + totalFeatureRevenue
    };
  };

  const totals = calculateTotals();

  return (
    <ManagerContainer>
      <Title level={2}>
        <DollarOutlined /> Monetization Manager
      </Title>
      
      {/* Revenue Summary */}
      <SectionCard title="Revenue Summary">
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <Text type="secondary">Token Pack Revenue</Text>
            <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
              ${totals.tokenRevenue.toFixed(2)}
            </Title>
          </div>
          <div>
            <Text type="secondary">Premium Feature Revenue</Text>
            <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
              ${totals.featureRevenue.toFixed(2)}
            </Title>
          </div>
          <div>
            <Text type="secondary">Total Revenue</Text>
            <Title level={3} style={{ color: '#52c41a', margin: 0 }}>
              ${totals.totalRevenue.toFixed(2)}
            </Title>
          </div>
        </div>
      </SectionCard>

      {/* STG Token Packs */}
      <SectionCard 
        title="STG Token Packs"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingToken({ amount: 0, price: 0, bonus: 0, active: true });
              setTokenModalVisible(true);
            }}
          >
            Add Token Pack
          </Button>
        }
      >
        <Table
          columns={tokenColumns}
          dataSource={tokenPacks}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </SectionCard>

      {/* Premium Features */}
      <SectionCard 
        title="Premium Features"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingFeature({ name: '', monthly: 0, description: '', active: true });
              setFeatureModalVisible(true);
            }}
          >
            Add Premium Feature
          </Button>
        }
      >
        <Table
          columns={featureColumns}
          dataSource={premiumFeatures}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </SectionCard>

      {/* Token Pack Modal */}
      <Modal
        title={editingToken?.id ? 'Edit Token Pack' : 'Add Token Pack'}
        open={tokenModalVisible}
        onOk={saveTokenPack}
        onCancel={() => {
          setTokenModalVisible(false);
          setEditingToken(null);
        }}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="Token Amount">
            <InputNumber
              value={editingToken?.amount}
              onChange={(value) => setEditingToken(prev => ({ ...prev, amount: value }))}
              style={{ width: '100%' }}
              min={1}
              placeholder="Enter token amount"
            />
          </Form.Item>
          
          <Form.Item label="Price (USD)">
            <PriceInput
              value={editingToken?.price}
              onChange={(value) => setEditingToken(prev => ({ ...prev, price: value }))}
              min={0}
              step={0.01}
              precision={2}
              placeholder="Enter price"
            />
          </Form.Item>
          
          <Form.Item label="Bonus Tokens">
            <InputNumber
              value={editingToken?.bonus}
              onChange={(value) => setEditingToken(prev => ({ ...prev, bonus: value || 0 }))}
              style={{ width: '100%' }}
              min={0}
              placeholder="Enter bonus tokens (optional)"
            />
          </Form.Item>
          
          <Form.Item label="Status">
            <Switch
              checked={editingToken?.active}
              onChange={(checked) => setEditingToken(prev => ({ ...prev, active: checked }))}
            />
            <span style={{ marginLeft: 8 }}>
              {editingToken?.active ? 'Active' : 'Inactive'}
            </span>
          </Form.Item>
        </Form>
      </Modal>

      {/* Premium Feature Modal */}
      <Modal
        title={editingFeature?.id ? 'Edit Premium Feature' : 'Add Premium Feature'}
        open={featureModalVisible}
        onOk={savePremiumFeature}
        onCancel={() => {
          setFeatureModalVisible(false);
          setEditingFeature(null);
        }}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="Feature Name">
            <Input
              value={editingFeature?.name}
              onChange={(e) => setEditingFeature(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter feature name"
            />
          </Form.Item>
          
          <Form.Item label="Monthly Price (USD)">
            <PriceInput
              value={editingFeature?.monthly}
              onChange={(value) => setEditingFeature(prev => ({ ...prev, monthly: value }))}
              min={0}
              step={1}
              precision={0}
              placeholder="Enter monthly price"
            />
          </Form.Item>
          
          <Form.Item label="Description">
            <Input.TextArea
              value={editingFeature?.description}
              onChange={(e) => setEditingFeature(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter feature description"
              rows={3}
            />
          </Form.Item>
          
          <Form.Item label="Status">
            <Switch
              checked={editingFeature?.active}
              onChange={(checked) => setEditingFeature(prev => ({ ...prev, active: checked }))}
            />
            <span style={{ marginLeft: 8 }}>
              {editingFeature?.active ? 'Active' : 'Inactive'}
            </span>
          </Form.Item>
        </Form>
      </Modal>
    </ManagerContainer>
  );
};

export default MonetizationManager;
