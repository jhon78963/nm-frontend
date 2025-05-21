import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from './custom-form-components/input-text/input-text.component';
import { InputSelectComponent } from './custom-form-components/input-select/input-select.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableStaticComponent } from './custom-form-components/table-static/table-static.component';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextareaComponent } from './custom-form-components/input-textarea/input-textarea.component';
import { InputRadioComponent } from './custom-form-components/input-radio/input-radio.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { InputCheckboxComponent } from './custom-form-components/input-checkbox/input-checkbox.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputNumberComponent } from './custom-form-components/input-number/input-number.component';
import { InputDateComponent } from './custom-form-components/input-date/input-date.component';
import { CalendarModule } from 'primeng/calendar';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputMultiSelectComponent } from './custom-form-components/input-multi-select/input-multi-select.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { InputMoneyComponent } from './custom-form-components/input-money/input-money.component';
import { InputPhoneComponent } from './custom-form-components/input-phone/input-phone.component';
import { InputAutocompleteComponent } from './custom-form-components/input-autocomplete/input-autocomplete.component';
import { TablePaginationComponent } from './custom-form-components/table-pagination/table-pagination.component';
import { PaginatorModule } from 'primeng/paginator';
import { FileUploadModule } from 'primeng/fileupload';
import { UploadExcelComponent } from './custom-form-components/upload-excel/upload-excel.component';
import { TabViewComponent } from './custom-form-components/tab-view/tab-view.component';
import { InputAutocompleteApiComponent } from './custom-form-components/input-autocomplete-api/input-autocomplete-api.component';
import { InputChipsApiComponent } from './custom-form-components/input-chips-api/input-chips-api.component';
import { InputColorPickerComponent } from './custom-form-components/input-color-picker/input-color-picker.component';
import { InputImageComponent } from './custom-form-components/input-image/input-image.component';

const PRIMENG_MODULES = [
  InputTextModule,
  DropdownModule,
  TableModule,
  ButtonModule,
  ProgressBarModule,
  InputTextareaModule,
  RadioButtonModule,
  CheckboxModule,
  InputNumberModule,
  CalendarModule,
  MultiSelectModule,
  AutoCompleteModule,
  PaginatorModule,
  FileUploadModule,
];

const STANDALONES_COMPONENTS = [
  InputAutocompleteComponent,
  InputCheckboxComponent,
  InputDateComponent,
  InputMoneyComponent,
  InputMultiSelectComponent,
  InputNumberComponent,
  InputPhoneComponent,
  InputRadioComponent,
  InputSelectComponent,
  InputTextComponent,
  InputTextareaComponent,
  TableStaticComponent,
  TablePaginationComponent,
  UploadExcelComponent,
  TabViewComponent,
  InputAutocompleteApiComponent,
  InputChipsApiComponent,
  InputColorPickerComponent,
  InputImageComponent,
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ...PRIMENG_MODULES,
    ...STANDALONES_COMPONENTS,
  ],
  exports: [...PRIMENG_MODULES, ...STANDALONES_COMPONENTS],
})
export class SharedModule {}
