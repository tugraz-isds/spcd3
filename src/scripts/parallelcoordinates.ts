declare const d3: any;
declare const tippy: any;

class SteerableParcoords {
  private data: any;
  private newFeatures: any;
  private width: number;
  private height: number;
  private padding: number;
  private brushWidth: number;
  private filters: {};
  features: any[];
  xScales: any;
  dragging: any;
  private featureAxisG: any;
  yScales: {};
  private active: any;
  private inactive: any;
  private newDataset: any;
  yBrushes: {};
  yAxis: {};

  constructor(data?, newFeatures?) {
    if(data) {
      this.data = data;
    }
    if(newFeatures) {
      this.newFeatures = newFeatures;
    }
  }

  loadCSV(csv)
  {
    var tmp_data = d3.csvParse(csv);
    this.data = tmp_data.sort((a,b) => a.Name.toLowerCase() > b.Name.toLowerCase() ? 1 : -1);
  }

  //not happy with this, but at the moment we need it
  getData(): any
  {
    return this.data;
  }

  setDimensions(newDimension): void
  {
    this.newFeatures = newDimension;
    this.newFeatures.reverse();
  }

  invert(dimension) {
    const invert_id = "#dimension_invert_" + dimension;
    const dimension_id = "#dimension_axis_" + dimension;
    const textElement = d3.select(invert_id);
    const currentText = textElement.text();
    const newText = currentText === '▼' ? '▲' : '▼';
    textElement.text(newText);

    d3.select(dimension_id)
        .call(this.yAxis[dimension].scale(this.yScales[dimension].domain(this.yScales[dimension].domain().reverse())))
        .transition();

        // force update lines
        this.active.attr('d', this.linePath.bind(this));
        delete textElement.__origin__;
        delete this.active[dimension];
        this.transition(this.active).attr('d', this.linePath.bind(this));
        this.inactive.attr('d', this.linePath.bind(this))
        .transition()
        .delay(5)
        .duration(0)
        .attr("visibility", null);
  }

  getInversionStatus(dimension)
  {

  }

  move(dimension, toRightOf, A)
  {

  }

  getDimensionPositions()
  {

  }

  getFilter(dimension)
  {

  }

  setFilter(dimension)
  {

  }

  getSelected()
  {

  }

  select(records)
  {

  }

  saveAsSVG()
  {

  }

  position(this: any, d: any, parcoords: any) {
    var v = parcoords.dragging[d];
    return v == null ? parcoords.xScales(d) : v;
  }

  onDragStartEventHandler(parcoords)
  {
    {
      return function onDragStart (d)
      {
        this.__origin__ = parcoords.xScales((d.subject).name);
        parcoords.dragging[(d.subject).name] = this.__origin__;
        parcoords.inactive.attr("visibility", "hidden");
      }
    }
  }

  onDragEventHandler(parcoords) {
    {
      return function onDrag(d) {
        parcoords.dragging[(d.subject).name] = Math.min(parcoords.width, Math.max(0, this.__origin__ += d.dx));
        parcoords.active.attr('d', parcoords.linePath.bind(parcoords));
        parcoords.newFeatures.sort((a, b) => { return parcoords.position(b, parcoords) - parcoords.position(a, parcoords); });
        parcoords.xScales.domain(parcoords.newFeatures);
        parcoords.featureAxisG.attr("transform", (d) => { return "translate(" + parcoords.position(d.name, parcoords) + ")"; });
      };
    }
  }

  transition(g) {
    return g.transition().duration(50);
  }


  onDragEndEventHandler(parcoords) {
    {
      return function onDragEnd(d) {
        delete this.__origin__;
        delete parcoords.dragging[(d.subject).name];
        parcoords.transition(d3.select(this)).attr('transform', d => ('translate(' + parcoords.xScales(d.name) + ')'));
        parcoords.transition(parcoords.active).attr('d', parcoords.linePath.bind(parcoords));
        parcoords.inactive.attr('d', parcoords.linePath.bind(parcoords))
            .transition()
            .delay(5)
            .duration(0)
            .attr("visibility", null);
      };
    }
  }

  onInvert(parcoords) {
    {
      return function invert(event, d) {
        parcoords.invert(d.name);
      };
    }
  }

  prepareData()
  {
    this.data.forEach(obj => {
      var newdata = {};
      this.newFeatures.forEach(feature => {
        newdata[feature] = obj[feature]
      })
      this.newDataset.push(newdata)
    })

    Object.keys(this.newDataset[0]).forEach(element => this.features.push({ 'name': element }))
  }

  setupScales()
{
    //TODO check if integer and if then get all values for max and min
    this.features.map(x => {

      if (x.name === "Name") {
        this.yScales[x.name] = d3.scalePoint()
            .domain(this.newDataset.map(function (d) { return d.Name; }))
            .range([this.padding, this.height - this.padding])
      }
      else {
        var max = Math.max(...this.newDataset.map(o => o[x.name]))
        var min = Math.min(...this.newDataset.map(o => o[x.name]))
        this.yScales[x.name] = d3.scaleLinear()
            .domain([min, max]).nice()
            .range([this.height - this.padding, this.padding])
      }
    })

    this.xScales = d3.scalePoint()
        .range([this.width - this.padding, this.padding])
        .domain(this.features.map(x => x.name))
  }

  setupYAxis() 
  {
    Object.entries(this.yScales).map(x => {
        this.yAxis[x[0]] = d3.axisLeft(x[1]);
    });
    return this.yAxis;
  }

  setupBrush()
  {
    Object.entries(this.yScales).map(x => {

      let extent = [[-(this.brushWidth / 2), this.padding - 1],
                    [this.brushWidth / 2, this.height - this.padding]]

      this.yBrushes[x[0]] = d3.brushY()
        .extent(extent)
        .on('brush',this.onBrushEventHandler(this))
        .on('end', this.onBrushEventHandler(this))
    });
    return this.yBrushes
  }

  onBrushEventHandler(parcoords) {
    {
      return function brushEventHandler(event,features) {
        if (event.sourceEvent && event.sourceEvent.type === 'zoom')
        return;
        if (parcoords.features === 'Name') {
          return;
        }
        if (event.selection != null) {
            const remappedSelection = event.selection.map((x) => {
                const scale = parcoords.yScales[features.name];// Get the appropriate scale based on features
                return scale.invert(x); // Remap the selection value
            });
            parcoords.filters[features.name] = remappedSelection;
        } else {
          if (features.name in parcoords.filters)
            delete (parcoords.filters[features.name])
        }
        parcoords.applyFilters();
      };
    }
  }

  applyFilters() {
    d3.select('g.active').selectAll('path')
    .style('display', d => (this.selected(d) ? null : 'none'))
  }

  selected(d) {
    const tempFilters = Object.entries(this.filters)
    return tempFilters.every(f => {
      return f[1][1] <= d[f[0]] && d[f[0]] <= f[1][0];
    });
  }

  private initContent() {
    this.width = 1200;
    this.height = 400;
    this.padding = 50;
    this.brushWidth = 20;
    this.filters = {};
    this.features = [];
    this.xScales = null;
    this.dragging = {};
    this.featureAxisG = null;
    this.yScales = {};
    this.active = null;
    this.inactive = null;
    this.newDataset = [];
    this.yBrushes = {};
    this.yAxis = {};
    d3.select("svg").remove();
  }
  
  // TODO refactor
  generateSVG() {
    this.initContent();
    this.prepareData();
    this.setupScales();
    var self = this;
    var yaxis = this.setupYAxis();
    var brushes = this.setupBrush();


    const svg = d3.select("#parallelcoords")
        .append('svg')
        .attr("viewBox", "0 0 1200 400")

    this.inactive = svg.append('g')
        .attr('class', 'inactive')
        .selectAll('path')
        .data(this.data)
        .enter()
        .append('path')
        .attr('d', this.linePath.bind(this))

    this.active = svg.append('g')
        .attr('class', 'active')
        .selectAll('path')
        .data(this.data)
        .enter()
        .append('path')
        .attr("class", function (d) { return "line " + d.Name })
        .attr('d', this.linePath.bind(this))
        .style("opacity", 0.5)
        .on("mouseover", this.highlight)
        .on("mouseleave", this.doNotHighlight)
        .each(function(d) {
          const lineData = d; // Access the line data associated with the current line element
          const lineElement = this; // Reference to the current line element
          tippy(lineElement, {
            content: `-`,
            followCursor: 'initial',
            onShow(instance) {
              var dimensionName = self.features[self.features.length - 1].name;
              instance.setContent(`${lineData[dimensionName]}`);
            }
          });
        });

    this.featureAxisG = svg.selectAll('g.feature')
        .data(this.features)
        .enter()
        .append('g')
        .attr('class', 'feature')
        .attr('transform', d => ('translate(' + this.xScales(d.name) + ')'))
        .call(d3.drag()
            .on("start", this.onDragStartEventHandler(this))
            .on("drag", this.onDragEventHandler(this))
            .on("end", this.onDragEndEventHandler(this))
        );

    this.featureAxisG
        .append('g')
        .each(function (d) {
          d3.select(this)
              .attr('id', 'dimension_axis_' + d.name)
              .call(yaxis[d.name]);
        });

    this.featureAxisG
        .each(function (d) {
          d3.select(this)
              .append('g')
              .attr('class', 'brush')
              .call(brushes[d.name]);
        });

    this.featureAxisG
        .append("text")
        .attr("text-anchor", "middle")
        .attr('y', this.padding / 2)
        .text(d => d.name);

    this.featureAxisG
        .append("text")
        .attr("text-anchor", "middle")
        .attr('y', this.padding / 2 + 17)
        .each(function (d) {
          d3.select(this)
              .attr('id', 'dimension_invert_' + d.name)
              .text('▼')
        })
        .on("click", this.onInvert(this));
  }

  linePath(d) {
    var lineGenerator = d3.line()
    const tempdata = Object.entries(d).filter(x => x[0])
    let points = []
    this.newFeatures.map(newfeature => {
      tempdata.map(x => {
        if (newfeature === x[0]) {
          points.push([this.xScales(newfeature), this.yScales[newfeature](x[1])])
        }
      })
    })
    return (lineGenerator(points))
  }


  highlight(d) {
    var selected_student = d.target.__data__.Name
    // Second the hovered specie takes its color
    d3.selectAll("." + selected_student)
        .transition().duration(5)
        .style("stroke", selected_student)
        .style("opacity", "5")
        .style('stroke', 'red')
  }

  doNotHighlight(d) {
    var selected_student = d.target.__data__.Name
    d3.selectAll("." + selected_student)
        .transition().duration(5)
        .style("stroke", selected_student)
        .style("opacity", ".4")
        .style('stroke', '#0081af')
  }

}



