import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF Export utility for Digital Twin Planner
export class PDFExporter {
  constructor() {
    this.doc = null;
    this.currentY = 20;
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 20;
  }

  // Main export function
  async exportPlanToPDF(planData, mapElement) {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.currentY = 20;

    try {
      // 1. Add header section
      this.addHeader(planData);
      
      // 2. Add plan summary
      this.addPlanSummary(planData);
      
      // 3. Add map overview
      await this.addMapOverview(mapElement);
      
      // 4. Add resource inventory
      this.addResourceInventory(planData);
      
      // 5. Add database summary
      this.addDatabaseSummary(planData);
      
      // 6. Add analytics
      this.addAnalytics(planData);
      
      // 7. Add footer
      this.addFooter(planData);
      
      // Generate filename
      const fileName = `${planData.planName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save the PDF
      this.doc.save(fileName);
      
      return { success: true, fileName };
    } catch (error) {
      console.error('PDF Export Error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if we need a new page
  checkPageBreak(requiredHeight = 30) {
    if (this.currentY + requiredHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  // Add header section
  addHeader(planData) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    
    // Title
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DIGITAL TWIN PLAN REPORT', pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;
    
    // Plan name
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(planData.planName || 'Untitled Plan', pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;
    
    // Plan metadata
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    const metadata = [
      ['Created By:', planData.userEmail || 'Unknown'],
      ['Planning Area:', planData.location || 'Not specified'],
      ['Created Date:', new Date(planData.createdAt || Date.now()).toLocaleDateString()],
      ['Last Modified:', new Date(planData.lastModified || Date.now()).toLocaleDateString()],
      ['Plan ID:', planData.id || 'N/A']
    ];
    
    metadata.forEach(([label, value]) => {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(label, this.margin, this.currentY);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(value, this.margin + 40, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 10;
  }

  // Add plan summary
  addPlanSummary(planData) {
    this.checkPageBreak(40);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PLAN SUMMARY', this.margin, this.currentY);
    this.currentY += 15;
    
    const resources = planData.resources || [];
    const resourceCounts = this.getResourceCounts(resources);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    const summaryText = `This plan covers ${resources.length} total resources including ${resourceCounts.house} houses accommodating ${resourceCounts.totalResidents} residents and ${resourceCounts.totalStudents} students. The plan includes infrastructure elements such as ${resourceCounts.school} schools, ${resourceCounts.water} water sources, and various other community facilities.`;
    
    const splitText = this.doc.splitTextToSize(summaryText, 170);
    this.doc.text(splitText, this.margin, this.currentY);
    this.currentY += splitText.length * 6 + 15;
  }

  // Add map overview - improved version
  async addMapOverview(mapElement) {
    this.checkPageBreak(120);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('MAP OVERVIEW', this.margin, this.currentY);
    this.currentY += 15;
    
    try {
      // Try multiple ways to find the map element
      let targetMapElement = mapElement;
      
      if (!targetMapElement) {
        // Try different selectors to find the map
        targetMapElement = document.querySelector('.leaflet-container') ||
                          document.querySelector('.leaflet-map-pane') ||
                          document.querySelector('[class*="leaflet"]') ||
                          document.querySelector('.map-container') ||
                          document.getElementById('map');
      }
      
      if (!targetMapElement) {
        console.warn('No map element found, trying to find any map-related container');
        // Look for any div that might contain a map
        const allDivs = document.querySelectorAll('div');
        for (let div of allDivs) {
          if (div.className.includes('map') || div.className.includes('leaflet')) {
            targetMapElement = div;
            break;
          }
        }
      }
      
      if (targetMapElement) {
        console.log('Found map element:', targetMapElement);
        
        // Wait for map to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Force map to be visible and properly sized before capture
        const originalStyle = targetMapElement.style.cssText;
        targetMapElement.style.visibility = 'visible';
        targetMapElement.style.opacity = '1';
        
        // Set fixed dimensions for consistent capture
        const captureOptions = {
          useCORS: true,
          allowTaint: true,
          scale: 1,
          width: 800,  // Fixed width
          height: 600, // Fixed height
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element) => {
            // Ignore UI elements that might be overlaying the map
            return element.classList.contains('leaflet-control') ||
                   element.classList.contains('leaflet-popup') ||
                   element.classList.contains('export-modal') ||
                   element.classList.contains('modal');
          }
        };
        
        console.log('Capturing map with options:', captureOptions);
        const canvas = await html2canvas(targetMapElement, captureOptions);
        
        // Restore original style
        targetMapElement.style.cssText = originalStyle;
        
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          
          // Calculate image dimensions for PDF (maintain aspect ratio)
          const maxWidth = 170; // Maximum width in PDF
          const maxHeight = 120; // Maximum height in PDF
          
          let imgWidth = maxWidth;
          let imgHeight = (canvas.height * maxWidth) / canvas.width;
          
          // If height is too large, scale by height instead
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (canvas.width * maxHeight) / canvas.height;
          }
          
          this.checkPageBreak(imgHeight + 30);
          
          // Add the map image to PDF
          this.doc.addImage(imgData, 'JPEG', this.margin, this.currentY, imgWidth, imgHeight);
          this.currentY += imgHeight + 10;
          
          // Add map details
          this.doc.setFontSize(10);
          this.doc.setFont('helvetica', 'italic');
          this.doc.text(`Map view showing planning area with all resources (${canvas.width}x${canvas.height}px)`, this.margin, this.currentY);
          this.currentY += 8;
          this.doc.text('Legend: Houses (🏠), Schools (🏫), Water (💧), Roads (🛣️), Hospitals (🏥)', this.margin, this.currentY);
          this.currentY += 15;
          
          console.log('Map successfully captured and added to PDF');
          return true;
        } else {
          throw new Error('Canvas is empty or invalid');
        }
        
      } else {
        throw new Error('Map element not found in DOM');
      }
      
    } catch (error) {
      console.error('Error capturing map:', error);
      this.addMapPlaceholder();
      return false;
    }
  }

  // Enhanced placeholder with better visual representation
  addMapPlaceholder() {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    // Draw a placeholder rectangle with border
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(this.margin, this.currentY, 170, 100, 'F');
    
    // Add border
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setLineWidth(1);
    this.doc.rect(this.margin, this.currentY, 170, 100);
    
    // Add grid pattern to make it look like a map
    this.doc.setDrawColor(240, 240, 240);
    this.doc.setLineWidth(0.5);
    for (let i = 1; i < 6; i++) {
      const x = this.margin + (170 * i / 6);
      this.doc.line(x, this.currentY, x, this.currentY + 100);
    }
    for (let i = 1; i < 4; i++) {
      const y = this.currentY + (100 * i / 4);
      this.doc.line(this.margin, y, this.margin + 170, y);
    }
    
    // Add placeholder text
    this.doc.setTextColor(120, 120, 120);
    this.doc.setFontSize(14);
    this.doc.text('MAP VISUALIZATION', this.margin + 85, this.currentY + 40, { align: 'center' });
    this.doc.setFontSize(10);
    this.doc.text('Map capture unavailable', this.margin + 85, this.currentY + 50, { align: 'center' });
    this.doc.text('Please ensure map is visible during export', this.margin + 85, this.currentY + 60, { align: 'center' });
    
    this.doc.setTextColor(0, 0, 0); // Reset color
    this.currentY += 110;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('Note: For map capture, ensure the plan page is open and map is fully loaded', this.margin, this.currentY);
    this.currentY += 15;
  }

  // Add resource inventory
  addResourceInventory(planData) {
    this.checkPageBreak(60);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RESOURCE INVENTORY', this.margin, this.currentY);
    this.currentY += 15;
    
    const resources = planData.resources || [];
    const resourceCounts = this.getResourceCounts(resources);
    
    // Create table data
    const tableData = [
      ['Houses', resourceCounts.house, `${resourceCounts.totalResidents} residents, ${resourceCounts.totalStudents} students`],
      ['Schools', resourceCounts.school, 'Educational facilities'],
      ['Water Sources', resourceCounts.water, 'Water supply infrastructure'],
      ['Roads', resourceCounts.road, 'Transportation network'],
      ['Hospitals', resourceCounts.hospital, 'Healthcare facilities'],
      ['Parks', resourceCounts.park, 'Recreation areas'],
      ['Other', resourceCounts.other, 'Miscellaneous infrastructure']
    ];
    
    this.drawTable(['Resource Type', 'Count', 'Details'], tableData);
    this.currentY += 15;
  }

  // Add database summary
  addDatabaseSummary(planData) {
    this.checkPageBreak(40);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('DATABASE INTEGRATION', this.margin, this.currentY);
    this.currentY += 15;
    
    const databases = planData.databaseSources || [];
    
    if (databases.length > 0) {
      const dbTableData = databases.map(db => [
        db.name || 'Unknown Database',
        db.resourcesUsed || 0,
        new Date(db.importedAt || Date.now()).toLocaleDateString()
      ]);
      
      this.drawTable(['Database Name', 'Resources Used', 'Import Date'], dbTableData);
      this.currentY += 15;
    } else {
      this.doc.setFontSize(12);
      this.doc.text('No external databases integrated with this plan.', this.margin, this.currentY);
      this.currentY += 20;
    }
  }

  // Add analytics section
  addAnalytics(planData) {
    this.checkPageBreak(60);
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PLANNING ANALYTICS', this.margin, this.currentY);
    this.currentY += 15;
    
    const resources = planData.resources || [];
    const analytics = this.calculateAnalytics(resources);
    
    // Analytics summary
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    
    const analyticsData = [
      ['Total Population', analytics.totalResidents],
      ['Student Population', analytics.totalStudents],
      ['Average Household Size', analytics.avgHouseholdSize.toFixed(1)],
      ['Population Density', `${analytics.populationDensity.toFixed(0)} per sq km`],
      ['School Coverage Ratio', `1:${analytics.schoolCoverageRatio.toFixed(0)}`],
      ['Infrastructure Score', `${analytics.infrastructureScore.toFixed(1)}/10`]
    ];
    
    this.drawTable(['Metric', 'Value'], analyticsData);
    this.currentY += 15;
    
    // Recommendations
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RECOMMENDATIONS', this.margin, this.currentY);
    this.currentY += 10;
    
    const recommendations = this.generateRecommendations(analytics);
    recommendations.forEach((rec, index) => {
      this.checkPageBreak(15);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${index + 1}. ${rec}`, this.margin, this.currentY);
      this.currentY += 8;
    });
  }

  // Add footer
  addFooter(planData) {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 15, 190, this.pageHeight - 15);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Generated by Digital Twin Planner', this.margin, this.pageHeight - 8);
      this.doc.text(`Page ${i} of ${pageCount}`, 190, this.pageHeight - 8, { align: 'right' });
      this.doc.text(new Date().toLocaleString(), 105, this.pageHeight - 8, { align: 'center' });
    }
  }

  // Helper functions
  getResourceCounts(resources) {
    const counts = {
      house: 0, school: 0, water: 0, road: 0, hospital: 0, park: 0, other: 0,
      totalResidents: 0, totalStudents: 0
    };
    
    resources.forEach(resource => {
      const type = resource.type || 'other';
      if (counts.hasOwnProperty(type)) {
        counts[type]++;
      } else {
        counts.other++;
      }
      
      if (type === 'house') {
        counts.totalResidents += resource.residents || 0;
        counts.totalStudents += resource.students || 0;
      }
    });
    
    return counts;
  }

  calculateAnalytics(resources) {
    const counts = this.getResourceCounts(resources);
    const totalHouses = counts.house || 1;
    
    return {
      totalResidents: counts.totalResidents,
      totalStudents: counts.totalStudents,
      avgHouseholdSize: counts.totalResidents / totalHouses,
      populationDensity: counts.totalResidents * 100, // Rough estimate
      schoolCoverageRatio: counts.totalStudents / (counts.school || 1),
      infrastructureScore: Math.min(10, (counts.school + counts.water + counts.hospital) * 2)
    };
  }

  generateRecommendations(analytics) {
    const recommendations = [];
    
    if (analytics.avgHouseholdSize > 6) {
      recommendations.push('Consider housing density regulations as average household size is high');
    }
    
    if (analytics.schoolCoverageRatio > 100) {
      recommendations.push('Additional schools may be needed to serve the student population');
    }
    
    if (analytics.infrastructureScore < 5) {
      recommendations.push('Infrastructure development needed - focus on essential services');
    }
    
    if (analytics.totalResidents > 1000) {
      recommendations.push('Large population area - ensure adequate healthcare and emergency services');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Plan appears well-balanced with good resource distribution');
    }
    
    return recommendations;
  }

  // Manual table drawing method to replace autoTable
  drawTable(headers, data) {
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / headers.length;
    const rowHeight = 8;
    
    // Draw headers
    this.doc.setFillColor(0, 255, 255);
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(10);
    this.doc.rect(this.margin, this.currentY, tableWidth, rowHeight, 'F');
    
    headers.forEach((header, index) => {
      this.doc.text(String(header), this.margin + index * colWidth + 2, this.currentY + 5);
    });
    
    this.currentY += rowHeight;
    this.doc.setTextColor(0, 0, 0);
    
    // Draw data rows
    data.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight + 5);
      
      if (rowIndex % 2 === 0) {
        this.doc.setFillColor(245, 245, 245);
        this.doc.rect(this.margin, this.currentY, tableWidth, rowHeight, 'F');
      }
      
      row.forEach((cell, colIndex) => {
        const cellText = String(cell || '');
        const maxWidth = colWidth - 4;
        const splitText = this.doc.splitTextToSize(cellText, maxWidth);
        this.doc.text(splitText[0] || '', this.margin + colIndex * colWidth + 2, this.currentY + 5);
      });
      
      this.currentY += rowHeight;
    });
  }
}

// Export function to be used by components
export const exportPlanToPDF = async (planData, mapElement) => {
  const exporter = new PDFExporter();
  return await exporter.exportPlanToPDF(planData, mapElement);
};
