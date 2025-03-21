import { Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
} from 'primeng/autocomplete';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-input-autocomplete',
  templateUrl: './input-autocomplete.component.html',
  styleUrl: './input-autocomplete.component.scss',
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
export class InputAutocompleteComponent implements OnInit {
  @Input() placeholder: string = 'placeholder';
  @Input() label: string = 'Autocomplete';
  @Input() values: any = [];

  @Input() field: string = '';
  @Input() formGroup?: FormGroup<any>;
  @Input() controlName: string = 'autocomplete';
  filteredValue: any[] = [];
  formControl!: FormControl;
  submitted!: boolean;
  value: any[] = [];

  constructor(
    private formGroupDirective: FormGroupDirective,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  get dataKeys(): any[] {
    return Object.entries(this.values).map((permission: any) => ({
      key: permission[0],
      value: permission[1],
    }));
  }

  ngOnInit(): void {
    this.formGroupDirective.ngSubmit.subscribe({
      next: (value: any) => {
        this.submitted = value.isTrusted;
      },
    });
    this.formGroup = this.formGroupDirective.form;
    this.formControl =
      (this.formGroup.get(this.controlName) as FormControl) ??
      new FormControl();
  }

  filterData(event: AutoCompleteCompleteEvent) {
    const filtered: any[] = [];
    const query = event.query;
    for (let i = 0; i < this.dataKeys.length; i++) {
      const data = this.dataKeys[i].value;
      if (data.name.toLowerCase().indexOf(query.toLowerCase()) === 0) {
        filtered.push(data.name);
      }
    }
    if (event.query && !filtered.length) {
      const x = {
        key: '9999_TO_INSERT',
        value: `${event.query}`,
      };
      filtered.push(x.value);
    }
    this.filteredValue = filtered;
  }
}
