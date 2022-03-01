import { Injectable } from '@angular/core';
import { DbConService, RequestResults } from "./auxillary/dbCon/db-con.service";
import { RasterData } from '../../models/RasterData';
import {DataProcessorService} from "../dataProcessor/data-processor.service";

export { RequestResults };

//main service for data requestor, handles requests, gets and combines site metadata and values with site management services
//eventually also routes requests for remote raster data fetching
@Injectable({
  providedIn: 'root'
})
export class DataRequestorService {
  static readonly GEOTIFF_NODATA = -3.3999999521443642e+38;

  constructor(private dbcon: DbConService, private processor: DataProcessorService) {}

  getRasterHeader(properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("prew1", properties);
    console.log(query);
    let timingMessage = `Retreived raster header`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    //extract first document
    response.transform((response: any[]) => {
      console.log(response);
      let header = null;
      if(response != null) {
        header = response[0];
      }
      return header;
    });
    return response;
  }

  // getDateRange(properties: any, delay?: number): RequestResults {
  //   let query = this.propertiesToQuery("hcdp_station_value_range", properties);
  //   let timingMessage = `Retreived date range data`;
  //   let response = this.basicQueryDispatch(query, delay, timingMessage);
  //   return response;
  // }

  getRaster(properties: any, delay?: number): RequestResults {
    let start = new Date().getTime();
    let response = this.dbcon.getRaster(properties, delay);
    response.transform((data: ArrayBuffer) => {
      let time = new Date().getTime() - start;
      let timeSec = time / 1000;
      console.log(`Retreived raster data for ${properties.date}, time elapsed ${timeSec} seconds`);

      let handler = null;
      //if query wasn't cancelled process array buffer to raster data
      if(data != null) {
        //transform array buffer to raster data
        return this.processor.getRasterDataFromGeoTIFFArrayBuffer(data, DataRequestorService.GEOTIFF_NODATA)
        .then((rasterData: RasterData) => {
          return rasterData
        });
      }

      return handler;
    });

    return response;
  }

  getStationData(properties: any, delay?: number): RequestResults {
    properties = Object.assign({}, properties);
    delete properties.dateRange;
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    console.log(query);
    let timingMessage = `Retreived station data for ${properties.date}`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    return response;
  }

  getStationMetadata(properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("hcdp_station_metadata", properties);
    let timingMessage = `Retreived station metadata`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    return response
  }

  getStationTimeSeries(start: string, end: string, properties: any, delay?: number): RequestResults {
    let query = this.propertiesToQuery("hcdp_station_value", properties);
    query = `{'$and':[${query},{'value.date':{'$gte':'${start}'}},{'value.date':{'$lt':'${end}'}}]}`;
    let timingMessage = `Retreived station ${properties.skn} timeseries for ${start}-${end}`;
    let response = this.basicQueryDispatch(query, delay, timingMessage);
    return response;
  }

  private basicQueryDispatch(query: string, delay?: number, timingMessage?: string): RequestResults {
    let start = new Date().getTime();
    let response = this.dbcon.queryMetadata(query, delay);
    response.transform((response: any) => {
      //if provided with a timing message print timing
      if(timingMessage) {
        let time = new Date().getTime() - start;
        let timeSec = time / 1000;
        let message = `${timingMessage}, time elapsed ${timeSec} seconds`;
        console.log(message);
      }

      let vals: any[] = null;
      //if query is not cancelled extract value fields
      if(response != null) {
        //extract value fields from results
        vals = response.result.map((metadata: any) => {
          return metadata.value;
        });
      }
      return vals;
    });

    return response;
  }

  private propertiesToQuery(name: string, properties: any): string {
    let query = `{'name':'${name}'`
    for(let property in properties) {
      let value = properties[property];
      query += `,'value.${property}':'${value}'`
    }
    query += "}";
    return query;
  }
}