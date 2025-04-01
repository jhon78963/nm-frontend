import { Component, Input, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ApiService } from '../../../services/api.service';
import {
  AutocompleteResponse,
  AutocompleteSaveResponse,
} from '../../models/autocomplete.interface';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { showError, showSuccess } from '../../../utils/notifications';

@Component({
  selector: 'app-input-chips-api',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    OverlayPanelModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './input-chips-api.component.html',
  styleUrl: './input-chips-api.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class InputChipsApiComponent implements OnInit {
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
  @Input() multipleOptions: boolean = false;
  itemSelected = output<AutocompleteResponse[]>();
  private keyToAddString = '+ ';
  collection: any[] = [];
  collectionSelected: any[] = [];

  formGroup: FormGroup = new FormGroup({
    color: new FormControl(),
  });

  constructor(
    private readonly apiService: ApiService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.formGroup
      .get('color')
      ?.valueChanges.pipe(debounceTime(200))
      .subscribe((value: string | null) => {
        this.collection = [];
        if (value) {
          this.apiService
            .get<
              AutocompleteResponse[]
            >(`${this.collectionToCall}?${this.queryParam}=${value}`)
            .subscribe({
              next: (res: AutocompleteResponse[]) => {
                if (res.length > 0) {
                  this.collection.push(res);
                } else {
                  this.collection.push([
                    {
                      id: 0,
                      value: `${this.keyToAddString}${value}`,
                    },
                  ]);
                }
              },
            });
        } else {
          this.collection = [];
        }
      });
  }

  clearFilter() {
    this.formGroup.get('color')?.setValue(null);
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
              this.collectionSelected.push(newItem.item);
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
        this.formGroup.get('color')?.setValue('');
      },
    });
  }

  removeItem(item: AutocompleteResponse) {
    const index = this.collectionSelected.findIndex(
      itemInColection => itemInColection.id === item.id,
    );
    this.collectionSelected.splice(index, 1);
    this.itemSelected.emit(this.collectionSelected);
  }

  getSelecteditem(item: AutocompleteResponse) {
    const formattedItem = {
      id: item.id,
      value: item.value.replace(this.keyToAddString, '').toUpperCase(),
    };
    this.formGroup.get('color')?.setValue(null, { emitEvent: false });
    if (item.id > 0) {
      this.collectionSelected.push(formattedItem);
    } else {
      this.addNewItem(formattedItem);
    }
    this.itemSelected.emit(this.collectionSelected);
    this.collection = [];
  }
}
