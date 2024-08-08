import { Moment } from "moment";
import { TimeseriesHandler } from "./timeseries";
import { StringMap } from "../types";
import { RasterHandler } from "./handlers";


let queryHandlerMap = {
    raster: RasterHandler,
    station: StationHandler
}

class Dataset {
    private timeseriesHandler: TimeseriesHandler
    private layer

    constructor(baseParams: StringMap, stationParams: StringMap, rasterParams: StringMap) {
        this.timeseriesHandler.date.subscribe((date: Moment) => {
            new queryHandlerMap.raster()
        });
    }

    get timeseries(): TimeseriesHandler {
        return this.timeseriesHandler;
    }

    private date
}