# SSL/HTTPS Configuration Script
# This script sets up SSL certificates and HTTPS configuration

#!/bin/bash

set -e

# Configuration
DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"admin@${DOMAIN}"}
NGINX_CONFIG="/etc/nginx/sites-available/${DOMAIN}"
SSL_CERT_DIR="/etc/ssl/certs"
SSL_KEY_DIR="/etc/ssl/private"
LETSENCRYPT_DIR="/etc/letsencrypt"

echo "🔒 Setting up SSL/HTTPS for domain: ${DOMAIN}"
echo "📧 Contact email: ${EMAIL}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root"
   exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Create SSL directories
echo "📁 Creating SSL directories..."
mkdir -p ${SSL_CERT_DIR}
mkdir -p ${SSL_KEY_DIR}
mkdir -p ${LETSENCRYPT_DIR}

# Generate self-signed certificate for initial setup
echo "🔐 Generating self-signed certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ${SSL_KEY_DIR}/${DOMAIN}.key \
    -out ${SSL_CERT_DIR}/${DOMAIN}.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=${DOMAIN}"

# Set proper permissions
chmod 600 ${SSL_KEY_DIR}/${DOMAIN}.key
chmod 644 ${SSL_CERT_DIR}/${DOMAIN}.crt

# Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
cat > ${NGINX_CONFIG} << EOF
# Nginx configuration for ${DOMAIN}
# Generated on $(date)

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL configuration
    ssl_certificate ${SSL_CERT_DIR}/${DOMAIN}.crt;
    ssl_certificate_key ${SSL_KEY_DIR}/${DOMAIN}.key;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:; media-src 'self'; object-src 'none'; frame-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Login endpoints with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # WebSocket connections
    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
    
    # Static files with caching
    location /static/ {
        alias /var/www/team-iran-vs-usa/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        
        # Enable gzip for static files
        gzip_static on;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|sql|bak|backup)$ {
        deny all;
    }
    
    # Custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        root /var/www/team-iran-vs-usa;
        internal;
    }
    
    location = /50x.html {
        root /var/www/team-iran-vs-usa;
        internal;
    }
}
EOF

# Enable the site
echo "🔗 Enabling Nginx site..."
ln -sf ${NGINX_CONFIG} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

# Setup Let's Encrypt certificate
echo "🔐 Setting up Let's Encrypt certificate..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos --non-interactive --redirect

# Setup automatic certificate renewal
echo "⏰ Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Create SSL monitoring script
echo "📊 Creating SSL monitoring script..."
cat > /usr/local/bin/ssl-monitor.sh << 'EOF'
#!/bin/bash

# SSL Certificate Monitoring Script
# Checks SSL certificate expiration and sends alerts

DOMAIN=${1:-"yourdomain.com"}
DAYS_WARNING=${2:-30}

# Check certificate expiration
EXPIRY_DATE=$(openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "${EXPIRY_DATE}" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS_WARNING ]; then
    echo "⚠️ SSL certificate for ${DOMAIN} expires in ${DAYS_LEFT} days (${EXPIRY_DATE})"
    # Send email alert (configure mail server first)
    # echo "SSL certificate for ${DOMAIN} expires in ${DAYS_LEFT} days" | mail -s "SSL Certificate Warning" admin@${DOMAIN}
else
    echo "✅ SSL certificate for ${DOMAIN} is valid for ${DAYS_LEFT} days"
fi
EOF

chmod +x /usr/local/bin/ssl-monitor.sh

# Add SSL monitoring to crontab
(crontab -l 2>/dev/null; echo "0 8 * * * /usr/local/bin/ssl-monitor.sh ${DOMAIN}") | crontab -

# Create SSL renewal script
echo "🔄 Creating SSL renewal script..."
cat > /usr/local/bin/ssl-renew.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script
# Renews SSL certificates and restarts services

echo "🔄 Checking SSL certificate renewal..."
certbot renew --quiet

if [ $? -eq 0 ]; then
    echo "✅ SSL certificates renewed successfully"
    echo "🔄 Restarting Nginx..."
    systemctl reload nginx
else
    echo "ℹ️ No SSL certificates needed renewal"
fi

# Test SSL configuration
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration error"
    exit 1
fi
EOF

chmod +x /usr/local/bin/ssl-renew.sh

# Create firewall rules
echo "🔥 Setting up firewall rules..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create domain verification files
echo "🔍 Creating domain verification files..."
mkdir -p /var/www/team-iran-vs-usa/.well-known/acme-challenge

# Create security headers test
echo "🔒 Creating security headers test..."
cat > /var/www/team-iran-vs-usa/security-test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Security Headers Test - ${DOMAIN}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
        .error { color: #e74c3c; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Security Headers Test for ${DOMAIN}</h1>
    <div class="test">
        <h3>HTTPS Status</h3>
        <p id="https-status">Checking...</p>
    </div>
    <div class="test">
        <h3>Security Headers</h3>
        <div id="headers">Loading...</div>
    </div>
    
    <script>
        // Check HTTPS
        const isHttps = location.protocol === 'https:';
        document.getElementById('https-status').innerHTML = isHttps ? 
            '<span class="success">✅ HTTPS Enabled</span>' : 
            '<span class="error">❌ HTTPS Not Enabled</span>';
        
        // Check security headers
        fetch('/security-headers')
            .then(response => response.json())
            .then(headers => {
                let html = '';
                for (const [header, value] of Object.entries(headers)) {
                    const status = value ? 'success' : 'error';
                    html += `<p><strong>${header}:</strong> <span class="${status}">${value ? '✅' : '❌'} ${value || 'Not Set'}</span></p>`;
                }
                document.getElementById('headers').innerHTML = html;
            })
            .catch(error => {
                document.getElementById('headers').innerHTML = '<p class="error">Error loading headers</p>';
            });
    </script>
</body>
</html>
EOF

# Create security headers endpoint
echo "🔧 Creating security headers endpoint..."
cat > /var/www/team-iran-vs-usa/security-headers.php << 'EOF'
<?php
header('Content-Type: application/json');
$security_headers = [
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Content-Security-Policy'
];

$headers = [];
foreach ($security_headers as $header) {
    if (isset($_SERVER['HTTP_' . str_replace('-', '_', strtoupper($header)])) {
        $headers[$header] = $_SERVER['HTTP_' . str_replace('-', '_', strtoupper($header))];
    } else {
        $headers[$header] = null;
    }
}

echo json_encode($headers);
?>
EOF

# Create SSL status dashboard
echo "📊 Creating SSL status dashboard..."
cat > /var/www/team-iran-vs-usa/ssl-status.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>SSL Status - ${DOMAIN}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 20px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        h1 { color: #333; }
        .cert-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .refresh { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .refresh:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 SSL Certificate Status for ${DOMAIN}</h1>
        
        <div id="ssl-status" class="status info">
            <p>Checking SSL certificate status...</p>
        </div>
        
        <div id="cert-info" class="cert-info">
            <h3>Certificate Information</h3>
            <div id="cert-details">Loading...</div>
        </div>
        
        <button class="refresh" onclick="checkSSL()">🔄 Refresh Status</button>
        
        <div class="info">
            <h3>Last Check</h3>
            <p id="last-check">Never</p>
        </div>
    </div>
    
    <script>
        function checkSSL() {
            fetch('/api/ssl-status')
                .then(response => response.json())
                .then(data => {
                    updateSSLStatus(data);
                })
                .catch(error => {
                    document.getElementById('ssl-status').innerHTML = '<p class="error">❌ Error checking SSL status</p>';
                });
        }
        
        function updateSSLStatus(data) {
            const statusDiv = document.getElementById('ssl-status');
            const detailsDiv = document.getElementById('cert-details');
            const lastCheckDiv = document.getElementById('last-check');
            
            if (data.valid) {
                statusDiv.className = 'status success';
                statusDiv.innerHTML = '<p>✅ SSL Certificate is valid</p>';
                
                detailsDiv.innerHTML = \`
                    <p><strong>Issuer:</strong> \${data.issuer}</p>
                    <p><strong>Subject:</strong> \${data.subject}</p>
                    <p><strong>Valid From:</strong> \${data.validFrom}</p>
                    <p><strong>Valid Until:</strong> \${data.validUntil}</p>
                    <p><strong>Days Remaining:</strong> \${data.daysRemaining}</p>
                \`;
            } else {
                statusDiv.className = 'status error';
                statusDiv.innerHTML = '<p>❌ SSL Certificate is invalid or expired</p>';
                
                detailsDiv.innerHTML = \`
                    <p><strong>Error:</strong> \${data.error}</p>
                \`;
            }
            
            lastCheckDiv.textContent = new Date().toLocaleString();
        }
        
        // Check SSL status on page load
        checkSSL();
        
        // Auto-refresh every 5 minutes
        setInterval(checkSSL, 300000);
    </script>
</body>
</html>
EOF

echo "✅ SSL/HTTPS configuration completed successfully!"
echo ""
echo "🔗 Your website is now accessible at:"
echo "   https://${DOMAIN}"
echo ""
echo "📊 SSL Status Dashboard:"
echo "   https://${DOMAIN}/ssl-status.html"
echo ""
echo "🔒 Security Headers Test:"
echo "   https://${DOMAIN}/security-test.html"
echo ""
echo "⚠️ Important Notes:"
echo "1. Make sure DNS A records point to this server"
echo "2. Configure your firewall to allow ports 80 and 443"
echo "3. Set up email alerts for SSL renewal"
echo "4. Monitor SSL certificate expiration regularly"
echo ""
echo "🔧 Next Steps:"
echo "1. Test your website at https://${DOMAIN}"
echo "2. Verify SSL certificate at https://www.ssllabs.com/ssltest/"
echo "3. Monitor SSL renewal logs: /var/log/letsencrypt/"
echo "4. Check Nginx logs: /var/log/nginx/"
echo ""
echo "📧 For SSL certificate issues, contact: ${EMAIL}"
