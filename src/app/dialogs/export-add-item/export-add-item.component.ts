import { AfterViewInit, Component, ElementRef, Inject, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTabGroup } from '@angular/material';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Moment } from 'moment';
import { Subscription } from 'rxjs';
import { StringMap } from 'src/app/models/types';
import { ActiveFormData, DatasetFormManagerService, ExportDatasetItem, FormManager, FileProperty, FileData, UnitOfTime, DatasetSelectorGroup, FormValue } from 'src/app/services/dataset-form-manager.service';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';

@Component({
  selector: 'app-export-add-item',
  templateUrl: './export-add-item.component.html',
  styleUrls: ['./export-add-item.component.scss']
})
export class ExportAddItemComponent implements AfterViewInit {
  private static readonly FORM_ORDER = ["historical_rainfall", "historical_temperature", "rh", "ndvi", "downscaled", "contemporary_climatology", "legacy_climatology"];

  @ViewChild("t1", {static: false}) t1: MatTabGroup;
  @ViewChildren("t2") t2: QueryList<MatTabGroup>;
  @ViewChild("tabContainer", {static: false}) tabContainer: ElementRef;

  datasetData: DatasetData[];

  formData: ActiveFormData<ExportDatasetItem>;
  controls: ExportControlData;
  private lockDatasetUpdates: boolean;

  private _formManager: FormManager<ExportDatasetItem>;
  private initTabs: number[][];

  numSelected: number;

  constructor(public dialogRef: MatDialogRef<ExportAddItemComponent>, @Inject(MAT_DIALOG_DATA) public data: FormState, private dateManager: DateManagerService, private formService: DatasetFormManagerService) {
    //reset the state on close, can remove this if want to save when closing form, probably want it to reset to a default
    dialogRef.afterClosed().subscribe(() => {
      this._formManager.resetState();
    });
    this._formManager = formService.exportFormManager;
    this.initializeControls(data);
    this.setupDatasetData();
  }


  ngAfterViewInit() {
    setTimeout(() => {
      if(this.initTabs) {
        this.t1.selectedIndex = this.initTabs[0][0];
        if(this.initTabs.length > 1) {
          let [ groupIndex, t2i ] = this.initTabs[1];
          this.t2.toArray()[groupIndex].selectedIndex = t2i;
        }
        setTimeout(() => {
            this.initTabs = undefined;
        }, 400);
      }
    }, 400);
    
  }

  respondToVisibility(element: HTMLElement, callback: (intersects: boolean, observer: IntersectionObserver) => any) {
    let options = {
      root: document.documentElement
    };

    let observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        callback(entry.intersectionRatio > 0, observer);
      });
    }, options);

    observer.observe(element);
  }

  changeDataset() {
    window.dispatchEvent(new Event("resize"));
    //already set if being initialized
    if(this.initTabs) {
      return;
    }
    let t1i = this.t1.selectedIndex;
    let datatype = null;
    if(this.datasetData[t1i].type == "group") {
      let groupData = <DatasetGroupData>this.datasetData[t1i];
      let t2i = this.t2.toArray()[groupData.groupIndex].selectedIndex;
      datatype = groupData.data.values[t2i].tag;
    }
    else {
      let setData = <DatasetSetData>this.datasetData[t1i];
      datatype = setData.data.tag;
    }
    this.updateDatatype(datatype);
  }


  setupDatasetData() {
    this.datasetData = new Array(ExportAddItemComponent.FORM_ORDER.length);
    for(let group of this.formData.datasetFormData.datasetGroups) {
      let i = ExportAddItemComponent.FORM_ORDER.indexOf(group.tag);
      this.datasetData[i] = <DatasetGroupData>{
        type: "group",
        data: group,
        groupIndex: -1
      };
    }
    for(let set of this.formData.datasetFormData.datasetValues) {
      let i = ExportAddItemComponent.FORM_ORDER.indexOf(set.tag);
      this.datasetData[i] = <DatasetSetData>{
        type: "set",
        data: set
      };
    }
    let groupIndex = 0;
    for(let i = 0; i < this.datasetData.length; i++) {
      if(this.datasetData[i].type == "group") {
        (<DatasetGroupData>this.datasetData[i]).groupIndex = groupIndex++;
      }
    }
  }


  private initializeControls(initValues: FormState) {
    this.controls = {
      dataset: {},
      fileGroups: {}
    };
    let formData: ActiveFormData<ExportDatasetItem>;
    if(initValues) {
      this.initTabs = initValues.tabs;
      formData = this._formManager.setValues(initValues.dataset);
    }
    else {
      formData = this._formManager.getFormData();
    }
    this.formData = formData;
    let {...values} = formData.values;
    //initialize date values to date range
    if(initValues?.dates) {
      this.controls.dates = {
        ...initValues.dates
      }
    }
    else if(!initValues) {
      this.controls.dates = {
        start: this.formData.datasetItem.start,
        end: this.formData.datasetItem.end
      }
    }
    //setup variable controls
    this.setupDatasetControls(values);
    this.setupFileGroupControls(initValues?.fileGroups);
  }

  private updateDatatype(value: string) {
    let formData = this._formManager.setDatatype(value);
    this.formData = formData;
    if(!this.controls.dates && formData.datasetItem.start) {
      this.controls.dates = {
        start: this.formData.datasetItem.start,
        end: this.formData.datasetItem.end
      }
    }
    let {datatype, ...values} = formData.values;
    //unsubscribe from controls so new ones can be created
    this.cleanupControlSubscriptions();
    this.setupDatasetControls(values);
    this.setupFileGroupControls(null);
  }

  private setupDatasetControls(controlValues: StringMap) {
    for(let field in controlValues) {
      let control = new FormControl(controlValues[field]);
      let sub = control.valueChanges.subscribe((value) => {
        if(!this.lockDatasetUpdates) {
          let formData = this._formManager.setValue(field, value);
          this.formData = formData;
          let {datatype, ...values} = formData.values;
          this.updateDatasetControlValues(values);
          this.cleanupFileGroupControlSubscriptions();
          this.setupFileGroupControls(null);
        }
      });
      this.controls.dataset[field] = {
        control,
        sub
      }
    }
  }

  private updateDatasetControlValues(values: StringMap) {
    this.lockDatasetUpdates = true;
    for(let tag in values) {
      this.controls.dataset[tag].control.setValue(values[tag]);
    }
    this.lockDatasetUpdates = false;
  }

  private setupFileGroupControls(initValues: FileGroupStates) {
    this.numSelected = 0;
    for(let group of this.formData.datasetItem.fileGroups) {
      let groupValues = initValues ? initValues[group.tag] : null;
      let filePropertyControls = this.getFilePropertyControls(group.additionalProperties, groupValues?.fileProps);
      let fileSelectControls = this.getFileSelectControls(group.fileData, groupValues?.files);
      this.controls.fileGroups[group.tag] = {
        fileProps: filePropertyControls,
        files: fileSelectControls
      };
    }
  }

  private getFilePropertyControls(properties: FileProperty[], initValues: FilePropState): Controls {
    let filePropertyControls: Controls = {};
    //set up file property controls
    for(let field of properties) {
      let tag = field.formData.tag;
      let defaults = initValues ? initValues[tag] : field.defaultValues;
      let control = new FormControl(defaults);
      let lastValues = defaults;
      let sub = control.valueChanges.subscribe((values: string[]) => {
        if(values.length < 1) {
          control.setValue(lastValues);
        }
        else {
          lastValues = values;
        }
      });
      filePropertyControls[tag] = {
        control,
        sub
      };
    }
    return filePropertyControls;
  }

  private getFileSelectControls(fileData: FileData[], initValues: FileSelectState): FileControls {
    let fileSelectControls: FileControls = {};
    //set up file select controls
    for(let file of fileData) {
      let tag = file.tag;
      let initValue: boolean = initValues ? initValues[tag] : false;
      //set to false initially, separately set initial values so control listener handles side effects
      let control = new FormControl(initValue);
      if(initValue) {
        this.numSelected++;
      }
      let lastValue = initValue;
      let sub = control.valueChanges.subscribe((value: boolean) => {
        //use to debounce same values if toggled due to requirements
        if(value == lastValue) {
          return;
        }
        if(value) {
          this.numSelected++;
          //update required files
          for(let tag of file.requires) {
            let requiredControlData = fileSelectControls[tag];
            requiredControlData.reqCount++;
            requiredControlData.data.control.setValue(true);
          }
          lastValue = value;
        }
        //if trying to unselect check if required, if it is reselect
        else if(controlData.reqCount > 0) {
          control.setValue(true);
        }
        else {
          this.numSelected--;
          //update required file counts
          for(let tag of file.requires) {
            let requiredControlData = fileSelectControls[tag];
            requiredControlData.reqCount--;
          }
          lastValue = value;
        }
      });
      let controlData = {
        data: {
          control, sub
        },
        reqCount: 0
      };
      fileSelectControls[tag] = controlData;
    }
    return fileSelectControls;
  }

  //cleanup
  cleanupControlSubscriptions() {
    this.cleanupDatasetControlSubscriptions();
    this.cleanupFileGroupControlSubscriptions();
  }

  cleanupDatasetControlSubscriptions() {
    for(let tag in this.controls.dataset) {
      this.controls.dataset[tag].sub.unsubscribe();
    }
    this.controls.dataset = {};
  }

  cleanupFileGroupControlSubscriptions() {
    for(let groupTag in this.controls.fileGroups) {
      let fileProps = this.controls.fileGroups[groupTag].fileProps;
      for(let tag in fileProps) {
        fileProps[tag].sub.unsubscribe();
      }
      let files = this.controls.fileGroups[groupTag].files;
      for(let tag in files) {
        files[tag].data.sub.unsubscribe();
      }
    }
    this.controls.fileGroups = {};
  }

  //return info about the export item
  cancel(): void {
    this.dialogRef.close(null);
  }

  submit() {
    let t1i = this.t1.selectedIndex;
    let tabs: number[][] = [[t1i]];
    let datatype: string;
    if(this.datasetData[t1i].type == "group") {
      let groupData = <DatasetGroupData>this.datasetData[t1i];
      let t2i = this.t2.toArray()[groupData.groupIndex].selectedIndex;
      tabs.push([groupData.groupIndex, t2i]);
      datatype = groupData.data.values[t2i].tag;
    }
    else {
      let setData = <DatasetSetData>this.datasetData[t1i];
      datatype = setData.data.tag;
    }
    //construct state
    let exportData: ExportPackageItemData = {
      datasetItem: this.formData.datasetItem,
      state: {
        tabs: tabs,
        dataset: {
          datatype
        },
        fileGroups: {}
      },
      labels: {
        dataset: null,
        files: null
      }
    }
    if(this.formData.datasetItem.start) {
      exportData.state.dates = {
        start: this.controls.dates.start,
        end: this.controls.dates.end,
        unit: this.formData.datasetItem.timeseriesHandler.unit,
        interval: this.formData.datasetItem.timeseriesHandler.interval
      };
    }
    let fileLabels = [];
    let datasetLabel = `${this.formData.datasetItem.label}`;
    if(this.formData.datasetItem.timeseriesHandler) {
      datasetLabel += ` ${this.formData.datasetItem.timeseriesHandler.getLabel(this.controls.dates.start)} - ${this.formData.datasetItem.timeseriesHandler.getLabel(this.controls.dates.end)}`;
    }
    exportData.labels.dataset = datasetLabel;
    for(let field in this.controls.dataset) {
      exportData.state.dataset[field] = this.controls.dataset[field].control.value;
    }
    for(let fileGroup of this.formData.datasetItem.fileGroups) {
      let groupTag = fileGroup.tag;
      exportData.state.fileGroups[groupTag] = {
        fileProps: {},
        files: {}
      };
      for(let propTag in this.controls.fileGroups[groupTag].fileProps) {
        exportData.state.fileGroups[groupTag].fileProps[propTag] = this.controls.fileGroups[groupTag].fileProps[propTag].control.value;
      }
      for(let fileData of fileGroup.fileData) {
        let fileTag = fileData.tag;
        let selected = this.controls.fileGroups[groupTag].files[fileTag].data.control.value;
        exportData.state.fileGroups[groupTag].files[fileTag] = selected;
        if(selected) {
          fileLabels.push(fileData.label);
        }
      }
    }
    exportData.labels.files = fileLabels.join(", ");

    this.dialogRef.close(exportData);
  }
}

export interface FormState {
  tabs: number[][],
  dataset: StringMap,
  dates?: DateState,
  fileGroups: FileGroupStates
}

export type FileGroupStates = {[tag: string]: FileGroupState};

export interface FileGroupState {
  fileProps: FilePropState,
  files: FileSelectState
}

export type FilePropState = {[tag: string]: string[]};
export type FileSelectState = {[tag: string]: boolean};

interface FileControl {
  reqCount: number,
  data: ControlData
}

type Controls = {[tag: string]: ControlData}
type FileControls = {[tag: string]: FileControl}

interface ControlData {
  control: FormControl,
  sub: Subscription
}

interface FileGroupControls {
  [tag: string]: {
    fileProps: Controls,
    files: FileControls
  }
}

interface ExportControlData {
  dataset: Controls,
  dates?: {
    start: Moment,
    end: Moment
  },
  fileGroups: FileGroupControls
}

export interface DateState {
  start: Moment,
  end: Moment,
  unit: UnitOfTime,
  interval: number
}

export interface LabelData {
  dataset: string,
  files: string
}

export interface ExportPackageItemData {
  datasetItem: ExportDatasetItem,
  state: FormState,
  labels: LabelData
}



interface DatasetData {
  type: "set" | "group",
  data: DatasetSelectorGroup | FormValue
};

interface DatasetSetData extends DatasetData {
  type: "set",
  data: FormValue
};

interface DatasetGroupData extends DatasetData {
  type: "group",
  data: DatasetSelectorGroup,
  groupIndex: number
};
