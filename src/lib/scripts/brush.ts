import * as d3 from 'd3';
import * as base64 from './base64Arrows'

export function brushDown(cleanString: any, event: any, d: any, parcoords: { xScales: any; yScales: {}; dragging: {}; newFeatures: any; features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, active: any, currentPosOfDims: any) {
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

    d3.select("#rect_" + cleanString).attr('cursor', `url('data:image/svg+xml;base64,${base64.getArrowTopAndBottomBase64()}') 8 8 , auto`)

    d3.select("#triangle_up_" + cleanString).attr("y", new_y);


    var key = "top";
    var new_obj = {};
    new_obj[key] = new_y;
    const target = currentPosOfDims.find((obj) => obj.key == d.name);
    Object.assign(target, new_obj);

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

        let check = d3.select("." + data).text();
        
        if (value < range_a || value > range_b) {
            if (check == "") {
            d3.select("." + data).style("pointer-events", "none")
                .style("fill", "none")
                .style("stroke", "lightgrey")
                .style("stroke-opacity", "0.4")
                .text(dim);
            }
        }
        else if (check == dim && check != "") {
            let check_data = [];
            currentPosOfDims.forEach(function (arrayItem) {
                let value;
                if (arrayItem.key != dim && arrayItem.top != 70) {
                    let max = parcoords.yScales[arrayItem.key].domain()[1];
                        
                    if (isNaN(max)) {
                        value = parcoords.yScales[arrayItem.key](d[arrayItem.key]);
                    }
                    else {
                        value = 240 / max * (max - d[arrayItem.key]) + 80;
                    }  
                    if(value < arrayItem.top) {
                        check_data.push(data);
                        d3.select("." + data).text(arrayItem.key);
                    }
                    else {
                        d3.select("." + data).style("opacity", "0.7")
                            .style("pointer-events", "stroke")
                            .style("stroke", "rgb(0, 129, 175)")
                            .style("stroke-width", "0.1rem")
                            .style("fill", "none")
                            .text("");
                    }
                }
                if(arrayItem.key != dim && arrayItem.bottom != 320) {
                    let max = parcoords.yScales[arrayItem.key].domain()[1];
                        
                    if (isNaN(max)) {
                        value = parcoords.yScales[arrayItem.key](d[arrayItem.key]);
                    }
                    else {
                        value = 240 / max * (max - d[arrayItem.key]) + 80;
                    }  
                    if(value > arrayItem.bottom) {
                        check_data.push(data);
                        d3.select("." + data).text(arrayItem.key);
                    }
                    else {
                        d3.select("." + data).style("opacity", "0.7")
                            .style("pointer-events", "stroke")
                            .style("stroke", "rgb(0, 129, 175)")
                            .style("stroke-width", "0.1rem")
                            .style("fill", "none")
                            .text("");
                    }
                }
                else {
                    //do nothing
                }

            });
            if(!check_data.includes(data)) {
                d3.select("." + data).style("opacity", "0.7")
                    .style("pointer-events", "stroke")
                    .style("stroke", "rgb(0, 129, 175)")
                    .style("stroke-width", "0.1rem")
                    .style("fill", "none")
                    .text("");
            }
        }
        else {
            // do nothing
        }
    });
    return currentPosOfDims;
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

    d3.select("#rect_" + cleanString).attr('cursor', `url('data:image/svg+xml;base64,${base64.getArrowTopAndBottomBase64()}') 8 8 , auto`)

    d3.select("#triangle_down_" + cleanString).attr("y", new_y);

    var key = "bottom";
    var new_obj = {};
    new_obj[key] = new_y;
    const target = currentPosOfDims.find((obj) => obj.key == d.name);
    Object.assign(target, new_obj);

    let height_bottom = 320 - new_y;
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
        let check = d3.select("." + data).text();
       
        if (value < range_a || value > range_b) {
            if (check == "") {
            d3.select("." + data).style("pointer-events", "none")
                .style("fill", "none")
                .style("stroke", "lightgrey")
                .style("stroke-opacity", "0.4")
                .text(dim);
            }
        }
        else if (check == dim && check != "") {
            let check_data = [];
            currentPosOfDims.forEach(function (arrayItem) {
                let value;
                if (arrayItem.key != dim && arrayItem.bottom != 320) {
                    let max = parcoords.yScales[arrayItem.key].domain()[1];
                        
                    if (isNaN(max)) {
                        value = parcoords.yScales[arrayItem.key](d[arrayItem.key]);
                    }
                    else {
                        value = 240 / max * (max - d[arrayItem.key]) + 80;
                    }  
                    if(value > arrayItem.bottom) {
                        check_data.push(data);
                        d3.select("." + data).text(arrayItem.key);
                    }
                    else {
                        d3.select("." + data).style("opacity", "0.7")
                            .style("pointer-events", "stroke")
                            .style("stroke", "rgb(0, 129, 175)")
                            .style("stroke-width", "0.1rem")
                            .style("fill", "none")
                            .text("");
                    }
                }
                if (arrayItem.key != dim && arrayItem.top != 70) {
                    let max = parcoords.yScales[arrayItem.key].domain()[1];
                        
                    if (isNaN(max)) {
                        value = parcoords.yScales[arrayItem.key](d[arrayItem.key]);
                    }
                    else {
                        value = 240 / max * (max - d[arrayItem.key]) + 80;
                    }  
                    if(value < arrayItem.top) {
                        check_data.push(data);
                        d3.select("." + data).text(arrayItem.key);
                    }
                    else {
                        d3.select("." + data).style("opacity", "0.7")
                            .style("pointer-events", "stroke")
                            .style("stroke", "rgb(0, 129, 175)")
                            .style("stroke-width", "0.1rem")
                            .style("fill", "none")
                            .text("");
                    }
                }
                else {
                    //do nothing
                }

            });
            if(!check_data.includes(data)) {
                d3.select("." + data).style("opacity", "0.7")
                    .style("pointer-events", "stroke")
                    .style("stroke", "rgb(0, 129, 175)")
                    .style("stroke-width", "0.1rem")
                    .style("fill", "none")
                    .text("");
            }
        }
        else {
            // do nothing
        }
    });
    return currentPosOfDims;
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
    if (event.y + rect_height - 3 > 320) {
        y_bottom = 320;
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
            let check = d3.select("." + data).text();
            let checkcolor = d3.select("." + data).style("stroke");
            
            if ((value < event.y || value > event.y + rect_height)) {
                d3.select("." + data).style("pointer-events", "none")
                    .style("fill", "none")
                    .style("stroke", "lightgrey")
                    .style("stroke-opacity", "0.4")
                    //.text(cleanString);
            }
            else {//if (check === cleanString) {
                d3.select("." + data).style("opacity", "0.7")
                    .style("pointer-events", "stroke")
                    .style("stroke", "rgb(0, 129, 175)")
                    .style("stroke-width", "0.1rem")
                    .style("fill", "none")
                    //.text("");
            }
            /*else {
                //do nothing
            }*/
        });
    }
    else {
        d3.select("#rect_" + cleanString).attr('cursor', 'auto')
    }
}