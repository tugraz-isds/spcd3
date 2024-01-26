import * as d3 from 'd3';
import * as base64 from './base64Arrows'

export function brushDown(cleanString: any, event: any, d: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any, currentPosOfDims: any) {
    
    let other_triangle = d3.select("#triangle_down_" + cleanString).attr("y");
    
    let new_y;
    let rect_y;
    
    if (event.y < 70) {
        new_y = 70;
        rect_y = 80;
    }
    else if (event.y > other_triangle) {
        new_y = other_triangle;
        rect_y = 320;
    }
    else {
        new_y = event.y;
        rect_y = event.y + 10;
    }

    addPosition(new_y, currentPosOfDims, d, "top");
    d3.select("#rect_" + cleanString).attr('cursor', `url('data:image/svg+xml;base64,${base64.getArrowTopAndBottomBase64()}') 8 8 , auto`)
    d3.select("#triangle_up_" + cleanString).attr("y", new_y);

    let height_top = rect_y - 80;
    let height_bottom = 320 - other_triangle;
    d3.select("#rect_" + cleanString)
        .attr("y", rect_y)
        .attr("height", 240 - height_top - height_bottom);

    let range_a = d3.select("#triangle_up_" + cleanString).attr("y");
    let range_b = d3.select("#triangle_down_" + cleanString).attr("y");

    let dim = d.name;
    let max = parcoords.yScales[dim].domain()[1];
    updateLines(active, max, parcoords, dim, range_a, range_b, currentPosOfDims);
}

export function brushUp(cleanString: any, event: any, d: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any, currentPosOfDims: any) {
    let other_triangle = d3.select("#triangle_up_" + cleanString).attr("y");
    let new_y;
    if (event.y < other_triangle) {
        new_y = other_triangle;
    }
    else if (event.y > 322) {
        new_y = 322;
    }
    else {
        new_y = event.y;
    }

    addPosition(new_y, currentPosOfDims, d, "bottom");
    d3.select("#rect_" + cleanString).attr('cursor', `url('data:image/svg+xml;base64,${base64.getArrowTopAndBottomBase64()}') 8 8 , auto`)
    d3.select("#triangle_down_" + cleanString).attr("y", new_y);

    let height_bottom = 320 - new_y;
    let height_top = other_triangle - 70;
    d3.select("#rect_" + cleanString)
        .attr("height", 240 - height_top - height_bottom);

    let range_a = d3.select("#triangle_up_" + cleanString).attr("y");
    let range_b = d3.select("#triangle_down_" + cleanString).attr("y");

    let dim = d.name;
    let max = parcoords.yScales[dim].domain()[1];
    updateLines(active, max, parcoords, dim, range_a, range_b, currentPosOfDims);
}

export function dragAndBrush(cleanString: any, d: any, svg: any, event: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any, deltaY: any, currentPosOfDims: any) {
    var rect_height = svg.select("#rect_" + cleanString).node().getBoundingClientRect().height;

    let y_top;
    let y_rect;
    if (event.y + deltaY - 10 <= 70) {
        y_top = 70;
        y_rect = 80;
    }
    else if (event.y + deltaY + rect_height >= 320) {
        y_top = 320 - rect_height - 10;
        y_rect = 320 - rect_height;
    }
    else {
        y_top = event.y + deltaY - 10;
        y_rect = y_top + 10;
    }

    addPosition(y_rect + rect_height, currentPosOfDims, d, "bottom");
    addPosition(y_top, currentPosOfDims, d, "top");

    if (rect_height < 240) {
        d3.select("#rect_" + cleanString)
            .attr("y", y_rect);
        d3.select("#triangle_up_" + cleanString)
            .attr("y", y_top);
        d3.select("#triangle_down_" + cleanString)
            .attr("y", y_rect + rect_height);

        let dim = d.name;
        let max = parcoords.yScales[dim].domain()[1];

        active.each(function (d) {
            const data = getLineName(d);
            let value;
            if (isNaN(max)) {
                value = parcoords.yScales[dim](d[dim]);
            }
            else {
                value = 240 / max * (max - d[dim]) + 80;
            }

            let check = d3.select("." + data).text();
            
            if (value < y_top || value > y_top + rect_height) {
                makeInactive(data, dim);
            }
            else if (check == dim && check != "") {
                let check_data = [];
                currentPosOfDims.forEach(function (arrayItem) {
                    checkAllDimTop(arrayItem, dim, parcoords, d, check_data, data);
                    checkAllDimBottom(arrayItem, dim, parcoords, d, check_data, data);
                    
                });
                if(!check_data.includes(data)) {
                    makeActive(data);
                }
            }
            else {
                // do nothing
            }
        });
    }
}

function getLineName(d: any) {
    const keys = Object.keys(d);
    const key = keys[0];
    const data = d[key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
    return data;
}

function addPosition(new_y: any, currentPosOfDims: any, d: any, key: any) {
    var new_obj = {};
    new_obj[key] = new_y;
    const target = currentPosOfDims.find((obj) => obj.key == d.name);
    Object.assign(target, new_obj);
}

function updateLines(active: any, max: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, dim: any, range_a: any, range_b: any, currentPosOfDims: any) {
    active.each(function (d) {
        const data = getLineName(d);
        let value;
        if (isNaN(max)) {
            value = parcoords.yScales[dim](d[dim]);
        }
        else {
            value = 240 / max * (max - d[dim]) + 80;
        }

        let check = d3.select("." + data).text();

        if (value < range_a || value > range_b) {
            if (check == "") {
                makeInactive(data, dim);
            }
        }
        else if (check == dim && check != "") {
            let check_data = [];
            currentPosOfDims.forEach(function (arrayItem) {
                checkAllDimTop(arrayItem, dim, parcoords, d, check_data, data);
                checkAllDimBottom(arrayItem, dim, parcoords, d, check_data, data);
            });
            if (!check_data.includes(data)) {
                makeActive(data);
            }
        }
        else {
            // do nothing
        }
    });
}

function checkAllDimTop(arrayItem: any, dim: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, d: any, check_data: any[], data: any) {
    if (arrayItem.key != dim && arrayItem.top != 70) {
        
        let max = parcoords.yScales[arrayItem.key].domain()[1];
        let value;
        if (isNaN(max)) {
            value = parcoords.yScales[arrayItem.key](d[arrayItem.key]);
        }
        else {
            value = 240 / max * (max - d[arrayItem.key]) + 80;
        }
        if (value < arrayItem.top) {
            check_data.push(data);
            d3.select("." + data).text(arrayItem.key);
        }
        else {
            makeActive(data);
        }
    }
}


function checkAllDimBottom(arrayItem: any, dim: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, d: any, check_data: any[], data: any) {
    if (arrayItem.key != dim && arrayItem.bottom != 320) {
        
        let max = parcoords.yScales[arrayItem.key].domain()[1];
        let value;
        if (isNaN(max)) {
            value = parcoords.yScales[arrayItem.key](d[arrayItem.key]);
        }
        else {
            value = 240 / max * (max - d[arrayItem.key]) + 80;
        }
        if (value > arrayItem.bottom) {
            check_data.push(data);
            d3.select("." + data).text(arrayItem.key);
        }
        else {
            makeActive(data);
        }
    }
}

function makeActive(data: any) {
    d3.select("." + data).style("opacity", "0.7")
        .style("pointer-events", "stroke")
        .style("stroke", "rgb(0, 129, 175)")
        .style("stroke-width", "0.1rem")
        .style("fill", "none")
        .text("");
}

function makeInactive(data: any, dim: any) {
    d3.select("." + data).style("pointer-events", "none")
        .style("fill", "none")
        .style("stroke", "lightgrey")
        .style("stroke-opacity", "0.4")
        .text(dim);
}
