import { Moment } from "moment";
import { BehaviorSubject, Observable } from "rxjs";

abstract class TimeseriesHandler {
    protected _start: Moment;
    protected _end: Moment;
    protected _date: Moment;
    protected _controlData: ControlSet;
    private emitter: BehaviorSubject<Moment>;

    constructor(start: Moment, end: Moment, defaultDate?: Moment) {
        this._start = start;
        this._end = end;
        if(defaultDate === undefined) {
            this._date = end.clone();
        }
        else {
            this._date = defaultDate.clone();
        }
        this.emitter = new BehaviorSubject(this._date.clone());

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

    private validate(): void {
        if(this._date.isBefore(this._start)) {
            this._date = this._start.clone();
        }
        else if(this._date.isAfter(this._end)) {
            this._date = this._end.clone();
        }
    }

    private lockControls(): void {
        if(this._date.isSameOrBefore(this._start)) {
            this._controlData.back.disabled = true;
        }
        else if(this._date.isSameOrAfter(this._end)) {
            this._controlData.forward.disabled = true;
        }
    }

    protected updated(): void {
        this.validate();
        this.lockControls();
        this.emitter.next(this._date.clone());
    }

    protected emit() {
        this.emitter.next(this._date.clone());
    }

    get date(): Observable<Moment> {
        return this.emitter.asObservable();
    }

    setDate(date: Moment): void {
        this._date = date.clone();
        this.emit();
    }

    abstract get dateStepHandlers(): (() => void)[];

    abstract previous(): void;

    start(): void {
        this._date = this._start.clone();
        this.emit();
    }

    end(): void {
        this._date = this._end.clone();
        this.emit();
    }
    
}



interface ControlSet {
    forward: DirectionGroup,
    back: DirectionGroup
}

interface DirectionGroup {
    disabled: boolean,
    controlData: ControlData[]
}

interface ControlData {
    tooltip: string,
    icon: string,
    trigger: () => void
}