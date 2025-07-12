import React, { useState } from 'react';
import { exportPlanToPDF } from '../utils/pdfExport';
import './ExportModal.css';

const ExportModal = ({ plan, isOpen, onClose, mapElementId = 'map-container' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const handlePDFExport = async () => {
    if (!plan) {
      setExportStatus('No plan data available for export');
      return;
    }

    setIsExporting(true);
    setExportStatus('Preparing map for export...');

    try {
      // Wait a moment to ensure any modals are closed and map is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to find the map element with multiple strategies
      let mapElement = null;
      
      // Strategy 1: Look for Leaflet container
      mapElement = document.querySelector('.leaflet-container');
      
      // Strategy 2: Look for map container by common class names
      if (!mapElement) {
        mapElement = document.querySelector('[class*="leaflet"]') ||
                    document.querySelector('.map-container') ||
                    document.querySelector(`#${mapElementId}`) ||
                    document.querySelector('[class*="map"]') ||
                    document.querySelector('#map') ||
                    document.querySelector('[id*="map"]');
      }
      
      // Strategy 3: Look for any div that contains map-related children
      if (!mapElement) {
        const containers = document.querySelectorAll('div');
        for (let container of containers) {
          if (container.querySelector('.leaflet-map-pane') || 
              container.querySelector('.leaflet-tile-pane')) {
            mapElement = container;
            break;
          }
        }
      }
      
      console.log('Map element detection result:', {
        found: !!mapElement,
        element: mapElement,
        className: mapElement?.className,
        id: mapElement?.id,
        dimensions: mapElement ? {
          width: mapElement.offsetWidth,
          height: mapElement.offsetHeight
        } : null
      });
      
      if (mapElement) {
        setExportStatus('Map found, capturing image...');
        
        // Ensure the map is visible and properly sized
        if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
          setExportStatus('Map not visible, trying to make it visible...');
          
          // Try to make the map visible
          mapElement.style.width = '800px';
          mapElement.style.height = '600px';
          mapElement.style.visibility = 'visible';
          mapElement.style.display = 'block';
          
          // Wait for layout to update
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        setExportStatus('Map not found, generating PDF without map...');
      }

      setExportStatus('Generating PDF...');
      
      // Prepare plan data for export
      const planData = {
        id: plan.id,
        planName: plan.planName || plan.name || 'Untitled Plan',
        userEmail: plan.userEmail || 'Unknown User',
        location: plan.location || 'Not specified',
        createdAt: plan.createdAt,
        lastModified: plan.lastModified || plan.createdAt,
        resources: plan.resources || [],
        databaseSources: plan.databaseSources || [],
        collaborators: plan.collaborators || []
      };

      const result = await exportPlanToPDF(planData, mapElement);

      if (result.success) {
        setExportStatus(`PDF exported successfully: ${result.fileName}`);
        setTimeout(() => {
          setExportStatus('');
          onClose();
        }, 2000);
      } else {
        setExportStatus(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleJSONExport = () => {
    if (!plan) {
      setExportStatus('No plan data available for export');
      return;
    }

    try {
      const exportData = {
        planMetadata: {
          id: plan.id,
          name: plan.planName || plan.name || 'Untitled Plan',
          description: plan.description || '',
          createdBy: plan.userEmail || 'Unknown User',
          createdAt: plan.createdAt,
          lastModified: plan.lastModified || plan.createdAt,
          version: '1.0',
          collaborators: plan.collaborators || []
        },
        resources: plan.resources || [],
        databaseSources: plan.databaseSources || [],
        analytics: {
          totalResources: (plan.resources || []).length,
          exportedAt: new Date().toISOString()
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      
      const fileName = `${(plan.planName || 'plan').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus(`JSON exported successfully: ${fileName}`);
      setTimeout(() => {
        setExportStatus('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('JSON export error:', error);
      setExportStatus(`JSON export failed: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Export Plan</h2>
          <button className="export-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="export-modal-content">
          <div className="export-plan-info">
            <h3>{plan?.planName || plan?.name || 'Untitled Plan'}</h3>
            <p>Resources: {(plan?.resources || []).length}</p>
            <p>Created: {plan?.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'Unknown'}</p>
          </div>

          <div className="export-options">
            <div className="export-option">
              <div className="export-option-info">
                <h4>📄 PDF Report</h4>
                <p>Complete professional report with map, analytics, and resource inventory</p>
                <ul>
                  <li>Plan summary and metadata</li>
                  <li>High-resolution map image</li>
                  <li>Resource inventory tables</li>
                  <li>Analytics and recommendations</li>
                </ul>
              </div>
              <button 
                className="export-btn primary"
                onClick={handlePDFExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>

            <div className="export-option">
              <div className="export-option-info">
                <h4>📊 JSON Data</h4>
                <p>Technical data backup for importing into other systems</p>
                <ul>
                  <li>Complete plan data structure</li>
                  <li>Resource coordinates and properties</li>
                  <li>Database source information</li>
                  <li>Collaboration metadata</li>
                </ul>
              </div>
              <button 
                className="export-btn secondary"
                onClick={handleJSONExport}
                disabled={isExporting}
              >
                Export JSON
              </button>
            </div>
          </div>

          {exportStatus && (
            <div className={`export-status ${exportStatus.includes('failed') ? 'error' : 'success'}`}>
              {exportStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
