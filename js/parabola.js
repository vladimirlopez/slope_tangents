/**
 * Quadratic regression and parabola visualization
 */

class ParabolaAnalyzer {
    constructor() {
        this.coefficients = { a: 0, b: 0, c: 0 };
        this.rSquared = 0;
        this.dataPoints = [];
        this.chart = null;
    }

    /**
     * Perform quadratic regression using least squares method
     * @param {Array} dataPoints - Array of {x, y} objects
     * @returns {object} Regression results with coefficients and R²
     */
    performQuadraticRegression(dataPoints) {
        if (dataPoints.length < 3) {
            throw new Error('At least 3 data points are required for quadratic regression');
        }

        this.dataPoints = dataPoints;
        const n = dataPoints.length;

        // Create matrices for normal equations
        // We need to solve: Xa = y where X is the design matrix
        // X = [1, x, x²] for each data point
        
        let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        let sumY = 0, sumXY = 0, sumX2Y = 0;

        // Calculate sums for normal equations
        dataPoints.forEach(point => {
            const x = point.x;
            const y = point.y;
            const x2 = x * x;
            const x3 = x2 * x;
            const x4 = x2 * x2;

            sumX += x;
            sumX2 += x2;
            sumX3 += x3;
            sumX4 += x4;
            sumY += y;
            sumXY += x * y;
            sumX2Y += x2 * y;
        });

        // Set up the system of equations in matrix form
        // [n    sumX   sumX2 ] [c]   [sumY  ]
        // [sumX sumX2  sumX3 ] [b] = [sumXY ]
        // [sumX2 sumX3 sumX4] [a]   [sumX2Y]

        const matrix = [
            [n, sumX, sumX2],
            [sumX, sumX2, sumX3],
            [sumX2, sumX3, sumX4]
        ];

        const vector = [sumY, sumXY, sumX2Y];

        // Solve using Gaussian elimination
        const solution = this.solveLinearSystem(matrix, vector);
        
        this.coefficients = {
            c: solution[0],
            b: solution[1],
            a: solution[2]
        };

        // Calculate R-squared
        this.rSquared = this.calculateRSquared(dataPoints);

        return {
            coefficients: this.coefficients,
            rSquared: this.rSquared
        };
    }

    /**
     * Solve a 3x3 linear system using Gaussian elimination
     * @param {Array} matrix - 3x3 coefficient matrix
     * @param {Array} vector - Right-hand side vector
     * @returns {Array} Solution vector
     */
    solveLinearSystem(matrix, vector) {
        const n = matrix.length;
        const augmented = matrix.map((row, i) => [...row, vector[i]]);

        // Forward elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = k;
                }
            }

            // Swap rows
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            // Make all rows below this one 0 in current column
            for (let k = i + 1; k < n; k++) {
                const factor = augmented[k][i] / augmented[i][i];
                for (let j = i; j < n + 1; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }

        // Back substitution
        const solution = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            solution[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                solution[i] -= augmented[i][j] * solution[j];
            }
            solution[i] /= augmented[i][i];
        }

        return solution;
    }

    /**
     * Calculate R-squared value for the regression
     * @param {Array} dataPoints - Array of {x, y} objects
     * @returns {number} R-squared value
     */
    calculateRSquared(dataPoints) {
        const yMean = dataPoints.reduce((sum, point) => sum + point.y, 0) / dataPoints.length;
        
        let totalSumSquares = 0;
        let residualSumSquares = 0;

        dataPoints.forEach(point => {
            const predicted = this.evaluateQuadratic(point.x);
            totalSumSquares += Math.pow(point.y - yMean, 2);
            residualSumSquares += Math.pow(point.y - predicted, 2);
        });

        return 1 - (residualSumSquares / totalSumSquares);
    }

    /**
     * Evaluate the quadratic function at a given x value
     * @param {number} x - Input value
     * @returns {number} y value at x
     */
    evaluateQuadratic(x) {
        const { a, b, c } = this.coefficients;
        return a * x * x + b * x + c;
    }

    /**
     * Calculate the derivative (slope) of the quadratic at a given x value
     * @param {number} x - Input value
     * @returns {number} Slope at x
     */
    calculateDerivative(x) {
        const { a, b } = this.coefficients;
        return 2 * a * x + b;
    }

    /**
     * Generate points for plotting the quadratic curve
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @param {number} steps - Number of points to generate
     * @returns {Array} Array of {x, y} objects
     */
    generateCurvePoints(xMin, xMax, steps = 100) {
        const points = [];
        const stepSize = (xMax - xMin) / (steps - 1);

        for (let i = 0; i < steps; i++) {
            const x = xMin + i * stepSize;
            const y = this.evaluateQuadratic(x);
            points.push({ x, y });
        }

        return points;
    }

    /**
     * Get the equation as a formatted string
     * @returns {string} Formatted equation string
     */
    getEquationString() {
        const { a, b, c } = this.coefficients;
        
        let equation = 'y = ';
        
        // Format coefficient a
        if (Math.abs(a) !== 1) {
            equation += MathUtils.formatNumber(a, 3);
        } else {
            equation += a < 0 ? '-' : '';
        }
        equation += 'x²';
        
        // Format coefficient b
        if (b !== 0) {
            if (b > 0) equation += ' + ';
            else equation += ' - ';
            
            const absB = Math.abs(b);
            if (absB !== 1) {
                equation += MathUtils.formatNumber(absB, 3);
            }
            equation += 'x';
        }
        
        // Format coefficient c
        if (c !== 0) {
            if (c > 0) equation += ' + ';
            else equation += ' - ';
            equation += MathUtils.formatNumber(Math.abs(c), 3);
        }
        
        return equation;
    }

    /**
     * Create or update the chart visualization
     * @param {HTMLCanvasElement} canvas - Canvas element for the chart
     */
    createChart(canvas) {
        if (!canvas) {
            console.error('Canvas element not provided');
            return;
        }

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Calculate plot range
        const xValues = this.dataPoints.map(p => p.x);
        const xRange = MathUtils.findRange(xValues);
        const padding = (xRange.max - xRange.min) * 0.2;
        const xMin = xRange.min - padding;
        const xMax = xRange.max + padding;

        // Generate curve points
        const curvePoints = this.generateCurvePoints(xMin, xMax);

        // Create chart datasets (only data points initially)
        const datasets = [
            {
                label: 'Data Points',
                data: this.dataPoints,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                pointRadius: 4,
                pointHoverRadius: 6,
                showLine: false
            }
        ];

        // Chart configuration
        const config = {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'point'
                },
                onClick: (event, elements) => {
                    // Get click position relative to chart
                    const canvasPosition = Chart.helpers.getRelativePosition(event, this.chart);
                    const dataX = this.chart.scales.x.getValueForPixel(canvasPosition.x);
                    const dataY = this.chart.scales.y.getValueForPixel(canvasPosition.y);
                    
                    // Update the point analysis
                    this.updatePointAnalysis(dataX);
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Quadratic Regression Analysis',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const x = MathUtils.formatNumber(context.parsed.x, 3);
                                const y = MathUtils.formatNumber(context.parsed.y, 3);
                                return `(${x}, ${y})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'X Values',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Y Values',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };

        // Create the chart
        this.chart = new Chart(canvas, config);
        
        // Store reference globally for other modules
        window.chartInstance = this.chart;
    }

    /**
     * Update chart with tangent line and vertical line
     * @param {number} x - X coordinate for tangent point
     */
    updatePointAnalysis(x) {
        if (!this.chart) return;

        const y = this.evaluateQuadratic(x);
        const slope = this.calculateDerivative(x);

        // Remove existing analysis datasets
        this.chart.data.datasets = this.chart.data.datasets.filter(
            dataset => !dataset.label.includes('Tangent') && 
                      !dataset.label.includes('Vertical') && 
                      !dataset.label.includes('Selected')
        );

        // Add vertical line at selected x
        const yRange = this.getYRange();
        this.chart.data.datasets.push({
            label: 'Vertical Line',
            data: [
                { x: x, y: yRange.min },
                { x: x, y: yRange.max }
            ],
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderColor: 'rgba(128, 128, 128, 0.7)',
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
            showLine: true,
            borderDash: [3, 3],
            order: 3
        });

        // Add tangent line
        const tangentPoints = this.generateTangentLine(x, y, slope);
        this.chart.data.datasets.push({
            label: 'Tangent Line',
            data: tangentPoints,
            backgroundColor: 'rgba(255, 165, 0, 0)',
            borderColor: 'rgba(255, 140, 0, 1)',
            borderWidth: 3,
            pointRadius: 0,
            fill: false,
            showLine: true,
            order: 2
        });

        // Add selected point highlight
        this.chart.data.datasets.push({
            label: 'Selected Point',
            data: [{ x, y }],
            backgroundColor: 'rgba(46, 204, 113, 1)',
            borderColor: 'rgba(39, 174, 96, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false,
            order: 1
        });

        this.chart.update('none');

        // Update the point information display
        this.updatePointInfoDisplay(x, y, slope);
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
        const xValues = this.dataPoints.map(p => p.x);
        const xRange = MathUtils.findRange(xValues);
        const totalRange = xRange.max - xRange.min;
        const lineLength = totalRange * 0.6; // Tangent line extends 60% of the total range in each direction
        
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
     * Get the Y range for the chart
     * @returns {object} Object with min and max y values
     */
    getYRange() {
        if (!this.chart || !this.chart.scales.y) {
            return { min: -10, max: 10 };
        }
        return {
            min: this.chart.scales.y.min,
            max: this.chart.scales.y.max
        };
    }

    /**
     * Update the point information display
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @param {number} slope - Slope value
     */
    updatePointInfoDisplay(x, y, slope) {
        // Show the graph info box
        const graphInfoBox = document.getElementById('graphInfoBox');
        if (graphInfoBox) {
            graphInfoBox.classList.add('show');
        }

        // Update info box values
        const infoX = document.getElementById('infoX');
        const infoSlope = document.getElementById('infoSlope');
        
        if (infoX) {
            infoX.textContent = MathUtils.formatNumber(x, 3);
        }
        
        if (infoSlope) {
            infoSlope.textContent = MathUtils.formatNumber(slope, 3);
        }

        // Show the point info section (keep for detailed analysis)
        const pointInfo = document.getElementById('pointInfo');
        if (pointInfo) {
            pointInfo.classList.add('show');
        }

        // Update selected point display
        const selectedPointElement = document.getElementById('selectedPoint');
        if (selectedPointElement) {
            const xFormatted = MathUtils.formatNumber(x, 3);
            const yFormatted = MathUtils.formatNumber(y, 3);
            selectedPointElement.textContent = `(${xFormatted}, ${yFormatted})`;
        }

        // Update slope display
        const pointSlopeElement = document.getElementById('pointSlope');
        if (pointSlopeElement) {
            pointSlopeElement.textContent = MathUtils.formatNumber(slope, 3);
        }

        // Update tangent equation display
        const tangentEquationElement = document.getElementById('tangentEquation');
        if (tangentEquationElement) {
            const equation = this.getTangentEquation(x, y, slope);
            tangentEquationElement.textContent = equation;
        }
    }

    /**
     * Get the equation of the tangent line in slope-intercept form
     * @param {number} x0 - X coordinate of tangent point
     * @param {number} y0 - Y coordinate of tangent point
     * @param {number} slope - Slope of tangent line
     * @returns {string} Tangent line equation
     */
    getTangentEquation(x0, y0, slope) {
        // Calculate y-intercept: b = y0 - m * x0
        const yIntercept = y0 - slope * x0;
        
        let equation = 'y = ';
        
        // Format slope
        if (Math.abs(slope) === 1) {
            equation += slope === 1 ? 'x' : '-x';
        } else {
            equation += MathUtils.formatNumber(slope, 3) + 'x';
        }
        
        // Format y-intercept
        if (yIntercept !== 0) {
            if (yIntercept > 0) {
                equation += ' + ' + MathUtils.formatNumber(yIntercept, 3);
            } else {
                equation += ' - ' + MathUtils.formatNumber(Math.abs(yIntercept), 3);
            }
        }
        
        return equation;
    }

    /**
     * Update chart with tangent line (legacy method for compatibility)
     * @param {number} x - X coordinate for tangent point
     * @param {Array} tangentPoints - Array of tangent line points
     */
    updateChartWithTangent(x, tangentPoints) {
        // Use the new method instead
        this.updatePointAnalysis(x);
    }

    /**
     * Add or remove quadratic fit line from chart
     * @param {boolean} show - Whether to show the quadratic fit
     */
    toggleQuadraticFit(show = true) {
        if (!this.chart) return;

        // Remove existing quadratic fit
        this.chart.data.datasets = this.chart.data.datasets.filter(
            dataset => dataset.label !== 'Quadratic Fit'
        );

        if (show) {
            // Calculate plot range
            const xValues = this.dataPoints.map(p => p.x);
            const xRange = MathUtils.findRange(xValues);
            const padding = (xRange.max - xRange.min) * 0.2;
            const xMin = xRange.min - padding;
            const xMax = xRange.max + padding;

            // Generate curve points
            const curvePoints = this.generateCurvePoints(xMin, xMax);

            // Add quadratic fit dataset
            this.chart.data.datasets.push({
                label: 'Quadratic Fit',
                data: curvePoints,
                backgroundColor: 'rgba(231, 76, 60, 0)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                tension: 0,
                showLine: true,
                order: 1
            });
        }

        this.chart.update('none');
    }
}

// Create global instance
let parabolaAnalyzer;
