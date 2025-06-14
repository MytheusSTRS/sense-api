//// SOS TELOS KWDIKA

// Class to model an Issue
class Issue {
  constructor(issue, description, comment, date, location, status, img, id) {
    this.issue = issue;
    this.description = description;
    this.comments = comment;
    this.date = date;
    this.location = location;
    this.status = status;
    this.image = img
    this.id = id
  }
}

Chart.defaults.color = 'white';// Κάνει το κείμενο στα γραφήματα άσπρο
//Translates issue categories
const labelMap = {
  "garbage": "Σκουπίδια",
  "lighting": "Φωτισμός",
  "environment": "Περιβάλλον",
  "green": "Πράσινο",
  "plumbing": 'Υδραυλικά',
  "road-constructor": 'Οδικά Έργα',
  "protection-policy": 'Θέματα ασφαλείας'
};
//Translates issue categories
function translateCategories(category) {
  // const labelMap = {
  //   "garbage": "Σκουπίδια",
  //   "lighting": "Φωτισμός",
  //   "environment": "Περιβάλλον",
  //   "green": "Πράσινο",
  //   "plumbing": 'Υδραυλικά',
  //   "road-constructor": 'Οδικά Έργα',
  //   "protection-policy": 'Θέματα ασφαλείας'
  // };
  return labelMap[category]
}

//Loads custom marker icons depending on issue category
function loadMarkerIcons() {
  const icons = {}
  for (const element of Object.keys(labelMap)) {
    icons[element] = new L.icon({
      iconUrl: `./icons/${element}.png`,
      shadowUrl: `./icons/shadow.png`,
      iconSize: [50, 50], // size of the icon
      shadowSize: [30, 50], // size of the shadow
      iconAnchor: [25, 50], // point of the icon which will correspond to marker's location
      shadowAnchor: [15, 51],  // the same for the shadow
      popupAnchor: [5, -45] // point from which the popup should open relative to the iconAnchor
    })
  };
  return icons;
}
const city = "patras";
let markers = [];
let reports = [];


// Function to fetch data from the API












// ΝΕΑ GETDATA ΠΟΥ ΕΠΙΔΙΩΚΕΙ ΤΗΝ ΚΒΑΝΤΟΠΟΙΗΣΗ ΤΟΥ DATA APO TO REQUEST ΠΡΟΣ ΑΚΡΙΒΗ ΥΠΟΛΟΓΙΣΜΌ ΤΩΝ "CONFIRMED" REQUESTS (TO API EINAI SAPIO ME CAP 1000)
// ALSO KANEI TOSES FORES REQUEST POU TO CPU PAEI BRRR και Η ΣΕΛΙΔΑ ΑΡΓΕΙ ΠΟΛΥ ΓΙΑ ΜΕΓΑΛΑ ΧΡΟΝΙΚΑ ΔΙΑΣΤΗΜΑΤΑ
async function getData(startdate, enddate, request_type) {
  const _data = [];
  const limit = 1000;
  const city = "patras";

  const fetchWithSplit = async (start, end) => {
    let offset = 0;
    let finished = false;

    while (!finished) {
      const url = `https://api.sense.city/api/1.0/${request_type}?startdate=${start}&enddate=${end}&city=${city}&limit=${limit}&offset=${offset}`;
      const response = await fetch(url);
      const value = await response.json();

      if (!value || value.length === 0) break;

      // ⚠️ Αν το πρώτο batch είναι μεγάλο, split το range και return
      if (value.length >= limit && offset === 0) {
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        const timeDiff = endDateObj - startDateObj;

        if (timeDiff > 86400000) {
          const midDate = new Date(startDateObj.getTime() + timeDiff / 2);
          const mid = moment(midDate).format("YYYY-MM-DD");
          console.warn(`⚠️ Splitting large range: ${start} → ${mid} → ${end}  `);
          const midStart = moment(startDateObj).format("YYYY-MM-DD");
          const midEnd = moment(midDate).format("YYYY-MM-DD");
          const nextStart = moment(midDate).format("YYYY-MM-DD"); // same day again

          await fetchWithSplit(midStart, midEnd);
          await fetchWithSplit(nextStart, end);
          return;
        }
      }

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
              `https://api.sense.city/api/1.0/image_issue?bug_id=${element.bug_id}&resolution=full`,
              element.bug_id
            )
          );
        }
      }

      if (value.length < limit) {
        finished = true;
      } else {
        offset += limit;
      }
    }
  };

  try {
    await fetchWithSplit(startdate, enddate);

    _data.sort((a, b) => {
      const dateA = new Date(a.date.split('-').reverse().join('-'));
      const dateB = new Date(b.date.split('-').reverse().join('-'));
      return dateA - dateB;
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  }
  const uniqueMap = new Map();

  _data.forEach(issue => {
    if (!uniqueMap.has(issue.id)) {
      uniqueMap.set(issue.id, issue);
    }
  });

  const dedupedData = Array.from(uniqueMap.values());

  return dedupedData;
}



// async function getData(startdate, enddate, request_type) {
//   const _data = [];
//   try {
//     const response = await fetch(
//       `https://api.sense.city/api/1.0/${request_type}?startdate=${startdate}&enddate=${enddate}&city=${city}`
//     );
//     const value = await response.json();
//     for (const element of value) {
//       const date = moment(element.create_at).format("DD-MM-YYYY");
//       const loc = element.loc?.coordinates;
//       if (loc?.length === 2) {
//         _data.push(
//           new Issue(
//             element.issue,
//             element.value_desc || "",
//             element.comments || "",
//             date,
//             loc,
//             element.status,
//             `https://api.sense.city/api/1.0/image_issue?bug_id=${element.bug_id}&resolution=full`,
//             element.bug_id
//           )
//         );
//       }
//     }
//   } catch (error) {
//     console.error("Error fetching data:", error);
//   }
//   return _data;
// }



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
    garbage: 0,
    lighting: 0,
    plumbing: 0,
    'protection-policy': 0
  };

  const counts = {
    environment: 0,
    'road-constructor': 0,
    green: 0,
    garbage: 0,
    lighting: 0,
    plumbing: 0,
    'protection-policy': 0
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
  let buttonEnabled = '';
  const uniqueId = `comments-${Math.random().toString(36).substr(2, 9)}`;
  if (issue.comments == '') {
    buttonEnabled = 'disabled';
  }
  marker.bindPopup(`
  <div class="popup-container">
    <div class="popup-main">
      <strong>${translateCategories(issue.issue)}</strong><br>
      <img src=${issue.image} alt="Δεν υπάρχει εικόνα" style="width:100%; max-height:200px; overflow:hidden; display:block; margin:auto">
      ${issue.description}<br>
    </div>
    <div style="margin-left: -14px; text-align: left;">
      <button onclick="
        if (document.getElementById('${uniqueId}').style.display == 'none')
          document.getElementById('${uniqueId}').style.display = 'block';
        else
          document.getElementById('${uniqueId}').style.display = 'none';
        "
        ${buttonEnabled}
        style="border:solid;
          font-size:14px;
          padding: 5px 8px;
          line-height:1;
          white-space:nowrap;
        ">Σχόλια χρήστη</button>
    </div>
    <div id="${uniqueId}" style="display:none">
      ${issue.comments}
    </div>
    Αναφέρθηκε στις: ${issue.date}
  </div>
`, { maxWidth: 200 });

}

// Load and display data on map
async function loadAndRender() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const marker_icons = loadMarkerIcons();

  reports = await getData(startDate, endDate, "issue");

  markers.forEach(m => map.removeLayer(m));
  markers = [];

  reports.forEach(report => {
    const marker = L.marker([report.location[1], report.location[0]], { icon: marker_icons[report.issue] });
    bind_popup_on_issue(marker, report);
    marker.addTo(map);
    marker.issueType = report.issue;
    markers.push(marker);

    const totalReportsCount = reports.length;
    document.getElementById('totalReports').textContent = `(${totalReportsCount} Τώρα)`;

  });

  filterMarkersByDropdown();

  if (statsVisible) {
    const countsByCategory = groupReportsByTimeBuckets(reports, startDate, endDate);
    const chartData = prepareChartData(countsByCategory, startDate, endDate);
    renderSharedLegend('sharedLegend');
    drawChart(chartData, true);

    const percentages = calculatePercentages(reports);
    drawPieChart(percentages);

    const resolutionPercent = calculateResolutionRate(reports);
    drawResolvedBarChart(resolutionPercent);
  }

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
  await loadAndRender();
}



// Function to get graph points
function groupReportsByTimeBuckets(reports, startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  const totalMs = endDate - startDate;
  const bucketCount = 10;
  const bucketMs = totalMs / bucketCount;


  const categories = ['environment', 'road-constructor', 'green', 'garbage', 'lighting', 'plumbing', 'protection-policy'];

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

  const categories = ['environment', 'road-constructor', 'green', 'garbage', 'lighting', 'plumbing', 'protection-policy'];
  const colors = {
    environment: 'rgba(54, 162, 235, 0.7)',
    'road-constructor': 'rgba(255, 159, 64, 0.7)',
    green: 'rgba(75, 192, 192, 0.7)',
    garbage: 'rgba(255, 99, 132, 0.7)',
    lighting: 'rgba(99, 255, 151, 0.7)',
    plumbing: 'rgba(126, 60, 96, 0.7)',
    'protection-policy': 'rgba(112, 165, 63, 0.7)'
  };

  const selectedCategories = getSelectedCategories();

  const totalCounts = {};
  categories.forEach(cat => {
    const countsArray = countsByCategory[cat] || new Array(bucketCount).fill(0);
    totalCounts[cat] = countsArray.reduce((a, b) => a + b, 0);
  });

  const datasets = categories
    .filter(cat => selectedCategories.includes(cat))
    .map(cat => ({
      label: `${cat} (${totalCounts[cat]})`,
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

const labelColors = {
  environment: 'rgba(54, 162, 235, 0.7)',
  'road-constructor': 'rgba(255, 159, 64, 0.7)',
  green: 'rgba(75, 192, 192, 0.7)',
  garbage: 'rgba(255, 99, 132, 0.7)',
  lighting: 'rgba(99, 255, 151, 0.7)',
  plumbing: 'rgba(126, 60, 96, 0.7)',
  'protection-policy': 'rgba(112, 165, 63, 0.7)'
};

function renderSharedLegend(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.gap = '12px';
  container.style.alignItems = 'center';

  const rightPaneWidth = document.getElementById('right-pane').offsetWidth;

  // Base font size calculation: scale proportionally (you can adjust the divisor)
  const fontSizePx = Math.max(10, rightPaneWidth / 30); // Ensures minimum font size

  Object.keys(labelMap).forEach(key => {
    const legendItem = document.createElement('div');
    legendItem.style.display = 'flex';
    legendItem.style.alignItems = 'center';

    const colorBox = document.createElement('span');
    colorBox.style.backgroundColor = labelColors[key];
    colorBox.style.width = fontSizePx * 0.8 + 'px';
    colorBox.style.height = fontSizePx * 0.8 + 'px';
    colorBox.style.display = 'inline-block';
    colorBox.style.marginRight = fontSizePx * 0.2 + 'px';

    const label = document.createElement('span');
    label.textContent = labelMap[key];
    label.style.fontSize = fontSizePx + 'px';

    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    container.appendChild(legendItem);
  });
}

let myChart = null;

// function to create graph
function drawChart(chartData, animate = true) {
  const ctx = document.getElementById('myChart').getContext('2d');

  if (myChart) {
    myChart.destroy();
  }
  // μετάφραση στα ελληνικά 
  // const greekLabels = {
  //   environment: 'Περιβάλλον',
  //   'road-constructor': 'Οδικά Έργα',
  //   green: 'Πράσινο/φυτά',
  //   garbage: 'Απορρίμματα',
  //   lighting: 'Φωτισμος',
  //   plumbing: 'Υδραυλικά',
  //   'protection-policy': '(?)'
  // };
  chartData.datasets.forEach(dataset => {
    const key = dataset.label.split(" ")[0]; // π.χ. "garbage"
    const match = Object.keys(labelMap).find(k => dataset.label.startsWith(k));
    if (match) {
      dataset.label = `${labelMap[match]} (${dataset.data.reduce((a, b) => a + b, 0)})`;
    }
  });

// μετάφραση στα ελληνικά 
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
          display: false,
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
      lighting: 0,
      plumbing: 0,
      'protection-policy': 0
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
      // μετάφραση στα ελληνικά 
      labels: ['Περιβάλλον', 'Οδικά Έργα', 'Πράσινο/φυτά', 'Απορρίμματα', 'Φωτισμός', 'Υδραυλικά', 'protection-policy(?)'],
      // μετάφραση στα ελληνικά 
      datasets: [{
        data: [
          percentages.environment,
          percentages['road-constructor'],
          percentages.green,
          percentages.garbage,
          percentages.lighting,
          percentages.plumbing,
          percentages['protection-policy']
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(99, 255, 151, 0.7)',
          'rgba(126, 60, 96, 0.7)',
          'rgba(112, 165, 63, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(99, 255, 151, 0.7)',
          'rgba(126, 60, 96, 0.7)',
          'rgba(112, 165, 63, 0.7)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
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

// συνάρτηση που υπολογίζει πόσα απο τα request έχουν έρθει εις πέρας 
function calculateResolutionRate(reports) {
  if (!reports.length) return 0;

  const resolved = reports.filter(r =>
    r.status === "CONFIRMED"
  ).length;

  console.log("Resolved count:", resolved);
  console.log("Total reports:", reports.length);
  console.log("Resolution %:", ((resolved / reports.length) * 100).toFixed(1));

  return ((resolved / reports.length) * 100).toFixed(1);
}

//το νεο γράφημα
function drawResolvedBarChart(resolutionPercent) {
  const ctx = document.getElementById('resolvedBarChart').getContext('2d');

  if (window.myResolvedChart) {
    window.myResolvedChart.destroy();
  }


  let color = 'rgba(248, 7, 7, 0.7)';
  let border = 'rgb(0, 0, 0)';


  const percentValue = parseFloat(resolutionPercent);

  window.myResolvedChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Ποσοστό Επίλυσης'],
      datasets: [{
        label: `Επίλυση: ${percentValue}%`,
        data: [percentValue],
        backgroundColor: color,
        borderColor: border,
        borderWidth: 2,
        barThickness: 40,
        maxBarThickness: 80, 

      }]
    },
  options: {
  responsive: true,
  indexAxis: 'x',
  scales: {
    y: {
      beginAtZero: true,
      suggestedMax: 1.5, 
      title: {
        display: true,
        text: '% Επιλυμένων Αναφορών'
      },
      ticks: {
        callback: value => `${value}%`,
        color: '#ccc'
      },
      grid: {
        color: 'rgba(255,255,255,0.05)'
      }
    },
    x: {
      display: false
    }
  },
  plugins: {
    legend: { display: false },
    datalabels: {
      anchor: 'end',     
      align: 'right',        
      offset: 16,
      formatter: value => `${value}%`,
      color: '#fff',
      font: {
        size: 30,
        weight: 'bold'
      }
    }
  }
},
    plugins: [ChartDataLabels]
  });
}


function getSelectedCategories() {
  return Array.from(document.querySelectorAll('#dropdownMenu input[type="checkbox"]:checked'))
    .map(input => input.value);
}

const today = new Date();
const priorWeek = new Date();
priorWeek.setDate(today.getDate() - 7);
const formatDate = (date) => date.toISOString().split('T')[0];
$('#startDate').val(formatDate(priorWeek));
$('#endDate').val(formatDate(today));


document.querySelectorAll('#dropdownMenu input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    filterMarkersByDropdown();

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const countsByCategory = groupReportsByTimeBuckets(reports, startDate, endDate);
    const filteredChartData = prepareChartData(countsByCategory, startDate, endDate);
    renderSharedLegend('sharedLegend');
    drawChart(filteredChartData, false);
  });
});

let statsVisible = false;

window.addEventListener('DOMContentLoaded', initialize);


function toggleStats() {
  if (statsVisible)
    closeStats();
  else
    openStats();
  return;
}

function openStats() {

  document.getElementById("right-pane").classList.add("show");
  document.getElementById('toggle').style.transform = "scaleX(-1)";
  statsVisible = true;
document.getElementsByClassName("closebtn")[0].style.cursor = 'pointer';


  map.panBy([350, 0], { animate: true, duration: 0.5 });

  setTimeout(() => {
    renderSharedLegend('sharedLegend');
    const percentages = calculatePercentages(reports);
    drawPieChart(percentages);

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const countsByCategory = groupReportsByTimeBuckets(reports, startDate, endDate);
    const chartData = prepareChartData(countsByCategory, startDate, endDate);
    drawChart(chartData, true);
    const resolutionPercent = calculateResolutionRate(reports);
    drawResolvedBarChart(resolutionPercent);

    document.getElementById("reports-title").style.display = "block";
        document.getElementById("sharedLegend").style.display = "flex";
        document.getElementsByClassName("closebtn").disabled = false;

  }, 400);
  
      dragHandle.style.pointerEvents = 'auto';
    dragHandle.style.cursor = 'ew-resize';
}

function closeStats() {
  if (!statsVisible)
      return;
document.getElementsByClassName("closebtn")[0].style.cursor = 'default';
  document.getElementById("right-pane").classList.remove("show");
  document.getElementById('toggle').style.transform = "scaleX(1)";
  statsVisible = false;
  rightPane.style.width = '';
  map.panBy([-350, 0], { animate: true, duration: 0.5 });

  myChart.destroy();
  myChart = null;

  window.myPieChart.destroy();
  window.myPieChart = null;

  window.myResolvedChart.destroy();
  window.myResolvedChart = null;
  document.getElementById("reports-title").style.display = "none";
    document.getElementById("sharedLegend").style.display = "none";

      dragHandle.style.pointerEvents = 'none';
    dragHandle.style.cursor = 'default';
}

const rightPane = document.getElementById('right-pane');
const dragHandle = document.getElementById('drag-handle');

let isDragging = false;
let startX = 0;
let startWidth = 0;

const screenWidth = screen.width;
const MIN_WIDTH = 0.195 * screenWidth;
const MAX_WIDTH = 0.34 * screenWidth;

dragHandle.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startWidth = rightPane.offsetWidth;

  document.body.style.userSelect = 'none';
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const dx = startX - e.clientX;
  let newWidth = startWidth + dx;
  if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
  if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

  rightPane.style.width = `${newWidth}px`;
renderSharedLegend('sharedLegend');
  setTimeout(() => {
    const buttons = document.querySelectorAll('button');

    buttons.forEach(btn => {
      if (rightPane.offsetWidth > (0.28 * screenWidth)) {
        btn.style.paddingLeft = "2.5vh";
        btn.style.marginLeft = ".5vh";
        btn.style.marginRight = ".5vh";
      } else {
        btn.style.paddingLeft = "4vh";
        btn.style.marginLeft = "1.5vh";
        btn.style.marginRight = "1.5vh";
      }
    });
  }, 200);
});

//////////////////////// SOS: AS TO KANEI KAPOIOS COOL

dragHandle.addEventListener('mouseenter', () => {
  dragHandle.style.width = '.5vw';
});

dragHandle.addEventListener('mouseleave', () => {
  dragHandle.style.width = '.2vw';
});


// SAVE & LOAD TA FILTERS + DATES που θελει ο user (μπορουμε να το βαλουμε σαν κουμπι με ενα floppy disk icon για να ειναι δίπλα στο date πχ)
// +++++++++ Exoume θεμα με το οτι το να κανεις remove filters ΔΕΝ επιρεάζει πόσα issues ειναι loaded αλλά μονο τα ποσα markers ειναι visible (νμζω δλδ)

function persistFilters() {
  console.log("Saving filters...");
  const start = document.getElementById('startDate').value;
  const end = document.getElementById('endDate').value;
  localStorage.setItem('savedStartDate', start);
  localStorage.setItem('savedEndDate', end);

  const remember = document.getElementById('rememberFilters').checked;
  localStorage.setItem('rememberFilters', remember);

  if (remember) {
    document.querySelectorAll('#dropdownMenu input[type="checkbox"]').forEach(cb => {
      if (cb.id !== 'rememberFilters') {
        localStorage.setItem(cb.value, cb.checked);
      }
    });
  } else {
    document.querySelectorAll('#dropdownMenu input[type="checkbox"]').forEach(cb => {
      if (cb.id !== 'rememberFilters') {
        localStorage.removeItem(cb.value);
      }
    });
  }
}

function loadSavedFilters() {
  const remember = localStorage.getItem('rememberFilters') === 'true';
  document.getElementById('rememberFilters').checked = remember;

  const startDate = localStorage.getItem('savedStartDate');
  const endDate = localStorage.getItem('savedEndDate');
  if (startDate) document.getElementById('startDate').value = startDate;
  if (endDate) document.getElementById('endDate').value = endDate;

  if (remember) {
    document.querySelectorAll('#dropdownMenu input[type="checkbox"]').forEach(cb => {
      if (cb.id !== 'rememberFilters') {
        const saved = localStorage.getItem(cb.value);
        if (saved !== null) cb.checked = saved === 'true';
      }
    });
  }
}
//κανει το actual saving 
window.addEventListener('DOMContentLoaded', () => {
  loadSavedFilters();
  initialize();

  ['startDate', 'endDate', 'rememberFilters'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', persistFilters);
  });

  document.querySelectorAll('#dropdownMenu input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      persistFilters();
      filterMarkersByDropdown();

      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;

      const countsByCategory = groupReportsByTimeBuckets(reports, startDate, endDate);
      const filteredChartData = prepareChartData(countsByCategory, startDate, endDate);
      renderSharedLegend('sharedLegend');
      drawChart(filteredChartData, false);

      const percentages = calculatePercentages(reports);
      drawPieChart(percentages);

      const resolutionPercent = calculateResolutionRate(reports);
      drawResolvedBarChart(resolutionPercent);
    });
  });
});