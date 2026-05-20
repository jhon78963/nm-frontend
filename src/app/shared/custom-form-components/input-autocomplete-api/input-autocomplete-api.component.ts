import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ApiService } from '../../../services/api.service';
import {
  AutocompleteResponse,
  AutocompleteSaveResponse,
} from '../../models/autocomplete.interface';
import { ConfirmationService, MessageService } from 'primeng/api';
import { showError, showSuccess } from '../../../utils/notifications';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-input-autocomplete-api',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    OverlayPanelModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './input-autocomplete-api.component.html',
  styleUrl: './input-autocomplete-api.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class InputAutocompleteApiComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiService = inject(ApiService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  @Input() placeholder: string | null = null;
  @Input() label: string | null = null;
  @Input() for: string | null = null;
  @Input() type: string | null = null;
  @Input() id: string | null = null;
  @Input() readonly: boolean = false;
  @Input() collectionToCall: string | null = null;
  @Input() queryParam: string | null = null;
  @Input() collectionToSave: string | null = null;
  @Input() collectionToEdit: AutocompleteResponse | string | null = null;
  @Input() bodyColumn: string = '';
  @Input() multipleOptions: boolean = false;
  itemSelected = output<AutocompleteResponse>();
  private keyToAddString = '+ ';
  collection: AutocompleteResponse[] = [];

  formGroup: FormGroup = new FormGroup({
    size: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    if (this.collectionToEdit) {
      this.formGroup
        .get('size')
        ?.setValue(
          typeof this.collectionToEdit === 'string'
            ? this.collectionToEdit
            : this.collectionToEdit.value,
          { emitEvent: false },
        );
    }

    const sizeControl = this.formGroup.get('size');
    if (!sizeControl || !this.collectionToCall || !this.queryParam) {
      return;
    }

    sizeControl.valueChanges
      .pipe(
        map((value: string | null) => (value ?? '').trim()),
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((term: string) => {
          this.collection = [];
          if (!term) {
            return EMPTY;
          }
          const path = `${this.collectionToCall}?${this.queryParam}=${encodeURIComponent(term)}`;
          return this.apiService.get<AutocompleteResponse[]>(path).pipe(
            tap((res: AutocompleteResponse[]) => {
              if (res.length > 0) {
                this.collection = res;
              } else {
                this.collection = [
                  {
                    id: 0,
                    value: `${this.keyToAddString}${term}`,
                  },
                ];
              }
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: () => {
          this.collection = [];
        },
      });
  }

  clearFilter() {
    this.formGroup.get('size')?.setValue(null);
    this.collection = [];
  }

  addNewItem(item: AutocompleteResponse) {
    this.confirmationService.confirm({
      message: '¿Deseas crearlo?',
      header: 'Confirmación',
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
          .post<AutocompleteSaveResponse>(
            `${this.collectionToSave}`,
            formatterItem,
          )
          .subscribe({
            next: (newItem: AutocompleteSaveResponse) => {
              this.itemSelected.emit(newItem.item);
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
        this.formGroup.get('size')?.setValue('');
      },
    });
  }

  getSelecteditem(item: AutocompleteResponse) {
    const formattedItem = {
      id: item.id,
      value: item.value.replace(this.keyToAddString, '').toUpperCase(),
    };
    this.formGroup
      .get('size')
      ?.setValue(formattedItem.value, { emitEvent: false });
    if (item.id > 0) {
      this.itemSelected.emit(formattedItem);
    } else {
      this.addNewItem(formattedItem);
    }
    this.collection = [];
  }
}
