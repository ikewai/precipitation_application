import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { ActiveFormData, DatasetItem } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-dataset-selector',
  templateUrl: './dataset-selector.component.html',
  styleUrls: ['./dataset-selector.component.scss']
})
export class DatasetSelectorComponent implements OnInit {

  @ViewChild("tabContainer", {static: false}) tabContainer: ElementRef;

  @Output() dataset: EventEmitter<DatasetItem> = new EventEmitter<DatasetItem>();

  formData: ActiveFormData<DatasetItem>;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    let element = this.tabContainer.nativeElement;
    this.respondToVisibility(element, (intersects, observer) => {
      if(intersects) {
        window.dispatchEvent(new Event("resize"));
        observer.unobserve(element);
      }
    });
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
}
