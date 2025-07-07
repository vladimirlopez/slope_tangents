/**
 * Main application controller
 */

class QuadraticRegressionApp {
    constructor() {
        this.plotBtn = null;
        this.canvas = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    /**
     * Setup the application after DOM is ready
     */
    setupApp() {
        // Initialize global instances
        dataTable = new DataTable();
        parabolaAnalyzer = new ParabolaAnalyzer();
        
        // Get DOM elements
        this.plotBtn = DOMUtils.getElementById('plotBtn');
        this.fitBtn = DOMUtils.getElementById('fitBtn');
        this.addRowBtn = DOMUtils.getElementById('addRowBtn');
        this.canvas = DOMUtils.getElementById('chart');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Add sample data button (for development/demo)
        this.addSampleDataButton();
        
        console.log('Quadratic Regression App initialized successfully');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Plot button event listener
        if (this.plotBtn) {
            this.plotBtn.addEventListener('click', () => this.performAnalysis());
        }

        // Fit button event listener
        if (this.fitBtn) {
            this.fitBtn.addEventListener('click', () => this.toggleQuadraticFit());
        }

        // Add row button event listener
        if (this.addRowBtn) {
            this.addRowBtn.addEventListener('click', () => {
                if (dataTable) {
                    dataTable.addRow();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.performAnalysis();
            }
        });

        // Add window resize handler for chart responsiveness
        window.addEventListener('resize', () => {
            if (parabolaAnalyzer && parabolaAnalyzer.chart) {
                parabolaAnalyzer.chart.resize();
            }
        });
    }

    /**
     * Add sample data button for demonstration
     */
    addSampleDataButton() {
        const tableControls = document.querySelector('.table-controls');
        if (tableControls) {
            const sampleBtn = document.createElement('button');
            sampleBtn.textContent = 'Load Sample Data';
            sampleBtn.className = 'btn btn-secondary';
            sampleBtn.addEventListener('click', () => {
                if (dataTable) {
                    dataTable.loadSampleData();
                }
            });
            tableControls.appendChild(sampleBtn);
        }
    }

    /**
     * Perform quadratic regression analysis
     */
    async performAnalysis() {
        try {
            DOMUtils.hideStatus();
            
            // Get data points from table
            const dataPoints = dataTable.getDataPoints();
            
            // Validate data
            const validation = ValidationUtils.validateDataPoints(dataPoints);
            if (!validation.isValid) {
                DOMUtils.showStatus(validation.message, 'error');
                return;
            }

            // Show loading status
            DOMUtils.showStatus('Performing quadratic regression...', 'info');

            // Perform regression analysis
            const results = parabolaAnalyzer.performQuadraticRegression(dataPoints);
            
            // Update equation display
            this.updateEquationDisplay(results);
            
            // Create/update chart
            if (this.canvas) {
                parabolaAnalyzer.createChart(this.canvas);
                
                // Show the fit button after successful plot
                if (this.fitBtn) {
                    this.fitBtn.classList.add('show');
                }
            }
            
            // Show success message
            DOMUtils.showStatus(
                `Data plotted! R² = ${MathUtils.formatNumber(results.rSquared, 4)}`, 
                'success'
            );
            
            // Log results for debugging
            console.log('Regression Results:', results);
            
        } catch (error) {
            console.error('Analysis error:', error);
            DOMUtils.showStatus(`Analysis failed: ${error.message}`, 'error');
        }
    }

    /**
     * Update equation display section
     * @param {object} results - Regression results
     */
    updateEquationDisplay(results) {
        const { coefficients, rSquared } = results;
        
        // Show analysis results section
        const analysisResults = DOMUtils.getElementById('analysisResults');
        if (analysisResults) {
            analysisResults.classList.add('show');
        }
        
        // Update equation string
        const equationElement = DOMUtils.getElementById('quadraticEquation');
        if (equationElement) {
            equationElement.textContent = parabolaAnalyzer.getEquationString();
        }
        
        // Update individual coefficients
        const coeffAElement = DOMUtils.getElementById('coeffA');
        const coeffBElement = DOMUtils.getElementById('coeffB');
        const coeffCElement = DOMUtils.getElementById('coeffC');
        
        if (coeffAElement) {
            coeffAElement.textContent = MathUtils.formatNumber(coefficients.a, 6);
        }
        if (coeffBElement) {
            coeffBElement.textContent = MathUtils.formatNumber(coefficients.b, 6);
        }
        if (coeffCElement) {
            coeffCElement.textContent = MathUtils.formatNumber(coefficients.c, 6);
        }
        
        // Update R-squared
        const rSquaredElement = DOMUtils.getElementById('rSquared');
        if (rSquaredElement) {
            rSquaredElement.textContent = MathUtils.formatNumber(rSquared, 4);
            
            // Color code R-squared based on quality
            const parent = rSquaredElement.parentElement;
            if (parent) {
                parent.style.backgroundColor = this.getRSquaredColor(rSquared);
            }
        }
    }

    /**
     * Get background color based on R-squared value
     * @param {number} rSquared - R-squared value
     * @returns {string} CSS color string
     */
    getRSquaredColor(rSquared) {
        if (rSquared >= 0.9) return '#d5f4e6'; // Excellent fit - green
        if (rSquared >= 0.7) return '#fff3cd'; // Good fit - yellow
        if (rSquared >= 0.5) return '#f8d7da'; // Poor fit - light red
        return '#f8d7da'; // Very poor fit - red
    }

    /**
     * Export current analysis results
     * @returns {object} Analysis results object
     */
    exportResults() {
        if (!parabolaAnalyzer || !parabolaAnalyzer.coefficients) {
            DOMUtils.showStatus('No analysis results to export', 'error');
            return null;
        }

        const results = {
            timestamp: new Date().toISOString(),
            dataPoints: parabolaAnalyzer.dataPoints,
            coefficients: parabolaAnalyzer.coefficients,
            rSquared: parabolaAnalyzer.rSquared,
            equation: parabolaAnalyzer.getEquationString()
        };

        return results;
    }

    /**
     * Save analysis results as JSON file
     */
    saveResults() {
        const results = this.exportResults();
        if (!results) return;

        const blob = new Blob([JSON.stringify(results, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quadratic_analysis_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        DOMUtils.showStatus('Results saved successfully!', 'success');
    }

    /**
     * Reset the entire application
     */
    reset() {
        if (confirm('Are you sure you want to reset the entire application?')) {
            // Clear data table
            if (dataTable) {
                dataTable.clearAllData();
            }
            
            // Hide analysis sections
            const analysisResults = document.getElementById('analysisResults');
            if (analysisResults) {
                analysisResults.classList.remove('show');
            }
            
            const pointInfo = document.getElementById('pointInfo');
            if (pointInfo) {
                pointInfo.classList.remove('show');
            }
            
            // Clear chart
            if (parabolaAnalyzer && parabolaAnalyzer.chart) {
                parabolaAnalyzer.chart.destroy();
                parabolaAnalyzer.chart = null;
            }
            
            // Reset analyzers
            parabolaAnalyzer = new ParabolaAnalyzer();
            
            DOMUtils.hideStatus();
            DOMUtils.showStatus('Application reset successfully!', 'success');
        }
    }

    /**
     * Toggle quadratic fit display
     */
    toggleQuadraticFit() {
        if (!parabolaAnalyzer || !parabolaAnalyzer.chart) {
            DOMUtils.showStatus('Please plot data points first', 'error');
            return;
        }

        const isCurrentlyShowing = parabolaAnalyzer.chart.data.datasets.some(
            dataset => dataset.label === 'Quadratic Fit'
        );

        if (isCurrentlyShowing) {
            // Hide quadratic fit
            parabolaAnalyzer.toggleQuadraticFit(false);
            this.fitBtn.textContent = 'Show Quadratic Fit';
            DOMUtils.showStatus('Quadratic fit hidden', 'info');
        } else {
            // Show quadratic fit
            parabolaAnalyzer.toggleQuadraticFit(true);
            this.fitBtn.textContent = 'Hide Quadratic Fit';
            DOMUtils.showStatus('Quadratic fit displayed', 'success');
        }
    }
}

// Initialize the application
let app;

// Start the application when the script loads
document.addEventListener('DOMContentLoaded', () => {
    app = new QuadraticRegressionApp();
});

// Add keyboard shortcuts and additional features
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save results
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (app) {
            app.saveResults();
        }
    }
    
    // Ctrl+R to reset (override browser refresh)
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (app) {
            app.reset();
        }
    }
});

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuadraticRegressionApp;
}
