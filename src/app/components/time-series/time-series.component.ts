import { Component, OnInit, Input } from '@angular/core';
import { SiteInfo } from 'src/app/models/SiteMetadata';
import Moment from "moment";
import { EventParamRegistrarService, LoadingData } from 'src/app/services/inputManager/event-param-registrar.service';
import { Subject } from 'rxjs';
import { VisDatasetItem, FocusData } from 'src/app/services/dataset-form-manager.service';
import { MapLocation } from 'src/app/models/Stations';
import { TimeseriesGraphData } from '../rainfall-graph/rainfall-graph.component';

@Component({
  selector: 'app-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss']
})
export class TimeSeriesComponent implements OnInit {

  @Input() width: number;

  selectedLocation: MapLocation = null;
  complete = false;

  selected: SiteInfo;
  source: Subject<TimeseriesGraphData>;
  date: Moment.Moment;
  axisLabel: string;

  constructor(private paramService: EventParamRegistrarService) {
    this.source = new Subject<TimeseriesGraphData>();
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedLocation, (location: MapLocation) => {
      this.selectedLocation = location;
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.loading, (loadData: LoadingData) => {
      if(loadData && loadData.tag == "timeseries") {
        this.complete = !loadData.loading;
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.timeseries, (data: TimeseriesGraphData) => {
      if(data) {
        this.source.next(data);
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, (focus: FocusData<unknown>) => {
      //should only handle if timeseries type
      if(focus?.type == "timeseries") {
        this.date = <Moment.Moment>focus.data;
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      if(dataset) {
        let axisLabel = `${dataset.datatype} (${dataset.units})`;
        this.axisLabel = axisLabel;
      }
    });
  }

  ngOnInit() {
  }

}
