import * as d3 from 'd3';

export function brushDown(cleanString: any, event: any, d: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any) {
    let other_triangle = d3.select("#triangle_down_" + cleanString).attr("y");
    let new_y;
    if (event.y < 70) {
        new_y = 70;
    }
    else if (event.y > other_triangle) {
        new_y = other_triangle;
    }
    else {
        new_y = event.y;
    }

    d3.select("#triangle_up_" + cleanString).attr("y", new_y);

    let rect_y;
    if (event.y + 10 < 80) {
        rect_y = 80;
    }
    else if (event.y + 10 > 320) {
        rect_y = 320;
    }
    else {
        rect_y = event.y + 10;
    }

    let height_top = rect_y - 80;
    let height_bottom = 320 - other_triangle;
    d3.select("#rect_" + cleanString)
        .attr("y", rect_y)
        .attr("height", 240 - height_top - height_bottom);

    let range_a = d3.select("#triangle_up_" + cleanString).attr("y");
    let range_b = d3.select("#triangle_down_" + cleanString).attr("y");

    let dim = d.name;
    let max = parcoords.yScales[dim].domain()[1];
    let min = parcoords.yScales[dim].domain()[0];

    active.each(function (d) {
        let value;
        const keys = Object.keys(d);
        const key = keys[0];
        const data = d[key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
        if (isNaN(max)) {
            value = parcoords.yScales[dim](d[dim]);
        }
        else {
            value = 240 / max * (max - d[dim]) + 80;
        }
        if (value < range_a || value > range_b) {
            d3.select("." + data).style("pointer-events", "none")
                .style("fill", "none")
                .style("stroke", "lightgrey")
                .style("stroke-opacity", "0.4");
        }
        else {
            d3.select("." + data).style("opacity", "0.7")
                .style("pointer-events", "stroke")
                .style("stroke", "rgb(0, 129, 175)")
                .style("stroke-width", "0.1rem")
                .style("fill", "none");
        }
    })
}

export function brushUp(cleanString: any, event: any, d: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any) {
    let other_triangle = d3.select("#triangle_up_" + cleanString).attr("y");
    let new_y;
    if (event.y < other_triangle) {
        new_y = other_triangle;
    }
    else if (event.y > 318) {
        new_y = 318;
    }
    else {
        new_y = event.y;
    }

    d3.select("#triangle_down_" + cleanString)
        .attr("y", new_y);

    let height_bottom = 317 - new_y;
    let height_top = other_triangle - 70;
    d3.select("#rect_" + cleanString)
        .attr("height", 240 - height_top - height_bottom);

    let range_a = d3.select("#triangle_up_" + cleanString).attr("y");
    let range_b = d3.select("#triangle_down_" + cleanString).attr("y");

    let dim = d.name;
    let max = parcoords.yScales[dim].domain()[1];

    active.each(function (d) {
        let value;
        const keys = Object.keys(d);
        const key = keys[0];
        const data = d[key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
        if (isNaN(max)) {
            value = parcoords.yScales[dim](d[dim]);
        }
        else {
            value = 240 / max * (max - d[dim]) + 80;
        }
        if (value < range_a || value > range_b) {
            d3.select("." + data).style("pointer-events", "none")
                .style("fill", "none")
                .style("stroke", "lightgrey")
                .style("stroke-opacity", "0.4");
        }
        else {
            d3.select("." + data).style("opacity", "0.7")
                .style("pointer-events", "stroke")
                .style("stroke", "rgb(0, 129, 175)")
                .style("stroke-width", "0.1rem")
                .style("fill", "none");
        }
    });
}

export function dragAndBrush(d: any, svg: any, event: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any) {
    let cleanString = d.name.replace(/ /g, "_");
    cleanString = cleanString.replace(/[.,*\-0123456789%&'\[{()}\]]/g, '');
    var rect_height = svg.select("#rect_" + cleanString).node().getBoundingClientRect().height;
    let y_top;
    if (event.y < 80) {
        y_top = 80;
    }
    else if (event.y + rect_height > 320) {
        y_top = 320 - rect_height;
    }
    else {
        y_top = event.y;
    }

    let y_bottom;
    if (event.y + rect_height - 3 > 318) {
        y_bottom = 318;
    }
    else {
        y_bottom = y_top + rect_height - 3;
    }

    if (rect_height < 240) {
        d3.select("#rect_" + cleanString)
            .attr("y", y_top);
        d3.select("#triangle_up_" + cleanString)
            .attr("y", y_top - 10);
        d3.select("#triangle_down_" + cleanString)
            .attr("y", y_bottom);

        let dim = d.name;
        let max = parcoords.yScales[dim].domain()[1];

        active.each(function (d) {
            let value;
            const keys = Object.keys(d);
            const key = keys[0];
            const data = d[key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
            if (isNaN(max)) {
                value = parcoords.yScales[dim](d[dim]);
            }
            else {
                value = 240 / max * (max - d[dim]) + 80;
            }
            if (value < event.y || value > event.y + rect_height) {
                d3.select("." + data).style("pointer-events", "none")
                    .style("fill", "none")
                    .style("stroke", "lightgrey")
                    .style("stroke-opacity", "0.4");
            }
            else {
                d3.select("." + data).style("opacity", "0.7")
                    .style("pointer-events", "stroke")
                    .style("stroke", "rgb(0, 129, 175)")
                    .style("stroke-width", "0.1rem")
                    .style("fill", "none");
            }
        });
    }
}