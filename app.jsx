import React, { useState, useCallback } from 'react';
import { Upload, Shield, AlertTriangle, CheckCircle, XCircle, BarChart3, PieChart, FileText, Download, ExternalLink, MapPin, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

const COMPLIANCE_FRAMEWORKS = [
  'aws_account_security_onboarding_aws',
  'aws_audit_manager_control_tower_guardrails_aws', 
  'aws_foundational_security_best_practices_aws',
  'aws_foundational_technical_review_aws',
  'aws_well_architected_framework_reliability_pillar_aws',
  'aws_well_architected_framework_security_pillar_aws',
  'cis_1.4_aws', 'cis_1.5_aws', 'cis_2.0_aws', 'cis_3.0_aws', 'cis_4.0_aws', 'cis_5.0_aws',
  'cisa_aws', 'ens_rd2022_aws', 'fedramp_low_revision_4_aws', 'fedramp_moderate_revision_4_aws',
  'ffiec_aws', 'gdpr_aws', 'gxp_21_cfr_part_11_aws', 'gxp_eu_annex_11_aws', 'hipaa_aws',
  'iso27001_2013_aws', 'iso27001_2022_aws', 'kisa_isms_p_2023_aws', 'kisa_isms_p_2023_korean_aws',
  'mitre_attack_aws', 'nis2_aws', 'nist_800_171_revision_2_aws', 'nist_800_53_revision_4_aws',
  'nist_800_53_revision_5_aws', 'nist_csf_1.1_aws', 'pci_3.2.1_aws', 'pci_4.0_aws',
  'prowler_threatscore_aws', 'rbi_cyber_security_framework_aws', 'soc2_aws'
];

const SEVERITY_COLORS = {
  Critical: '#dc2626',
  High: '#dc2626', 
  Medium: '#d97706',
  Low: '#0284c7',
  Info: '#0891b2'
};

const ProwlerDashboard = () => {
  const [jsonData, setJsonData] = useState(null);
  const [selectedFramework, setSelectedFramework] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let parsedData;
        
        if (content.trim().startsWith('[')) {
          parsedData = JSON.parse(content);
        } else {
          const lines = content.split('\n').filter(line => line.trim());
          parsedData = lines.map(line => JSON.parse(line));
        }
        
        setJsonData(Array.isArray(parsedData) ? parsedData : [parsedData]);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error parsing JSON file. Please check the file format.');
        setLoading(false);
      }
    };
    
    reader.readAsText(file);
  }, []);

  const calculateStats = () => {
    if (!jsonData) return null;

    let filtered = jsonData;
    
    // Apply compliance framework filter
    if (selectedFramework) {
      filtered = filtered.filter(item => {
        if (!item.unmapped?.compliance) return false;
        return Object.keys(item.unmapped.compliance).some(key => 
          key.toLowerCase().replace(/-/g, '_').includes(selectedFramework.toLowerCase().replace(/-/g, '_'))
        );
      });
    }

    // Apply region filter
    if (selectedRegion) {
      filtered = filtered.filter(item => item.cloud?.region === selectedRegion);
    }

    const stats = {
      total: filtered.length,
      failed: filtered.filter(item => item.status_code === 'FAIL').length,
      passed: filtered.filter(item => item.status_code === 'PASS').length,
      manual: filtered.filter(item => item.status_code === 'MANUAL').length,
      regions: [...new Set(jsonData.map(item => item.cloud?.region).filter(Boolean))],
      severityBreakdown: {},
      services: {},
      complianceFrameworks: {},
      accountId: filtered[0]?.cloud?.account?.uid || 'Unknown'
    };

    // Calculate severity breakdown
    filtered.forEach(item => {
      const severity = item.severity || 'Unknown';
      stats.severityBreakdown[severity] = (stats.severityBreakdown[severity] || 0) + 1;

      const service = item.resources?.[0]?.group?.name || 'Other';
      stats.services[service] = (stats.services[service] || 0) + 1;

      // Count compliance frameworks
      if (item.unmapped?.compliance) {
        Object.keys(item.unmapped.compliance).forEach(framework => {
          stats.complianceFrameworks[framework] = (stats.complianceFrameworks[framework] || 0) + 1;
        });
      }
    });

    stats.securityScore = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
    stats.criticalHigh = (stats.severityBreakdown.Critical || 0) + (stats.severityBreakdown.High || 0);
    
    return stats;
  };

  const getFilteredFindings = () => {
    if (!jsonData) return [];
    
    let filtered = jsonData;
    
    // Apply compliance framework filter
    if (selectedFramework) {
      filtered = filtered.filter(item => {
        if (!item.unmapped?.compliance) return false;
        return Object.keys(item.unmapped.compliance).some(key => 
          key.toLowerCase().replace(/-/g, '_').includes(selectedFramework.toLowerCase().replace(/-/g, '_'))
        );
      });
    }

    // Apply region filter
    if (selectedRegion) {
      filtered = filtered.filter(item => item.cloud?.region === selectedRegion);
    }

    // Apply severity/status filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'FAIL') {
        filtered = filtered.filter(item => item.status_code === 'FAIL');
      } else {
        filtered = filtered.filter(item => item.severity === activeFilter);
      }
    }
    
    return filtered;
  };

  const exportToCSV = () => {
    const findings = getFilteredFindings();
    const csvData = [
      ['Status', 'Severity', 'Service', 'Region', 'Title', 'Description', 'Resource', 'Compliance']
    ];

    findings.forEach(finding => {
      const compliance = finding.unmapped?.compliance ? 
        Object.entries(finding.unmapped.compliance).map(([key, values]) => 
          `${key}: ${Array.isArray(values) ? values.join(', ') : values}`
        ).join('; ') : '';

      csvData.push([
        finding.status_code || '',
        finding.severity || '',
        finding.resources?.[0]?.group?.name || '',
        finding.cloud?.region || '',
        finding.finding_info?.title || '',
        finding.finding_info?.desc || '',
        finding.resources?.[0]?.uid || '',
        compliance
      ]);
    });

    const csvContent = csvData.map(row => 
      row.map(field => `"${field?.toString().replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `security_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = calculateStats();
  const filteredFindings = getFilteredFindings();

  const getSeverityChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.severityBreakdown).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: SEVERITY_COLORS[severity] || '#6b7280'
    }));
  };

  const getServiceChartData = () => {
    if (!stats) return [];
    return Object.entries(stats.services).slice(0, 8).map(([service, count]) => ({
      name: service,
      value: count
    }));
  };

  const getRegionChartData = () => {
    if (!stats) return [];
    return stats.regions.slice(0, 8).map(region => {
      const regionFindings = jsonData.filter(item => item.cloud?.region === region);
      return {
        name: region,
        failed: regionFindings.filter(item => item.status_code === 'FAIL').length,
        passed: regionFindings.filter(item => item.status_code === 'PASS').length,
        total: regionFindings.length
      };
    });
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="max-w-7xl mx-auto p-5">
        
        {/* Header */}
        <div className="mb-8 p-8 rounded-3xl shadow-2xl" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-content text-white text-3xl font-bold" style={{
              background: 'linear-gradient(45deg, #4f46e5, #7c3aed)'
            }}>
              <Shield className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-1">Security Assessment Report</h1>
              <p className="text-xl text-gray-600">AWS Cloud Security Analysis - Powered by Prowler</p>
            </div>
          </div>

          {!jsonData ? (
            <div className="text-center py-12">
              <Upload className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">Upload Prowler JSON Report</h3>
              <p className="text-lg text-gray-600 mb-8">Select your Prowler security compliance JSON file to analyze</p>
              <label className="inline-flex items-center px-10 py-5 text-xl font-semibold text-white rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2" style={{
                background: 'linear-gradient(45deg, #4f46e5, #7c3aed)'
              }}>
                <Upload className="w-6 h-6 mr-3" />
                {loading ? 'Processing...' : 'Choose JSON File'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl" style={{background: 'rgba(249, 250, 251, 0.8)'}}>
                <div className="text-sm font-medium text-gray-600 mb-2">Report Generated</div>
                <div className="text-lg font-bold text-gray-800">{new Date().toLocaleDateString()}</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{background: 'rgba(249, 250, 251, 0.8)'}}>
                <div className="text-sm font-medium text-gray-600 mb-2">AWS Account ID</div>
                <div className="text-lg font-bold text-gray-800">{stats?.accountId}</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{background: 'rgba(249, 250, 251, 0.8)'}}>
                <div className="text-sm font-medium text-gray-600 mb-2">Total Findings</div>
                <div className="text-lg font-bold text-gray-800">{stats?.total}</div>
              </div>
              <div className="text-center p-4 rounded-xl" style={{background: 'rgba(249, 250, 251, 0.8)'}}>
                <div className="text-sm font-medium text-gray-600 mb-2">Active Regions</div>
                <div className="text-lg font-bold text-gray-800">{stats?.regions.length}</div>
              </div>
            </div>
          )}
        </div>

        {jsonData && (
          <>
            {/* Enhanced Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Security Score */}
              <div className="p-6 rounded-3xl shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{
                background: stats?.securityScore >= 80 ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : stats?.securityScore >= 60 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #fecaca, #fca5a5)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <Shield className={`w-8 h-8 ${stats?.securityScore >= 80 ? 'text-green-700' : stats?.securityScore >= 60 ? 'text-yellow-700' : 'text-red-700'}`} />
                  <span className={`text-xs font-bold px-2 py-1 rounded ${stats?.securityScore >= 80 ? 'bg-green-200 text-green-800' : stats?.securityScore >= 60 ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                    {stats?.securityScore >= 80 ? 'GOOD' : stats?.securityScore >= 60 ? 'FAIR' : 'POOR'}
                  </span>
                </div>
                <div className="text-3xl font-black mb-1">{stats?.securityScore}%</div>
                <div className="text-sm font-semibold text-gray-700">Security Score</div>
              </div>

              {/* Failed Checks */}
              <div className="p-6 rounded-3xl shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{
                background: 'linear-gradient(135deg, #fecaca, #fca5a5)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <XCircle className="w-8 h-8 text-red-700" />
                  <span className="text-xs font-bold px-2 py-1 rounded bg-red-200 text-red-800">FAILED</span>
                </div>
                <div className="text-3xl font-black text-red-800 mb-1">{stats?.failed}</div>
                <div className="text-sm font-semibold text-red-700">Failed Checks</div>
              </div>

              {/* Passed Checks */}
              <div className="p-6 rounded-3xl shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{
                background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="w-8 h-8 text-green-700" />
                  <span className="text-xs font-bold px-2 py-1 rounded bg-green-200 text-green-800">PASSED</span>
                </div>
                <div className="text-3xl font-black text-green-800 mb-1">{stats?.passed}</div>
                <div className="text-sm font-semibold text-green-700">Passed Checks</div>
              </div>

              {/* Critical/High Issues */}
              <div className="p-6 rounded-3xl shadow-2xl transition-all duration-300 hover:-translate-y-2" style={{
                background: 'linear-gradient(135deg, #fed7d7, #feb2b2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-700" />
                  <span className="text-xs font-bold px-2 py-1 rounded bg-red-200 text-red-800">URGENT</span>
                </div>
                <div className="text-3xl font-black text-red-800 mb-1">{stats?.criticalHigh}</div>
                <div className="text-sm font-semibold text-red-700">Critical/High</div>
              </div>
            </div>

            {/* Filters Section */}
            <div className="mb-8 p-6 rounded-3xl shadow-2xl" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Advanced Filters</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Compliance Framework Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Framework</label>
                  <select
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Frameworks ({Object.keys(stats?.complianceFrameworks || {}).length})</option>
                    {Object.keys(stats?.complianceFrameworks || {}).map((framework) => (
                      <option key={framework} value={framework}>
                        {framework} ({stats.complianceFrameworks[framework]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AWS Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Regions ({stats?.regions.length})</option>
                    {stats?.regions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSelectedFramework('');
                      setSelectedRegion('');
                      setActiveFilter('all');
                    }}
                    className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Severity Chart - Fixed */}
              <div className="p-8 rounded-3xl shadow-2xl transition-transform duration-300 hover:-translate-y-2" style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Findings by Severity</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <RechartsPieChart data={getSeverityChartData()} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                        {getSeverityChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </RechartsPieChart>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center flex-wrap gap-4 mt-4">
                  {getSeverityChartData().map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services Chart */}
              <div className="p-8 rounded-3xl shadow-2xl transition-transform duration-300 hover:-translate-y-2" style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Findings by AWS Service</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getServiceChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="rgba(79, 70, 229, 0.8)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Regional Analysis */}
            <div className="p-8 rounded-3xl shadow-2xl mb-8 transition-transform duration-300 hover:-translate-y-2" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Regional Security Analysis</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getRegionChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="failed" fill="#dc2626" name="Failed" />
                    <Bar dataKey="passed" fill="#16a34a" name="Passed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Findings Section */}
            <div className="p-8 rounded-3xl shadow-2xl" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Security Findings ({filteredFindings.length})</h2>
              
              {/* Finding Filter Controls */}
              <div className="flex flex-wrap gap-3 mb-8">
                {['all', 'FAIL', 'Critical', 'High', 'Medium', 'Low'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:-translate-y-1 ${
                      activeFilter === filter 
                        ? 'text-white shadow-lg transform -translate-y-1'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    style={activeFilter === filter ? {
                      background: 'linear-gradient(45deg, #4f46e5, #7c3aed)'
                    } : {}}
                  >
                    {filter === 'all' ? 'All Findings' : filter === 'FAIL' ? 'Failed Only' : `${filter} Severity`}
                    <span className="ml-2 text-xs opacity-75">
                      ({filter === 'all' ? filteredFindings.length : 
                        filter === 'FAIL' ? filteredFindings.filter(f => f.status_code === 'FAIL').length :
                        filteredFindings.filter(f => f.severity === filter).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Findings List */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {filteredFindings.slice(0, 15).map((finding, index) => (
                  <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">{finding.finding_info?.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-lg text-sm font-bold uppercase ${
                            finding.status_code === 'FAIL' 
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : finding.status_code === 'PASS'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {finding.status_code}
                          </span>
                          <span 
                            className="px-3 py-1 rounded-lg text-sm font-bold"
                            style={{
                              backgroundColor: `${SEVERITY_COLORS[finding.severity] || '#6b7280'}20`,
                              color: SEVERITY_COLORS[finding.severity] || '#6b7280',
                              border: `1px solid ${SEVERITY_COLORS[finding.severity] || '#6b7280'}40`
                            }}
                          >
                            {finding.severity}
                          </span>
                          <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {finding.cloud?.region}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-xl border-l-4 border-blue-500" style={{background: '#f8fafc'}}>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Service</div>
                        <div className="text-gray-800 font-medium">{finding.resources?.[0]?.group?.name || 'N/A'}</div>
                      </div>
                      <div className="p-3 rounded-xl border-l-4 border-purple-500" style={{background: '#f8fafc'}}>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Check ID</div>
                        <div className="text-gray-800 font-medium text-xs">{finding.metadata?.event_code || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border-l-4 border-orange-500 mb-4" style={{background: '#fef7f0'}}>
                      <div className="text-sm font-semibold text-orange-800 mb-2">Risk Description</div>
                      <div className="text-gray-800 text-sm leading-relaxed">{finding.risk_details || finding.finding_info?.desc}</div>
                    </div>

                    {finding.remediation && (
                      <div className="p-5 rounded-2xl border-l-4 border-green-400 mb-4" style={{
                        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)'
                      }}>
                        <div className="font-bold text-blue-900 mb-3 flex items-center">
                          <span className="mr-2">🔧</span>
                          Remediation Steps
                        </div>
                        <div className="text-gray-800 mb-4 text-sm leading-relaxed">{finding.remediation.desc}</div>
                        {finding.remediation.references && (
                          <div className="flex flex-wrap gap-2">
                            {finding.remediation.references.slice(0, 2).map((ref, refIndex) => (
                              <a 
                                key={refIndex} 
                                href={ref} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Reference <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {finding.unmapped?.compliance && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-gray-700 mb-2">Compliance Frameworks</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(finding.unmapped.compliance).slice(0, 4).map(([key, values], compIndex) => (
                            <span key={compIndex} className="inline-block px-3 py-1 text-xs bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                              {key}: {Array.isArray(values) ? values.join(', ') : values}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {filteredFindings.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No findings match your filters</h3>
                    <p className="text-gray-500">Try adjusting your compliance framework, region, or severity filters</p>
                  </div>
                )}
              </div>
            </div>

            {/* Export Section */}
            <div className="text-center mt-8">
              <button 
                onClick={exportToCSV}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{background: 'linear-gradient(45deg, #059669, #047857)'}}
              >
                <Download className="w-6 h-6 mr-3" />
                Export Filtered Results to CSV ({filteredFindings.length} findings)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProwlerDashboard;
