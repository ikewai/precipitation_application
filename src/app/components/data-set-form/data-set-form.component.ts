import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import {EventParamRegistrarService} from "../../services/inputManager/event-param-registrar.service";
import { FormControl } from '@angular/forms';
import { ActiveFormData, DatasetFormManagerService, FocusData, FormManager, FormNode, VisDatasetItem } from 'src/app/services/dataset-form-manager.service';
import { StringMap } from '@angular/compiler/src/compiler_facade_interface';
import { MatTabGroup } from '@angular/material/tabs';

@Component({
  selector: 'app-data-set-form',
  templateUrl: './data-set-form.component.html',
  styleUrls: ['./data-set-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataSetFormComponent implements OnInit, AfterViewInit {
  @ViewChild("t1", {static: false}) t1: MatTabGroup;
  @ViewChild("t2", {static: false}) t2: MatTabGroup;
  
  @ViewChild("tabContainer", {static: true}) tabContainer: ElementRef;
  t1i = 1;
  t2i = 0;

  formData: ActiveFormData<VisDatasetItem>;
  controls: {[field: string]: FormControl};
  debounce: boolean = false;
  changes: boolean = false;
  label: string = "";

  optionNodes: {node: FormNode, control: FormControl}[];

  dataset: VisDatasetItem;

  private _formManager: FormManager<VisDatasetItem>;

  constructor(private paramService: EventParamRegistrarService, private formService: DatasetFormManagerService, private cdr: ChangeDetectorRef) {
    this._formManager = formService.visFormManager;
    let formData = this._formManager.getFormData();
    this.formData = formData;
    //set up form controls
    this.controls = {}
    this.setControlValues(formData.values);
    this.updateDataset();
  }

  changeDataset(t1i: number, t2i: number = -1) {
    console.log(this.t1, this.t2);
    let datatype = null;
    if(t1i < this.formData.datasetFormData.datasetGroups.length && t2i >= 0) {
      console.log(t2i);
      datatype = this.formData.datasetFormData.datasetGroups[t1i].values[t2i].tag;
    }
    else if(t1i >= this.formData.datasetFormData.datasetGroups.length) {
      t1i -= this.formData.datasetFormData.datasetGroups.length;
      console.log(t1i, this.formData.datasetFormData.datasetValues);
      datatype = this.formData.datasetFormData.datasetValues[t1i].tag;
    }
    this.controls.datatype.setValue(datatype);
  }

  setControlValues(values: StringMap) {
    //don't trigger recomp in listeners while setting values
    this.debounce = true;
    for(let field in values) {
      let value = values[field];
      let control: FormControl = this.controls[field];
      if(control === undefined) {
        control = new FormControl(value);
        this.controls[field] = control;
        control.valueChanges.subscribe((value: string) => {
          //make sure not being changed by control correction
          if(!this.debounce) {
            this.formData = this._formManager.setValue(field, value);
            this.setControlValues(this.formData.values);
            this.changes = true;
          }
        });
      }
      else {
        control.setValue(value);
      }
    }
    //turn off debounce
    this.debounce = false;
  }

  ngOnInit() {
    let params = ["datatype", "period", "dsm", "model", "season", "ds_period", "fill"]
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    for(let param of params) {
      let value = urlParams.get(param);
      let control = this.controls[param];
      if(value && control) {
        control.setValue(value);
      }
    }
    if(this.changes) {
      //let changes propogate before pushing
      setTimeout(() => {
        this.updateDataset();
        //trigger change detection
        this.cdr.detectChanges();
      }, 0);
    }

  }

  ngAfterViewInit() {
    // setTimeout(() => {
    //   this.t1._handleClick(this.t1._tabs.first, {
    //     _alignInkBarToSelectedTab: () => {},
    //     focusIndex: 1
    //   }, this.t1._tabs.first.position);
    // }, 100);
    let mouseEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
    });
    console.log(document.getElementById("t1").firstChild.childNodes[1].firstChild.firstChild.childNodes[1]);
    //document.getElementById("t1").firstChild.childNodes[1].firstChild.firstChild.childNodes[1].dispatchEvent(mouseEvent);
    setTimeout(() => {
      // console.log("click!");
      // console.log(document.getElementById("t1").firstChild.childNodes[1].firstChild.firstChild.lastChild);
      // document.getElementById("t1").firstChild.childNodes[1].firstChild.firstChild.childNodes[1].dispatchEvent(mouseEvent);
      // let bounds = document.getElementById("t1").getBoundingClientRect();
      // console.log(bounds);
      
      // let element = document.elementFromPoint(bounds.left, bounds.top);
      // element.dispatchEvent(mouseEvent);

    }, 5000);
    

    // let tabContainerEl: HTMLElement = this.tabContainer.nativeElement;
    // let firstTab: Element = <HTMLElement>tabContainerEl.children[0];
    // console.log(tabContainerEl.bo);
    
    // console.log(this.t1);
    // console.log(this.t1._tabs.first);
    // // this.t1._tabs.first.isActive = false;
    // // this.t1._tabs.first.isActive = true;
  }

  updateDataset() {
    this.changes = false;
    let dataset: VisDatasetItem = this.formData.datasetItem;
    this.label = dataset.label;
    this.dataset = dataset;
    this.paramService.pushDataset(dataset);
    this.updateOptionData();
  }

  updateOptionData() {
    if(this.dataset.optionData) {
      let typeControl = new FormControl(this.dataset.optionData.type)
      this.optionNodes = [{
        node: this.dataset.optionData.typeNode,
        control: typeControl
      }];
      typeControl.valueChanges.subscribe((type: string) => {
        this.dataset.optionData.type = type;
        this.updateOptionData();
      });
      if(this.dataset.optionData.unitNode) {
        let unitControl = new FormControl(this.dataset.optionData.unit);
        this.optionNodes.push({
          node: this.dataset.optionData.unitNode,
          control: unitControl
        });
        unitControl.valueChanges.subscribe((unit: string) => {
          this.dataset.optionData.unit = unit;
          this.updateOptionData();
        });
      }
      let focusData = new FocusData("selector", undefined, this.dataset.optionData.paramData, this.dataset.optionData);
      this.paramService.pushFocusData(focusData);
    }
    else {
      this.optionNodes = [];
    }
  }
}
