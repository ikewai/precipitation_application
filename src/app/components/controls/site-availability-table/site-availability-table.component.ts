import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, AfterContentInit, ChangeDetectorRef, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import {EventParamRegistrarService} from "../../../services/inputManager/event-param-registrar.service";
import { SiteInfo } from 'src/app/models/SiteMetadata';

@Component({
  selector: 'app-site-availability-table',
  templateUrl: './site-availability-table.component.html',
  styleUrls: ['./site-availability-table.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteAvailabilityTableComponent implements AfterViewInit, AfterContentInit {

  @ViewChildren("dataRows") dataRows: QueryList<ElementRef>;
  @ViewChild("tbody") tbody: ElementRef;

  islandNameMap = {
    BI: "Big Island",
    OA: "Oʻahu",
    MA: "Maui",
    KA: "Kauai",
    MO: "Molokaʻi",
    KO: "Kahoʻolawe"
  }

  @Input() set stations(stations: SiteInfo[]) {
    this.tableData.rows = [];
    for(let station of stations) {
      let values = [];
      values.push(station.name);
      values.push(station.skn);
      let island = this.islandNameMap[station.island];
      values.push(island);
      this.tableData.rows.push({
        station: station,
        element: null,
        selected: false,
        values: values
      });
    }
  }


  @Input() set selected(station: SiteInfo) {
    if(station) {
      let index = this.siteMap.get(station);
      //can unfiltered elements be selected? if so remove error and just ignore
      if(index === undefined) {
        console.error(`No mapping for selected site in site table.`);
      }
      else {
        this.selectFromTable(index);
        this.cdr.detectChanges();
      }
    }
    else {
      if(this.selectedRef !== undefined) {
        this.selectedRef.selected = false;
      }
      this.selectedRef = undefined;
    }
    
  }
  @Output() selectedChange: EventEmitter<SiteInfo> = new EventEmitter<SiteInfo>();


  tableData: TableFormat;
  siteMap: Map<SiteInfo, number>;
  selectedRef: RowRef;

  constructor(private cdr: ChangeDetectorRef) {
    this.siteMap = new Map<SiteInfo, number>();
    this.tableData = {
      header: ["Name", "SKN", "Island"],
      rows: []
    }

  }

  generateRowMap(rows: QueryList<ElementRef>) {
    this.siteMap.clear();
    rows.forEach((row: ElementRef, i: number) => {
      let rowRef = this.tableData.rows[i];
      rowRef.element = row;
      this.siteMap.set(rowRef.station, i);
    });
  }

  ngAfterViewInit() {
    this.generateRowMap(this.dataRows);
    this.dataRows.changes.subscribe((rows: QueryList<ElementRef>) => {
      //console.log(rows);
      this.generateRowMap(rows);
    });
    // this.paramService.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.selectedSite, (site: SiteInfo) => {
    //   // if(site === null) {
    //   //   if(this.selectedRef !== undefined) {
    //   //     this.selectedRef.selected = false;
    //   //   }
    //   //   this.cdr.detectChanges();
    //   // }
      

    // });
  }

  ngAfterContentInit() {

  }

  setSelected(selected: ElementRef, i: number) {
    let site = this.tableData.rows[i].station;
    // this.paramService.pushSiteSelect(site);
    this.selectedChange.emit(site);
  }

  selectFromTable(rowIndex: number) {
    if(this.selectedRef !== undefined) {
      this.selectedRef.selected = false;
    }

    this.selectedRef = this.tableData.rows[rowIndex];
    let selectedEl = this.selectedRef.element.nativeElement;
    let position = selectedEl.offsetTop - 30;
    let tbodyEl = this.tbody.nativeElement;
    let viewRange = [tbodyEl.scrollTop, tbodyEl.scrollTop + tbodyEl.offsetHeight];
    if(position < viewRange[0] || position >= viewRange[1]) {
      tbodyEl.scrollTo(0, position);
    }
    console.log(this.selectedRef);
    this.selectedRef.selected = true;
  }

}

interface TableFormat {
  header: string[],
  rows: RowRef[]
}

interface RowRef {
  station: SiteInfo,
  element: ElementRef,
  selected: boolean,
  values: string[]
}

//class Two
