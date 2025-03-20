import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProgressSpinnerService {
  private loadingSubject = new Subject<boolean>();
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  show() {
    this.loadingSubject.next(true);
  }
  hidden() {
    this.loadingSubject.next(false);
  }
}
