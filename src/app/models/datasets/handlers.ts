import { RequestFactoryService } from "src/app/services/requests/request-factory.service";
import { StringMap } from "../types";
import { RequestResults } from "src/app/services/requests/request.service";
import { Moment } from "moment";
import {  Subject } from "rxjs";
import { RasterData } from "../RasterData";
import { Station } from "../Stations";

//static layers

class TimeseriesHandler {
    static readonly TIMESERIES_CHUNKS = 500;

    private chunks;

    constructor(dataset: StringMap, start: Moment, end: Moment) {
        //go backwards so newer data loaded first
        let date = end.clone();
        while(date.isSameOrAfter(start)) {
          let end_s: string = date.toISOString();
          date.subtract(300 * timeseriesData.interval, timeseriesData.unit);
          let start_s: string = date.toISOString();
  
          properties.period = timeseriesData.period.tag;
          let timeseriesRes = await exec(start_s, end_s, timeseriesData, location, properties, false);
          this.queries.timeseries.push(timeseriesRes);
        }
    }
}

abstract class DataHandler<T> {
    private emitter: Subject<T>;
    protected params: StringMap;
    protected requestHandler: (params: StringMap) => Promise<RequestResults>;
    protected request: RequestResults;

    constructor(params: StringMap, requestHandler: (params: StringMap) => Promise<RequestResults>) {
        this.params = params;
        this.requestHandler = requestHandler;
        this.emitter = new Subject<T>();
        this.getData();
    }

    public async setDate(date: Moment) {
        this.params.date = date.toISOString();
        this.getData();
    }

    protected async getData() {
        if(this.request) {
            this.request.cancel();
        }
        this.request = await this.requestHandler(this.params);
        this.request.toPromise()
        .then((data: T) => {
            this.emitter.next(data);
        })
        .catch();
    }

    public cancel() {
        this.request.cancel();
    }

    public get data() {
        return this.emitter.asObservable();
    }
}

export class StationHandler extends DataHandler<Station[]> {
    constructor(dataset: StringMap, date: Moment, requestFactory: RequestFactoryService) {
        let params = {
            ...dataset
        }
        if(date !== null) {
            params["date"] = date.toISOString();
        }
        super(params, requestFactory.getStationData);
        requestFactory.getStationTimeseries
    }
}

export class RasterHandler extends DataHandler<RasterData> {
    constructor(dataset: StringMap, type: string, date: Moment, requestFactory: RequestFactoryService) {
        let params = {
            ...dataset,
            type
        }
        if(date !== null) {
            params["date"] = date.toISOString();
        }
        super(params, requestFactory.getStationData);
    }
}