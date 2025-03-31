import { Component, Input, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ApiService } from '../../../services/api.service';
import { AutocompleteResponse } from '../../models/autocomplete.interface';
import { ConfirmationService, MessageService } from 'primeng/api';
import { showError, showSuccess } from '../../../utils/notifications';

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
  providers: [ConfirmationService, MessageService],
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
  @Input() collectionToSave: string | null = null;
  @Input() bodyColumn: string = '';
  itemSelected = output<AutocompleteResponse>();
  private keyToAddString = '+ ';
  collection: any[] = [];
  firstTimeLoaded = false;

  formGroup: FormGroup = new FormGroup({
    size: new FormControl(),
  });

  constructor(
    private readonly apiService: ApiService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
  ) {}

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
                  this.addNewItem({
                    id: 0,
                    value: `${value.toUpperCase()}`,
                  });
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

  addNewItem(item: AutocompleteResponse) {
    this.confirmationService.confirm({
      message: '¿Deseas crearlo?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'none',
      rejectIcon: 'none',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        const formatterItem = {
          id: item.id,
          [this.bodyColumn]: item.value,
        };
        this.apiService
          .post(`${this.collectionToSave}`, formatterItem)
          .subscribe({
            next: () => {
              showSuccess(this.messageService, 'Talla registrada!');
            },
            error: () => {
              showError(
                this.messageService,
                'Ocurrió un error, intente nuevamente',
              );
            },
          });
      },
      reject: () => {
        this.collection = [];
        this.firstTimeLoaded = false;
      },
    });
  }

  getSelecteditem(item: AutocompleteResponse) {
    this.formGroup
      .get('size')
      ?.setValue(item.value.replace(this.keyToAddString, '').toUpperCase());
    this.itemSelected.emit(item);
    this.collection = [];
  }
}
