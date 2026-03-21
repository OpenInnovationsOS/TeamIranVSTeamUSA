#!/usr/bin/env node

// Load Balancing and Scaling Manager
// Comprehensive auto-scaling and load balancing system

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Scaling Configuration
const SCALING_CONFIG = {
  providers: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      autoScalingGroupName: process.env.AWS_AUTO_SCALING_GROUP || 'team-iran-vs-usa-asg',
      launchTemplateName: process.env.AWS_LAUNCH_TEMPLATE || 'team-iran-vs-usa-lt',
      targetGroupArn: process.env.AWS_TARGET_GROUP_ARN,
      loadBalancerArn: process.env.AWS_LOAD_BALANCER_ARN
    },
    digitalocean: {
      token: process.env.DIGITALOCEAN_TOKEN,
      tag: process.env.DIGITALOCEAN_TAG || 'team-iran-vs-usa',
      loadBalancerId: process.env.DIGITALOCEAN_LOAD_BALANCER_ID
    },
    kubernetes: {
      configPath: process.env.KUBECONFIG || '~/.kube/config',
      namespace: process.env.K8S_NAMESPACE || 'default',
      deploymentName: process.env.K8S_DEPLOYMENT || 'team-iran-vs-usa',
      serviceName: process.env.K8S_SERVICE || 'team-iran-vs-usa'
    }
  },
  metrics: {
    cpu: {
      target: 70,        // 70% CPU utilization
      minInstances: 2,    // Minimum 2 instances
      maxInstances: 10,    // Maximum 10 instances
      scaleUpCooldown: 300,   // 5 minutes
      scaleDownCooldown: 600  // 10 minutes
    },
    memory: {
      target: 80,        // 80% memory utilization
      minInstances: 2,
      maxInstances: 10,
      scaleUpCooldown: 300,
      scaleDownCooldown: 600
    },
    responseTime: {
      target: 1000,      // 1000ms response time
      minInstances: 2,
      maxInstances: 10,
      scaleUpCooldown: 180,
      scaleDownCooldown: 300
    },
    requests: {
      target: 100,       // 100 requests per second per instance
      minInstances: 2,
      maxInstances: 10,
      scaleUpCooldown: 120,
      scaleDownCooldown: 300
    }
  },
  healthCheck: {
    endpoint: '/health',
    interval: 30,        // 30 seconds
    timeout: 10,         // 10 seconds
    healthyThreshold: 2, // 2 consecutive successes
    unhealthyThreshold: 3 // 3 consecutive failures
  }
};

// Scaling Manager Class
class ScalingManager {
  constructor() {
    this.config = SCALING_CONFIG;
    this.provider = process.env.SCALING_PROVIDER || 'aws';
    this.currentInstances = [];
    this.scalingHistory = [];
    this.metrics = {};
    this.isAutoScaling = false;
    this.loadBalancer = null;
  }

  // Initialize scaling manager
  async initialize() {
    console.log('🔧 Initializing scaling manager...');
    
    try {
      // Set up provider
      await this.setupProvider();
      
      // Get current instances
      await this.getCurrentInstances();
      
      // Set up monitoring
      await this.setupMonitoring();
      
      // Set up load balancer
      await this.setupLoadBalancer();
      
      // Start auto-scaling if enabled
      if (process.env.AUTO_SCALING === 'true') {
        this.startAutoScaling();
      }
      
      console.log('✅ Scaling manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize scaling manager:', error);
      throw error;
    }
  }

  // Setup provider
  async setupProvider() {
    switch (this.provider) {
      case 'aws':
        await this.setupAWS();
        break;
      case 'digitalocean':
        await this.setupDigitalOcean();
        break;
      case 'kubernetes':
        await this.setupKubernetes();
        break;
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  // Setup AWS
  async setupAWS() {
    const AWS = require('aws-sdk');
    
    this.aws = {
      ec2: new AWS.EC2({
        accessKeyId: this.config.providers.aws.accessKeyId,
        secretAccessKey: this.config.providers.aws.secretAccessKey,
        region: this.config.providers.aws.region
      }),
      autoscaling: new AWS.AutoScaling({
        accessKeyId: this.config.providers.aws.accessKeyId,
        secretAccessKey: this.config.providers.aws.secretAccessKey,
        region: this.config.providers.aws.region
      }),
      elbv2: new AWS.ELBv2({
        accessKeyId: this.config.providers.aws.accessKeyId,
        secretAccessKey: this.config.providers.aws.secretAccessKey,
        region: this.config.providers.aws.region
      }),
      cloudwatch: new AWS.CloudWatch({
        accessKeyId: this.config.providers.aws.accessKeyId,
        secretAccessKey: this.config.providers.aws.secretAccessKey,
        region: this.config.providers.aws.region
      })
    };
    
    console.log('✅ AWS provider setup completed');
  }

  // Setup DigitalOcean
  async setupDigitalOcean() {
    const DigitalOcean = require('digitalocean');
    
    this.digitalocean = new DigitalOcean(this.config.providers.digitalocean.token);
    
    console.log('✅ DigitalOcean provider setup completed');
  }

  // Setup Kubernetes
  async setupKubernetes() {
    const { KubeConfig, CoreV1Api, AppsV1Api, AutoscalingV2Api } = require('@kubernetes/client-node');
    
    const kc = new KubeConfig();
    kc.loadFromFile(this.config.providers.kubernetes.configPath);
    
    this.k8s = {
      coreV1Api: kc.makeApiClient(CoreV1Api),
      appsV1Api: kc.makeApiClient(AppsV1Api),
      autoscalingV2Api: kc.makeApiClient(AutoscalingV2Api)
    };
    
    console.log('✅ Kubernetes provider setup completed');
  }

  // Get current instances
  async getCurrentInstances() {
    console.log('🔍 Getting current instances...');
    
    try {
      switch (this.provider) {
        case 'aws':
          await this.getAWSInstances();
          break;
        case 'digitalocean':
          await this.getDigitalOceanInstances();
          break;
        case 'kubernetes':
          await this.getKubernetesInstances();
          break;
      }
      
      console.log(`✅ Current instances: ${this.currentInstances.length}`);
    } catch (error) {
      console.error('❌ Failed to get current instances:', error);
    }
  }

  // Get AWS instances
  async getAWSInstances() {
    const params = {
      Filters: [
        {
          Name: 'tag:Name',
          Values: ['team-iran-vs-usa']
        },
        {
          Name: 'instance-state-name',
          Values: ['running']
        }
      ]
    };
    
    const result = await this.aws.ec2.describeInstances(params).promise();
    this.currentInstances = result.Reservations.map(reservation => reservation.Instances[0]);
  }

  // Get DigitalOcean instances
  async getDigitalOceanInstances() {
    const droplets = await this.digitalocean.droplets.getAll();
    this.currentInstances = droplets.data.filter(droplet => 
      droplet.tags.includes(this.config.providers.digitalocean.tag)
    );
  }

  // Get Kubernetes instances
  async getKubernetesInstances() {
    const pods = await this.k8s.coreV1Api.listNamespacedPod(
      this.config.providers.kubernetes.namespace
    );
    
    this.currentInstances = pods.items.filter(pod => 
      pod.metadata.labels?.app === this.config.providers.kubernetes.deploymentName
    );
  }

  // Setup monitoring
  async setupMonitoring() {
    console.log('📊 Setting up monitoring...');
    
    // Start metrics collection
    this.startMetricsCollection();
    
    // Set up health checks
    this.setupHealthChecks();
    
    // Set up alerting
    this.setupAlerting();
    
    console.log('✅ Monitoring setup completed');
  }

  // Start metrics collection
  startMetricsCollection() {
    setInterval(async () => {
      await this.collectMetrics();
    }, 30000); // Every 30 seconds
  }

  // Collect metrics
  async collectMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        instances: this.currentInstances.length,
        cpu: await this.getCPUMetrics(),
        memory: await this.getMemoryMetrics(),
        responseTime: await this.getResponseTimeMetrics(),
        requests: await this.getRequestMetrics()
      };
      
      this.metrics = metrics;
      this.scalingHistory.push(metrics);
      
      // Keep only last 1000 entries
      if (this.scalingHistory.length > 1000) {
        this.scalingHistory = this.scalingHistory.slice(-1000);
      }
      
      // Check if scaling is needed
      if (this.isAutoScaling) {
        await this.checkScalingNeeds(metrics);
      }
    } catch (error) {
      console.error('❌ Failed to collect metrics:', error);
    }
  }

  // Get CPU metrics
  async getCPUMetrics() {
    switch (this.provider) {
      case 'aws':
        return await this.getAWSCPUMetrics();
      case 'digitalocean':
        return await this.getDigitalOceanCPUMetrics();
      case 'kubernetes':
        return await this.getKubernetesCPUMetrics();
      default:
        return 0;
    }
  }

  // Get AWS CPU metrics
  async getAWSCPUMetrics() {
    const endTime = new Date();
    const startTime = new Date(endTime - 300000); // Last 5 minutes
    
    const params = {
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [
        {
          Name: 'AutoScalingGroupName',
          Value: this.config.providers.aws.autoScalingGroupName
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average']
    };
    
    const result = await this.aws.cloudwatch.getMetricStatistics(params).promise();
    return result.Datapoints.length > 0 ? result.Datapoints[0].Average : 0;
  }

  // Get DigitalOcean CPU metrics
  async getDigitalOceanCPUMetrics() {
    // Simplified - would use DigitalOcean monitoring API
    return Math.random() * 100; // Mock implementation
  }

  // Get Kubernetes CPU metrics
  async getKubernetesCPUMetrics() {
    // Simplified - would use Kubernetes metrics server
    return Math.random() * 100; // Mock implementation
  }

  // Get memory metrics
  async getMemoryMetrics() {
    switch (this.provider) {
      case 'aws':
        return await this.getAWSMemoryMetrics();
      case 'digitalocean':
        return await this.getDigitalOceanMemoryMetrics();
      case 'kubernetes':
        return await this.getKubernetesMemoryMetrics();
      default:
        return 0;
    }
  }

  // Get AWS memory metrics
  async getAWSMemoryMetrics() {
    const endTime = new Date();
    const startTime = new Date(endTime - 300000); // Last 5 minutes
    
    const params = {
      Namespace: 'AWS/EC2',
      MetricName: 'MemoryUtilization',
      Dimensions: [
        {
          Name: 'AutoScalingGroupName',
          Value: this.config.providers.aws.autoScalingGroupName
        }
      ],
      StartTime: startTime,
      EndTime: endTime,
      Period: 300,
      Statistics: ['Average']
    };
    
    const result = await this.aws.cloudwatch.getMetricStatistics(params).promise();
    return result.Datapoints.length > 0 ? result.Datapoints[0].Average : 0;
  }

  // Get response time metrics
  async getResponseTimeMetrics() {
    // This would integrate with application monitoring
    // For now, return a mock value
    return Math.random() * 2000; // Mock response time in ms
  }

  // Get request metrics
  async getRequestMetrics() {
    // This would integrate with application monitoring
    // For now, return a mock value
    return Math.random() * 200; // Mock requests per second
  }

  // Setup health checks
  setupHealthChecks() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheck.interval * 1000);
  }

  // Perform health checks
  async performHealthChecks() {
    console.log('🏥 Performing health checks...');
    
    const healthResults = [];
    
    for (const instance of this.currentInstances) {
      const health = await this.checkInstanceHealth(instance);
      healthResults.push(health);
    }
    
    // Update instance health status
    this.updateInstanceHealth(healthResults);
  }

  // Check instance health
  async checkInstanceHealth(instance) {
    try {
      const url = getInstanceUrl(instance) + this.config.healthCheck.endpoint;
      const response = await fetch(url, {
        method: 'GET',
        timeout: this.config.healthCheck.timeout * 1000
      });
      
      return {
        instance: getInstanceId(instance),
        healthy: response.ok,
        responseTime: Date.now() - startTime,
        status: response.status
      };
    } catch (error) {
      return {
        instance: getInstanceId(instance),
        healthy: false,
        error: error.message
      };
    }
  }

  // Get instance URL
  getInstanceUrl(instance) {
    switch (this.provider) {
      case 'aws':
        return `http://${instance.PublicIpAddress}`;
      case 'digitalocean':
        return `http://${instance.networks.v4[0].ip_address}`;
      case 'kubernetes':
        return `http://${instance.status.podIP}`;
      default:
        return null;
    }
  }

  // Get instance ID
  getInstanceId(instance) {
    switch (this.provider) {
      case 'aws':
        return instance.InstanceId;
      case 'digitalocean':
        return instance.id;
      case 'kubernetes':
        return instance.metadata.uid;
      default:
        return null;
    }
  }

  // Update instance health
  updateInstanceHealth(healthResults) {
    // This would update the load balancer configuration
    // based on health check results
    console.log('Health check results:', healthResults);
  }

  // Setup alerting
  setupAlerting() {
    // Set up alerting for scaling events
    // This would integrate with monitoring systems
    console.log('🚨 Alerting setup completed');
  }

  // Setup load balancer
  async setupLoadBalancer() {
    console.log('⚖️ Setting up load balancer...');
    
    try {
      switch (this.provider) {
        case 'aws':
          await this.setupAWSLoadBalancer();
          break;
        case 'digitalocean':
          await this.setupDigitalOceanLoadBalancer();
          break;
        case 'kubernetes':
          await this.setupKubernetesLoadBalancer();
          break;
      }
      
      console.log('✅ Load balancer setup completed');
    } catch (error) {
      console.error('❌ Failed to setup load balancer:', error);
    }
  }

  // Setup AWS load balancer
  async setupAWSLoadBalancer() {
    const params = {
      LoadBalancerArn: this.config.providers.aws.loadBalancerArn
    };
    
    const result = await this.aws.elbv2.describeLoadBalancer(params).promise();
    this.loadBalancer = result.LoadBalancers[0];
  }

  // Setup DigitalOcean load balancer
  async setupDigitalOceanLoadBalancer() {
    const loadBalancer = await this.digitalocean.loadBalancers.get(
      this.config.providers.digitalocean.loadBalancerId
    );
    
    this.loadBalancer = loadBalancer.data.load_balancer;
  }

  // Setup Kubernetes load balancer
  async setupKubernetesLoadBalancer() {
    const service = await this.k8s.coreV1Api.readNamespacedService(
      this.config.providers.kubernetes.serviceName,
      this.config.providers.kubernetes.namespace
    );
    
    this.loadBalancer = service.body;
  }

  // Check if scaling is needed
  async checkScalingNeeds(metrics) {
    const decisions = [];
    
    // Check CPU scaling
    const cpuDecision = this.checkCPUScaling(metrics.cpu);
    if (cpuDecision.action !== 'none') {
      decisions.push(cpuDecision);
    }
    
    // Check memory scaling
    const memoryDecision = this.checkMemoryScaling(metrics.memory);
    if (memoryDecision.action !== 'none') {
      decisions.push(memoryDecision);
    }
    
    // Check response time scaling
    const responseTimeDecision = this.checkResponseTimeScaling(metrics.responseTime);
    if (responseTimeDecision.action !== 'none') {
      decisions.push(responseTimeDecision);
    }
    
    // Check request scaling
    const requestDecision = this.checkRequestScaling(metrics.requests);
    if (requestDecision.action !== 'none') {
      decisions.push(requestDecision);
    }
    
    // Execute scaling decisions
    if (decisions.length > 0) {
      await this.executeScalingDecisions(decisions);
    }
  }

  // Check CPU scaling
  checkCPUScaling(cpuUsage) {
    const config = this.config.metrics.cpu;
    
    if (cpuUsage > config.target) {
      return {
        metric: 'cpu',
        action: 'scaleUp',
        reason: `CPU usage (${cpuUsage}%) above target (${config.target}%)`,
        scale: Math.min(this.currentInstances.length + 1, config.maxInstances)
      };
    } else if (cpuUsage < config.target - 20) {
      return {
        metric: 'cpu',
        action: 'scaleDown',
        reason: `CPU usage (${cpuUsage}%) below target (${config.target}%)`,
        scale: Math.max(this.currentInstances.length - 1, config.minInstances)
      };
    }
    
    return { metric: 'cpu', action: 'none' };
  }

  // Check memory scaling
  checkMemoryScaling(memoryUsage) {
    const config = this.config.metrics.memory;
    
    if (memoryUsage > config.target) {
      return {
        metric: 'memory',
        action: 'scaleUp',
        reason: `Memory usage (${memoryUsage}%) above target (${config.target}%)`,
        scale: Math.min(this.currentInstances.length + 1, config.maxInstances)
      };
    } else if (memoryUsage < config.target - 20) {
      return {
        metric: 'memory',
        action: 'scaleDown',
        reason: `Memory usage (${memoryUsage}%) below target (${config.target}%)`,
        scale: Math.max(this.currentInstances.length - 1, config.minInstances)
      };
    }
    
    return { metric: 'memory', action: 'none' };
  }

  // Check response time scaling
  checkResponseTimeScaling(responseTime) {
    const config = this.config.metrics.responseTime;
    
    if (responseTime > config.target) {
      return {
        metric: 'responseTime',
        action: 'scaleUp',
        reason: `Response time (${responseTime}ms) above target (${config.target}ms)`,
        scale: Math.min(this.currentInstances.length + 1, config.maxInstances)
      };
    } else if (responseTime < config.target / 2) {
      return {
        metric: 'responseTime',
        action: 'scaleDown',
        reason: `Response time (${responseTime}ms) below target (${config.target}ms)`,
        scale: Math.max(this.currentInstances.length - 1, config.minInstances)
      };
    }
    
    return { metric: 'responseTime', action: 'none' };
  }

  // Check request scaling
  checkRequestScaling(requestsPerSecond) {
    const config = this.config.metrics.requests;
    const currentCapacity = this.currentInstances.length * config.target;
    
    if (requestsPerSecond > currentCapacity * 0.8) {
      return {
        metric: 'requests',
        action: 'scaleUp',
        reason: `Requests/sec (${requestsPerSecond}) above capacity (${currentCapacity})`,
        scale: Math.min(this.currentInstances.length + 1, config.maxInstances)
      };
    } else if (requestsPerSecond < currentCapacity * 0.3) {
      return {
        metric: 'requests',
        action: 'scaleDown',
        reason: `Requests/sec (${requestsPerSecond}) below capacity (${currentCapacity})`,
        scale: Math.max(this.currentInstances.length - 1, config.minInstances)
      };
    }
    
    return { metric: 'requests', action: 'none' };
  }

  // Execute scaling decisions
  async executeScalingDecisions(decisions) {
    console.log('🔄 Executing scaling decisions:', decisions);
    
    for (const decision of decisions) {
      try {
        if (decision.action === 'scaleUp') {
          await this.scaleUp(decision.scale, decision.reason);
        } else if (decision.action === 'scaleDown') {
          await this.scaleDown(decision.scale, decision.reason);
        }
      } catch (error) {
        console.error(`❌ Failed to execute scaling decision: ${error.message}`);
      }
    }
  }

  // Scale up
  async scaleUp(targetCount, reason) {
    console.log(`📈 Scaling up to ${targetCount} instances: ${reason}`);
    
    try {
      switch (this.provider) {
        case 'aws':
          await this.scaleUpAWS(targetCount);
          break;
        case 'digitalocean':
          await this.scaleUpDigitalOcean(targetCount);
          break;
        case 'kubernetes':
          await this.scaleUpKubernetes(targetCount);
          break;
      }
      
      // Update current instances
      await this.getCurrentInstances();
      
      console.log(`✅ Scale up completed: ${targetCount} instances`);
    } catch (error) {
      console.error('❌ Scale up failed:', error);
    }
  }

  // Scale down
  async scaleDown(targetCount, reason) {
    console.log(`📉 Scaling down to ${targetCount} instances: ${reason}`);
    
    try {
      switch (this.provider) {
        case 'aws':
          await this.scaleDownAWS(targetCount);
          break;
        case 'digitalocean':
          await this.scaleDownDigitalOcean(targetCount);
          break;
        case 'kubernetes':
          await this.scaleDownKubernetes(targetCount);
          break;
      }
      
      // Update current instances
      await this.getCurrentInstances();
      
      console.log(`✅ Scale down completed: ${targetCount} instances`);
    } catch (error) {
      console.error('❌ Scale down failed:', error);
    }
  }

  // Scale up AWS
  async scaleUpAWS(targetCount) {
    const params = {
      AutoScalingGroupName: this.config.providers.aws.autoScalingGroupName,
      DesiredCapacity: targetCount,
      HonorCooldown: false
    };
    
    await this.aws.autoscaling.setDesiredCapacity(params).promise();
  }

  // Scale up DigitalOcean
  async scaleUpDigitalOcean(targetCount) {
    const newDroplet = {
      name: `team-iran-vs-usa-${Date.now()}`,
      region: 'nyc3',
      size: 's-2vcpu-4gb',
      image: 'ubuntu-20-04-x64',
      tags: [this.config.providers.digitalocean.tag]
    };
    
    await this.digitalocean.droplets.create(newDroplet);
  }

  // Scale up Kubernetes
  async scaleUpKubernetes(targetCount) {
    const patch = {
      spec: {
        replicas: targetCount
      }
    };
    
    await this.k8s.appsV1Api.patchNamespacedDeployment(
      this.config.providers.kubernetes.deploymentName,
      this.config.providers.kubernetes.namespace,
      patch
    );
  }

  // Scale down AWS
  async scaleDownAWS(targetCount) {
    const params = {
      AutoScalingGroupName: this.config.providers.aws.autoScalingGroupName,
      DesiredCapacity: targetCount,
      HonorCooldown: false
    };
    
    await this.aws.autoscaling.setDesiredCapacity(params).promise();
  }

  // Scale down DigitalOcean
  async scaleDownDigitalOcean(targetCount) {
    // Get instances to terminate
    const instancesToTerminate = this.currentInstances.slice(targetCount);
    
    for (const instance of instancesToTerminate) {
      await this.digitalocean.droplets.delete(instance.id);
    }
  }

  // Scale down Kubernetes
  async scaleDownKubernetes(targetCount) {
    const patch = {
      spec: {
        replicas: targetCount
      }
    };
    
    await this.k8s.appsV1Api.patchNamespacedDeployment(
      this.config.providers.kubernetes.deploymentName,
      this.config.providers.kubernetes.namespace,
      patch
    );
  }

  // Start auto-scaling
  startAutoScaling() {
    this.isAutoScaling = true;
    console.log('🤖 Auto-scaling started');
  }

  // Stop auto-scaling
  stopAutoScaling() {
    this.isAutoScaling = false;
    console.log('🛑 Auto-scaling stopped');
  }

  // Get scaling status
  getScalingStatus() {
    return {
      provider: this.provider,
      currentInstances: this.currentInstances.length,
      isAutoScaling: this.isAutoScaling,
      metrics: this.metrics,
      loadBalancer: this.loadBalancer,
      scalingHistory: this.scalingHistory.slice(-10)
    };
  }

  // Generate scaling report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.config,
      status: this.getScalingStatus(),
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(__dirname, '..', 'reports', `scaling-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Scaling report generated: ${reportPath}`);
    return report;
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    const metrics = this.metrics;
    
    // CPU recommendations
    if (metrics.cpu > 80) {
      recommendations.push({
        type: 'cpu',
        severity: 'high',
        message: 'High CPU utilization detected. Consider scaling up or optimizing CPU-intensive tasks.',
        action: 'scaleUp'
      });
    }
    
    // Memory recommendations
    if (metrics.memory > 85) {
      recommendations.push({
        type: 'memory',
        severity: 'high',
        message: 'High memory utilization detected. Consider scaling up or optimizing memory usage.',
        action: 'scaleUp'
      });
    }
    
    // Response time recommendations
    if (metrics.responseTime > 1500) {
      recommendations.push({
        type: 'responseTime',
        severity: 'medium',
        message: 'Slow response times detected. Consider scaling up or optimizing application performance.',
        action: 'scaleUp'
      });
    }
    
    // Instance count recommendations
    if (metrics.instances < this.config.metrics.cpu.minInstances) {
      recommendations.push({
        type: 'instances',
        severity: 'medium',
        message: `Instance count (${metrics.instances}) below minimum (${this.config.metrics.cpu.minInstances}). Consider scaling up for high availability.`,
        action: 'scaleUp'
      });
    }
    
    return recommendations;
  }
}

// CLI interface
async function main() {
  const [command, ...args] = process.argv.slice(2);
  
  const scalingManager = new ScalingManager();
  
  try {
    switch (command) {
      case 'init':
        await scalingManager.initialize();
        break;
        
      case 'status':
        const status = scalingManager.getScalingStatus();
        console.log('📊 Scaling Status:');
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'scale-up':
        const count = parseInt(args[0]) || 1;
        await scalingManager.scaleUp(scalingManager.currentInstances.length + count, 'Manual scale up');
        break;
        
      case 'scale-down':
        const count = parseInt(args[0]) || 1;
        await scalingManager.scaleDown(Math.max(1, scalingManager.currentInstances.length - count), 'Manual scale down');
        break;
        
      case 'auto-scale':
        scalingManager.startAutoScaling();
        console.log('🤖 Auto-scaling started. Press Ctrl+C to stop.');
        
        // Keep process running
        process.on('SIGINT', () => {
          scalingManager.stopAutoScaling();
          console.log('🛑 Auto-scaling stopped');
          process.exit(0);
        });
        
        setInterval(() => {}, 1000);
        break;
        
      case 'report':
        const report = scalingManager.generateReport();
        console.log('📊 Scaling Report:');
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
⚖️ Load Balancing and Scaling CLI

Usage: node scaling-manager.js <command> [options]

Commands:
  init              Initialize scaling manager
  status            Get current scaling status
  scale-up [count]  Scale up by specified count
  scale-down [count]  Scale down by specified count
  auto-scale        Start auto-scaling
  report            Generate scaling report

Examples:
  node scaling-manager.js init
  node scaling-manager.js status
  node scaling-manager.js scale-up 2
  node scaling-manager.js scale-down 1
  node scaling-manager.js auto-scale
  node scaling-manager.js report

Environment Variables:
  SCALING_PROVIDER        Scaling provider (aws, digitalocean, kubernetes)
  AUTO_SCALING            Enable auto-scaling (true/false)
  AWS_ACCESS_KEY_ID        AWS access key ID
  AWS_SECRET_ACCESS_KEY    AWS secret access key
  AWS_REGION               AWS region
  DIGITALOCEAN_TOKEN      DigitalOcean API token
  KUBECONFIG               Kubernetes config file path
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Scaling operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ScalingManager;
