/* ==========================================================================
   AI Crop Recommendation System - Core JavaScript
   Handles AJAX predictions, localStorage history, dashboards and Chart.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    // ----------------------------------------------------
    // Page Routing / Active Navigation Highlight
    // ----------------------------------------------------
    const path = window.location.pathname;
    const pageName = path.split("/").pop();
    
    if (pageName === "index.html" || pageName === "" || path === "/") {
        document.body.classList.add("page-home");
    } else if (pageName === "predict.html") {
        document.body.classList.add("page-predict");
    } else if (pageName === "result.html") {
        document.body.classList.add("page-predict"); // Results page is part of the prediction flow
    } else if (pageName === "dashboard.html") {
        document.body.classList.add("page-dashboard");
    } else if (pageName === "about.html") {
        document.body.classList.add("page-about");
    }

    // ----------------------------------------------------
    // Preloader Fade Out
    // ----------------------------------------------------
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(function () {
            preloader.style.opacity = '0';
            setTimeout(function () {
                preloader.style.display = 'none';
            }, 500);
        }, 600);
    }

    // ----------------------------------------------------
    // Transparent-to-Solid Navbar on Scroll (Home Page)
    // ----------------------------------------------------
    const navbar = document.querySelector('.custom-navbar');
    if (navbar) {
        // Only apply transparency logic to Home Page
        if (document.body.classList.contains('page-home')) {
            window.addEventListener('scroll', function () {
                if (window.scrollY > 50) {
                    navbar.classList.remove('transparent');
                } else {
                    navbar.classList.add('transparent');
                }
            });
            // Initial check
            if (window.scrollY > 50) {
                navbar.classList.remove('transparent');
            } else {
                navbar.classList.add('transparent');
            }
        }
    }

    // ----------------------------------------------------
    // Back to Top Button
    // ----------------------------------------------------
    const backToTopBtn = document.getElementById('btn-back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'flex';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ----------------------------------------------------
    // LocalStorage Prediction History & Mock Seeds
    // ----------------------------------------------------
    let history = JSON.parse(localStorage.getItem('crop_predictions_history'));
    
    // Initial Seed of Mock Data to match screenshots (Figure 8.4)
    if (!history || history.length === 0) {
        history = [
            { date: '19-May-2025 10:30 AM', nitrogen: 90, phosphorus: 42, potassium: 43, temp: 25.5, humidity: 60, ph: 6.5, rainfall: 200, crop: 'Rice' },
            { date: '19-May-2025 10:15 AM', nitrogen: 105, phosphorus: 35, potassium: 50, temp: 27.3, humidity: 70, ph: 6.2, rainfall: 150, crop: 'Maize' },
            { date: '19-May-2025 10:00 AM', nitrogen: 60, phosphorus: 25, potassium: 30, temp: 28.0, humidity: 65, ph: 6.8, rainfall: 180, crop: 'Cotton' },
            { date: '19-May-2025 09:45 AM', nitrogen: 80, phosphorus: 40, potassium: 45, temp: 26.5, humidity: 55, ph: 6.3, rainfall: 120, crop: 'Groundnut' },
            { date: '19-May-2025 09:30 AM', nitrogen: 20, phosphorus: 15, potassium: 20, temp: 24.0, humidity: 50, ph: 6.0, rainfall: 100, crop: 'Moong' }
        ];
        localStorage.setItem('crop_predictions_history', JSON.stringify(history));
    }

    // ----------------------------------------------------
    // Crop Metadata (Descriptions & Images)
    // ----------------------------------------------------
    const cropMetadata = {
        'rice': { desc: 'Rice grows best in waterlogged fields, demanding clayey loams, high rainfall (above 150cm) and stable temperatures around 25°C.', img: 'rice.jpg' },
        'maize': { desc: 'Maize adapts well to rich well-drained soils, moderate rainfall, warm temperatures and medium level nitrogen/potassium contents.', img: 'maize.jpg' },
        'jute': { desc: 'Jute requires alluvial sandy soil, high tropical humidity, hot climates, and plentiful rainfall during sifting and growth.', img: 'jute.jpg' },
        'cotton': { desc: 'Cotton yields highly on deep black soils, warm climates, low to medium humidity, and moderate irrigation during growth cycles.', img: 'cotton.jpg' },
        'coconut': { desc: 'Coconut thrives in coastal sandy loams, warm tropical temperatures, high humidity, and steady tropical rainfall.', img: 'coconut.jpg' },
        'papaya': { desc: 'Papaya requires rich sandy loam soil, high drainage, warm climates, and balanced nutrient distributions.', img: 'papaya.jpg' },
        'orange': { desc: 'Orange requires deep loamy soils, sub-tropical climates, average temperature thresholds, and specific soil pH levels.', img: 'orange.jpg' },
        'apple': { desc: 'Apple thrives in high altitude sandy-clay soils, cold temperatures, regular irrigation, and specific frost configurations.', img: 'apple.jpg' },
        'muskmelon': { desc: 'Muskmelon prefers warm temperatures, high sunlight, dry climate conditions, and sandy fertile soil with medium NPK.', img: 'muskmelon.jpg' },
        'watermelon': { desc: 'Watermelon requires sandy loams, hot sunny conditions, dry humidity intervals, and specific potash (K) ratios.', img: 'watermelon.jpg' },
        'grapes': { desc: 'Grapes prefer rich loamy soils, warm climates, low humidity, and dynamic soil drainage systems.', img: 'grapes.jpg' },
        'mango': { desc: 'Mango is suitable for tropical alluvial soils, dry summer periods, warm winters, and average acidity thresholds.', img: 'mango.jpg' },
        'banana': { desc: 'Banana thrives in heavily organic soils, tropical humidity index, high rainfall intervals, and rich nitrogen input.', img: 'banana.jpg' },
        'pomegranate': { desc: 'Pomegranate grows in arid and semi-arid conditions, clay loams, hot days and cold nights with moderate pH levels.', img: 'pomegranate.jpg' },
        'lentil': { desc: 'Lentil prefers well-drained sandy loams, cold growing seasons, dry climate segments, and low potassium levels.', img: 'lentil.jpg' },
        'blackgram': { desc: 'Blackgram grows efficiently on sandy loams, warm weather, and moderate rainfall levels with short growth cycles.', img: 'blackgram.jpg' },
        'mungbean': { desc: 'Mungbean requires light loamy soils, high temperatures, dry harvest seasons, and low water consumption.', img: 'mungbean.jpg' },
        'mothbeans': { desc: 'Mothbeans are extremely drought-resistant crops suitable for sandy soils, low rainfall, and high temperatures.', img: 'mothbeans.jpg' },
        'pigeonpeas': { desc: 'Pigeonpeas prefer warm weather, high drainage, sandy soils, and low water levels during initial crop phases.', img: 'pigeonpeas.jpg' },
        'kidneybeans': { desc: 'Kidneybeans grow optimally in temperate zones, deep rich soils, and average rain intervals.', img: 'kidneybeans.jpg' },
        'chickpea': { desc: 'Chickpea adapts to dry cold climates, rich black soils, low humidity, and medium nitrogen requirements.', img: 'chickpea.jpg' },
        'coffee': { desc: 'Coffee requires volcanic red clay soils, high altitude, shade trees, steady rain, and temperature brackets between 18-24°C.', img: 'coffee.jpg' }
    };

    // Helper to format date
    function getFormattedDate() {
        const date = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(date.getDate()).padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // hour '0' should be '12'
        const strTime = hours + ':' + minutes + ' ' + ampm;
        
        return `${day}-${month}-${year} ${strTime}`;
    }

    // Helper to format crop names nicely (captialize first letter)
    function formatCropName(crop) {
        if (!crop) return '';
        return crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
    }

    // ----------------------------------------------------
    // Index Page Counters Animation
    // ----------------------------------------------------
    if (document.body.classList.contains('page-home')) {
        const accuracyEl = document.getElementById('accuracy-counter');
        const cropsEl = document.getElementById('crops-counter');
        const predictionsEl = document.getElementById('predictions-counter');
        const availEl = document.getElementById('avail-counter');

        if (accuracyEl) {
            animateCounter(accuracyEl, 95.4, '%', 1.5);
            animateCounter(cropsEl, 22, '+', 1);
            animateCounter(predictionsEl, history.length, '+', 1.2);
            animateCounter(availEl, 7, '/7 Indicators', 0.8, true);
        }

        function animateCounter(element, target, suffix = '', duration = 1.5, isRatio = false) {
            let start = 0;
            const steps = 60;
            const increment = target / steps;
            const stepDuration = (duration * 1000) / steps;
            let currentStep = 0;

            const interval = setInterval(function () {
                currentStep++;
                start += increment;
                if (currentStep >= steps) {
                    clearInterval(interval);
                    element.textContent = isRatio ? `${Math.round(target)}/7` : `${target.toFixed(target % 1 === 0 ? 0 : 1)}${suffix}`;
                } else {
                    element.textContent = isRatio ? `${Math.round(start)}/7` : `${start.toFixed(target % 1 === 0 ? 0 : 1)}${suffix}`;
                }
            }, stepDuration);
        }
    }

    // ----------------------------------------------------
    // Predict Form Handling (AJAX)
    // ----------------------------------------------------
    const predictForm = document.getElementById('predictForm');
    if (predictForm) {
        predictForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Client-side validations
            let isValid = true;
            const inputs = predictForm.querySelectorAll('input');
            inputs.forEach(input => {
                if (!input.checkValidity()) {
                    input.classList.add('is-invalid');
                    isValid = false;
                } else {
                    input.classList.remove('is-invalid');
                }
            });

            if (!isValid) return;

            // Prepare Request Payload
            const formData = {
                nitrogen: document.getElementById('nitrogen').value,
                phosphorus: document.getElementById('phosphorus').value,
                potassium: document.getElementById('potassium').value,
                temp: document.getElementById('temp').value,
                humidity: document.getElementById('humidity').value,
                ph: document.getElementById('ph').value,
                rainfall: document.getElementById('rainfall').value
            };

            // Show submit loading feedback
            const submitBtn = predictForm.querySelector('button[type="submit"]');
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Analyzing Soil...`;

            // Post request to Flask Server
            fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.error || 'Server error occurred.');
                    });
                }
                return response.json();
            })
            .then(data => {
                const predictedCrop = data.crop;
                
                // Construct history record
                const newRecord = {
                    date: getFormattedDate(),
                    nitrogen: parseFloat(formData.nitrogen),
                    phosphorus: parseFloat(formData.phosphorus),
                    potassium: parseFloat(formData.potassium),
                    temp: parseFloat(formData.temp),
                    humidity: parseFloat(formData.humidity),
                    ph: parseFloat(formData.ph),
                    rainfall: parseFloat(formData.rainfall),
                    crop: formatCropName(predictedCrop)
                };

                // Add to history list (prepend to keep latest first)
                history.unshift(newRecord);
                localStorage.setItem('crop_predictions_history', JSON.stringify(history));

                // Save latest prediction separately for result page extraction
                localStorage.setItem('latest_crop_prediction', JSON.stringify(newRecord));

                // Redirect to result page
                window.location.href = 'result.html';
            })
            .catch(error => {
                alert(`Error: ${error.message}`);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            });
        });
    }

    // ----------------------------------------------------
    // Result Page Rendering
    // ----------------------------------------------------
    if (pageName === "result.html") {
        const latestPred = JSON.parse(localStorage.getItem('latest_crop_prediction'));
        if (latestPred) {
            const cropKey = latestPred.crop.toLowerCase();
            
            // Set text elements
            document.getElementById('result-crop-name').textContent = latestPred.crop.toUpperCase();
            
            // Match description and image
            const metadata = cropMetadata[cropKey] || { 
                desc: `This crop is most suitable for the specified soil parameters. It matches optimal NPK ranges alongside environmental factors.`, 
                img: 'default.jpg' 
            };
            
            document.getElementById('result-crop-desc').textContent = metadata.desc;
            document.getElementById('result-crop-img').src = `assets/images/crops/${metadata.img}`;
            document.getElementById('result-crop-img').onerror = function() {
                this.src = 'assets/images/crops/default.jpg';
            };

            // Set inputs summary table values
            document.getElementById('summary-n').textContent = `${latestPred.nitrogen} mg/kg`;
            document.getElementById('summary-p').textContent = `${latestPred.phosphorus} mg/kg`;
            document.getElementById('summary-k').textContent = `${latestPred.potassium} mg/kg`;
            document.getElementById('summary-temp').textContent = `${latestPred.temp} °C`;
            document.getElementById('summary-humidity').textContent = `${latestPred.humidity} %`;
            document.getElementById('summary-ph').textContent = latestPred.ph;
            document.getElementById('summary-rainfall').textContent = `${latestPred.rainfall} mm`;
        } else {
            // Fallback mock result if none exists in localStorage
            document.getElementById('result-crop-name').textContent = "RICE";
            document.getElementById('summary-n').textContent = "90 mg/kg";
            document.getElementById('summary-p').textContent = "42 mg/kg";
            document.getElementById('summary-k').textContent = "43 mg/kg";
            document.getElementById('summary-temp').textContent = "25.5 °C";
            document.getElementById('summary-humidity').textContent = "60 %";
            document.getElementById('summary-ph').textContent = "6.5";
            document.getElementById('summary-rainfall').textContent = "200 mm";
        }
    }

    // ----------------------------------------------------
    // Dashboard Logic & Charts Rendering
    // ----------------------------------------------------
    if (pageName === "dashboard.html") {
        renderDashboardData();
    }

    function renderDashboardData() {
        const historyBody = document.getElementById('dashboard-history-body');
        if (!historyBody) return;

        // Clear preloader rows
        historyBody.innerHTML = '';

        if (history.length === 0) {
            historyBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">No predictions recorded yet.</td></tr>`;
            return;
        }

        // 1. Render Table
        history.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="fw-semibold">${item.date}</td>
                <td>${item.nitrogen}</td>
                <td>${item.phosphorus}</td>
                <td>${item.potassium}</td>
                <td>${item.temp}°C</td>
                <td>${item.humidity}%</td>
                <td>${item.ph}</td>
                <td>${item.rainfall}mm</td>
                <td><span class="badge bg-success py-2 px-3 rounded-pill">${item.crop}</span></td>
            `;
            historyBody.appendChild(row);
        });

        // 2. Update KPI Stats
        document.getElementById('dashboard-total-predictions').textContent = history.length;
        
        // Count today's runs
        const todayDateStr = new Date().getDate() + '-' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()];
        const todayRuns = history.filter(item => item.date.includes(todayDateStr)).length;
        document.getElementById('dashboard-today-predictions').textContent = todayRuns;

        // Count unique crop count predicted
        const uniqueCrops = [...new Set(history.map(item => item.crop))].length;

        // 3. Render Chart.js Analytics
        renderCharts(history);
    }

    function renderCharts(data) {
        // --- Setup Chart 1: Recommendation Share (Pie Chart) ---
        const cropCounts = {};
        data.forEach(item => {
            cropCounts[item.crop] = (cropCounts[item.crop] || 0) + 1;
        });
        const pieLabels = Object.keys(cropCounts);
        const pieValues = Object.values(cropCounts);

        const pieCtx = document.getElementById('cropPieChart').getContext('2d');
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieValues,
                    backgroundColor: [
                        '#198754', '#20c997', '#0dcaf0', '#ffc107', '#fd7e14', 
                        '#dc3545', '#6f42c1', '#d63384', '#6610f2', '#0d6efd'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });

        // --- Setup Chart 2: Nutrient Averages (Bar Chart) ---
        // Group by crop to calculate average N, P, K
        const cropNutrients = {};
        data.forEach(item => {
            if (!cropNutrients[item.crop]) {
                cropNutrients[item.crop] = { n: 0, p: 0, k: 0, count: 0 };
            }
            cropNutrients[item.crop].n += item.nitrogen;
            cropNutrients[item.crop].p += item.phosphorus;
            cropNutrients[item.crop].k += item.potassium;
            cropNutrients[item.crop].count++;
        });

        const barLabels = Object.keys(cropNutrients);
        const avgN = [];
        const avgP = [];
        const avgK = [];

        barLabels.forEach(crop => {
            const count = cropNutrients[crop].count;
            avgN.push((cropNutrients[crop].n / count).toFixed(1));
            avgP.push((cropNutrients[crop].p / count).toFixed(1));
            avgK.push((cropNutrients[crop].k / count).toFixed(1));
        });

        const barCtx = document.getElementById('nutrientBarChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [
                    {
                        label: 'Nitrogen (N)',
                        data: avgN,
                        backgroundColor: '#198754'
                    },
                    {
                        label: 'Phosphorus (P)',
                        data: avgP,
                        backgroundColor: '#20c997'
                    },
                    {
                        label: 'Potassium (K)',
                        data: avgK,
                        backgroundColor: '#ffc107'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Nutrients mg/kg' }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });

        // --- Setup Chart 3: Climate Trends (Line Chart) ---
        // Sort data chronologically (oldest first for line chart)
        const chronologicalData = [...data].reverse();
        const lineLabels = chronologicalData.map((item, idx) => `Run #${idx + 1}`);
        const lineTemp = chronologicalData.map(item => item.temp);
        const lineRain = chronologicalData.map(item => item.rainfall);

        const lineCtx = document.getElementById('climateLineChart').getContext('2d');
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: lineLabels,
                datasets: [
                    {
                        label: 'Temperature (°C)',
                        data: lineTemp,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        yAxisID: 'yTemp',
                        tension: 0.3
                    },
                    {
                        label: 'Rainfall (mm)',
                        data: lineRain,
                        borderColor: '#0d6efd',
                        backgroundColor: 'rgba(13, 110, 253, 0.1)',
                        yAxisID: 'yRain',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yTemp: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Temperature °C' },
                        grid: { drawOnChartArea: false }
                    },
                    yRain: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Rainfall mm' }
                    }
                },
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    }
});
