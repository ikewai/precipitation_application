import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import Moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class DatasetFormManagerService {

  //have field data registered by tags
  //replace all field values with values in dataset
  //on change update fields being

  constructor() {

    let formState = {
      dataset: "rainfall",
      period: "monthly",
      fill: "partial",
      ds_method: "dynamical",
      climate_model: "rcp45",
      season: "annual"
    };

    //a dataset has a set of properties that are standard (general form)
    //the combination of properties can have additional cotegorized properties that do not modify anything, along with the additional properties of the dataset, can have additional dropdowns here, but they may not affect further options. if they do it should be separated into a new top level dataset

    //make it so that items with single option turn into labels rather than drop downs
    const datasetFields = {
      rainfall: ["period"],
      legacy_rainfall: ["period"],
      downscaling_rainfall: ["ds_method", "climate_model", "season"],
      minimum_temperature: ["period"],
      maximum_temperature: ["period"],
      mean_temperature: ["period"],
      downscaling_temperature: ["ds_method", "climate_model"]
    };

    const rainfall_month = new DatasetData();
    const rainfall_day = new DatasetData();
    const legacy_rainfall_month = new DatasetData();
    const legacy_rainfall_day = new DatasetData();
    const downscaling_rainfall_dynamical_rcp45_annual = new DatasetData();
    const downscaling_rainfall_dynamical_rcp45_dry = new DatasetData();
    const downscaling_rainfall_dynamical_rcp45_wet = new DatasetData();
    const downscaling_rainfall_dynamical_rcp85_annual = new DatasetData();
    const downscaling_rainfall_dynamical_rcp85_dry = new DatasetData();
    const downscaling_rainfall_dynamical_rcp85_wet = new DatasetData();
    const downscaling_rainfall_statistical_rcp45_annual = new DatasetData();
    const downscaling_rainfall_statistical_rcp45_dry = new DatasetData();
    const downscaling_rainfall_statistical_rcp45_wet = new DatasetData();
    const downscaling_rainfall_statistical_rcp85_annual = new DatasetData();
    const downscaling_rainfall_statistical_rcp85_dry = new DatasetData();
    const downscaling_rainfall_statistical_rcp85_wet = new DatasetData();
    const minimum_temperature_month = new DatasetData();
    const minimum_temperature_day = new DatasetData();
    const maximum_temperature_month = new DatasetData();
    const maximum_temperature_day = new DatasetData();
    const mean_temperature_month = new DatasetData();
    const mean_temperature_day = new DatasetData();
    const downscaling_temperature_dynamical_rcp45 = new DatasetData();
    const downscaling_temperature_dynamical_rcp85 = new DatasetData();
    const downscaling_temperature_statistical_rcp45 = new DatasetData();
    const downscaling_temperature_statistical_rcp85 = new DatasetData();

    let datasets = {
      rainfall: {
        month: rainfall_month,
        day: rainfall_day
      },

      legacy_rainfall: {
        month: legacy_rainfall_month,
        day: legacy_rainfall_day
      },

      downscaling_rainfall: {
        dynamical: {
          rcp45: {
            annual: downscaling_rainfall_dynamical_rcp45_annual,
            dry: downscaling_rainfall_dynamical_rcp45_dry,
            wet: downscaling_rainfall_dynamical_rcp45_wet
          },
          rcp85: {
            annual: downscaling_rainfall_dynamical_rcp85_annual,
            dry: downscaling_rainfall_dynamical_rcp85_dry,
            wet: downscaling_rainfall_dynamical_rcp85_wet
          }
        },
        statistical: {
          rcp45: {
            annual: downscaling_rainfall_statistical_rcp45_annual,
            dry: downscaling_rainfall_statistical_rcp45_dry,
            wet: downscaling_rainfall_statistical_rcp45_wet
          },
          rcp85: {
            annual: downscaling_rainfall_statistical_rcp85_annual,
            dry: downscaling_rainfall_statistical_rcp85_dry,
            wet: downscaling_rainfall_statistical_rcp85_wet
          }
        }
      },

      minimum_temperature: {
        month: minimum_temperature_month,
        day: minimum_temperature_day
      },

      maximum_temperature: {
        month: maximum_temperature_month,
        day: maximum_temperature_day
      },

      mean_temperature: {
        month: mean_temperature_month,
        day: mean_temperature_day
      },

      downscaling_temperature: {
        dynamical: {
          rcp45: downscaling_temperature_dynamical_rcp45,
          rcp85: downscaling_temperature_dynamical_rcp85
        },
        statistical: {
          rcp45: downscaling_temperature_statistical_rcp45,
          rcp85: downscaling_temperature_statistical_rcp85
        }
      }
    }



    //can use same routine for everything, move to function and pass in
    const formChange = (fieldTag: string, value: FormValue) => {
      fieldState[fieldTag] = value.tag;
      let fields = datasetFields[fieldState[fieldTag]];
      let root = datasets[fieldState.dataset];
      for(let field of fields) {
        let state = fieldState[field];
        let next = root[state];
        //if undefined the state value does not exist on this branch get first value and set state to that
        if(next === undefined) {
          state = Object.keys(root)[0];
          next = root[state];
          fieldState[field] = state
        }
      }
      let dataset: Dataset = root;
      let formFields: FormField[] = dataset.fields;
      //NOTE YOU DON'T NEED A SEPARATE FORM CONTROL FOR EACH VALUE SET, SHOULD PUT IN OUTER WRAPPER, JUST ONE PER FIELD
      for(let formField of formFields) {
        let state = fieldState[formField.tag];
        formField.control.setValue(state);
      }
    }

    //maybe add function to easily add new field?
    //need to create state, control listener, etc
    //just need default value, form field params

    //create forms
    //dataset form
    //note this doesn't have to go in dataset properties, this is the


    // dataset: "rainfall",
    //   period: "monthly",
    //   fill: "partial",
    //   ds_method: "dynamical",
    //   climate_model: "rcp45",
    //   season: "annual"

    //additional forms




























    //form display data
    const datasetFormDisplayData = new DisplayData("Dataset", "Select the type of data you would like to view. Hover over an option for a description of the data set.");
    const periodFormDisplayData = new DisplayData("Time Period", "The time period over which the data is measured.");
    const fillFormDisplayData = new DisplayData("Data Fill", "The type of processing the station data goes through.");
    const dsMethodFormDisplayData = new DisplayData("Downscaling Method", "The type of downscaling climate model used for future predictions.");
    const climateModelFormDisplayData = new DisplayData("Future Climate Model", "The climate model used to predict future data.");
    const seasonFormDisplayData = new DisplayData("Season", "The season measurements and predictions are made for.");

    //dataset values display data
    const rainfallDisplayData = new DisplayData("Rainfall", "Rainfall data (1990 - present)");
    const legacyRainfallDisplayData = new DisplayData("Legacy Rainfall", "Legacy rainfall data based on older production methods (1920 - 2012)");
    const maxTemperatureDisplayData = new DisplayData("Maximum Temperature", "Temperature data aggregated to its maximum value over the time period");
    const minTemperatureDisplayData = new DisplayData("Minimum Temperature", "Temperature data aggregated to its minimum value over the time period");
    const meanTemperatureDisplayData = new DisplayData("Mean Temperature", "Temperature data aggregated to its average value over the time period");

    //period values display data
    const dayDisplayData = new DisplayData("Daily", "Data measured at a daily time scale.");
    const monthDisplayData = new DisplayData("Monthly", "Data measured at a monthly time scale.");

    //data fill values display data
    const unfilledDisplayData = new DisplayData("Unfilled", "Station data including only values provided by stations before going through QA/QC.");
    const partialFilledDisplayData = new DisplayData("Partial Filled", "This data has undergone QA/QC and is partially filled using statistical techniques to estimate some missing station values.");

    //downscaling method values display data
    const dynamicalDisplayData = new DisplayData("Dynamical", "dynamical downscaling uses high resolution regional climate models to extrapolate lower resolution global climate models down to an area of interest.");
    const statisticalDisplayData = new DisplayData("Statistical", "Statistical downscaling uses historical climatological data to statistically approximate future values.");

    //climate model values display data
    const rcp45DisplayData = new DisplayData("RCP 4.5", "A climate scenario assuming peak emissions around 2040. This scenario approximates a rise in global temperature by between 2.5 and 3°C by the year 2100.");
    const rcp85DisplayData = new DisplayData("RCP 8.5", "A worst case climate scenario assuming continuously rising rates of emissions. This scenario approximates a rise in global temperature of about 5°C by the year 2100.");

    //season values display data
    const annualDisplayData = new DisplayData("Annual", "Includes all annual data.");
    const wetDisplayData = new DisplayData("Wet", "Only includes data from the wet season.");
    const dryDisplayData = new DisplayData("Dry", "Only includes data from the dry season.");

    //form field data
    const datasetFormFieldData = new FormFieldData(datasetFormDisplayData, "dataset", "general");
    const periodFormFieldData = new FormFieldData(periodFormDisplayData, "period", "general");
    const fillFormFieldData = new FormFieldData(fillFormDisplayData, "fill", "stations");
    const dsMethodFormFieldData = new FormFieldData(dsMethodFormDisplayData, "ds_method", "general");
    const climateModelFormFieldData = new FormFieldData(climateModelFormDisplayData, "climate_model", "general");
    const seasonFormFieldData = new FormFieldData(seasonFormDisplayData, "season", "general");

    //dataset value data
    const rainfallValueData = new ValueData(rainfallDisplayData, "rainfall", {
      dataset: "rainfall",
      production: "new"
    });
    const legacyRainfallValueData = new ValueData(legacyRainfallDisplayData, "legacy_rainfall", {
      dataset: "rainfall",
      production: "legacy"
    });
    const maxTemperatureValueData = new ValueData(maxTemperatureDisplayData, "max_temperature", {
      dataset: "temeprature",
      aggregation: "max"
    });
    const minTemperatureValueData = new ValueData(minTemperatureDisplayData, "min_temperature", {
      dataset: "temperature",
      aggregation: "min"
    });
    const meanTemperatureValueData = new ValueData(meanTemperatureDisplayData, "mean_temperature", {
      dataset: "temperature",
      aggregation: "mean"
    });

    //period value data
    const dayValueData = new ValueData(dayDisplayData, "day", {
      period: "day"
    });
    const monthValueData = new ValueData(monthDisplayData, "month", {
      period: "month"
    });

    //data fill value data
    const unfilledValueData = new ValueData(unfilledDisplayData, "unfilled", {
      fill: "raw"
    });
    const partialFilledValueData = new ValueData(partialFilledDisplayData, "partial", {
      fill: "partial"
    });

    //dataset properties
    const monthlyRainfallDatasetProperties = new DatasetProperties(true, true, "Millimeters", "mm", [0, 650], [true, false], [Moment("01-1990"), null], "range");
    const dailyRainfallDatasetProperties = new DatasetProperties(true, false, "Millimeters", "mm", [0, 20], [true, false], [Moment("01-01-1990"), Moment("03-31-2022")], "range");
    const legacyRainfallDatasetProperties = new DatasetProperties(false, true, "Millimeters", "mm", [0, 650], [true, false], [Moment("01-1920"), Moment("12-2012")], "range");
    const minMaxDailyTemperatureProperties = new DatasetProperties(true, true, "Celcius", "°C", [-10, 35], [false, false], [Moment("01-01-1990"), null], "range");
    const minMaxMonthlyTemperatureProperties = new DatasetProperties(true, true, "Celcius", "°C", [-10, 35], [false, false], [Moment("01-1990"), Moment("12-2018")], "range");
    const meanDailyTemperatureProperties = new DatasetProperties(false, true, "Celcius", "°C", [-10, 35], [false, false], [Moment("01-01-1990"), null], "range");
    const meanMonthlyTemperatureProperties = new DatasetProperties(false, true, "Celcius", "°C", [-10, 35], [false, false], [Moment("01-1990"), Moment("12-2018")], "range");

    //form nodes

    //fill value nodes

    //monthly rainfall
    const monthlyRainfallPartialNode = new FormValueNode(partialFilledValueData, null, monthlyRainfallDatasetProperties);
    //daily rainfall
    const dailyRainfallPartialNode = new FormValueNode(partialFilledValueData, null, dailyRainfallDatasetProperties);
    const dailyRainfallUnfilledNode = new FormValueNode(unfilledValueData, null, dailyRainfallDatasetProperties);
    //daily temperature
    const minMaxDailyTemperatureUnfilledNode = new FormValueNode(unfilledValueData, null, minMaxDailyTemperatureProperties);
    const minMaxDailyTemperaturePartialNode = new FormValueNode(partialFilledValueData, null, minMaxDailyTemperatureProperties);
    //monthly temeperature
    const minMaxMonthlyTemperatureUnfilledNode = new FormValueNode(unfilledValueData, null, minMaxMonthlyTemperatureProperties);

    //redo
    const partialFilledNode = new FormValueNode(partialFilledValueData, null);
    const unfilledNode = new FormValueNode(unfilledValueData, null);



    //fill form nodes
    new FormFieldNode(fillFormFieldData, [partialFilledNode, unfilledNode], "partial");
    new FormFieldNode(fillFormFieldData, [partialFilledNode], "partial");
    new FormFieldNode(fillFormFieldData, [unfilledNode], "unfilled");

    //period nodes

    //rainfall
    //const rainfallMonthlyNode = new FormValueNode();
    //legacy rainfall
    const legacyRainfallMonthlyNode = new FormValueNode(monthValueData, null, legacyRainfallDatasetProperties);
    //mean temperature
    const meanTemperatureDailyNode = new FormValueNode(dayValueData, null, meanDailyTemperatureProperties);
    const meanTemperatureMonthlyNode = new FormValueNode(monthValueData, null, meanMonthlyTemperatureProperties);


    const datasetFormField = new FormField(datasetFormFieldData, []);
    const periodFormField = new FormField(periodFormFieldData, []);
    const fillFormField = new FormField(fillFormFieldData, []);
    const dsMethodFormField = new FormField(dsMethodFormFieldData, []);
    const climateModelFormField = new FormField(climateModelFormFieldData, []);
    const seasonFormField = new FormField(seasonFormFieldData, []);

    datasetFormField.control.valueChanges.subscribe((value: FormValue) => {
      formChange("dataset", value);
    });
    periodFormField.control.valueChanges.subscribe((value: FormValue) => {
      formChange("period", value);
    });
    fillFormField.control.valueChanges.subscribe((value: FormValue) => {
      formChange("fill", value);
    });
    dsMethodFormField.control.valueChanges.subscribe((value: FormValue) => {
      formChange("ds_method", value);
    });
    climateModelFormField.control.valueChanges.subscribe((value: FormValue) => {
      formChange("climate_model", value);
    });
    seasonFormField.control.valueChanges.subscribe((value: FormValue) => {
      formChange("season", value);
    });
  }

}







class FormField {
  private _displayData: DisplayData;
  private _values: FormValue[];
  private _valueMap: {[tag: string]: FormValue};

  constructor(displayData: FormFieldData, values: FormValue[]) {
    this._values = values;
    this._displayData = displayData;
    this._valueMap = {};
    for(let value of values) {
      this._valueMap[value.tag] = value;
    }
  }

  public get control() {
    return this._control;
  }

  public get values() {
    return this._values;
  }

  public get label(): string {
    return this._displayData.label;
  }

  public get description(): string {
    return this._displayData.description;
  }

  public setValue(valueTag: string) {
    let value = this._valueMap[valueTag];
    this._control.setValue(value);
  }
}

class FormValue {
  private _reqParams: any;
  private _displayData: DisplayData;
  private _tag: string;

  constructor(displayData: DisplayData, tag: string, reqParams: any) {
    this._reqParams = reqParams;
    this._displayData = displayData;
    this._tag = tag;
  }

  public get reqParams(): any {
    return this._reqParams;
  }

  public get label(): string {
    return this._displayData.label;
  }

  public get description(): string {
    return this._displayData.description;
  }

  public get tag(): string {
    return this._tag;
  }
}
















class DatasetData {
  private _includeStations: boolean;
  private _includeRaster: boolean;
  private _units: string;
  private _unitsShort: string;
  private _dataRange: [number, number];
  private _rangeAbsolute: [boolean, boolean];
  private _dates: [Moment.Moment, Moment.Moment] | string[];
  private _datesType: DateType;

  private _reqParams: any;

  private _formData: FormFieldNode[];


  constructor(includeStations: boolean, includeRaster: boolean, units: string, unitsShort: string, dataRange: [number, number], rangeAbsolute: [boolean, boolean], dates: [Moment.Moment, Moment.Moment] | string[], datesType: DateType) {
    this._includeStations = includeStations;
    this._includeRaster = includeRaster;
    this._units = units;
    this._dataRange = dataRange;
    this._rangeAbsolute = rangeAbsolute;
    this._dates = dates;
    this._datesType = datesType;

    this._reqParams = reqParams;

    this._formData = formData;
  }

  public get includeStations(): boolean {
    return this._includeStations;
  }

  public get includeRaster(): boolean {
    return this._includeRaster;
  }

  public get units(): string {
    return this._units;
  }

  public get unitsShort(): string {
    return this._unitsShort;
  }

  public get dataRange(): [number, number] {
    return this._dataRange;
  }

  public get rangeAbsolute(): [boolean, boolean] {
    return this._rangeAbsolute;
  }

  public get dates(): [Moment.Moment, Moment.Moment] | string[] {
    return this._dates;
  }

  public get datesType(): DateType {
    return this._datesType;
  }
}





















class FormValueNode {
  private _valueData: ValueData;
  private _next: FormFieldNode;
  private _datasetProperties: DatasetProperties;

  constructor(valueData: ValueData, next: FormFieldNode, datasetProperties: DatasetProperties = null) {
    this._valueData = valueData;
    this._next = next;
    this._datasetProperties = datasetProperties;
  }

  public get datasetProperties(): DatasetProperties {
    return this._datasetProperties;
  }

  public get next(): FormFieldNode {
    return this._next;
  }

  public get nextValue():

  public get reqParams(): any {
    return this._valueData.reqParams;
  }

  public get label(): string {
    return this._valueData.label;
  }

  public get description(): string {
    return this._valueData.description;
  }

  public get tag(): string {
    return this._valueData.tag;
  }
}

//set and get value rather than getValue, use form control

//add form control, the values are bound so they do not need to be separate
class FormFieldNode {
  private _values: FormValueNode[];
  private _valueMap: {[tag: string]: FormValueNode};
  private _formFieldData: FormFieldData;
  private _control: FormControl

  //maybe have next value in value nodes so can get chain skipping field nodes
  constructor(formFieldData: FormFieldData, values: FormValueNode[], defaultValueTag: string) {
    this._formFieldData = formFieldData;
    this._values = values;
    this._valueMap = {};
    //map to tags for quick id
    for(let value of values) {
      this._valueMap[value.tag] = value;
    }
    let defaultValue = this._valueMap[defaultValueTag];
    this._control = new FormControl(defaultValue);
  }

  public get control(): FormControl {
    return this._control;
  }

  public get group(): FormFieldGroup {
    return this._formFieldData.group;
  }

  public get label(): string {
    return this._formFieldData.label;
  }

  public get description(): string {
    return this._formFieldData.description;
  }

  public get tag(): string {
    return this._formFieldData.tag;
  }

  public get values(): FormValueNode[] {
    return this._values;
  }

  public getValue(tag: string) {
    return this._valueMap[tag];
  }
}

class DisplayData {
  private _label: string;
  private _description: string;

  constructor(label: string, description: string) {
    this._label = label;
    this._description = description;
  }

  public get label(): string {
    return this._label;
  }

  public get description(): string {
    return this._description;
  }
}

class ValueData {
  private _reqParams: any;
  private _displayData: DisplayData;
  private _tag: string;

  constructor(displayData: DisplayData, tag: string, reqParams: any) {
    this._reqParams = reqParams;
    this._displayData = displayData;
    this._tag = tag;
  }

  public get reqParams(): any {
    return this._reqParams;
  }

  public get label(): string {
    return this._displayData.label;
  }

  public get description(): string {
    return this._displayData.description;
  }

  public get tag(): string {
    return this._tag;
  }
}

export type FormFieldGroup = "general" | "raster" | "stations";
class FormFieldData {
  private _displayData: DisplayData;
  private _tag: string;
  private _formGroup: FormFieldGroup;
  private _allValues: FormValue[];
  private _valuesMap: {[tag: string]: FormValue};
  private _currentValues: FormValue[];
  private _control: FormControl;

  constructor(displayData: DisplayData, tag: string, formGroup: FormFieldGroup) {
    this._displayData = displayData;
    this._tag = tag;
    this._formGroup = formGroup;
    this._control = new FormControl();
  }

  public get group(): FormFieldGroup {
    return this._formGroup;
  }

  public get label(): string {
    return this._displayData.label;
  }

  public get description(): string {
    return this._displayData.description;
  }

  public get tag(): string {
    return this._tag;
  }

  public set values(valueTags: string[]) {
    this._currentValues = new Array(valueTags.length);
    for(let tag of valueTags) {
      this._currentValues.push(this._valuesMap[tag]);
    }
  }

  public get values() {
    return this._currentValues;
  }

  public set value(valueTag: string) {

  }
}




































class DatasetState {
  //values need string
  state: {[formTag: string]: string}

  constructor(root: DatasetFormNode) {
    let node: DatasetFormNode | DatasetPropertiesNode = root;
    while(node instanceof DatasetFormNode) {
      node.control.valueChanges.subscribe((value: FormValueNode) => {
        //get form and value tags
        let formTag = (<DatasetFormNode>node).tag;
        //let valueTag = value.tag;
        //set current value in state to the set value
        //this.state[formTag] = valueTag;
        //try to set values based on tags if available going down
        //let
      });
      //need to expand out everything, this only gets for current value, can add these to constructor maybe?????
      node = node.getNextForm();
    }
  }
}

//wrapper with value and form tiles for reuse




////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

class FormDetails {
  private _tag: string;
  private _description: string;
  private _label: string;
  private _value: string;

  constructor(tag: string, description: string, label: string) {
    this._tag = tag;
    this._description = description;
    this._label = label;
  }

  public set value(value: string) {
    this._value = value;
  }

  public get value(): string {
    return this._value;
  }

  public get tag(): string {
    return this._tag;
  }

  public get description(): string {
    return this._description;
  }

  public get label(): string {
    return this._label;
  }
}

class ValueDetails {
  private _tag: string;
  private _description: string;
  private _label: string;

  constructor(tag: string, description: string, label: string) {
    this._tag = tag;
    this._description = description;
  }

  public get tag(): string {
    return this._tag;
  }

  public get description(): string {
    return this._description;
  }

  public get label(): string {
    return this._label;
  }
}

class FormNode {
  private _next: FormNode;
  private _details: FormDetails;
  private _control: FormControl;
  private _values: {[tag: string]: ValueNode};
  private _defaultValueTag: string;
  private _category: DatasetFormCategory;

  constructor(values: ValueNode[], defaultValueTag: string, category: DatasetFormCategory) {
    this._category = category;
    this._defaultValueTag = defaultValueTag;
    this._control = new FormControl();
    this._values = {};
    for(let value of values) {
      this._values[value.tag] = value;
    }
    this._control.setValue(this._values[defaultValueTag]);
    this._control.valueChanges.subscribe((value: ValueNode) => {
      //just setting next control should propogate
      let next = value.next;
      //if next is not a form node then at end of chain
      if(next instanceof FormNode) {
        next.setValue();
      }
    });
  }

  public get category(): DatasetFormCategory {

  }

  public get tag(): string {
    return this._details.tag;
  }

  public get description(): string {
    return this._details.description;
  }

  public get next(): FormNode {
    return this._next;
  }

  public setValue(tag?: string): boolean {
    let valueSet = false;
    //either get value to set based on specified tag, or the value specified in details if tag not supplied
    let value = this._values[tag || this._details.value];
    if(value) {
      //set value for form details to new set value
      this._details.value = tag;
      valueSet = true;
    }
    //set value to current value of control to propogate action
    else {
      value = this._control.value;
    }
    //set value
    this._control.setValue(value);
    return valueSet;
  }

  public addValue(value: ValueNode): boolean {
    //if value at tag is undefined then replaced (! converts to bool)
    let replaced = !this._values[value.tag];
    this._values[value.tag] = value;
    //return whether value replaced a previously set value
    return replaced;
  }

  //value is the ValueNode, tag can be gotten from tag property

  public deleteValue(tag: string): boolean {
    let deleted = false;
    //check if tag exists and do not delete default value
    if(!this._values[tag] && tag != this._defaultValueTag) {
      //if deleting currently set value set form to default
      if(this._control.value.tag == tag) {
        this._control.setValue(this._values[this._defaultValueTag]);
      }
      //delete the value at tag
      delete this._values[tag];
      //set return value to true
      deleted = true;
    }
    return deleted;
  }
}

class ValueNode {
  private _details: FormDetails;
  private _next: FormNode | DatasetPropertiesNode;

  constructor(details: FormDetails, next: FormNode | DatasetPropertiesNode) {
    this._next = next;
    this._details = details;
  }

  public get next(): FormNode | DatasetPropertiesNode {
    return this._next;
  }

  public get tag(): string {
    return this._details.tag;
  }

  public get description(): string {
    return this._details.description;
  }

  public get label(): string {
    return this._details.label;
  }
}

////////////////////////////////////////////
////////////////////////////////////////////
////////////////////////////////////////////

type DateType = "range" | "discreet";

class DatasetProperties {

  private _includeStations: boolean;
  private _includeRaster: boolean;
  private _units: string;
  private _unitsShort: string;
  private _dataRange: [number, number];
  private _rangeAbsolute: [boolean, boolean];
  private _dates: [Moment.Moment, Moment.Moment] | string[];
  private _datesType: DateType


  constructor(includeStations: boolean, includeRaster: boolean, units: string, unitsShort: string, dataRange: [number, number], rangeAbsolute: [boolean, boolean], dates: [Moment.Moment, Moment.Moment] | string[], datesType: DateType) {
    this._includeStations = includeStations;
    this._includeRaster = includeRaster;
    this._units = units;
    this._dataRange = dataRange;
    this._rangeAbsolute = rangeAbsolute;
    this._dates = dates;
    this._datesType = datesType;
  }

  public get includeStations(): boolean {
    return this._includeStations;
  }

  public get includeRaster(): boolean {
    return this._includeRaster;
  }

  public get units(): string {
    return this._units;
  }

  public get unitsShort(): string {
    return this._unitsShort;
  }

  public get dataRange(): [number, number] {
    return this._dataRange;
  }

  public get rangeAbsolute(): [boolean, boolean] {
    return this._rangeAbsolute;
  }

  public get dates(): [Moment.Moment, Moment.Moment] | string[] {
    return this._dates;
  }

  public get datesType(): DateType {
    return this._datesType;
  }
}
