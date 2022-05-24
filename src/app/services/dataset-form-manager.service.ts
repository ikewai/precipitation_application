import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class DatasetFormManagerService {

  constructor() {

  }
}

type DatasetFormCategory = "general" | "raster" | "stations";

class DatasetFormNode {
  private _control: FormControl;
  private _description: string;
  private _category: DatasetFormCategory;
  constructor(description: string, defaultValue: string, category: DatasetFormCategory, values: {[tag: string]: FormValueNode}) {
    let control = new FormControl(defaultValue);
    this._control = control;
    this._description = description;
    this._category = category;

    control.valueChanges.subscribe();
  }

  public get control(): FormControl {
      return this._control;
  }

  public get description(): string {
      return this._description;
  }

  public get category(): DatasetFormCategory {
    return this._category;
  }
}




class DatasetPropertiesNode {

  private _includeStations: boolean;
  private _includeRaster: boolean;
  private _unit: string;
  private _dateRange: [number, number];
  private _rangeAbsolute: [boolean, boolean];


  constructor(includeStations: boolean, includeRaster: boolean, unit: string, dateRange: [number, number], rangeAbsolute: [boolean, boolean]) {
    this._includeStations = includeStations;
    this._includeRaster = includeRaster;
    this._unit = unit;
    this._dateRange = dateRange;
    this._rangeAbsolute = rangeAbsolute;
  }
}

class FormValueNode {
  constructor(description: string, value: string, next: DatasetFormNode | DatasetDisplayNode | DatasetPropertiesNode) {

  }
}
