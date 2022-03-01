
import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ExportAddItemComponent } from 'src/app/dialogs/export-add-item/export-add-item.component';
import { ExportManagerService } from 'src/app/services/export/export-manager.service';
import { ErrorPopupService } from 'src/app/services/errorHandling/error-popup.service';
import { Observable } from 'rxjs';
import { DateManagerService } from 'src/app/services/dateManager/date-manager.service';
import { ExportData, ResourceReq } from 'src/app/models/exportData';


@Component({
  selector: 'app-export-interface',
  templateUrl: './export-interface.component.html',
  styleUrls: ['./export-interface.component.scss']
})
export class ExportInterfaceComponent implements OnInit {

  exportActivityMonitor = {
    active: false,
    mode: "query",
    value: 0
  };

  emailData: {
    useEmailControl: FormControl,
    emailInputControl: FormControl,
    maxSizeExceeded: boolean
  };

  exportItems: any[] = [];

  constructor(public dialog: MatDialog, private exportManager: ExportManagerService, private errorService: ErrorPopupService, private dateService: DateManagerService) {
    this.emailData = {
      useEmailControl: new FormControl(false),
      emailInputControl: new FormControl(),
      maxSizeExceeded: false
    }
    this.emailData.emailInputControl.setValidators(Validators.email);
    // this.emailData.useEmailControl.valueChanges.subscribe((value: boolean) => {
    //   let emailControl = this.emailData.emailInputControl;
    //   if(!value) {
    //     emailControl.setValidators(Validators.email);
    //   }
    // });
  }

  ngOnInit() {

  }

  checkEmailReq() {
    let numFiles: number = this.exportItems.reduce((acc: number, item: any) => {
      let numDateFiles = item.data.range[1].diff(item.data.range[0], item.data.period) + 1;
      let numExtentFiles: number = (<string[][]>Object.values(item.data.files)).reduce((acc: number, extents: string[]) => {
        return acc + extents.length;
      }, 0);
      let numItemFiles = numDateFiles * numExtentFiles;
      return acc + numItemFiles;
    }, 0);
    console.log(numFiles);
    this.emailData.maxSizeExceeded = numFiles > 150;
    if(this.emailData.maxSizeExceeded) {
      this.emailData.useEmailControl.setValue(true);
    }
  }


  removeExportItem(i: number) {
    this.exportItems.splice(i, 1);
    this.checkEmailReq();
  }


  addExportData(i: number) {
    let initData: any = i < 0 ? null : this.exportItems[i].data;
    console.log("initdata", initData);

    //panelClass applies global class to form (styles.scss)
    const dialogRef = this.dialog.open(ExportAddItemComponent, {
      width: "80%",
      height: "90%",
      panelClass: "export-dialog",
      data: initData
    });

    dialogRef.afterClosed().subscribe((data: any) => {
      console.log("data", data);
      if(data) {
        if(i < 0) {
          this.exportItems.push(data);
        }
        else {
          this.exportItems.splice(i, 1, data);
        }
        this.checkEmailReq();
      }

    });
  }



  export() {
    let reqs: ResourceReq[] = this.exportItems.reduce((acc: ResourceReq[], item: ExportData) => {
      let sub = item.getResourceReqs();
      return acc.concat(sub);
    }, []);
    if(this.emailData.useEmailControl.value) {
      this.exportActivityMonitor.mode = "indeterminate"
      this.exportActivityMonitor.active = true;
      let email = this.emailData.emailInputControl.value
      this.exportManager.submitEmailPackageReq(reqs, email).then(() => {
        let message = `A download request has been generated. You should receive an email at ${email} with your download package shortly. If you do not receive an email within 4 hours, please ensure the email address you entered is spelled correctly and try again or contact the site administrators.`;
        this.errorService.notify("info", message);
        this.exportActivityMonitor.active = false;
      })
      .catch((e) => {
        this.errorService.notify("error", "An error occured while requesting the download package.");
        this.exportActivityMonitor.active = false;
      });
    }
    else {
      this.exportActivityMonitor.mode = "query"
      this.exportActivityMonitor.active = true;
      this.exportManager.submitInstantDownloadReq(reqs).then((progress: Observable<number>) => {
        this.exportActivityMonitor.mode = "determinate";
        this.exportActivityMonitor.value = 0;
        progress.subscribe((percent: number) => {
          //console.log(percent);
          this.exportActivityMonitor.value = percent;
        }, (e: any) => {
          this.errorService.notify("error", "An error occured while retreiving the download package.");
          //does complete still trigger on error?
          this.exportActivityMonitor.active = false;
        }, () => {
          //if this triggers on error need to set flag or something
          let message = `Your download package has been generated. Check your browser for the downloaded file.`;
          this.errorService.notify("info", message);
          this.exportActivityMonitor.active = false;
        });

      })
      .catch((e) => {
        this.errorService.notify("error", "An error occured while generating the download package.");
        this.exportActivityMonitor.active = false;
      });
    }
  }
}

