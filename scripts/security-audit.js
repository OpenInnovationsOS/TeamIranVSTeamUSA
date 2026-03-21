#!/usr/bin/env node

// Security Audit and Hardening Script
// Comprehensive security scanning and protection implementation

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Security configuration
const SECURITY_CONFIG = {
  reportPath: path.join(__dirname, '..', 'security-reports'),
  vulnerabilities: {
    high: ['SQL Injection', 'XSS', 'CSRF', 'Authentication Bypass', 'Privilege Escalation'],
    medium: ['Information Disclosure', 'Session Hijacking', 'Clickjacking'],
    low: ['Security Misconfiguration', 'Insufficient Logging']
  },
  securityHeaders: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; media-src 'self'; object-src 'none'; frame-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;",
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },
  inputValidation: {
    maxStringLength: 1000,
    allowedChars: /^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=\[\]{}|\\/<>:"']$/,
    sqlPatterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(\b(OR|AND)\s+['"][^'"]*['"]\s*=\s*['"][^'"]*['"])/gi
    ],
    xssPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ]
  }
};

// Security Auditor Class
class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.recommendations = [];
    this.score = 100;
    this.report = {};
  }

  // Run complete security audit
  async runAudit() {
    console.log('🔒 Starting security audit...');
    
    try {
      // Check file permissions
      await this.checkFilePermissions();
      
      // Check dependencies for vulnerabilities
      await this.checkDependencies();
      
      // Check code for security issues
      await this.checkCodeSecurity();
      
      // Check configuration security
      await this.checkConfigurationSecurity();
      
      // Check API security
      await this.checkAPISecurity();
      
      // Check database security
      await this.checkDatabaseSecurity();
      
      // Check authentication security
      await this.checkAuthenticationSecurity();
      
      // Check session security
      await this.checkSessionSecurity();
      
      // Check input validation
      await this.checkInputValidation();
      
      // Check CORS configuration
      await this.checkCORSConfiguration();
      
      // Check webhook security
      await this.checkWebhookSecurity();
      
      // Generate report
      await this.generateReport();
      
      console.log('✅ Security audit completed');
    } catch (error) {
      console.error('❌ Security audit failed:', error);
      throw error;
    }
  }

  // Check file permissions
  async checkFilePermissions() {
    console.log('🔍 Checking file permissions...');
    
    const criticalFiles = [
      '.env',
      '.env.production',
      'package.json',
      'src/server.js',
      'src/server-enhanced.js'
    ];
    
    for (const file of criticalFiles) {
      try {
        const stats = fs.statSync(file);
        const mode = stats.mode;
        
        // Check if file is world-writable
        if (mode & 0o002) {
          this.addVulnerability('high', 'World-writable file', `${file} is world-writable`);
        }
        
        // Check if file is world-readable for sensitive files
        if (file.includes('.env') && (mode & 0o004)) {
          this.addVulnerability('medium', 'World-readable sensitive file', `${file} is world-readable`);
        }
      } catch (error) {
        // File doesn't exist or can't access
      }
    }
  }

  // Check dependencies for vulnerabilities
  async checkDependencies() {
    console.log('🔍 Checking dependencies for vulnerabilities...');
    
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([packageName, vuln]) => {
          const severity = vuln.severity || 'unknown';
          const level = severity === 'high' || severity === 'critical' ? 'high' : 
                       severity === 'moderate' ? 'medium' : 'low';
          
          this.addVulnerability(level, 'Dependency vulnerability', 
            `${packageName}: ${vuln.title} (${severity})`);
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not run npm audit:', error.message);
    }
  }

  // Check code for security issues
  async checkCodeSecurity() {
    console.log('🔍 Checking code security...');
    
    const sourceFiles = this.findSourceFiles();
    
    for (const file of sourceFiles) {
      await this.analyzeFile(file);
    }
  }

  // Find source files
  findSourceFiles() {
    const sourceFiles = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    
    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanDirectory(filePath);
        } else if (extensions.some(ext => file.endsWith(ext))) {
          sourceFiles.push(filePath);
        }
      }
    };
    
    scanDirectory(path.join(__dirname, '..', 'src'));
    return sourceFiles;
  }

  // Analyze individual file for security issues
  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNumber = index + 1;
        
        // Check for hardcoded secrets
        if (this.containsSecret(line)) {
          this.addVulnerability('high', 'Hardcoded secret', 
            `Potential secret found in ${filePath}:${lineNumber}`);
        }
        
        // Check for SQL injection patterns
        if (this.containsSQLInjection(line)) {
          this.addVulnerability('high', 'SQL injection', 
            `SQL injection pattern found in ${filePath}:${lineNumber}`);
        }
        
        // Check for XSS patterns
        if (this.containsXSS(line)) {
          this.addVulnerability('high', 'XSS', 
            `XSS pattern found in ${filePath}:${lineNumber}`);
        }
        
        // Check for eval usage
        if (line.includes('eval(') || line.includes('Function(')) {
          this.addVulnerability('medium', 'Dynamic code execution', 
            `eval/Function usage found in ${filePath}:${lineNumber}`);
        }
        
        // Check for unsafe regex
        if (line.includes('new RegExp(') && line.includes('+')) {
          this.addVulnerability('low', 'Unsafe regex', 
            `Potentially unsafe regex found in ${filePath}:${lineNumber}`);
        }
      });
    } catch (error) {
      console.warn(`⚠️ Could not analyze file ${filePath}:`, error.message);
    }
  }

  // Check if line contains potential secret
  containsSecret(line) {
    const secretPatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i,
      /key\s*=\s*['"][^'"]+['"]/i,
      /api_key\s*=\s*['"][^'"]+['"]/i,
      /private_key\s*=\s*['"][^'"]+['"]/i
    ];
    
    return secretPatterns.some(pattern => pattern.test(line));
  }

  // Check if line contains SQL injection pattern
  containsSQLInjection(line) {
    return SECURITY_CONFIG.inputValidation.sqlPatterns.some(pattern => pattern.test(line));
  }

  // Check if line contains XSS pattern
  containsXSS(line) {
    return SECURITY_CONFIG.inputValidation.xssPatterns.some(pattern => pattern.test(line));
  }

  // Check configuration security
  async checkConfigurationSecurity() {
    console.log('🔍 Checking configuration security...');
    
    // Check environment files
    const envFiles = ['.env', '.env.production', '.env.development'];
    
    for (const envFile of envFiles) {
      try {
        const content = fs.readFileSync(envFile, 'utf8');
        
        // Check for default passwords
        if (content.includes('password=') && 
            (content.includes('password=123') || 
             content.includes('password=admin') || 
             content.includes('password=password'))) {
          this.addVulnerability('high', 'Default password', 
            `Default password found in ${envFile}`);
        }
        
        // Check for empty secrets
        if (content.includes('JWT_SECRET=') || content.includes('SESSION_SECRET=')) {
          this.addVulnerability('high', 'Empty secret', 
            `Empty secret found in ${envFile}`);
        }
        
        // Check for debug mode in production
        if (envFile.includes('production') && content.includes('NODE_ENV=development')) {
          this.addVulnerability('medium', 'Debug mode in production', 
            `Development mode enabled in ${envFile}`);
        }
      } catch (error) {
        // File doesn't exist
      }
    }
  }

  // Check API security
  async checkAPISecurity() {
    console.log('🔍 Checking API security...');
    
    const apiFiles = this.findSourceFiles().filter(file => 
      file.includes('api') || file.includes('server')
    );
    
    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for missing authentication
        if (content.includes('app.get(\'/api') && 
            !content.includes('auth') && 
            !content.includes('jwt')) {
          this.addVulnerability('medium', 'Missing authentication', 
            `API endpoint without authentication found in ${file}`);
        }
        
        // Check for missing rate limiting
        if (content.includes('app.post(\'/api') && 
            !content.includes('rateLimit') && 
            !content.includes('express-rate-limit')) {
          this.addVulnerability('medium', 'Missing rate limiting', 
            `API endpoint without rate limiting found in ${file}`);
        }
        
        // Check for CORS misconfiguration
        if (content.includes('cors()') && 
            content.includes('origin: \'*\'')) {
          this.addVulnerability('medium', 'CORS misconfiguration', 
            `Permissive CORS configuration found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze API file ${file}:`, error.message);
      }
    }
  }

  // Check database security
  async checkDatabaseSecurity() {
    console.log('🔍 Checking database security...');
    
    const dbFiles = this.findSourceFiles().filter(file => 
      file.includes('database') || file.includes('db') || file.includes('sql')
    );
    
    for (const file of dbFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for plain text passwords
        if (content.includes('password:') && 
            !content.includes('bcrypt') && 
            !content.includes('hash')) {
          this.addVulnerability('high', 'Plain text database password', 
            `Plain text database password found in ${file}`);
        }
        
        // Check for SQL injection vulnerabilities
        if (content.includes('SELECT * FROM') && 
            content.includes('+') && 
            !content.includes('parameterized') && 
            !content.includes('prepared')) {
          this.addVulnerability('high', 'SQL injection vulnerability', 
            `SQL injection vulnerability found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze database file ${file}:`, error.message);
      }
    }
  }

  // Check authentication security
  async checkAuthenticationSecurity() {
    console.log('🔍 Checking authentication security...');
    
    const authFiles = this.findSourceFiles().filter(file => 
      file.includes('auth') || file.includes('login') || file.includes('jwt')
    );
    
    for (const file of authFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for weak password policies
        if (content.includes('password') && 
            !content.includes('minLength') && 
            !content.includes('requireUppercase') && 
            !content.includes('requireNumbers')) {
          this.addVulnerability('medium', 'Weak password policy', 
            `Weak password policy found in ${file}`);
        }
        
        // Check for JWT without expiration
        if (content.includes('jwt.sign') && 
            !content.includes('expiresIn')) {
          this.addVulnerability('medium', 'JWT without expiration', 
            `JWT without expiration found in ${file}`);
        }
        
        // Check for hardcoded JWT secrets
        if (content.includes('JWT_SECRET=') && 
            content.length < 32) {
          this.addVulnerability('high', 'Weak JWT secret', 
            `Weak JWT secret found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze auth file ${file}:`, error.message);
      }
    }
  }

  // Check session security
  async checkSessionSecurity() {
    console.log('🔍 Checking session security...');
    
    const sessionFiles = this.findSourceFiles().filter(file => 
      file.includes('session') || file.includes('cookie')
    );
    
    for (const file of sessionFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for insecure cookies
        if (content.includes('cookie') && 
            !content.includes('secure:') && 
            !content.includes('httpOnly:')) {
          this.addVulnerability('medium', 'Insecure cookies', 
            `Insecure cookie configuration found in ${file}`);
        }
        
        // Check for session fixation
        if (content.includes('session') && 
            !content.includes('regenerate') && 
            !content.includes('destroy')) {
          this.addVulnerability('medium', 'Session fixation', 
            `Session fixation vulnerability found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze session file ${file}:`, error.message);
      }
    }
  }

  // Check input validation
  async checkInputValidation() {
    console.log('🔍 Checking input validation...');
    
    const inputFiles = this.findSourceFiles().filter(file => 
      file.includes('route') || file.includes('controller') || file.includes('api')
    );
    
    for (const file of inputFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for missing input validation
        if (content.includes('req.body') && 
            !content.includes('validator') && 
            !content.includes('joi') && 
            !content.includes('express-validator')) {
          this.addVulnerability('high', 'Missing input validation', 
            `Missing input validation found in ${file}`);
        }
        
        // Check for unsafe file uploads
        if (content.includes('multer') && 
            !content.includes('fileFilter') && 
            !content.includes('limits')) {
          this.addVulnerability('medium', 'Unsafe file upload', 
            `Unsafe file upload configuration found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze input file ${file}:`, error.message);
      }
    }
  }

  // Check CORS configuration
  async checkCORSConfiguration() {
    console.log('🔍 Checking CORS configuration...');
    
    const serverFiles = this.findSourceFiles().filter(file => 
      file.includes('server') || file.includes('app')
    );
    
    for (const file of serverFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for overly permissive CORS
        if (content.includes('origin: \'*\'') || 
            content.includes('origin: "*"')) {
          this.addVulnerability('medium', 'Overly permissive CORS', 
            `Overly permissive CORS configuration found in ${file}`);
        }
        
        // Check for missing credentials
        if (content.includes('cors') && 
            !content.includes('credentials: true')) {
          this.addVulnerability('low', 'Missing CORS credentials', 
            `Missing CORS credentials configuration found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze CORS file ${file}:`, error.message);
      }
    }
  }

  // Check webhook security
  async checkWebhookSecurity() {
    console.log('🔍 Checking webhook security...');
    
    const webhookFiles = this.findSourceFiles().filter(file => 
      file.includes('webhook') || file.includes('telegram')
    );
    
    for (const file of webhookFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for missing webhook signature verification
        if (content.includes('webhook') && 
            !content.includes('signature') && 
            !content.includes('hmac') && 
            !content.includes('crypto')) {
          this.addVulnerability('high', 'Missing webhook signature verification', 
            `Missing webhook signature verification found in ${file}`);
        }
        
        // Check for webhook without authentication
        if (content.includes('app.post(\'/webhook') && 
            !content.includes('auth') && 
            !content.includes('token')) {
          this.addVulnerability('high', 'Unauthenticated webhook', 
            `Unauthenticated webhook endpoint found in ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not analyze webhook file ${file}:`, error.message);
      }
    }
  }

  // Add vulnerability
  addVulnerability(severity, type, description) {
    this.vulnerabilities.push({
      severity,
      type,
      description,
      timestamp: new Date().toISOString()
    });
    
    // Adjust score based on severity
    const scoreDeduction = severity === 'high' ? 10 : 
                          severity === 'medium' ? 5 : 2;
    this.score = Math.max(0, this.score - scoreDeduction);
    
    // Add recommendation
    this.addRecommendation(severity, type, description);
  }

  // Add recommendation
  addRecommendation(severity, type, description) {
    const recommendations = {
      'SQL injection': 'Use parameterized queries or prepared statements',
      'XSS': 'Implement proper input sanitization and output encoding',
      'CSRF': 'Implement CSRF tokens and SameSite cookies',
      'Authentication Bypass': 'Implement proper authentication and authorization',
      'Privilege Escalation': 'Implement proper role-based access control',
      'Information Disclosure': 'Remove sensitive information from responses',
      'Session Hijacking': 'Use secure session management and HTTPS',
      'Clickjacking': 'Implement X-Frame-Options header',
      'Security Misconfiguration': 'Review and update security configurations',
      'Insufficient Logging': 'Implement comprehensive security logging'
    };
    
    const recommendation = recommendations[type] || 'Review and fix the security issue';
    
    this.recommendations.push({
      severity,
      type,
      description,
      recommendation,
      timestamp: new Date().toISOString()
    });
  }

  // Generate security report
  async generateReport() {
    console.log('📊 Generating security report...');
    
    // Ensure report directory exists
    if (!fs.existsSync(SECURITY_CONFIG.reportPath)) {
      fs.mkdirSync(SECURITY_CONFIG.reportPath, { recursive: true });
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      score: this.score,
      vulnerabilities: this.vulnerabilities,
      recommendations: this.recommendations,
      summary: {
        total: this.vulnerabilities.length,
        high: this.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: this.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: this.vulnerabilities.filter(v => v.severity === 'low').length
      },
      securityHeaders: SECURITY_CONFIG.securityHeaders,
      bestPractices: this.getBestPractices()
    };
    
    // Save report
    const reportFile = path.join(SECURITY_CONFIG.reportPath, `security-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.generateHTMLReport(report);
    
    this.report = report;
    console.log(`📊 Security report saved to: ${reportFile}`);
  }

  // Get best practices
  getBestPractices() {
    return [
      'Use HTTPS everywhere',
      'Implement proper authentication and authorization',
      'Validate all input data',
      'Use parameterized queries',
      'Implement proper session management',
      'Use security headers',
      'Implement rate limiting',
      'Log security events',
      'Keep dependencies updated',
      'Use secure coding practices',
      'Implement proper error handling',
      'Use secure file upload practices',
      'Implement proper CORS configuration',
      'Use secure cookie settings',
      'Implement proper password policies',
      'Use secure JWT configuration',
      'Implement proper webhook security',
      'Use secure database configuration',
      'Implement proper logging and monitoring'
    ];
  }

  // Generate HTML report
  async generateHTMLReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Report - Team Iran vs USA</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score { font-size: 48px; font-weight: bold; margin: 20px 0; }
        .score.high { color: #27ae60; }
        .score.medium { color: #f39c12; }
        .score.low { color: #e74c3c; }
        .section { margin: 30px 0; }
        .vulnerability { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .vulnerability.high { border-left: 5px solid #e74c3c; }
        .vulnerability.medium { border-left: 5px solid #f39c12; }
        .vulnerability.low { border-left: 5px solid #f1c40f; }
        .severity { font-weight: bold; text-transform: uppercase; }
        .high { color: #e74c3c; }
        .medium { color: #f39c12; }
        .low { color: #f1c40f; }
        .summary { display: flex; justify-content: space-around; margin: 20px 0; }
        .summary-item { text-align: center; }
        .summary-number { font-size: 24px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f8f9fa; }
        .recommendation { background: #e8f5e8; padding: 15px; margin: 10px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Report</h1>
            <p>Team Iran vs USA Game</p>
            <p>Generated: ${report.timestamp}</p>
            <div class="score ${report.score >= 80 ? 'high' : report.score >= 60 ? 'medium' : 'low'}">
                ${report.score}/100
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Summary</h2>
            <div class="summary">
                <div class="summary-item">
                    <div class="summary-number">${report.summary.total}</div>
                    <div>Total Vulnerabilities</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number high">${report.summary.high}</div>
                    <div>High Severity</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number medium">${report.summary.medium}</div>
                    <div>Medium Severity</div>
                </div>
                <div class="summary-item">
                    <div class="summary-number low">${report.summary.low}</div>
                    <div>Low Severity</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚨 Vulnerabilities</h2>
            ${report.vulnerabilities.map(vuln => `
                <div class="vulnerability ${vuln.severity}">
                    <div class="severity ${vuln.severity}">${vuln.severity}</div>
                    <div><strong>${vuln.type}</strong></div>
                    <div>${vuln.description}</div>
                    <div><small>${vuln.timestamp}</small></div>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>💡 Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation">
                    <div><strong>${rec.type}</strong> (${rec.severity})</div>
                    <div>${rec.recommendation}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>🛡️ Security Headers</h2>
            <table>
                <tr><th>Header</th><th>Value</th></tr>
                ${Object.entries(report.securityHeaders).map(([header, value]) => `
                    <tr><td>${header}</td><td>${value}</td></tr>
                `).join('')}
            </table>
        </div>
        
        <div class="section">
            <h2>✅ Best Practices</h2>
            <ul>
                ${report.bestPractices.map(practice => `<li>${practice}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>
    `;
    
    const htmlFile = path.join(SECURITY_CONFIG.reportPath, `security-report-${Date.now()}.html`);
    fs.writeFileSync(htmlFile, htmlTemplate);
  }

  // Get report
  getReport() {
    return this.report;
  }

  // Get score
  getScore() {
    return this.score;
  }
}

// Security Hardening Class
class SecurityHardening {
  constructor() {
    this.config = SECURITY_CONFIG;
  }

  // Apply security hardening
  async applyHardening() {
    console.log('🔒 Applying security hardening...');
    
    try {
      // Generate secure secrets
      await this.generateSecureSecrets();
      
      // Create security middleware
      await this.createSecurityMiddleware();
      
      // Create security headers middleware
      await this.createSecurityHeaders();
      
      // Create rate limiting middleware
      await this.createRateLimiting();
      
      // Create input validation middleware
      await this.createInputValidation();
      
      // Create authentication middleware
      await this.createAuthentication();
      
      // Create audit logging
      await this.createAuditLogging();
      
      console.log('✅ Security hardening applied successfully');
    } catch (error) {
      console.error('❌ Security hardening failed:', error);
      throw error;
    }
  }

  // Generate secure secrets
  async generateSecureSecrets() {
    console.log('🔑 Generating secure secrets...');
    
    const secrets = {
      JWT_SECRET: crypto.randomBytes(64).toString('hex'),
      SESSION_SECRET: crypto.randomBytes(64).toString('hex'),
      WEBHOOK_SECRET: crypto.randomBytes(32).toString('hex'),
      ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex')
    };
    
    const secretsFile = path.join(__dirname, '..', '.env.secrets');
    
    let content = '';
    for (const [key, value] of Object.entries(secrets)) {
      content += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(secretsFile, content);
    console.log(`🔑 Secure secrets generated: ${secretsFile}`);
  }

  // Create security middleware
  async createSecurityMiddleware() {
    const middleware = `
// Security Middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "wss:", "https:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting
const rateLimiter = rateLimit({
  windowMs: ${this.config.rateLimiting.windowMs},
  max: ${this.config.rateLimiting.max},
  message: '${this.config.rateLimiting.message}',
  standardHeaders: true,
  legacyHeaders: false
});

// Slow down
const slowDownMiddleware = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500
});

// Input sanitization
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body).replace(/\\<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script\\>/gi, ''));
  }
  
  // Sanitize query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      req.query[key] = xss(req.query[key]);
    });
  }
  
  // Prevent HTTP parameter pollution
  hpp()(req, res, next);
};

// MongoDB sanitization
const mongoSanitizeMiddleware = mongoSanitize();

module.exports = {
  securityHeaders,
  rateLimiter,
  slowDownMiddleware,
  sanitizeInput,
  mongoSanitizeMiddleware
};
    `;
    
    const middlewareFile = path.join(__dirname, '..', 'src', 'middleware', 'security.js');
    fs.writeFileSync(middlewareFile, middleware);
    console.log(`🛡️ Security middleware created: ${middlewareFile}`);
  }

  // Create security headers
  async createSecurityHeaders() {
    const headersFile = path.join(__dirname, '..', 'src', 'config', 'security-headers.js');
    
    const headers = `
// Security Headers Configuration
module.exports = {
  'Content-Security-Policy': '${this.config.securityHeaders['Content-Security-Policy']}',
  'X-Frame-Options': '${this.config.securityHeaders['X-Frame-Options']}',
  'X-Content-Type-Options': '${this.config.securityHeaders['X-Content-Type-Options']}',
  'X-XSS-Protection': '${this.config.securityHeaders['X-XSS-Protection']}',
  'Referrer-Policy': '${this.config.securityHeaders['Referrer-Policy']}',
  'Permissions-Policy': '${this.config.securityHeaders['Permissions-Policy']}',
  'Strict-Transport-Security': '${this.config.securityHeaders['Strict-Transport-Security']}'
};
    `;
    
    fs.writeFileSync(headersFile, headers);
    console.log(`🔒 Security headers created: ${headersFile}`);
  }

  // Create rate limiting
  async createRateLimiting() {
    const rateLimitFile = path.join(__dirname, '..', 'src', 'middleware', 'rateLimit.js');
    
    const rateLimit = `
// Rate Limiting Configuration
const rateLimit = require('express-rate-limit');

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: ${this.config.rateLimiting.windowMs},
  max: ${this.config.rateLimiting.max},
  message: '${this.config.rateLimiting.message}',
  standardHeaders: true,
  legacyHeaders: false
});

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  loginLimiter,
  apiLimiter
};
    `;
    
    fs.writeFileSync(rateLimitFile, rateLimit);
    console.log(`🚦 Rate limiting created: ${rateLimitFile}`);
  }

  // Create input validation
  async createInputValidation() {
    const validationFile = path.join(__dirname, '..', 'src', 'middleware', 'validation.js');
    
    const validation = `
// Input Validation Middleware
const { body, validationResult } = require('express-validator');

// Common validation rules
const commonRules = {
  username: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores')
  ],
  email: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],
  password: [
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character')
  ],
  amount: [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number')
  ]
};

// Validation middleware
const validate = (rules) => {
  return async (req, res, next) => {
    await Promise.all(rules.map(rule => rule.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    next();
  };
};

// Sanitize input
const sanitizeInput = (req, res, next) => {
  // Remove potentially dangerous characters
  const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>]/g, '');
  };
  
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitize(req.query[key]);
      }
    });
  }
  
  next();
};

module.exports = {
  commonRules,
  validate,
  sanitizeInput
};
    `;
    
    fs.writeFileSync(validationFile, validation);
    console.log(`✅ Input validation created: ${validationFile}`);
  }

  // Create authentication
  async createAuthentication() {
    const authFile = path.join(__dirname, '..', 'src', 'middleware', 'auth.js');
    
    const auth = `
// Authentication Middleware
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// JWT verification
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Admin verification
const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
};

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Password verification
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      isAdmin: user.isAdmin 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  verifyToken,
  verifyAdmin,
  hashPassword,
  verifyPassword,
  generateToken
};
    `;
    
    fs.writeFileSync(authFile, auth);
    console.log(`🔐 Authentication created: ${authFile}`);
  }

  // Create audit logging
  async createAuditLogging() {
    const auditFile = path.join(__dirname, '..', 'src', 'utils', 'audit.js');
    
    const audit = `
// Audit Logging Utility
const fs = require('fs');
const path = require('path');

const auditLog = {
  // Log security events
  logSecurityEvent: (event, userId, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'security',
      event,
      userId,
      details,
      ip: details.ip || 'unknown'
    };
    
    this.writeLog(logEntry);
  },
  
  // Log authentication events
  logAuthEvent: (event, userId, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'auth',
      event,
      userId,
      details,
      ip: details.ip || 'unknown'
    };
    
    this.writeLog(logEntry);
  },
  
  // Log API events
  logAPIEvent: (event, userId, details = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'api',
      event,
      userId,
      details,
      ip: details.ip || 'unknown'
    };
    
    this.writeLog(logEntry);
  },
  
  // Write log to file
  writeLog: (logEntry) => {
    const logFile = path.join(__dirname, '..', 'logs', 'audit.log');
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Write log entry
    const logLine = JSON.stringify(logEntry) + '\\n';
    fs.appendFileSync(logFile, logLine);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT:', logEntry);
    }
  }
};

module.exports = auditLog;
    `;
    
    fs.writeFileSync(auditFile, audit);
    console.log(`📝 Audit logging created: ${auditFile}`);
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  switch (command) {
    case 'audit':
      const auditor = new SecurityAuditor();
      await auditor.runAudit();
      break;
      
    case 'harden':
      const hardening = new SecurityHardening();
      await hardening.applyHardening();
      break;
      
    case 'full':
      const auditor = new SecurityAuditor();
      await auditor.runAudit();
      
      const hardening = new SecurityHardening();
      await hardening.applyHardening();
      break;
      
    default:
      console.log(`
🔒 Security CLI

Usage: node security-audit.js <command>

Commands:
  audit     Run security audit
  harden    Apply security hardening
  full      Run audit and apply hardening

Examples:
  node security-audit.js audit
  node security-audit.js harden
  node security-audit.js full
      `);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  SecurityAuditor,
  SecurityHardening
};
