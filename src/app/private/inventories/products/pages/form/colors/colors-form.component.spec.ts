import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorsFormComponent } from './colors-form.component';

describe('ColorsFormComponent', () => {
  let component: ColorsFormComponent;
  let fixture: ComponentFixture<ColorsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorsFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ColorsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
