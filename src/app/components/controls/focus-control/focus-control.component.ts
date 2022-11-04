import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import { DatasetItem, FocusManager, FormValue, TimeSelectorData, TimeseriesData } from 'src/app/services/dataset-form-manager.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';

@Component({
  selector: 'app-focus-control',
  templateUrl: './focus-control.component.html',
  styleUrls: ['./focus-control.component.scss']
})
export class FocusControlComponent implements OnInit {
  focusManager: FocusManager<unknown>;
  date: Moment;
  selection: FormValue;

  constructor(private paramService: EventParamRegistrarService) {
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: DatasetItem) => {
      this.focusManager = dataset?.focusManager;
    });
  }

  ngOnInit() {
  }

  castTimeseriesManager(): TimeseriesData {
    return <TimeseriesData>this.focusManager;
  }

  castSelectorManager(): TimeSelectorData {
    return <TimeSelectorData>this.focusManager;
  }

  setFocus(focus: unknown) {
    if(this.focusManager.type == "timeseries") {
      this.date = <Moment>focus;
    }
    else {
      this.selection = <FormValue>focus;
    }
    let focusData = this.focusManager.getFocusData(focus);
    this.paramService.pushFocusData(focusData);
  }

}
