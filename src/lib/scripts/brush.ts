import * as d3 from 'd3';
import * as base64 from './base64Arrows';

export function brushDown(cleanDimensionName: any, event: any, d: any, 
    parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {},
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]; 
    datasetForBrushing: any[]; }, active: any) {
    
    const yPosBottom = d3.select("#triangle_up_" + cleanDimensionName).attr("y");
    
    let yPosTop: number;
    let yPosRect: number;
    
    if (event.y < 70) {
        yPosTop = 70;
        yPosRect = 80;
    }
    else if (event.y > yPosBottom) {
        yPosTop = yPosBottom;
        yPosRect = 320;
    }
    else {
        yPosTop = event.y;
        yPosRect = event.y + 10;
    }

    addPosition(yPosTop, parcoords.currentPosOfDims, d.name, "top");
    
    d3.select("#rect_" + cleanDimensionName)
        .attr('cursor', `url('data:image/svg+xml;base64,
        ${base64.getArrowTopAndBottomBase64()}') 8 8 , auto`);
    
    d3.select("#triangle_down_" + cleanDimensionName).attr("y", yPosTop);

    const heightTopRect = yPosRect - 80;
    const heightBottomRect = 320 - yPosBottom;
    
    d3.select("#rect_" + cleanDimensionName)
        .attr("y", yPosRect)
        .attr("height", 240 - heightTopRect - heightBottomRect);

    updateLines(parcoords, active, d.name, cleanDimensionName);
}

export function brushUp(cleanDimensionName: any, event: any, d: any, 
    parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {}, 
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]; 
    datasetForBrushing: any[]; }, active: any) {
    
    const yPosTop = d3.select("#triangle_down_" + cleanDimensionName).attr("y");
    
    let yPosBottom: number;
    
    if (event.y < yPosTop) {
        yPosBottom = yPosTop;
    }
    else if (event.y > 320) {
        yPosBottom = 320;
    }
    else {
        yPosBottom = event.y;
    }

    addPosition(yPosBottom, parcoords.currentPosOfDims, d.name, "bottom");

    d3.select("#rect_" + cleanDimensionName)
        .attr('cursor', `url('data:image/svg+xml;base64,
        ${base64.getArrowTopAndBottomBase64()}') 8 8 , auto`);
    
    d3.select("#triangle_up_" + cleanDimensionName).attr("y", yPosBottom);

    const heightTopRect = yPosTop - 70;
    const heightBottomRect = 320 - yPosBottom;
    
    d3.select("#rect_" + cleanDimensionName)
        .attr("height", 240 - heightTopRect - heightBottomRect);

    updateLines(parcoords, active, d.name, cleanDimensionName);
}

export function dragAndBrush(cleanDimensionName: any, d: any, svg: any, event: any, 
    parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {}; 
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]; 
    datasetForBrushing: any[]; }, active: any, delta: any) {
    
    const rectHeight = svg.select("#rect_" + cleanDimensionName).node()
    .getBoundingClientRect().height;

    let yPosTop: number;
    let yPosRect: number;
    
    if (event.y + delta - 10 <= 70) {
        yPosTop = 70;
        yPosRect = 80;
    }
    else if (event.y + delta + rectHeight >= 320) {
        yPosTop = 320 - rectHeight - 10;
        yPosRect = 320 - rectHeight;
    }
    else {
        yPosTop = event.y + delta - 10;
        yPosRect = yPosTop + 10;
    }

    addPosition(yPosTop, parcoords.currentPosOfDims, d.name, "top");
    addPosition(yPosRect + rectHeight, parcoords.currentPosOfDims, d.name, "bottom");

    if (rectHeight < 240) {
        d3.select("#rect_" + cleanDimensionName)
            .attr("y", yPosRect);
        d3.select("#triangle_down_" + cleanDimensionName)
            .attr("y", yPosTop);
        d3.select("#triangle_up_" + cleanDimensionName)
            .attr("y", yPosRect + rectHeight);

        const dimensionName = d.name;
        const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
        const maxValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[1] :
        parcoords.yScales[dimensionName].domain()[0];

        active.each(function (d) {
            const currentLine = getLineName(d);

            let value : any;
            if(invertStatus) {
                value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                240 / maxValue * d[dimensionName] + 80;
            }
            else {
                value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                    240 / maxValue * (maxValue - d[dimensionName]) + 80;
            }

            const dimNameToCheck = d3.select("." + currentLine).text();
            
            const emptyString = "";
            if (value < yPosRect || value > yPosRect + rectHeight) {
                makeInactive(currentLine, dimensionName);
            }
            else if (dimNameToCheck == dimensionName && dimNameToCheck != emptyString) {
                let checkedLines = [];
                parcoords.currentPosOfDims.forEach(function (item) {
                    checkAllPositionsTop(item, dimensionName, parcoords, d, checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimensionName, parcoords, d, checkedLines, currentLine);
                    
                });
                if(!checkedLines.includes(currentLine)) {
                    makeActive(currentLine);
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
    return d[key].replace(/[*\- .,0123456789%&'\[{()}\]]/g, '');
}

export function addPosition(yPosTop: any, currentPosOfDims: any, dimensionName: any, key: any) {
    let newObject = {};
    newObject[key] = yPosTop;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}

function updateLines(parcoords: { xScales: any; yScales: {}; dragging: {}; dragPosStart: {};
    currentPosOfDims: any[]; newFeatures: any; features: any[]; newDataset: any[]; 
    datasetForBrushing: any[]; }, active: any, dimensionName: any, cleanDimensionName: any) {
    
    const rangeTop = d3.select("#triangle_down_" + cleanDimensionName).attr("y");
    const rangeBottom = d3.select("#triangle_up_" + cleanDimensionName).attr("y");

    const invertStatus = getInvertStatus(dimensionName, parcoords.currentPosOfDims);
    const maxValue = invertStatus == false ? parcoords.yScales[dimensionName].domain()[1] :
        parcoords.yScales[dimensionName].domain()[0];
    
    active.each(function (d) {
        let value : any;
        if(invertStatus) {
            value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
            240 / maxValue * d[dimensionName] + 80;
        }
        else {
            value = isNaN(maxValue) ? parcoords.yScales[dimensionName](d[dimensionName]) :
                240 / maxValue * (maxValue - d[dimensionName]) + 80;
        }      

        const currentLine = getLineName(d);

        const dimNameToCheck = d3.select("." + currentLine).text();

        const emptyString = "";
        if (value < rangeTop || value > rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimensionName);
            }
        }
        else if (dimNameToCheck == dimensionName && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                checkAllPositionsTop(item, dimensionName, parcoords, d, 
                    checkedLines, currentLine);
                checkAllPositionsBottom(item, dimensionName, parcoords, d, 
                    checkedLines, currentLine);
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine);
            }
        }
        else {
            // do nothing
        }
    });
}

function checkAllPositionsTop(positionItem: any, dimensionName: any, parcoords: { xScales: any; 
    yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; 
    features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, d: any, checkedLines: any[], 
    currentLine: any) {
    
        if (positionItem.key != dimensionName && positionItem.top != 70) {
        
        const maxValue = parcoords.yScales[positionItem.key].domain()[1];

        const value = isNaN(maxValue) ? parcoords.yScales[positionItem.key](d[positionItem.key]) :
                240 / maxValue * (maxValue - d[positionItem.key]) + 80;

        if (value < positionItem.top) {
            checkedLines.push(currentLine);
            d3.select("." + currentLine).text(positionItem.key);
        }
        else {
            makeActive(currentLine);
        }
    }
}

function checkAllPositionsBottom(positionItem: any, dimensionName: any, parcoords: { xScales: any; 
    yScales: {}; dragging: {}; dragPosStart: {}; currentPosOfDims: any[]; newFeatures: any; 
    features: any[]; newDataset: any[]; datasetForBrushing: any[]; }, d: any, checkedLines: any[], 
    currentLine: any) {
    
    if (positionItem.key != dimensionName && positionItem.bottom != 320) {
        
        const maxValue = parcoords.yScales[positionItem.key].domain()[1];

        const value = isNaN(maxValue) ? parcoords.yScales[positionItem.key](d[positionItem.key]) :
                240 / maxValue * (maxValue - d[positionItem.key]) + 80;

        if (value > positionItem.bottom) {
            checkedLines.push(currentLine);
            d3.select("." + currentLine).text(positionItem.key);
        }
        else {
            makeActive(currentLine);
        }
    }
}

function makeActive(currentLineName: any) {
    d3.select("." + currentLineName).style("opacity", "0.7")
        .style("pointer-events", "stroke")
        .style("stroke", "rgb(0, 129, 175)")
        .style("stroke-width", "0.1rem")
        .style("fill", "none")
        .text("");
}

function makeInactive(currentLineName: any, dimensionName: any) {
    d3.select("." + currentLineName).style("pointer-events", "none")
        .style("fill", "none")
        .style("stroke", "lightgrey")
        .style("stroke-opacity", "0.4")
        .text(dimensionName);
}

export function addSettingsForBrushing(dimensionName: any, parcoords: any) {
    const rectHeight = d3.select("#rect_" + dimensionName).node().getBoundingClientRect().height;
    const yPosRectTop = d3.select("#rect_" + dimensionName).attr("y");
    const yPosRectBottom = Number(yPosRectTop) + rectHeight;

    if (yPosRectTop > 80 && yPosRectBottom < 320) {
        const distanceBottom = 320 - d3.select("#triangle_up_" + dimensionName).attr("y");
        d3.select("#rect_" + dimensionName).attr("y", 80 + distanceBottom);
        d3.select("#triangle_down_" + dimensionName).attr("y", 70 + distanceBottom);
        d3.select("#triangle_up_" + dimensionName).attr("y", 80 + distanceBottom + rectHeight);
        addPosition(70 + distanceBottom, parcoords.currentPosOfDims, dimensionName, "top");
        addPosition(80 + distanceBottom + rectHeight, parcoords.currentPosOfDims, dimensionName, "bottom");
    }
    else if (yPosRectTop > 80 && yPosRectBottom >= 320) {
        d3.select("#rect_" + dimensionName).attr("y", 80);
        d3.select("#rect_" + dimensionName).attr("height", 240 - (yPosRectTop - 80));
        d3.select("#triangle_down_" + dimensionName).attr("y", 70);
        d3.select("#triangle_up_" + dimensionName).attr("y", 320 - (yPosRectTop - 80));
        addPosition(70, parcoords.currentPosOfDims, dimensionName, "top");
        addPosition(320 - (yPosRectTop - 80), parcoords.currentPosOfDims, dimensionName, "bottom");
    }
    else if (yPosRectTop <= 80 && yPosRectBottom < 320) {
        d3.select("#rect_" + dimensionName).attr("y", 320 - rectHeight);
        d3.select("#rect_" + dimensionName).attr("height", 240 - (320 - yPosRectBottom));
        d3.select("#triangle_down_" + dimensionName).attr("y", 80 + (320 - yPosRectBottom) - 10);
        d3.select("#triangle_up_" + dimensionName).attr("y", 320);
        addPosition(80 + (320 - yPosRectBottom) - 10, parcoords.currentPosOfDims, dimensionName, "top");
        addPosition(320, parcoords.currentPosOfDims, dimensionName, "bottom");
    }

    if (getInvertStatus(dimensionName, parcoords.currentPosOfDims)) {
        addInvertStatus(false, parcoords.currentPosOfDims, dimensionName, "isInverted");
    }
    else {
        addInvertStatus(true, parcoords.currentPosOfDims, dimensionName, "isInverted");
    }
}

function getInvertStatus(key: any, currentPosOfDims: any) {
    const item = currentPosOfDims.find((object) => object.key == key);
    return item.isInverted;
}

function addInvertStatus(status: any, currentPosOfDims: any, dimensionName: any, key: any) {
    let newObject = {};
    newObject[key] = status;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}
