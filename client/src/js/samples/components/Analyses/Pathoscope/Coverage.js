import React from "react";
import PropTypes from "prop-types";
import { map, sortBy, slice, reduce, forEach, range } from "lodash-es";
import { select } from "d3-selection";
import { area } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { createBlob, formatSvg, getSvgAttr, getPng } from "./Download";

const fillEntries = (alignArray) => {
    const filledEntries = [];

    forEach(alignArray, (entry, i) => {
        if (i === alignArray.length - 1) {
            return filledEntries.push({ key: (alignArray[i][0] - 1), val: entry[1] });
        } else if (i !== 0) {
            const numBasesFromLastEntry = (alignArray[i][0] - alignArray[i - 1][0]);

            forEach(range(numBasesFromLastEntry), (item, j) => {
                filledEntries.push({ key: (alignArray[i - 1][0] + j), val: alignArray[i - 1][1] });
            });
        }
    });

    return filledEntries;
};

const getQuartileValue = (values, quartile) => {
    const index = (values.length * quartile) / 4;

    if (index % 1 === 0) {
        return values[index].val;
    }

    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    return (values[lowerIndex].val + values[upperIndex].val) / 2;
};

const removeOutlierByIQR = (values) => {

    const q1 = getQuartileValue(values, 1);
    const q3 = getQuartileValue(values, 3);
    const total = reduce(values, (sum, entry) => sum + entry.val, 0);
    const mean = total / values.length;

    const IQR = (q3 - q1);
    const outlierDifference = 1.5 * IQR;

    // Largest value not an outlier
    if ((values[values.length - 1].val - mean) <= outlierDifference) {
        return values;
    }

    return removeOutlierByIQR(slice(values, 0, values.length - 1));
};

const createChart = (element, data, length, meta, yMax, xMin, showYAxis, isCrop = false) => {

    let svg = select(element).append("svg");

    const margin = {
        top: 10,
        left: 15 + (showYAxis ? 30 : 0),
        bottom: 50,
        right: 10
    };

    svg.append("text").text(yMax.toString())
        .remove();

    svg.remove();

    const height = 200 - margin.top - margin.bottom;

    let width = length > 800 ? length / 5 : length;

    if (width < xMin) {
        width = xMin;
    }

    width -= (margin.left + margin.right);

    const x = scaleLinear()
        .range([0, width])
        .domain([0, length]);

    const y = scaleLinear()
        .range([height, 0])
        .domain([0, yMax]);

    const xAxis = axisBottom(x);

    // Construct the SVG canvas.
    svg = select(element).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    if (data) {
        // Extend original data so there is a coordinate data point for each base along x-axis
        const filledData = fillEntries(data);

        const sortedY = sortBy(filledData, ["val"]);

        const trimDataY = removeOutlierByIQR(sortedY);

        const reorderTrimY = sortBy(trimDataY, ["key"]);

        const dataCrop = map(reorderTrimY, (entry) => [entry.key, entry.val]);

        const useData = isCrop ? dataCrop : data;

        const areaDrawer = area()
            .x(d => x(d[0]))
            .y0(d => y(d[1]))
            .y1(height);

        svg.append("path")
            .datum(useData)
            .attr("class", "depth-area")
            .attr("d", areaDrawer);
    }

    // Set-up a y-axis that will appear at the top of the chart.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-65)");

    if (showYAxis) {
        svg.append("g")
            .attr("class", "y axis")
            .call(axisLeft(y));
    }

    svg.append("text")
        .attr("class", "coverage-label small")
        .attr("transform", "translate(4,10)")
        .text(`${meta.id} - ${meta.definition}`);

    svg.append("text")
        .attr("class", "download-overlay")
        .attr("transform", `translate(${(width - margin.left - margin.right) / 3}, ${height / 2})`)
        .text("Click to download");
};

export default class CoverageChart extends React.Component {

    static propTypes = {
        id: PropTypes.string,
        definition: PropTypes.string,
        yMax: PropTypes.number,
        data: PropTypes.array,
        length: PropTypes.number,
        title: PropTypes.string,
        showYAxis: PropTypes.bool,
        isCrop: PropTypes.bool
    };

    componentDidMount () {
        window.addEventListener("resize", this.renderChart);
        this.renderChart({}, this.props.isCrop);
    }

    shouldComponentUpdate (nextProps) {
        if (nextProps.isCrop !== this.props.isCrop) {
            this.renderChart({}, nextProps.isCrop);
        }
        return false;
    }

    componentWillUnmount () {
        window.removeEventListener("resize", this.renderChart);
    }

    renderChart = (e, isCrop = false) => {

        while (this.chartNode.firstChild) {
            this.chartNode.removeChild(this.chartNode.firstChild);
        }

        const { id, definition } = this.props;

        createChart(
            this.chartNode,
            this.props.data,
            this.props.length,
            { id, definition },
            this.props.yMax,
            this.chartNode.offsetWidth,
            this.props.showYAxis,
            isCrop
        );
    };

    handleClick = () => {
        const svg = select(this.chartNode).select("svg");

        formatSvg(svg, "hidden");

        const url = createBlob(svg.node());
        const { width, height, filename } = getSvgAttr(svg);

        getPng({ width, height, url, filename });

        formatSvg(svg, "visible");
    }

    render () {

        return (
            <div
                className="coverage-chart"
                ref={(node) => this.chartNode = node}
                onClick={this.handleClick}
            />
        );
    }
}
