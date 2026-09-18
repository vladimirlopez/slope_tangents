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
        tangentAnalyzer = new TangentAnalyzer(parabolaAnalyzer);
        
        // Get DOM elements
        
        this.fitBtn = DOMUtils.getElementById('fitBtn');
        this.tangentBtn = DOMUtils.getElementById('tangentBtn');
        this.addRowBtn = DOMUtils.getElementById('addRowBtn');
        this.exportGraphBtn = DOMUtils.getElementById('exportGraphBtn');
        this.canvas = DOMUtils.getElementById('chart');
        
        
        
        
        
        
        const tableBody = document.getElementById('dataTableBody');
        if (tableBody) {
            tableBody.addEventListener('input', (e) => {
                if (e.target.tagName !== 'INPUT') return;
                
                // Add row if typing in last row
                const row = e.target.closest('tr');
                if (row && dataTable && row === tableBody.lastElementChild) {
                    const inputs = row.querySelectorAll('input');
                    if (inputs[0] && inputs[1] && (inputs[0].value.trim() !== '' || inputs[1].value.trim() !== '')) {
                        dataTable.addRow();
                    }
                }

                const dataPoints = dataTable.getDataPoints().filter(p => !isNaN(p.x) && !isNaN(p.y));
                
                // Track tangent state
                const isTangentShowing = this.tangentBtn && this.tangentBtn.textContent === 'Hide Tangent Line';
                
                if (dataPoints.length > 0) {
                    parabolaAnalyzer.dataPoints = dataPoints;
                    
                    if (dataPoints.length >= 3) {
                        parabolaAnalyzer.performQuadraticRegression(dataPoints);
                        const results = {
                            coefficients: parabolaAnalyzer.coefficients,
                            rSquared: parabolaAnalyzer.rSquared
                        };
                        this.updateEquationDisplay(results);
                        
                        parabolaAnalyzer.createChart(this.canvas);
                        parabolaAnalyzer.toggleQuadraticFit(true);
                        
                        if (this.fitBtn) {
                            this.fitBtn.textContent = 'Hide Quadratic Fit';
                            this.fitBtn.classList.add('show');
                        }
                        if (this.tangentBtn) {
                            this.tangentBtn.style.display = 'inline-block';
                            this.tangentBtn.textContent = 'Hide Tangent Line';
                        }
                        
                        if (tangentAnalyzer) {
                            tangentAnalyzer.setupControls(dataPoints);
                            const tangentControls = document.getElementById('tangentControls');
                            if (tangentControls) tangentControls.classList.add('visible');
                        }
                        this.syncAxesInputs();
                    } else {
                        // Not enough points for regression, just plot points
                        parabolaAnalyzer.coefficients = null;
                        parabolaAnalyzer.createChart(this.canvas);
                        this.syncAxesInputs();
                    }
                } else {
                    if (this.canvas) {
                        parabolaAnalyzer.createEmptyChart(this.canvas);
                        this.syncAxesInputs();
                    }
                }
            });
        }




        // Setup axis label updates and in-graph click-to-edit
        const xTableLabel = document.getElementById('xLabelInput');
        const yTableLabel = document.getElementById('yLabelInput');
        const inlineInput = document.getElementById('chartInlineLabelInput');
        let activeAxis = null;
        let originalValBeforeEdit = '';

        const updateLabels = () => {
            if (parabolaAnalyzer && parabolaAnalyzer.chart) {
                const labels = parabolaAnalyzer.getAxisLabels();
                if (parabolaAnalyzer.chart.options.scales.x) {
                    parabolaAnalyzer.chart.options.scales.x.title.text = labels.x;
                    parabolaAnalyzer.chart.options.scales.x.title.display = true;
                }
                if (parabolaAnalyzer.chart.options.scales.y) {
                    parabolaAnalyzer.chart.options.scales.y.title.text = labels.y;
                    parabolaAnalyzer.chart.options.scales.y.title.display = true;
                }
                parabolaAnalyzer.chart.update('none');
            }
        };

        if (xTableLabel) xTableLabel.addEventListener('input', updateLabels);
        if (yTableLabel) yTableLabel.addEventListener('input', updateLabels);

        // Helper to open inline editor directly on graph axis
        const openInlineEditor = (axis) => {
            if (!inlineInput || !parabolaAnalyzer || !parabolaAnalyzer.chart) return;
            const chart = parabolaAnalyzer.chart;
            activeAxis = axis;

            if (axis === 'x') {
                originalValBeforeEdit = xTableLabel ? xTableLabel.value : 'X Value';
                inlineInput.value = originalValBeforeEdit;
                inlineInput.placeholder = 'X-axis label (e.g. Time (s))';
                inlineInput.style.left = `${(chart.scales.x.left + chart.scales.x.right) / 2}px`;
                inlineInput.style.transform = 'translateX(-50%)';
                inlineInput.style.top = 'auto';
                inlineInput.style.bottom = '8px';
            } else {
                originalValBeforeEdit = yTableLabel ? yTableLabel.value : 'Y Value';
                inlineInput.value = originalValBeforeEdit;
                inlineInput.placeholder = 'Y-axis label (e.g. Position (m))';
                inlineInput.style.left = '8px';
                inlineInput.style.transform = 'translateY(-50%)';
                inlineInput.style.top = `${(chart.scales.y.top + chart.scales.y.bottom) / 2}px`;
                inlineInput.style.bottom = 'auto';
            }

            inlineInput.style.display = 'block';
            inlineInput.focus();
            inlineInput.select();
        };

        if (inlineInput) {
            inlineInput.addEventListener('input', () => {
                if (!activeAxis) return;
                const val = inlineInput.value;
                if (activeAxis === 'x' && xTableLabel) {
                    xTableLabel.value = val;
                } else if (activeAxis === 'y' && yTableLabel) {
                    yTableLabel.value = val;
                }
                updateLabels();
            });

            inlineInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    inlineInput.blur();
                } else if (e.key === 'Escape') {
                    if (activeAxis === 'x' && xTableLabel) {
                        xTableLabel.value = originalValBeforeEdit;
                    } else if (activeAxis === 'y' && yTableLabel) {
                        yTableLabel.value = originalValBeforeEdit;
                    }
                    updateLabels();
                    inlineInput.style.display = 'none';
                    activeAxis = null;
                }
            });

            inlineInput.addEventListener('blur', () => {
                inlineInput.style.display = 'none';
                activeAxis = null;
                updateLabels();
            });
        }

        // Canvas hover and click detection for in-graph axis label editing
        if (this.canvas) {
            this.canvas.addEventListener('mousemove', (e) => {
                if (!parabolaAnalyzer || !parabolaAnalyzer.chart || !parabolaAnalyzer.chart.chartArea) return;
                const chart = parabolaAnalyzer.chart;
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // If hovering over the overlay card, leave cursor to card handler
                if (parabolaAnalyzer.isPointInsideCard(x, y)) {
                    this.canvas.title = 'Drag to reposition card';
                    return;
                }

                const isXAxis = (y >= chart.chartArea.bottom + 8 && x >= chart.scales.x.left && x <= chart.scales.x.right);
                const isYAxis = (x <= chart.chartArea.left && y >= chart.scales.y.top && y <= chart.scales.y.bottom);

                if (isXAxis) {
                    this.canvas.style.cursor = 'pointer';
                    this.canvas.title = 'Click to edit horizontal (X) axis label';
                } else if (isYAxis) {
                    this.canvas.style.cursor = 'pointer';
                    this.canvas.title = 'Click to edit vertical (Y) axis label';
                } else {
                    this.canvas.style.cursor = 'crosshair';
                    this.canvas.title = '';
                }
            });

            this.canvas.addEventListener('click', (e) => {
                if (!parabolaAnalyzer || !parabolaAnalyzer.chart || !parabolaAnalyzer.chart.chartArea) return;
                const chart = parabolaAnalyzer.chart;
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Ignore if clicked on the overlay card
                if (parabolaAnalyzer.isPointInsideCard(x, y)) {
                    return;
                }

                // Check if clicked in bottom area (X axis)
                if (y >= chart.chartArea.bottom + 8 && x >= chart.scales.x.left && x <= chart.scales.x.right) {
                    openInlineEditor('x');
                }
                // Check if clicked in left area (Y axis)
                else if (x <= chart.chartArea.left && y >= chart.scales.y.top && y <= chart.scales.y.bottom) {
                    openInlineEditor('y');
                }
            });
        }

        
        if (this.tangentBtn) {
            this.tangentBtn.addEventListener('click', () => {
                const tangentControls = document.getElementById('tangentControls');
                if (tangentControls.classList.contains('visible')) {
                    tangentControls.classList.remove('visible');
                    this.tangentBtn.textContent = 'Show Tangent Line';
                    if (tangentAnalyzer) tangentAnalyzer.removeTangentFromChart();
                } else {
                    tangentControls.classList.add('visible');
                    this.tangentBtn.textContent = 'Hide Tangent Line';
                    if (tangentAnalyzer) {
                        const dataPoints = dataTable.getDataPoints().filter(p => !isNaN(p.x) && !isNaN(p.y));
                        tangentAnalyzer.setupControls(dataPoints);
                    }
                }
            });
        }

        // Setup axes controls toolbar
        this.setupAxesControls();

        // Setup event listeners
        this.setupEventListeners();
        
        // Add sample data button (for development/demo)
        this.addSampleDataButton();
        
        if (this.canvas) {
            parabolaAnalyzer.createEmptyChart(this.canvas);
            this.syncAxesInputs();
        }
        console.log('Quadratic Regression App initialized successfully');
    }

    /**
     * Setup axes controls toolbar (include zero, min/max limits, reset)
     */
    setupAxesControls() {
        const includeZeroCheckbox = document.getElementById('includeZeroCheckbox');
        const resetAxesBtn = document.getElementById('resetAxesBtn');
        const xMinInput = document.getElementById('xMinInput');
        const xMaxInput = document.getElementById('xMaxInput');
        const yMinInput = document.getElementById('yMinInput');
        const yMaxInput = document.getElementById('yMaxInput');

        if (includeZeroCheckbox) {
            includeZeroCheckbox.addEventListener('change', (e) => {
                if (parabolaAnalyzer) {
                    parabolaAnalyzer.setAxesConfig({ includeZero: e.target.checked });
                    this.syncAxesInputs();
                }
            });
        }

        const applyLimitInputs = () => {
            if (!parabolaAnalyzer) return;
            const xMinVal = xMinInput && xMinInput.value.trim() !== '' ? parseFloat(xMinInput.value) : null;
            const xMaxVal = xMaxInput && xMaxInput.value.trim() !== '' ? parseFloat(xMaxInput.value) : null;
            const yMinVal = yMinInput && yMinInput.value.trim() !== '' ? parseFloat(yMinInput.value) : null;
            const yMaxVal = yMaxInput && yMaxInput.value.trim() !== '' ? parseFloat(yMaxInput.value) : null;

            parabolaAnalyzer.setAxesConfig({
                customXMin: !isNaN(xMinVal) ? xMinVal : null,
                customXMax: !isNaN(xMaxVal) ? xMaxVal : null,
                customYMin: !isNaN(yMinVal) ? yMinVal : null,
                customYMax: !isNaN(yMaxVal) ? yMaxVal : null
            });
            this.syncAxesInputs();
        };

        [xMinInput, xMaxInput, yMinInput, yMaxInput].forEach(input => {
            if (input) {
                input.addEventListener('change', applyLimitInputs);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        applyLimitInputs();
                        input.blur();
                    }
                });
            }
        });

        if (resetAxesBtn) {
            resetAxesBtn.addEventListener('click', () => {
                if (parabolaAnalyzer) {
                    parabolaAnalyzer.resetAxes();
                    if (includeZeroCheckbox) includeZeroCheckbox.checked = false;
                    if (xMinInput) xMinInput.value = '';
                    if (xMaxInput) xMaxInput.value = '';
                    if (yMinInput) yMinInput.value = '';
                    if (yMaxInput) yMaxInput.value = '';
                    this.syncAxesInputs();
                }
            });
        }
    }

    /**
     * Sync input placeholders/values and controls to active axes settings
     */
    syncAxesInputs() {
        if (!parabolaAnalyzer) return;

        const includeZeroCheckbox = document.getElementById('includeZeroCheckbox');
        const xMinInput = document.getElementById('xMinInput');
        const xMaxInput = document.getElementById('xMaxInput');
        const yMinInput = document.getElementById('yMinInput');
        const yMaxInput = document.getElementById('yMaxInput');

        const cfg = parabolaAnalyzer.axesConfig;
        const visible = parabolaAnalyzer.getVisibleRange();

        if (includeZeroCheckbox) {
            includeZeroCheckbox.checked = !!cfg.includeZero;
        }

        if (xMinInput) {
            xMinInput.value = cfg.customXMin !== null ? cfg.customXMin : '';
            xMinInput.placeholder = visible.xMin !== undefined ? MathUtils.formatNumber(visible.xMin, 1) : 'Min';
        }
        if (xMaxInput) {
            xMaxInput.value = cfg.customXMax !== null ? cfg.customXMax : '';
            xMaxInput.placeholder = visible.xMax !== undefined ? MathUtils.formatNumber(visible.xMax, 1) : 'Max';
        }
        if (yMinInput) {
            yMinInput.value = cfg.customYMin !== null ? cfg.customYMin : '';
            yMinInput.placeholder = visible.yMin !== undefined ? MathUtils.formatNumber(visible.yMin, 1) : 'Min';
        }
        if (yMaxInput) {
            yMaxInput.value = cfg.customYMax !== null ? cfg.customYMax : '';
            yMaxInput.placeholder = visible.yMax !== undefined ? MathUtils.formatNumber(visible.yMax, 1) : 'Max';
        }
    }

    /**
     * Export the current chart as a PNG image
     */
    exportGraph() {
        if (!this.canvas) return;
        
        try {
            // Temporarily enable native title and ensure axis labels are set for export
            const titleInput = document.getElementById('graphTitleInput');
            let originalTitleDisplay = false;
            if (typeof parabolaAnalyzer !== 'undefined' && parabolaAnalyzer.chart) {
                const chart = parabolaAnalyzer.chart;
                if (titleInput) {
                    originalTitleDisplay = chart.options.plugins.title.display;
                    chart.options.plugins.title.text = titleInput.value;
                    chart.options.plugins.title.display = true;
                }
                const labels = parabolaAnalyzer.getAxisLabels();
                if (chart.options.scales.x) {
                    chart.options.scales.x.title.text = labels.x;
                    chart.options.scales.x.title.display = true;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.title.text = labels.y;
                    chart.options.scales.y.title.display = true;
                }
                chart.update('none');
            }

            // Create a temporary canvas to ensure white background
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.canvas.width;
            tempCanvas.height = this.canvas.height;
            const ctx = tempCanvas.getContext('2d');
            
            // Draw white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // Draw the chart over it
            ctx.drawImage(this.canvas, 0, 0);
            
            // Restore native title display state
            if (typeof parabolaAnalyzer !== 'undefined' && parabolaAnalyzer.chart && titleInput) {
                parabolaAnalyzer.chart.options.plugins.title.display = originalTitleDisplay;
                parabolaAnalyzer.chart.update('none');
            }
            
            // Export
            const url = tempCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            let safeName = (titleInput && titleInput.value) ? titleInput.value.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'quadratic_regression_graph';
            link.download = safeName + '.png';
            link.href = url;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            DOMUtils.showStatus('Graph exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            DOMUtils.showStatus('Failed to export graph.', 'error');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Plot button event listener
        

        // Fit button event listener
        
        if (this.fitBtn) {
            this.fitBtn.addEventListener('click', () => {
                if (this.fitBtn.textContent === 'Show Quadratic Fit') {
                    this.performAnalysis();
                    this.fitBtn.textContent = 'Hide Quadratic Fit';
                } else {
                    if (parabolaAnalyzer) parabolaAnalyzer.toggleQuadraticFit(false);
                    this.fitBtn.textContent = 'Show Quadratic Fit';
                    const analysisResults = DOMUtils.getElementById('analysisResults');
                    if (analysisResults) analysisResults.classList.remove('show');
                }
            });
        }


        // Add row button event listener
        if (this.addRowBtn) {
            this.addRowBtn.addEventListener('click', () => {
                if (dataTable) {
                    dataTable.addRow();
                }
            });
        }
        
        // Export graph button event listener
        if (this.exportGraphBtn) {
            this.exportGraphBtn.addEventListener('click', () => {
                this.exportGraph();
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
                parabolaAnalyzer.toggleQuadraticFit(true);
                
                // Show the fit button after successful plot
                if (this.fitBtn) {
                    this.fitBtn.classList.add('show');
                    this.fitBtn.textContent = 'Hide Quadratic Fit';
                }
                // Setup and show tangent line and controls by default
                if (this.tangentBtn) {
                    this.tangentBtn.style.display = 'inline-block';
                    this.tangentBtn.textContent = 'Hide Tangent Line';
                }
                if (tangentAnalyzer) {
                    tangentAnalyzer.setupControls(dataPoints);
                    const tangentControls = document.getElementById('tangentControls');
                    if (tangentControls) tangentControls.classList.add('visible');
                }
                this.syncAxesInputs();
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
            tangentAnalyzer = new TangentAnalyzer(parabolaAnalyzer);
            if (this.fitBtn) {
                this.fitBtn.textContent = 'Show Quadratic Fit';
                this.fitBtn.classList.remove('show');
            }
            if (this.tangentBtn) {
                this.tangentBtn.textContent = 'Show Tangent Line';
                this.tangentBtn.style.display = 'none';
            }
            const tangentControls = document.getElementById('tangentControls');
            if (tangentControls) {
                tangentControls.classList.remove('visible');
            }
            if (this.canvas) {
                parabolaAnalyzer.createEmptyChart(this.canvas);
            }
            this.syncAxesInputs();
            
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
