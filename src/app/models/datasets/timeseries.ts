import { DurationInputArg2, Moment } from "moment";
import { BehaviorSubject, Observable } from "rxjs";

interface PeriodData {
    interval: number,
    unit: DurationInputArg2
}

export abstract class TimeseriesHandler {
    protected magnitudes: PeriodData[];
    protected _start: Moment;
    protected _end: Moment;
    protected _date: Moment;
    private emitter: BehaviorSubject<Moment>;

    constructor(start: Moment, end: Moment, magnitudes: PeriodData[], defaultDate?: Moment) {
        this._start = start;
        this._end = end;
        this.magnitudes = magnitudes;
        if(defaultDate === undefined) {
            this._date = end.clone();
        }
        else {
            this._date = defaultDate.clone();
        }
        this.emitter = new BehaviorSubject(this._date.clone());
    }

    public getMagnitudeLabel(magnitude: number, cap: boolean) {
        let magData = this.magnitudes[magnitude];
        let unitLabel = magData.unit;
        if(cap) {
            unitLabel = unitLabel.charAt(0).toUpperCase + unitLabel.slice(1);
        }
        let label = `${magData.interval} ${magData.unit}`;
        if(magData.interval > 1) {
            label += "s";
        }
        return label;
    }

    private validate(): void {
        if(this._date.isBefore(this._start)) {
            this._date = this._start.clone();
        }
        else if(this._date.isAfter(this._end)) {
            this._date = this._end.clone();
        }
    }

    public atStart(): boolean {
        return this._date.isSame(this._start);
    }

    public atEnd(): boolean {
        return this._date.isSame(this._end);
    }

    protected updated(): void {
        this.validate();
        this.emitter.next(this._date.clone());
    }

    protected emit() {
        this.emitter.next(this._date.clone());
    }

    get date(): Observable<Moment> {
        return this.emitter.asObservable();
    }

    set date(date: Moment) {
        this._date = date.clone();
        this.updated();
    }

    public move(magnitude: number, count: number) {
        let magData = this.magnitudes[magnitude];
        this._date.add(<number>magData.interval * <number>count, magData.unit);
        this.updated();
    }

    public start() {
        this._date = this._start.clone();
        this.emit();
    }

    public end() {
        this._date = this._end.clone();
        this.emit();
    }

    public next() {
        this.move(0, 1);
    }

    public previous() {
        this.move(0, -1);
    }

    public getChunks(maxSize: number): [string, string][] {
        let chunks = [];
        let date = this._start.clone();
        while(date.isSameOrBefore(this._end)) {
            let start_s: string = date.toISOString();
            date.add(maxSize * this.magnitudes[0].interval, this.magnitudes[0].unit);
            let end_s: string = date.toISOString();
            chunks.push([start_s, end_s]);
        }
        return chunks;
    }
    
    get numMagnitudes() {
        return this.magnitudes.length;
    }
}

export class DailyHandle extends TimeseriesHandler {
    constructor(start: Moment, end: Moment, defaultDate?: Moment) {
        super(start, end, [{
            interval: 1,
            unit: "day"
        }, {
            interval: 1,
            unit: "month"
        }, {
            interval: 1,
            unit: "year"
        }], defaultDate);
    }
}

export class MonthlyHandle extends TimeseriesHandler {
    constructor(start: Moment, end: Moment, defaultDate?: Moment) {
        super(start, end, [{
            interval: 1,
            unit: "month"
        }, {
            interval: 1,
            unit: "year"
        }], defaultDate);
    }
}

export class NDVIHandle extends TimeseriesHandler {
    constructor(start: Moment, end: Moment, defaultDate?: Moment) {
        super(start, end, [{
            interval: 16,
            unit: "day"
        }, {
            interval: 1,
            unit: "year"
        }], defaultDate);
    }
}




addInterval(time: Moment, n: number = 1, lock: boolean = true): Moment {
    let result = this.roundToInterval(time);
    //if going forward, relatively simple, reset to beginning of year if going over year boundary
    if(n > 0) {
      for(let i = 0; i < n; i++) {
        let year = result.year();
        result.add(this.interval, this.unit);
        if(year != result.year()) {
          result.startOf("year");
        }
      }
    }
    //if going backwards need to get last date from previous year, just use rounding hack since this is exclusively for ndvi
    else {
      for(let i = 0; i > n; i--) {
        let year = result.year();
        result.subtract(this.interval, this.unit);
        let newYear = result.year()
        if(year != newYear) {
          //should always end on 12/19 or 12/18 if leap year, so as a quick hack just go to 12/19 and round
          result = this.roundToInterval(moment(`${newYear}-12-19`));
        }
      }
    }
    if(lock) {
      result = this.lockToRange(result);
    }
    return result;
  }

  roundToInterval(time: Moment) {
    //start from beginning of year
    let base = time.clone().startOf("year");
    let timeClone = time.clone();
    let intervalDiff = timeClone.diff(base, this.unit) / this.interval;
    let roundedDiff = Math.round(intervalDiff) * this.interval;
    base.add(roundedDiff, this.unit);
    base = this.lockToRange(base);
    return base;
  }