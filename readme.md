# Prowler Security Dashboard

A modern, interactive web dashboard for visualizing and analyzing Prowler security scan results. Built with React, Vite, and Tailwind CSS, this dashboard provides comprehensive security insights with advanced filtering capabilities.

![Prowler Dashboard Preview](https://img.shields.io/badge/React-18.2.0-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.3.0-38B2AC) ![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF)

## 🚀 Features

### Core Functionality
- **📊 Interactive Charts** - Pie charts for severity distribution and region analysis
- **🎯 Advanced Filtering** - Filter by severity, status, service, region, and compliance frameworks
- **📋 Compliance Mapping** - Smart detection and filtering of compliance frameworks (ISO27001, NIST, CIS, etc.)
- **💾 Data Export** - Export filtered results to JSON format
- **🔍 Real-time Search** - Search through findings by description or check ID

### Security Insights
- **Risk Assessment** - Color-coded severity levels (Critical, High, Medium, Low, Informational)
- **Compliance Coverage** - Track adherence to multiple security frameworks
- **Regional Analysis** - Geographic distribution of security findings
- **Service Breakdown** - AWS service-specific security posture

### User Experience
- **🎨 Modern UI** - Glassmorphism design with smooth animations
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices
- **⚡ Fast Performance** - Built with Vite for lightning-fast development and builds
- **🌙 Professional Theme** - Dark theme optimized for security operations

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone and setup the project:**
```bash
mkdir prowler-security-dashboard
cd prowler-security-dashboard
```

2. **Create the project structure and files** (follow the file structure provided in the setup guide)

3. **Install dependencies:**
```bash
npm install
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open your browser and navigate to:**
```
http://localhost:5173
```

## 🏗️ Project Structure

```
prowler-security-dashboard/
├── public/
├── src/
│   ├── components/
│   │   └── ProwlerDashboard.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 📋 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## 🔧 Configuration

### Tailwind CSS
The dashboard uses Tailwind CSS for styling with a custom configuration that includes:
- Custom color schemes for security severity levels
- Glassmorphism utilities
- Responsive design breakpoints

### Vite Configuration
Optimized Vite setup for:
- Fast development builds
- Hot module replacement
- Optimized production bundles

## 📊 Data Format

The dashboard expects Prowler JSON output with the following structure:

```json
{
  "findings": [
    {
      "CheckID": "ec2_instance_public_ip",
      "CheckTitle": "EC2 Instance Public IP Check",
      "ServiceName": "ec2",
      "Status": "FAIL",
      "Severity": "high",
      "Region": "us-east-1",
      "Risk": "High risk description",
      "Remediation": "Steps to remediate",
      "Compliance": {
        "ISO27001-2022": ["A.8.15"],
        "NIST-800-53": ["SC-7"]
      }
    }
  ]
}
```

### Supported Data Fields
- **CheckID**: Unique identifier for the security check
- **CheckTitle**: Human-readable title for the finding
- **ServiceName**: AWS service name (ec2, s3, iam, etc.)
- **Status**: PASS, FAIL, or other status indicators
- **Severity**: critical, high, medium, low, informational
- **Region**: AWS region identifier
- **Risk**: Risk description and impact
- **Remediation**: Steps to fix the security issue
- **Compliance**: Object mapping compliance frameworks to specific controls

## 🎯 Key Features Explained

### Smart Compliance Detection
The dashboard automatically detects available compliance frameworks from your data:
- ISO 27001-2022
- NIST 800-53
- CIS Controls
- SOC 2
- PCI DSS
- GDPR
- And more...

### Advanced Filtering System
Combine multiple filters for precise analysis:
- **Severity Levels**: Filter by risk severity
- **Status**: Show only PASS or FAIL findings
- **Services**: Focus on specific AWS services
- **Regions**: Geographic filtering
- **Compliance**: Framework-specific filtering

### Interactive Visualizations
- **Severity Distribution**: Pie chart showing security posture overview
- **Regional Analysis**: Pass/fail ratios by AWS region
- **Summary Cards**: Key metrics with color-coded indicators

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Deploy to Static Hosting
The built files in the `dist/` directory can be deployed to:
- Netlify
- Vercel
- AWS S3 + CloudFront
- GitHub Pages
- Any static hosting service

## 🔒 Security Features

### Data Handling
- **Client-side Processing**: All data processing happens in the browser
- **No External APIs**: No data is sent to external servers
- **Local Storage**: Uses browser memory only (no persistent storage)

### Security Best Practices
- **XSS Prevention**: React's built-in XSS protection
- **Secure Dependencies**: Regular dependency updates
- **Content Security Policy**: Configurable CSP headers

## 🛠️ Customization

### Adding New Compliance Frameworks
Modify the compliance detection logic in `ProwlerDashboard.jsx`:

```jsx
const complianceFrameworks = new Set([
  'ISO27001-2022', 'NIST-800-53', 'CIS',
  'YOUR-NEW-FRAMEWORK' // Add here
]);
```

### Custom Severity Colors
Update the severity color mapping:

```jsx
const severityColors = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#65a30d',
  informational: '#0891b2',
  'custom-level': '#your-color' // Add custom levels
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Q: Dashboard shows "No data available"**
A: Ensure your JSON file follows the expected format and contains a "findings" array.

**Q: Charts not displaying correctly**
A: Check that your data includes the required fields (Severity, Status, Region, etc.).

**Q: Compliance filters not working**
A: Verify that compliance data is structured as nested objects, not flat arrays.

### Getting Help

- 📧 Create an issue on the repository
- 💬 Check existing issues for solutions
- 📖 Review the documentation and examples

## 🔄 Updates & Changelog

### Version 1.0.0
- ✅ Initial release with core dashboard functionality
- ✅ Advanced filtering system
- ✅ Compliance framework support
- ✅ Interactive charts and visualizations
- ✅ Modern UI with glassmorphism design
- ✅ Export functionality

---

**Built with ❤️ for the security community**

*Prowler Security Dashboard - Making cloud security visibility simple and beautiful.*
