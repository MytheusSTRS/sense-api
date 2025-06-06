$(document).ready(function () {
  const startDate = moment().subtract(1, 'months').format("YYYY-MM-DD");
  const endDate = moment().format("YYYY-MM-DD");
  const city = "patras";

  // Κλήση για τα δεδομένα των προβλημάτων
  const issuesRequest = $.ajax({
    url: `https://api.sense.city/api/1.0/issue`,
    method: "GET",
    data: {
      startdate: startDate,
      enddate: endDate,
      city: city,
      limit: 200,  // Μειωμένο το limit για λιγότερα δεδομένα
      sort: 1
    }
  });

  // Κλήση για τα δεδομένα των αισθημάτων
  const feelingsRequest = $.ajax({
    url: `https://api.sense.city/api/1.0/feelings?startdate=${startDate}&enddate=${endDate}&city=${city}&distance=2000&limit=200&sort=1`,
    method: 'GET'
  });

  // Εκτέλεση των δύο κλήσεων ταυτόχρονα
  Promise.all([issuesRequest, feelingsRequest]).then(function ([issueData, feelData]) {
    // Διαχείριση των δεδομένων για τα προβλήματα
    const counts = {
      garbage: 0,
      lighting: 0,
      environment: 0,
      green: 0,
      plumbing: 0,
      "road-constructor": 0,
      "protection-policy": 0
    };

    JSON.parse(issueData).forEach(item => {
      const issue = item.issue;
      if (issue in counts) {
        counts[issue]++;
      } else {
        counts[issue] = 1;
      }
    });

    // Δημιουργία γραφήματος για τα προβλήματα
    const labelMap = {
      garbage: "Σκουπίδια",
      lighting: "Φωτισμός",
      environment: "Περιβάλλον",
      green: "Πράσινο",
      plumbing: 'Υδραυλικά',
      "road-constructor": 'Οδικά Έργα',
      "protection-policy": 'Θέματα ασφαλείας'
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

    const Labels = ["garbage", "lighting", "green", "environment", "plumbing", "road-constructor", "protection-policy"];
    const translatedLabels = Labels.map(key => labelMap[key]);
    const values = Labels.map(key => counts[key]);
    const backgroundColors = Labels.map(key => colorMap[key]);

    const ctx = document.getElementById('issueChart').getContext('2d');
    new Chart(ctx, {
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
              font: {
                family: 'Calibri',
                size: 14,
                weight: 'bold'
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#1a4170',
              font: {
                family: 'Calibri',
                size: 14,
                weight: 'bold'
              }
            },
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

    // Διαχείριση των δεδομένων για τα αισθήματα
    const feelingCounts = {
      happy: 0,
      angry: 0,
      neutral: 0
    };

    feelData.forEach(item => {
      const feeling = item.issue;
      if (feeling in feelingCounts) {
        feelingCounts[feeling]++;
      } else {
        feelingCounts[feeling] = 1;
      }
    });

    const labels = ["happy", "neutral", "angry"];
    const data = labels.map(label => feelingCounts[label]);

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

    const translatedLabelsFeelings = labels.map(l => labelMapFeelings[l]);
    const backgroundColorsFeelings = labels.map(l => colorMapFeelings[l]);
    const ctxFeelings = document.getElementById('feelingChart').getContext('2d');
    new Chart(ctxFeelings, {
      type: 'bar',
      data: {
        labels: translatedLabelsFeelings,
        datasets: [{
          label: 'Πλήθος Αναφορών',
          data: data,
          backgroundColor: backgroundColorsFeelings
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            ticks: {
              color: '#1a4170',
              font: {
                family: 'Calibri',
                size: 14,
                weight: 'bold'
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#1a4170',
              font: {
                family: 'Calibri',
                size: 14,
                weight: 'bold'
              }
            },
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });

  }).catch(function (error) {
    alert("Αποτυχία φόρτωσης δεδομένων: " + error);
  });
});