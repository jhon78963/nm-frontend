import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ApiService } from '../../../services/api.service';
import { AutocompleteResponse } from '../../models/autocomplete.interface';

@Component({
  selector: 'app-input-autocomplete-v2',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    OverlayPanelModule,
  ],
  templateUrl: './input-autocomplete-v2.component.html',
  styleUrl: './input-autocomplete-v2.component.scss',
})
export class InputAutocompleteV2Component implements OnInit {
  @Input() placeholder: string | null = null;
  @Input() label: string | null = null;
  @Input() for: string | null = null;
  @Input() type: string | null = null;
  @Input() id: string | null = null;
  @Input() readonly: boolean = false;
  @Input() collectionToCall: string | null = null;
  @Input() queryParam: string | null = null;
  private keyToAddString = '+ ';
  collection: any[] = [];
  firstTimeLoaded = false;

  formGroup: FormGroup = new FormGroup({
    size: new FormControl(),
  });

  constructor(private readonly apiService: ApiService) {}

  ngOnInit(): void {
    this.formGroup
      .get('size')
      ?.valueChanges.pipe(debounceTime(600))
      .subscribe((value: string | null) => {
        this.collection = [];
        if (value && !this.firstTimeLoaded) {
          this.firstTimeLoaded = true;
          this.apiService
            .get<
              AutocompleteResponse[]
            >(`${this.collectionToCall}?${this.queryParam}=${value}`)
            .subscribe({
              next: (res: AutocompleteResponse[]) => {
                if (res.length > 0) {
                  this.collection = res;
                } else {
                  this.collection.push({
                    id: 0,
                    value: `${this.keyToAddString}${value}`,
                  });
                }
              },
            });
        } else {
          this.collection = [];
          this.firstTimeLoaded = false;
        }
      });
  }

  clearFilter() {
    this.formGroup.get('size')?.setValue(null);
    this.collection = [];
    this.firstTimeLoaded = false;
  }

  getSelecteditem(item: AutocompleteResponse) {
    this.formGroup
      .get('size')
      ?.setValue(item.value.replace(this.keyToAddString, '').toUpperCase());
    this.collection = [];
  }
}
