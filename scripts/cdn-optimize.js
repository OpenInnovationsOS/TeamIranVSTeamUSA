#!/usr/bin/env node

// CDN and Asset Optimization Script
// Comprehensive asset optimization and CDN integration

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const sharp = require('sharp');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');

// CDN Configuration
const CDN_CONFIG = {
  provider: process.env.CDN_PROVIDER || 'cloudflare', // cloudflare, aws, fastly
  domain: process.env.CDN_DOMAIN || 'cdn.team-iran-vs-usa.com',
  zoneId: process.env.CDN_ZONE_ID,
  apiToken: process.env.CDN_API_TOKEN,
  apiSecret: process.env.CDN_API_SECRET,
  accessKey: process.env.CDN_ACCESS_KEY,
  secretKey: process.env.CDN_SECRET_KEY,
  region: process.env.CDN_REGION || 'us-east-1',
  distributionId: process.env.CDN_DISTRIBUTION_ID,
  bucket: process.env.CDN_BUCKET || 'team-iran-vs-usa-assets',
  cacheTTL: {
    default: 31536000, // 1 year
    assets: 2592000,   // 30 days
    html: 3600,       // 1 hour
    api: 300          // 5 minutes
  }
};

// Asset Optimization Configuration
const OPTIMIZATION_CONFIG = {
  images: {
    quality: 85,
    progressive: true,
    formats: ['webp', 'avif', 'jpg', 'png'],
    sizes: [
      { name: 'thumb', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 },
      { name: 'large', width: 1200, height: 1200 }
    ]
  },
  javascript: {
    minify: true,
    mangle: true,
    compress: true,
    sourceMap: false
  },
  css: {
    minify: true,
    optimize: true,
    purgeUnused: true
  },
  fonts: {
    subset: true,
    woff2: true,
    preload: true
  }
};

// CDN Manager Class
class CDNManager {
  constructor() {
    this.config = CDN_CONFIG;
    this.assetsDir = path.join(__dirname, '..', 'dist', 'static');
    this.optimizedDir = path.join(__dirname, '..', 'dist', 'optimized');
    this.manifest = {};
    this.ensureDirectories();
  }

  // Ensure directories exist
  ensureDirectories() {
    const dirs = [
      this.optimizedDir,
      path.join(this.optimizedDir, 'images'),
      path.join(this.optimizedDir, 'js'),
      path.join(this.optimizedDir, 'css'),
      path.join(this.optimizedDir, 'fonts')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // Generate file hash
  generateHash(filePath) {
    const fileContent = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileContent).digest('hex').substring(0, 8);
  }

  // Generate CDN URL
  generateCDNUrl(relativePath) {
    const hash = this.manifest[relativePath]?.hash || '';
    const extension = path.extname(relativePath);
    const name = path.basename(relativePath, extension);
    
    if (hash) {
      return `https://${this.config.domain}/${name}.${hash}${extension}`;
    }
    
    return `https://${this.config.domain}/${relativePath}`;
  }

  // Optimize images
  async optimizeImages() {
    console.log('🖼️ Optimizing images...');
    
    const imagesDir = path.join(this.assetsDir, 'images');
    const optimizedImagesDir = path.join(this.optimizedDir, 'images');
    
    if (!fs.existsSync(imagesDir)) {
      console.log('No images directory found');
      return;
    }
    
    const imageFiles = this.findFiles(imagesDir, ['.jpg', '.jpeg', '.png', '.gif', '.svg']);
    
    for (const imageFile of imageFiles) {
      const relativePath = path.relative(imagesDir, imageFile);
      const ext = path.extname(imageFile).toLowerCase();
      const name = path.basename(imageFile, ext);
      
      try {
        // Skip SVG files for Sharp processing
        if (ext === '.svg') {
          await this.optimizeSVG(imageFile, optimizedImagesDir, relativePath);
          continue;
        }
        
        // Process raster images
        await this.optimizeRasterImage(imageFile, optimizedImagesDir, relativePath, name, ext);
      } catch (error) {
        console.error(`Failed to optimize ${imageFile}:`, error);
      }
    }
    
    console.log('✅ Image optimization completed');
  }

  // Optimize raster image
  async optimizeRasterImage(inputPath, outputDir, relativePath, name, ext) {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Generate different sizes
    for (const size of OPTIMIZATION_CONFIG.images.sizes) {
      const sizeName = size.name;
      const width = size.width;
      const height = size.height;
      
      // Create responsive image
      const resized = image.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
      
      // Generate different formats
      for (const format of OPTIMIZATION_CONFIG.images.formats) {
        let outputPath;
        let outputRelativePath;
        
        if (format === 'webp') {
          outputPath = path.join(outputDir, `${name}_${sizeName}.webp`);
          outputRelativePath = `images/${name}_${sizeName}.webp`;
        } else if (format === 'avif') {
          outputPath = path.join(outputDir, `${name}_${sizeName}.avif`);
          outputRelativePath = `images/${name}_${sizeName}.avif`;
        } else {
          outputPath = path.join(outputDir, `${name}_${sizeName}${ext}`);
          outputRelativePath = `images/${name}_${sizeName}${ext}`;
        }
        
        // Apply format-specific optimization
        if (format === 'webp') {
          await resized.webp({ quality: OPTIMIZATION_CONFIG.images.quality }).toFile(outputPath);
        } else if (format === 'avif') {
          await resized.avif({ quality: OPTIMIZATION_CONFIG.images.quality }).toFile(outputPath);
        } else {
          await resized.jpeg({ quality: OPTIMIZATION_CONFIG.images.quality, progressive: OPTIMIZATION_CONFIG.images.progressive }).toFile(outputPath);
        }
        
        // Add to manifest
        const hash = this.generateHash(outputPath);
        this.manifest[outputRelativePath] = {
          original: relativePath,
          hash,
          size,
          format,
          cdnUrl: this.generateCDNUrl(outputRelativePath)
        };
      }
    }
    
    // Generate picture element markup
    this.generatePictureMarkup(name, relativePath);
  }

  // Optimize SVG
  async optimizeSVG(inputPath, outputDir, relativePath) {
    const name = path.basename(inputPath, '.svg');
    const outputPath = path.join(outputDir, `${name}.svg`);
    const outputRelativePath = `images/${name}.svg`;
    
    // Optimize SVG with imagemin
    const optimizedSVG = await imagemin([inputPath], {
      plugins: [
        imageminSvgo({
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'removeEmptyAttrs', active: false },
            { name: 'removeEmptyContainers', active: false },
            { name: 'removeUnusedNS', active: false },
            { name: 'sortAttrs', active: false }
          ]
        })
      ]
    });
    
    fs.writeFileSync(outputPath, optimizedSVG[0].data);
    
    // Add to manifest
    const hash = this.generateHash(outputPath);
    this.manifest[outputRelativePath] = {
      original: relativePath,
      hash,
      format: 'svg',
      cdnUrl: this.generateCDNUrl(outputRelativePath)
    };
  }

  // Generate picture element markup
  generatePictureMarkup(name, originalPath) {
    const markup = `
<picture>
  <source srcset="${this.generateCDNUrl(`images/${name}_thumb.avif`)}" type="image/avif">
  <source srcset="${this.generateCDNUrl(`images/${name}_thumb.webp`)}" type="image/webp">
  <img src="${this.generateCDNUrl(`images/${name}_thumb.jpg`)}" alt="${name}" loading="lazy" decoding="async">
</picture>
    `.trim();
    
    const markupPath = path.join(this.optimizedDir, 'images', `${name}_picture.html`);
    fs.writeFileSync(markupPath, markup);
  }

  // Optimize JavaScript
  async optimizeJavaScript() {
    console.log('📜 Optimizing JavaScript...');
    
    const jsDir = path.join(this.assetsDir, 'js');
    const optimizedJsDir = path.join(this.optimizedDir, 'js');
    
    if (!fs.existsSync(jsDir)) {
      console.log('No JavaScript directory found');
      return;
    }
    
    const jsFiles = this.findFiles(jsDir, ['.js']);
    
    for (const jsFile of jsFiles) {
      const relativePath = path.relative(jsDir, jsFile);
      const outputPath = path.join(optimizedJsDir, path.basename(jsFile));
      const outputRelativePath = `js/${path.basename(jsFile)}`;
      
      try {
        // Minify JavaScript (simplified - would use Terser in production)
        let content = fs.readFileSync(jsFile, 'utf8');
        
        if (OPTIMIZATION_CONFIG.javascript.minify) {
          content = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
            .trim();
        }
        
        fs.writeFileSync(outputPath, content);
        
        // Add to manifest
        const hash = this.generateHash(outputPath);
        this.manifest[outputRelativePath] = {
          original: relativePath,
          hash,
          type: 'javascript',
          cdnUrl: this.generateCDNUrl(outputRelativePath)
        };
      } catch (error) {
        console.error(`Failed to optimize ${jsFile}:`, error);
      }
    }
    
    console.log('✅ JavaScript optimization completed');
  }

  // Optimize CSS
  async optimizeCSS() {
    console.log('🎨 Optimizing CSS...');
    
    const cssDir = path.join(this.assetsDir, 'css');
    const optimizedCssDir = path.join(this.optimizedDir, 'css');
    
    if (!fs.existsSync(cssDir)) {
      console.log('No CSS directory found');
      return;
    }
    
    const cssFiles = this.findFiles(cssDir, ['.css']);
    
    for (const cssFile of cssFiles) {
      const relativePath = path.relative(cssDir, cssFile);
      const outputPath = path.join(optimizedCssDir, path.basename(cssFile));
      const outputRelativePath = `css/${path.basename(cssFile)}`;
      
      try {
        // Minify CSS (simplified - would use CleanCSS in production)
        let content = fs.readFileSync(cssFile, 'utf8');
        
        if (OPTIMIZATION_CONFIG.css.minify) {
          content = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
            .trim();
        }
        
        fs.writeFileSync(outputPath, content);
        
        // Add to manifest
        const hash = this.generateHash(outputPath);
        this.manifest[outputRelativePath] = {
          original: relativePath,
          hash,
          type: 'css',
          cdnUrl: this.generateCDNUrl(outputRelativePath)
        };
      } catch (error) {
        console.error(`Failed to optimize ${cssFile}:`, error);
      }
    }
    
    console.log('✅ CSS optimization completed');
  }

  // Optimize fonts
  async optimizeFonts() {
    console.log('🔤 Optimizing fonts...');
    
    const fontsDir = path.join(this.assetsDir, 'fonts');
    const optimizedFontsDir = path.join(this.optimizedDir, 'fonts');
    
    if (!fs.existsSync(fontsDir)) {
      console.log('No fonts directory found');
      return;
    }
    
    const fontFiles = this.findFiles(fontsDir, ['.woff', '.woff2', '.ttf', '.otf']);
    
    for (const fontFile of fontFiles) {
      const relativePath = path.relative(fontsDir, fontFile);
      const outputPath = path.join(optimizedFontsDir, path.basename(fontFile));
      const outputRelativePath = `fonts/${path.basename(fontFile)}`;
      
      try {
        // Copy font file (font optimization would require specialized tools)
        fs.copyFileSync(fontFile, outputPath);
        
        // Add to manifest
        const hash = this.generateHash(outputPath);
        this.manifest[outputRelativePath] = {
          original: relativePath,
          hash,
          type: 'font',
          cdnUrl: this.generateCDNUrl(outputRelativePath)
        };
      } catch (error) {
        console.error(`Failed to optimize ${fontFile}:`, error);
      }
    }
    
    // Generate font preload directives
    this.generateFontPreload();
    
    console.log('✅ Font optimization completed');
  }

  // Generate font preload directives
  generateFontPreload() {
    const fontsDir = path.join(this.optimizedDir, 'fonts');
    const fontFiles = this.findFiles(fonts, ['.woff2', '.woff']);
    
    let preloadHTML = '<!-- Font Preload -->\n';
    
    for (const fontFile of fontFiles) {
      const relativePath = `fonts/${path.basename(fontFile)}`;
      const cdnUrl = this.generateCDNUrl(relativePath);
      const type = this.getMimeType(fontFile);
      
      preloadHTML += `<link rel="preload" href="${cdnUrl}" as="font" type="${type}" crossorigin="anonymous">\n`;
    }
    
    const preloadPath = path.join(this.optimizedDir, 'font-preload.html');
    fs.writeFileSync(preloadPath, preloadHTML);
  }

  // Get MIME type
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Find files by extension
  findFiles(dir, extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findFiles(fullPath, extensions));
      } else if (extensions.some(ext => fullPath.toLowerCase().endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  // Generate service worker for caching
  generateServiceWorker() {
    console.log('🔄 Generating service worker...');
    
    const serviceWorker = `
// Service Worker for Team Iran vs USA
// Generated on ${new Date().toISOString()}

const CACHE_NAME = 'team-iran-vs-usa-v1';
const CDN_BASE = 'https://${this.config.domain}';

// Assets manifest
const ASSETS_MANIFEST = ${JSON.stringify(this.manifest, null, 2)};

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching assets...');
        return cache.addAll(Object.keys(ASSETS_MANIFEST));
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return fetch(request);
  }
  
  // Skip external requests
  if (!url.pathname.startsWith('/')) {
    return fetch(request);
  }
  
  // Check if request is for an asset
  const assetKey = Object.keys(ASSETS_MANIFEST).find(key => 
    url.pathname.endsWith(key) || url.pathname.includes(key)
  );
  
  if (assetKey) {
    event.respondWith(
      caches.match(CACHE_NAME)
        .then((cache) => {
          const cachedResponse = cache ? cache.match(assetKey) : null;
          
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache:', assetKey);
            return cachedResponse;
          }
          
          // Fetch from CDN
          const cdnUrl = ASSETS_MANIFEST[assetKey].cdnUrl;
          console.log('Service Worker: Fetching from CDN:', cdnUrl);
          
          return fetch(cdnUrl)
            .then((response) => {
              // Cache the response
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(assetKey, response.clone());
                });
              }
              
              return response;
            });
        })
    );
  }
  
  // For non-asset requests, fetch from network
  return fetch(request);
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle offline actions
      handleOfflineActions()
    );
  }
});

// Handle offline actions
async function handleOfflineActions() {
  const cache = await caches.open('offline-actions');
  const actions = await cache.matchAll();
  
  for (const action of actions) {
    try {
      const actionData = await action.json();
      
      // Process action when online
      const response = await fetch(actionData.url, {
        method: actionData.method,
        headers: actionData.headers,
        body: actionData.body
      });
      
      if (response.ok) {
        // Remove processed action
        await cache.delete(action.url);
        console.log('Service Worker: Processed offline action:', actionData.url);
      }
    } catch (error) {
      console.error('Service Worker: Failed to process offline action:', error);
    }
  }
}
    `.trim();
    
    const swPath = path.join(this.optimizedDir, 'service-worker.js');
    fs.writeFileSync(swPath, serviceWorker);
    
    console.log('✅ Service worker generated');
  }

  // Upload assets to CDN
  async uploadToCDN() {
    console.log('☁️ Uploading assets to CDN...');
    
    try {
      switch (this.config.provider) {
        case 'cloudflare':
          await this.uploadToCloudFlare();
          break;
        case 'aws':
          await this.uploadToAWS();
          break;
        case 'fastly':
          await this.uploadToFastly();
          break;
        default:
          throw new Error(`Unsupported CDN provider: ${this.config.provider}`);
      }
      
      console.log('✅ Assets uploaded to CDN');
    } catch (error) {
      console.error('❌ CDN upload failed:', error);
      throw error;
    }
  }

  // Upload to CloudFlare
  async uploadToCloudFlare() {
    // This would use CloudFlare API to upload assets
    // Simplified implementation
    console.log('Uploading to CloudFlare (simplified implementation)');
    
    // In production, this would:
    // 1. Use CloudFlare API to purge cache
    // 2. Upload assets to CloudFlare R2 or similar storage
    // 3. Update DNS records if needed
  }

  // Upload to AWS CloudFront
  async uploadToAWS() {
    const AWS = require('aws-sdk');
    
    const s3 = new AWS.S3({
      accessKeyId: this.config.accessKey,
      secretAccessKey: this.config.secretKey,
      region: this.config.region
    });
    
    const cloudfront = new AWS.CloudFront({
      accessKeyId: this.config.accessKey,
      secretAccessKey: this.config.secretKey,
      region: this.config.region
    });
    
    // Upload optimized assets to S3
    for (const [relativePath, asset] of Object.entries(this.manifest)) {
      const filePath = path.join(this.optimizedDir, relativePath);
      
      try {
        const fileContent = fs.readFileSync(filePath);
        
        const params = {
          Bucket: this.config.bucket,
          Key: relativePath,
          Body: fileContent,
          ContentType: this.getContentType(relativePath),
          CacheControl: `public, max-age=${this.config.cacheTTL.assets}`,
          Metadata: {
            originalPath: asset.original,
            hash: asset.hash,
            type: asset.type
          }
        };
        
        await s3.upload(params).promise();
        console.log(`Uploaded: ${relativePath}`);
      } catch (error) {
        console.error(`Failed to upload ${relativePath}:`, error);
      }
    }
    
    // Invalidate CloudFront cache
    try {
      const invalidationParams = {
        DistributionId: this.config.distributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/*']
          }
        }
      };
      
      await cloudfront.createInvalidation(invalidationParams).promise();
      console.log('CloudFront cache invalidated');
    } catch (error) {
      console.error('Failed to invalidate CloudFront cache:', error);
    }
  }

  // Upload to Fastly
  async uploadToFastly() {
    // This would use Fastly API to upload assets
    console.log('Uploading to Fastly (simplified implementation)');
  }

  // Get content type
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  // Save manifest
  saveManifest() {
    const manifestPath = path.join(this.optimizedDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
    
    console.log('✅ Asset manifest saved');
  }

  // Generate HTML with optimized assets
  generateOptimizedHTML() {
    console.log('📄 Generating optimized HTML...');
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Iran vs USA - Optimized</title>
    
    <!-- Preload critical assets -->
    <link rel="preload" href="${this.generateCDNUrl('css/main.css')}" as="style">
    <link rel="preload" href="${this.generateCDNUrl('js/main.js')}" as="script">
    
    <!-- Font preloads -->
    ${fs.readFileSync(path.join(this.optimizedDir, 'font-preload.html'), 'utf8')}
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="${this.generateCDNUrl('css/main.css')}">
    
    <!-- Service Worker -->
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('${this.generateCDNUrl('service-worker.js')}');
      }
    </script>
</head>
<body>
    <div id="root"></div>
    
    <!-- Scripts -->
    <script src="${this.generateCDNUrl('js/main.js')}" defer></script>
</body>
</html>
    `.trim();
    
    const htmlPath = path.join(this.optimizedDir, 'index.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
    
    console.log('✅ Optimized HTML generated');
  }

  // Run full optimization
  async runOptimization() {
    console.log('🚀 Starting asset optimization...');
    
    try {
      // Optimize all asset types
      await Promise.all([
        this.optimizeImages(),
        this.optimizeJavaScript(),
        this.optimizeCSS(),
        this.optimizeFonts()
      ]);
      
      // Save manifest
      this.saveManifest();
      
      // Generate service worker
      this.generateServiceWorker();
      
      // Generate optimized HTML
      this.generateOptimizedHTML();
      
      // Upload to CDN
      await this.uploadToCDN();
      
      console.log('✅ Asset optimization completed successfully');
    } catch (error) {
      console.error('❌ Asset optimization failed:', error);
      throw error;
    }
  }

  // Get optimization report
  getReport() {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: OPTIMIZATION_CONFIG,
      cdn: CDN_CONFIG,
      manifest: this.manifest,
      summary: {
        totalAssets: Object.keys(this.manifest).length,
        images: Object.values(this.manifest).filter(a => a.type === 'image').length,
        javascript: Object.values(this.manifest).filter(a => a.type === 'javascript').length,
        css: Object.values(this.manifest).filter(a => a.type === 'css').length,
        fonts: Object.values(this.manifest).filter(a => a.type === 'font').length
      }
    };
    
    return report;
  }
}

// CLI interface
async function main() {
  const [command] = process.argv.slice(2);
  
  const cdnManager = new CDNManager();
  
  try {
    switch (command) {
      case 'optimize':
        await cdnManager.runOptimization();
        break;
        
      case 'images':
        await cdnManager.optimizeImages();
        break;
        
      case 'js':
        await cdnManager.optimizeJavaScript();
        break;
        
      case 'css':
        await cdnManager.optimizeCSS();
        break;
        
      case 'fonts':
        await cdnManager.optimizeFonts();
        break;
        
      case 'upload':
        await cdnManager.uploadToCDN();
        break;
        
      case 'report':
        const report = cdnManager.getReport();
        console.log('📊 Optimization Report:');
        console.log(JSON.stringify(report, null, 2));
        break;
        
      case 'manifest':
        cdnManager.saveManifest();
        console.log('✅ Manifest saved');
        break;
        
      default:
        console.log(`
🌐 CDN and Asset Optimization CLI

Usage: node cdn-optimize.js <command>

Commands:
  optimize     Run full optimization pipeline
  images       Optimize images only
  js           Optimize JavaScript only
  css          Optimize CSS only
  fonts        Optimize fonts only
  upload       Upload assets to CDN
  report       Generate optimization report
  manifest     Save asset manifest

Examples:
  node cdn-optimize.js optimize
  node cdn-optimize.js images
  node cdn-optimize.js upload
  node cdn-optimize.js report

Environment Variables:
  CDN_PROVIDER              CDN provider (cloudflare, aws, fastly)
  CDN_DOMAIN                CDN domain name
  CDN_ZONE_ID               CDN zone ID
  CDN_API_TOKEN             CDN API token
  CDN_ACCESS_KEY            CDN access key
  CDN_SECRET_KEY            CDN secret key
  CDN_REGION                CDN region
  CDN_DISTRIBUTION_ID        CDN distribution ID
  CDN_BUCKET                 CDN bucket name
        `);
        break;
    }
  } catch (error) {
    console.error('❌ CDN optimization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CDNManager;
