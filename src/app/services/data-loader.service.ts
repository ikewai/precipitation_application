import { Injectable } from '@angular/core';
import {RasterData, RasterHeader, BandData} from "../models/RasterData";
import {GeotiffDataLoaderService} from "./geotiff-data-loader.service";
import {DbConService} from "./db-con.service";
import {DataBands} from "./data-manager.service";
import {MetadataStoreService, SKNRefMeta} from "./siteManagement/metadata-store.service";
import {SiteValueFetcherService} from "./siteManagement/site-value-fetcher.service"

@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {

  constructor(private geotiffLoader: GeotiffDataLoaderService, private siteMeta: MetadataStoreService, private fetcher: SiteValueFetcherService) { }

  public getInitData(): Promise<InitData> {
    let dataPromises = [this.getSiteMeta(), this.getInitRasterDataFromFile()];
    return Promise.all(dataPromises).then((data: any[]) => {
      //console.log(data);
      return {
        rasterData: data[1],
        siteMeta: data[0]
      };
    });
  }

  private getSiteMeta(): Promise<any> {
    let metaPromise = this.siteMeta.getMetaBySKNs(null);
    return metaPromise.then((meta: SKNRefMeta) => {
      console.log(Object.values(meta));
      return Object.values(meta);
    });
  }

  private getInitRasterDataFromFile(): Promise<RasterBreakdown> {
    let promises = [
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_a.tif", -3.3999999521443642e+38),
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_b.tif", -3.3999999521443642e+38),
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_c.tif", -3.3999999521443642e+38),
      this.geotiffLoader.getDataFromGeotiff("/assets/test_data/test_d.tif", -3.3999999521443642e+38)
    ];
    return Promise.all(promises).then((geotiffData: RasterData[]) => {
      //console.log(geotiffData);
      return {
        header: geotiffData[0].getHeader(),
        data: {
          rainfall: geotiffData[0].getBands(["0"])[0],
          anomaly: geotiffData[1].getBands(["0"])[0],
          se_rainfall: geotiffData[2].getBands(["0"])[0],
          se_anomaly: geotiffData[3].getBands(["0"])[0]
        }
      }
    });
  }

  //eventually need to have data come from database storage (most recent data)
  private getInitRasterData() {
    throw new Error("Not implemented");
  }
}

export interface InitData {
  rasterData: RasterBreakdown,
  siteMeta: any
}

export interface RasterBreakdown {
  header: RasterHeader,
  data: DataBands
}