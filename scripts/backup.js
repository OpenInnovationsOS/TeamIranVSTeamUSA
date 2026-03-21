#!/usr/bin/env node

// Backup and Disaster Recovery Script
// Comprehensive backup system with automated scheduling and recovery capabilities

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Backup configuration
const BACKUP_CONFIG = {
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
  compressionEnabled: process.env.BACKUP_COMPRESSION !== 'false',
  encryptionEnabled: process.env.BACKUP_ENCRYPTION === 'true',
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
  s3Enabled: process.env.S3_BACKUP_ENABLED === 'true',
  s3Bucket: process.env.S3_BACKUP_BUCKET,
  s3AccessKey: process.env.S3_ACCESS_KEY,
  s3SecretKey: process.env.S3_SECRET_KEY,
  s3Region: process.env.S3_REGION || 'us-east-1',
  notifications: {
    email: process.env.BACKUP_EMAIL,
    webhook: process.env.BACKUP_WEBHOOK
  }
};

// Backup Manager Class
class BackupManager {
  constructor() {
    this.backupDir = BACKUP_CONFIG.backupDir;
    this.ensureBackupDir();
    this.backupTypes = {
      database: this.backupDatabase.bind(this),
      files: this.backupFiles.bind(this),
      config: this.backupConfig.bind(this),
      full: this.backupFull.bind(this)
    };
  }

  // Ensure backup directory exists
  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // Create subdirectories
    const subdirs = ['database', 'files', 'config', 'logs'];
    subdirs.forEach(dir => {
      const fullPath = path.join(this.backupDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Generate backup filename
  generateFilename(type, extension = 'tar.gz') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${type}_backup_${timestamp}.${extension}`;
  }

  // Compress file/directory
  async compress(source, destination) {
    return new Promise((resolve, reject) => {
      const command = BACKUP_CONFIG.compressionEnabled ? 
        `tar -czf ${destination} ${source}` : 
        `tar -cf ${destination} ${source}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(destination);
        }
      });
    });
  }

  // Encrypt file
  async encryptFile(inputPath, outputPath) {
    if (!BACKUP_CONFIG.encryptionEnabled) {
      return fs.copyFileSync(inputPath, outputPath);
    }

    return new Promise((resolve, reject) => {
      const cipher = crypto.createCipher('aes-256-cbc', BACKUP_CONFIG.encryptionKey);
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      
      input.pipe(cipher).pipe(output);
      
      output.on('finish', () => resolve(outputPath));
      output.on('error', reject);
    });
  }

  // Decrypt file
  async decryptFile(inputPath, outputPath) {
    if (!BACKUP_CONFIG.encryptionEnabled) {
      return fs.copyFileSync(inputPath, outputPath);
    }

    return new Promise((resolve, reject) => {
      const decipher = crypto.createDecipher('aes-256-cbc', BACKUP_CONFIG.encryptionKey);
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      
      input.pipe(decipher).pipe(output);
      
      output.on('finish', () => resolve(outputPath));
      output.on('error', reject);
    });
  }

  // Upload to S3
  async uploadToS3(localPath, remoteKey) {
    if (!BACKUP_CONFIG.s3Enabled) {
      return true;
    }

    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: BACKUP_CONFIG.s3AccessKey,
      secretAccessKey: BACKUP_CONFIG.s3SecretKey,
      region: BACKUP_CONFIG.s3Region
    });

    const fileContent = fs.readFileSync(localPath);
    
    const params = {
      Bucket: BACKUP_CONFIG.s3Bucket,
      Key: remoteKey,
      Body: fileContent,
      StorageClass: 'STANDARD_IA'
    };

    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  // Download from S3
  async downloadFromS3(remoteKey, localPath) {
    if (!BACKUP_CONFIG.s3Enabled) {
      return false;
    }

    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: BACKUP_CONFIG.s3AccessKey,
      secretAccessKey: BACKUP_CONFIG.s3SecretKey,
      region: BACKUP_CONFIG.s3Region
    });

    const params = {
      Bucket: BACKUP_CONFIG.s3Bucket,
      Key: remoteKey
    };

    return new Promise((resolve, reject) => {
      s3.getObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          fs.writeFileSync(localPath, data.Body);
          resolve(localPath);
        }
      });
    });
  }

  // Send notification
  async sendNotification(message, type = 'info') {
    const payload = {
      message,
      type,
      timestamp: new Date().toISOString(),
      service: 'backup-manager'
    };

    // Send webhook notification
    if (BACKUP_CONFIG.notifications.webhook) {
      try {
        await fetch(BACKUP_CONFIG.notifications.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }

    // Send email notification (would require email service integration)
    if (BACKUP_CONFIG.notifications.email) {
      console.log(`Email notification: ${message}`);
    }
  }

  // Backup database
  async backupDatabase() {
    console.log('🗄️ Starting database backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = this.generateFilename('database', 'sql');
      const filepath = path.join(this.backupDir, 'database', filename);
      
      // Create database backup
      const dbType = process.env.DB_TYPE || 'postgres';
      
      if (dbType === 'postgres') {
        const command = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} > ${filepath}`;
        execSync(command, { stdio: 'inherit' });
      } else if (dbType === 'sqlite') {
        const dbPath = process.env.DB_PATH || './data/production.db';
        fs.copyFileSync(dbPath, filepath);
      }
      
      // Compress backup
      const compressedFile = filepath + '.gz';
      await this.compress(filepath, compressedFile);
      fs.unlinkSync(filepath); // Remove uncompressed file
      
      // Encrypt backup
      if (BACKUP_CONFIG.encryptionEnabled) {
        const encryptedFile = compressedFile + '.enc';
        await this.encryptFile(compressedFile, encryptedFile);
        fs.unlinkSync(compressedFile); // Remove unencrypted file
      }
      
      // Upload to S3
      const finalFile = BACKUP_CONFIG.encryptionEnabled ? compressedFile + '.enc' : compressedFile;
      const s3Key = `database/${path.basename(finalFile)}`;
      await this.uploadToS3(finalFile, s3Key);
      
      console.log(`✅ Database backup completed: ${finalFile}`);
      await this.sendNotification(`Database backup completed: ${path.basename(finalFile)}`, 'success');
      
      return finalFile;
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      await this.sendNotification(`Database backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Backup application files
  async backupFiles() {
    console.log('📁 Starting files backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = this.generateFilename('files');
      const filepath = path.join(this.backupDir, 'files', filename);
      
      // Define what to backup
      const sourceDirs = [
        'src',
        'public',
        'dist',
        'scripts',
        'package*.json'
      ];
      
      // Create files backup
      const sourcePath = sourceDirs.join(' ');
      await this.compress(sourcePath, filepath);
      
      // Encrypt backup
      if (BACKUP_CONFIG.encryptionEnabled) {
        const encryptedFile = filepath + '.enc';
        await this.encryptFile(filepath, encryptedFile);
        fs.unlinkSync(filepath); // Remove unencrypted file
      }
      
      // Upload to S3
      const finalFile = BACKUP_CONFIG.encryptionEnabled ? filepath + '.enc' : filepath;
      const s3Key = `files/${path.basename(finalFile)}`;
      await this.uploadToS3(finalFile, s3Key);
      
      console.log(`✅ Files backup completed: ${finalFile}`);
      await this.sendNotification(`Files backup completed: ${path.basename(finalFile)}`, 'success');
      
      return finalFile;
    } catch (error) {
      console.error('❌ Files backup failed:', error);
      await this.sendNotification(`Files backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Backup configuration
  async backupConfig() {
    console.log('⚙️ Starting configuration backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = this.generateFilename('config', 'tar.gz');
      const filepath = path.join(this.backupDir, 'config', filename);
      
      // Define config files to backup
      const configFiles = [
        '.env.production',
        '.env',
        'nginx.conf',
        'docker-compose.prod.yml',
        'monitoring/',
        'scripts/'
      ];
      
      // Create config backup
      const sourcePath = configFiles.join(' ');
      await this.compress(sourcePath, filepath);
      
      // Encrypt backup
      if (BACKUP_CONFIG.encryptionEnabled) {
        const encryptedFile = filepath + '.enc';
        await this.encryptFile(filepath, encryptedFile);
        fs.unlinkSync(filepath); // Remove unencrypted file
      }
      
      // Upload to S3
      const finalFile = BACKUP_CONFIG.encryptionEnabled ? filepath + '.enc' : filepath;
      const s3Key = `config/${path.basename(finalFile)}`;
      await this.uploadToS3(finalFile, s3Key);
      
      console.log(`✅ Configuration backup completed: ${finalFile}`);
      await this.sendNotification(`Configuration backup completed: ${path.basename(finalFile)}`, 'success');
      
      return finalFile;
    } catch (error) {
      console.error('❌ Configuration backup failed:', error);
      await this.sendNotification(`Configuration backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Full backup
  async backupFull() {
    console.log('🔄 Starting full backup...');
    
    try {
      const results = await Promise.all([
        this.backupDatabase(),
        this.backupFiles(),
        this.backupConfig()
      ]);
      
      console.log('✅ Full backup completed');
      await this.sendNotification('Full backup completed successfully', 'success');
      
      return results;
    } catch (error) {
      console.error('❌ Full backup failed:', error);
      await this.sendNotification(`Full backup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Restore database
  async restoreDatabase(backupFile) {
    console.log('🗄️ Starting database restore...');
    
    try {
      const tempDir = path.join(this.backupDir, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, path.basename(backupFile));
      
      // Download from S3 if needed
      if (backupFile.startsWith('s3://')) {
        const s3Key = backupFile.replace('s3://', '');
        await this.downloadFromS3(s3Key, tempFile);
      } else {
        fs.copyFileSync(backupFile, tempFile);
      }
      
      // Decrypt if needed
      let sqlFile = tempFile;
      if (BACKUP_CONFIG.encryptionEnabled && tempFile.endsWith('.enc')) {
        sqlFile = tempFile.replace('.enc', '');
        await this.decryptFile(tempFile, sqlFile);
      }
      
      // Decompress if needed
      if (sqlFile.endsWith('.gz')) {
        const decompressedFile = sqlFile.replace('.gz', '');
        execSync(`gunzip -c ${sqlFile} > ${decompressedFile}`);
        sqlFile = decompressedFile;
      }
      
      // Restore database
      const dbType = process.env.DB_TYPE || 'postgres';
      
      if (dbType === 'postgres') {
        const command = `psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} < ${sqlFile}`;
        execSync(command, { stdio: 'inherit' });
      } else if (dbType === 'sqlite') {
        const dbPath = process.env.DB_PATH || './data/production.db';
        fs.copyFileSync(sqlFile, dbPath);
      }
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true });
      
      console.log('✅ Database restore completed');
      await this.sendNotification('Database restore completed successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      await this.sendNotification(`Database restore failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Restore files
  async restoreFiles(backupFile) {
    console.log('📁 Starting files restore...');
    
    try {
      const tempDir = path.join(this.backupDir, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFile = path.join(tempDir, path.basename(backupFile));
      
      // Download from S3 if needed
      if (backupFile.startsWith('s3://')) {
        const s3Key = backupFile.replace('s3://', '');
        await this.downloadFromS3(s3Key, tempFile);
      } else {
        fs.copyFileSync(backupFile, tempFile);
      }
      
      // Decrypt if needed
      let tarFile = tempFile;
      if (BACKUP_CONFIG.encryptionEnabled && tempFile.endsWith('.enc')) {
        tarFile = tempFile.replace('.enc', '');
        await this.decryptFile(tempFile, tarFile);
      }
      
      // Extract files
      execSync(`tar -xzf ${tarFile} -C /var/www/team-iran-vs-usa/`, { stdio: 'inherit' });
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true });
      
      console.log('✅ Files restore completed');
      await this.sendNotification('Files restore completed successfully', 'success');
      
      return true;
    } catch (error) {
      console.error('❌ Files restore failed:', error);
      await this.sendNotification(`Files restore failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // List available backups
  listBackups(type = 'all') {
    const backups = {
      database: [],
      files: [],
      config: []
    };
    
    try {
      // List local backups
      const types = type === 'all' ? ['database', 'files', 'config'] : [type];
      
      types.forEach(backupType => {
        const dir = path.join(this.backupDir, backupType);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          backups[backupType] = files.map(file => ({
            name: file,
            path: path.join(dir, file),
            size: fs.statSync(path.join(dir, file)).size,
            created: fs.statSync(path.join(dir, file)).birthtime
          }));
        }
      });
      
      // List S3 backups if enabled
      if (BACKUP_CONFIG.s3Enabled) {
        // This would require AWS SDK to list S3 objects
        console.log('S3 backup listing not implemented in this example');
      }
      
      return backups;
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return backups;
    }
  }

  // Clean old backups
  async cleanupOldBackups() {
    console.log('🧹 Cleaning up old backups...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - BACKUP_CONFIG.retentionDays);
      
      const types = ['database', 'files', 'config'];
      let deletedCount = 0;
      
      types.forEach(type => {
        const dir = path.join(this.backupDir, type);
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          
          files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.birthtime < cutoffDate) {
              fs.unlinkSync(filePath);
              deletedCount++;
              console.log(`Deleted old backup: ${file}`);
            }
          });
        }
      });
      
      console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups`);
      await this.sendNotification(`Backup cleanup completed. Deleted ${deletedCount} old backups`, 'info');
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      await this.sendNotification(`Backup cleanup failed: ${error.message}`, 'error');
      throw error;
    }
  }

  // Schedule backups
  scheduleBackup(type, schedule) {
    const cron = require('node-cron');
    
    if (!this.backupTypes[type]) {
      throw new Error(`Unknown backup type: ${type}`);
    }
    
    const task = cron.schedule(schedule, async () => {
      try {
        await this.backupTypes[type]();
      } catch (error) {
        console.error(`Scheduled backup failed for ${type}:`, error);
      }
    });
    
    console.log(`✅ Scheduled ${type} backup with schedule: ${schedule}`);
    return task;
  }

  // Start backup scheduler
  startScheduler() {
    console.log('🕐 Starting backup scheduler...');
    
    // Schedule daily database backup at 2 AM
    this.scheduleBackup('database', '0 2 * * *');
    
    // Schedule weekly files backup on Sunday at 3 AM
    this.scheduleBackup('files', '0 3 * * 0');
    
    // Schedule monthly config backup on 1st at 4 AM
    this.scheduleBackup('config', '0 4 1 * *');
    
    // Schedule cleanup daily at 5 AM
    const cron = require('node-cron');
    cron.schedule('0 5 * * *', async () => {
      try {
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    });
    
    console.log('✅ Backup scheduler started');
  }

  // Generate backup report
  generateReport() {
    const backups = this.listBackups();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalBackups: Object.values(backups).flat().length,
        databaseBackups: backups.database.length,
        filesBackups: backups.files.length,
        configBackups: backups.config.length
      },
      details: backups,
      configuration: BACKUP_CONFIG
    };
    
    const reportPath = path.join(this.backupDir, `backup-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Backup report generated: ${reportPath}`);
    return report;
  }
}

// CLI interface
async function main() {
  const [command, type, file] = process.argv.slice(2);
  
  const backupManager = new BackupManager();
  
  try {
    switch (command) {
      case 'backup':
        if (!type || !backupManager.backupTypes[type]) {
          console.error('❌ Invalid backup type. Use: database, files, config, full');
          process.exit(1);
        }
        await backupManager.backupTypes[type]();
        break;
        
      case 'restore':
        if (!type || !file) {
          console.error('❌ Usage: node backup.js restore <type> <file>');
          process.exit(1);
        }
        
        if (type === 'database') {
          await backupManager.restoreDatabase(file);
        } else if (type === 'files') {
          await backupManager.restoreFiles(file);
        } else {
          console.error('❌ Invalid restore type. Use: database, files');
          process.exit(1);
        }
        break;
        
      case 'list':
        const backups = backupManager.listBackups(type);
        console.log('📋 Available backups:');
        console.log(JSON.stringify(backups, null, 2));
        break;
        
      case 'cleanup':
        await backupManager.cleanupOldBackups();
        break;
        
      case 'schedule':
        backupManager.startScheduler();
        console.log('✅ Backup scheduler started. Press Ctrl+C to stop.');
        
        // Keep process running
        process.on('SIGINT', () => {
          console.log('🛑 Backup scheduler stopped');
          process.exit(0);
        });
        
        // Prevent process from exiting
        setInterval(() => {}, 1000);
        break;
        
      case 'report':
        const report = backupManager.generateReport();
        console.log('📊 Backup report:');
        console.log(JSON.stringify(report, null, 2));
        break;
        
      default:
        console.log(`
💾 Backup and Disaster Recovery CLI

Usage: node backup.js <command> [options]

Commands:
  backup <type>     Create backup (database, files, config, full)
  restore <type> <file> Restore backup (database, files)
  list [type]       List available backups
  cleanup            Clean up old backups
  schedule           Start backup scheduler
  report             Generate backup report

Examples:
  node backup.js backup database
  node backup.js backup full
  node backup.js restore database /path/to/backup.sql.gz
  node backup.js list database
  node backup.js cleanup
  node backup.js schedule
  node backup.js report

Environment Variables:
  BACKUP_DIR              Backup directory (default: ./backups)
  BACKUP_RETENTION_DAYS    Retention period in days (default: 30)
  BACKUP_COMPRESSION       Enable compression (default: true)
  BACKUP_ENCRYPTION        Enable encryption (default: false)
  BACKUP_ENCRYPTION_KEY    Encryption key
  S3_BACKUP_ENABLED        Enable S3 backup (default: false)
  S3_BACKUP_BUCKET         S3 bucket name
  S3_ACCESS_KEY            S3 access key
  S3_SECRET_KEY            S3 secret key
  S3_REGION                S3 region (default: us-east-1)
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Backup operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BackupManager;
