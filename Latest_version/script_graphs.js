let issueChart, feelingChart;

async function renderCharts() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const city = "patras";

  try {
    const [issueDataRaw, feelData] = await Promise.all([
      $.ajax({
        url: `https://api.sense.city/api/1.0/issue`,
        method: "GET",
        data: {
          startdate: startDate,
          enddate: endDate,
          city,
          limit: 200,
          sort: 1
        }
      }),
      $.ajax({
        url: `https://api.sense.city/api/1.0/feelings`,
        method: "GET",
        data: {
          startdate: startDate,
          enddate: endDate,
          city,
          limit: 200,
          sort: 1
        }
      })
    ]);

    const issueData = typeof issueDataRaw === 'string' ? JSON.parse(issueDataRaw) : issueDataRaw;

    const counts = {
      garbage: 0,
      lighting: 0,
      environment: 0,
      green: 0,
      plumbing: 0,
      "road-constructor": 0,
      "protection-policy": 0
    };

    issueData.forEach(item => {
      if (item.issue in counts) counts[item.issue]++;
    });

    const Labels = [
      "garbage",
      "lighting",
      "green",
      "environment",
      "plumbing",
      "road-constructor",
      "protection-policy"
    ];

    const labelMap = {
      garbage: "Σκουπίδια",
      lighting: "Φωτισμός",
      green: "Πράσινο",
      environment: "Περιβάλλον",
      plumbing: "Υδραυλικά",
      "road-constructor": "Οδικά Έργα",
      "protection-policy": "Ασφάλεια"
    };

    const colorMap = {
      garbage: "#8080FF",
      lighting: "#ffff00",
      environment: "#21B6A8",
      green: "#A3EBB1",
      plumbing: '#4caf50',
      "road-constructor": '#B95CF4',
      "protection-policy": '#FFC0CB'
    };

    const translatedLabels = Labels.map(key => labelMap[key]);
    const values = Labels.map(key => counts[key]);
    const backgroundColors = Labels.map(key => colorMap[key]);

    const ctx1 = document.getElementById('issueChart').getContext('2d');

    if (issueChart) {
      issueChart.data.labels = translatedLabels;
      issueChart.data.datasets[0].data = values;
      issueChart.data.datasets[0].backgroundColor = backgroundColors;
      issueChart.update();
    } else {
      issueChart = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: translatedLabels,
          datasets: [{
            label: 'Πλήθος Αναφορών',
            data: values,
            backgroundColor: backgroundColors
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: {
                color: '#1a4170',
                font: { family: 'Calibri', size: 14, weight: 'bold' }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1a4170',
                font: { family: 'Calibri', size: 14, weight: 'bold' }
              }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    const feelingCounts = { happy: 0, neutral: 0, angry: 0 };

    feelData.forEach(item => {
      const feeling = item.issue;
      if (feeling in feelingCounts) feelingCounts[feeling]++;
    });

    const feelingLabels = ["happy", "neutral", "angry"];
    const labelMapFeelings = {
      happy: "Χαρούμενος",
      neutral: "Ουδέτερος",
      angry: "Θυμωμένος"
    };
    const colorMapFeelings = {
      happy: '#FF7F50',
      neutral: '#afc8d9',
      angry: '#f44336'
    };

    const translatedLabelsFeelings = feelingLabels.map(l => labelMapFeelings[l]);
    const dataFeelings = feelingLabels.map(l => feelingCounts[l]);
    const backgroundColorsFeelings = feelingLabels.map(l => colorMapFeelings[l]);

    const ctx2 = document.getElementById('feelingChart').getContext('2d');

    if (feelingChart) {
      feelingChart.data.labels = translatedLabelsFeelings;
      feelingChart.data.datasets[0].data = dataFeelings;
      feelingChart.data.datasets[0].backgroundColor = backgroundColorsFeelings;
      feelingChart.update();
    } else {
      feelingChart = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: translatedLabelsFeelings,
          datasets: [{
            label: 'Πλήθος Αναφορών',
            data: dataFeelings,
            backgroundColor: backgroundColorsFeelings
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: {
                color: '#1a4170',
                font: { family: 'Calibri', size: 14, weight: 'bold' }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#1a4170',
                font: { family: 'Calibri', size: 14, weight: 'bold' }
              }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

  } catch (error) {
    alert("Παρουσιάστηκε κάποιο Πρόβλημα.");
  }
}

$(document).ready(() => {
  const today = new Date();
  const priorMonth = new Date();
  priorMonth.setDate(today.getDate() - 7);

  const formatDate = (date) => date.toISOString().split('T')[0];

  $('#startDate').val(formatDate(priorMonth));
  $('#endDate').val(formatDate(today));

  renderCharts();










});
