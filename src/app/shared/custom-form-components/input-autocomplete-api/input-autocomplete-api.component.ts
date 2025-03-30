import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { map } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { showSuccess } from '../../../utils/notifications';

@Component({
  selector: 'app-input-autocomplete-api',
  templateUrl: './input-autocomplete-api.component.html',
  styleUrl: './input-autocomplete-api.component.scss',
  standalone: true,
  imports: [
    AutoCompleteModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class InputAutocompleteApiComponent implements OnInit {
  @Input() collectionToCall: string = '';
  @Input() decodeUrl?: string;
  @Input() placeholder: string = 'placeholder';
  @Input() label: string = 'Autocomplete';
  @Input() formGroup?: FormGroup<any>;
  @Input() controlName: string = 'autocomplete';
  @Input() showClear: boolean = true;
  @Input() readonly: boolean = false;
  @Input() decodeValueField: string = '';
  @Input() decodeLabelField: string = '';
  @Input() isEnum?: boolean = false;
  @Input() enumGroup?: string;
  private keyToAddString = '+ ';
  @Output() selectChange: EventEmitter<any> = new EventEmitter<any>();
  loading: boolean = false;
  manyTimes = 3;

  filteredValue: any[] = [];
  formControl: FormControl = new FormControl();
  submitted!: boolean;
  firstTimeLoaded = false;
  constructor(
    private formGroupDirective: FormGroupDirective,
    private readonly apiService: ApiService,
    private readonly confirmationService: ConfirmationService,
    private readonly messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.formGroupDirective.ngSubmit.subscribe({
      next: (value: any) => {
        this.submitted = value.isTrusted;
      },
    });
    this.formGroup = this.formGroupDirective.form;
    this.formGroup
      ?.get(this.controlName)
      ?.valueChanges.subscribe(controlValue => {
        if (controlValue && !this.firstTimeLoaded) {
          this.firstTimeLoaded = true;
          if (!this.decodeLabelField || !this.decodeValueField) {
            console.error(
              'DEFINIRE I VALORI -> [decodeLabelField] [decodeValueField] ',
            );
            return;
          }
          this.loading = true;
          const key = controlValue.id || controlValue;
          this.apiService.get(`${this.decodeUrl}/${key}`).subscribe({
            next: (data: any) => {
              this.formControl.patchValue({
                id: this.decodeByField(data, this.decodeValueField),
                description: this.decodeByField(data, this.decodeLabelField),
              });
              this.formGroup
                ?.get(this.controlName)
                ?.setValue(this.decodeByField(data, this.decodeValueField));
              this.loading = false;
            },
          });
        }
      });
  }

  decodeByField(data: any, field: string): string {
    if (!field.includes('.')) {
      return data[field];
    }
    const newField = field.split('.');
    return this.decodeByField(data[newField[0]], newField?.slice(1).join('.'));
  }

  filterMethod(event: any) {
    if (event.query) {
      console.log(event.query);
      this.apiService
        .get(`${this.collectionToCall}?search=${event.query}`)
        .pipe(
          map((res: any) => {
            const result: any[] = [];

            const responseResult = res.filter((option: any) =>
              option.description
                .toLowerCase()
                .includes(event.query.toLowerCase()),
            );

            if (responseResult && responseResult.length) {
              responseResult.map((res: any) => {
                console.log(res);
                result.push({
                  id: res.id,
                  description: res.description,
                });
              });
            } else if (this.isEnum) {
              const x = {
                id: '9999_TO_INSERT',
                description: `${this.keyToAddString}${event.query}`,
              };
              result.push(x);
            }
            this.filteredValue = result;
          }),
        )
        .subscribe();
    }
  }
  onSelect(event: any) {
    if (event.value != null && event.value.id == '9999_TO_INSERT') {
      this.confirmMessage(event.value, 'Deseas crearlo?');
    } else {
      const selectedValue = event.value;
      this.formControl.setValue(selectedValue);
      this.formGroup?.get(this.controlName)?.setValue(selectedValue.id);
      this.selectChange.emit(selectedValue.id);
    }
  }

  confirmMessage(event: any, message: string) {
    this.confirmationService.confirm({
      message: message,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'none',
      rejectIcon: 'none',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        const valueCleaned = event.description.replace(this.keyToAddString, '');
        const value = valueCleaned.toUpperCase();
        console.log(value);
        showSuccess(this.messageService, 'Talla registrada!');
      },
      reject: () => {
        this.formControl.reset();
        this.messageService.add({
          severity: 'error',
          summary: 'Rejected',
          detail: 'You have rejected',
          life: 3000,
        });
      },
    });
  }

  onClear() {
    const selectedValue = '';
    this.formControl.setValue(selectedValue);
    this.formGroup?.get(this.controlName)?.setValue(null);
    this.selectChange.emit(null);
  }
}
