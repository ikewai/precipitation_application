import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import Moment from 'moment';
import {MatIconRegistry} from "@angular/material/icon";
import { AssetManagerService } from 'src/app/services/util/asset-manager.service';
import { TimeseriesData } from 'src/app/services/dataset-form-manager.service';

@Component({
  selector: 'app-date-focus',
  templateUrl: './date-focus.component.html',
  styleUrls: ['./date-focus.component.scss']
})
export class DateFocusComponent implements OnInit {

  _timeseriesData: TimeseriesData;
  @Input() set timeseriesData(data: TimeseriesData) {
    this._timeseriesData = data;
    //set setDate to null so debounce isn't triggered on control set
    this.setDate = null;
    this.constructDateMoveData(data);
    //trigger recompute
    if(this.controlDate) {
      this.controlDate = this._timeseriesData.roundToInterval(this.controlDate);
    }
  };
  @Input() initValue: Moment.Moment;
  @Output() dateChange: EventEmitter<Moment.Moment> = new EventEmitter<Moment.Moment>();

  //decouple to prevent rebound when date corrected in date component
  setDate: Moment.Moment;
  controlDate: Moment.Moment;

  dateMoveData: MoveButtonData;

  constructor(private matIconRegistry: MatIconRegistry, private assetService: AssetManagerService) {
    let icon = assetService.getTrustedResourceURL("/icons/fl_m.svg");
    this.matIconRegistry.addSvgIcon("fl", icon);
    icon = assetService.getTrustedResourceURL("/icons/ffl_m.svg");
    this.matIconRegistry.addSvgIcon("ffl", icon);
    icon =  assetService.getTrustedResourceURL("/icons/el_m.svg");
    this.matIconRegistry.addSvgIcon("el", icon);
    icon =  assetService.getTrustedResourceURL("/icons/fr_m.svg");
    this.matIconRegistry.addSvgIcon("fr", icon);
    icon =  assetService.getTrustedResourceURL("/icons/ffr_m.svg");
    this.matIconRegistry.addSvgIcon("ffr", icon);
    icon =  assetService.getTrustedResourceURL("/icons/er_m.svg");
    this.matIconRegistry.addSvgIcon("er", icon);
  }

  ngOnInit() {
    let initDate = this.initValue ? this.initValue : this._timeseriesData.defaultValue;
    initDate = this._timeseriesData.roundToInterval(initDate);
    this.controlDate = initDate;
  }

  dateChanged(date: Moment.Moment) {
    let transformedDate = this._timeseriesData.roundToInterval(date);
    if(!date.isSame(transformedDate)) {
      this.controlDate = transformedDate;
    }
    else if(!transformedDate.isSame(this.setDate)) {
      this.setDate = transformedDate;
      //check if any controls are disabled
      this.setDisabled(transformedDate);
      this.dateChange.emit(transformedDate);
    }
  }

  setDisabled(date: Moment.Moment) {
    if(date.isSame(this._timeseriesData.end)) {
      this.dateMoveData.forward.disabled = true;
    }
    else {
      this.dateMoveData.forward.disabled = false;
    }
    if(date.isSame(this._timeseriesData.start)) {
      this.dateMoveData.back.disabled = true;
    }
    else {
      this.dateMoveData.back.disabled = false;
    }
  }

  constructDateMoveData(timeseriesData: TimeseriesData) {
    //start of range
    let fUnitStr = `${timeseriesData.interval} ${timeseriesData.unit}`;
    //pluralize if multiple
    if(timeseriesData.interval > 1) {
      fUnitStr += "s";
    }
    let ffUnitStr: string;
    if(timeseriesData.nextPeriod) {
      ffUnitStr = `${timeseriesData.nextPeriod.interval} ${timeseriesData.nextPeriod.unit}`;
      //pluralize if multiple
      if(timeseriesData.nextPeriod.interval > 1) {
        ffUnitStr += "s";
      }
    }

    let dateBack: MoveData[] = [{
      tooltip: `Skip to first ${timeseriesData.unit} in range`,
      icon: "el",
      trigger: () => {
        this.controlDate = timeseriesData.start.clone();
      }
    }];

    if(ffUnitStr !== undefined) {
      dateBack.push({
        tooltip: `Move back ${ffUnitStr}`,
        icon: "ffl",
        trigger: () => {
          this.controlDate = this.setDate.clone().subtract(timeseriesData.nextPeriod.interval, timeseriesData.nextPeriod.unit);
        }
      });
    }

    dateBack.push({
      tooltip: `Previous`,
      icon: "fl",
      trigger: () => {
        this.controlDate = timeseriesData.addInterval(this.setDate, -1);
      }
    });



    let dateForward: MoveData[] = [{
      tooltip: `Next`,
      icon: "fr",
      trigger: () => {
        this.controlDate = timeseriesData.addInterval(this.setDate, 1);
      }
    }];

    if(ffUnitStr !== undefined) {
      dateForward.push({
        tooltip: `Move forward ${ffUnitStr}`,
        icon: "ffr",
        trigger: () => {
          this.controlDate = this.setDate.clone().add(timeseriesData.nextPeriod.interval, timeseriesData.nextPeriod.unit);
        }
      });
    }

    dateForward.push({
      tooltip: `Skip to last ${timeseriesData.unit} in range`,
      icon: "er",
      trigger: () => {
        this.controlDate = timeseriesData.end.clone();
      }
    });

    this.dateMoveData = {
      forward: {
        disabled: false,
        moveData: dateForward
      },
      back: {
        disabled: false,
        moveData: dateBack
      }
    }
  }

  // private moveDate(interval: number, unit: UnitOfTime) {
  //   let newDate = this.setDate.clone();
  //   newDate.add(interval, unit);
  //   this.controlDate = newDate;
  // }

}

interface MoveButtonData {
  forward: DirectionGroup,
  back: DirectionGroup
}

interface DirectionGroup {
  disabled: boolean,
  moveData: MoveData[]
}

interface MoveData {
  tooltip: string,
  icon: string,
  trigger: () => void
}
