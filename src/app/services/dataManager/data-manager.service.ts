import { Injectable } from '@angular/core';
import { RasterData, IndexedValues, BandData, RasterHeader } from "../../models/RasterData";
import {SiteValue, SiteInfo} from "../../models/SiteMetadata";
import {DataRequestorService, RequestResults} from "../dataLoader/data-requestor.service";
import Moment from 'moment';
import {EventParamRegistrarService} from "../inputManager/event-param-registrar.service";

import { RequestReject } from '../dataLoader/auxillary/dbCon/db-con.service';
import { ErrorPopupService } from '../errorHandling/error-popup.service';
import { DateManagerService } from '../dateManager/date-manager.service';
import { LatLng } from 'leaflet';
import { FocusData, TimeseriesData, VisDatasetItem } from '../dataset-form-manager.service';
import moment from 'moment';




@Injectable({
  providedIn: 'root'
})
export class DataManagerService {


  constructor(private dataRequestor: DataRequestorService, private paramService: EventParamRegistrarService, private errorPop: ErrorPopupService, private dateHandler: DateManagerService) {
    let selectedDataset: VisDatasetItem;
    let selectedStation: any;
    //change to use station group listed in dataset
    let metadataReq: RequestResults = dataRequestor.getStationMetadata({
      station_group: "hawaii_climate_primary"
    });

    metadataReq.transform((data: any) => {
      let metadata = {};
      for(let item of data) {
        //deconstruct
        let { station_group, ...stationMetadata } = item;
        //move id_field to some kind of header describing station group to avoid duplication?
        let idField = stationMetadata.id_field;
        //move this to some kind of header describing station group to avoid duplication?
        //quality of life
        stationMetadata.location = stationMetadata.elevation_m ? new LatLng(stationMetadata.lat, stationMetadata.lng, stationMetadata.elevation_m) : new LatLng(stationMetadata.lat, stationMetadata.lng)
        stationMetadata.value = null;
        let id = stationMetadata[idField];
        //yay for inconsistent data
        id = this.getStandardizedNumericString(id);
        metadata[id] = stationMetadata;
      }
      return metadata;
    });



    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.stations, (stations: any[]) => {
      if(stations && selectedStation) {
        let selected = null;
        for(let station of stations) {
          let idField = station.id_field;
          if(station[idField] == selectedStation[idField]) {
            selected = station;
            break;
          }
        }
        //delay to allow filtered station propogation before emitting
        setTimeout(() => {
          paramService.pushSelectedStation(selected);
        }, 0);
      }
    });
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.dataset, (dataset: VisDatasetItem) => {
      selectedDataset = dataset;
      //reset selected station and timeseries data
      paramService.pushSelectedStation(null);
    });


    let stationRes: RequestResults = null;
    let rasterRes: RequestResults = null;
    let throttle = null;
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.focusData, (focus: FocusData<unknown>) => {
      if(focus) {
        if(stationRes) {
          stationRes.cancel();
        }
        if(rasterRes) {
          rasterRes.cancel();
        }

        let datasetInfo: VisDatasetItem = selectedDataset;

        const { includeStations, includeRaster, rasterParams, stationParams } = datasetInfo;

        paramService.pushLoading({
          tag: "vis",
          loading: true
        });

        let stationPromise = null;
        let rasterPromise = null;
        //if station data is available request station data, otherwise just send null
        if(includeStations) {
          let properties = {
            ...focus.paramData,
            ...stationParams
          }
          stationRes = dataRequestor.getStationData(properties);
          //transform by combining with station data
          stationRes.transform((stationVals: any[]) => {
            //get metadata
            return metadataReq.toPromise()
            .then((metadata: any) => {
              let stations: any[] = stationVals.reduce((acc: any[], stationVal: any) => {
                let stationId = stationVal.station_id;
                //yay for inconsistent data
                let standardizedStationId = this.getStandardizedNumericString(stationId);
                let stationValue = stationVal.value;
                let stationMetadata = metadata[standardizedStationId];
                if(stationMetadata) {
                  let idField = stationMetadata.id_field;
                  //TEMP
                  //set station id (SKN) to id non-standardized id from incoming document so timeseries ret works properly (skn needs to match dataset documents)
                  //uggh
                  stationMetadata[idField] = stationId;
                  stationMetadata.value = stationValue;
                  //copy the station data to a new object to prevent comparison issues (won't trigger change detection because it's the same object)
                  stationMetadata = Object.assign({}, stationMetadata);
                  acc.push(stationMetadata);
                }
                else {
                  console.error(`Could not find metadata for station, station ID: ${stationId}.`);
                }
                return acc;
              }, []);
              return stations;
            })
            .catch((reason: RequestReject) => {
              if(!reason.cancelled) {
                console.error(reason);
                errorPop.notify("error", `Could not retreive station metadata.`);
                return [];
              }
            });
          });
          stationPromise = stationRes.toPromise();
        }
        else {
          stationPromise = Promise.resolve(null);
        }
        //if raster data is available request raster data, otherwise just send null
        if(includeRaster) {
          let properties = {
            returnEmptyNotFound: true,
            extent: "statewide",
            ...focus.paramData,
            ...rasterParams
          }
          rasterRes = dataRequestor.getRaster(properties);
          rasterPromise = rasterRes.toPromise();
        }
        else {
          rasterPromise = Promise.resolve(null);
        }
        let promises: [Promise<any>, Promise<any>] = [stationPromise, rasterPromise];

        //don't have to wait to set data for each
        promises[0].then((stationData: any[]) => {
          paramService.pushStations(stationData);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive station data.`);
            paramService.pushStations(null);
          }
        });

        promises[1].then((raster: RasterData) => {
          paramService.pushRaster(raster);
        })
        .catch((reason: RequestReject) => {
          if(!reason.cancelled) {
            console.error(reason.reason);
            errorPop.notify("error", `Could not retreive raster data.`);
            paramService.pushRaster(null);
          }
        });
        //when both done send loading complete signal
        Promise.allSettled(promises).finally(() => {
          paramService.pushLoading({
            tag: "vis",
            loading: false
          });
        });
      }
    });


    let timeseriesQueries = [];
    //track selected station and emit series data based on
    paramService.createParameterHook(EventParamRegistrarService.EVENT_TAGS.selectedStation, (station: any) => {
      //don't trigger again if already handling this station
      if(!station || !selectedStation || selectedStation[station.id_field] !== station[station.id_field]) {
        //cancel outbound queries and reset query list
        for(let query of timeseriesQueries) {
          query.cancel();
        }
        timeseriesQueries = [];
        selectedStation = station;
        //dispatch query if the dataset has a timeseries component and the selected station is not null
        if(station && selectedDataset.timeseries) {
          let timeseriesData: TimeseriesData = selectedDataset.timeseries;
          paramService.pushLoading({
            tag: "timeseries",
            loading: true
          });
          let datasetInfo: VisDatasetItem = selectedDataset;
          const { stationParams } = datasetInfo;
          let timeseriesPromises = [];
          let startDate = timeseriesData.start;
          let endDate = timeseriesData.end;
          let periods = timeseriesData.stationPeriods;
          for(let periodData of periods) {
            let properties = {
              station_id: station[station.id_field],
              ...stationParams
            }
            //make sure to overwrite period from params
            properties["period"] = periodData.tag;

            //chunk queries by year
            let date = startDate.clone();
            while(date.isSameOrBefore(endDate)) {
              let start_s: string = this.dateHandler.dateToString(date, periodData.unit);
              date.add(1, "year");
              let end_s: string = this.dateHandler.dateToString(date, periodData.unit);
              //note query is [)
              let timeseriesRes = dataRequestor.getStationTimeSeries(start_s, end_s, properties);

              timeseriesRes.transform((timeseriesData: any[]) => {
                if(timeseriesData.length > 0) {
                  let transformed = {
                    stationId: timeseriesData[0].station_id,
                    period: timeseriesData[0].period,
                    values: timeseriesData.map((item: any) => {
                      return {
                        value: item.value,
                        date: Moment(item.date)
                      }
                    })
                  }
                  return transformed;
                }
                else {
                  return null;
                }
              });
              timeseriesQueries.push(timeseriesRes);

              let timeseriesPromise = timeseriesRes.toPromise();
              timeseriesPromise.then((timeseriesData: any) => {
                if(timeseriesData) {
                  paramService.pushStationTimeseries(timeseriesData);
                }
              })
              .catch((reason: RequestReject) => {
                //if failed not cancelled print reason to stderr
                if(!reason.cancelled) {
                  console.error(reason.reason);
                }
              });

              timeseriesPromises.push(timeseriesPromise);
            }
          }
          //when all timeseries promises are complete push out loading complete signal
          Promise.allSettled(timeseriesPromises).then(() => {
            paramService.pushLoading({
              tag: "timeseries",
              loading: false
            });
          });
        }
      }

    });

  }

  //of course the data has no standardization, so enforce a standard pattern for numeric strings here
  getStandardizedNumericString(id: string): string {
    //standardize numeric values by converting to a number and back to a string (will remove trailing .0 if exists)
    let standardized = Number(id).toString();
    //if non-numeric just reflect
    if(standardized == "NaN") {
      standardized = id;
    }
    return standardized;
  }



}

