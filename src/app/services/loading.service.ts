import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new Subject<boolean>();
  public loading$ = this.loadingSubject.asObservable();

  constructor() {}

  sendLoadingState(loading: boolean) {
    this.loadingSubject.next(loading);
  }
}
