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

        // Create chart datasets
        const datasets = [
            {
                label: 'Data Points',
                data: this.dataPoints,
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                pointRadius: 8,
                pointHoverRadius: 10,
                showLine: false
            },
            {
                label: 'Quadratic Fit',
                data: curvePoints,
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 3,
                pointRadius: 0,
                fill: false,
                tension: 0
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
                plugins: {
                    title: {
                        display: true,
                        text: 'Quadratic Regression Analysis',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const x = MathUtils.formatNumber(context.parsed.x, 3);
                                const y = MathUtils.formatNumber(context.parsed.y, 3);
                                return `${context.dataset.label}: (${x}, ${y})`;
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
     * Update chart with tangent line
     * @param {number} x - X coordinate for tangent point
     * @param {Array} tangentPoints - Array of tangent line points
     */
    updateChartWithTangent(x, tangentPoints) {
        if (!this.chart) return;

        const y = this.evaluateQuadratic(x);

        // Remove existing tangent and highlight datasets
        this.chart.data.datasets = this.chart.data.datasets.filter(
            dataset => !dataset.label.includes('Tangent') && !dataset.label.includes('Highlight')
        );

        // Add highlight point
        this.chart.data.datasets.push({
            label: 'Selected Point',
            data: [{ x, y }],
            backgroundColor: 'rgba(46, 204, 113, 1)',
            borderColor: 'rgba(46, 204, 113, 1)',
            pointRadius: 12,
            pointHoverRadius: 14,
            showLine: false,
            order: 1
        });

        // Add tangent line
        this.chart.data.datasets.push({
            label: 'Tangent Line',
            data: tangentPoints,
            backgroundColor: 'rgba(155, 89, 182, 0.1)',
            borderColor: 'rgba(155, 89, 182, 1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            borderDash: [5, 5],
            order: 2
        });

        this.chart.update('none');
    }
}

// Create global instance
let parabolaAnalyzer;
