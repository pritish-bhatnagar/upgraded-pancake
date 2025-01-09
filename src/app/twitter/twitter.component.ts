import { AfterViewInit, Component, Inject, Input, Renderer2 } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-twitter',
  templateUrl: './twitter.component.html',
  styleUrls: ['./twitter.component.scss']
})
export class TwitterComponent implements AfterViewInit {
  twitterLink = 'https://twitter.com/PritishBhatnag1?ref_src=twsrc%5Etfw';
  private scriptElement: any;
  
  constructor(private renderer: Renderer2,@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngAfterViewInit() {
    this.twitterLink = `https://twitter.com/${this.data.name}?ref_src=twsrc%5Etfw`;
    const script = this.renderer.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.charset = 'utf-8';
    script.async = true;
    this.scriptElement = this.renderer.appendChild(document.body, script);
    
  }
  
  updateTwitterLink(handle: string) {
    
    
    
      
    
    }
}
