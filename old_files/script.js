$(document).ready(function () {
      const startDate = moment().subtract(1, 'months').format("YYYY-MM-DD");
      const endDate = moment().format("YYYY-MM-DD");
      const city = "patras";


        $.ajax({
        url: `https://api.sense.city/api/1.0/issue`,
        method: "GET",
        data: {
            startdate: startDate,
            enddate: endDate,
            city: city,
            limit: 1000,
            sort: 1
        },
        success: function (issueData) {
            const counts = {
            garbage: 0,
            lighting: 0,
            environment: 0,
            green: 0,
            plumbing: 0,
            "road-constructor": 0,
            "protection-policy": 0
            };

            (JSON.parse(issueData)).forEach(item => {
            console.log(item);
            const issue = (item.issue);
            if (issue in counts) {
                counts[issue]++;
            }
            else{
              counts[issue]=0;
            }
            });

            const labelMap = {
            garbage: "Σκουπίδια",
            lighting: "Φωτισμός",
            environment: "Περιβάλλον",
            green: "Πράσινο",
            plumbing: "Υδραυλικά",
            "road-constructor": "Οδικά Έργα",
            "protection-policy": "Θέματα ασφαλείας"
            };

            const colorMap = {
            garbage: "#8080FF",
            lighting: "#ffff00",
            environment: "#21B6A8",
            green: "#A3EBB1",
            plumbing:'#4caf50',
            "road-constructor": '#B95CF4',
            "protection-policy": '#FFC0CB'
            };

            const Labels = ["garbage", "lighting", "green", "environment","plumbing","road-constructor","protection-policy"];
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
                },

                }
            }
            });
        },
        error: function () {
            alert("Σφάλμα κατά την ανάκτηση των προβλημάτων.");
        }
        });
       
        const feel_url = `https://api.sense.city/api/1.0/feelings?startdate=${startDate}&enddate=${endDate}&city=${city}&distance=2000&limit=1000&sort=1`;

        
        $.ajax({
        url: feel_url,
        method: 'GET',
        success: function (feelData) {
            const counts = {
            happy: 0,
            angry: 0
            };

            feelData.forEach(item => {
            const feeling = item.issue;
            if (feeling in counts) {
                counts[feeling]++;
            }
            });

            const labels = ["happy","neutral","angry"];
            const data = labels.map(label => counts[label]);

            const labelMap = {
            happy: "Χαρούμενος",
            neutral: "Ουδέτερος",
            angry: "Θυμωμένος"
            };

            const colorMap = {
            happy: '#FF7F50',
            neutral: '#afc8d9',
            angry: '#f44336'
            };

            const translatedLabels = labels.map(l => labelMap[l]);
            const backgroundColors = labels.map(l => colorMap[l]);
            const ctx = document.getElementById('feelingChart').getContext('2d');
            new Chart(ctx, {
            type: 'bar',
            data: {
                labels: translatedLabels,
                datasets: [{
                label: 'Πλήθος Αναφορών',
                data: data,
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
                },

                }
            }
            });
        },
        error: function () {
            alert("Αποτυχία φόρτωσης δεδομένων.");
        }
     });
    });