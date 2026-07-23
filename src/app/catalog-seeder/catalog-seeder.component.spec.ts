import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogSeederComponent } from './catalog-seeder.component';

describe('CatalogSeederComponent', () => {
  let component: CatalogSeederComponent;
  let fixture: ComponentFixture<CatalogSeederComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogSeederComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CatalogSeederComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
