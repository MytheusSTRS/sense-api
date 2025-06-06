

// Class to model an Issue
class Issue {
  constructor(issue, description, comment, date, location,status,img) {
    this.issue = issue;
    this.description = description;
    this.comments = comment;
    this.date = date;
    this.location = location;
    this.status = status;
    this.image = img
  }
}

//Translates issue categories
function translateCategories(category){
  const labelMap = {
      garbage: "Σκουπίδια",
      lighting: "Φωτισμός",
      environment: "Περιβάλλον",
      green: "Πράσινο",
      plumbing: 'Υδραυλικά',
      "road-constructor": 'Οδικά Έργα',
      "protection-policy": 'Θέματα ασφαλείας'
    };
  return labelMap[category]
}

const city = "patras";
let markers = [];
let reports = [];

// Function to fetch data from the API
async function getData(startdate, enddate, request_type) {
  const _data = [];
  try {
    const response = await fetch(
      `https://api.sense.city/api/1.0/${request_type}?startdate=${startdate}&enddate=${enddate}&city=${city}`
    );
    const value = await response.json();
    for (const element of value) {
      const date = moment(element.create_at).format("DD-MM-YYYY");
      const loc = element.loc?.coordinates;
      if (loc?.length === 2) {
        _data.push(
          new Issue(
            element.issue,
            element.value_desc || "",
            element.comments || "",
            date,
            loc,
            element.status,
            element.image_name
          )
        );
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return _data;
}

// Function for the Filters button
function toggleDropdown() {
  document.getElementById("dropdownMenu").classList.toggle("show");
}

// If user clicks outside of dropdown, hide it
document.addEventListener('click', function (event) {
  const button = document.querySelector('.dropdown-button');
  const menu = document.getElementById('dropdownMenu');
  if (!button.contains(event.target) && !menu.contains(event.target)) {
    menu.classList.remove('show');
  }
});

//Function to count markers
function countMarkersByCategory(reports) {
  if (!Array.isArray(reports)) return {
    environment: 0,
    'road-constructor': 0,
    green: 0,
    garbage: 0
  };

  const counts = {
    environment: 0,
    'road-constructor': 0,
    green: 0,
    garbage: 0
  };

  reports.forEach(issue => {
    if (counts.hasOwnProperty(issue.issue)) {
      counts[issue.issue]++;
    }
  });

  return counts;
}

// Initialize Leaflet map
const map = L.map("map").setView([38.2466, 21.7346], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

async function bind_popup_on_issue(marker, issue) {
  marker.bindPopup(`<strong>${translateCategories(issue.issue)}</strong><br>
                          description = ${issue.description}<br>
                          Reported at: ${issue.date}`);
}

// Load and display data on map
async function loadAndRender() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  reports = await getData(startDate, endDate, "issue");

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  reports.forEach(report => {
    const marker = L.marker([report.location[1], report.location[0]]);
    bind_popup_on_issue(marker, report);
    marker.addTo(map);
    marker.issueType = report.issue;
    markers.push(marker);

    const totalReportsCount = reports.length;
    document.getElementById('totalReports').textContent = `(${totalReportsCount} right now)`;

  });

  filterMarkersByDropdown();

  return;
}

// Function for filters to work
function filterMarkersByDropdown() {
  const checkedValues = Array.from(document.querySelectorAll('#dropdownMenu input[type="checkbox"]:checked'))
    .map(input => input.value);

  markers.forEach(marker => {
    if (checkedValues.includes(marker.issueType)) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });

  return;
}

// Function to initialize the page
async function initialize() {
  await loadAndRender(); // πρέπει να γίνει πρώτα

  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  const countsByCategory = groupReportsByTimeBuckets(reports, startDate, endDate);
  const chartData = prepareChartData(countsByCategory, startDate, endDate);
  const percentages = calculatePercentages(reports);

  await Promise.all([
    drawChart(chartData),
    drawPieChart(percentages),
  ]);
}


// Function to get graph points
function groupReportsByTimeBuckets(reports, startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const totalMs = endDate - startDate;
  const bucketCount = 10;
  const bucketMs = totalMs / bucketCount;


  const categories = ['environment', 'road-constructor', 'green', 'garbage'];

  const counts = {};
  categories.forEach(cat => {
    counts[cat] = new Array(bucketCount).fill(0);
  });

  reports.forEach(report => {
    if (!categories.includes(report.issue)) return;

    const reportDate = new Date(report.date.split("-").reverse().join("-"));
    if (reportDate >= startDate && reportDate <= endDate) {
      const diff = reportDate - startDate;
      let bucketIndex = Math.floor(diff / bucketMs);
      if (bucketIndex >= bucketCount) bucketIndex = bucketCount - 1;

      counts[report.issue][bucketIndex]++;
    }
  });

  return counts;
}

// Function to get data ready for graph
function prepareChartData(countsByCategory, startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const bucketCount = 10;
  const totalMs = endDate - startDate;
  const bucketMs = totalMs / bucketCount;

  const categories = ['environment', 'road-constructor', 'green', 'garbage'];
  const colors = {
    environment: 'rgba(54, 162, 235, 0.7)',
    'road-constructor': 'rgba(255, 159, 64, 0.7)',
    green: 'rgba(75, 192, 192, 0.7)',
    garbage: 'rgba(255, 99, 132, 0.7)'
  };

  const selectedCategories = getSelectedCategories();

  // Υπολογισμός συνολικών reports ανά κατηγορία
  const totalCounts = {};
  categories.forEach(cat => {
    const countsArray = countsByCategory[cat] || new Array(bucketCount).fill(0);
    totalCounts[cat] = countsArray.reduce((a, b) => a + b, 0);
  });

  const datasets = categories
    .filter(cat => selectedCategories.includes(cat))
    .map(cat => ({
      label: `${cat} (${totalCounts[cat]})`, // εδώ προσθέτουμε το πλήθος
      data: countsByCategory[cat] || new Array(bucketCount).fill(0),
      backgroundColor: colors[cat],
      borderColor: colors[cat].replace('0.7', '1'),
      borderWidth: 2,
      fill: false,
    }));

  const labels = [];
  for (let i = 0; i < bucketCount; i++) {
    const bucketStartDate = new Date(startDate.getTime() + i * bucketMs);
    const day = String(bucketStartDate.getDate()).padStart(2, '0');
    const month = String(bucketStartDate.getMonth() + 1).padStart(2, '0');
    labels.push(`${day}-${month}`);
  }

  return {
    labels,
    datasets
  };
}

let myChart = null;

// function to create graph
function drawChart(chartData, animate = true) {
  const ctx = document.getElementById('myChart').getContext('2d');

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      animation: animate ? {
        duration: 1000,
        easing: 'easeOutQuart',
      } : false,
      responsive: true,
      interaction: {
        mode: 'nearest',
        intersect: false
      },
      elements: {
        line: {
          tension: 0,
          borderWidth: 2,
        },
        point: {
          radius: 4,
          hoverRadius: 6
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Χρόνος (Ημερομηνία)'
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Πλήθος Αναφορών'
          },
          stepSize: 1,
          grace: '5%'
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false
        }
      }
    }
  });
}

// Function to calculate percentages for pie graph
function calculatePercentages(reports) {
  const counts = countMarkersByCategory(reports);

  const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return {
      environment: 0,
      'road-constructor': 0,
      green: 0,
      garbage: 0,
    };
  }

  const percentages = {};
  for (const category in counts) {
    percentages[category] = ((counts[category] / total) * 100).toFixed(2);
  }

  return percentages;
}

// Function to create pie graph
function drawPieChart(percentages) {
  const ctx = document.getElementById('pieChart').getContext('2d');

  if (window.myPieChart) {
    window.myPieChart.destroy();
  }

  window.myPieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Environment', 'Road Constructor', 'Green', 'Garbage'],
      datasets: [{
        data: [
          percentages.environment,
          percentages['road-constructor'],
          percentages.green,
          percentages.garbage
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.parsed}%`;
            }
          }
        }
      }
    }
  });
}

function getSelectedCategories() {
  return Array.from(document.querySelectorAll('#dropdownMenu input[type="checkbox"]:checked'))
    .map(input => input.value);
}

document.querySelectorAll('#dropdownMenu input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const countsByCategory = groupReportsByTimeBuckets(reports, startDate, endDate);
    const filteredChartData = prepareChartData(countsByCategory, startDate, endDate);
    drawChart(filteredChartData, false);
  });
});

window.addEventListener('DOMContentLoaded', initialize);