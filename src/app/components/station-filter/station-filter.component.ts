import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FormatData, Station, StationMetadata } from 'src/app/models/Stations';

@Component({
  selector: 'app-station-filter',
  templateUrl: './station-filter.component.html',
  styleUrls: ['./station-filter.component.scss']
})
export class StationFilterComponent implements OnInit {

  tr = [0, 10];
  tf = new FormControl([2, 5]);

  private _stations: Station[];
  private _filteredStations: Station[];
  @Input() set stations(stations: Station[]) {
    this._stations = stations;
    this.filterStations(stations, this.getFilters());
  }
  @Input() set metadata(metadata: StationMetadata[]) {
    let fieldData: {
      [field: string]: {
        display: string,
        value: string
      }
    } = {};

    let valueData: {
      [field: string]: {
        type: "discreet",
        values: {
          [value: string]: {
            display: string,
            value: string
          }
        }
      } | {
        type: "continuous",
        values: [number, number]
      }
    } = {};
    for(let item of metadata) {
      for(let format of item.format.formatData) {
        fieldData[format.field] = {
          display: format.formattedField,
          value: format.field
        };
        let type = typeof(format.value);
        if(type == "string") {
          let values: {
            [value: string]: {
              display: string,
              value: string
            }
          } = <any>valueData[format.field]?.values;
          if(values === undefined) {
            values = {};
            valueData[format.field] = {
              type: "discreet",
              values: values
            };
          }
          if(format.value.trim()) {
            values[format.value.trim().toLowerCase()] = {
              display: format.formattedValue,
              value: format.value.trim().toLowerCase()
            };
          }
        }
        else if(type == "number") {
          let values: [number, number] = <any>valueData[format.field]?.values;
          if(values === undefined) {
            values = [format.value, format.value];
            valueData[format.field] = {
              type: "continuous",
              values: values
            };
          }
          if(format.value < values[0]) {
            values[0] = format.value;
          }
          if(format.value > values[1]) {
            values[1] = format.value;
          }
        }
      }
    }
    this.fields = Object.values(fieldData);
    this.values = {};
    //transform discreet valueData
    for(let field in valueData) {
      if(valueData[field].type == "discreet") {
        this.values[field] = {
          type: "discreet",
          values: Object.values(valueData[field].values)
        }
      }
      else {
        this.values[field] = <any>valueData[field]
      }
    }
  }
  @Output() filtered: EventEmitter<Station[]> = new EventEmitter<Station[]>();

  filterData: FilterData[];
  fields: {
    display: string,
    value: string
  }[];
  values: {
    [field: string]: {
      type: "discreet",
      values: {
        display: string,
        value: string
      }[]
    } | {
      type: "continuous",
      values: [number, number]
    }
  };

  constructor() {
    this.filterData = [];
    this.fields = [];
    this.values = {};
    this.addFilter();
  }

  ngOnInit() {
  }

  private filterStations(stations: Station[], filters: StationFilter<unknown>[]) {
    this._filteredStations = stations.filter((station: Station) => {
      let include = true;
      for(let filter of filters) {
        if(!filter.match(station)) {
          include = false;
          break;
        }
      }
      return include;
    });
    this.filtered.next(this._filteredStations);
  }

  private filterAll() {
    let filters = this.filterData.reduce((acc: StationFilter<unknown>[], data: FilterData) => {
      if(data.filter !== null) {
        acc.push(data.filter);
      }
      return acc;
    }, []);
    this.filterStations(this._stations, filters);
  }

  addFilter() {
    let filterData: FilterData = {
      fieldControl: new FormControl(null),
      valueControl: new FormControl([]),
      fieldSub: null,
      valueSub: null,
      filter: null
    };

    filterData.fieldSub = filterData.fieldControl.valueChanges.subscribe((field: string) => {
      filterData.valueControl.setValue([]);
    });
    filterData.valueSub = filterData.valueControl.valueChanges.subscribe((values: string[] | [number, number]) => {
      let filter = this.values[filterData.fieldControl.value].type == "discreet" ? new DiscreetFilter(filterData.fieldControl.value, <string[]>values) : new ContinuousFilter(filterData.fieldControl.value, <[number, number]>values);

      if(filterData.filter === null && values.length > 0) {
        filterData.filter = filter;
        this.filterStations(this._filteredStations, [filterData.filter]);
      }
      else if(values.length == 0) {
        filterData.filter = null;
        this.filterAll();
      }
      else {
        filterData.filter = filter;
        this.filterAll();
      }
    });
    this.filterData.push(filterData);
  }

  removeFilter(index: number) {
    //cleanup subs
    this.filterData[index].fieldSub.unsubscribe();
    this.filterData[index].valueSub.unsubscribe();
    //delete filter data
    this.filterData.splice(index, 1);
    //add init filter if none remaining
    if(this.filterData.length < 1) {
      this.addFilter();
    }
    this.filterAll();
  }

  clearFilters() {
    //cleanup subs
    for(let filter of this.filterData) {
      filter.fieldSub.unsubscribe();
      filter.valueSub.unsubscribe();
    }
    //reset filter data
    this.filterData = [];
    //add an intial filter form
    this.addFilter();
    this.filterAll();
  }

  private getFilters(): StationFilter<any>[] {
    let filters: StationFilter<unknown>[] = this.filterData.reduce((acc: StationFilter<unknown>[], filterData: FilterData) => {
      if(filterData.filter !== null) {
        acc.push(filterData.filter);
      }
      return acc;
    }, []);
    return filters;
  }
}

interface FilterData {
  fieldControl: FormControl,
  valueControl: FormControl,
  fieldSub: Subscription,
  valueSub: Subscription,
  filter: StationFilter<unknown>
}

abstract class StationFilter<T> {
  protected _values: T;
  protected _field: string;

  constructor(field: string, values: T) {
    this._field = field;
    this._values = values;
  }

  abstract match(station: Station): boolean;
}

class DiscreetFilter extends StationFilter<Set<string>> {
  constructor(field: string, values: string[]) {
    super(field, new Set<string>(values));
  }

  match(station: Station): boolean {
    let value = <string>station.metadata.getValue(this._field);
    //convert string values to lowercase, case insensitive
    value = value.trim().toLowerCase();
    return this._values.has(value);
  }
}

class ContinuousFilter extends StationFilter<[number, number]> {
  constructor(field: string, values: [number, number]) {
    super(field, values);
  }

  match(station: Station): boolean {
    let value = <number>station.metadata.getValue(this._field);
    return value >= this._values[0] && value <= this._values[1]
  }
}
