#!/usr/bin/env node

// Performance Testing Script
// Uses Artillery for load testing and Lighthouse for performance metrics

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const RESULTS_DIR = path.join(__dirname, '..', 'test-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Performance test configurations
const performanceTests = [
  {
    name: 'battle-endpoint',
    url: `${BASE_URL}/api/battle`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
      'x-user-id': 'test-user'
    },
    body: JSON.stringify({
      opponent_id: 'test-opponent',
      wager: 100,
      weapon_id: 'basic_sword',
      territory_id: 'tehran'
    }),
    expectedResponseTime: 1000, // 1 second
    expectedSuccessRate: 95 // 95%
  },
  {
    name: 'profile-endpoint',
    url: `${BASE_URL}/api/profile`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'x-user-id': 'test-user'
    },
    expectedResponseTime: 500, // 500ms
    expectedSuccessRate: 99 // 99%
  },
  {
    name: 'territories-endpoint',
    url: `${BASE_URL}/api/territories`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'x-user-id': 'test-user'
    },
    expectedResponseTime: 800, // 800ms
    expectedSuccessRate: 98 // 98%
  },
  {
    name: 'marketplace-endpoint',
    url: `${BASE_URL}/api/marketplace`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'x-user-id': 'test-user'
    },
    expectedResponseTime: 600, // 600ms
    expectedSuccessRate: 98 // 98%
  },
  {
    name: 'tournaments-endpoint',
    url: `${BASE_URL}/api/tournaments`,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'x-user-id': 'test-user'
    },
    expectedResponseTime: 700, // 700ms
    expectedSuccessRate: 98 // 98%
  }
];

// Load test configuration
const loadTestConfig = {
  config: {
    target: BASE_URL,
    phases: [
      {
        duration: 60,
        arrivalRate: 10,
        name: 'Warm up'
      },
      {
        duration: 120,
        arrivalRate: 50,
        name: 'Load test'
      },
      {
        duration: 60,
        arrivalRate: 100,
        name: 'Stress test'
      },
      {
        duration: 60,
        arrivalRate: 5,
        name: 'Cool down'
      }
    ],
    payload: {
      path: '/api/battle',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        'x-user-id': 'test-user'
      },
      body: JSON.stringify({
        opponent_id: 'test-opponent',
        wager: 100,
        weapon_id: 'basic_sword',
        territory_id: 'tehran'
      })
    }
  }
};

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    emulatedFormFactor: 'mobile',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  }
};

// Performance test runner
class PerformanceTester {
  constructor() {
    this.results = [];
  }

  async runSingleTest(test) {
    console.log(`🧪 Running performance test: ${test.name}`);
    
    const startTime = Date.now();
    let success = false;
    let responseTime = 0;
    let error = null;

    try {
      const response = await fetch(test.url, {
        method: test.method,
        headers: test.headers,
        body: test.body
      });

      responseTime = Date.now() - startTime;
      success = response.ok;

      if (!success) {
        error = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err) {
      error = err.message;
      responseTime = Date.now() - startTime;
    }

    const result = {
      name: test.name,
      url: test.url,
      method: test.method,
      responseTime,
      success,
      error,
      expectedResponseTime: test.expectedResponseTime,
      expectedSuccessRate: test.expectedSuccessRate,
      passed: success && responseTime <= test.expectedResponseTime,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);
    
    console.log(`  ${result.passed ? '✅' : '❌'} ${test.name}: ${responseTime}ms (${result.passed ? 'PASSED' : 'FAILED'})`);
    
    if (error) {
      console.log(`  Error: ${error}`);
    }

    return result;
  }

  async runAllTests() {
    console.log('🚀 Starting performance tests...');
    
    for (const test of performanceTests) {
      await this.runSingleTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.generateReport();
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter(r => r.passed).length,
        failedTests: this.results.filter(r => !r.passed).length,
        averageResponseTime: this.results.reduce((sum, r) => sum + r.responseTime, 0) / this.results.length,
        minResponseTime: Math.min(...this.results.map(r => r.responseTime)),
        maxResponseTime: Math.max(...this.results.map(r => r.responseTime))
      },
      results: this.results
    };

    const reportPath = path.join(RESULTS_DIR, `performance-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Performance Test Report');
    console.log('==========================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests}`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Average Response Time: ${Math.round(report.summary.averageResponseTime)}ms`);
    console.log(`Min Response Time: ${report.summary.minResponseTime}ms`);
    console.log(`Max Response Time: ${report.summary.maxResponseTime}ms`);
    console.log(`Report saved to: ${reportPath}`);
  }

  async runLoadTest() {
    console.log('🔥 Starting load test...');
    
    const configPath = path.join(RESULTS_DIR, `load-test-config-${Date.now()}.yml`);
    fs.writeFileSync(configPath, this.generateArtilleryConfig());

    const resultsPath = path.join(RESULTS_DIR, `load-test-results-${Date.now()}.json`);
    
    try {
      // Run Artillery load test
      execSync(`artillery run ${configPath} --output ${resultsPath}`, { stdio: 'inherit' });
      
      console.log(`📊 Load test completed. Results saved to: ${resultsPath}`);
      
      // Analyze results
      this.analyzeLoadTestResults(resultsPath);
    } catch (error) {
      console.error('❌ Load test failed:', error.message);
    }
  }

  generateArtilleryConfig() {
    return `
config:
  target: "${loadTestConfig.config.target}"
  phases:
${loadTestConfig.config.phases.map(phase => `    - duration: ${phase.duration}
      arrivalRate: ${phase.arrivalRate}
      name: "${phase.name}"`).join('\n')}

scenarios:
  - name: "Battle Load Test"
    weight: 100
    flow:
      - post:
          url: "${loadTestConfig.config.payload.path}"
          headers:
            Content-Type: "${loadTestConfig.config.payload.headers['Content-Type']}"
            Authorization: "${loadTestConfig.config.payload.headers.Authorization}"
            x-user-id: "${loadTestConfig.config.payload.headers['x-user-id']}"
          json:
            opponent_id: "test-opponent"
            wager: 100
            weapon_id: "basic_sword"
            territory_id: "tehran"
    `;
  }

  analyzeLoadTestResults(resultsPath) {
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      const summary = {
        totalRequests: results.aggregate.counters['http.requests.200'] || 0,
        failedRequests: results.aggregate.counters['http.requests.5xx'] || 0,
        averageResponseTime: results.aggregate.latency.mean || 0,
        minResponseTime: results.aggregate.latency.min || 0,
        maxResponseTime: results.aggregate.latency.max || 0,
        p95ResponseTime: results.aggregate.latency.p95 || 0,
        p99ResponseTime: results.aggregate.latency.p99 || 0,
        requestsPerSecond: results.aggregate.rps.mean || 0
      };

      console.log('\n📊 Load Test Results');
      console.log('====================');
      console.log(`Total Requests: ${summary.totalRequests}`);
      console.log(`Failed Requests: ${summary.failedRequests}`);
      console.log(`Success Rate: ${((summary.totalRequests - summary.failedRequests) / summary.totalRequests * 100).toFixed(2)}%`);
      console.log(`Average Response Time: ${Math.round(summary.averageResponseTime)}ms`);
      console.log(`Min Response Time: ${summary.minResponseTime}ms`);
      console.log(`Max Response Time: ${summary.maxResponseTime}ms`);
      console.log(`95th Percentile: ${Math.round(summary.p95ResponseTime)}ms`);
      console.log(`99th Percentile: ${Math.round(summary.p99ResponseTime)}ms`);
      console.log(`Requests per Second: ${Math.round(summary.requestsPerSecond)}`);

      // Save analysis
      const analysisPath = path.join(RESULTS_DIR, `load-test-analysis-${Date.now()}.json`);
      fs.writeFileSync(analysisPath, JSON.stringify(summary, null, 2));
      console.log(`Analysis saved to: ${analysisPath}`);

    } catch (error) {
      console.error('❌ Failed to analyze load test results:', error.message);
    }
  }

  async runLighthouseTest() {
    console.log('🔍 Starting Lighthouse test...');
    
    const lighthouse = require('lighthouse');
    const chromeLauncher = require('chrome-launcher');

    try {
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port
      };

      const runnerResult = await lighthouse(BASE_URL, options);
      await chrome.kill();

      const results = runnerResult.lhr;
      
      const summary = {
        performance: Math.round(results.categories.performance.score * 100),
        accessibility: Math.round(results.categories.accessibility.score * 100),
        bestPractices: Math.round(results.categories['best-practices'].score * 100),
        seo: Math.round(results.categories.seo.score * 100),
        firstContentfulPaint: results.audits['first-contentful-paint'].numericValue,
        largestContentfulPaint: results.audits['largest-contentful-paint'].numericValue,
        cumulativeLayoutShift: results.audits['cumulative-layout-shift'].numericValue,
        totalBlockingTime: results.audits['total-blocking-time'].numericValue,
        performanceScore: results.audits['performance-score'].numericValue
      };

      console.log('\n🔍 Lighthouse Results');
      console.log('======================');
      console.log(`Performance: ${summary.performance}%`);
      console.log(`Accessibility: ${summary.accessibility}%`);
      console.log(`Best Practices: ${summary.bestPractices}%`);
      console.log(`SEO: ${summary.seo}%`);
      console.log(`First Contentful Paint: ${Math.round(summary.firstContentfulPaint)}ms`);
      console.log(`Largest Contentful Paint: ${Math.round(summary.largestContentfulPaint)}ms`);
      console.log(`Cumulative Layout Shift: ${summary.cumulativeLayoutShift.toFixed(3)}`);
      console.log(`Total Blocking Time: ${Math.round(summary.totalBlockingTime)}ms`);

      // Save results
      const lighthousePath = path.join(RESULTS_DIR, `lighthouse-results-${Date.now()}.json`);
      fs.writeFileSync(lighthousePath, JSON.stringify(results, null, 2));
      console.log(`Lighthouse results saved to: ${lighthousePath}`);

    } catch (error) {
      console.error('❌ Lighthouse test failed:', error.message);
    }
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  const tester = new PerformanceTester();
  
  switch (command) {
    case 'performance':
      await tester.runAllTests();
      break;
      
    case 'load':
      await tester.runLoadTest();
      break;
      
    case 'lighthouse':
      await tester.runLighthouseTest();
      break;
      
    case 'all':
      console.log('🚀 Running all performance tests...');
      await tester.runAllTests();
      await tester.runLoadTest();
      await tester.runLighthouseTest();
      break;
      
    default:
      console.log(`
🧪 Performance Testing CLI

Usage: node performance-test.js <command>

Commands:
  performance    Run individual API performance tests
  load          Run load testing with Artillery
  lighthouse     Run Lighthouse performance audit
  all           Run all performance tests

Environment Variables:
  TEST_BASE_URL    Base URL for testing (default: http://localhost:3000)

Examples:
  node performance-test.js performance
  node performance-test.js load
  node performance-test.js lighthouse
  node performance-test.js all
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = PerformanceTester;
