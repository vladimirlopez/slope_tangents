/**
 * Data table management for input data points
 */

class DataTable {
    constructor() {
        this.tableBody = DOMUtils.getElementById('dataTableBody');
        this.addRowBtn = DOMUtils.getElementById('addRowBtn');
        this.clearDataBtn = DOMUtils.getElementById('clearDataBtn');
        this.rowCount = 0;
        
        this.init();
    }

    /**
     * Initialize the data table with event listeners and initial rows
     */
    init() {
        // Add event listeners
        if (this.addRowBtn) {
            this.addRowBtn.addEventListener('click', () => this.addRow());
        }
        
        if (this.clearDataBtn) {
            this.clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        // Add initial rows
        this.addInitialRows();
    }

    /**
     * Add initial rows to the table
     */
    addInitialRows() {
        // Add 5 initial rows
        for (let i = 0; i < 5; i++) {
            this.addRow();
        }
    }

    /**
     * Add a new row to the data table
     * @param {number} x - Optional x value
     * @param {number} y - Optional y value
     */
    addRow(x = '', y = '') {
        this.rowCount++;
        
        const row = document.createElement('tr');
        row.setAttribute('data-row-id', this.rowCount);
        
        row.innerHTML = `
            <td>${this.rowCount}</td>
            <td>
                <input type="number" 
                       class="x-input" 
                       step="any" 
                       placeholder="Enter x value"
                       value="${x}">
            </td>
            <td>
                <input type="number" 
                       class="y-input" 
                       step="any" 
                       placeholder="Enter y value"
                       value="${y}">
            </td>
            <td>
                <button class="btn btn-danger remove-row-btn" 
                        onclick="dataTable.removeRow(${this.rowCount})">
                    Remove
                </button>
            </td>
        `;

        if (this.tableBody) {
            this.tableBody.appendChild(row);
        }

        // Add input event listeners for real-time validation
        const xInput = row.querySelector('.x-input');
        const yInput = row.querySelector('.y-input');
        
        if (xInput) {
            xInput.addEventListener('input', () => this.validateInput(xInput));
        }
        
        if (yInput) {
            yInput.addEventListener('input', () => this.validateInput(yInput));
        }
    }

    /**
     * Remove a row from the table
     * @param {number} rowId - ID of the row to remove
     */
    removeRow(rowId) {
        const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
        if (row && this.tableBody) {
            this.tableBody.removeChild(row);
            this.updateRowNumbers();
        }
    }

    /**
     * Update row numbers after deletion
     */
    updateRowNumbers() {
        const rows = this.tableBody ? this.tableBody.querySelectorAll('tr') : [];
        rows.forEach((row, index) => {
            const numberCell = row.querySelector('td:first-child');
            if (numberCell) {
                numberCell.textContent = index + 1;
            }
        });
    }

    /**
     * Validate input field
     * @param {HTMLInputElement} input - Input element to validate
     */
    validateInput(input) {
        const value = input.value.trim();
        
        if (value === '') {
            input.style.borderColor = '#ddd';
            return;
        }
        
        if (MathUtils.isValidNumber(value)) {
            input.style.borderColor = '#27ae60';
        } else {
            input.style.borderColor = '#e74c3c';
        }
    }

    /**
     * Get all valid data points from the table
     * @returns {Array} Array of {x, y} objects
     */
    getDataPoints() {
        const dataPoints = [];
        const rows = this.tableBody ? this.tableBody.querySelectorAll('tr') : [];
        
        rows.forEach((row, index) => {
            const xInput = row.querySelector('.x-input');
            const yInput = row.querySelector('.y-input');
            
            if (xInput && yInput) {
                const xValue = xInput.value.trim();
                const yValue = yInput.value.trim();
                
                // Only include rows where both x and y have valid values
                if (xValue !== '' && yValue !== '' && 
                    MathUtils.isValidNumber(xValue) && MathUtils.isValidNumber(yValue)) {
                    dataPoints.push({
                        x: parseFloat(xValue),
                        y: parseFloat(yValue),
                        index: index
                    });
                }
            }
        });
        
        return dataPoints;
    }

    /**
     * Clear all data from the table
     */
    clearAllData() {
        if (confirm('Are you sure you want to clear all data?')) {
            if (this.tableBody) {
                this.tableBody.innerHTML = '';
            }
            this.rowCount = 0;
            this.addInitialRows();
            DOMUtils.hideStatus();
            
            // Hide analysis sections
            DOMUtils.toggleElement('tangentControls', false);
            DOMUtils.toggleElement('equationDisplay', false);
            
            // Clear the chart if it exists
            if (window.chartInstance) {
                window.chartInstance.destroy();
                window.chartInstance = null;
            }
        }
    }

    /**
     * Load sample data for demonstration
     */
    loadSampleData() {
        this.clearAllData();
        
        // Sample quadratic data points
        const samplePoints = [
            { x: -2, y: 4 },
            { x: -1, y: 1 },
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 4 },
            { x: 3, y: 9 }
        ];
        
        // Clear existing rows and add sample data
        if (this.tableBody) {
            this.tableBody.innerHTML = '';
        }
        this.rowCount = 0;
        
        samplePoints.forEach(point => {
            this.addRow(point.x, point.y);
        });
        
        DOMUtils.showStatus('Sample data loaded successfully!', 'success');
    }

    /**
     * Export data points as JSON
     * @returns {string} JSON string of data points
     */
    exportData() {
        const dataPoints = this.getDataPoints();
        return JSON.stringify(dataPoints, null, 2);
    }

    /**
     * Import data points from JSON
     * @param {string} jsonData - JSON string of data points
     */
    importData(jsonData) {
        try {
            const dataPoints = JSON.parse(jsonData);
            
            if (!Array.isArray(dataPoints)) {
                throw new Error('Data must be an array');
            }
            
            this.clearAllData();
            
            dataPoints.forEach(point => {
                if (point.x !== undefined && point.y !== undefined) {
                    this.addRow(point.x, point.y);
                }
            });
            
            DOMUtils.showStatus('Data imported successfully!', 'success');
        } catch (error) {
            DOMUtils.showStatus('Error importing data: ' + error.message, 'error');
        }
    }
}

// Create global instance
let dataTable;
