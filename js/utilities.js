/**
 * Utility functions for mathematical operations and general helpers
 */

// Mathematical utilities
const MathUtils = {
    /**
     * Format a number to a specified number of decimal places
     * @param {number} num - The number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number as string
     */
    formatNumber(num, decimals = 3) {
        if (typeof num !== 'number' || isNaN(num)) {
            return '0';
        }
        return parseFloat(num.toFixed(decimals)).toString();
    },

    /**
     * Check if a value is a valid number
     * @param {any} value - Value to check
     * @returns {boolean} True if valid number
     */
    isValidNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Find the range (min, max) of an array of numbers
     * @param {number[]} values - Array of numbers
     * @returns {object} Object with min and max properties
     */
    findRange(values) {
        if (!values || values.length === 0) {
            return { min: 0, max: 1 };
        }
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    },

    /**
     * Generate an array of x values for plotting smooth curves
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @param {number} steps - Number of steps
     * @returns {number[]} Array of x values
     */
    generateXValues(xMin, xMax, steps = 100) {
        const result = [];
        const stepSize = (xMax - xMin) / (steps - 1);
        for (let i = 0; i < steps; i++) {
            result.push(xMin + i * stepSize);
        }
        return result;
    }
};

// DOM utilities
const DOMUtils = {
    /**
     * Get element by ID with error checking
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} Element or null if not found
     */
    getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Element with ID '${id}' not found`);
        }
        return element;
    },

    /**
     * Show status message
     * @param {string} message - Message to display
     * @param {string} type - Message type ('error', 'success', 'info')
     */
    showStatus(message, type = 'info') {
        const statusElement = this.getElementById('statusMessage');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status ${type}`;
            statusElement.style.display = 'block';
            
            // Auto-hide after 5 seconds for success/info messages
            if (type !== 'error') {
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 5000);
            }
        }
    },

    /**
     * Hide status message
     */
    hideStatus() {
        const statusElement = this.getElementById('statusMessage');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    },

    /**
     * Show or hide an element
     * @param {string} elementId - Element ID
     * @param {boolean} show - Whether to show the element
     */
    toggleElement(elementId, show) {
        const element = this.getElementById(elementId);
        if (element) {
            if (show) {
                element.classList.add('visible');
            } else {
                element.classList.remove('visible');
            }
        }
    }
};

// Validation utilities
const ValidationUtils = {
    /**
     * Validate data points for quadratic regression
     * @param {Array} dataPoints - Array of {x, y} objects
     * @returns {object} Validation result with isValid and message properties
     */
    validateDataPoints(dataPoints) {
        // Check if we have at least 3 points
        if (dataPoints.length < 3) {
            return {
                isValid: false,
                message: 'At least 3 data points are required for quadratic regression.'
            };
        }

        // Check if all points have valid numbers
        for (let i = 0; i < dataPoints.length; i++) {
            const point = dataPoints[i];
            if (!MathUtils.isValidNumber(point.x) || !MathUtils.isValidNumber(point.y)) {
                return {
                    isValid: false,
                    message: `Invalid number at point ${i + 1}. Please enter valid numeric values.`
                };
            }
        }

        // Check for duplicate x values
        const xValues = dataPoints.map(p => p.x);
        const uniqueXValues = [...new Set(xValues)];
        if (uniqueXValues.length !== xValues.length) {
            return {
                isValid: false,
                message: 'Duplicate x-values found. Each x-value must be unique.'
            };
        }

        // Check if all x values are the same (would result in vertical line)
        if (uniqueXValues.length === 1) {
            return {
                isValid: false,
                message: 'All x-values are the same. Please provide different x-values.'
            };
        }

        return {
            isValid: true,
            message: 'Data validation successful.'
        };
    }
};

// Animation utilities
const AnimationUtils = {
    /**
     * Smooth transition for number changes
     * @param {number} from - Starting value
     * @param {number} to - Ending value
     * @param {number} duration - Animation duration in milliseconds
     * @param {function} callback - Function to call with interpolated values
     */
    animateNumber(from, to, duration, callback) {
        const startTime = performance.now();
        const diff = to - from;

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = from + diff * easeOut;
            
            callback(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
};

// Export utilities for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathUtils, DOMUtils, ValidationUtils, AnimationUtils };
}
