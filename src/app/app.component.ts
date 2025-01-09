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
constructor(public dialog: MatDialog){
 

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
ngAfterViewInit(): void {
  const twitterScript = document.querySelector('script[src*="platform.twitter.com"]');
  if (twitterScript) {
    const twttr = (window as any).twttr;
    twttr.events.bind('loaded', () => {
      this.loading = false;
    });
  }
}
}
