# Complete Guide: Deploy Prowler Dashboard React App on AWS EC2

## Prerequisites
- AWS Account with EC2 access
- Basic knowledge of Linux commands
- Prowler Dashboard React code (provided)

## Quick Setup Commands (All-in-One)

You can use this automated script to set up the basic environment:

```bash
# Download and run the setup script
curl -o setup.sh https://raw.githubusercontent.com/your-repo/setup.sh
chmod +x setup.sh
./setup.sh
```

Or run commands manually as described in the sections below.

## Step-by-Step Manual Setup

### IMPORTANT: File Creation Order

After creating the React app, you need to create these files in the exact order:

1. **First, create the ProwlerDashboard component:**
```bash
nano src/components/ProwlerDashboard.js
# Copy the entire content from the "ProwlerDashboard.js - Main Component" artifact above
```

2. **Then, update the App.js file:**
```bash
nano src/App.js
# Copy the content from the "App.js - Main App Component" artifact above
```

3. **Update package.json if needed:**
```bash
nano package.json
# Ensure dependencies match the "package.json - Dependencies" artifact above
```

### 1.1 Create EC2 Instance
1. Log into AWS Console and navigate to EC2
2. Click "Launch Instance"
3. Choose **Amazon Linux 2** or **Ubuntu 20.04 LTS** (recommended)
4. Select instance type: **t2.micro** (free tier eligible) or **t3.small** for better performance
5. Configure Security Group:
   - SSH (Port 22): Your IP or 0.0.0.0/0
   - HTTP (Port 80): 0.0.0.0/0
   - HTTPS (Port 443): 0.0.0.0/0
   - Custom TCP (Port 3000): 0.0.0.0/0 (for development)
6. Create or select a key pair (.pem file)
7. Launch the instance

### 1.2 Connect to Instance
```bash
# Change permissions on your key pair
chmod 400 your-key-pair.pem

# Connect via SSH
ssh -i "your-key-pair.pem" ec2-user@your-ec2-public-ip

# For Ubuntu instances, use:
ssh -i "your-key-pair.pem" ubuntu@your-ec2-public-ip
```

## Step 2: Server Setup

### 2.1 Update System
```bash
# For Amazon Linux 2
sudo yum update -y

# For Ubuntu
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Node.js and npm
```bash
# Method 1: Using NodeSource repository (Recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Method 2: Using NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version
npm --version
```

### 2.3 Install Git
```bash
# Amazon Linux 2
sudo yum install git -y

# Ubuntu
sudo apt install git -y
```

### 2.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 2.5 Install Nginx (Web Server)
```bash
# Amazon Linux 2
sudo amazon-linux-extras install nginx1 -y

# Ubuntu
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 3: Create and Deploy Prowler Dashboard Application

### 3.1 Create React Application Structure
```bash
# Navigate to home directory
cd /home/ec2-user

# Create new React app
npx create-react-app prowler-dashboard
cd prowler-dashboard

# Install additional dependencies for the dashboard
npm install recharts lucide-react
```

### 3.2 Create Required Files and Folder Structure
```bash
# Create components directory
mkdir src/components

# Create the main dashboard component file
nano src/components/ProwlerDashboard.js
# Copy the ProwlerDashboard.js content from the artifact above

# Update the main App.js file
nano src/App.js
# Copy the App.js content from the artifact above

# Update package.json with correct dependencies
nano package.json
# Copy the package.json content from the artifact above
```

### 3.3 Install Dependencies
```bash
# Install all required dependencies
npm install

# Or install them individually if needed
npm install recharts lucide-react
```

### 3.4 Add Tailwind CSS (Required for styling)
```bash
# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Configure Tailwind - Update tailwind.config.js
nano tailwind.config.js
```

Add this configuration to `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3.5 Test the Application Locally
```bash
# Start the development server to test
npm start

# The app should now be running on http://localhost:3000
# Test it locally first, then proceed with production build
```

### 3.6 Build Production Version
```bash
# Create production build
npm run build

# This creates a 'build' folder with optimized files
```

### 3.7 Set Environment Variables (Optional)
```bash
# Create environment file if needed
nano .env

# Add your environment variables
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_ENV=production
```

## Step 4: Configure Nginx

### 4.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/your-app

# For Amazon Linux 2, create:
sudo nano /etc/nginx/conf.d/your-app.conf
```

### 4.2 Nginx Configuration Content
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /home/ec2-user/prowler-dashboard/build;
    index index.html index.htm;
    
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4.3 Enable Configuration
```bash
# For Ubuntu
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 5: Set File Permissions

```bash
# Change ownership of build directory
sudo chown -R nginx:nginx /home/ec2-user/prowler-dashboard/build

# For Ubuntu
sudo chown -R www-data:www-data /home/ec2-user/prowler-dashboard/build

# Set proper permissions
chmod -R 755 /home/ec2-user/prowler-dashboard/build
```

## Step 6: Configure Domain (Optional)

### 6.1 Point Domain to EC2
1. In your domain registrar, create an A record pointing to your EC2 public IP
2. Wait for DNS propagation (can take up to 48 hours)

### 6.2 SSL Certificate with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 7: Process Management with PM2 (For Development Server)

### 7.1 Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'react-dashboard',
    script: 'serve',
    args: '-s build -l 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 7.2 Install serve and start with PM2
```bash
npm install -g serve
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 8: Security Hardening

### 8.1 Configure Firewall
```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Amazon Linux 2 - already configured via Security Groups
```

### 8.2 Update Nginx Headers
```nginx
# Add to nginx configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no
