import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.scss']
})
export class InfoPopupComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<InfoPopupComponent>,
  @Inject(MAT_DIALOG_DATA) public data: string) { }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close();
  }

}
