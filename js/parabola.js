/**
 * Quadratic regression and parabola visualization
 */

class ParabolaAnalyzer {

    getAxisLabels() {
        const xEl = document.getElementById('xLabelInput');
        const yEl = document.getElementById('yLabelInput');

        const xVal = (xEl && xEl.value.trim()) || 'X Value';
        const yVal = (yEl && yEl.value.trim()) || 'Y Value';

        return {
            x: xVal,
            y: yVal
        };
    }

    constructor() {
        this.coefficients = null;
        this.rSquared = 0;
        this.dataPoints = [];
        this.chart = null;
        this.tangentData = null; // { x, y, slope, equation, visible }
        this.showQuadraticFit = true;
        this.cardPosition = null; // { x, y } when dragged
        this.lastBoxBounds = null; // { x, y, width, height }
        this.isDraggingCard = false;
        this.dragOffset = { x: 0, y: 0 };
        this.axesConfig = {
            includeZero: false,
            axisPosition: 'border', // 'border' or 'center'
            customXMin: null,
            customXMax: null,
            customYMin: null,
            customYMax: null
        };
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
        if (!this.coefficients) return 0;
        const { a, b, c } = this.coefficients;
        return a * x * x + b * x + c;
    }

    /**
     * Calculate the derivative (slope) of the quadratic at a given x value
     * @param {number} x - Input value
     * @returns {number} Slope at x
     */
    calculateDerivative(x) {
        if (!this.coefficients) return 0;
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
        if (!this.coefficients) return 'y = 0';
        const { a, b, c } = this.coefficients;
        
        let equation = 'y = ';
        
        // Format coefficient A
        if (Math.abs(a) !== 1) {
            equation += MathUtils.formatNumber(a, 3);
        } else {
            equation += a < 0 ? '-' : '';
        }
        equation += 't²';
        
        // Format coefficient B
        if (b !== 0) {
            if (b > 0) equation += ' + ';
            else equation += ' - ';
            
            const absB = Math.abs(b);
            if (absB !== 1) {
                equation += MathUtils.formatNumber(absB, 3);
            }
            equation += 't';
        }
        
        // Format coefficient C
        if (c !== 0) {
            if (c > 0) equation += ' + ';
            else equation += ' - ';
            equation += MathUtils.formatNumber(Math.abs(c), 3);
        }
        
        return equation;
    }

    /**
     * Check if a canvas pixel coordinate is inside the overlay card
     * @param {number} x - Pixel X coordinate
     * @param {number} y - Pixel Y coordinate
     * @returns {boolean}
     */
    isPointInsideCard(x, y) {
        if (!this.lastBoxBounds || !this.coefficients || !this.showQuadraticFit) return false;
        const b = this.lastBoxBounds;
        return x >= b.x && x <= (b.x + b.width) && y >= b.y && y <= (b.y + b.height);
    }

    /**
     * Setup drag-and-drop interaction for the on-canvas overlay card
     * @param {HTMLCanvasElement} canvas
     */
    setupCanvasInteraction(canvas) {
        if (!canvas || canvas._cardInteractionAttached) return;
        canvas._cardInteractionAttached = true;

        let isMouseDownOnCard = false;
        let startMousePos = { x: 0, y: 0 };

        canvas.addEventListener('mousedown', (e) => {
            if (!this.lastBoxBounds || !this.coefficients || !this.showQuadraticFit) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPointInsideCard(mouseX, mouseY)) {
                isMouseDownOnCard = true;
                startMousePos = { x: mouseX, y: mouseY };
                this.dragOffset = {
                    x: mouseX - this.lastBoxBounds.x,
                    y: mouseY - this.lastBoxBounds.y
                };
                canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.lastBoxBounds || !this.coefficients || !this.showQuadraticFit) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (isMouseDownOnCard) {
                this.cardPosition = {
                    x: mouseX - this.dragOffset.x,
                    y: mouseY - this.dragOffset.y
                };
                if (this.chart) this.chart.update('none');
                return;
            }

            if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
                if (this.isPointInsideCard(mouseX, mouseY)) {
                    canvas.style.cursor = 'grab';
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDownOnCard) {
                isMouseDownOnCard = false;
                if (canvas) canvas.style.cursor = 'default';
            }
        });
    }

    /**
     * Render the on-canvas information card with Quadratic Fit and Tangent Slope values
     * @param {Chart} chart
     */
    drawOverlayCard(chart) {
        if (!this.coefficients || !this.showQuadraticFit) return;

        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        if (!chartArea) return;

        const { a, b, c } = this.coefficients;
        const r2 = this.rSquared;
        const hasTangent = !!(this.tangentData && this.tangentData.visible);

        const fontFamily = "'Inter', 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const titleFont = `700 11px ${fontFamily}`;
        const eqFont = `700 13px ${fontFamily}`;
        const subFont = `500 11px ${fontFamily}`;
        const slopeFont = `700 13px ${fontFamily}`;

        const eqStr = this.getEquationString();
        const coeffStr = `A = ${MathUtils.formatNumber(a, 3)}   B = ${MathUtils.formatNumber(b, 3)}   C = ${MathUtils.formatNumber(c, 3)}`;
        const r2Str = `R² = ${MathUtils.formatNumber(r2, 4)}`;

        let tangentXStr = '';
        let tangentPtStr = '';
        let tangentEqStr = '';
        let slopeStr = '';

        if (hasTangent) {
            const tx = this.tangentData.x;
            const ty = this.tangentData.y;
            const tslope = this.tangentData.slope;
            tangentXStr = `at t = ${MathUtils.formatNumber(tx, 3)}`;
            tangentPtStr = `Point: (${MathUtils.formatNumber(tx, 3)}, ${MathUtils.formatNumber(ty, 3)})`;
            tangentEqStr = this.tangentData.equation || this.getTangentEquation(tx, ty, tslope);
            slopeStr = `Slope (m) = ${MathUtils.formatNumber(tslope, 3)}`;
        }

        // Measure text widths to determine card width
        ctx.save();
        ctx.font = eqFont;
        const eqWidth = ctx.measureText(eqStr).width;
        ctx.font = subFont;
        const coeffWidth = ctx.measureText(coeffStr).width;
        let maxTextWidth = Math.max(eqWidth, coeffWidth, 230);

        if (hasTangent) {
            ctx.font = slopeFont;
            const slopeWidth = ctx.measureText(slopeStr).width + 60;
            ctx.font = subFont;
            const ptWidth = ctx.measureText(`${tangentPtStr}   |   ${tangentEqStr}`).width;
            maxTextWidth = Math.max(maxTextWidth, slopeWidth, ptWidth);
        }

        const paddingX = 14;
        const paddingY = 12;
        const boxWidth = Math.min(Math.max(280, maxTextWidth + paddingX * 2), chartArea.width - 24);
        const boxHeight = hasTangent ? 172 : 84;

        // Position: use user dragged position or default to top-right
        let boxX, boxY;
        if (this.cardPosition) {
            boxX = Math.max(chartArea.left + 6, Math.min(this.cardPosition.x, chartArea.right - boxWidth - 6));
            boxY = Math.max(chartArea.top + 6, Math.min(this.cardPosition.y, chartArea.bottom - boxHeight - 6));
        } else {
            boxX = chartArea.right - boxWidth - 14;
            boxY = chartArea.top + 14;
        }

        this.lastBoxBounds = { x: boxX, y: boxY, width: boxWidth, height: boxHeight };

        // Helper for rounded rect
        const drawRoundRectPath = (x, y, w, h, r) => {
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, w, h, r);
            } else {
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + w - r, y);
                ctx.quadraticCurveTo(x + w, y, x + w, y + r);
                ctx.lineTo(x + w, y + h - r);
                ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
                ctx.lineTo(x + r, y + h);
                ctx.quadraticCurveTo(x, y + h, x, y + h - r);
                ctx.lineTo(x, y + r);
                ctx.quadraticCurveTo(x, y, x + r, y);
                ctx.closePath();
            }
        };

        // Draw shadow & background
        ctx.save();
        ctx.shadowColor = 'rgba(12, 54, 68, 0.12)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        drawRoundRectPath(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.restore();

        // Draw subtle border
        ctx.save();
        ctx.strokeStyle = '#c8dbe3';
        ctx.lineWidth = 1;
        drawRoundRectPath(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.stroke();

        // SECTION 1: Quadratic Fit
        let curY = boxY + paddingY;

        // Teal indicator dot
        ctx.fillStyle = '#0f7e9b';
        ctx.beginPath();
        ctx.arc(boxX + paddingX + 4, curY + 6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Header: "QUADRATIC FIT"
        ctx.font = titleFont;
        ctx.fillStyle = '#0f7e9b';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('QUADRATIC FIT', boxX + paddingX + 14, curY + 6);

        // R² value on the right
        ctx.font = subFont;
        ctx.fillStyle = '#123140';
        ctx.textAlign = 'right';
        ctx.fillText(r2Str, boxX + boxWidth - paddingX, curY + 6);

        // Equation
        curY += 21;
        ctx.font = eqFont;
        ctx.fillStyle = '#123140';
        ctx.textAlign = 'left';
        ctx.fillText(eqStr, boxX + paddingX, curY + 6);

        // Coefficients
        curY += 19;
        ctx.font = subFont;
        ctx.fillStyle = '#4b6570';
        ctx.fillText(coeffStr, boxX + paddingX, curY + 6);

        // SECTION 2: Tangent Line & Slope
        if (hasTangent) {
            // Divider line
            curY += 19;
            ctx.strokeStyle = '#e2edf1';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(boxX + paddingX, curY);
            ctx.lineTo(boxX + boxWidth - paddingX, curY);
            ctx.stroke();

            // Tangent Header
            curY += 10;
            // Amber indicator dot
            ctx.fillStyle = '#d67b19';
            ctx.beginPath();
            ctx.arc(boxX + paddingX + 4, curY + 6, 4, 0, Math.PI * 2);
            ctx.fill();

            // Header: "TANGENT LINE"
            ctx.font = titleFont;
            ctx.fillStyle = '#d67b19';
            ctx.textAlign = 'left';
            ctx.fillText('TANGENT LINE', boxX + paddingX + 14, curY + 6);

            // at t = ... on right
            ctx.font = subFont;
            ctx.fillStyle = '#4b6570';
            ctx.textAlign = 'right';
            ctx.fillText(tangentXStr, boxX + boxWidth - paddingX, curY + 6);

            // Point and Tangent Equation
            curY += 19;
            ctx.font = subFont;
            ctx.fillStyle = '#4b6570';
            ctx.textAlign = 'left';
            ctx.fillText(`${tangentPtStr}   |   ${tangentEqStr}`, boxX + paddingX, curY + 6);

            // Slope badge / prominent display
            curY += 21;
            const badgeW = boxWidth - paddingX * 2;
            const badgeH = 26;
            ctx.fillStyle = 'rgba(214, 123, 25, 0.08)';
            drawRoundRectPath(boxX + paddingX, curY, badgeW, badgeH, 5);
            ctx.fill();
            ctx.strokeStyle = 'rgba(214, 123, 25, 0.35)';
            ctx.stroke();

            // Slope text inside badge
            ctx.font = slopeFont;
            ctx.fillStyle = '#d67b19';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(slopeStr, boxX + boxWidth / 2, curY + badgeH / 2);
        }

        ctx.restore();
    }

    /**
     * Draw high-contrast lines for X = 0 and Y = 0 whenever they are in the visible range
     * @param {Chart} chart
     */
    drawZeroLines(chart) {
        const { ctx, chartArea, scales } = chart;
        if (!chartArea || !scales || !scales.x || !scales.y) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(18, 49, 64, 0.45)';
        ctx.lineWidth = 1.5;

        // Vertical line at x = 0
        if (scales.x.min <= 0 && scales.x.max >= 0) {
            const xPixel = scales.x.getPixelForValue(0);
            if (xPixel >= chartArea.left - 1 && xPixel <= chartArea.right + 1) {
                ctx.beginPath();
                ctx.moveTo(xPixel, chartArea.top);
                ctx.lineTo(xPixel, chartArea.bottom);
                ctx.stroke();
            }
        }

        // Horizontal line at y = 0
        if (scales.y.min <= 0 && scales.y.max >= 0) {
            const yPixel = scales.y.getPixelForValue(0);
            if (yPixel >= chartArea.top - 1 && yPixel <= chartArea.bottom + 1) {
                ctx.beginPath();
                ctx.moveTo(chartArea.left, yPixel);
                ctx.lineTo(chartArea.right, yPixel);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    /**
     * Get visible axes range
     * @returns {object} { xMin, xMax, yMin, yMax }
     */
    getVisibleRange() {
        if (!this.chart || !this.chart.scales || !this.chart.scales.x || !this.chart.scales.y) {
            return { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
        }
        return {
            xMin: this.chart.scales.x.min,
            xMax: this.chart.scales.x.max,
            yMin: this.chart.scales.y.min,
            yMax: this.chart.scales.y.max
        };
    }

    /**
     * Update axes configuration (scaling, position, zero inclusion) and redraw
     * @param {object} newConfig
     */
    setAxesConfig(newConfig) {
        this.axesConfig = { ...this.axesConfig, ...newConfig };
        if (this.chart) {
            const canvas = this.chart.canvas;
            if (this.dataPoints && this.dataPoints.length > 0) {
                this.createChart(canvas);
                if (this.showQuadraticFit) {
                    this.toggleQuadraticFit(true);
                }
                if (typeof tangentAnalyzer !== 'undefined' && tangentAnalyzer) {
                    tangentAnalyzer.setupControls(this.dataPoints);
                }
                if (this.tangentData && this.tangentData.visible) {
                    this.updatePointAnalysis(this.tangentData.x);
                }
            } else {
                this.createEmptyChart(canvas);
            }
        }
    }

    /**
     * Reset axes back to automatic data bounds
     */
    resetAxes() {
        this.axesConfig = {
            includeZero: false,
            axisPosition: 'border',
            customXMin: null,
            customXMax: null,
            customYMin: null,
            customYMax: null
        };
        if (this.chart) {
            const canvas = this.chart.canvas;
            if (this.dataPoints && this.dataPoints.length > 0) {
                this.createChart(canvas);
                if (this.showQuadraticFit) {
                    this.toggleQuadraticFit(true);
                }
                if (typeof tangentAnalyzer !== 'undefined' && tangentAnalyzer) {
                    tangentAnalyzer.setupControls(this.dataPoints);
                }
                if (this.tangentData && this.tangentData.visible) {
                    this.updatePointAnalysis(this.tangentData.x);
                }
            } else {
                this.createEmptyChart(canvas);
            }
        }
    }

    /**
     * Create or update the chart visualization with empty data
     * @param {HTMLCanvasElement} canvas - Canvas element for the chart
     */
    createEmptyChart(canvas) {
        if (!canvas) return;
        if (this.chart) this.chart.destroy();
        this.coefficients = null;
        this.tangentData = null;
        this.cardPosition = null;
        this.lastBoxBounds = null;

        let xMin = this.axesConfig.customXMin !== null ? this.axesConfig.customXMin : (this.axesConfig.includeZero ? 0 : -10);
        let xMax = this.axesConfig.customXMax !== null ? this.axesConfig.customXMax : 10;
        let yMin = this.axesConfig.customYMin !== null ? this.axesConfig.customYMin : (this.axesConfig.includeZero ? 0 : -10);
        let yMax = this.axesConfig.customYMax !== null ? this.axesConfig.customYMax : 10;

        if (xMin >= xMax) xMax = xMin + 1;
        if (yMin >= yMax) yMax = yMin + 1;
        
        const config = {
            type: 'scatter',
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: false, text: 'Quadratic Regression Analysis', font: { size: 14, weight: 'bold' } },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: this.axesConfig.axisPosition === 'center' ? 'center' : 'bottom',
                        min: xMin,
                        max: xMax,
                        title: {
                            display: true,
                            text: this.getAxisLabels().x,
                            font: { size: 14, weight: '600', family: "'IBM Plex Sans', 'Inter', sans-serif" },
                            color: '#123140'
                        },
                        grid: {
                            display: true,
                            color: (context) => (context.tick && context.tick.value === 0 ? '#123140' : 'rgba(0, 0, 0, 0.1)'),
                            lineWidth: (context) => (context.tick && context.tick.value === 0 ? 2 : 1)
                        }
                    },
                    y: {
                        position: this.axesConfig.axisPosition === 'center' ? 'center' : 'left',
                        min: yMin,
                        max: yMax,
                        title: {
                            display: true,
                            text: this.getAxisLabels().y,
                            font: { size: 14, weight: '600', family: "'IBM Plex Sans', 'Inter', sans-serif" },
                            color: '#123140'
                        },
                        grid: {
                            display: true,
                            color: (context) => (context.tick && context.tick.value === 0 ? '#123140' : 'rgba(0, 0, 0, 0.1)'),
                            lineWidth: (context) => (context.tick && context.tick.value === 0 ? 2 : 1)
                        }
                    }
                }
            },
            plugins: [
                {
                    id: 'zeroLines',
                    beforeDraw: (chart) => {
                        this.drawZeroLines(chart);
                    }
                }
            ]
        };
        this.chart = new Chart(canvas, config);
        window.chartInstance = this.chart;
    }


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
        const padding = (xRange.max - xRange.min) * 0.2 || 2;
        let xMin = xRange.min - padding;
        let xMax = xRange.max + padding;

        if (this.axesConfig.includeZero) {
            xMin = Math.min(0, xMin);
            xMax = Math.max(0, xMax);
        }
        if (this.axesConfig.customXMin !== null) xMin = this.axesConfig.customXMin;
        if (this.axesConfig.customXMax !== null) xMax = this.axesConfig.customXMax;
        if (xMin >= xMax) xMax = xMin + 1;

        // Calculate y bounds from data and curve
        let yMin = Infinity;
        let yMax = -Infinity;
        this.dataPoints.forEach(p => {
            if (p.y < yMin) yMin = p.y;
            if (p.y > yMax) yMax = p.y;
        });

        // Generate curve points across the visible xMin to xMax range
        const curvePoints = this.coefficients ? this.generateCurvePoints(xMin, xMax) : [];
        if (this.coefficients) {
            curvePoints.forEach(p => {
                if (p.y < yMin) yMin = p.y;
                if (p.y > yMax) yMax = p.y;
            });
        }
        
        if (yMin === Infinity) { yMin = -10; yMax = 10; }
        const yPadding = (yMax - yMin) * 0.15 || 2;
        let finalYMin = yMin - yPadding;
        let finalYMax = yMax + yPadding;

        if (this.axesConfig.includeZero) {
            finalYMin = Math.min(0, finalYMin);
            finalYMax = Math.max(0, finalYMax);
        }
        if (this.axesConfig.customYMin !== null) finalYMin = this.axesConfig.customYMin;
        if (this.axesConfig.customYMax !== null) finalYMax = this.axesConfig.customYMax;
        if (finalYMin >= finalYMax) finalYMax = finalYMin + 1;

        // Create chart datasets (only data points initially)
        const datasets = [
            {
                label: 'Data Points',
                data: this.dataPoints,
                backgroundColor: '#0f7e9b',
                borderColor: '#0f7e9b',
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
                    // Ignore clicks on overlay card
                    const canvasPosition = Chart.helpers.getRelativePosition(event, this.chart);
                    if (this.isPointInsideCard(canvasPosition.x, canvasPosition.y)) {
                        return;
                    }
                    const dataX = this.chart.scales.x.getValueForPixel(canvasPosition.x);
                    
                    const tangentControls = document.getElementById('tangentControls');
                    const isTangentExplorerVisible = tangentControls && tangentControls.classList.contains('visible');
                    
                    if (typeof tangentAnalyzer !== 'undefined' && tangentAnalyzer && isTangentExplorerVisible) {
                        tangentAnalyzer.animateToX(dataX, 150);
                    } else {
                        // Update the point analysis directly
                        this.updatePointAnalysis(dataX);
                    }
                },
                plugins: {
                    title: { display: false,
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
                        position: this.axesConfig.axisPosition === 'center' ? 'center' : 'bottom',
                        min: xMin,
                        max: xMax,
                        title: {
                            display: true,
                            text: this.getAxisLabels().x,
                            font: {
                                size: 14,
                                weight: '600',
                                family: "'IBM Plex Sans', 'Inter', sans-serif"
                            },
                            color: '#123140'
                        },
                        grid: {
                            display: true,
                            color: (context) => (context.tick && context.tick.value === 0 ? '#123140' : 'rgba(0, 0, 0, 0.1)'),
                            lineWidth: (context) => (context.tick && context.tick.value === 0 ? 2 : 1)
                        }
                    },
                    y: {
                        position: this.axesConfig.axisPosition === 'center' ? 'center' : 'left',
                        min: finalYMin,
                        max: finalYMax,
                        title: {
                            display: true,
                            text: this.getAxisLabels().y,
                            font: {
                                size: 14,
                                weight: '600',
                                family: "'IBM Plex Sans', 'Inter', sans-serif"
                            },
                            color: '#123140'
                        },
                        grid: {
                            display: true,
                            color: (context) => (context.tick && context.tick.value === 0 ? '#123140' : 'rgba(0, 0, 0, 0.1)'),
                            lineWidth: (context) => (context.tick && context.tick.value === 0 ? 2 : 1)
                        }
                    }
                }
            },
            plugins: [
                {
                    id: 'zeroLines',
                    beforeDraw: (chart) => {
                        this.drawZeroLines(chart);
                    }
                },
                {
                    id: 'graphOverlayCard',
                    afterDraw: (chart) => {
                        this.drawOverlayCard(chart);
                    }
                }
            ]
        };

        // Create the chart
        this.chart = new Chart(canvas, config);
        
        // Setup card drag and mouse interactions
        this.setupCanvasInteraction(canvas);

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

        this.tangentData = {
            x: x,
            y: y,
            slope: slope,
            equation: this.getTangentEquation(x, y, slope),
            visible: true
        };

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
            borderColor: '#d67b19',
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
            backgroundColor: '#d67b19',
            borderColor: '#d67b19',
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
        // Calculate the range for the tangent line using visible range
        const visible = this.getVisibleRange();
        const totalRange = (visible.xMax - visible.xMin) || 10;
        const lineLength = totalRange * 0.6; // Tangent line extends 60% of visible range in each direction
        
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
            equation += slope === 1 ? 't' : '-t';
        } else {
            equation += MathUtils.formatNumber(slope, 3) + 't';
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
        this.showQuadraticFit = show;
        if (!this.chart) return;

        // Remove existing quadratic fit
        this.chart.data.datasets = this.chart.data.datasets.filter(
            dataset => dataset.label !== 'Quadratic Fit'
        );

        if (show) {
            // Calculate plot range from visible range
            const visible = this.getVisibleRange();
            const xMin = visible.xMin;
            const xMax = visible.xMax;

            // Generate curve points
            const curvePoints = this.generateCurvePoints(xMin, xMax);

            // Add quadratic fit dataset
            this.chart.data.datasets.push({
                label: 'Quadratic Fit',
                data: curvePoints,
                backgroundColor: 'rgba(231, 76, 60, 0)',
                borderColor: '#0f7e9b',
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParabolaAnalyzer;
}
