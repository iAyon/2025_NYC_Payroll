// Load your CSV data from GitHub
d3.csv(
  "https://raw.githubusercontent.com/iAyon/2025_NYC_Payroll/main/Data/d3_data.csv"
)
  .then((data) => {
    // Extract unique years and populate the dropdown
    const years = Array.from(new Set(data.map((d) => d["Fiscal.Year"])));

    // Sort the years in ascending order
    years.sort((a, b) => a - b);

    // Set dimensions and create SVG
    const width = 450,
      height = 450,
      margin = 40;
    const radius = Math.min(width, height) / 2 - margin;
    const svg = d3
      .select("#piechart")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Create color scale
    const color = d3.scaleOrdinal().domain(years).range(d3.schemeSet3);

    // Pie and arc generator functions
    const pie = d3.pie().value((d) => d.totalSalary);
    const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

    // Tooltip setup
    const tooltip = d3
      .select("#piechart")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip");

    // Function to update the pie chart
    function updatePieChart(year) {
      // Filter data for the selected year
      const filteredData = data.filter((d) => d["Fiscal.Year"] == year);

      // Aggregate salary data by borough for the selected year
      const salaryByBorough = d3.rollup(
        filteredData,
        (v) => d3.mean(v, (d) => parseFloat(d["Daily.Salary"])),
        (d) => d["Work.Location.Borough"]
      );
      const dataArray = Array.from(
        salaryByBorough,
        ([borough, totalSalary]) => ({ borough, totalSalary })
      );

      // Calculate the total salary for all boroughs
      const totalSalaryAllBoroughs = d3.sum(dataArray, (d) => d.totalSalary);

      // Compute the position of each group on the pie
      const data_ready = pie(dataArray);

      // Join new data to paths
      const paths = svg.selectAll("path").data(data_ready);

      // Handle the update pattern for paths
      paths
        .enter()
        .append("path")
        .merge(paths)
        .transition()
        .duration(750)
        .attrTween("d", function (d) {
          const interpolate = d3.interpolate(this._current, d);
          this._current = interpolate(0);
          return (t) => arcGenerator(interpolate(t));
        })
        .attr("fill", (d) => color(d.data.borough));

      paths.exit().remove();

      // Join new data to text elements for percentages
      const texts = svg.selectAll("text").data(data_ready);

      // Handle the update pattern for texts
      texts
        .enter()
        .append("text")
        .merge(texts)
        .text(
          (d) =>
            `${((d.data.totalSalary / totalSalaryAllBoroughs) * 100).toFixed(
              1
            )}%`
        )
        .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("font-size", 14);

      texts.exit().remove();

      // Update tooltip behavior
      paths
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              `Borough: ${
                d.data.borough
              }<br>Average Daily Salary: ${d.data.totalSalary.toFixed(2)}`
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });
    }

    // Initial pie chart display
    updatePieChart("2014"); // or the earliest year in your dataset

    // Create the year slider input element
    const yearSlider = document.createElement("input");
    yearSlider.type = "range";
    yearSlider.id = "year-slider";
    yearSlider.min = "2014";
    yearSlider.max = "2025";
    yearSlider.value = "2014";
    yearSlider.step = "1";

    const yearValue = document.createElement("span");
    yearValue.id = "year-value";
    yearValue.textContent = "2014";

    const label = document.createElement("label");
    label.htmlFor = "year-slider";
    label.textContent = "Select Year:  ";


    // Append the slider and its label to the "piechart" div
    const piechartDiv = document.getElementById("piechart");
    piechartDiv.insertBefore(yearValue, piechartDiv.firstChild);
    piechartDiv.insertBefore(yearSlider, piechartDiv.firstChild); // Slider first
    piechartDiv.insertBefore(label, piechartDiv.firstChild); // Label second


    // Handle slider input
    d3.select("#year-slider").on("input", function () {
      const selectedYear = this.value;
      d3.select("#year-value").text(selectedYear);
      updatePieChart(selectedYear);
    });
  })
  .catch((error) => {
    console.error("Error loading the CSV file:", error);
  });
