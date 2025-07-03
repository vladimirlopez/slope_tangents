/**
 * Tangent line calculation and visualization
 */

class TangentAnalyzer {
    constructor(parabolaAnalyzer) {
        this.parabolaAnalyzer = parabolaAnalyzer;
        this.currentX = 0;
        this.slider = null;
        this.xValueDisplay = null;
        this.curvePointDisplay = null;
        this.slopeValueDisplay = null;
        this.tangentEquationDisplay = null;
        
        this.init();
    }

    /**
     * Initialize tangent analyzer with DOM elements and event listeners
     */
    init() {
        this.slider = DOMUtils.getElementById('xSlider');
        this.xValueDisplay = DOMUtils.getElementById('xValue');
        this.curvePointDisplay = DOMUtils.getElementById('curvePoint');
        this.slopeValueDisplay = DOMUtils.getElementById('slopeValue');
        this.tangentEquationDisplay = DOMUtils.getElementById('tangentEquation');

        if (this.slider) {
            this.slider.addEventListener('input', (e) => {
                this.currentX = parseFloat(e.target.value);
                this.updateTangentAnalysis();
            });
        }
    }

    /**
     * Setup the tangent controls for the given data range
     * @param {Array} dataPoints - Array of data points to determine range
     */
    setupControls(dataPoints) {
        if (!this.slider || !dataPoints || dataPoints.length === 0) return;

        // Calculate the range of x values
        const xValues = dataPoints.map(p => p.x);
        const xRange = MathUtils.findRange(xValues);
        const padding = (xRange.max - xRange.min) * 0.1;
        
        const xMin = xRange.min - padding;
        const xMax = xRange.max + padding;
        const xMid = (xMin + xMax) / 2;

        // Update slider properties
        this.slider.min = xMin.toString();
        this.slider.max = xMax.toString();
        this.slider.step = ((xMax - xMin) / 100).toString();
        this.slider.value = xMid.toString();
        
        this.currentX = xMid;
        
        // Show the tangent controls
        DOMUtils.toggleElement('tangentControls', true);
        
        // Initial update
        this.updateTangentAnalysis();
    }

    /**
     * Update tangent line analysis for current x value
     */
    updateTangentAnalysis() {
        if (!this.parabolaAnalyzer || !this.parabolaAnalyzer.coefficients) {
            return;
        }

        // Calculate point on curve
        const y = this.parabolaAnalyzer.evaluateQuadratic(this.currentX);
        const slope = this.parabolaAnalyzer.calculateDerivative(this.currentX);

        // Generate tangent line points
        const tangentPoints = this.generateTangentLine(this.currentX, y, slope);

        // Update displays
        this.updateDisplays(this.currentX, y, slope);

        // Update chart
        if (this.parabolaAnalyzer.chart) {
            this.parabolaAnalyzer.updateChartWithTangent(this.currentX, tangentPoints);
        }
    }

    /**
     * Generate points for the tangent line
     * @param {number} x0 - X coordinate of tangent point
     * @param {number} y0 - Y coordinate of tangent point
     * @param {number} slope - Slope of tangent line
     * @returns {Array} Array of {x, y} points for tangent line
     */
    generateTangentLine(x0, y0, slope) {
        // Calculate the range for the tangent line
        const xRange = parseFloat(this.slider.max) - parseFloat(this.slider.min);
        const lineLength = xRange * 0.4; // Tangent line extends 40% of the total range in each direction
        
        const xStart = x0 - lineLength / 2;
        const xEnd = x0 + lineLength / 2;
        
        // Calculate y values using point-slope form: y - y0 = m(x - x0)
        const yStart = y0 + slope * (xStart - x0);
        const yEnd = y0 + slope * (xEnd - x0);
        
        return [
            { x: xStart, y: yStart },
            { x: xEnd, y: yEnd }
        ];
    }

    /**
     * Update all display elements with current values
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} slope - Slope value
     */
    updateDisplays(x, y, slope) {
        // Update x value display
        if (this.xValueDisplay) {
            this.xValueDisplay.textContent = MathUtils.formatNumber(x, 3);
        }

        // Update curve point display
        if (this.curvePointDisplay) {
            const xFormatted = MathUtils.formatNumber(x, 3);
            const yFormatted = MathUtils.formatNumber(y, 3);
            this.curvePointDisplay.textContent = `(${xFormatted}, ${yFormatted})`;
        }

        // Update slope display
        if (this.slopeValueDisplay) {
            this.slopeValueDisplay.textContent = MathUtils.formatNumber(slope, 3);
        }

        // Update tangent equation display
        if (this.tangentEquationDisplay) {
            const equation = this.getTangentEquation(x, y, slope);
            this.tangentEquationDisplay.textContent = equation;
        }
    }

    /**
     * Get the equation of the tangent line in slope-intercept form
     * @param {number} x0 - X coordinate of tangent point
     * @param {number} y0 - Y coordinate of tangent point
     * @param {number} slope - Slope of tangent line
     * @returns {string} Formatted equation string
     */
    getTangentEquation(x0, y0, slope) {
        // Using point-slope form: y - y0 = m(x - x0)
        // Rearranging to slope-intercept form: y = mx + (y0 - mx0)
        const intercept = y0 - slope * x0;
        
        let equation = 'y = ';
        
        // Format slope
        if (Math.abs(slope) === 1) {
            equation += slope < 0 ? '-x' : 'x';
        } else if (slope === 0) {
            equation += '0';
        } else {
            equation += MathUtils.formatNumber(slope, 3) + 'x';
        }
        
        // Format intercept
        if (intercept !== 0) {
            if (intercept > 0 && slope !== 0) {
                equation += ' + ';
            } else if (intercept < 0) {
                equation += ' - ';
            }
            equation += MathUtils.formatNumber(Math.abs(intercept), 3);
        }
        
        return equation;
    }

    /**
     * Get detailed information about the tangent at current point
     * @returns {object} Object with tangent information
     */
    getTangentInfo() {
        const y = this.parabolaAnalyzer.evaluateQuadratic(this.currentX);
        const slope = this.parabolaAnalyzer.calculateDerivative(this.currentX);
        
        return {
            point: { x: this.currentX, y: y },
            slope: slope,
            equation: this.getTangentEquation(this.currentX, y, slope),
            angle: Math.atan(slope) * (180 / Math.PI) // Angle in degrees
        };
    }

    /**
     * Animate to a specific x value
     * @param {number} targetX - Target x value
     * @param {number} duration - Animation duration in milliseconds
     */
    animateToX(targetX, duration = 1000) {
        if (!this.slider) return;
        
        const startX = this.currentX;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentX = startX + (targetX - startX) * easeInOut;
            
            this.slider.value = currentX.toString();
            this.currentX = currentX;
            this.updateTangentAnalysis();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Find critical points (where derivative = 0)
     * @returns {Array} Array of x values where derivative is zero
     */
    findCriticalPoints() {
        const { a, b } = this.parabolaAnalyzer.coefficients;
        
        // For quadratic y = ax² + bx + c, derivative is y' = 2ax + b
        // Critical point where y' = 0: 2ax + b = 0 → x = -b/(2a)
        
        if (a === 0) {
            // Linear function, no critical points
            return [];
        }
        
        const criticalX = -b / (2 * a);
        return [criticalX];
    }

    /**
     * Jump to vertex (critical point) of the parabola
     */
    jumpToVertex() {
        const criticalPoints = this.findCriticalPoints();
        if (criticalPoints.length > 0) {
            this.animateToX(criticalPoints[0]);
        }
    }

    /**
     * Reset to center of data range
     */
    resetToCenter() {
        if (this.slider) {
            const xMin = parseFloat(this.slider.min);
            const xMax = parseFloat(this.slider.max);
            const center = (xMin + xMax) / 2;
            this.animateToX(center);
        }
    }
}

// Global instance will be created when parabola analysis is complete
let tangentAnalyzer;
