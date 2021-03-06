import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { Dataset } from 'src/app/models/Dataset';
import { VisDateSelectService } from 'src/app/services/controlHelpers/vis-date-select.service';
import { EventParamRegistrarService } from 'src/app/services/inputManager/event-param-registrar.service';
import { DateChangeInfo } from '../controls/date-focus/date-focus.component';

@Component({
  selector: 'app-view-container',
  templateUrl: './view-container.component.html',
  styleUrls: ['./view-container.component.scss'],
  animations: [trigger("selectColor", [
    state("selected", style({
      backgroundColor: "#175db6",
      color: "white"
  })),
    state("deselected", style({})),
    transition("selected <=> deselected", [
      animate("0.4s")
    ])
  ])]
})
export class ViewContainerComponent implements OnInit {

  @ViewChild("viewContainer") viewContainer: ElementRef;
  @ViewChild("formComponent") formComponent: ElementRef;
  @ViewChild("tableComponent") tableComponent: ElementRef;
  @ViewChild("timeseriesComponent") timeseriesComponent: ElementRef;
  @ViewChild("viewNav") viewNav: ElementRef;

  @ViewChild("dateControlComponent") dateControlComponent: ElementRef;

  //set scrollbar width the first time becomes visible
  // scrollbarSet: boolean = false;
  scrollBarWidth: number = -1;
  //just set scrollbar width once for efficiency, on macs it's fine to have the scrollbar visible while sscrolling
  //also it seems like getting the scrollbar width on a mac might not work even while scrolling
  @Input() set visible(state: boolean) {
    if(state && this.scrollBarWidth < 0) {
      let element: HTMLElement = this.viewContainer.nativeElement;
      let scrollbarWidth = element.offsetWidth - element.clientWidth;
      element.style.paddingRight = scrollbarWidth + "px";
      this.scrollBarWidth = scrollbarWidth;
    }
  }
  _width: number;
  @Input() set width(width: number) {
    //instead of using width just use the width of the view container
    let viewNavEl: HTMLElement = this.viewContainer.nativeElement;
    let navWidth = viewNavEl.clientWidth;
    //subtract 40, 20 padding on each side
    this._width = navWidth - 40;
  }

  nav2Component: {
    form: ElementRef,
    table: ElementRef,
    timeseries: ElementRef
  };
  scrollTimeoutHandle: NodeJS.Timer;
  lastScrollPos: number;
  scrollTimeout: number = 100;
  navInfo: NavData[];
  activeTileRef: NavData;

  scrollbarWidthThrottle: NodeJS.Timer;
  scrollbarWidthPause: boolean = false;

  dataset: Dataset;

  upperBuffer: string;

  firstElement: HTMLElement;
  

  constructor(private paramRegistrar: EventParamRegistrarService, private dateSelector: VisDateSelectService) {
    this.scrollTimeoutHandle = null;
    this.paramRegistrar.createParameterHook(EventParamRegistrarService.GLOBAL_HANDLE_TAGS.dataset, (dataset: Dataset) => {
      this.dataset = dataset;
    });

  }

  ngOnInit() {
    this.nav2Component = {
      form: this.formComponent,
      table: this.tableComponent,
      timeseries: this.timeseriesComponent
    };
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    this.lastScrollPos = containerElement.scrollTop;
    this.navInfo = [{
      label: "Dataset",
      element: this.formComponent.nativeElement
    },
    {
      label: "Stations",
      element: this.tableComponent.nativeElement
    },
    {
      label: "Time Series",
      element: this.timeseriesComponent.nativeElement
    }];
    this.activeTileRef = this.navInfo[0];

    // setTimeout(() => {
    //   let dateControlElement: HTMLElement = this.dateControlComponent.nativeElement;
    //   this.upperBuffer = dateControlElement.offsetHeight + "px";
    //   console.log(this.upperBuffer);
    // }, 1000);
    
    this.firstElement = this.formComponent.nativeElement;
    

  }

  //resizing the window can scroll the container div causing it to trigger on another element, so fix that

  @HostListener("window:resize", ["$event"])
  fixResizeScroll() {
    this.goToNav(this.activeTileRef);
  }


  // getScrollBarWidth(element: HTMLElement): string {
  //   let scrollbarWidth: string;
  //   //weird workaround for ExpressionChangedAfterItHasBeenCheckedError in dev (also potentially good for performance in prod for changing scrollbars)
  //   if(this.scrollbarWidthPause) {
  //     scrollbarWidth = this.scrollbarWidth;
  //   }
  //   else {
  //     this.scrollbarWidthPause = true;
  //     let throttle = 10;
  //     setTimeout(() => {
  //       this.scrollbarWidthPause = false;
  //     }, throttle);
  //     scrollbarWidth = element.offsetWidth - element.clientWidth + "px";
  //     this.scrollbarWidth = scrollbarWidth;
  //   }
  //   return scrollbarWidth;
  // }

  //note removed debounce because weird offsets make it difficult to debounce where not actually scrolling, should be fine without debounce given offset to prevent boundary issues
  goToNav(nav: NavData) {
    let component = nav.element;
    let containerElement: HTMLElement = this.viewContainer.nativeElement;

    let top: number = 0;
    if(component != this.firstElement) {
      let elTop = component.offsetTop;
      //top padding - 95 (date control) - 20 (padding)
      top = elTop + 125;
    }

    containerElement.scroll({
      //add one to top to avoid weird partial pixel errors in chrome for some displays
      top: top,
      left: 0,
      behavior: "smooth"
    });

    //set active nav ref
    this.activeTileRef = nav;
  }

  // [ngStyle]="{'padding-right': getScrollBarWidth(viewContainer)}"
  containerScroll(e: Event): void {
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    let lastScrollLocal = this.lastScrollPos;
    this.lastScrollPos = containerElement.scrollTop;
    clearTimeout(this.scrollTimeoutHandle);
    this.scrollTimeoutHandle = setTimeout(() => {
      let scrollDelta = this.lastScrollPos - lastScrollLocal;
      let inContainer = this.divsInContainer();
      if(inContainer.between) {
        let scrollDir = "upper";
        if(scrollDelta > 0) {
          scrollDir = "lower";
        }
        this.goToNav(inContainer.between[scrollDir]);
      }
      //set active tile to item in container if completely contained (otherwise handled by goToNav)
      else {
        this.activeTileRef = inContainer.focus;
      }

    }, this.scrollTimeout);
  }

  //check if view container between component divs
  divsInContainer(): InContainer {
    let inContainer: InContainer = {
      focus: this.navInfo[this.navInfo.length - 1]
    };
    let containerElement: HTMLElement = this.viewContainer.nativeElement;
    let containerUpper = containerElement.scrollTop;
    //client height, only stuff in view (excludes scrollbar etc)
    let containerLower = containerUpper + containerElement.clientHeight;
    let upper = 0;
    //length -1 because don't have to do last element (has to be inside last element if none in others)
    for(let i = 0; i < this.navInfo.length - 1; i++) {
      let data = this.navInfo[i];
      let element = data.element;
      //offsetHeight includes everything
      let height = element.offsetHeight;
      let lower = upper + height;
      //if container upper bound is above element lower bound then there's some overlap (top bound handled in previous iters)
      if(containerUpper < lower) {
        //if lower bound of container is in element lower bound then container is within element
        if(containerLower <= lower) {
          inContainer = {
            focus: data
          };
          break;
        }
        //otherwise stradles boundary
        else {
          inContainer = {
            between: {
              upper: data,
              lower: this.navInfo[i + 1]
            }
          }
          break;
        }
      }
      //otherwise no overlap, keep going
      //set top of next div
      upper = lower;
    }
    return inContainer;
  }


  setDate(changeInfo: DateChangeInfo) {
    //console.log(changeInfo.date.format("YYYY MM"));
    this.dateSelector.setDate(changeInfo.date, changeInfo.magnitude);
  }

  getDateControlWidth(): string {
    let components = [this.viewContainer, this.formComponent, this.tableComponent, this.timeseriesComponent];
    let max = 0;
    for(let component of components) {
      let element: HTMLElement = component.nativeElement;
      let width = element.clientWidth;
      if(width > max) {
        max = width;
      }
    }
    return max + "px";
  }

}

interface InContainer {
  between?: {
    upper: NavData,
    lower: NavData
  }
  focus?: NavData
}

interface NavData {
  label: string,
  element: HTMLElement,
}
