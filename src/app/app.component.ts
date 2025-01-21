import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TwitterComponent } from './twitter/twitter.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('container', { static: true }) container!: ElementRef;
  title = 'upgraded-pancake';
  loading = false;
clear = false;
  twitterLink = 'https://twitter.com/PritishBhatnag1?ref_src=twsrc%5Etfw';
constructor(public dialog: MatDialog,private renderer: Renderer2){
 

}

updateTwitterLink(handle: string) {
// this.clear = true;
// this.twitterLink = `https://twitter.com/${handle}?ref_src=twsrc%5Etfw`;
// console.log(this.twitterLink);
const dialogRef = this.dialog.open(TwitterComponent,{
  data: {name: handle},
  height: '100%',
  width: '100%',
});

}

openDialog() {
  
  
}
  async ngAfterViewInit() {
  this.loading = true;
  this.twitterLink = `https://twitter.com/narendramodi?ref_src=twsrc%5Etfw`;
  const script = this.renderer.createElement('script');
  script.src = 'https://platform.twitter.com/widgets.js';
  script.charset = 'utf-8';
  script.async = true;
this.renderer.appendChild(document.body, script);
this.loading = false;
  
}
}
