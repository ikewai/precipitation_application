import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { DisplayData } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-dataset-tab',
  templateUrl: './dataset-tab.component.html',
  styleUrls: ['./dataset-tab.component.scss']
})
export class DatasetTabComponent implements OnInit {

  @Input("tabData") tabData: DisplayData[];
  @Input("order") order: string[];

  @Output() selected: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild("tabs", {static: false}) tabs: MatTabGroup;

  constructor() { }

  ngOnInit() {
    this.orderTabs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.order || changes.tabData) {
        this.orderTabs();
    }
  }

  orderTabs(): void {
    if(this.order) {
      let orderedTabData = new Array(this.order.length);
      for(let item of this.tabData) {
        let i = this.order.indexOf(item.tag);
        if(i == -1) {
          orderedTabData.push(item);
        }
        else {
          orderedTabData[i] = item;
        }
      }
      this.tabData = orderedTabData;
    }
  }

  selectTab(): void {
    let i = this.tabs.selectedIndex;
    this.selected.emit(this.tabData[i].tag);
  }

}
