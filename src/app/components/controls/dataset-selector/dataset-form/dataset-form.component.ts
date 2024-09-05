import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormData } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-dataset-form',
  templateUrl: './dataset-form.component.html',
  styleUrls: ['./dataset-form.component.scss']
})
export class DatasetFormComponent implements OnInit {

  @Input("formData") formData: FormData;
  @Input("values") values: {[field: string]: string};

  controls: {[field: string]: FormControl};

  constructor() {
    this.controls = {};
  }

  ngOnInit() {
  }

  private setupControls() {
    for(let category of this.formData.categorized) {
      for(let node of category.nodes) {
        //this.checkCreateControl
      }
    }
    for(let node of this.formData.default) {

    }
  }

  private setControls(tag: string) {
    if(!this.controls[tag]) {
      this.controls[tag] = new FormControl();
    }
  }

}
