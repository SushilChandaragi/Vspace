import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Analytics.css';

function Analytics() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [animatedValues, setAnimatedValues] = useState({});

  // City data for Belgaum (Belagavi)
  const cityData = {
    overview: {
      cityName: "Belgaum (Belagavi)",
      state: "Karnataka, India",
      population: 700000,
      area: 244.11, // km²
      density: 2867, // per km²
      established: "12th Century"
    },
    demographics: {
      population: 700000,
      urbanRural: { urban: 65, rural: 35 },
      sexRatio: 986,
      literacyRate: 88.7,
      languages: ['Kannada', 'Marathi', 'Hindi', 'English']
    },
    economy: {
      sectors: [
        { name: 'Foundry & Castings', percentage: 30, color: '#0ff' },
        { name: 'Agriculture', percentage: 25, color: '#09f' },
        { name: 'Defense & Aerospace', percentage: 20, color: '#06c' },
        { name: 'IT & Startups', percentage: 15, color: '#039' },
        { name: 'Other Industries', percentage: 10, color: '#026' }
      ],
      exports: ['Industrial castings', 'Machinery components', 'Sugar', 'Textiles']
    },
    infrastructure: {
      transport: {
        roads: ['NH-4A', 'NH-48'],
        railway: 'Belagavi Railway Station (Hubli–Miraj line)',
        airport: 'Belagavi Airport (IXG)',
        connectivity: 85 // percentage
      },
      utilities: {
        waterSupply: 78,
        sanitation: 82,
        electricity: 95,
        internet: 72
      }
    },
    environment: {
      greenCover: 20,
      airQuality: 75, // Good to Moderate (50-90 range = 75% healthy)
      waterBodies: ['Rakaskop Reservoir', 'Ghataprabha River'],
      wasteManagement: 68
    },
    education: {
      institutions: [
        'Visvesvaraya Technological University (VTU)',
        'KLE Technological University',
        'JNMC Medical College',
        'RCU (Rani Channamma University)'
      ],
      studentHub: true,
      literacyTrend: [82.5, 84.2, 86.1, 87.3, 88.7] // last 5 years
    }
  };

  // Animate numbers on component mount
  useEffect(() => {
    const animateValue = (key, endValue, duration = 2000) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(endValue * progress);
        
        setAnimatedValues(prev => ({ ...prev, [key]: currentValue }));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    animateValue('population', cityData.overview.population);
    animateValue('literacyRate', cityData.demographics.literacyRate);
    animateValue('greenCover', cityData.environment.greenCover);
    animateValue('connectivity', cityData.infrastructure.transport.connectivity);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏙️' },
    { id: 'demographics', label: 'Demographics', icon: '👥' },
    { id: 'economy', label: 'Economy', icon: '💼' },
    { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
    { id: 'environment', label: 'Environment', icon: '🌱' },
    { id: 'education', label: 'Education', icon: '🎓' }
  ];

  const renderChart = (data, type = 'bar') => {
    if (type === 'pie') {
      const total = data.reduce((sum, item) => sum + item.percentage, 0);
      let cumulativePercentage = 0;
      
      return (
        <div className="pie-chart">
          <svg viewBox="0 0 200 200" className="pie-svg">
            {data.map((item, index) => {
              const startAngle = (cumulativePercentage / 100) * 360;
              const endAngle = ((cumulativePercentage + item.percentage) / 100) * 360;
              const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
              const largeArc = item.percentage > 50 ? 1 : 0;
              
              const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
              
              cumulativePercentage += item.percentage;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  className="pie-slice"
                />
              );
            })}
          </svg>
          <div className="pie-legend">
            {data.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.name}: {item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (type === 'progress') {
      return (
        <div className="progress-charts">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="progress-item">
              <div className="progress-header">
                <span className="progress-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <span className="progress-value">{value}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${value}%` }}
                  data-value={value}
                ></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  const renderOverview = () => (
    <div className="analytics-content">
      <div className="city-header">
        <h2 className="city-name">{cityData.overview.cityName}</h2>
        <p className="city-location">{cityData.overview.state}</p>
      </div>
      
      <div className="overview-grid">
        <div className="overview-card population">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <div className="card-number">{(animatedValues.population || 0).toLocaleString()}</div>
            <div className="card-label">Population</div>
          </div>
        </div>
        
        <div className="overview-card area">
          <div className="card-icon">📐</div>
          <div className="card-content">
            <div className="card-number">{cityData.overview.area} km²</div>
            <div className="card-label">Total Area</div>
          </div>
        </div>
        
        <div className="overview-card density">
          <div className="card-icon">🏘️</div>
          <div className="card-content">
            <div className="card-number">{cityData.overview.density.toLocaleString()}</div>
            <div className="card-label">Density/km²</div>
          </div>
        </div>
        
        <div className="overview-card established">
          <div className="card-icon">🏛️</div>
          <div className="card-content">
            <div className="card-number">{cityData.overview.established}</div>
            <div className="card-label">Established</div>
          </div>
        </div>
      </div>

      <div className="summary-section">
        <h3 className="summary-title">City Summary</h3>
        <div className="summary-text">
          <p>
            Belgaum (officially Belagavi) is a vibrant and rapidly growing city located in the northwestern part of Karnataka. 
            Known for its unique blend of industrial strength, educational institutions, and cultural diversity, it serves as an 
            important urban hub bordering Maharashtra and Goa.
          </p>
          <p>
            With its robust manufacturing sector, presence of defense units, and emerging startup culture, Belgaum plays a key 
            role in the regional economy. The city's educational infrastructure—hosting prominent engineering, medical, and 
            university campuses—draws students from across the country, contributing to its dynamic demographic mix.
          </p>
          <p>
            Under the Smart City Mission, Belgaum is witnessing transformations in mobility, sanitation, and digital infrastructure. 
            Despite challenges such as seasonal water shortages, the city maintains a relatively green and livable environment 
            with a moderate air quality index.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDemographics = () => (
    <div className="analytics-content">
      <div className="demographics-grid">
        <div className="demo-card">
          <h3>Population Distribution</h3>
          <div className="urban-rural-chart">
            <div className="segment urban" style={{ width: `${cityData.demographics.urbanRural.urban}%` }}>
              Urban {cityData.demographics.urbanRural.urban}%
            </div>
            <div className="segment rural" style={{ width: `${cityData.demographics.urbanRural.rural}%` }}>
              Rural {cityData.demographics.urbanRural.rural}%
            </div>
          </div>
        </div>
        
        <div className="demo-card">
          <h3>Key Statistics</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Sex Ratio</span>
              <span className="stat-value">{cityData.demographics.sexRatio} F/1000M</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Literacy Rate</span>
              <span className="stat-value">{animatedValues.literacyRate || 0}%</span>
            </div>
          </div>
        </div>
        
        <div className="demo-card languages">
          <h3>Languages Spoken</h3>
          <div className="languages-list">
            {cityData.demographics.languages.map((lang, index) => (
              <span key={index} className="language-tag">{lang}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEconomy = () => (
    <div className="analytics-content">
      <div className="economy-grid">
        <div className="economy-section">
          <h3>Economic Sectors</h3>
          {renderChart(cityData.economy.sectors, 'pie')}
        </div>
        
        <div className="economy-section">
          <h3>Key Exports</h3>
          <div className="exports-list">
            {cityData.economy.exports.map((exportItem, index) => (
              <div key={index} className="export-item">
                <span className="export-icon">📦</span>
                <span className="export-name">{exportItem}</span>
              </div>
            ))}
          </div>
          
          <div className="industrial-hubs">
            <h4>Industrial Hubs</h4>
            <ul>
              <li>Udyambag</li>
              <li>Macche Industrial Area</li>
              <li>Auto-Nagar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInfrastructure = () => (
    <div className="analytics-content">
      <div className="infrastructure-grid">
        <div className="infra-section">
          <h3>Utilities Coverage</h3>
          {renderChart(cityData.infrastructure.utilities, 'progress')}
        </div>
        
        <div className="infra-section">
          <h3>Transportation</h3>
          <div className="transport-info">
            <div className="transport-item">
              <span className="transport-icon">🛣️</span>
              <div className="transport-details">
                <h4>Roads</h4>
                <p>{cityData.infrastructure.transport.roads.join(', ')}</p>
              </div>
            </div>
            <div className="transport-item">
              <span className="transport-icon">🚂</span>
              <div className="transport-details">
                <h4>Railway</h4>
                <p>{cityData.infrastructure.transport.railway}</p>
              </div>
            </div>
            <div className="transport-item">
              <span className="transport-icon">✈️</span>
              <div className="transport-details">
                <h4>Airport</h4>
                <p>{cityData.infrastructure.transport.airport}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnvironment = () => (
    <div className="analytics-content">
      <div className="environment-grid">
        <div className="env-card">
          <h3>Environmental Metrics</h3>
          <div className="env-metrics">
            <div className="metric-item">
              <div className="metric-icon">🌳</div>
              <div className="metric-content">
                <div className="metric-value">{animatedValues.greenCover || 0}%</div>
                <div className="metric-label">Green Cover</div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">🌬️</div>
              <div className="metric-content">
                <div className="metric-value">{cityData.environment.airQuality}%</div>
                <div className="metric-label">Air Quality (Good-Moderate)</div>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">♻️</div>
              <div className="metric-content">
                <div className="metric-value">{cityData.environment.wasteManagement}%</div>
                <div className="metric-label">Waste Management</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="env-card">
          <h3>Water Bodies</h3>
          <div className="water-bodies">
            {cityData.environment.waterBodies.map((body, index) => (
              <div key={index} className="water-body-item">
                <span className="water-icon">💧</span>
                <span className="water-name">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEducation = () => (
    <div className="analytics-content">
      <div className="education-grid">
        <div className="edu-section">
          <h3>Major Institutions</h3>
          <div className="institutions-list">
            {cityData.education.institutions.map((institution, index) => (
              <div key={index} className="institution-item">
                <span className="institution-icon">🏫</span>
                <span className="institution-name">{institution}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="edu-section">
          <h3>Literacy Trend (Last 5 Years)</h3>
          <div className="literacy-chart">
            {cityData.education.literacyTrend.map((rate, index) => (
              <div key={index} className="trend-bar">
                <div 
                  className="trend-fill"
                  style={{ height: `${(rate - 80) * 5}%` }}
                ></div>
                <span className="trend-year">{2019 + index}</span>
                <span className="trend-value">{rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverview();
      case 'demographics': return renderDemographics();
      case 'economy': return renderEconomy();
      case 'infrastructure': return renderInfrastructure();
      case 'environment': return renderEnvironment();
      case 'education': return renderEducation();
      default: return renderOverview();
    }
  };

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
            <div className="page-title">
              <h1>City Analytics</h1>
              <p>Comprehensive data insights for urban planning</p>
            </div>
          </div>
        </div>
      </header>

      <div className="analytics-container">
        <nav className="analytics-nav">
          <div className="nav-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${selectedTab === tab.id ? 'active' : ''}`}
                onClick={() => setSelectedTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <main className="analytics-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Analytics;
