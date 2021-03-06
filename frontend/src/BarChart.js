import React, { Component } from 'react'
import {Chart, CategoryScale, LinearScale, BarController, BarElement} from 'chart.js';
import { fontString } from 'chart.js/helpers'
import Typography from "@material-ui/core/Typography";
let myBarChart;
Chart.register(CategoryScale, LinearScale, BarController, BarElement)

export default class BarChart extends Component {
    /**
     * React class component for the bar chart showing climate impact of each individual food item, ranked in descending order.
     *
     * @param   {array<float>}   data                Carbon emissions for individual food items, measured by pound
     * @param   {array<String>}  labels              Names of each individual food items
     * @param   {function}       selectFood          Callback function for selecting a food item to show recommendations, of signature (int) => ()
     */
    chartRef = React.createRef();

    componentDidMount() {
        /**
         * React lifecycle method. Builds the bar chart.
         */
        this.buildChart();
    }

    componentDidUpdate(prevProps) {
        /**
         * React lifecycle method. Updates the bar chart.
         *
         * @param   {Object}  prevProps  Props from last time componentDidMount or componentDidUpdate was called
         */
        // Only updates chart if necessary at rendering.
        if ((this.props.data !== prevProps.data) || (this.props.labels !== prevProps.labels)) {
            this.buildChart();
        }
    }

    handleClick = event => {
        /**
         * Determines which bar user clicked on
         * and call the function passed in via props to show the appropriate recommendations for that food.
         *
         * @param   {click}  event  User's click event
         */
        const points = myBarChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
        if (points[0]) {
            this.props.selectFood(points[0].index);
        }
    }

    buildChart = () => {
        /**
         * Builds the bar chart
         */
        const myChartRef = this.chartRef.current.getContext("2d");
        let type = "bar";

        // Make sure we only have one chart on display
        if (typeof myBarChart !== "undefined") myBarChart.destroy();

        // Set global styling configs for the chart
        Chart.defaults.font.size = 16;
        Chart.defaults.color = '#ffdbec';
        Chart.defaults.borderColor = 'transparent';

        // Create the chart
        myBarChart = new Chart(myChartRef, {
            type: type,
            data: {
                // Bring in data and labels
                labels: this.props.labels,
                datasets: [
                    {
                        data: this.props.data,
                        backgroundColor: '#ffdbec',
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                // Show the value for each bar while rendering the chart
                animation: {
                    onProgress: (props) => drawValueLabel(myChartRef, props),
                    onComplete: (props) => drawValueLabel(myChartRef, props)
                },
                // Further customize styling configs for the chart
                scales: {
                    x: {
                        display: false,
                        max: Math.max(...this.props.data) * 1.2
                    },
                    y: {
                        ticks: {
                            textStrokeColor: '#ffdbec'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                },
                onClick: this.handleClick
            }
        });
    }

    render() {
        /**
         * React lifecycle method
         *
         * @return   {HTMLDivElement}  HTML element for the BarChart component
         */
        return (
            <div className="chartContainer" style={{width: '80%', margin: 'auto'}}>
                <Typography variant='h5' align='left'>Rank my food's carbon footprint (unit: pound)</Typography>
                <canvas
                    id="myChart"
                    ref={this.chartRef}
                    style={{maxHeight: 300}}
                />
            </div>
        )
    }
}

function drawValueLabel(chartRef, props) {
    /**
     * Draws the value for each bar as a label directly next to it in the canvas.
     * This is achieved by directly accessing the canvas' rendering context, rather than through the Chart.js package API.
     * The Chart.js bar chart object calls this function as an animation during rendering.
     *
     * @param   {CanvasRenderingContext2D}  chartRef     Canvas' rendering context where the bar chart is drawn
     * @param   {Object}                    props        Key-value pairs input to this callback function from Chart's animation
     * @param   {Chart}                     props.chart  The bar chart from Chart.js
     */
    chartRef.font = fontString(
        Chart.defaults.font.size,
        Chart.defaults.font.style,
        Chart.defaults.font.family);
    chartRef.fillStyle = Chart.defaults.color;
    chartRef.textAlign = 'left';
    chartRef.textBaseline = 'middle';

    let chartInstance = props.chart;
    let meta = chartInstance.getDatasetMeta(0);
    // Write the value for each bar into a label
    meta.data.forEach((bar, index) => {
        let value = chartInstance.data.datasets[0].data[index].toFixed(1);
        chartRef.fillText(value, bar.x+5, bar.y);
    });
}